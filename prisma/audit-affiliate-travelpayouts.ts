import { prisma } from "@/lib/prisma";
import { TRAVELPAYOUTS_PROGRAMS } from "../src/lib/travelpayouts";

/**
 * Audits which affiliate partners are backed by a confirmed Travelpayouts
 * program, and reports the consequences of deactivating the others.
 *
 * READ-ONLY. This never writes; it exists to make the "only Travelpayouts
 * platforms stay active" decision safe to execute.
 */

const TP = TRAVELPAYOUTS_PROGRAMS;

/** Hosts that identify a Travelpayouts-hosted program link. */
const isTp = (url: string) => {
  try {
    const h = new URL(url).hostname;
    return h === "tp.media" || h.endsWith(".tp.media");
  } catch {
    return false;
  }
};

/** Partner names Travelpayouts covers, from TRAVELPAYOUTS_PROGRAMS. */
const TP_NAMES = new Map(TP.map((p) => [p.name.toLowerCase(), p]));

async function main() {
  const links = await prisma.affiliateLink.findMany({
    select: {
      id: true,
      partnerName: true,
      category: true,
      targetUrl: true,
      active: true,
      clickCount: true,
      articleId: true,
      destinationId: true,
      hotelId: true,
      activityId: true,
    },
  });

  console.log(`Total AffiliateLink rows: ${links.length}`);
  console.log(`Active: ${links.filter((l) => l.active).length} / Inactive: ${links.filter((l) => !l.active).length}`);

  // 1. Coverage by partner.
  const byPartner = new Map<string, { total: number; active: number; clicks: number; tp: boolean; host: string; cat: Set<string> }>();
  for (const l of links) {
    const key = l.partnerName || "(none)";
    const e = byPartner.get(key) ?? { total: 0, active: 0, clicks: 0, tp: false, host: "", cat: new Set<string>() };
    e.total++;
    if (l.active) e.active++;
    e.clicks += l.clickCount;
    e.cat.add(l.category);
    try {
      const h = new URL(l.targetUrl).hostname;
      if (!e.host) e.host = h;
      if (isTp(l.targetUrl)) e.tp = true;
    } catch {
      /* ignore */
    }
    byPartner.set(key, e);
  }

  console.log("\n=== PARTNERS: Travelpayouts (tp) vs not ===");
  const rows = [...byPartner.entries()].sort((a, b) => b[1].clicks - a[1].clicks);
  console.log(
    `${"partner".padEnd(18)}${"tp".padEnd(5)}${"act".padEnd(6)}${"tot".padEnd(6)}${"clics".padEnd(8)}categories`,
  );
  for (const [name, e] of rows) {
    const inList = TP_NAMES.has(name.toLowerCase());
    console.log(
      `${name.padEnd(18)}${(e.tp || inList ? "YES" : "no").padEnd(5)}${String(e.active).padEnd(6)}${String(e.total).padEnd(6)}${String(e.clicks).padEnd(8)}${[...e.cat].join(",")}`,
    );
  }

  // 2. Categories that would be left with no active link.
  console.log("\n=== CATEGORY COVERAGE if non-TP partners go inactive ===");
  const cats = [...new Set(links.map((l) => l.category))];
  for (const cat of cats) {
    const inCat = links.filter((l) => l.category === cat);
    const tpActive = inCat.filter((l) => l.active && (isTp(l.targetUrl) || TP_NAMES.has((l.partnerName || "").toLowerCase())));
    const nonTpActive = inCat.filter((l) => l.active && !isTp(l.targetUrl) && !TP_NAMES.has((l.partnerName || "").toLowerCase()));
    const verdict = tpActive.length > 0 ? "OK (has TP)" : nonTpActive.length > 0 ? "WOULD LOSE ALL CTAs" : "already empty";
    console.log(`  ${cat.padEnd(20)} tp_active=${String(tpActive.length).padEnd(4)} nonTP_active=${String(nonTpActive.length).padEnd(4)} ${verdict}`);
  }

  // 3. Rows that would be deactivated.
  const toDeactivate = links.filter(
    (l) => l.active && !isTp(l.targetUrl) && !TP_NAMES.has((l.partnerName || "").toLowerCase()),
  );
  console.log(`\n=== WOULD DEACTIVATE: ${toDeactivate.length} rows, ${toDeactivate.reduce((a, l) => a + l.clickCount, 0)} historical clicks ===`);
  for (const l of toDeactivate.slice(0, 20)) {
    console.log(`  ${l.partnerName?.padEnd(16) ?? "(none)".padEnd(16)} ${l.category.padEnd(18)} clicks=${l.clickCount}`);
  }
  if (toDeactivate.length > 20) console.log(`  ... and ${toDeactivate.length - 20} more`);

  console.log(`\n=== TRAVELPAYOUTS PROGRAMS with no AffiliateLink row ===`);
  const present = new Set(links.map((l) => l.targetUrl).filter(isTp));
  for (const p of TP) {
    const has = links.some((l) => isTp(l.targetUrl) && l.targetUrl.includes(`p=${p.productId}`));
    if (!has) console.log(`  ${p.id.padEnd(18)} ${p.name.padEnd(18)} p=${p.productId} (not in DB)`);
  }
  if (present.size === 0) console.log("  (none)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
