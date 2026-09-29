import { prisma } from "@/lib/prisma";

/**
 * Verifies the two "inactive link must not render" guards actually work against
 * the database, by toggling a real row's active flag and checking the queries
 * each guard relies on. Read-only apart from the toggle it puts back.
 */

async function main() {
  // 1. A FLIGHTS row now points at Aviasales on tp.media after the migration.
  const row = await prisma.affiliateLink.findFirst({
    where: { category: "FLIGHTS", targetUrl: { contains: "tp.media" } },
    select: { id: true, partnerName: true, targetUrl: true, active: true },
  });
  if (!row) {
    console.log("NO tp.media FLIGHTS row found - run the migration first.");
    process.exit(1);
  }
  console.log(`testing row ${row.id} (${row.partnerName}) active=${row.active}`);

  // Guard used by content-renderer: one batched query over the block's ids.
  const batch = async () => {
    const ids = [row.id];
    const found = await prisma.affiliateLink
      .findMany({ where: { id: { in: ids }, active: true }, select: { id: true } })
      .catch(() => []);
    return new Set(found.map((r) => r.id));
  };

  // Guard used by itineraries/[slug]: same shape, different caller.
  const itineraryGuard = async () => {
    const out = await prisma.affiliateLink
      .findMany({ where: { id: { in: [row.id] }, active: true }, select: { id: true } })
      .catch(() => []);
    return out.length > 0;
  };

  const before = await batch();
  const beforeItin = await itineraryGuard();
  console.log(`  active=true  -> content-renderer renders: ${before.has(row.id)}  itinerary renders: ${beforeItin}`);

  await prisma.affiliateLink.update({ where: { id: row.id }, data: { active: false } });
  const after = await batch();
  const afterItin = await itineraryGuard();
  console.log(`  active=false -> content-renderer renders: ${after.has(row.id)}  itinerary renders: ${afterItin}`);

  await prisma.affiliateLink.update({ where: { id: row.id }, data: { active: row.active } });
  const restored = await batch();
  console.log(`  restored=${restored.has(row.id)} (expected true)`);

  const pass = before.has(row.id) && beforeItin && !after.has(row.id) && !afterItin && restored.has(row.id);
  console.log(pass ? "PASS" : "FAIL");
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
