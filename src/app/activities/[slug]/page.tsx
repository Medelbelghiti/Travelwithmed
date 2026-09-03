import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  Ticket,
  ArrowRight,
  Users,
  Check,
  Clock3,
  ThumbsUp,
  BadgeCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { NewsletterCta } from "@/components/newsletter-cta";
import { ActivityCard } from "@/components/affiliate/activity-card";
import { AddToTrip } from "@/components/trip/add-to-trip";
import { ReviewsSection } from "@/components/reviews/reviews-section";
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
      media: true,
    },
  });

  if (!activity || !activity.isActive) notFound();

  const affLink = activity.affiliateLinks[0];
  const destinationRef = activity.destination;

  const crumbItems = buildCrumbs([
    { name: "Things to do", href: "/activities" },
    ...(destinationRef ? [{ name: destinationRef.name, href: `/destinations/${destinationRef.slug}` }] : []),
    { name: activity.name, href: `/activities/${activity.slug}` },
  ]);

  const similar = destinationRef
    ? await prisma.activity.findMany({
        where: { isActive: true, destinationId: destinationRef.id, id: { not: activity.id } },
        include: {
          affiliateLinks: { where: { active: true } },
          destination: { select: { name: true } },
        },
        take: 3,
      })
    : [];

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
    { icon: Clock3, label: "Duration", value: activity.duration ?? "Flexible" },
    { icon: MapPin, label: "Where", value: destinationRef?.name ?? "Various locations" },
    { icon: Ticket, label: "From", value: activity.priceRange ?? "Price on request" },
    { icon: Star, label: "Rating", value: activity.rating != null ? `${activity.rating.toFixed(1)} / 5` : "New" },
    { icon: Users, label: "Reviews", value: totalReviews != null ? `${totalReviews} reviews` : "Be the first" },
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
          {activity.bestFor && (
            <p className="mt-3 flex items-center gap-2 text-white/70">
              <ThumbsUp className="h-4 w-4 text-accent" aria-hidden />
              Best for: {activity.bestFor}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {affLink && (
              <AffiliateButton linkId={affLink.id} label={`Book ${activity.name}`} placement={`activity-${activity.slug}`} />
            )}
            <AddToTrip item={tripItem} />
          </div>
        </div>
      </div>

      {/* Quick facts strip */}
      <div className="border-b border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
          {quickFacts.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3 py-5">
                <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">{f.label}</p>
                  <p className="text-sm font-semibold text-ink">{f.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-x py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {/* Feature image */}
            {activity.image && (
              <div className="relative aspect-video overflow-hidden rounded-3xl">
                <Image src={activity.image} alt={activity.name} fill sizes="(max-width: 1024px) 100vw, 800px" priority className="object-cover" />
              </div>
            )}

            {/* Overview */}
            {activity.description && (
              <section className="mt-10">
                <h2 className="text-3xl">What to expect</h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{activity.description}</p>
                <div className="mt-6">
                  <AffiliateDisclosure short />
                </div>
              </section>
            )}

            {/* What's included hints */}
            <section className="mt-10">
              <h2 className="text-3xl">Good to know</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {activity.bestFor && (
                  <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-ink">Who it&apos;s for</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{activity.bestFor}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-ink">Booking tip</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      Popular slots fill up quickly — book in advance to lock in the best price and time.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-ink">Time needed</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      Plan around {activity.duration?.toLowerCase() ?? "your schedule"}. Great for combining with nearby attractions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
                  <ThumbsUp className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-ink">Save to trip</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      Tap <span className="font-semibold">Add to trip</span> to shortlist this experience while you plan.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section className="mt-14">
              <SectionHeading eyebrow="Traveller feedback" title={totalReviews != null && totalReviews > 0 ? `What travellers say` : "Reviews"} />
              <div className="mt-6">
                <ReviewsSection activityId={activity.id} seed={activity.reviews} />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl bg-brand-dark p-6 text-white">
                <h3 className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-accent" aria-hidden />
                  Book in advance
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  Popular tours sell out and prices rise closer to the date. Secure the best rate and skip queues.
                </p>
                {affLink && (
                  <div className="mt-5">
                    <AffiliateButton linkId={affLink.id} label="See available tours" placement={`activity-${activity.slug}-sidebar`} />
                  </div>
                )}
                {activity.priceRange && (
                  <p className="mt-4 text-sm text-white/70">
                    From around <span className="font-semibold text-white">{activity.priceRange}</span> per person
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <AddToTrip item={tripItem} />
                <p className="mt-3 text-xs text-ink-muted">
                  Saved to your trip dashboard on this device.
                </p>
              </div>

              {destinationRef && (
                <Link
                  href={`/destinations/${destinationRef.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-muted">Explore</p>
                    <p className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{destinationRef.name}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-brand" aria-hidden />
                </Link>
              )}
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <SectionHeading eyebrow="More to do" title={`More experiences in ${destinationRef?.name ?? "the area"}`} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={{
                    id: a.id,
                    name: a.name,
                    image: a.image,
                    description: a.description,
                    duration: a.duration,
                    priceRange: a.priceRange,
                    rating: a.rating,
                    category: a.category,
                    destinationName: a.destination?.name ?? null,
                    affiliateLinkId: a.affiliateLinks[0]?.id ?? null,
                  }}
                  linked
                />
              ))}
            </div>
          </section>
        )}

        <NewsletterCta
          title={`Travelling to ${destinationRef?.name ?? "a new place"}?`}
          description="Get the best experiences, money-saving tips and fresh destination guides in your inbox."
        />
      </div>
    </main>
  );
}
