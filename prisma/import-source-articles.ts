/**
 * import-source-articles.ts - write the converted source documents into the
 * database as DRAFT articles.
 *
 * Dry run (default): prints the exact plan and opens no connection.
 *   node --env-file=.env --import tsx prisma/import-source-articles.ts
 * Apply:
 *   node --env-file=.env --import tsx prisma/import-source-articles.ts -- --apply
 *
 * Rules encoded here:
 *   - status is DRAFT. Nothing is published, and publishedAt stays null, so a
 *     DRAFT cannot enter the sitemap or a feed.
 *   - coverImage and ogImage stay null. Every source document carries the
 *     author's own instruction to confirm image licensing before publication,
 *     so no image is attached. See NEEDS_MY_INPUT.md.
 *   - No overview, tagline or heroImage is invented for a new destination;
 *     these are created as bare records so the article has somewhere to hang,
 *     and the missing copy is reported as NEEDS_MY_INPUT.
 *   - Existing rows are never overwritten unless --force is passed, because an
 *     upsert would clobber published content.
 *   - Thin documents (under MIN_WORDS words) are refused outright.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type Prisma, type ArticleType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "tmp", "import");

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

interface Payload {
  id: string;
  slug: string;
  destination: string | null;
  title: string;
  blocks: unknown[];
  wordCount: number;
  thin: boolean;
  editorialNotes: string[];
  anomalies: string[];
}

/**
 * Provisional editorial metadata. Article type and destination parenting are
 * structural choices, not claims about the world, but they are recorded in
 * NEEDS_MY_INPUT.md so a human can confirm them before the DRAFTs are edited.
 */
const PLAN: Record<string, { type: ArticleType; destination?: { slug: string; name: string; type: "COUNTRY" | "REGION" | "CITY"; parent?: string } }> = {
  doc01: {
    type: "DESTINATION_GUIDE",
    destination: { slug: "albania", name: "Albania", type: "COUNTRY" },
  },
  doc02: {
    type: "DESTINATION_GUIDE",
    destination: { slug: "azores", name: "The Azores", type: "REGION", parent: "portugal" },
  },
  doc03: {
    type: "DESTINATION_GUIDE",
    destination: { slug: "georgia", name: "Georgia", type: "COUNTRY" },
  },
  doc04: { type: "LISTICLE" },
};

const READING_WORDS_PER_MINUTE = 230;

