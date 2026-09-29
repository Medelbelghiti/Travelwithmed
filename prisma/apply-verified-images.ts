import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { prisma } from "@/lib/prisma";

/**
 * Sources, scores and applies cover images for the destinations that have none.
 *
 * The judgement about WHICH photo is correct is separated from the mechanics of
 * writing it. Sourcing is mechanical and safe. Approval is a human step backed
 * by an evidence report. The apply step refuses anything it cannot verify.
 *
 * IMPORTANT on evidence: this model cannot view images. Nothing here decides that
 * a photo "looks right". A photo is only ever accepted on the strength of the
 * photographer's own Unsplash metadata - the geotag (city/country) and the
 * alt-text/tags - plus hard technical gates. Where that metadata does not name
 * the place, the candidate is reported as UNVERIFIABLE rather than guessed at.
 *
 * Usage
 *   npx tsx prisma/apply-verified-images.ts --source      refresh candidates + downloads
 *   npx tsx prisma/apply-verified-images.ts --recommend   evidence report, writes nothing
 *   npx tsx prisma/apply-verified-images.ts               dry run of .audit/approved-images.json
 *   npx tsx prisma/apply-verified-images.ts --apply       write the approved ids
 */

const APPROVAL_FILE = ".audit/approved-images.json";
const CANDIDATE_FILE = ".audit/image-candidates.json";
const REVIEW_DIR = ".audit/review";
const RECOMMEND_FILE = ".audit/recommended-images.json";

/** The 12 destinations with no cover image, each with a query for the place itself. */
const TARGETS: { slug: string; name: string; query: string; expect: string[] }[] = [
  { slug: "oceania", name: "Oceania", query: "sydney opera house harbour", expect: ["sydney", "australia", "opera house", "nsw", "new south wales"] },
  { slug: "united-states", name: "United States", query: "grand canyon arizona", expect: ["grand canyon", "arizona", "united states", "usa", "u.s."] },
  { slug: "canada", name: "Canada", query: "banff canada mountains lake", expect: ["banff", "alberta", "canada", "lake louise"] },
  { slug: "mexico", name: "Mexico", query: "chichen itza maya pyramid", expect: ["chichen", "chichén", "yucatan", "yucatán", "mexico", "méxico", "maya"] },
  { slug: "thailand", name: "Thailand", query: "bangkok wat arun temple", expect: ["bangkok", "thailand", "wat arun", "arun"] },
  { slug: "greece", name: "Greece", query: "santorini oia sunset", expect: ["santorini", "oia", "greece", "cyclades", "aegean"] },
  { slug: "portugal", name: "Portugal", query: "lisbon alfama tram", expect: ["lisbon", "lisboa", "portugal", "alfama"] },
  { slug: "egypt", name: "Egypt", query: "giza pyramids egypt", expect: ["giza", "pyramid", "egypt", "cairo"] },
  { slug: "south-africa", name: "South Africa", query: "table mountain cape town", expect: ["table mountain", "cape town", "south africa", "capetown"] },
  { slug: "brazil", name: "Brazil", query: "rio de janeiro sugar loaf mountain", expect: ["rio de janeiro", "rio", "brazil", "brasil", "sugarloaf", "pão de açúcar"] },
  { slug: "tanzania", name: "Tanzania", query: "serengeti wildebeest migration", expect: ["serengeti", "tanzania", "wildebeest", "migration", "maasai mara"] },
  { slug: "kenya", name: "Kenya", query: "masai mara safari", expect: ["masai mara", "maasai mara", "kenya", "narok"] },
];

/**
 * Subjects that would mislabel a destination cover, or that raise a licensing
 * problem. An alt-text or tag matching any of these disqualifies the candidate
 * regardless of how well it scores otherwise.
 */
const DISQUALIFY = [
  "portrait", "selfie", "wedding", "couple", "bride", "groom", "family",
  "interior", "restaurant", "menu", "food", "wine", "beer", "cocktail",
  "logo", "sign", "signage", "poster", "text", "neon", "graffiti",
  "concert", "festival", "nightclub", "crowd", "protest",
  "hospital", "prison", "military", "weapon", "casino", "strip club",
  "statue of liberty", "eiffel tower",
];

