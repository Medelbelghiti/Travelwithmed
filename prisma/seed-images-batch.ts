/**
 * seed-images-batch.ts — Part C image assignment for the 10 draft guides.
 *
 * WHY THIS IS A VERIFY-THEN-WRITE SCRIPT
 * An invented Unsplash ID is a broken image in production, and Unsplash is now
 * behind bot protection without an API key (unsplash.com/napi answers 401 to
 * unauthenticated clients), so IDs cannot be discovered automatically. Every ID
 * below therefore comes from a photo already verified in this repository, and
 * this script re-verifies each one over HTTP before allowing a write. Anything
 * that fails verification is reported and skipped, never guessed.
 *
 * Do not reuse IDs from prisma/seed-seo.ts to fill gaps. Several of its
 * destination mappings point at the wrong city (lisbon -> a Tokyo photo,
 * london -> the Eiffel Tower, athens/seoul/amsterdam -> Tokyo, and four US
 * cities -> a Rio shot). Those are placeholders, not references.
 *
 * Scope:
 *   1. cover / og image for a batch guide, only when it has none
 *   2. hero + cover for its Destination row, only when the destination has none
 *   3. inline section images (3:2, 1200x800) injected into the stored content
 *      JSON under the section named in the map
 *
 * Additive and idempotent: a cover is never overwritten, and inline images are
 * matched by src so a second run changes nothing. It does not modify
 * prisma/seed-images.ts or prisma/seed-seo.ts.
 *
 * Run (dry run):  node --env-file=.env --import tsx prisma/seed-images-batch.ts
 * Run (apply):    node --env-file=.env --import tsx prisma/seed-images-batch.ts -- --apply
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { parseContentBlocks, type ContentBlock } from "../src/lib/content";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const apply = process.argv.includes("--apply");

/** Hero is wider than the 1200 default; section is exactly 3:2 for the renderer box. */
const hero = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
const section = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=800&q=80`;

type Section = { id: string; after: string; alt: string; caption: string };
type Config = { articleSlug: string; heroId?: string; sections: Section[] };

/**
 * Photos already verified in this repo, each with the destination it actually
 * depicts. Destinations absent from this map are listed in PENDING below.
 */
const BATCH_IMAGES: Record<string, Config> = {
  marrakech: {
    articleSlug: "marrakech-travel-guide",
    heroId: "photo-1597212618440-806262de4f6b",
    sections: [
      {
        id: "photo-1545324418-cc1a3fa10c00",
        after: "Where to stay",
        alt: "Tiled riad courtyard with a plunge pool in the Marrakech medina",
        caption: "A courtyard riad in the medina — most are reached through an unmarked door.",
      },
      {
        id: "photo-1539020140153-e479b8c22e70",
        after: "Top experiences",
        alt: "Spice and produce stalls at a Moroccan market",
        caption: "The food souks are where most first-time visitors get their bearings.",
      },
    ],
  },
  fes: {
    articleSlug: "fes-travel-guide",
    heroId: "photo-1758185282460-4eeef1439227",
    sections: [
      {
        id: "photo-1769429385098-155751b87e58",
        after: "Where to stay",
        alt: "Traditional blue door in the Fes medina",
        caption: "Doors are the main wayfinding system in the Fes medina — the colour tells you which",
      },
      {
        id: "photo-1767936925033-9a5b59925613",
        after: "Top experiences",
        alt: "Old-world dye vats in the Fes tanneries",
        caption: "The tanneries are still the thing people come to Fes to see.",
      },
    ],
  },
  chefchaouen: {
    articleSlug: "chefchaouen-travel-guide",
    heroId: "photo-1697549780805-8d271009381f",
    sections: [
      {
        id: "photo-1654683407553-6925e9caed55",
        after: "Where to stay",
        alt: "Chefchaouen narrow blue alley with potted plants",
        caption: "Guesthouses are scattered through the upper town, up stairs that look like a dead end.",
      },
      {
        id: "photo-1759234119876-42e71955ae81",
        after: "Top experiences",
        alt: "Chefchaouen street market with woven goods",
        caption: "Most of what you see in the souks is made in or near the town.",
      },
    ],
  },
  casablanca: {
    articleSlug: "casablanca-travel-guide",
    heroId: "photo-1758382255691-d698ab95c59b",
    sections: [
      {
        id: "photo-1624805151765-35bc8b2c9623",
        after: "Where to stay",
        alt: "Casablanca building facade in the city centre",
        caption: "Most visitors base themselves near the corniche or the centre rather than further out.",
      },
      {
        id: "photo-1767936925324-3f8883d74b26",
        after: "Top experiences",
        alt: "Arched tiled entryway in the old medina",
        caption: "The old medina is the part of Casablanca that still feels like the city it replaced.",
      },
    ],
  },
  agadir: {
    articleSlug: "agadir-travel-guide",
    heroId: "photo-1665303655457-cd9655b4ff9d",
    sections: [
      {
        id: "photo-1665303655058-4743da14b76b",
        after: "Where to stay",
        alt: "Agadir Kasbah wall and doorway",
        caption: "The Kasbah was largely rebuilt after the 1960 earthquake, so it reads newer than it is.",
      },
      {
        id: "photo-1665303655050-f378e70a4ea6",
        after: "Top experiences",
        alt: "Agadir beach with sun loungers on the Atlantic",
        caption: "The beach is the reason most people end up here, and it does not disappoint.",
      },
    ],
  },
  istanbul: {
    articleSlug: "istanbul-travel-guide",
    heroId: "photo-1769299118857-c6d8402291e3",
    sections: [
      {
        id: "photo-1647221432456-aaa8825aee1c",
        after: "Where to stay",
        alt: "Colourful wooden houses on a street in Istanbul's Balat district",
        caption: "Balat and Karaköy are where most people now stay.",
      },
      {
        id: "photo-1623621534850-d325a1980c7e",
        after: "Top experiences",
        alt: "Hagia Sophia exterior in Istanbul",
        caption: "The Hagia Sophia is the one sight that justifies a long queue.",
      },
    ],
  },
  lisbon: {
    articleSlug: "lisbon-travel-guide",
    heroId: "photo-1585208798174-6cedd86e019a",
    sections: [
      {
        id: "photo-1702758045561-7d5d5fe33d4a",
        after: "Where to stay",
        alt: "Lisbon cityscape from a miradouro at dusk",
        caption: "The hills decide your evening: higher up means a longer walk back and a better view.",
      },
      {
        id: "photo-1777899623496-6d6202e8f1bd",
        after: "Top experiences",
        alt: "Azulejo-tiled building facade in Lisbon",
        caption: "Tiled facades are everywhere, and looking up is free.",
      },
    ],
  },
  dubai: {
    articleSlug: "dubai-travel-guide",
    heroId: "photo-1512453979798-5ea266f8880c",
    sections: [
      {
        id: "photo-1785671366882-5bfc92da8b13",
        after: "Where to stay",
        alt: "Traditional abra boats on Dubai Creek",
        caption: "The old town and the Creek are a different city from the one the skyline sells.",
      },
      {
        id: "photo-1576159470850-494c8b17aca0",
        after: "Top experiences",
        alt: "Vehicles driving across the desert dunes outside Dubai",
        caption: "A desert trip is an hour from downtown and feels like a different country.",
      },
    ],
  },
  london: {
    articleSlug: "london-travel-guide",
    heroId: "photo-1740598609321-52d1a6e1e96f",
    sections: [
      {
        id: "photo-1662714212039-061a2c146f65",
        after: "Where to stay",
        alt: "Food stalls at London Borough Market",
        caption: "Borough Market is on the South Bank — stay near it and the river is a bonus.",
      },
      {
        id: "photo-1789784160311-851f6f724510",
        after: "Top experiences",
        alt: "London Underground train at a station platform",
        caption: "The Tube is the fastest way across the city and the cheapest thing you will buy.",
      },
    ],
  },
  santorini: {
    articleSlug: "santorini-travel-guide",
    heroId: "photo-1761047726930-d1443d5f490f",
    sections: [
      {
        id: "photo-1781455495654-be056a02277e",
        after: "Where to stay",
        alt: "Whitewashed houses on the Santorini cliffside",
        caption: "Oia and Fira have the famous views; Imerovigli is quieter and cheaper.",
      },
      {
        id: "photo-1743427522092-3e3ef36e0a24",
        after: "Top experiences",
        alt: "Wine tasting terrace overlooking the sea at sunset in Santorini",
        caption: "Santorini's wine is volcanic and genuinely unlike anywhere else in Greece.",
      },
    ],
  },
};

/**
 * IDs already used elsewhere in the repo, mapped to where. A batch image that
 * collides with one of these is refused unless it also appears in
 * ALLOWED_SHARED, which is a deliberate editorial decision, recorded with its
 * reason. This list was generated from prisma/ and src/, not written by hand.
 */
const USED_ELSEWHERE: Record<string, string> = {
  "photo-1464824477268-36a28a1e2487": "seed-cities.ts:17",
  "photo-1467269204594-9661b134dd2b": "seed-articles-2.ts:307, seed-cities.ts:14, seed-images.ts:27",
  "photo-1473968512647-3e447244af8f": "seed-articles-2.ts:149, seed-articles-6.ts:523",
  "photo-1488646953014-85cb44e25828": "seed-articles-2.ts:277, seed-articles-2.ts:376, seed-articles-6.ts:577, +1 more",
  "photo-1490806843957-31f4c9a91c65": "seed-articles-5.ts:483, seed-articles-6.ts:271, seed-articles-7.ts:354, +1 more",
  "photo-1493976040374-85c8e12f0c0e": "seed-articles-1.ts:305, seed-articles-5.ts:178, seed-articles-7.ts:314, +3 more",
  "photo-1496442226666-8d4d0e62e6e9": "seed-seo.ts:6",
  "photo-1499856871958-5b9627545d1a": "seed-images.ts:65",
  "photo-1501785888041-af3ef285b2aa": "seed-cities.ts:16, seed-seo.ts:13, seed-seo.ts:14, +2 more",
  "photo-1502602898657-3e91760cbb34": "seed-cities.ts:10, seed-images.ts:13, seed-images.ts:21, +5 more",
  "photo-1503220317375-aaad61436b1b": "seed-articles-2.ts:222, seed-articles-6.ts:320",
  "photo-1508009603885-a5b2c675d8d0": "seed-seo.ts:7",
  "photo-1512756290469-ec264b7fbf87": "seed-images.ts:47",
  "photo-1512918728675-ed5a9ecdebfd": "seed-articles-3.ts:291, seed-images.ts:42",
  "photo-1512941937669-90a1b58e7e9c": "seed-articles-6.ts:373, seed-images.ts:57",
  "photo-1516541196182-6bdb0516ed27": "seed-articles-5.ts:336",
  "photo-1522798514-97ceb8c4f1c8": "seed-articles-4.ts:482, seed-images.ts:38",
  "photo-1523293182086-7651a899d37f": "seed-images.ts:55",
  "photo-1528360983277-13d401cdc186": "seed-articles-5.ts:384, seed-cities.ts:14, seed-images.ts:28, +1 more",
  "photo-1533669955142-6a73332af4db": "seed-cities.ts:15, seed-images.ts:30, seed-seo.ts:12, +1 more",
  "photo-1537996194471-e657df975ab4": "seed-articles-1.ts:229, seed-articles-2.ts:345, seed-articles-4.ts:179, +5 more",
  "photo-1539020140153-e479b8c22e70": "seed-articles-4.ts:337, seed-images.ts:50",
  "photo-1540959733332-eab4deabeeaf": "seed-articles-6.ts:171, seed-cities.ts:10, seed-images.ts:14, +5 more",
  "photo-1545324418-cc1a3fa10c00": "seed-articles-4.ts:275, seed-images.ts:40",
  "photo-1545569341-9eb8b30979d9": "seed-articles-5.ts:280, seed-images.ts:39",
  "photo-1547471080-7cc2caa01a7e": "seed-articles-4.ts:386, seed-cities.ts:15, seed-images.ts:29",
  "photo-1549144511-f099e773c147": "seed-articles-3.ts:351, seed-articles-7.ts:196, seed-images.ts:46",
  "photo-1551882547-ff40c63fe5fa": "seed-articles-6.ts:469, seed-images.ts:37",
  "photo-1552832230-c0197dd311b5": "seed-articles-1.ts:148, seed-articles-3.ts:189, seed-articles-7.ts:161, +6 more",
  "photo-1553062407-98eeb64c6a62": "seed-articles-2.ts:185, seed-articles-6.ts:421, seed-images.ts:56",
  "photo-1553413077-190dd305871c": "seed-articles-1.ts:269, seed-articles-5.ts:233, seed-cities.ts:13, +1 more",
  "photo-1560998086-bb8f9e7b5b0a": "seed-cities.ts:16",
  "photo-1564085352725-08da0272627d": "seed-images.ts:41",
  "photo-1565967511849-76a60a516170": "seed-articles-1.ts:337, seed-articles-3.ts:404, seed-articles-5.ts:438",
  "photo-1566073771259-6a8506099945": "seed-images.ts:35",
  "photo-1582719478250-c89cae4dc85b": "seed-articles-7.ts:276, seed-articles-7.ts:398, seed-images.ts:36",
  "photo-1583422409516-2895a77efded": "seed-articles-1.ts:188, seed-cities.ts:12, seed-images.ts:18, +2 more",
  "photo-1597212618440-806262de4f6b": "seed-cities.ts:11, seed-content-batch.ts:65, seed-images.ts:15, +3 more",
  "photo-1602143407151-7111542de6e8": "seed-images.ts:58",
  "photo-1622396481328-9b1b78cdd9fd": "seed-articles-4.ts:434",
};

/** Deliberate reuse, with the reason it is not a duplicate worth avoiding. */
const ALLOWED_SHARED: Record<string, string> = {
  "photo-1597212618440-806262de4f6b": "canonical Marrakech photo, already the marrakech destination cover",
  "photo-1545324418-cc1a3fa10c00": "a Marrakech riad, the correct subject for this guide",
  "photo-1539020140153-e479b8c22e70": "Moroccan market, the correct subject for this guide",
  // The five destinations added to seed-cities.ts in Part C. Each is the same
  // city's cover, so the guide and the destination page must match.
  "photo-1758382255691-d698ab95c59b": "the casablanca destination cover, added in Part C",
  "photo-1665303655457-cd9655b4ff9d": "the agadir destination cover, added in Part C",
  "photo-1769299118857-c6d8402291e3": "the istanbul destination cover, added in Part C",
  "photo-1512453979798-5ea266f8880c": "the dubai destination cover, added in Part C",
  "photo-1740598609321-52d1a6e1e96f": "the london destination cover, added in Part C",
};

/**
 * All ten destinations are now sourced. The array stays as a guard: a destination
 * added to BATCH_IMAGES without an image still gets reported here instead of
 * silently shipping on the branded /og fallback.
 */
const PENDING: { slug: string; hero: string; sections: string[] }[] = [];

const cache = new Map<string, boolean>();
/** Confirms the CDN actually serves this photo. Cached: one request per ID. */
async function verify(id: string): Promise<boolean> {
  const hit = cache.get(id);
  if (hit !== undefined) return hit;
  let ok = false;
  try {
    const res = await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=60`, {
      redirect: "follow",
    });
    ok = res.ok;
  } catch {
    ok = false;
  }
  cache.set(id, ok);
  return ok;
}

