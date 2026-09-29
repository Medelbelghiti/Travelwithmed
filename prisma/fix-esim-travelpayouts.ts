/**
 * Phase 8.5 — repoint eSIM affiliate links from direct Airalo referral URLs to
 * the Travelpayouts (tp.media) links that actually earn Riversmag attribution.
 *
 * WHY THIS EXISTS (audit finding 6.1 / 6.2)
 * ------------------------------------------
 * The 14 `*-esim` articles render a CTA block that resolves through
 * resolveAffiliateLink() -> AffiliateLink table. Every ESIM row in that table
 * was seeded to a DIRECT Airalo URL:
 *
 *     https://www.airalo.com/?referenceID=26591197
 *
 * That is a plain referral link with no Riversmag/Travelpayouts attribution, so
 * clicks converted but were not attributed to the site. Meanwhile
 * src/lib/travelpayouts.ts already defines the correct attributed links:
 *
 *     Yesim  campaign_id=224  marker=776824  p=5998  trs=573241
 *     Airalo campaign_id=541  marker=776824  p=8310  trs=573241
 *
 * ...but TravelpayoutsProgramGrid only renders inside destination-detail.tsx,
 * so no eSIM article or the /resources/esim hub ever used them.
 *
 * WHAT THIS SCRIPT DOES
 * ---------------------
 * 1. Reports every ESIM AffiliateLink row and where its target points today.
 * 2. Repoints ESIM rows to the tp.media URL for the same partner.
 * 3. Records a per-click subid so server-side click tracking is preserved.
 * 4. Audits every `EsimProvider.affiliateLinkId` and classifies it, so a
 *    provider is never silently left on a direct (unattributed) link.
 *
 * It is IDEMPOTENT and SAFE BY DEFAULT:
 *   - dry run unless --apply is passed
 *   - only touches rows whose host is airalo.com or yesim.tech
 *   - never deletes a row, never changes a row id
 *   - prints a full before/after table
 *
 * WHY PROVIDER REFERENCES CANNOT BREAK HERE
 * -----------------------------------------
 * Rows are updated IN PLACE (targetUrl / trackingParameter only), so every
 * `EsimProvider.affiliateLinkId` keeps pointing at a valid row. Nothing needs
 * re-linking. What can still be wrong is a provider that never pointed at an
 * ESIM row at all, or one whose row was skipped below — that is what the
 * provider audit reports, as findings for a human, not as automatic writes.
 *
 * The previous targetUrl is written to stdout so it can be restored.
 *
 * Run:  npx tsx prisma/fix-esim-travelpayouts.ts            (dry run)
 *       npx tsx prisma/fix-esim-travelpayouts.ts --apply    (writes)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TRAVELPAYOUTS_PROGRAMS } from "../src/lib/travelpayouts";

const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/**
 * Sourced from src/lib/travelpayouts.ts rather than hardcoded, so these can
 * never drift from the links the site owner committed to verbatim.
 */
const TP: Record<string, string> = Object.fromEntries(
  TRAVELPAYOUTS_PROGRAMS.filter((p) => p.category === "ESIM").map((p) => [
    p.name,
    p.affiliateUrl,
  ]),
);

if (Object.keys(TP).length === 0) {
  throw new Error("No ESIM programs found in TRAVELPAYOUTS_PROGRAMS — refusing to guess.");
}

/** Generic fallback: any ESIM row for a partner with no explicit TP link. */
const TP_FALLBACK = TP.Airalo;

function isTp(url: string) {
  return url.includes("tp.media");
}
function isDirectPartner(url: string) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h === "airalo.com" || h === "yesim.tech";
  } catch {
    return false;
  }
}

