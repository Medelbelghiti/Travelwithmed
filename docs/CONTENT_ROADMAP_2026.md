# Content Roadmap — 2026

Status note (2026-09-28): the current record is `docs/AUDIT_2026-09-27.md`. Image and affiliate
state has moved on since this plan was written — see that file §4.0 (affiliate platform policy)
and §4.1 (cover images). In short: 22 dead images were repaired in production, 9 of 12 empty
country/region covers are resolved and 3 are still open, and every category Travelpayouts covers
now points at `tp.media`.

Date: 2026-09-27
Owner action required: every step below needs an editor or the site owner. Nothing here has been
published.

---

## 1. Where the content stands

**Live and indexed (5):** Paris, Rome, Barcelona, Bali, Tokyo. Written before the current house
structure, so they do not carry the new block layout, itineraries or internal links. See §5.

**Drafted, never published (10):** Marrakech, Fes, Chefchaouen, Casablanca, Agadir, Istanbul,
Lisbon, Dubai, London, Santorini. ~20,500 words of body copy, each with 3 CTAs, 5 FAQs, a 3-day
itinerary and 2–3 internal links. Seeded as `DRAFT` with `allowIndexing: false`, so they are
invisible to search and absent from the sitemap. 101 facts are flagged for verification.

**Not started:** images for 9 of the 10 drafts (§4).

---

## 2. Publishing sequence

The ten drafts form one Moroccan cluster and four standalone long-haul hubs. Publish in this
order, for two reasons: the cluster gives the site an internal-link hub immediately, and
publishing one guide proves the pipeline before nine more depend on it.

| # | Guide | Why here |
|---|---|---|
| 1 | Marrakech | Flagship. Already has a verified hero image. Links to Fes, Chefchaouen, Agadir. |
| 2 | Fes | Highest inbound interest in the cluster. |
| 3 | Chefchaouen | Links back into the cluster; short and cheap to verify. |
| 4 | Agadir | Coastal counterpoint to Marrakech; the only coast option in the cluster. |
| 5 | Casablanca | The gateway most readers land in before Marrakech. |
| 6 | Istanbul | First hub outside Morocco. |
| 7 | Lisbon | |
| 8 | London | Links to the live Paris and Rome guides. |
| 9 | Dubai | |
| 10 | Santorini | Strongest seasonality; last, so shoulder-season timing can be checked. |

Do not publish a guide before its cluster neighbours exist, or the internal links point at 404s.

---

## 3. Per-guide pre-publish checklist

1. Work through the guide's `needsVerification[]` in `prisma/seed-content-batch.ts`. Every price,
   duration, opening hour and numeric claim is unconfirmed by design. Nothing publishes without
   this.
2. Confirm the itinerary costs are still plausible for the current year.
3. Get a cover image, or accept the branded `/og` card deliberately (§4).
4. Check the meta description reads well in a search result — it is the same string as the
   excerpt, so it must work as both.
5. Set `status: PUBLISHED`, `publishedAt`, and `allowIndexing: true`. Do not edit
   `canonicalUrl`; the page sets it from the slug.
6. After publishing, confirm the URL appears in `sitemap.xml` and that the page emits valid
   Article, FAQPage and BreadcrumbList JSON-LD.

---

## 4. Images

`prisma/seed-images-batch.ts` handles assignment. It refuses to write any Unsplash ID that does
not return 200, and refuses any ID already used elsewhere in the repo unless the reuse is
recorded with a reason.

Current state: **all ten sourced and applied** — 9 covers and 20 inline images, every ID
HTTP-verified and checked for collision, every image carrying hand-written alt text. A second
`--apply` reports zero changes, so re-running is safe. The IDs are in
`docs/CONTENT_BATCH_PLAN.md` §6.

The key lives in `.env`, which is gitignored. Do not move it into a committed file.

Two image rules that must hold site-wide:

- Inline images are rendered in a fixed 1200×800 box with no `object-fit`, so anything placed
  inline must be a 3:2 crop. A photo in another ratio will be stretched.
- `prisma/seed-seo.ts` must not be re-run as-is. Several of its destination mappings point at the
  wrong city — Lisbon gets a Tokyo photo, London gets the Eiffel Tower, Athens gets the Colosseum.
  Details in `docs/FINAL_AUDIT.md` §6. **This is fixed as of 2026-09-28:** the wrong-city photos
  were repaired in production by `prisma/fix-dead-images.ts`, and `seed-seo.ts` was made
  non-destructive (repair-plus-fill, never overwriting a live curated value).
- **Country and region covers.** 12 destinations had no `coverImage` at all. 9 are now filled from
  Unsplash candidates whose photographer geotag or tags name the place; `greece`, `south-africa`
  and `kenya` remain open because no candidate's metadata named those places. Those 9 were chosen
  on metadata evidence, **not** on visual inspection — the model used cannot view images. Confirm
  them in `.audit/review.html` before they reach production.
- **Attribution.** Unsplash does not require it but requests it. The photographer and photo page
  are recorded in `.audit/image-candidates.json` for the 9 new covers; nothing on the site renders
  that credit yet.

---

## 5. The five live guides

Paris, Rome, Barcelona, Bali and Tokyo were excluded from the batch because an upsert would
replace published, indexed copy. This is a decision, not an oversight.

Recommended: **refresh in place.** The new guides are structurally better — block layout,
itineraries, internal links, consistent CTAs — and the existing five are the highest-value URLs on
the site, so they are the last thing to leave in an old format.

Conditions for doing it safely:

- Read the existing guide first. The published copy is the asset, and the traffic it earned.
- Keep the same slug and preserve `publishedAt` so rankings are not reset.
- Redirect any existing inbound links if a URL needs to change.
- Publish one, watch it for a week, then continue.

Until that is scheduled, treat these five as frozen. Do not let a future seed upsert over them.

---

## 6. Distribution

The site targets both search and AI answer engines. For this batch:

- Every guide has a unique focus keyword and four secondary keywords in `DESTINATIONS`.
- Secondary keywords are editorial guidance only; the schema has no field for them.
- JSON-LD is generated automatically from the content. The FAQ block produces the `FAQPage`
  markup, which is what makes a guide eligible for an AI answer citation. Five real questions
  per guide is the point, not decoration.
- Each guide carries a direct answer to its FAQ questions in the first paragraph under the
  relevant heading. That is the text an answer engine will quote.
- Re-check the sitemap after the first publish. Drafts are correctly excluded; the risk is a guide
  being published with `allowIndexing` left false, which would be indexable nowhere.

---

## 7. Metrics to watch after the first three guides

- Impressions and clicks per guide, 28 days after publish.
- Whether internal links produce clicks, which validates the link graph in §2.
- CTA click-through per category. A category with impressions but no clicks means the label or
  placement is wrong, not the destination.
- Any movement on the five live guides caused by the new Moroccan cluster linking near them.
