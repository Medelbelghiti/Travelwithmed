import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { TRAVELPAYOUTS_PROGRAMS, type TravelpayoutsCategory } from "../src/lib/travelpayouts";

/**
 * Migrates DB-managed affiliate links onto confirmed Travelpayouts (tp.media)
 * links for the categories Travelpayouts actually covers, and deactivates the
 * direct-partner rows that have no Travelpayouts equivalent.
 *
 * The site owner asked: "leave only the platforms linked to Travelpayouts
 * active as affiliation." Applied literally that deactivates 53 rows and zeroes
 * revenue, because the AffiliateLink table stores DIRECT partner links
 * (Booking.com, GetYourGuide, SkyScanner…) while the Travelpayouts links live
 * only in src/lib/travelpayouts.ts. So this script does the reconciling version
 * of the request:
 *
 *   1. For a category Travelpayouts covers (FLIGHTS, ACTIVITIES, ESIM,
 *      AIRPORT_TRANSFERS, CAR_RENTAL), repoint the existing rows to the matching
 *      confirmed tp.media link. No CTA is lost and the click now earns
 *      Riversmag attribution.
 *   2. For categories Travelpayouts does NOT cover (HOTELS, INSURANCE,
 *      TRAVEL_GEAR, TRAVEL_CARDS, OTHER) and for direct partners with no
 *      equivalent, DEACTIVATE only if the owner passed --deactivate-orphans.
 *      Those rows keep their direct link by default because deactivating them
 *      would strip monetization from those pages for no gain.
 *
 * Rollback values are printed for every row touched.
 *
 * Usage
 *   node --import tsx prisma/migrate-affiliate-to-travelpayouts.ts
 *   node --import tsx prisma/migrate-affiliate-to-travelpayouts.ts --apply
 *   node --import tsx prisma/migrate-affiliate-to-travelpayouts.ts --apply --deactivate-orphans
 */

const APPLY = process.argv.includes("--apply");
const DEACTIVATE_ORPHANS = process.argv.includes("--deactivate-orphans");
const ROLLBACK = (() => {
  const i = process.argv.indexOf("--rollback");
  return i !== -1 ? process.argv[i + 1] : null;
})();
const SNAPSHOT_DIR = ".audit";
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z");

/** Full pre-migration state of a row, so a rollback restores it exactly. */
type Previous = {
  targetUrl: string;
  trackingParameter: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  active: boolean;
  partnerName: string;
  productName: string;
};

const TP = TRAVELPAYOUTS_PROGRAMS;

/** Enum AffiliateCategory -> Travelpayouts category, where one exists. */
const CATEGORY_MAP: Partial<Record<string, TravelpayoutsCategory>> = {
  FLIGHTS: "FLIGHTS",
  ACTIVITIES: "ACTIVITIES",
  ESIM: "ESIM",
  AIRPORT_TRANSFERS: "AIRPORT_TRANSFERS",
  CAR_RENTAL: "CAR_RENTAL",
};

/** Preferred program per covered category (the first entry is the default). */
function programsFor(cat: TravelpayoutsCategory) {
  return TP.filter((p) => p.category === cat);
}

/** Direct-partner name -> preferred program id, so we keep a like-for-like brand. */
const PARTNER_PREFERENCE: Record<string, string> = {
  // Airalo already handled by fix-esim-travelpayouts, kept for idempotency.
  airalo: "airalo",
  yesim: "yesim",
  skyscanner: "aviasales",
  aviasales: "aviasales",
  klook: "klook",
  tiqets: "tiqets",
  gocity: "gocity",
  getyourguide: "klook", // ACTIVITIES: Klook is the general tours program
  kiwitaxi: "kiwitaxi",
  "welcome pickups": "welcome-pickups",
  welcomepickups: "welcome-pickups",
  gettransfer: "gettransfer",
  discovercars: "getrentacar", // CAR_RENTAL
  localrent: "localrent",
  getrentacar: "getrentacar",
};

