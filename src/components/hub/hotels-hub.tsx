import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { BedDouble, MapPin, ArrowRight, Ticket, Route } from "lucide-react";
import type { HubType } from "@/lib/hubs";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { HotelCard } from "@/components/affiliate/hotel-card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { buildMetadata, hotelSchema, breadcrumbSchema, itemListSchema } from "@/lib/seo";

type HotelRow = Prisma.HotelGetPayload<{
  include: { affiliateLinks: { where: { active: boolean }; take: number } };
}>;

type FestivalRow = Prisma.ActivityGetPayload<{
  select: { id: true; name: true; slug: true; description: true; image: true; bestFor: true };
}>;

type ItineraryRow = { id: string };

export interface HotelsHubData {
  hubType: HubType;
  destination: {
    id: string;
    name: string;
    slug: string;
    type: string;
    tagline?: string | null;
    overview?: string | null;
    coverImage?: string | null;
    parent?: { name: string; slug: string } | null;
    hotelLinkId?: string | null;
    hotelLinkLabel?: string | null;
  };
  hotels: HotelRow[];
  activities: FestivalRow[];
  itineraries: ItineraryRow[];
  pageTitle: string;
  pageDescription: string;
}

function buildCrumbsFor(destination: HotelsHubData["destination"], hubType: HubType) {
  const level1 = destination.parent
    ? [{ name: destination.parent.name, href: `/destinations/${destination.parent.slug}` }]
    : [];
  return buildCrumbs([
    { name: "Destinations", href: "/destinations" },
    ...level1,
    { name: destination.name, href: `/destinations/${destination.slug}` },
    { name: hubType.label, href: `/articles/hub/${hubType.slug}/${destination.slug}` },
  ]);
}

export interface HubMetadataProps {
  hubType: HubType;
  destination: { name: string; slug: string; coverImage?: string | null };
  pageTitle: string;
  pageDescription: string;
}

export function HubMetadata({ hubType, destination, pageTitle, pageDescription }: HubMetadataProps) {
  return buildMetadata({
    title: pageTitle,
    description: pageDescription,
    canonicalPath: `/articles/hub/${hubType.slug}/${destination.slug}`,
    ogImage: destination.coverImage ?? undefined,
    ogType: "website",
    keywords: [destination.name, hubType.label, "hotels", "travel"],
  });
}

export function HotelsHub({ hub }: { hub: HotelsHubData }) {
  const { hubType, destination, hotels, activities, itineraries } = hub;
  const crumbs = buildCrumbsFor(destination, hubType);
  const cityUrl = `/destinations/${destination.slug}`;

  const hotelJsonLd = hotels.slice(0, 8).map((h) =>
    hotelSchema({
      name: h.name,
      address: h.city ? `${h.city}${h.country ? `, ${h.country}` : ""}` : undefined,
      rating: h.guestRating,
      priceRange: h.priceRange,
      image: h.image,
    }),
  );

  const jsonLd = [
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.href }))),
    itemListSchema(hotels.slice(0, 8).map((h) => ({ name: h.name }))),
    ...hotelJsonLd,
  ];

  return (
    <main>
      <JsonLdBreadcrumbs items={crumbs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative overflow-hidden bg-brand-dark">
        <div className="container-x relative py-16 md:py-20">
          <Breadcrumbs items={crumbs} />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{hubType.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-white md:text-5xl">{hubType.title(destination.name)}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{hub.pageDescription}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={cityUrl}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {destination.name} travel guide
            </Link>
            {itineraries.length > 0 && (
              <Link
                href={`/itineraries`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                <Route className="h-4 w-4" aria-hidden />
                Itineraries
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container-x py-14">
        {destination.coverImage && (
          <Image
            src={destination.coverImage}
            alt={destination.name}
            width={1280}
            height={720}
            priority
            className="mb-10 aspect-[21/9] w-full rounded-3xl object-cover"
          />
        )}

        <section className="mb-12 max-w-3xl">
          <h2 className="text-3xl">At a glance</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            {destination.overview ||
              `Planning where to stay in ${destination.name} is the decision that shapes a trip. These are the ${destination.name} hotels Riversmag recommends most, picked for real-world value, location and the kind of stay that makes the visit.`}
          </p>
        </section>

        {/* Primary CTA */}
        {destination.hotelLinkId && (
          <section className="mb-12 flex flex-col items-center gap-4 rounded-3xl bg-sand p-8 text-center">
            <p className="flex items-center gap-2 text-lg font-semibold text-ink">
              <BedDouble className="h-5 w-5 text-brand" aria-hidden />
              Compare prices for your dates
            </p>
            <AffiliateButton
              linkId={destination.hotelLinkId}
              label={destination.hotelLinkLabel ?? "Check hotel prices"}
              placement={`${hubType.slug}-${destination.slug}`}
              category="HOTELS"
              destination={destination.name}
              size="lg"
            />
            <AffiliateDisclosure short />
          </section>
        )}

        {hotels.length > 0 ? (
          <section id="recommended-hotels" className="mb-14 scroll-mt-24">
            <SectionHeading
              eyebrow={hubType.eyebrow}
              title={`Recommended ${hubType.slug === "where-to-stay" ? "hotels by area" : "hotels"}`}
              description={`Independently reviewed stays in ${destination.name} — the ones our editors would actually book.`}
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
                    reviewCount: hotel.reviewCount,
                    priceRange: hotel.priceRange,
                    bestFor: hotel.bestFor,
                    affiliateLinkId: hotel.affiliateLinks[0]?.id ?? null,
                  }}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-14">
            <p className="text-lg text-ink-soft">
              We haven&apos;t published hotel reviews for {destination.name} yet. Use the button above to compare current prices,
              and check back soon.
            </p>
          </section>
        )}

        {activities.length > 0 && (
          <section id="things-to-do" className="mb-14 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Beyond the room"
                title={`Paired with things to do in ${destination.name}`}
                description="Pair your stay with the tours and experiences worth booking."
              />
              <Link
                href="/activities"
                className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-light"
              >
                View all activities <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities.slice(0, 6).map((activity) => (
                <ArticleCardLink
                  key={activity.id}
                  href={`/activities/${activity.slug}`}
                  name={activity.name}
                  bestFor={activity.bestFor ?? activity.description}
                  image={activity.image}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ArticleCardLink({
  href,
  name,
  bestFor,
  image,
}: {
  href: string;
  name: string;
  bestFor?: string | null;
  image?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Ticket className="h-8 w-8 text-ink-muted" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink group-hover:text-brand transition-colors">
          {name}
        </h3>
        {bestFor && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{bestFor}</p>}
        <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Learn more <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
