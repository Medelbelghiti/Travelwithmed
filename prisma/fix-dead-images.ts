/**
 * Phase 8.2 — replace the three dead Unsplash photo IDs that Unsplash now
 * serves as HTTP 404.
 *
 * These IDs are baked into the database, not just the seeds: Destination
 * .coverImage/.heroImage, Article .coverImage/.ogImage and SeoMetadata
 * .ogImage/.twitterImage. Re-running the seeds does NOT fix live rows,
 * because seed-cities only fills EMPTY image fields and seed-seo only knows
 * the 20 slugs in its PHOTOS map. This script repairs the rows that are
 * already stored.
 *
 * Impact being repaired (from the production crawl):
 *   photo-1501785888041-af3ef285b2aa -> 404
 *     Los Angeles, San Francisco, Phuket, Rio de Janeiro, Miami, Honolulu
 *     + 3 eSIM articles
 *   photo-1508009603885-a5b2c675d8d0 -> 404
 *     Bangkok + 1 eSIM article
 *   photo-1464824477268-36a28a1e2487 -> 404
 *     Las Vegas, New Orleans
 *
 * SAFE BY DEFAULT: dry run unless --apply is passed. Only rows whose stored
 * URL actually contains a known-dead ID are touched, so hand-set images and
 * images from other sources are never overwritten. Every replaced value is
 * printed so the change is reversible by hand.
 *
 * Run:  npx tsx prisma/fix-dead-images.ts
 *       npx tsx prisma/fix-dead-images.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** dead ID -> replacement. Every replacement confirmed HTTP 200 + subject-checked. */
const REPLACEMENTS: Record<string, string> = {
  "photo-1501785888041-af3ef285b2aa": u("photo-1597982087634-9884f03198ce"), // palm-lined road, LA skyline
  "photo-1508009603885-a5b2c675d8d0": u("photo-1613672803979-a6edfc5a179b"), // Wat Arun, Bangkok
  "photo-1464824477268-36a28a1e2487": u("photo-1707702570280-f5800fe37c8b"), // French Quarter balconies
};

/**
 * The single dead beach image was shared by six very different cities, so one
 * 404 broke all of them at once. Where the row itself identifies the city, use
 * the correct per-city photo instead of a generic replacement.
 */
const PER_CITY: { match: RegExp; to: string; label: string }[] = [
  { match: /los-angeles/i, to: u("photo-1597982087634-9884f03198ce"), label: "Los Angeles" },
  { match: /san-francisco/i, to: u("photo-1521747116042-5a810fda9664"), label: "San Francisco" },
  { match: /phuket/i, to: u("photo-1693494813069-b83e8eaca59a"), label: "Phuket" },
  { match: /rio-de-janeiro/i, to: u("photo-1596573677494-accc8fbe89e8"), label: "Rio de Janeiro" },
  { match: /miami/i, to: u("photo-1589083130544-0d6a2926e519"), label: "Miami" },
  { match: /honolulu/i, to: u("photo-1636522302567-032111e4aff4"), label: "Honolulu" },
  { match: /bangkok/i, to: u("photo-1613672803979-a6edfc5a179b"), label: "Bangkok" },
  { match: /las-vegas/i, to: u("photo-1605833556294-ea5c7a74f57d"), label: "Las Vegas" },
  { match: /new-orleans/i, to: u("photo-1707702570280-f5800fe37c8b"), label: "New Orleans" },
];

/** Returns the correct image for a row, or null if the row is not affected. */
function repair(current: string | null, label: string): string | null {
  if (!current) return null;
  const dead = Object.keys(REPLACEMENTS).find((d) => current.includes(d));
  if (!dead) return null;
  const city = PER_CITY.find((c) => c.match.test(label));
  // Fall back to the generic replacement rather than guessing from the label.
  return city ? city.to : REPLACEMENTS[dead];
}

