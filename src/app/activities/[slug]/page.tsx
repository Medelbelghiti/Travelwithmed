import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Star, Ticket, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { NewsletterCta } from "@/components/newsletter-cta";
import { ActivityCard } from "@/components/affiliate/activity-card";
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
        include: { affiliateLinks: { where: { active: true } } },
        take: 3,
      })
    : [];

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
        <div className="container-x relative py-14 md:py-20">
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
                {activity.rating.toFixed(1)}{activity.reviewCount ? ` / ${activity.reviewCount} reviews` : ""}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white md:text-6xl">{activity.name}</h1>
          {destinationRef && (
            <p className="mt-4 flex items-center gap-2 text-lg text-white/80">
              <MapPin className="h-5 w-5" aria-hidden />
              {destinationRef.name}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80">
            {activity.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden /> {activity.duration}
              </span>
            )}
            {activity.priceRange && <span className="font-semibold text-white">{activity.priceRange}</span>}
            {activity.bestFor && <span className="text-white/60 italic">Great for: {activity.bestFor}</span>}
          </div>
          {affLink && (
            <div className="mt-7">
              <AffiliateButton linkId={affLink.id} label={`Book ${activity.name}`} placement={`activity-${activity.slug}`} />
            </div>
          )}
        </div>
      </div>

      <div className="container-x py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {activity.image && (
              <div className="relative aspect-video overflow-hidden rounded-3xl">
                <Image src={activity.image} alt={activity.name} fill sizes="(max-width: 1024px) 100vw, 800px" priority className="object-cover" />
              </div>
            )}

            {activity.description && (
              <section className="mt-10">
                <h2 className="text-3xl">What to expect</h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{activity.description}</p>
                <div className="mt-6">
                  <AffiliateDisclosure short />
                </div>
              </section>
            )}
          </div>

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
                    affiliateLinkId: a.affiliateLinks[0]?.id ?? null,
                  }}
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