function excerptFrom(blocks: unknown[]): string | null {
  for (const b of blocks as { type: string; text?: string }[]) {
    if (b.type === "p" && b.text && b.text.trim().length >= 80) return b.text.trim();
  }
  const first = (blocks as { type: string; text?: string }[]).find((b) => b.type === "p" && b.text);
  return first?.text?.trim() ?? null;
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`missing ${SRC} - run: npm run import:convert -- --write`);
    process.exit(1);
  }

  const files = readdirSync(SRC).filter((f) => f.endsWith(".blocks.json")).sort();
  if (files.length === 0) {
    console.error("no tmp/import/*.blocks.json - run: npm run import:convert -- --write");
    process.exit(1);
  }

  const payloads: Payload[] = files.map((f) =>
    JSON.parse(readFileSync(join(SRC, f), "utf8").replace(/^\uFEFF/, "")) as Payload,
  );

  const refused = payloads.filter((p) => p.thin);
  const accepted = payloads.filter((p) => !p.thin);

  console.log("\n=== refused (thin, under the word floor) ===");
  if (refused.length === 0) console.log("  (none)");
  for (const p of refused) console.log(`  ${p.id}  ${p.wordCount} words  ${p.title}`);

  if (!APPLY) {
    console.log("\n=== dry run - no connection opened, no rows written ===");
    console.log("\nid      words  blocks  type            slug");
    for (const p of accepted) {
      const plan = PLAN[p.id];
      console.log(
        `${p.id.padEnd(7)} ${String(p.wordCount).padStart(5)}  ${String(p.blocks.length).padStart(6)}  ` +
          `${(plan?.type ?? "?").padEnd(14)}  ${p.slug}`,
      );
    }

    console.log("\n=== destinations to create (bare records, no invented copy) ===");
    const toCreate = new Set<string>();
    for (const p of accepted) {
      const d = PLAN[p.id]?.destination;
      if (d) toCreate.add(`${d.slug} (${d.type}${d.parent ? ` under ${d.parent}` : ""})`);
    }
    if (toCreate.size === 0) console.log("  (none)");
    else for (const t of toCreate) console.log(`  ${t}`);

    console.log("\n=== data not supplied by this import ===");
    console.log("  coverImage / ogImage  null  - licensing unconfirmed (author's note in each doc)");
    console.log("  destination overview   null  - not present in the source documents");
    console.log("  destination heroImage  null  - licensing unconfirmed");
    console.log("  author                 null  - no author information in the source folder");
    console.log("  all of the above are listed in NEEDS_MY_INPUT.md");
    console.log("\nadd --apply to write DRAFT rows");
    return;
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Fail fast: surface the credential problem before any read-modify-write.
    await prisma.$queryRaw`SELECT 1`;
    console.log("\ndatabase reachable");

    const existingSlugs = new Set(
      (await prisma.article.findMany({ select: { slug: true } })).map((a) => a.slug),
    );

    const conflicts = accepted.filter((p) => existingSlugs.has(p.slug));
    if (conflicts.length > 0 && !FORCE) {
      console.error("\nrefusing to overwrite existing articles (pass --force):");
      for (const c of conflicts) console.error(`  ${c.slug}`);
      process.exit(1);
    }

    const destinationIds = new Map<string, string>();
    for (const p of accepted) {
      const plan = PLAN[p.id];
      if (!plan?.destination) continue;
      const d = plan.destination;
      if (destinationIds.has(d.slug)) continue;

      const found = await prisma.destination.findUnique({ where: { slug: d.slug } });
      if (found) {
        destinationIds.set(d.slug, found.id);
        console.log(`  destination exists, reusing: ${d.slug}`);
        continue;
      }

      const parentId = d.parent ? destinationIds.get(d.parent) ?? (await prisma.destination.findUnique({ where: { slug: d.parent } }))?.id : undefined;
      if (d.parent && !parentId) {
        console.warn(`  WARNING: parent destination "${d.parent}" not found - creating ${d.slug} without a parent`);
      }

      const created = await prisma.destination.create({
        data: { name: d.name, slug: d.slug, type: d.type, parentId: parentId ?? null, isActive: true },
      });
      destinationIds.set(d.slug, created.id);
      console.log(`  created destination: ${d.slug} (${d.type})`);
    }

    let created = 0;
    for (const p of accepted) {
      const plan = PLAN[p.id];
      if (!plan) {
        console.warn(`  SKIP ${p.id}: no plan entry`);
        continue;
      }

      const data: Prisma.ArticleUncheckedCreateInput = {
        title: p.title,
        slug: p.slug,
        excerpt: excerptFrom(p.blocks),
        content: JSON.stringify(p.blocks),
        coverImage: null,
        type: plan.type,
        status: "DRAFT",
        publishedAt: null,
        wordCount: p.wordCount,
        readingTimeMinutes: Math.max(1, Math.ceil(p.wordCount / READING_WORDS_PER_MINUTE)),
        allowIndexing: false, // DRAFT, and no images yet - flip once reviewed.
        destinationId: p.destination ? destinationIds.get(p.destination) ?? null : null,
      };

      if (FORCE) {
        const existing = await prisma.article.findUnique({ where: { slug: p.slug } });
        if (existing) {
          await prisma.article.update({ where: { slug: p.slug }, data });
          console.log(`  updated (force): ${p.slug}`);
          created += 1;
          continue;
        }
      }

      await prisma.article.create({ data });
      console.log(`  created: ${p.slug}  [${plan.type}]`);
      created += 1;
    }

    console.log(`\n${created} DRAFT article(s) written`);
    console.log("publishedAt is null and allowIndexing is false - nothing enters the sitemap");
    console.log("next: review in /admin, then set PUBLISHED by hand. See NEEDS_MY_INPUT.md");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\nimport failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
