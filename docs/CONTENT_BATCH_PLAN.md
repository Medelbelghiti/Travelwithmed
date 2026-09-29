# Destination Guide Batch — Editorial & Build Plan

Status note (2026-09-28): the current record is `docs/AUDIT_2026-09-27.md`. Section 6 below
describes the ten guides sourced by `seed-images-batch.ts`. Twelve **country and region** covers
were a separate, later gap; 9 of those 12 are now resolved and 3 remain open. See
`docs/AUDIT_2026-09-27.md` §4.1. Nothing in either batch has been applied to production since
2026-09-28.

Status: **Part B and Part C complete, exercised end-to-end against a disposable database.**
All 10 guides carry a verified hero plus two inline 3:2 photos, and five destinations that did
not exist at all have been added (§7). Nothing has been written to production; `--apply` has
never been run against production.
Scope: 15 magazine-quality destination guides, seeded as `DRAFT` — 10 net-new, 5 excluded as
live-content collisions (§1).

---

## 1. What already exists (verified against production, 2026-09-27)

`GET /articles/<slug>-travel-guide` returns `200` for five of the fifteen requested destinations:

| Destination | Slug | Status | Consequence |
|---|---|---|---|
| Paris | `paris-travel-guide` | 200 — live | Would collide |
| Rome | `rome-travel-guide` | 200 — live | Would collide |
| Barcelona | `barcelona-travel-guide` | 200 — live | Would collide |
| Bali | `bali-travel-guide` | 200 — live | Would collide |
| Tokyo | `tokyo-travel-guide` | 200 — live | Would collide |
| Marrakech, Fes, Chefchaouen, Casablanca, Agadir, Istanbul, Lisbon, Dubai, London, Santorini | — | 404 | Net-new, safe to create |

`Article.slug` is `@unique`. Seeding `rome-travel-guide` again would run an `upsert` **update** and
silently overwrite published, indexed content. That is not acceptable without an explicit decision.

Existing content inventory (from `prisma/seed.ts` + `prisma/seed-articles-1..7.ts`):
65 article slugs total, clustered around Rome, Bali, Kyoto/Osaka, Tokyo, plus general travel-tips
content. Morocco has a country destination and the cities Marrakech, Fes, Tangier, Chefchaouen,
Essaouira — but only one Morocco article (`best-things-to-do-in-marrakech`). Morocco is the single
largest editorial hole in the site.

---

## 2. Technical findings that change the brief

These were found by reading the code, not assumed. Each one alters how the batch must be built.

1. **Status enum is uppercase.** `ArticleStatus` is `DRAFT | REVIEW | PUBLISHED | SCHEDULED | ARCHIVED`
   (`prisma/schema.prisma:78`). The brief's `status = "draft"` maps to `DRAFT`.
2. **No hardcoded affiliate URLs needed — and none will be used.** The `cta` block takes a
   *category*, not a URL: `{ type: "cta", category: AffiliateCategory, destinationSlug, placement, label }`
   (`src/lib/content.ts:12`). `resolveAffiliateLink()` (`src/lib/affiliate.ts:228`) then resolves
   article-specific → destination-specific → any-active link for that category.
   Existing seeds additionally pair each `cta` with an `affiliate_link` block carrying a
   **hardcoded cuid fallback** (e.g. `"cmthy4mmf001ddsvjqgh8lluh"`). This batch will **not** copy that
   pattern — a dead fallback ID renders a broken CTA. `cta`-only is the correct approach and
   satisfies "never hardcode a URL".
3. **Part D JSON-LD requires zero code changes.** `src/app/articles/[slug]/page.tsx` already emits
   `articleSchema` (line 119), `FAQPage` auto-derived from any `faq` block (lines 129–142), and
   `BreadcrumbList` (lines 154–167). Adding a `faq` block is all that is needed for FAQ schema.
4. **Sitemap will not list drafts — by design.** `src/app/sitemap.ts` is gated on published,
   data-qualified records. The 15 articles appear automatically *after* an editor publishes them.
   No sitemap edits, and nothing to verify until publish.