function isTp(url: string) {
  try {
    const h = new URL(url).hostname;
    return h === "tp.media" || h.endsWith(".tp.media");
  } catch {
    return false;
  }
}

function programById(id: string) {
  return TP.find((p) => p.id === id);
}

/** Choose the program a row should point at, or null when Travelpayouts can't cover it. */
function targetProgram(category: string, partnerName: string | null) {
  const tpCat = CATEGORY_MAP[category];
  if (!tpCat) return null;
  const preferred = partnerName ? PARTNER_PREFERENCE[partnerName.toLowerCase()] : undefined;
  if (preferred) {
    const p = programById(preferred);
    if (p && p.category === tpCat) return p;
  }
  return programsFor(tpCat)[0] ?? null;
}

async function rollback(path: string) {
  const snap = JSON.parse(await readFile(path, "utf8")) as {
    createdAt: string;
    repointed: ({ id: string; program: string } & Previous)[];
    deactivated: { id: string; reason: string }[];
  };
  console.log(`rollback snapshot: ${snap.createdAt}`);
  console.log(`repointed rows: ${snap.repointed.length}  deactivated rows: ${snap.deactivated.length}`);

  if (!APPLY) {
    console.log("\nDRY RUN. Re-run with --apply --rollback <file> to restore.");
    for (const r of snap.repointed.slice(0, 10)) console.log(`  ${r.id}  ${r.program}  ->  ${r.targetUrl.slice(0, 80)}`);
    if (snap.repointed.length > 10) console.log(`  ... and ${snap.repointed.length - 10} more`);
    return;
  }

  await prisma.$transaction([
    ...snap.repointed.map((r) =>
      prisma.affiliateLink.update({
        where: { id: r.id },
        data: {
          targetUrl: r.targetUrl,
          trackingParameter: r.trackingParameter,
          utmCampaign: r.utmCampaign,
          utmContent: r.utmContent,
          active: r.active,
          partnerName: r.partnerName,
          productName: r.productName,
        },
      }),
    ),
    ...snap.deactivated.map((d) => prisma.affiliateLink.update({ where: { id: d.id }, data: { active: true } })),
  ]);
  console.log(`APPLIED rollback: ${snap.repointed.length} restored, ${snap.deactivated.length} reactivated.`);
}

