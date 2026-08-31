# Roamora — Travel Media & Affiliate Platform

Roamora is a production-ready, SEO-first travel media site built to monetize through affiliate marketing. It pairs a polished editorial front-end with a full content-management system for destinations, guides, itineraries, hotels, activities, products and centrally-managed affiliate links.

> **Plan smarter. Travel better.**

## Highlights

- **Affiliate engine** — every link lives in one table, is tracked through `/go/[id]` (click count, device, country, referrer, UTM) and can be attached to articles, destinations, hotels, activities or products. No hardcoded networks.
- **Deals & promos** — featured deals with promo codes and expiry dates are managed in the admin and surfaced on `/deals`, the homepage strip and partner CTAs.
- **Full admin** — articles (block editor + SEO fields), destinations tree, categories, authors, hotels, activities, products, affiliate links, media library, itineraries, site settings and analytics.
- **SEO tooling** — dynamic sitemap, robots.txt, schema.org (Article, FAQ, BreadcrumbList, ItemList, Hotel, TouristAttraction, WebSite), per-page Open Graph (with a dynamic branded OG image generator), canonicals, noindex support.
- **Hotel & activity catalogs** — dedicated detail pages (`/hotels/[slug]`, `/activities/[slug]`) with JSON-LD (Hotel, TouristAttraction), amenities/rooms, pros & cons, reviews, nearby options and a sidebar booking CTA.
- **Privacy-first analytics + dark mode** — cookieless Plausible (opt-in via env vars, off by default) and automatic dark mode following the OS `prefers-color-scheme` (zero JS).
- **Email capture** — newsletter forms in the footer, articles, destinations and lead-magnet printables (`/free-guides`) to grow your audience.
- **Trust & compliance** — affiliate disclosures, editorial policy, privacy/terms/cookie pages, cookie-consent banner, security headers, rate-limited public APIs.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS 4** (semantic design tokens, editorial serif + sans)
- **Prisma 7** + **PostgreSQL** (adapter-pg, `prisma.config.ts`)
- **next-auth** (credentials, role-based access), **next/og** ImageResponse

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env — set DATABASE_URL, AUTH_SECRET, ADMIN_EMAILS, NEXT_PUBLIC_SITE_URL
```

### 3. Database (PostgreSQL required)

On Windows without a service, a portable Postgres works well:

```bash
# one-time init (as user "postgres", password "postgres")
C:\Users\pc\pgsql\pgsql\bin\initdb.exe -D C:\Users\pc\pgdata -U postgres \
  --pwfile=C:\path\to\pw.txt --auth=scram-sha-256 --encoding=UTF8

# start (after every reboot)
C:\Users\pc\pgsql\pgsql\bin\pg_ctl.exe -D C:\Users\pc\pgdata -w start
```

Create the database, generate the client, migrate and seed:

```bash
# with psql: CREATE DATABASE roamora;
npm run db:generate
npm run db:migrate     # applies existing migrations (name-aware: npx prisma migrate dev --name init)
npm run db:seed        # demo content + admin user
npm run db:images      # assign high-quality images (Unsplash CDN) to seeded records
```

### 4. Run

```bash
npm run dev     # http://localhost:3000
```

Admin: `http://localhost:3000/admin/login` — seeded user is `admin@roamora.com` (password from `SEED_ADMIN_PASSWORD`, default `roamora-admin`).

## Monetizing with affiliate links

1. Add partners in **Admin → Affiliate Links** (`/admin/affiliate-links`). Fill the affiliate URL, optional tracking parameter (use `{click_id}` for dynamic IDs) and UTM campaign.
2. Optional **deal fields** promote the partner on `/deals` (deal title, promo code, expiry, featured).
3. Attach the link to an article, destination, hotel or activity so the right link resolves automatically.
4. Every CTA goes through `/go/[id]?placement=...` — the click is recorded (count, referrer, device, country, UTM content) before redirecting.
5. Watch performance in **Admin → Analytics** (clicks per category, top articles, live clicks).

Editing a link updates it site-wide instantly; contexts and auto-resolution live in `src/lib/affiliate.ts`.

## Content workflow

- Articles: `Admin → Articles`. Block editor supports headings, paragraphs, lists, FAQs, images, related itineraries and inline affiliate-link CTAs. SEO fields, canonical, indexing toggle, FAQ schema and reading time are handled automatically.
- Destinations: hierarchical tree (region → country → city) with practical info sections, FAQs, hotels/activities/itineraries/links attached.
- Itineraries: linked to an article or standalone, day-by-day plans with costs.
- All public DB-driven pages run `force-dynamic` so deploys don't require a live database.

## SEO notes

- Set `NEXT_PUBLIC_SITE_URL` to the production domain — it drives `sitemap.ts`, canonicals and OG URLs.
- Each page renders branded Open Graph images via `next/og` (`/og?title=…`); you can override with a cover image per article/destination.
- Static marketing pages are prerendered; content pages are server-rendered on demand.
- `sitemap.ts` includes destinations, articles, itineraries, hotels and activities detail URLs.

## Analytics & theming notes

- **Plausible** is cookieless and GDPR-friendly. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and `NEXT_PUBLIC_PLAUSIBLE_SRC` in `.env` to enable; leave empty to keep it completely disabled (script not loaded).
- **Dark mode** is automatic and follows the OS preference via `@media (prefers-color-scheme: dark)` in `globals.css` — no JavaScript toggle, no persisted cookies.
- **Images** are stored as CDN URLs (Unsplash) on each record. Run `npm run db:images` to (re)assign verified, crawlable image URLs to the seeded destinations, hotels, activities and products.

## Admin routing note

Admin routes live in two route groups to fix an auth redirect loop: the public shell `admin/layout.tsx` wraps static/leaf pages (`login`, `media`, ilk) while the authenticated shell `admin/(panel)/layout.tsx` guards and lays out every admin page under `(panel)/`. URLs are unchanged (`/admin/login`, `/admin/destinations`, etc.).

## Project structure

```
prisma/            schema, migrations, idempotent seed
src/app/           routes (public + /admin) and API routes
src/components/    UI, layout, home, affiliate cards, content renderer
src/lib/           prisma client, auth, seo, affiliate, content, rate-limit, site config
```

## Deployment (Vercel + managed Postgres)

1. Push to Vercel; add a Neon/RDS PostgreSQL instance.
2. Set env vars in Vercel (see `.env.example`); for multiple replicas, move rate limiting to a shared store (e.g. Upstash Redis) — see `src/lib/rate-limit.ts`.
3. Run `npx prisma migrate deploy` in CI/release (or `npm run db:migrate` locally against prod) — or `db:push` for a simpler flow.
4. Seed admin on first deploy: run `prisma db seed` with `DATABASE_URL` pointed at production.

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js dev / production build / serve |
| `lint` | ESLint |
| `typecheck` (`tsc --noEmit`) | TypeScript check |
| `db:generate` | Generate Prisma client |
| `db:migrate` | `prisma migrate dev` (creates + applies) |
| `db:push` | Push schema without migration files |
| `db:seed` | Seed demo content |
| `db:images` | Assign verified Unsplash CDN images to seeded records |

## License

Internal use / client project — not open-sourced by default.