5. **Inline `image` blocks are supported but unused, and are aspect-locked.**
   `src/components/content-renderer.tsx:96` renders every inline image at a hardcoded
   `width={1200} height={800}` with no `object-fit`. A non-3:2 image renders **stretched**.
   Any Part C inline image must therefore be requested as `?w=1200&h=800&fit=crop`.
   All 65 existing articles use zero inline image blocks; the new ones will match until Part C lands.
6. **The Unsplash Source-URL fallback in the brief no longer exists.** Unsplash retired
   `source.unsplash.com`; those URLs no longer resolve. The repo's working approach
   (`prisma/seed-images.ts`) is direct `https://images.unsplash.com/photo-<id>` CDN URLs with
   hand-verified photo IDs. Part C must extend that registry, not switch to Source URLs.
7. **No Unsplash API key is configured.** `.env` contains only `ADMIN_EMAILS`, `AUTH_SECRET`,
   `DATABASE_URL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SITE_NAME`,
   `NEXT_PUBLIC_SITE_TAGLINE`, `NEXT_PUBLIC_SITE_URL`. Without a key, photo IDs cannot be resolved
   programmatically and **must not be guessed** — a fabricated ID is a broken image in production.
   See §6.
8. **One 3-day itinerary per article is exactly right.** `Itinerary.articleId` is `@unique`
   (`prisma/schema.prisma:316`), a strict 1:1 with `Article`, and `ItineraryDay` already models
   `dayNumber / title / location / description / activities / restaurants / hotel /
   transportation / estimatedCost`. No schema change required.
9. **Word count is derived, not authored — and the two numbers differ.** The seed helper runs
   `blocksToText()` (`src/lib/content.ts:78`) for the `wordCount` field, and that function counts
   the season table, the cost table, the FAQ block and the CTA labels as well as the prose. The
   1800–2200 target is therefore measured against **body copy only** (p/h2/h3/ul/ol), which is what
   a reader actually reads. The script reports both: `bodyWords` and `totalWords`. The Marrakech
   flagship lands at 2,032 body words / 2,401 total.
10. **Local PostgreSQL is unusable for verification.** It starts then crashes on first connection
    (0xC0000142). Content correctness will be verified by `tsc` + block-shape assertions, not by
    reading rows back.

---

## 3. Editorial approach

- **Voice:** a working travel journalist with a point of view — not a listicle. Each guide gets its
  own thesis, its own opening move, and its own rhythm. No two guides share a section-opening
  formula. No "Nestled in the heart of…".
- **Honesty rule:** no first-person trips that did not happen, no invented reviews, no invented
  ratings, no "we stayed at". The site voice is research-based; existing seeds already use it
  ("Rome is three thousand years of history stacked on a walkable scale…").
- **Fact discipline:** every price, duration, temperature and opening-hour claim is written with a
  hedge — "typically", "roughly", "in recent seasons", "check locally" — and simultaneously recorded
  in that article's verification list inside the seed file. Numbers are never presented as
  permanent fact.
- **Anti-fluff:** each guide carries specifics only a practitioner would know — which taxi rank is
  which colour, which souk sells what, which neighbourhood is quiet at which hour, which mosque
  restricts non-Muslim entry, where the plastic-bag ban actually bites.
- **Local texture is mandatory per destination:** 2–3 neighbourhood names, 1–2 transit realities,
  2+ etiquette notes, and a shoulder-season discussion that is not "summer is best".

---

## 4. The 15 guides — metadata and search intent

Titles are written to <60 characters; meta descriptions to <155 characters. Keyword sets are derived
from real query intent (informational trip-planning vs. commercial "where to stay / how to get there"),
not from a keyword tool guess.