/** Confirmed HTTP 404 ids. An approval naming one of these is rejected. */
const DEAD = new Set([
  "photo-1501785888041-af3ef285b2aa",
  "photo-1508009603885-a5b2c675d8d0",
  "photo-1464824477268-36a28a1e2487",
]);

type Candidate = {
  id: string;
  photoId: string;
  raw: string;
  url: string;
  credit: string;
  pageUrl: string;
  desc: string;
  width: number;
  height: number;
  location: string;
  tags: string[];
  /** Set by --enrich: the search endpoint omits tags, /photos/{id} includes them. */
  enriched?: boolean;
};
type Report = Record<string, { name: string; query: string; expect: string[]; candidates: Candidate[] }>;

function loadKey(): string {
  const line = readFileSync(".env", "utf8").split("\n").find((l) => l.startsWith("UNSPLASH_ACCESS_KEY"));
  const k = line?.split("=")[1]?.trim().replace(/"/g, "");
  if (!k) throw new Error("UNSPLASH_ACCESS_KEY missing from .env");
  return k;
}

/**
 * The canonical photo id is embedded in the CDN url, NOT in x.id.
 * images.unsplash.com/photo-1509321528270-797a4f7c1485 -> photo-1509321528270-797a4f7c1485
 * Building the url from the short id produces a 404, which is what an earlier
 * version of this script did.
 */
function photoIdFrom(raw: string): string {
  const m = raw.match(/images\.unsplash\.com\/(photo-[A-Za-z0-9_-]+)/);
  if (!m) throw new Error(`cannot extract photo id from ${raw}`);
  return m[1];
}

function buildUrl(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1920&q=90`;
}

type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  urls: { regular: string };
  user: { name: string };
  alt_description: string | null;
  description: string | null;
  tags?: { title: string }[];
  location?: { name?: string | null; city?: string | null; country?: string | null; country_code?: string | null } | null;
  links: { html: string };
};

async function fetchCandidates(query: string): Promise<UnsplashPhoto[]> {
  const key = loadKey();
  const u = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape&content_filter=high`;
  const r = await fetch(u, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for "${query}"`);
  const j = (await r.json()) as { results: UnsplashPhoto[] };
  return j.results;
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const r = await fetch(url);
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 20_000) return false; // suspiciously small, treat as unusable
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function enrich(): Promise<void> {
  if (!existsSync(CANDIDATE_FILE)) throw new Error(`run --source first: ${CANDIDATE_FILE} missing`);
  const report = JSON.parse(readFileSync(CANDIDATE_FILE, "utf8")) as Report;
  const key = loadKey();
  let fetched = 0;
  const failures = new Map<string, number>();

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const t of TARGETS) {
    const r = report[t.slug];
    if (!r) continue;
    for (const c of r.candidates) {
      if (c.enriched) continue;
      let done = false;
      // Unsplash throttles bursts with 403 as readily as 429, so both are
      // retried with a growing pause rather than silently skipped.
      for (let attempt = 1; attempt <= 4 && !done; attempt++) {
        let res: Response;
        try {
          res = await fetch(`https://api.unsplash.com/photos/${c.id}`, {
            headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
          });
        } catch {
          // Transport-level failure ("fetch failed") happens after a burst of
          // requests on Windows. Treat it like a throttle and retry.
          failures.set("network", (failures.get("network") ?? 0) + 1);
          if (attempt === 4) break;
          await sleep(attempt * 3000);
          continue;
        }
        if (res.status === 429 || res.status === 403) {
          const wait = attempt * 4000;
          failures.set(`${res.status}`, (failures.get(`${res.status}`) ?? 0) + 1);
          if (attempt === 4) break;
          await sleep(wait);
          continue;
        }
        if (!res.ok) {
          failures.set(`${res.status}`, (failures.get(`${res.status}`) ?? 0) + 1);
          break;
        }
        const p = (await res.json()) as {
          tags?: { title: string }[];
          location?: { name?: string | null; city?: string | null; country?: string | null } | null;
        };
        c.tags = (p.tags ?? []).map((x) => x.title);
        const loc = [p.location?.name, p.location?.city, p.location?.country].filter(Boolean).join(", ");
        if (loc) c.location = loc;
        c.enriched = true;
        fetched++;
        done = true;
        await sleep(350);
      }
    }
  }

  writeFileSync(CANDIDATE_FILE, JSON.stringify(report, null, 2));
  const remaining = Object.values(report).reduce(
    (a, r) => a + r.candidates.filter((c) => !c.enriched).length,
    0,
  );
  console.log(`\n${fetched} enrichis, ${remaining} restants.`);
  if (failures.size > 0) console.log(`statut des echecs: ${[...failures].map(([k, v]) => `${k} x${v}`).join(", ")}`);
  if (remaining > 0) console.log("Relance --enrich : il reprend ou il n'a pas ete fait.");
}