async function main() {
  console.log(`mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes)"}\n`);

  let changed = 0;
  const undo: string[] = [];

  const destinations = await prisma.destination.findMany({
    where: { OR: [{ coverImage: { contains: "photo-1501785888041" } }, { coverImage: { contains: "photo-1508009603885" } }, { coverImage: { contains: "photo-1464824477268" } }, { heroImage: { contains: "photo-1501785888041" } }, { heroImage: { contains: "photo-1508009603885" } }, { heroImage: { contains: "photo-1464824477268" } }] },
    select: { id: true, slug: true, name: true, coverImage: true, heroImage: true },
  });
  console.log(`Destination rows on a dead image: ${destinations.length}`);
  for (const d of destinations) {
    const cover = repair(d.coverImage, d.slug);
    const hero = repair(d.heroImage, d.slug);
    if (!cover && !hero) continue;
    console.log(`  ${d.slug.padEnd(18)} cover=${cover ? "fix" : "ok "} hero=${hero ? "fix" : "ok "}`);
    undo.push(`Destination ${d.slug}  was cover=${d.coverImage} hero=${d.heroImage}`);
    if (APPLY) {
      await prisma.destination.update({
        where: { id: d.id },
        data: { ...(cover ? { coverImage: cover } : {}), ...(hero ? { heroImage: hero } : {}) },
      });
    }
    changed++;
  }

  const articles = await prisma.article.findMany({
    where: { OR: [{ coverImage: { contains: "photo-1501785888041" } }, { coverImage: { contains: "photo-1508009603885" } }, { coverImage: { contains: "photo-1464824477268" } }, { ogImage: { contains: "photo-1501785888041" } }, { ogImage: { contains: "photo-1508009603885" } }, { ogImage: { contains: "photo-1464824477268" } }] },
    select: { id: true, slug: true, title: true, coverImage: true, ogImage: true, destination: { select: { slug: true } } },
  });
  console.log(`\nArticle rows on a dead image: ${articles.length}`);
  for (const a of articles) {
    // Label by destination so a shared eSIM cover maps to the right city.
    const label = a.destination?.slug ?? a.slug;
    const cover = repair(a.coverImage, label);
    const og = repair(a.ogImage, label);
    if (!cover && !og) continue;
    console.log(`  ${a.slug.padEnd(30)} cover=${cover ? "fix" : "ok "} og=${og ? "fix" : "ok "}  (${label})`);
    undo.push(`Article ${a.slug}  was cover=${a.coverImage} og=${a.ogImage}`);
    if (APPLY) {
      await prisma.article.update({
        where: { id: a.id },
        data: { ...(cover ? { coverImage: cover } : {}), ...(og ? { ogImage: og } : {}) },
      });
    }
    changed++;
  }

  const seo = await prisma.seoMetadata.findMany({
    where: { OR: [{ ogImage: { contains: "photo-1501785888041" } }, { ogImage: { contains: "photo-1508009603885" } }, { ogImage: { contains: "photo-1464824477268" } }, { twitterImage: { contains: "photo-1501785888041" } }, { twitterImage: { contains: "photo-1508009603885" } }, { twitterImage: { contains: "photo-1464824477268" } }] },
    select: { id: true, ogImage: true, twitterImage: true, destination: { select: { slug: true } }, article: { select: { slug: true } } },
  });
  console.log(`\nSeoMetadata rows on a dead image: ${seo.length}`);
  for (const s of seo) {
    const label = s.destination?.slug ?? s.article?.slug ?? "";
    const og = repair(s.ogImage, label);
    const tw = repair(s.twitterImage, label);
    if (!og && !tw) continue;
    const who = s.destination?.slug ?? `article:${s.article?.slug}`;
    console.log(`  ${who.padEnd(30)} og=${og ? "fix" : "ok "} twitter=${tw ? "fix" : "ok "}`);
    undo.push(`SeoMetadata ${who}  was og=${s.ogImage} twitter=${s.twitterImage}`);
    if (APPLY) {
      await prisma.seoMetadata.update({
        where: { id: s.id },
        data: { ...(og ? { ogImage: og } : {}), ...(tw ? { twitterImage: tw } : {}) },
      });
    }
    changed++;
  }

  console.log(`\n${"-".repeat(60)}\nrows to change: ${changed}`);
  if (changed === 0) console.log("Nothing to repair.");
  console.log(`\nPrevious values (for rollback):`);
  for (const u2 of undo) console.log(`   ${u2}`);

  if (!APPLY && changed > 0) {
    console.log(`\nDRY RUN. Re-run with --apply to write.`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