| # | Destination | Slug | Primary keyword | Secondary keywords (4) |
|---|---|---|---|---|
| 1 | Marrakech | `marrakech-travel-guide` | marrakech travel guide | marrakech riad, souks in marrakech, marrakech vs chefchaouen, getting around marrakech |
| 2 | Fes | `fes-travel-guide` | fes travel guide | fes medina, tanneries in fes, morocco craftsmanship, fes vs marrakech |
| 3 | Chefchaouen | `chefchaouen-travel-guide` | chefchaouen travel guide | blue city morocco, chefchaouen day trip, rif mountains, chefchaouen photography |
| 4 | Casablanca | `casablanca-travel-guide` | casablanca travel guide | hassan ii mosque, casablanca medina, rabat day trip, morocco business travel |
| 5 | Agadir | `agadir-travel-guide` | agadir travel guide | agadir beach, agadir tagine, atlas mountains from agadir, surf retreat morocco |
| 6 | Paris | `paris-travel-guide` ⚠ | — COLLISION — decision required | — |
| 7 | Rome | `rome-travel-guide` ⚠ | — COLLISION — decision required | — |
| 8 | Barcelona | `barcelona-travel-guide` ⚠ | — COLLISION — decision required | — |
| 9 | Istanbul | `istanbul-travel-guide` | istanbul travel guide | hagia sophia, bosphorus ferry, istanbul neighborhoods, turkey eSIM |
| 10 | Lisbon | `lisbon-travel-guide` | lisbon travel guide | lisbon tram 28, alfama, lisbon miradouros, portugal day trips |
| 11 | Bali | `bali-travel-guide` ⚠ | — COLLISION — decision required | — |
| 12 | Tokyo | `tokyo-travel-guide` ⚠ | — COLLISION — decision required | — |
| 13 | Dubai | `dubai-travel-guide` | dubai travel guide | dubai burj khalifa, dubai desert safari, dubai with kids, emirates travel |
| 14 | London | `london-travel-guide` | london travel guide | london transport pass, borough market, london neighborhoods, rainy day in london |
| 15 | Santorini | `santorini-travel-guide` | santorini travel guide | santorini oia, santorini caldera, santorini without a car, santorini ferry from athens |

### Per-guide signature angle (so no two read alike)

- **Marrakech** — the medina as a maze you learn to walk; riad vs. hotel Gueliz tradeoff; the
  licensed-guide-badge system at Jemaa el-Fnaa.
- **Fes** — the most intact medieval city in the region; tannery terraces (overpowering by design);
  the crafts economy and where to buy without the hard sell.
- **Chefchaouen** — a mountain town, not a theme park; the Rif trail network; photography ethics.
- **Casablanca** — the Morocco that actually looks like today: Art Deco, the new tram, business
  traveller rhythm, Hassan II's enormity.
- **Agadir** — the beach-resort counterweight; anti-tourism friction (the "Agadir test" discourse),
  kasbah ruins, the banana trade.
- **Istanbul** — two continents, one commute; ferry beats traffic; the museum-pass maths.
- **Lisbon** — seven hills and a yellow tram; the tram-28 etiquette; miradouro sunset strategy.
- **Dubai** — air-conditioning as national infrastructure; desert vs. skyline split; Ramadan
  operating rhythm.
- **London** — zones, not attractions; the Oyster/contactless maths; why the museum is the
  weather plan.
- **Santorini** — the caldera geography that explains everything; pre-booking pressure and how to
  avoid it; ferry/flight tradeoffs.

---

## 5. Fixed structure applied to every guide (Parts B, C, D)

Every article body is `ContentBlock[]` from `src/lib/content.ts` — no new structures invented.

1. Hook (2–3 sentences, no cliché opener) — `p`
2. "Best time to visit" with shoulder-season nuance — `h2`, `p`, `table` (season × crowd × price)
3. "Where to stay" by neighbourhood — `h2`, `p`, `ul` → **`cta` HOTELS** ← CTA slot 1
4. "Top experiences" (6–8, each with a *why it matters* line) — `h2`, `h3`, `p`
5. "Getting there and getting around" — `h2`, `p`, `ul` → **`cta` FLIGHTS** ← CTA slot 2
6. "What it costs" — `h2`, `table` (budget / mid / luxury bands, labelled estimates)
7. "Local etiquette and practical tips" (4–5 non-obvious) — `h2`, `ul`
8. Closing paragraph with a soft recommendation — `p` → **`cta` ACTIVITIES** ← CTA slot 3
9. FAQ (5 real questions) — `faq` block, which auto-generates `FAQPage` schema

Exactly three `cta` blocks per article, one each of HOTELS / FLIGHTS / ACTIVITIES, resolved by
category at render time. No `affiliate_link` blocks with hardcoded IDs.