async function source(): Promise<void> {
  mkdirSync(REVIEW_DIR, { recursive: true });
  const report: Report = {};
  const index: string[] = [];

  for (const t of TARGETS) {
    let photos: UnsplashPhoto[];
    try {
      photos = await fetchCandidates(t.query);
    } catch (e) {
      console.log(`${t.slug.padEnd(14)} ERREUR ${e instanceof Error ? e.message : e}`);
      continue;
    }

    const candidates: Candidate[] = [];
    for (const [i, x] of photos.entries()) {
      const photoId = photoIdFrom(x.urls.regular);
      const url = buildUrl(photoId);
      const loc = [x.location?.name, x.location?.city, x.location?.country, x.location?.country_code]
        .filter(Boolean)
        .join(", ");
      const c: Candidate = {
        id: x.id,
        photoId,
        raw: x.urls.regular,
        url,
        credit: x.user.name,
        pageUrl: x.links.html,
        desc: x.alt_description ?? "",
        width: x.width,
        height: x.height,
        location: loc,
        tags: (x.tags ?? []).map((t) => t.title),
      };
      const ok = await download(x.urls.regular, `${REVIEW_DIR}/${t.slug}-${i + 1}.jpg`);
      if (ok) {
        index.push(`${t.slug}-${i + 1}  ${c.id}  ${c.width}x${c.height}  ${c.desc || "(no alt text)"}`);
      }
      candidates.push(c);
    }

    report[t.slug] = { name: t.name, query: t.query, expect: t.expect, candidates };
    console.log(`${t.slug.padEnd(14)} ${candidates.length} candidats`);
  }

  writeFileSync(CANDIDATE_FILE, JSON.stringify(report, null, 2));
  writeFileSync(`${REVIEW_DIR}/INDEX.txt`, `candidat                      id Unsplash   dims      alt-text\n${index.join("\n")}\n`);
  console.log(`\n${CANDIDATE_FILE} + ${REVIEW_DIR}/ ecrits.`);
}

type Scored = {
  slug: string;
  n: number;
  photoId: string;
  score: number;
  verdict: "VERIFIED" | "UNVERIFIABLE" | "REJECTED";
  reasons: string[];
  desc: string;
  location: string;
  credit: string;
  pageUrl: string;
  dims: string;
};