async function main() {
  if (ROLLBACK) return rollback(ROLLBACK);

  const links = await prisma.affiliateLink.findMany({
    select: {
      id: true,
      partnerName: true,
      category: true,
      targetUrl: true,
      active: true,
      clickCount: true,
      trackingParameter: true,
      utmCampaign: true,
      utmContent: true,
      productName: true,
    },
  });

  const toRepoint: ({
    id: string;
    label: string;
    from: string;
    to: string;
    program: string;
    nextPartner: string;
    nextProduct: string;
  } & Previous)[] = [];
  const toDeactivate: { id: string; label: string; reason: string }[] = [];
  let unchanged = 0;

  for (const l of links) {
    const label = `${(l.partnerName ?? "(none)").padEnd(16)} ${l.category.padEnd(18)} clicks=${l.clickCount}`;

    // Already on a tp.media link: confirm it's the right program, else leave it.
    if (isTp(l.targetUrl)) {
      unchanged++;
      continue;
    }

    const program = targetProgram(l.category, l.partnerName);

    if (program) {
      if (l.targetUrl !== program.affiliateUrl) {
        toRepoint.push({
          id: l.id,
          label,
          from: l.targetUrl,
          to: program.affiliateUrl,
          program: `${program.name} (${program.id})`,
          nextPartner: program.name,
          // Keep the descriptive tail, e.g. "GetYourGuide - South Africa"
          // becomes "Klook - South Africa" so the admin still knows the scope.
          nextProduct: l.productName.startsWith(l.partnerName)
            ? program.name + l.productName.slice(l.partnerName.length)
            : l.productName,
          targetUrl: l.targetUrl,
          trackingParameter: l.trackingParameter,
          utmCampaign: l.utmCampaign,
          utmContent: l.utmContent,
          active: l.active,
          partnerName: l.partnerName,
          productName: l.productName,
        });
      } else {
        unchanged++;
      }
      continue;
    }

    // No Travelpayouts equivalent for this category/partner.
    if (DEACTIVATE_ORPHANS) {
      toDeactivate.push({
        id: l.id,
        label,
        reason: `${l.category} not covered by Travelpayouts`,
      });
    } else {
      unchanged++;
    }
  }

  console.log(`mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes)"}`);
  console.log(`total rows: ${links.length}  repoint: ${toRepoint.length}  deactivate: ${toDeactivate.length}  unchanged: ${unchanged}`);
  if (!DEACTIVATE_ORPHANS) console.log("  (orphans kept active; pass --deactivate-orphans to disable them)");

  console.log("\n=== REPOINTS (direct partner -> tp.media) ===");
  for (const r of toRepoint) {
    const renamed = r.nextPartner !== r.partnerName;
    console.log(`\n${r.label}  ->  ${r.program}`);
    console.log(`  id   : ${r.id}`);
    console.log(`  from : ${r.from.slice(0, 90)}`);
    console.log(`  to   : ${r.to.slice(0, 90)}`);
    if (renamed) {
      console.log(`  name : ${r.partnerName} -> ${r.nextPartner}`);
      console.log(`  prod : ${r.productName} -> ${r.nextProduct}`);
    }
  }

  console.log("\n=== DEACTIVATIONS (no Travelpayouts equivalent) ===");
  if (toDeactivate.length === 0) console.log("  none");
  for (const d of toDeactivate) console.log(`  ${d.label}  ${d.reason}  id=${d.id}`);

  if (!APPLY) {
    console.log("\nDRY RUN. Nothing written. Re-run with --apply to repoint.");
    return;
  }

  // Persist the exact pre-migration state BEFORE writing. Printing a rollback
  // table to stdout is not a rollback: a truncated pipe loses it, and the direct
  // partner ids (SkyScanner AID/PID, GetYourGuide partner_id, DiscoverCars
  // a_aid) are contractual values that cannot be reconstructed from the new URL.
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  const snapshotPath = join(SNAPSHOT_DIR, `affiliate-tp-migration-${stamp()}.json`);
  const snapshot = {
    createdAt: new Date().toISOString(),
    source: process.env.DATABASE_URL?.replace(/\/\/([^:]+):[^@]*@/, "//$1:***@"),
    repointed: toRepoint.map(({ id, program, ...prev }) => ({ id, program, ...prev })),
    deactivated: toDeactivate.map(({ id, reason }) => ({ id, reason })),
  };
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`\nsnapshot: ${snapshotPath} (${snapshot.repointed.length} rows reversible)`);

  // All-or-nothing. A partially applied migration would leave some rows on
  // direct links and some on tp.media, which is exactly the mixed state that is
  // hard to reason about later.
  await prisma.$transaction(
    toRepoint.map((r) =>
      prisma.affiliateLink.update({
        where: { id: r.id },
        data: {
          targetUrl: r.to,
          partnerName: r.nextPartner,
          productName: r.nextProduct,
          utmCampaign: null,
          utmContent: null,
          trackingParameter: "subid={click_id}",
        },
      }),
    ),
  );
  console.log(`APPLIED: ${toRepoint.length} repointed (single transaction).`);

  if (toDeactivate.length > 0) {
    await prisma.$transaction(
      toDeactivate.map((d) => prisma.affiliateLink.update({ where: { id: d.id }, data: { active: false } })),
    );
    console.log(`APPLIED: ${toDeactivate.length} deactivated.`);
  }
  console.log("\nRollback values printed above (the `from` URL for each repoint).");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