async function main() {
  const links = await prisma.affiliateLink.findMany({
    where: { category: "ESIM" },
    include: { destination: { select: { slug: true, name: true } } },
    orderBy: [{ destinationText: "asc" }, { priority: "desc" }],
  });

  console.log(`\nESIM AffiliateLink rows: ${links.length}`);
  console.log(`mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes)"}\n`);

  const header = ["partner", "destination", "clicks", "current host", "action"];
  console.log(header.map((h, i) => h.padEnd([14, 20, 7, 14, 30][i])).join(""));
  console.log("-".repeat(90));

  let changed = 0;
  let alreadyOk = 0;
  const skipped: string[] = [];
  const skippedIds = new Set<string>();
  const restore: { id: string; targetUrl: string }[] = [];

  for (const l of links) {
    const dest = l.destination ? `${l.destination.name}` : (l.destinationText ?? "(global)");
    let host = "?";
    try {
      host = new URL(l.targetUrl).hostname.replace(/^www\./, "");
    } catch {
      host = "(unparseable)";
    }

    let action: string;
    if (isTp(l.targetUrl)) {
      action = "already tp.media - skip";
      alreadyOk++;
    } else if (!isDirectPartner(l.targetUrl)) {
      action = `UNRECOGNISED host - skip`;
      skipped.push(`${l.id} (${l.partnerName}) -> ${l.targetUrl}`);
      skippedIds.add(l.id);
    } else {
      const next = TP[l.partnerName] ?? TP_FALLBACK;
      action = `-> tp.media (${TP[l.partnerName] ? l.partnerName : "Airalo fallback"})`;
      changed++;
      restore.push({ id: l.id, targetUrl: l.targetUrl });

      if (APPLY) {
        await prisma.affiliateLink.update({
          where: { id: l.id },
          data: {
            targetUrl: next,
            // Per-click subid, preserved through the /out redirect.
            trackingParameter: "subid={click_id}",
            utmCampaign: l.utmCampaign ?? "destination-esim",
          },
        });
      }
    }
    console.log(
      [l.partnerName, dest, String(l.clickCount), host, action]
        .map((c, i) => String(c).padEnd([14, 20, 7, 14, 30][i]))
        .join(""),
    );
  }

  // Provider audit. Rows are updated in place, so no reference can break.
  // What matters is which providers still resolve to a direct partner URL.
  const providers = await prisma.esimProvider.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      affiliateLinkId: true,
      affiliateLink: { select: { id: true, category: true, partnerName: true, targetUrl: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const repointed = new Set(restore.map((r) => r.id));

  const findings: { level: "OK" | "WARN" | "REVIEW"; text: string }[] = [];
  for (const p of providers) {
    const l = p.affiliateLink;
    if (!p.affiliateLinkId || !l) {
      findings.push({ level: "REVIEW", text: `${p.name}: no affiliateLinkId set - provider is not monetised` });
    } else if (l.category !== "ESIM") {
      findings.push({ level: "REVIEW", text: `${p.name}: points at a ${l.category} row, not ESIM (${l.id})` });
    } else if (repointed.has(l.id)) {
      findings.push({ level: "OK", text: `${p.name}: covered - ${l.partnerName} row repointed to tp.media` });
    } else if (skippedIds.has(l.id)) {
      findings.push({ level: "WARN", text: `${p.name}: row SKIPPED (unrecognised host) - still direct` });
    } else if (isTp(l.targetUrl)) {
      findings.push({ level: "OK", text: `${p.name}: already on tp.media` });
    } else {
      findings.push({ level: "WARN", text: `${p.name}: still points at a direct URL - ${l.targetUrl}` });
    }
  }

  console.log(`\n${"-".repeat(90)}`);
  console.log(`already correct : ${alreadyOk}`);
  console.log(`to repoint      : ${changed}`);
  console.log(`skipped (manual): ${skipped.length}`);
  for (const s of skipped) console.log(`   ${s}`);

  console.log(`\nEsimProvider audit (${providers.length}):`);
  for (const f of findings) console.log(`   [${f.level.padEnd(6)}] ${f.text}`);
  const actionable = findings.filter((f) => f.level !== "OK");
  console.log(`\nProviders needing a human decision: ${actionable.length}`);
  console.log(`This script does not write EsimProvider rows - each finding above is for review.`);

  if (!APPLY) {
    console.log(`\nDRY RUN. Re-run with --apply to write.`);
    console.log(`Rows that would change:`);
    for (const r of restore) console.log(`   ${r.id}  ${r.targetUrl}`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\nAPPLIED. Previous targetUrl values (for rollback):`);
  for (const r of restore) console.log(`   ${r.id}  ${r.targetUrl}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