### Internal linking (Part D, 2–3 per article)

Written as `RelatedArticle` rows — the same relation `prisma/seed-articles-5/6/7.ts` already
creates, and the one `src/app/articles/[slug]/page.tsx:350` renders as clickable `ArticleCard`s
under "Continue planning your trip". The `p` renderer has no markdown support
(`src/components/content-renderer.tsx:70`), so a raw `<a>` in body copy is not an option; the
relation table is the only way to get a real clickable internal link without inventing a block
type. Links between two guides in this batch are written **both ways** so no guide is a dead
end. Targets missing from the database are skipped, never invented. Plain-text destination
references remain in the prose as well.

Also hardened while building this: `fetchRelatedArticles` did not filter on status, so a
`RelatedArticle` row pointing at a draft would have put a 404 link on a live page. It now filters
`relatedArticle: { status: "PUBLISHED" }`, matching `fetchRelatedByDestination`.

Resulting link graph as seeded:

- Marrakech → Fes, Chefchaouen, Agadir
- Fes → Marrakech, Chefchaouen
- Chefchaouen → Marrakech, Fes
- Casablanca → Marrakech, Chefchaouen
- Agadir → Marrakech, Casablanca
- Istanbul → Dubai, London
- Lisbon → London, Santorini
- Dubai → Istanbul, London
- London → Paris, Rome, Lisbon
- Santorini → Istanbul, Lisbon

Paris and Rome are live articles, so those two relations point at existing rows; the Moroccan
cluster and the five long-haul hubs link to each other.

### 3-day itineraries (Part D)

One `Itinerary` + three `ItineraryDay` rows per article, `days = 3`, linked 1:1 via `articleId`.
Written to the existing field set only; `estimatedCost` per day in USD, flagged as an estimate.

---

## 6. Part C image automation (BUILT — all 10 destinations sourced and applied)

Implemented as `prisma/seed-images-batch.ts`, additive and idempotent. It verifies every
Unsplash ID over HTTP before allowing a write, refuses any ID already used elsewhere in the repo
unless the reuse is recorded in `ALLOWED_SHARED` with a reason, and injects inline images matched
by `src` so a second run is a no-op. Both refusal paths were tested against the real code.

- **Sourced and applied:** all ten. Nine covers and 20 inline 3:2 images; a second `--apply`
  reported `0 cover image(s), 0 inline section image(s)`, confirming idempotence. See the table
  below for the IDs.
- **How they were found.** `unsplash.com/napi/search` answers 401 to unauthenticated clients, so
  discovery needs a key. With `UNSPLASH_ACCESS_KEY` in `.env` (gitignored), the API was queried
  per destination with `orientation=landscape&content_filter=high`, filtered to exactly 3:2 for
  inline images, and de-duplicated against the 40 photo IDs already in the repo.
- **The first pick was not taken.** Several top results were off-subject — "blue concrete truck"
  for Chefchaouen, "people walking in a tunnel" for Borough Market — so each candidate was read
  against its alt description and re-searched until the subject matched the heading. Four queries
  returned nothing usable and were replaced (below).
- Do not source IDs from `prisma/seed-seo.ts` to fill the gaps. Several of its destination
  mappings point at the wrong city — see `docs/FINAL_AUDIT.md` §6.

Requested parameters, once IDs exist:

- **Hero/OG:** ≥1600px wide, `?auto=format&fit=crop&w=1600&q=80`, unique across the site.
- **Inline section images:** `?auto=format&fit=crop&w=1200&h=800&q=80`, to satisfy the renderer's
  hardcoded 3:2 box (finding §2.5), with hand-written keyword alt text and a caption.
- **OG-image precedence:** unchanged and already correct — a null `coverImage` falls back to
  `next/og` branded generation via `src/lib/seo.ts`, a custom cover wins when set.

### Sourced images — all ten verified, none generated

Every ID below was returned by the Unsplash API, checked individually against the alt
description, filtered to landscape (hero) or exactly 3:2 (inline), confirmed to return HTTP 200,
and tested for collision against the other 40 photo IDs already in the repo. A rejected first
pick is why some alt text reads more specifically than the query that produced it.

