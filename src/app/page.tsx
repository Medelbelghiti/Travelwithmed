import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BedDouble,
  Car,
  Compass,
  Map,
  ShieldCheck,
  Signal,
  Ticket,
} from "lucide-react";
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

const FEATURED_SLUGS = ["paris", "marrakech", "tokyo", "bali", "rome"];

const PLAN_FLOWS = [
  { label: "Where to stay", href: "/hotels", icon: BedDouble, eyebrow: "Hotels" },
  { label: "What to do", href: "/activities", icon: Ticket, eyebrow: "Things to do" },
  { label: "Day by day", href: "/itineraries", icon: Map, eyebrow: "Itineraries" },
  { label: "Stay connected", href: "/resources/esim", icon: Signal, eyebrow: "eSIM" },
  { label: "Stay covered", href: "/resources/travel-insurance", icon: ShieldCheck, eyebrow: "Insurance" },
  { label: "Get around", href: "/resources/car-rental", icon: Car, eyebrow: "Car rental" },
];

async function fetchFeatured() {
  return prisma.destination.findMany({
    where: { isActive: true, slug: { in: FEATURED_SLUGS } },
    include: {
      _count: { select: { hotels: true, activities: true, itineraries: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

async function fetchTrending() {
  return prisma.destination.findMany({
    where: { isActive: true, type: { in: ["CITY", "COUNTRY"] }, slug: { notIn: FEATURED_SLUGS } },
    include: { _count: { select: { articles: true } } },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });
}

async function fetchArticles() {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true },
    orderBy: [{ publishedAt: "desc" }, { viewCount: "desc" }],
    take: 6,
  });
}

async function fetchHotels() {
  return prisma.hotel.findMany({
    where: { isActive: true },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ guestRating: "desc" }, { sorts: "asc" }],
    take: 6,
  });
}

async function fetchActivities() {
  return prisma.activity.findMany({
    where: { isActive: true },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: { rating: "desc" },
    take: 6,
  });
}

async function fetchDeals() {
  return prisma.affiliateLink.findMany({
    where: { active: true, featuredDeal: true, OR: [{ dealExpiresAt: null }, { dealExpiresAt: { gt: new Date() } }] },
    orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
    take: 3,
  });
}

export default async function HomePage() {
  let featuredDestinations: Awaited<ReturnType<typeof fetchFeatured>> = [];
  let trendingDestinations: Awaited<ReturnType<typeof fetchTrending>> = [];
  let featuredArticles: Awaited<ReturnType<typeof fetchArticles>> = [];
  let hotels: Awaited<ReturnType<typeof fetchHotels>> = [];
  let activities: Awaited<ReturnType<typeof fetchActivities>> = [];
  let deals: Awaited<ReturnType<typeof fetchDeals>> = [];

  try {
    [featuredDestinations, trendingDestinations, featuredArticles, hotels, activities, deals] =
      await Promise.all([
        fetchFeatured(),
        fetchTrending(),
        fetchArticles(),
        fetchHotels(),
        fetchActivities(),
        fetchDeals(),
      ]);
  } catch {
    // DB unavailable — render static shell only
  }

  const featuredOrdered = [...FEATURED_SLUGS]
    .map((slug) => featuredDestinations.find((d) => d.slug === slug))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <>
      <Hero />

      {/* Plan-your-trip pillar strip */}
      <section className="border-b border-line bg-white">
        <div className="container-x py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PLAN_FLOWS.map((flow) => {
              const Icon = flow.icon;
              return (
                <Link
                  key={flow.href}
                  href={flow.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-sand px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{flow.eyebrow}</span>
                  <span className="text-sm font-semibold text-ink group-hover:text-brand">{flow.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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

      {/* Featured destinations */}
      {featuredOrdered.length > 0 && (
        <section className="container-x section-pad">
          <SectionHeading
            eyebrow="Popular right now"
            title="Where to go next"
            description="Start with a destination — we'll guide you on where to stay, what to do and how to get around."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredOrdered.map((d) => (
              <div
                key={d.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <DestinationCard
                  destination={{
                    id: d.id,
                    name: d.name,
                    slug: d.slug,
                    type: d.type,
                    tagline: d.tagline,
                    coverImage: d.coverImage,
                    articleCount: undefined,
                  }}
                  className="border-0 shadow-none hover:translate-y-0 hover:shadow-none"
                />
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Plan your trip</p>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {d._count.hotels > 0 && (
                      <li>
                        <Link
                          href={`/destinations/${d.slug}#hotels`}
                          className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-brand"
                        >
                          <BedDouble className="h-3.5 w-3.5 text-brand" aria-hidden />
                          Hotels
                        </Link>
                      </li>
                    )}
                    {d._count.activities > 0 && (
                      <li>
                        <Link
                          href={`/destinations/${d.slug}#things-to-do`}
                          className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-brand"
                        >
                          <Ticket className="h-3.5 w-3.5 text-brand" aria-hidden />
                          Things to do
                        </Link>
                      </li>
                    )}
                    {d._count.itineraries > 0 && (
                      <li>
                        <Link
                          href={`/destinations/${d.slug}#itineraries`}
                          className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-brand"
                        >
                          <Map className="h-3.5 w-3.5 text-brand" aria-hidden />
                          Itineraries
                        </Link>
                      </li>
                    )}
                    {[
                      { label: "eSIM", href: "#planning", icon: Signal },
                      { label: "Insurance", href: "#planning", icon: ShieldCheck },
                      { label: "Car rental", href: "#planning", icon: Car },
                    ].map((p) => {
                      const Icon = p.icon;
                      return (
                        <li key={p.label}>
                          <Link
                            href={`/destinations/${d.slug}${p.href}`}
                            className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-brand"
                          >
                            <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
                            {p.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href={`/destinations/${d.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    Explore {d.name} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ))}
            {featuredOrdered.length < 5 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-sand p-6 text-center">
                <Compass className="h-8 w-8 text-brand" aria-hidden />
                <p className="mt-3 font-semibold text-ink">Looking for somewhere else?</p>
                <Link href="/destinations" className="mt-2 text-sm font-semibold text-brand hover:text-brand-dark">
                  Browse all destinations <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            )}
          </div>
          <p className="mt-8 text-center">
            <Link href="/destinations" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">
              Explore all destinations <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>
      )}

      {/* More destinations */}
      {trendingDestinations.length > 0 && (
        <section className="section-pad bg-sand">
          <div className="container-x">
            <SectionHeading
              eyebrow="Keep exploring"
              title="More destinations"
              description="There's plenty more to discover across the site."
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {trendingDestinations.map((d) => (
                <DestinationCard
                  key={d.id}
                  destination={{ ...d, articleCount: d._count.articles }}
                  className="rounded-2xl"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured travel guides */}
      {featuredArticles.length > 0 && (
        <section className="container-x section-pad">
          <SectionHeading
            eyebrow="Featured"
            title="Featured travel guides"
            description="In-depth guides written to help you plan smarter, wherever you're headed."
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
          <p className="mt-8 text-center">
            <Link href="/articles" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">
              Browse every guide <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>
      )}

      {/* Recommended hotels */}
      {hotels.length > 0 && (
        <section className="section-pad bg-sand">
          <div className="container-x">
            <SectionHeading
              eyebrow="Where to stay"
              title="Recommended hotels"
              description="Hand-picked stays in the world's most-loved destinations, for every budget."
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

      {/* Top activities */}
      {activities.length > 0 && (
        <section className="container-x section-pad">
          <SectionHeading
            eyebrow="Things to do"
            title="Top activities"
            description="Tours, excursions and unforgettable experiences, ready to book."
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
          <p className="mt-8 text-center">
            <Link href="/activities" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">
              View all activities <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </section>
      )}

      {/* Travel resources */}
      <section className="section-pad bg-sand">
        <div className="container-x">
          <SectionHeading
            eyebrow="Travel resources"
            title="Everything you need to plan"
            description="Book flights and stays, stay connected, stay covered and get around — all in one place."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Flights", href: "/flights", blurb: "Compare and book your flights" },
              { label: "Hotels", href: "/hotels", blurb: "Find the perfect place to stay" },
              { label: "Activities & tours", href: "/activities", blurb: "Book things to do" },
              { label: "eSIM", href: "/resources/esim", blurb: "Stay connected anywhere" },
              { label: "Travel insurance", href: "/resources/travel-insurance", blurb: "Stay covered on every trip" },
              { label: "Car rental", href: "/resources/car-rental", blurb: "Get around with ease" },
              { label: "Visa information", href: "/resources/visas", blurb: "Know what you need before you go" },
              { label: "Budget calculator", href: "/budget-calculator", blurb: "Plan your travel budget" },
              { label: "Trip planner", href: "/trip-planner", blurb: "Sketch out your whole trip" },
            ].map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand"
              >
                <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{r.label}</h3>
                <p className="mt-1 text-sm text-ink-muted">{r.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container-x section-pad">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Stay in the loop"
              title="Get smarter travel tips"
              description={`Join ${siteConfig.name} and get destination guides, packing hacks and exclusive deals in your inbox. No spam, ever.`}
            />
            <AffiliateDisclosure className="hidden lg:block" />
          </div>
          <div className="flex flex-col justify-center">
            <NewsletterForm />
            <AffiliateDisclosure className="mt-6 lg:hidden" />
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
    </>
  );
}
