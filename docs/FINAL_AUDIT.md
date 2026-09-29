# Riversmag — Final Technical & Content Audit

Date: 2026-09-27
Superseded in part on 2026-09-28 by `docs/AUDIT_2026-09-27.md`, which is the current record.
Read that file for production state, the applied repairs, the affiliate platform policy
(`§4.0`) and the cover-image workflow (`§4.1`). This file is kept as the earlier baseline and
its reasoning trail; where the two disagree, the newer file is correct.
Scope: `riversmag.com` Next.js application, production affiliate and consent behaviour, the
15-destination content brief, and the image pipeline.
Method: source review, `npm run lint` / `typecheck` / `test` / `next build`, Prisma schema and
migration review, live HTTP checks against production, and an end-to-end run of the new seed
against a disposable local PostgreSQL cluster.

Everything below was verified in this session unless it is explicitly listed under
"Not verified".

---

## 1. Verdict

| Area | State |
|---|---|
| Affiliate link safety, click-ID integrity | Pass |
| Consent gating, analytics | Pass |
| Rate limiting on auth/API | Pass |
| Canonical host, redirect defence | Pass |
| Sitemap correctness | Pass |
| Article draft isolation | Pass — **one leak found and fixed** (§3) |
| JSON-LD output (Article, FAQPage, BreadcrumbList) | Pass |
| CTA monetisation wiring | Pass |
| Destination guide content brief | 10/15 delivered (§4) |
| 5 requested guides already live | Not rewritten — open decision (§5) |
| Destination cover images | **Defect found** (§6) |
| Image sourcing for the new guides | Blocked on an Unsplash key (§7) |

---

## 2. Security and monetisation (baseline commit `be30ca9`)

Confirmed by source review and live HTTP:

- `/out/<id>` returns 302 for a valid id and falls back to `https://riversmag.com/` for an
  invalid one. No open redirect.
- `associateid=roamora` is preserved through the redirect chain.
- Legacy Travelpayouts values are intact and were not "modernised":
  `marker=776824`, `trs=573241`, `https://tpembars.com/NTczMjQx.js?t=573241`, promo codes
  `ROAMORA10` / `ROAMORA15`.
- Click IDs are written in the same transaction as the click counter, so a failed counter write
  cannot orphan a click ID.
- GA and Plausible only initialise after explicit consent; the banner itself renders before
  consent so the choice is available.
- Login and API routes are rate limited, and the limiter is per-key rather than global.
- Non-`www` requests are 308-redirected to the canonical host.
- CSP is `Report-Only`. **Deliberate**: enforcement is deferred until violation reporting has
  been observed, because switching it on blind is how third-party tags get broken in production.
- Image `img-src` is host-restricted to the CDN the site actually uses.

---

## 3. Defect found and fixed this session

`src/app/articles/[slug]/page.tsx` — `fetchRelatedArticles()` did not filter on publication
status.

`fetchRelatedByDestination()` filters `status: "PUBLISHED"`, but the `RelatedArticle` query did
not. Any row pointing at a draft would therefore have rendered a clickable title on a **live**
page that 404s when followed. The new content batch makes this reachable immediately, because it
creates relations from draft guides.

Fixed by filtering `relatedArticle: { status: "PUBLISHED" }`, matching the sibling query.
Verified at runtime: with two guides published and the rest drafts, a published guide's
"Continue planning your trip" section shows only the published target.

Two further defects were found and fixed in the new seed while it was being exercised:

1. **Forward internal links were silently dropped.** Relations were written while each article was
   being written, so a guide linking to a guide written later resolved to nothing — Marrakech got
   0 of its 3 links. Linking now runs as a second pass after every article exists. Result: 22
   relations, every guide with 2–3 outbound links.
2. **`slugForLink()` could not resolve live guides.** It only searched the batch metadata, so
   London's links to Paris and Rome failed even though both articles exist. It now falls back to
   the `<key>-travel-guide` slug convention.

---

## 4. Content batch — 10 net-new guides

`prisma/seed-content-batch.ts`, verified end-to-end against a live database.