| Destination | Hero | Inline — "Where to stay" | Inline — "Top experiences" |
|---|---|---|---|
| Marrakech | `photo-1597212618440` | `photo-1545324418-cc1a` | `photo-1539020140153` |
| Fes | `photo-1758185282460` | `photo-1769429385098` | `photo-1767936925033` |
| Chefchaouen | `photo-1697549780805` | `photo-1654683407553` | `photo-1759234119876` |
| Casablanca | `photo-1758382255691` | `photo-1624805151765` | `photo-1767936925324` |
| Agadir | `photo-1665303655457` | `photo-1665303655058` | `photo-1665303655050` |
| Istanbul | `photo-1769299118857` | `photo-1647221432456` | `photo-1623621534850` |
| Lisbon | `photo-1585208798174` | `photo-1702758045561` | `photo-1777899623496` |
| Dubai | `photo-1512453979798` | `photo-1785671366882` | `photo-1576159470850` |
| London | `photo-1740598609321` | `photo-1662714212039` | `photo-1789784160311` |
| Santorini | `photo-1761047726930` | `photo-1781455495654` | `photo-1743427522092` |

Selection notes worth keeping:

- **Casablanca's hero is the Hassan II Mosque**, not an Art Deco street. Searches for "Art Deco"
  return generic beige buildings, so the two cities' most recognisable landmark took the hero and
  an arched tiled entryway went to "Top experiences".
- **Agadir's hero and its "Where to stay" image are both by the same photographer** (a local, by
  the look of the series). Reusing a photographer across one city is fine; it is not a duplicate.
- **The Santorini vineyard query returns two results site-wide, neither 3:2.** The section image
  is a wine terrace at sunset instead, which is the experience the heading promises.
- **London's hero is the South Bank**, and it doubles as the new `london` destination cover.
  The five destinations added in §7 reuse their own hero as the destination cover on purpose, so
  the guide and the destination page cannot drift apart; those five are declared in
  `ALLOWED_SHARED` with that reason, so the duplicate check still holds.

---

## 7. Facts requiring human verification before publish

Each article's seed entry carries its own `needsVerification[]` list in the file. Global classes:

- **Prices** — all Moroccan dirham, euro, and USD figures; hotel and hammam rates; taxi fares.
- **Transport durations** — Marrakech airport transfer, Casablanca–Marrakech rail, Marrakech–Fes
  road/rail, Cairo-style intercity timings.
- **Opening hours / access** — Koutoubia interior access for non-Muslims, Ben Youssef Madrasa,
  Bahia Palace, Majorelle Garden, Hassan II Mosque, Oia sunset access, London museum hours.
- **Entry fees** — every monument, tower climb, and day-pass price.
- **Visa rules** — per nationality, per country, and seasonal; *no* article will assert a visa
  outcome. Articles say "check the current requirement for your passport" and the specifics go on
  the verification list.
- **Seasonal patterns** — "red days", Ramadan opening rhythm, high-season price direction.
- **Numeric facts** — Koutoubia height, Sahara distances, any UNESCO inscription year.
- **Safety guidance** — phrased as general, sourced-to-locals advice, never as an assurance.

---

## 7b. Five of the ten destinations did not exist

Found by running the seed, not by reading it. `seedArticle()` resolves a `Destination` row and
throws if it is missing, so the batch failed on the fourth guide with:

```
Error: Destination "casablanca" not found. The guide cannot be published without it.
```

Checked against production rather than the local seed: `/destinations/istanbul`, `/london`,
`/dubai`, `/casablanca` and `/agadir` all return **404** and are absent from `sitemap.xml`. The
guides had been written for destinations the site had never had. Their parent countries were
missing too — `turkey`, `united-arab-emirates` and `united-kingdom` are all absent — while
`morocco` already existed for Fes and Chefchaouen.

Added to `prisma/seed-cities.ts`:

- **3 countries** — Turkey, United Arab Emirates, United Kingdom, each under its existing region.
- **5 cities** — Casablanca and Agadir under Morocco; Istanbul under Turkey; Dubai under the UAE;
  London under the UK, with the same fourteen fields the other 62 cities carry.

