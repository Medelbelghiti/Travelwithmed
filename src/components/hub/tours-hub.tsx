import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { MapPin, ArrowRight, Compass, Route, BookOpen } from "lucide-react";
import type { HubType } from "@/lib/hubs";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { ActivityCard } from "@/components/affiliate/activity-card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { buildMetadata, breadcrumbSchema, itemListSchema } from "@/lib/seo";

type ActivityRow = Prisma.ActivityGetPayload<{
  include: { affiliateLinks: { where: { active: true }; take: number } };
}>;

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: { name: string } | null;
};

type ItineraryRow = { id: string; title: string; slug: string; days: number; summary?: string | null };

export interface ToursHubData {
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
    activityLinkId?: string | null;
    activityLinkLabel?: string | null;
  };
  activities: ActivityRow[];
  articles: ArticleRow[];
  itineraries: ItineraryRow[];
  pageTitle: string;
  pageDescription: string;
}

function buildCrumbsFor(destination: ToursHubData["destination"], hubType: HubType) {
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

export function ToursHubMetadata({
  hubType,
  destination,
  pageTitle,
  pageDescription,
}: {
  hubType: HubType;
  destination: { name: string; slug: string; coverImage?: string | null };
  pageTitle: string;
  pageDescription: string;
}) {
  return buildMetadata({
    title: pageTitle,
    description: pageDescription,
    canonicalPath: `/articles/hub/${hubType.slug}/${destination.slug}`,
    ogImage: destination.coverImage ?? undefined,
    ogType: "website",
    keywords: [destination.name, hubType.label, "tours", "activities", "travel"],
  });
}

export function ToursHub({ hub }: { hub: ToursHubData }) {
  const { hubType, destination, activities, articles, itineraries } = hub;
  const crumbs = buildCrumbsFor(destination, hubType);
  const cityUrl = `/destinations/${destination.slug}`;
  const isThingsToDo = hubType.slug === "things-to-do";

  const activityJsonLd = activities.slice(0, 8).map((a) => ({
    "@type": "TouristAttraction",
    name: a.name,
    description: a.bestFor ?? a.description ?? undefined,
    image: a.image ?? undefined,
  }));

  const jsonLd = [
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: c.href }))),
    itemListSchema(activities.slice(0, 8).map((a) => ({ name: a.name }))),
    ...activityJsonLd,
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
              (isThingsToDo
                ? `${destination.name} is packed with unforgettable experiences — from iconic landmarks and cultural highlights to hidden gems only locals know. These are the ones worth your time.`
                : `The best guided tours in ${destination.name} combine local knowledge with hassle-free booking. These are the top-rated experiences Riversmag recommends, from walking tours to full-day excursions.`)}
          </p>
        </section>

        {destination.activityLinkId && (
          <section className="mb-12 flex flex-col items-center gap-4 rounded-3xl bg-sand p-8 text-center">
            <p className="flex items-center gap-2 text-lg font-semibold text-ink">
              <Compass className="h-5 w-5 text-brand" aria-hidden />
              {isThingsToDo ? "Explore all experiences" : "Book your guided tour"}
            </p>
            <AffiliateButton
              linkId={destination.activityLinkId}
              label={destination.activityLinkLabel ?? "See available tours"}
              placement={`${hubType.slug}-${destination.slug}`}
              category="ACTIVITIES"
              destination={destination.name}
              size="lg"
            />
            <AffiliateDisclosure short />
          </section>
        )}

        {activities.length > 0 ? (
          <section id="recommended-activities" className="mb-14 scroll-mt-24">
            <SectionHeading
              eyebrow={hubType.eyebrow}
              title={isThingsToDo ? `Top experiences in ${destination.name}` : `Recommended tours in ${destination.name}`}
              description={
                isThingsToDo
                  ? `Our editors' pick of the ${destination.name} experiences every traveller should consider.`
                  : `Hand-picked guided tours and day trips in ${destination.name} — rated by travellers, vetted by our editors.`
              }
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  linked
                  activity={{
                    id: activity.id,
                    slug: activity.slug,
                    name: activity.name,
                    image: activity.image,
                    description: activity.description,
                    duration: activity.duration,
                    priceRange: activity.priceRange,
                    rating: activity.rating,
                    reviewCount: activity.reviewCount,
                    category: activity.category,
                    bestFor: activity.bestFor,
                    destinationName: destination.name,
                    location: activity.location,
                    affiliateLinkId: activity.affiliateLinks[0]?.id ?? null,
                  }}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-14">
            <p className="text-lg text-ink-soft">
              We haven&apos;t published {isThingsToDo ? "experiences" : "tours"} for {destination.name} yet. Check back soon — our
              editors are working on new guides.
            </p>
          </section>
        )}

        {itineraries.length > 0 && (
          <section id="itineraries" className="mb-14 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Trip plans"
                title={`Suggested itineraries for ${destination.name}`}
                description="Ready-made trip plans that include the best tours and experiences."
              />
              <Link
                href="/itineraries"
                className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-light"
              >
                View all itineraries <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {itineraries.map((it) => (
                <Link
                  key={it.id}
                  href={`/itineraries/${it.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand">{it.days} days</p>
                    <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-ink group-hover:text-brand transition-colors">
                      {it.title}
                    </h3>
                    {it.summary && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{it.summary}</p>}
                    <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      View itinerary <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section id="guides" className="mb-14 scroll-mt-24">
            <SectionHeading
              eyebrow="Read next"
              title={` Guides about ${destination.name}`}
              description="In-depth travel guides to help you plan every detail."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                    {article.coverImage ? (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        sizes="400px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-ink-muted" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-lg font-semibold leading-snug text-ink group-hover:text-brand transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{article.excerpt}</p>}
                    <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      Read guide <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