| | Result |
|---|---|
| Guides written | 10 (Marrakech, Fes, Chefchaouen, Casablanca, Agadir, Istanbul, Lisbon, Dubai, London, Santorini) |
| Body copy | 1,911–2,192 words each, all inside the 1,800–2,200 target |
| CTA blocks | exactly 3 per guide (HOTELS / FLIGHTS / ACTIVITIES), asserted at write time |
| FAQs | exactly 5 per guide, asserted at write time |
| Itineraries | 10 `Itinerary` + 30 `ItineraryDay` rows, `days = 3`, `isActive = false`, unpublished |
| Internal links | 22 declared, 2–3 outbound per guide; 28 stored `RelatedArticle` rows after reciprocation |
| Images | 9 covers + 20 inline 3:2 images, every ID HTTP-verified, all with alt text |
| Status | all `DRAFT`, `publishedAt = null`, `allowIndexing = false` |
| Facts flagged for a human | 101 items across the 10 guides |
| Categories | 10 `ArticleCategory` rows |

Runtime verification against a disposable database:

- A draft article URL returns **404**.
- A draft article is **absent** from `sitemap.xml`; a published one is **present**.
- A published guide emits `Article`, `FAQPage` (5 `Question` nodes) and `BreadcrumbList` JSON-LD.
- All 3 CTA blocks resolve to tracked `/out/<id>` links carrying the editorial label and the
  affiliate disclosure. No affiliate URL is hardcoded in content; resolution is by category at
  render time via `resolveAffiliateLink()`.
- `Article.wordCount` matches the actual `blocksToText()` count for every guide.
- `/out/<id>` returns **302** to the target and increments `clickCount` — checked on all ten.
- The related-card module lists only `PUBLISHED` targets, while the database still holds draft
  edges, which is the point of the filter added in §4.

No writes were made to production, and no guide has been published.

### A second thing the seed was missing

`seedArticle()` throws when a `Destination` row is absent, and the batch stopped on the fourth
guide: `Destination "casablanca" not found`. Five of the ten had no destination at all —
**Istanbul, London, Dubai, Casablanca, Agadir** return 404 on production and are missing from
`sitemap.xml` — along with three parent countries (Turkey, UAE, UK). Ten fully-written guides were
waiting on destination records that had never been created.

`prisma/seed-cities.ts` now creates those three countries and five cities with the same fourteen
fields the other 62 carry, and each new city reuses its own guide hero as its cover so the
destination page and the guide cannot drift apart. All five now return 200.

This is why the first dry-run reported `cover: 'og-fallback'` for nine guides. That column was not
reporting a missing photo; it was reporting a missing parent record.

---

## 5. The five live guides

Paris, Rome, Barcelona, Bali and Tokyo already have published, indexed guides. The brief also
asked for them. An upsert would have replaced live copy, so they were excluded.

**This is an open decision, not a completed item.** Options for the owner:

1. **Leave them** (current state). Zero risk. The cost is that five of the fifteen guides do not
   match the new house style or structure.
2. **Refresh in place.** Write new versions to the same slugs, preserving `publishedAt` so
   rankings are not reset. Requires reading each existing guide first, because the current
   published content is the asset being replaced.
3. **Publish as separate long-form articles** under new slugs, keeping the guides as the
   short-form entry point. No ranking risk, but creates two competing pages per destination.

Option 2 is the right one if the structural upgrade is wanted, and it needs the existing copy in
front of the writer.

---

## 6. Defect: destination cover images are largely placeholders

`prisma/seed-seo.ts` maps destinations to photos of the wrong city:

| Destination | Photo actually used | Depicts |
|---|---|---|
| lisbon | `photo-1540959733332-eab4deabeeaf` | Tokyo |
| london | `photo-1502602898657-3e91760cbb34` | Eiffel Tower |
| athens | `photo-1552832230-c0197dd311b5` | Colosseum / Rome |
| seoul, amsterdam | `photo-1540959733332-eab4deabeeaf` | Tokyo |
| singapore | `photo-1502602898657-3e91760cbb34` | Eiffel Tower |
| miami, los-angeles, san-francisco | `photo-1501785888041-af3ef285b2aa` | Rio de Janeiro |
| dubai, cairo | `photo-1533669955142-6a73332af4db` | generic desert |