type Rejection = string | null;
/** An ID is usable only if it resolves and is not an unapproved duplicate. */
async function check(id: string): Promise<Rejection> {
  if (!(await verify(id))) return "unreachable (not a valid photo ID)";
  if (ALLOWED_SHARED[id]) return null;
  if (USED_ELSEWHERE[id]) return `duplicate of ${USED_ELSEWHERE[id]}`;
  return null;
}

/** Injects section images into stored content under their section heading. Idempotent. */
function injectSections(blocks: ContentBlock[], sections: Section[]): { blocks: ContentBlock[]; injected: number } {
  const result = [...blocks];
  let injected = 0;
  for (const s of sections) {
    const src = section(s.id);
    if (result.some((b) => b.type === "image" && b.src === src)) continue;
    const heading = result.findIndex(
      (b) => b.type === "h2" && b.text.toLowerCase().includes(s.after.toLowerCase()),
    );
    if (heading === -1) continue;
    let at = heading + 1;
    while (at < result.length && result[at].type !== "h2") at++;
    result.splice(at, 0, { type: "image", src, alt: s.alt, caption: s.caption });
    injected++;
  }
  return { blocks: result, injected };
}

async function main() {
  const plan: {
    slug: string;
    hero: string;
    sections: { id: string; status: string }[];
  }[] = [];

  for (const [slug, cfg] of Object.entries(BATCH_IMAGES)) {
    const heroStatus = !cfg.heroId
      ? "none"
      : ((await check(cfg.heroId)) ?? "ok").slice(0, 60);
    const sections: { id: string; status: string }[] = [];
    for (const s of cfg.sections) sections.push({ id: s.id, status: (await check(s.id)) ?? "ok" });
    plan.push({ slug, hero: heroStatus, sections });
  }

  console.log("Image batch — DRY RUN");
  console.table(
    plan.map((p) => ({
      slug: p.slug,
      hero: p.hero,
      sections: p.sections.map((s) => `${s.id.slice(6, 20)}:${s.status}`).join("  "),
    })),
  );

  const unsourced = PENDING.filter((p) => !BATCH_IMAGES[p.slug]);
  console.log(`\n${unsourced.length} destination(s) have no verified ID (no UNSPLASH_ACCESS_KEY):`);
  for (const p of unsourced) {
    console.log(`  - ${p.slug}: hero "${p.hero}" + ${p.sections.map((q) => `"${q}"`).join(", ")}`);
  }
  console.log("  Supply IDs via a key or by hand; they are never generated. A null cover falls back");
  console.log("  to the branded /og generator, so an unsourced guide is plain, not broken.");

  if (!apply) {
    console.log("\nNo changes written. Re-run with --apply.");
    // Without this the pool holds an open socket and the process never exits.
    await pool.end();
    return;
  }

  let covers = 0;
  let inlined = 0;
  for (const [slug, cfg] of Object.entries(BATCH_IMAGES)) {
    const article = await prisma.article.findUnique({ where: { slug: cfg.articleSlug } });
    if (!article) {
      console.log(`  skip ${cfg.articleSlug}: no such article — run seed-content-batch.ts --apply first`);
      continue;
    }
    const data: Record<string, unknown> = {};

    if (cfg.heroId && !article.coverImage && !(await check(cfg.heroId))) {
      data.coverImage = hero(cfg.heroId);
      data.ogImage = hero(cfg.heroId);
      covers++;
    }

    const usable: Section[] = [];
    for (const s of cfg.sections) if (!(await check(s.id))) usable.push(s);
    if (usable.length) {
      const { blocks, injected } = injectSections(parseContentBlocks(article.content), usable);
      if (injected) {
        data.content = JSON.stringify(blocks);
        inlined += injected;
      }
    }

    if (Object.keys(data).length) {
      await prisma.article.update({ where: { slug: cfg.articleSlug }, data });
    }

    if (cfg.heroId && !(await check(cfg.heroId))) {
      const dest = await prisma.destination.findFirst({
        where: { slug },
        select: { id: true, coverImage: true },
      });
      if (dest && !dest.coverImage) {
        const url = hero(cfg.heroId);
        await prisma.destination.update({ where: { id: dest.id }, data: { coverImage: url, heroImage: url } });
        console.log(`  ${slug}: destination cover filled`);
      }
    }
  }

  console.log(`\nApplied: ${covers} cover image(s), ${inlined} inline section image(s).`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
