# NEEDS_MY_INPUT.md

Everything I could not decide, verify, or execute without you. Nothing below
has been invented or worked around — each item is either blocked or would
require me to make up a fact.

**Updated:** 2026-10-18
**Branch:** `feature/content-upgrade`

---

## Priority 1 — blocks the import from running at all

### 1.1 Database credentials from this machine are rejected

Every write and read from this machine fails:

```
password authentication failed for user 'neondb_owner'
```

- Pooler: `ep-fancy-mud-zal67lhq-pooler.c-2.eu-west-2.aws.neon.tech` — port 5432 open
- Direct endpoint: `ep-fancy-mud-zal67lhq-pooler...` resolves, port 5432 open
- TCP reaches both; the password is refused. Not a firewall problem.

**What I need:** a working `DATABASE_URL`, or confirmation that the local `.env`
is simply stale and you will run the import yourself.

**Ready to run the moment this works:**

```
npm run import:convert -- --write    # already works, produces payloads
npm run import:db                    # dry run - opens no connection
npm run import:db -- --apply         # writes DRAFT rows
```

Verified: `import:db` dry run exits 0 and opens no connection.

**Related:** the credential that appeared in this session's earlier output should be
rotated in Neon, since it was pasted in plaintext.

---

## Priority 2 — facts I must not invent

### 2.1 Image licensing (105 images, 3 documents say it out loud)

Each of the three long documents ends with the author's own note:

> Image sources: … **Confirm reuse or licensing terms with the original source
> before commercial publication.**

| Document | Sources declared by the author |
|---|---|
| doc01 Albania | Nomads Travel Guide · Adventure Albania · Albanian Registry |
| doc02 Azores | Azores Getaways (×2) · Espaço Talassa |
| doc03 Georgia | Lonely Planet · Explore Georgia Tours · Georgian Eats |

Additionally, in the folders:

- `photos\` — 31 files, names like `Person_*_20260819…`. Several are identifiable
  people → **right of publicity** as well as copyright.
- `COVER PCTS\` — 16 files, `_202608182003`-style timestamps, provenance unknown.
- `*shutterstock.jpg`, `Mykonos-Area-Guide-Hero-min.jpg` → stock licences.

**Decision needed:** for each image source, either "I own these / I hold a licence
and accept the risk", or "skip these". Until then:

- `coverImage` and `ogImage` are imported as `null`
- no image file has been copied into the repository
- no image has been published

### 2.2 Author information

There is no author metadata anywhere in the source folder. To ship E-E-A-T I
need at least:

- display name for the byline
- one- or two-line bio
- whether the site has a single editorial voice or named contributors
- profile image (optional, and see 2.1)

I did **not** create an author record. `Article.authorId` and `authorName` are `null`.

### 2.3 Seven articles are too thin to publish

Word counts from the actual documents, not estimates:

| Doc | Article | Words |
|---|---|---|
| doc05 | Caribbean Travel Guide | 421 |
| doc06 | Florida Travel Guide | 382 |
| doc07 | Greece Travel Guide | 478 |
| doc08 | Italy Travel Guide | 420 |
| doc09 | Mexico Travel Guide | 397 |
| doc10 | Portugal Travel Guide | 375 |
| doc11 | Spain Travel Guide | 416 |

All seven are ~5 headings with no supporting prose. The import **refuses** them.

Pick one: extend them to 600+ words, or drop them.

---

## Priority 3 — configuration only you can supply

### 3.1 `AUTH_SECRET` on Hostinger

Local `.env` contains the literal placeholder:

```
change-me-to-a-long-random-string
```

If Hostinger's value is the same, session tokens are forgeable. Compare them and
rotate if they match. I cannot read Hostinger's environment from here.

### 3.2 Fourthwall — shop is off

`isShopEnabled()` (`src/lib/fourthwall.ts`) requires both:

- `FOURTHWALL_TOKEN`
- `FOURTHWALL_SHOP_DOMAIN`

Neither is set, so `/shop` returns 404 **by design**. It is excluded from the
sitemap and unlinked from every page (verified: 0 broken links).

**Decision:** enable it with real credentials, or keep it off. Phase 5 shop work
is parked until then.

### 3.3 Printables

- `src/app/printables/page.tsx` does not exist — only `printables/[slug]`
- `robots.txt` has `Disallow: /printables/`
- nothing links to it → 0 broken links

**Decision:** build an index page and index it, or leave it disallowed. I did not
publish an index for an inventory I cannot verify.

---

## Priority 4 — access I do not have

| Gap | What it blocks |
|---|---|
| Hostinger hPanel | purging the cache; the audit found the rated affiliate module and the "Book by destination" section are **missing in production although `main` contains them** — suspected stale CDN/`_next` cache. Until purged, Phase 7 QA measures a stale build. |
| Neon console | fixing 1.1 yourself, and confirming which credential is live |
| Search Console | baseline impressions/clicks, real crawl errors |
| GA4 | top landing pages for the 30-day content plan |
| Lighthouse / axe CLI | Phase 7 performance and accessibility scores — I have no runner |
| a real device | mobile visual QA |

---

## Decisions I made that you should confirm

These are structural, not factual, so I made them rather than stall. Say the word
if you want them changed.

| # | Decision | Rationale |
|---|---|---|
| 1 | Slugs `albania-tirana-albanian-riviera`, `azores-hidden-islands-nature-lovers`, `georgia-tbilisi-caucasus`, `best-summer-holiday-destinations` | Closest to the source titles, no keyword stuffing |
| 2 | New destinations `albania` (COUNTRY), `georgia` (COUNTRY), `azores` (REGION under existing `portugal`) | None of the three exist today — production has 75 destinations, none matching |
| 3 | Types: `DESTINATION_GUIDE` for doc01–03, `LISTICLE` for doc04 | doc01 reads as a destination guide rather than a bookable itinerary |
| 4 | All four imported as `status: DRAFT`, `publishedAt: null`, `allowIndexing: false` | Nothing goes live without you opening it in `/admin` |
| 5 | No `coverImage` | See 2.1 — blocked, not an oversight |
| 6 | Hub links to unavailable destinations are hidden rather than 404'd | The hub route itself serves 404 without inventory; the destination page was contradicting it (22 dead links) |
| 7 | ESLint pinned to `^9.39.0` | `eslint-plugin-react` ships no release supporting ESLint 10; lint crashed on every file |

---

## What is already done and needs nothing from you

- 4 documents converted to `ContentBlock[]`, validated by round-trip
- editorial notes (`Image sources:`, `Publishing note:`) stripped from reader text
- markdown, run-boundary gaps and separator artefacts cleaned
- 22 hub 404s removed (Phase 2)
- ESLint restored (was crashing on every file)
- 73 tests passing
