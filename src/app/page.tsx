import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { DestinationCard } from "@/components/destination-card";
import { ArticleCard } from "@/components/article-card";
import { HotelCard } from "@/components/affiliate/hotel-card";
import { ActivityCard } from "@/components/affiliate/activity-card";
import { SectionHeading } from "@/components/ui/card";
import { NewsletterForm } from "@/components/newsletter-form";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const STYLE_GUIDES = [
  { name: "Budget Travel", slug: "budget-travel", description: "Spend less, travel more", href: "/travel-tips" },
  { name: "Luxury Travel", slug: "luxury-travel", description: "The finest stays and experiences", href: "/travel-tips" },
  { name: "Solo Travel", slug: "solo-travel", description: "Designed for going solo", href: "/travel-tips" },
  { name: "Family Travel", slug: "family-travel", description: "Trip plans the whole family will love", href: "/travel-tips" },
  { name: "Adventure", slug: "adventure", description: "For the thrill-seekers", href: "/activities" },
  { name: "Digital Nomad", slug: "digital-nomad", description: "Work from anywhere", href: "/resources" },
];

export default async function HomePage() {
  const [trendingDestinations, featuredArticles, latestArticles, hotels, activities, itineraries, gear, deals] =
    await Promise.all([
      prisma.destination.findMany({
        where: { isActive: true, type: { in: ["CITY", "COUNTRY"] } },
        include: { _count: { select: { articles: true } } },
        orderBy: { sortOrder: "asc" },
        take: 8,
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { author: true },
        orderBy: [{ publishedAt: "desc" }, { viewCount: "desc" }],
        take: 6,
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { author: true },
        orderBy: { publishedAt: "desc" },
        take: 8,
      }),
      prisma.hotel.findMany({
        where: { isActive: true },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
        orderBy: [{ guestRating: "desc" }, { sorts: "asc" }],
        take: 6,
      }),
      prisma.activity.findMany({
        where: { isActive: true },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
        orderBy: { rating: "desc" },
        take: 6,
      }),
      prisma.itinerary.findMany({
        where: { isActive: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
        orderBy: { rating: "desc" },
        take: 6,
      }),
      prisma.affiliateLink.findMany({
        where: { active: true, featuredDeal: true, OR: [{ dealExpiresAt: null }, { dealExpiresAt: { gt: new Date() } }] },
        orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
        take: 3,
      }),
    ]);

  return (
    <>
      <Hero />

      {/* Deals strip */}
      {deals.length > 0 && (
        <section className="border-b border-line bg-brand-light/60">
          <div className="container-x py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex shrink-0 items-center gap-2">
                <BadgePercent className="h-5 w-5 text-brand" aria-hidden />
                <Link href="/deals" className="font-serif text-lg font-semibold text-brand hover:text-brand-dark">
                  Editor-picked deals
                </Link>
              </div>
              <div className="flex flex-1 flex-wrap gap-2">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/out/${deal.id}?placement=home-deals`}
                    rel="nofollow sponsored"
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{deal.partnerName}</span>
                    {deal.dealTitle ?? deal.productName}
                    {deal.promoCode && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-xs font-semibold text-accent-dark">
                        {deal.promoCode}
                      </span>
                    )}
                  </Link>
                ))}
                <Link
                  href="/deals"
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  View all deals <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending destinations */}
      {trendingDestinations.length > 0 && (
        <section className="container-x section-pad">
          <SectionHeading
            eyebrow="Trending now"
            title="Trending destinations"
            description="Where the Roamora community is dreaming about right now."
          />
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {trendingDestinations.map((d) => (
              <DestinationCard key={d.id} destination={{ ...d, articleCount: d._count.articles }} />
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link href="/destinations" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">
              Explore all destinations <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>
      )}

      {/* Featured guides */}
      {featuredArticles.length > 0 && (
        <section className="section-pad bg-sand">
          <div className="container-x">
            <SectionHeading
              eyebrow="Featured"
              title="Popular travel guides"
              description="In-depth guides written to help you plan smarter."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.slice(0, 6).map((a) => (
                <ArticleCard
                  key={a.id}
                  article={{
                    id: a.id,
                    title: a.title,
                    slug: a.slug,
                    type: a.type,
                    excerpt: a.excerpt,
                    coverImage: a.coverImage,
                    publishedAt: a.publishedAt,
                    authorName: a.author?.name ?? null,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* By travel style */}
      <section className="container-x section-pad">
        <SectionHeading
          eyebrow="Find your style"
          title="Best destinations by travel style"
          description="However you like to travel, there's a perfect match waiting."
          align="center"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STYLE_GUIDES.map((style) => (
            <Link
              key={style.name}
              href={style.href}
              className="group flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
            >
              <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-brand">{style.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">{style.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recommended hotels */}
      {hotels.length > 0 && (
        <section className="section-pad bg-sand">
          <div className="container-x">
            <SectionHeading
              eyebrow="Stay well"
              title="Recommended hotels"
              description="Hand-picked stays in the world's most-loved destinations."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={{
                    id: hotel.id,
                    name: hotel.name,
                    image: hotel.image,
                    location: hotel.city ? `${hotel.city}${hotel.country ? `, ${hotel.country}` : ""}` : null,
                    rating: hotel.guestRating,
                    priceRange: hotel.priceRange,
                    bestFor: hotel.bestFor,
                    affiliateLinkId: hotel.affiliateLinks[0]?.id ?? null,
                  }}
                />
              ))}
            </div>
            <p className="mt-8 text-center">
              <Link href="/hotels" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">
                View all hotel guides <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Best experiences */}
      {activities.length > 0 && (
        <section className="container-x section-pad">
          <SectionHeading
            eyebrow="Make memories"
            title="Best travel experiences"
            description="Tours, excursions and unforgettable moments."
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={{
                  id: activity.id,
                  name: activity.name,
                  image: activity.image,
                  description: activity.description,
                  duration: activity.duration,
                  priceRange: activity.priceRange,
                  rating: activity.rating,
                  category: activity.category,
                  affiliateLinkId: activity.affiliateLinks[0]?.id ?? null,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Itineraries */}
      {itineraries.length > 0 && (
        <section className="section-pad bg-brand-dark">
          <div className="container-x">
            <SectionHeading
              eyebrow="Day by day"
              title="Popular itineraries"
              description="Ready-to-follow itineraries with budgets, stays and highlights."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {itineraries.map((it) => (
                <Link
                  key={it.id}
                  href={`/itineraries/${it.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
                >
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-white group-hover:text-accent">{it.title}</h3>
                    {it.summary && <p className="mt-2 line-clamp-2 text-sm text-white/70">{it.summary}</p>}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-accent">{it.days} days</p>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-center">
              <Link href="/itineraries" className="inline-flex items-center gap-1 font-semibold text-accent hover:text-white">
                Browse all itineraries <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Latest articles */}
      {latestArticles.length > 0 && (
        <section className="container-x section-pad">
          <SectionHeading
            eyebrow="Fresh from the desk"
            title="Latest articles"
            description="New guides, destination deep-dives and practical travel advice."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestArticles.slice(0, 8).map((a) => (
              <ArticleCard
                key={a.id}
                article={{
                  id: a.id,
                  title: a.title,
                  slug: a.slug,
                  type: a.type,
                  excerpt: a.excerpt,
                  coverImage: a.coverImage,
                  publishedAt: a.publishedAt,
                  authorName: a.author?.name ?? null,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Travel gear */}
      {gear.length > 0 && (
        <section className="section-pad bg-sand">
          <div className="container-x">
            <SectionHeading
              eyebrow="Pack right"
              title="Travel gear recommendations"
              description="Tested picks for every traveller — from cabin carry-ons to packing cubes."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gear.map((product) => (
                <div key={product.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-lg font-semibold text-ink">{product.name}</h3>
                    {product.rating ? (
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand-dark">
                        ★ {product.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  {product.brand && <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{product.brand}</p>}
                  {product.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{product.description}</p>}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {product.priceRange && <span className="text-sm font-semibold text-ink">{product.priceRange}</span>}
                    {product.affiliateLinks[0] && (
                      <Link
                        href={`/out/${product.affiliateLinks[0].id}?placement=home-gear`}
                        className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                        rel="nofollow sponsored"
                      >
                        Today&apos;s deals
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Resources + Newsletter + About */}
      <section className="container-x section-pad">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Travel resources" title="Everything you need to plan" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                ["Best eSIMs for travel", "/resources/esim"],
                ["Travel insurance explained", "/resources/travel-insurance"],
                ["Best carry-on luggage", "/travel-gear/carry-on-luggage"],
                ["Packing checklists", "/travel-tips/packing"],
                ["Visa information", "/resources/visas"],
                ["Car rental tips", "/resources/car-rental"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="block rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-brand-dark p-8 text-white">
            <h2 className="text-3xl text-white">Get smarter travel tips</h2>
            <p className="mt-3 text-white/75">
              Join {siteConfig.name} and get destination guides, packing hacks and exclusive deals in your inbox. No spam, ever.
            </p>
            <div className="mt-6">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section-pad bg-sand">
        <div className="container-x max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl">About {siteConfig.name}</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-ink-soft">
            {siteConfig.name} is an independent travel media brand on a mission to help you plan smarter and
            travel better. Our editors research destinations first-hand, compare hotels, tours and gear, and
            publish honest guides so you can spend less time scrolling and more time travelling.
          </p>
          <p className="mt-4 text-lg font-medium text-brand-dark">{siteConfig.tagline}</p>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark"
          >
            Read our story <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <div className="container-x pb-12 pt-0">
        <AffiliateDisclosure />
      </div>
    </>
  );
}