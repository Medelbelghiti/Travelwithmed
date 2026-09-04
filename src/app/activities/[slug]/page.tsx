import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AddToTrip } from "@/components/trip/add-to-trip";
import { ActivityDetails } from "@/components/affiliate/activity-details";
import { NewsletterCta } from "@/components/newsletter-cta";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ActivityPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ActivityPageProps) {
  const { slug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: { destination: true },
  });
  if (!activity || !activity.isActive) return { title: "Activity not found" };

  return buildMetadata({
    title: `${activity.name} — Tickets, Tours & Reviews`,
    description:
      activity.description?.slice(0, 160) ??
      `Everything you need to know about ${activity.name}${activity.destination?.name ? ` in ${activity.destination.name}` : ""} — how long it takes, what it costs and how to book the best tour.`,
    canonicalPath: `/activities/${activity.slug}`,
    ogImage: activity.image ?? undefined,
    noindex: false,
  });
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { slug } = await params;
  const activity = await prisma.activity.findUnique({
    where: { slug },
    include: {
      destination: { select: { id: true, name: true, slug: true, tagline: true } },
      affiliateLinks: { where: { active: true } },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!activity || !activity.isActive) notFound();

  const affLink = activity.affiliateLinks[0] ?? (activity.affiliateLinkId ? await prisma.affiliateLink.findUnique({ where: { id: activity.affiliateLinkId } }) : null);
  const destinationRef = activity.destination;

  const crumbItems = buildCrumbs([
    { name: "Things to do", href: "/activities" },
    ...(destinationRef ? [{ name: destinationRef.name, href: `/destinations/${destinationRef.slug}` }] : []),
    { name: activity.name, href: `/activities/${activity.slug}` },
  ]);

  // Related data — all derived from the destination, never invented.
  const alternativePromise = destinationRef
    ? prisma.activity.findMany({
        where: { isActive: true, destinationId: destinationRef.id, id: { not: activity.id } },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
        take: 6,
      })
    : Promise.resolve([]);

  const hotelsPromise = destinationRef
    ? prisma.hotel.findMany({
        where: { isActive: true, destinationId: destinationRef.id },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
        take: 3,
      })
    : Promise.resolve([]);

  const itinerariesPromise = destinationRef
    ? prisma.itinerary.findMany({
        where: { isActive: true, destinationId: destinationRef.id },
        take: 3,
      })
    : Promise.resolve([]);

  const destinationGuidesPromise = destinationRef
    ? prisma.article.findMany({
        where: { status: "PUBLISHED", destinationId: destinationRef.id },
        include: { author: true },
        orderBy: { publishedAt: "desc" },
        take: 6,
      })
    : Promise.resolve([]);

  const [alternatives, hotels, itineraries, destinationGuides] = await Promise.all([
    alternativePromise,
    hotelsPromise,
    itinerariesPromise,
    destinationGuidesPromise,
  ]);

  const totalReviews = activity.reviewCount ?? activity.reviews.length;
  const tripItem = {
    id: activity.id,
    name: activity.name,
    slug: activity.slug,
    image: activity.image,
    priceRange: activity.priceRange,
    duration: activity.duration,
    rating: activity.rating,
    category: activity.category,
    destinationName: destinationRef?.name ?? null,
  };

  const quickFacts = [
    { label: "Duration", value: activity.duration ?? "Flexible" },
    { label: "Location", value: activity.location ?? destinationRef?.name ?? "Various locations" },
    { label: "From", value: activity.priceRange ?? "Price on request" },
    { label: "Rating", value: activity.rating != null ? `${activity.rating.toFixed(1)} / 5` : "New" },
    { label: "Reviews", value: totalReviews != null ? `${totalReviews} reviews` : "Be the first" },
  ];

  return (
    <main>
      <JsonLdBreadcrumbs items={crumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: activity.name,
            description: activity.description,
            image: activity.image,
            url: absoluteUrl(`/activities/${activity.slug}`),
            ...(activity.rating
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: activity.rating, reviewCount: activity.reviewCount ?? 1 } }
              : {}),
          }),
        }}
      />

      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-dark">
        <div className="container-x relative py-12 md:py-16">
          <Breadcrumbs items={crumbItems} />
          <div className="flex flex-wrap items-center gap-2">
            {activity.category && (
              <span className="rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                {activity.category}
              </span>
            )}
            {activity.rating != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
                {activity.rating.toFixed(1)}
                {totalReviews != null ? ` / ${totalReviews} reviews` : ""}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white md:text-5xl">{activity.name}</h1>
          {destinationRef && (
            <p className="mt-3 flex items-center gap-2 text-lg text-white/80">
              <MapPin className="h-5 w-5" aria-hidden />
              {destinationRef.name}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {affLink && (
              <AffiliateButton linkId={affLink.id} label={`Book ${activity.name}`} placement={`activity-${activity.slug}`} category="ACTIVITIES" destination={destinationRef?.name ?? undefined} />
            )}
            <AddToTrip item={tripItem} />
          </div>
        </div>
      </div>

      {/* Quick facts strip */}
      <div className="border-b border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
          {quickFacts.map((f) => (
            <div key={f.label} className="py-5">
              <p className="text-xs uppercase tracking-wide text-ink-muted">{f.label}</p>
              <p className="text-sm font-semibold text-ink">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      <ActivityDetails
        activity={{
          id: activity.id,
          name: activity.name,
          slug: activity.slug,
          description: activity.description,
          duration: activity.duration,
          priceRange: activity.priceRange,
          rating: activity.rating,
          reviewCount: activity.reviewCount,
          category: activity.category,
          bestFor: activity.bestFor,
          location: activity.location,
          image: activity.image,
          included: (activity.included as string[] | null) ?? null,
          notIncluded: (activity.notIncluded as string[] | null) ?? null,
          importantInfo: (activity.importantInfo as string[] | null) ?? null,
          affiliateLinkId: affLink?.id ?? null,
          destination: destinationRef
            ? { id: destinationRef.id, name: destinationRef.name, slug: destinationRef.slug }
            : null,
        }}
        alternatives={alternatives.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          description: a.description,
          duration: a.duration,
          priceRange: a.priceRange,
          rating: a.rating,
          category: a.category,
          destination: destinationRef
            ? { id: destinationRef.id, name: destinationRef.name, slug: destinationRef.slug }
            : null,
          affiliateLinkId: a.affiliateLinks[0]?.id ?? null,
        }))}
        hotels={hotels.map((h) => ({
          id: h.id,
          name: h.name,
          image: h.image,
          city: h.city,
          country: h.country,
          guestRating: h.guestRating,
          priceRange: h.priceRange,
          bestFor: h.bestFor,
          affiliateLinkId: h.affiliateLinks[0]?.id ?? null,
        }))}
        itineraries={itineraries.map((it) => ({
          id: it.id,
          title: it.title,
          slug: it.slug,
          summary: it.summary,
          days: it.days,
        }))}
        destinationGuides={destinationGuides.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          type: a.type,
          excerpt: a.excerpt,
          coverImage: a.coverImage,
          publishedAt: a.publishedAt,
          authorName: a.author?.name ?? null,
        }))}
        reviews={activity.reviews.map((r) => ({
          id: r.id,
          title: r.title,
          content: r.content,
          rating: r.rating,
          author: r.author,
          createdAt: r.createdAt,
        }))}
      />

      <div className="container-x pb-12">
        <NewsletterCta
          title={`Travelling to ${destinationRef?.name ?? "a new place"}?`}
          description="Get the best experiences, money-saving tips and fresh destination guides in your inbox."
        />
      </div>
    </main>
  );
}