**RESOLVED 2026-09-28.** Production writes were performed on 2026-09-28 after a verified
`pg_dump` backup, so "there is no production database access from here to check" no longer
applies. The wrong-city photos were repaired by `prisma/fix-dead-images.ts` (22 rows across
Destination, Article and SeoMetadata) and verified in production. `seed-seo.ts` was made
non-destructive and is now repair-plus-fill; it never overwrites a live curated value. See
`docs/AUDIT_2026-09-27.md` §0 and §3.1 for which script is authoritative.

`prisma/seed-images.ts` maps the same destinations correctly. Whichever seed last wrote each row
determines what production shows.

This is also why the new guides do **not** borrow IDs from `seed-seo.ts`. The only photo reused
for Marrakech is the one already serving as the Marrakech destination cover.

---

## 7. Image sourcing — resolved for all ten

`prisma/seed-images-batch.ts` verified every Unsplash ID over HTTP before allowing a write,
refused any ID already used elsewhere unless the reuse is explicitly recorded with a reason, and
injected 3:2 inline images idempotently. Both refusal paths were tested against the real code,
not a copy.

With `UNSPLASH_ACCESS_KEY` in `.env` (gitignored, never committed) all ten destinations are now
sourced: **9 covers and 20 inline images**, and a second `--apply` reported zero changes. The IDs
are tabulated in `docs/CONTENT_BATCH_PLAN.md` §6.

Worth recording as method, not just outcome:

- **The first result was frequently wrong.** Alt descriptions caught "blue concrete truck" for a
  Chefchaouen guide and "people walking in a tunnel" for Borough Market. Every candidate was read
  against its alt text and re-queried until the subject matched the section heading.
- **Four queries returned nothing usable** and were replaced rather than padded: Fes blue door,
  Casablanca corniche, Agadir kasbah, Santorini vineyard. Casablanca's Art Deco search returns only
  generic beige buildings, so the Hassan II Mosque took the hero instead and an arched tiled
  entryway went to "Top experiences" — the article claims nothing the photo does not support.
- **The 3:2 filter is enforced, not assumed.** The renderer crops to a hardcoded 1200x800 box, so
  a wrong-ratio photo would be silently cropped rather than flagged.
- `prisma/seed-seo.ts` was deliberately not used as an ID source: several of its mappings point at
  the wrong city (§6).

Nothing was invented. Every ID in the file was returned by the API and confirmed to serve.

---

## 8. Environment defect: local PostgreSQL is broken

`npm run build` runs `prisma migrate deploy` first, so no build can complete without a database.

- No PostgreSQL Windows service is registered.
- `C:\Users\pc\pgsql\data` does not exist; only the binaries remain at `C:\Users\pc\pgsql\pgsql\bin`.
- A throwaway cluster created with `initdb` starts correctly and accepts connections, then dies
  with `0xC0000142` when a child process is spawned.

`0xC0000142` is self-inflicted, not a platform fault: PostgreSQL was running fine, and the child
died when an over-long shell command was terminated and took the process tree with it. Starting
the postmaster detached, with its output redirected to a file rather than a pipe, keeps it alive.

**RESOLVED 2026-09-28.** A stable disposable cluster now runs on `127.0.0.1:55432`, database
`roamora`, default postgres credentials, and was used to exercise every repair script, the
affiliate migration (apply, rollback, idempotency) and the cover-image apply. Pass that host as
`DATABASE_URL` for local work rather than repointing `.env` at the throwaway cluster. The
connection string is deliberately not written down here — build it from host, port, database and
the default local credentials.

---

## 9. Not verified

- **Production state as of this file (2026-09-27).** Superseded: production was inspected and
  written on 2026-09-28, then the Neon credential was rotated. See `docs/AUDIT_2026-09-27.md` §0.
  The affiliate migration, the 9 cover images and the two inactive-link rendering guards are
  still **not** applied to production and remain unverified there.
- **No browser.** Core Web Vitals (LCP, CLS, INP) were not measured directly, and GA was not
  confirmed to fire after consent in a real session.
- **CSP remains report-only.** No violation data has been collected, so enforcement is not safe
  to switch on yet.
- **Article content quality is unverified by a human.** 101 facts are flagged in
  `needsVerification[]`; none have been checked against a source. The guides must not be
  published until they are.
- **No staging environment was used.** The seed was exercised against a disposable local cluster,
  so a staging run is still the correct next step before production.