function scoreCandidate(slug: string, n: number, c: Candidate, expect: string[]): Scored {
  const reasons: string[] = [];
  let score = 0;
  let verdict: Scored["verdict"] = "UNVERIFIABLE";

  const ratio = c.width / Math.max(1, c.height);
  if (ratio >= 1.4) {
    score += 15;
    reasons.push(`landscape ${ratio.toFixed(2)}:1`);
  } else {
    reasons.push(`NOT landscape (${ratio.toFixed(2)}:1) - card crops to 4:3`);
    return { slug, n, photoId: c.photoId, score: 0, verdict: "REJECTED", reasons, desc: c.desc, location: c.location, credit: c.credit, pageUrl: c.pageUrl, dims: `${c.width}x${c.height}` };
  }
  if (c.width >= 1600) {
    score += 5;
    reasons.push(`width ${c.width}`);
  }

  const hay = [c.desc, c.location, ...c.tags].join(" ").toLowerCase();
  const bad = DISQUALIFY.find((d) => hay.includes(d));
  if (bad) {
    return { slug, n, photoId: c.photoId, score: 0, verdict: "REJECTED", reasons: [...reasons, `disqualified: "${bad}"`], desc: c.desc, location: c.location, credit: c.credit, pageUrl: c.pageUrl, dims: `${c.width}x${c.height}` };
  }

  // Geotag is the strongest evidence: the photographer tagged where it was taken.
  const geoHits = expect.filter((e) => c.location.toLowerCase().includes(e));
  if (geoHits.length > 0) {
    score += 40;
    reasons.push(`geotag names the place: ${geoHits.join(", ")}`);
    verdict = "VERIFIED";
  }

  // The Unsplash page slug is free evidence: unsplash.com/photos/pyramid-of-egypt-...
  const pageSlug = decodeURIComponent(c.pageUrl).toLowerCase();
  const slugHits = expect.filter((e) => pageSlug.includes(e));
  if (slugHits.length > 0) {
    score += 20;
    reasons.push(`page slug names the place: ${slugHits.join(", ")}`);
    if (verdict !== "VERIFIED") verdict = "VERIFIED";
  }

  // Alt text and tags naming the place are the next best.
  const textHits = expect.filter((e) => `${c.desc} ${c.tags.join(" ")}`.toLowerCase().includes(e));
  if (textHits.length > 0) {
    score += 25 * Math.min(2, textHits.length);
    reasons.push(`alt/tags name the place: ${textHits.join(", ")}`);
    if (verdict !== "VERIFIED") verdict = "VERIFIED";
  }

  // A country cover does not need a landmark, but it must not be place-less:
  // "a lake surrounded by mountains" would be a plausible wrong continent.
  if (c.enriched === false) reasons.push("non enrichi (quota) - preuves absentes");
  if (verdict === "UNVERIFIABLE") reasons.push("no metadata names this place - needs a human eye");

  return { slug, n, photoId: c.photoId, score, verdict, reasons, desc: c.desc, location: c.location, credit: c.credit, pageUrl: c.pageUrl, dims: `${c.width}x${c.height}` };
}

async function recommend(): Promise<void> {
  if (!existsSync(CANDIDATE_FILE)) throw new Error(`run --source first: ${CANDIDATE_FILE} missing`);
  const report = JSON.parse(readFileSync(CANDIDATE_FILE, "utf8")) as Report;
  const out: Scored[] = [];
  const best: Record<string, string> = {};

  for (const t of TARGETS) {
    const r = report[t.slug];
    if (!r) continue;
    const scored = r.candidates.map((c, i) => scoreCandidate(t.slug, i + 1, c, r.expect ?? t.expect));
    out.push(...scored);
    const winners = scored.filter((s) => s.verdict === "VERIFIED").sort((a, b) => b.score - a.score);
    console.log(`\n=== ${t.slug} (${t.name}) ===`);
    for (const s of scored.sort((a, b) => b.score - a.score)) {
      const mark = s.verdict === "VERIFIED" ? "OK " : s.verdict === "REJECTED" ? "XX " : "?? ";
      console.log(` ${mark}#${s.n} score=${String(s.score).padStart(3)} ${s.photoId}  ${s.dims}`);
      console.log(`      ${s.desc || "(no alt text)"}`);
      if (s.location) console.log(`      geotag: ${s.location}`);
      for (const rr of s.reasons) console.log(`      - ${rr}`);
    }
    if (winners.length > 0) {
      best[t.slug] = winners[0].photoId;
      console.log(` -> meilleur: ${winners[0].photoId} (score ${winners[0].score})`);
    } else {
      console.log(` -> AUCUN candidat verifiable sur les metadonnees`);
    }
  }

  writeFileSync(RECOMMEND_FILE, JSON.stringify({ scored: out, best }, null, 2));
  const ok = Object.keys(best).length;
  console.log(`\n${ok}/${TARGETS.length} destinations avec un candidat verifiable. Rapport: ${RECOMMEND_FILE}`);
  if (ok < TARGETS.length) console.log("Les autres exigent un regard humain: aucune metadonnee ne nomme le lieu.");
}

function readApprovals(file: string = APPROVAL_FILE): Record<string, string> {
  if (!existsSync(file)) return {};
  // This file is hand-edited, and Windows editors happily save a UTF-8 BOM,
  // which JSON.parse rejects. Strip it rather than failing with a parse error.
  const raw = readFileSync(file, "utf8").replace(/^﻿/, "");
  return JSON.parse(raw) as Record<string, string>;
}

/** Accepts the short id shown in INDEX.txt, the photo-... id, or a full CDN url. */
function resolvePhotoId(value: string): string {
  const v = value.trim();
  if (v.includes("images.unsplash.com")) return photoIdFrom(v);
  if (v.startsWith("photo-")) return v;
  return v;
}

