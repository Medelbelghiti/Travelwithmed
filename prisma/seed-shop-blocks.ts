import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Insert a `shop` content block into destination articles, filtered by query.
// Idempotent: skips an article if it already has a `shop` block with the same query.
const TARGETS: { slug: string; query: string; title: string }[] = [
  { slug: "paris-in-4-days-itinerary", query: "Paris", title: "Paris prints from the shop" },
  { slug: "paris-travel-guide", query: "Paris", title: "Paris prints from the shop" },
  { slug: "rome-in-4-days-itinerary", query: "Rome", title: "Rome prints from the shop" },
  { slug: "7-days-in-bali-itinerary", query: "Bali", title: "Bali prints from the shop" },
  { slug: "tokyo-itinerary-4-days", query: "Tokyo", title: "Tokyo prints from the shop" },
  { slug: "best-things-to-do-in-kyoto", query: "Kyoto", title: "Kyoto prints from the shop" },
  { slug: "best-things-to-do-in-osaka", query: "Osaka", title: "Osaka prints from the shop" },
];

async function main() {
  const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
  const prisma = new PrismaClient({ adapter });

  let inserted = 0;
  for (const target of TARGETS) {
    const article = await prisma.article.findUnique({ where: { slug: target.slug } });
    if (!article || article.status !== "PUBLISHED") {
      console.log(`SKIP ${target.slug} (not found or not published)`);
      continue;
    }

    let blocks: { type?: string; query?: string; [k: string]: unknown }[];
    try {
      const parsed = JSON.parse(article.content);
      blocks = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.log(`SKIP ${target.slug} (unparsable content)`);
      continue;
    }
    if (!blocks.length) continue;

    const already = blocks.some((b) => b.type === "shop" && (b.query ?? "") === target.query);
    if (already) {
      console.log(`SKIP ${target.slug} (shop block with query "${target.query}" already present)`);
      continue;
    }

    const shopBlock: typeof blocks[number] = { type: "shop", title: target.title, query: target.query, limit: 4 };

    // Insert before the first hotels/cta/activities block if present, else append.
    const insertAt = blocks.findIndex((b) => b.type === "hotels" || b.type === "cta" || b.type === "activities");
    if (insertAt >= 0) {
      blocks.splice(insertAt, 0, shopBlock);
    } else {
      blocks.push(shopBlock);
    }

    await prisma.article.update({ where: { id: article.id }, data: { content: JSON.stringify(blocks) } });
    inserted++;
    console.log(`INSERT shop block into ${target.slug} at index ${insertAt < 0 ? "end" : insertAt}`);
  }

  console.log(`Done. Shop blocks inserted into ${inserted} article(s).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});