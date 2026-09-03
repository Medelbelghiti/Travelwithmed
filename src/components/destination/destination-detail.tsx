import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  Calendar,
  Plane,
  Train,
  Wallet,
  ShieldCheck,
  Signal,
  Ticket,
  Car,
  ArrowRight,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { HotelCard } from "@/components/affiliate/hotel-card";
import { ActivityCard } from "@/components/affiliate/activity-card";
import { ArticleCard } from "@/components/article-card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { NewsletterCta } from "@/components/newsletter-cta";
import { prisma } from "@/lib/prisma";
import { breadcrumbSchema, faqSchema, touristAttractionSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

type DestinationWithRelations = Prisma.DestinationGetPayload<{
  include: {
    parent: { include: { parent: { include: { parent: true } } } };
    articles: { include: { author: true } };
    hotels: { include: { affiliateLinks: { where: { active: true }; take: number } } };
    activities: { include: { affiliateLinks: { where: { active: true }; take: number } } };
    itineraries: { where: { isActive: boolean } };
    affiliateLinks: { where: { active: boolean } };
    faqItems: true;
    seoMetadata: true;
  };
}>;

export interface DestinationDetailProps {
  destination: DestinationWithRelations;
}

function buildParentChain(destination: DestinationWithRelations) {
  const chain: { name: string; slug: string }[] = [];
  let current: { name: string; slug: string; parent?: { name: string; slug: string } | null } | null = destination;
  while (current) {
    chain.unshift({ name: current.name, slug: current.slug });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current = (current as any).parent ?? null;
  }
  return chain;
}

export async function DestinationDetail({ destination }: DestinationDetailProps) {
  const chain = buildParentChain(destination);
  const crumbItems = buildCrumbs([
    { name: "Destinations", href: "/destinations" },
    ...chain.map((c) => ({ name: c.name, href: `/destinations/${c.slug}` })),
  ]);

  // Related destinations = siblings + parent level
  const related = await prisma.destination.findMany({
    where: { isActive: true, parentId: destination.parentId ?? undefined },
    orderBy: { sortOrder: "asc" },
    take: 8,
  });

  // Category-based affiliate links for planning sections
  const categoryLinks = {
    hotels: destination.affiliateLinks.find((l) => l.category === "HOTELS"),
    flights: destination.affiliateLinks.find((l) => l.category === "FLIGHTS"),
    activities: destination.affiliateLinks.find((l) => l.category === "ACTIVITIES"),
    insurance: destination.affiliateLinks.find((l) => l.category === "INSURANCE"),
    esim: destination.affiliateLinks.find((l) => l.category === "ESIM"),
    carRental: destination.affiliateLinks.find((l) => l.category === "CAR_RENTAL"),
    transfers: destination.affiliateLinks.find((l) => l.category === "AIRPORT_TRANSFERS"),
  };

  const infoSections = [
    { key: "bestTimeToVisit", label: "Best time to visit", icon: Calendar, content: destination.bestTimeToVisit },
    { key: "howToGetThere", label: "How to get there", icon: Plane, content: destination.howToGetThere },
    { key: "transportation", label: "Getting around", icon: Train, content: destination.transportation },
    { key: "budget", label: "Travel budget", icon: Wallet, content: destination.budget },
    { key: "safety", label: "Safety", icon: ShieldCheck, content: destination.safety },
    { key: "visaInfo", label: "Visa information", icon: Ticket, content: destination.visaInfo },
    { key: "esimInfo", label: "Internet & eSIM", icon: Signal, content: destination.esimInfo },
  ];

  const jsonLd: Record<string, unknown>[] = [
    breadcrumbSchema(
      crumbItems.map((c) => ({ name: c.name, url: c.href })),
    ),
  ];
  if (destination.faqItems.length > 0) {
    jsonLd.push(faqSchema(destination.faqItems.map((f) => ({ question: f.question, answer: f.answer }))));
  }
  jsonLd.push(touristAttractionSchema({ name: destination.name, description: destination.tagline ?? destination.overview ?? `Discover ${destination.name} with Riversmag's guide`, url: absoluteUrl(`/destinations/${destination.slug}`), image: destination.coverImage ?? undefined }));

  return (
    <main>
      <JsonLdBreadcrumbs items={crumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": destination.type === "CITY" ? "City" : destination.type === "COUNTRY" ? "Country" : "Place",
            name: destination.name,
            description: destination.tagline ?? undefined,
            url: absoluteUrl(`/destinations/${destination.slug}`),
          }),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative overflow-hidden bg-brand-dark">
        <div className="container-x relative py-16 md:py-24">
          <Breadcrumbs items={crumbItems} />
          <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-6xl">{destination.name}</h1>
          {destination.tagline && <p className="mt-4 max-w-2xl text-lg text-white/80">{destination.tagline}</p>}

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            {categoryLinks.hotels && <span className="rounded-full border border-accent/40 px-3 py-1">Hotels</span>}
            {categoryLinks.activities && <span className="rounded-full border border-accent/40 px-3 py-1">Activities</span>}
            {categoryLinks.esim && <span className="rounded-full border border-accent/40 px-3 py-1">eSIM</span>}
            {categoryLinks.flights && <span className="rounded-full border border-accent/40 px-3 py-1">Flights</span>}
            {categoryLinks.insurance && <span className="rounded-full border border-accent/40 px-3 py-1">Insurance</span>}
          </div>
        </div>
      </div>

      <div className="container-x py-14">
        {/* Overview */}
        <section className="mb-14 max-w-3xl">
          <h2 className="text-3xl">Overview</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {destination.overview ||
              `Explore ${destination.name} with Riversmag's in-depth destination guide — from the best areas to stay to the top things to do, tours, food, budgets and practical travel tips.`}
          </p>
        </section>

        {/* Info grid */}
        <section className="mb-14">
          <h2 className="mb-8 text-3xl">Plan your trip</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {infoSections
              .filter((s) => s.content)
              .map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-brand" aria-hidden />
                      <h3 className="font-serif text-lg font-semibold">{s.label}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.content}</p>
                  </div>
                );
              })}
          </div>
        </section>

        {/* Hotels */}
        {destination.hotels.length > 0 && (
          <section className="mb-14">
            <SectionHeading
              eyebrow="Where to stay"
              title={`Top hotels in ${destination.name}`}
              description="Reviewed and recommended places to stay, whatever your budget."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destination.hotels.slice(0, 6).map((hotel) => (
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
            {categoryLinks.hotels && (
              <p className="mt-6">
                <AffiliateButton linkId={categoryLinks.hotels.id} label="Compare hotel prices" placement={`${destination.slug}-all-hotels`} />
              </p>
            )}
          </section>
        )}

        {/* Activities */}
        {destination.activities.length > 0 && (
          <section className="mb-14">
            <SectionHeading
              eyebrow="Things to do"
              title={`Best experiences in ${destination.name}`}
              align="center"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destination.activities.slice(0, 6).map((activity) => (
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
        {destination.itineraries.length > 0 && (
          <section className="mb-14">
            <SectionHeading eyebrow="Day by day" title={`Suggested itineraries`} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destination.itineraries.map((it) => (
                <Link
                  key={it.id}
                  href={`/itineraries/${it.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand"
                >
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-brand">{it.title}</h3>
                    {it.summary && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{it.summary}</p>}
                  </div>
                  <p className="mt-4 text-sm font-semibold text-brand">{it.days} days</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Articles */}
        {destination.articles.length > 0 && (
          <section className="mb-14">
            <SectionHeading eyebrow="Read more" title={`Guides about ${destination.name}`} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destination.articles.map((a) => (
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

        {/* FAQ */}
        {destination.faqItems.length > 0 && (
          <section className="mb-14 max-w-3xl">
            <SectionHeading eyebrow="Good to know" title={`FAQs about ${destination.name}`} />
            <div className="space-y-3">
              {destination.faqItems.map((faq) => (
                <details key={faq.id} className="group rounded-2xl border border-line bg-white shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="text-brand transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-ink-soft">{faq.answer}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related destinations */}
        {related.filter((r) => r.slug !== destination.slug).length > 0 && (
          <section className="mb-14">
            <SectionHeading eyebrow="Keep exploring" title="Related destinations" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related
                .filter((r) => r.slug !== destination.slug)
                .map((r) => (
                  <Link
                    key={r.id}
                    href={`/destinations/${r.slug}`}
                    className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand"
                  >
                    <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{r.name}</h3>
                    {r.tagline && <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{r.tagline}</p>}
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      Explore <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        )}

        {/* Cross-category CTAs */}
        <section className="mb-10">
          <div className="rounded-3xl bg-sand p-8">
            <h2 className="text-2xl">Plan the practical stuff</h2>
            <p className="mt-2 text-ink-soft">Get everything sorted in a few clicks.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { link: categoryLinks.flights, label: "Check flight prices", icon: Plane },
                { link: categoryLinks.insurance, label: "Get travel insurance", icon: ShieldCheck },
                { link: categoryLinks.esim, label: "Get an eSIM", icon: Signal },
                { link: categoryLinks.carRental, label: "Compare car rentals", icon: Car },
                { link: categoryLinks.transfers, label: "Book airport transfer", icon: Train },
                { link: categoryLinks.activities, label: "Browse all tours", icon: Ticket },
              ]
                .filter((c) => c.link)
                .map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.link?.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-brand" aria-hidden />
                        <span className="font-medium text-ink">{c.label}</span>
                      </div>
                      <AffiliateButton linkId={c.link!.id} label="View" size="sm" variant="outline" placement={destination.slug} />
                    </div>
                  );
                })}
            </div>
            <div className="mt-6">
              <AffiliateDisclosure short />
            </div>
          </div>
        </section>

        <NewsletterCta
          title={`Love ${destination.name}? Get more guides like this`}
          description="Join the Riversmag newsletter and get refreshed destination guides, money-saving travel deals and practical planning advice in your inbox."
        />
      </div>
    </main>
  );
}