Each new city also gets a `coverImage` in `CITY_IMAGES`, and those five are the batch heroes, so
the destination page and the guide show the same photograph. `seed-cities.ts` only writes an image
where `coverImage` is currently null, so re-running it never overwrites an existing cover.

This is also why the earlier dry-run table showed `cover: 'og-fallback'` for nine guides: not an
image problem, a missing parent record. The `og-fallback` was the symptom, and would have stayed
invisible in production because the guides would have failed to write at all.

---

## 8. Build sequence (after approval)

1. ~~Write all guides into `prisma/seed-content-batch.ts`, `status: "DRAFT"`, `publishedAt: null`,
   `allowIndexing: false`, following the existing `upsertArticle()` pattern from
   `prisma/seed-articles-1.ts:13`.~~ **Done** — 10 net-new guides, ~20,500 words of body copy.
2. ~~Include the three-day itineraries.~~ **Done** — 10 `Itinerary` + 30 `ItineraryDay` rows,
   `days = 3`, `isActive: false`, `publishedAt: null`.
3. ~~Dry-run guard: script aborts unless `--apply` is passed, and logs a per-article table before
   touching data.~~ **Done**, with three hard assertions that throw on `--apply`: exactly 3 CTA
   blocks in the order HOTELS/FLIGHTS/ACTIVITIES, exactly 5 FAQ entries, exactly 3 itinerary days.
   The dry-run table also warns on any guide outside 1,800–2,200 body words.
4. Internal links written as `RelatedArticle` rows in a second pass, so a guide linking to one
   written later is not silently dropped. **Done and verified**: 22 declared links, 2–3 outbound
   per guide, resolving to 28 stored rows once the reciprocal pass runs. Two bugs were found and
   fixed here — forward links resolved to nothing, and `slugForLink()` could not resolve the live
   Paris/Rome targets London's graph depends on.
5. **Add the five missing destinations and three countries** (§7b). **Done** in
   `prisma/seed-cities.ts`; all five now return 200 and appear in the sitemap.
6. **Database and build unblocked.** The local PostgreSQL data directory was missing, and the
   `0xC0000142` crashes were self-inflicted: the postmaster was healthy and died only when a
   long-running shell command was killed and took its process tree with it. Started detached with
   output redirected to a file, it stays up. The seed, the image seed and `next build` were then
   all exercised against a disposable cluster on port 55432.
7. **Runtime verification** (disposable cluster): all 10 drafts return 404 and stay out of
   `sitemap.xml`; published guides emit Article + 5-question FAQPage + BreadcrumbList JSON-LD;
   all 3 CTA blocks resolve to tracked `/out/<id>` links that 302 and increment `clickCount`; the
   related-card module shows only `PUBLISHED` targets; every guide carries its hero, its OG image
   and two inline images with alt text.
8. **Sourcing all ten guides** via `prisma/seed-images-batch.ts` (§6). **Done**: 9 covers and 20
   inline images written, and a second `--apply` reports zero changes, so the script is idempotent.
9. On approval: run against staging first, then production. A staging run is still the correct
   next step — the cluster used here was disposable and had no production-shaped data.
10. Only after editorial review and publish: verify sitemap pickup and JSON-LD live.

## 9. Effort note

Ten net-new guides at 1800–2200 words is roughly 20,000 words of original editorial writing. All
ten are now drafted in full in `prisma/seed-content-batch.ts`, ranging 1,911 (Casablanca) to 2,192
(Fes) body words, each with 3 CTA blocks, 5 FAQs, a 3-day itinerary, 2–3 internal links and
9–11 flagged facts — 101 verification items in total. Lint, typecheck, all 35 tests,
`prisma validate` and `next build` pass, and the seed has been run end-to-end against a
disposable database.

Note on numbering: the brief lists 15 destinations, but Paris, Rome, Barcelona, Bali and Tokyo
already have live, indexed guides, so **10 are net-new** and **5 await a collision decision** — see
§1. No destination has been dropped silently.

One measurement note: the `out/in total` counts in the runtime check exceed the 22 declared links
because the model stores the two directions separately (`relatedArticlesA` and `relatedArticlesB`).
22 is the editorial figure — what a person would write in each guide — and 28 is the stored row
count after reciprocation. Both are correct; they are not two different bugs.