async function isAlive(url: string): Promise<{ ok: boolean; dims: string }> {
  try {
    const r = await fetch(url);
    if (!r.ok) return { ok: false, dims: "" };
    const buf = Buffer.from(await r.arrayBuffer());
    // JPEG SOF marker carries the real dimensions without an image library.
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { ok: true, dims: `${buf.readUInt16BE(i + 7)}x${buf.readUInt16BE(i + 5)}` };
      }
      i += 2 + len;
    }
    return { ok: buf.length > 20_000, dims: "unknown" };
  } catch {
    return { ok: false, dims: "" };
  }
}

async function run(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const override = process.argv.indexOf("--approvals");
  const approvalFile = override !== -1 && process.argv[override + 1]
    ? process.argv[override + 1]
    : APPROVAL_FILE;
  const approved = Object.entries(readApprovals(approvalFile));
  if (approved.length === 0) {
    console.log(`${approvalFile} absent ou vide. Rien a faire.`);
    return;
  }

  const report = existsSync(CANDIDATE_FILE)
    ? (JSON.parse(readFileSync(CANDIDATE_FILE, "utf8")) as Report)
    : ({} as Report);

  const rows = await prisma.destination.findMany({
    where: { slug: { in: approved.map(([slug]) => slug) } },
    select: { id: true, slug: true, name: true, coverImage: true },
  });
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  const plan: { slug: string; id: string; photoId: string; url: string; from: string | null; reason: string; credit: string; pageUrl: string }[] = [];
  const refused: { slug: string; value: string; reason: string }[] = [];

  for (const [slug, value] of approved) {
    const dest = byslug.get(slug);
    if (!dest) {
      refused.push({ slug, value, reason: "destination inconnue" });
      continue;
    }
    const raw = resolvePhotoId(value);
    // Prefer the id we actually sourced: proves it came from our own candidates.
    // A short id from the review sheet must resolve to the full canonical id,
    // otherwise buildUrl() would build a dead "photo-<short>" URL.
    const known =
      report[slug]?.candidates.find((c) => c.photoId === raw) ??
      report[slug]?.candidates.find((c) => c.photoId === `photo-${raw}` || c.id === value);
    if (!known) {
      refused.push({ slug, value, reason: "cet id ne vient pas de nos candidats; re-sourcer d'abord (--source)" });
      continue;
    }
    const photoId = known.photoId;
    if (DEAD.has(photoId)) {
      refused.push({ slug, value, reason: `${photoId} est dans la liste des ids morts` });
      continue;
    }
    const url = buildUrl(photoId);
    const live = await isAlive(url);
    if (!live.ok) {
      refused.push({ slug, value, reason: `HTTP en echec sur ${url}` });
      continue;
    }
    plan.push({
      slug, id: dest.id, photoId, url,
      from: dest.coverImage,
      reason: `${known.credit} | ${live.dims} | ${known.desc || "sans alt-text"}`,
      credit: known.credit, pageUrl: known.pageUrl,
    });
  }

  console.log(`mode: ${apply ? "APPLY (ecritures)" : "DRY RUN (aucune ecriture)"}\n`);
  for (const p of plan) {
    console.log(`  ${p.slug.padEnd(14)} ${p.photoId}  ${p.reason}`);
    console.log(`  ${"".padEnd(14)} ${p.url}`);
  }
  for (const r of refused) {
    console.log(`  REFUS ${r.slug.padEnd(14)} ${r.value}  -> ${r.reason}`);
  }
  console.log(`\n${plan.length} applicables, ${refused.length} refuses.`);

  if (!apply) {
    console.log("DRY RUN. Ajoute --apply pour ecrire.");
    return;
  }
  if (plan.length === 0) {
    console.log("Rien a ecrire.");
    return;
  }

  await prisma.$transaction(plan.map((p) => prisma.destination.update({ where: { id: p.id }, data: { coverImage: p.url } })));
  console.log(`\nAPPLIED: ${plan.length} images ecrites en une transaction.`);
  for (const p of plan) console.log(`  ${p.slug} credit ${p.credit} ${p.pageUrl}`);
}

async function main() {
  if (process.argv.includes("--source")) return source();
  if (process.argv.includes("--enrich")) return enrich();
  if (process.argv.includes("--recommend")) return recommend();
  return run();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
