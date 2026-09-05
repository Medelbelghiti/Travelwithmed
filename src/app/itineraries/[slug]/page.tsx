import { notFound } from "next/navigation";
import { MapPin, Sun, UtensilsCrossed, Hotel, Bus, Wallet, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { formatCurrency } from "@/lib/utils";
import { RelatedActivities } from "@/components/related/related-activities";
import { RelatedGuides } from "@/components/related/related-guides";

export const dynamic = "force-dynamic";

type ItineraryProps = {
  params: Promise<{ slug: string }>;
};

async function fetchItinerary(slug: string) {
  return prisma.itinerary.findUnique({
    where: { slug },
    include: {
      daysList: { orderBy: { dayNumber: "asc" } },
      destination: {
        include: {
          affiliateLinks: { where: { active: true } },
          hotels: { where: { isActive: true }, include: { affiliateLinks: { where: { active: true }, take: 1 } }, take: 3 },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: ItineraryProps) {
  const { slug } = await params;
  let itinerary: Awaited<ReturnType<typeof fetchItineraryMeta>> | null = null;
  try {
    itinerary = await fetchItineraryMeta(slug);
  } catch {
    itinerary = null;
  }
  if (!itinerary) return { title: "Itinerary not found" };
  return buildMetadata({
    title: itinerary.title,
    description: itinerary.summary ?? undefined,
    canonicalPath: `/itineraries/${itinerary.slug}`,
    ogImage: itinerary.coverImage ?? undefined,
    ogType: "article",
  });
}

async function fetchItineraryMeta(slug: string) {
  return prisma.itinerary.findUnique({ where: { slug }, include: { destination: { select: { name: true, slug: true } } } });
}

export default async function ItineraryPage({ params }: ItineraryProps) {
  const { slug } = await params;
  let itinerary: Awaited<ReturnType<typeof fetchItinerary>> | null = null;
  try {
    itinerary = await fetchItinerary(slug);
  } catch {
    itinerary = null;
  }

  if (!itinerary || !itinerary.isActive) notFound();

  const crumbs = buildCrumbs([
    { name: "Itineraries", href: "/itineraries" },
    { name: itinerary.title, href: `/itineraries/${itinerary.slug}` },
  ]);

  const links = {
    hotels: itinerary.destination?.affiliateLinks.find((l) => l.category === "HOTELS"),
    flights: itinerary.destination?.affiliateLinks.find((l) => l.category === "FLIGHTS"),
    activities: itinerary.destination?.affiliateLinks.find((l) => l.category === "ACTIVITIES"),
    insurance: itinerary.destination?.affiliateLinks.find((l) => l.category === "INSURANCE"),
    esim: itinerary.destination?.affiliateLinks.find((l) => l.category === "ESIM"),
  };

  return (
    <main>
      <JsonLdBreadcrumbs items={crumbs} />
      <div className="container-x pt-10">
        <Breadcrumbs items={crumbs} />

        <header className="max-w-3xl">
          <h1 className="text-4xl font-semibold md:text-5xl">{itinerary.title}</h1>
          {itinerary.summary && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{itinerary.summary}</p>}

          <div className="mt-6 flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm">
              <Sun className="h-4 w-4 text-brand" aria-hidden />
              {itinerary.days} days
            </span>
            {itinerary.travelStyle && (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm">
                <MapPin className="h-4 w-4 text-brand" aria-hidden />
                {itinerary.travelStyle}
              </span>
            )}
            {itinerary.totalEstimatedCost && (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm">
                <Wallet className="h-4 w-4 text-brand" aria-hidden />
                Est. {formatCurrency(itinerary.totalEstimatedCost, itinerary.currency)} / person
              </span>
            )}
          </div>

          {(links.hotels || links.flights || links.activities) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {links.hotels && <AffiliateButton linkId={links.hotels.id} label="Find hotels" size="sm" placement="itinerary-header" />}
              {links.flights && <AffiliateButton linkId={links.flights.id} label="Check flights" size="sm" placement="itinerary-header" variant="outline" />}
              {links.activities && <AffiliateButton linkId={links.activities.id} label="Book tours" size="sm" placement="itinerary-header" variant="accent" />}
            </div>
          )}
        </header>

        {/* Budget overview */}
        {itinerary.daysList.some((d) => d.estimatedCost) && (
          <section className="mt-10 max-w-3xl rounded-3xl bg-brand-light p-6">
            <h2 className="font-serif text-xl font-semibold text-brand-dark">Estimated daily costs</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {itinerary.daysList
                .filter((d) => d.estimatedCost)
                .map((d) => (
                  <div key={d.id} className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Day {d.dayNumber}</p>
                    <p className="font-semibold text-ink">
                      {formatCurrency(d.estimatedCost ?? 0, itinerary.currency)}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Days */}
        <section className="mt-12">
          <h2 className="mb-6 text-3xl">The plan</h2>
          <div className="space-y-8">
            {itinerary.daysList.map((day) => {
              const activities = (day.activities as string[] | null) ?? [];
              const restaurants = (day.restaurants as string[] | null) ?? [];
              return (
                <div key={day.id} className="rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-serif font-semibold text-white">
                      {day.dayNumber}
                    </span>
                    <h3 className="font-serif text-2xl font-semibold">{day.title ?? `Day ${day.dayNumber}`}</h3>
                    {day.location && <span className="text-sm font-medium text-ink-muted">{day.location}</span>}
                  </div>

                  {day.description && <p className="mt-4 leading-relaxed text-ink-soft">{day.description}</p>}

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {activities.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
                          <CheckCircle2 className="h-4 w-4 text-brand" aria-hidden />
                          Activities
                        </h4>
                        <ul className="mt-3 space-y-2">
                          {activities.map((activity, i) => (
                            <li key={i} className="flex gap-2 text-sm text-ink-soft">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {restaurants.length > 0 && (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
                          <UtensilsCrossed className="h-4 w-4 text-brand" aria-hidden />
                          Where to eat
                        </h4>
                        <ul className="mt-3 space-y-2">
                          {restaurants.map((restaurant, i) => (
                            <li key={i} className="flex gap-2 text-sm text-ink-soft">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                              {restaurant}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5 text-sm">
                    {day.hotel && (
                      <span className="inline-flex items-center gap-2 text-ink-soft">
                        <Hotel className="h-4 w-4 text-brand" aria-hidden />
                        <span className="font-medium text-ink">Stay:</span> {day.hotel}
                      </span>
                    )}
                    {day.transportation && (
                      <span className="inline-flex items-center gap-2 text-ink-soft">
                        <Bus className="h-4 w-4 text-brand" aria-hidden />
                        <span className="font-medium text-ink">Getting around:</span> {day.transportation}
                      </span>
                    )}
                    {day.estimatedCost ? (
                      <span className="inline-flex items-center gap-2 text-ink-soft">
                        <Wallet className="h-4 w-4 text-brand" aria-hidden />
                        <span className="font-medium text-ink">Est. cost:</span> {formatCurrency(day.estimatedCost, itinerary.currency)}
                      </span>
                    ) : null}
                  </div>

                  {day.affiliateLinks && Array.isArray(day.affiliateLinks) && (day.affiliateLinks as unknown[]).length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(day.affiliateLinks as { text?: string; label?: string; linkId: string }[]).map((link, i) => (
                        <AffiliateButton key={i} linkId={link.linkId} label={link.label ?? link.text ?? "Check prices"} size="sm" placement={`itinerary-day-${day.dayNumber}`} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommended hotels in the destination */}
        {itinerary.destination && itinerary.destination.hotels.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-2 text-3xl">Where to stay</h2>
            <p className="mb-6 text-ink-soft">Recommended places to base yourself during this trip.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {itinerary.destination.hotels.map((hotel) => (
                <div key={hotel.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                  <h3 className="font-serif text-lg font-semibold text-ink">{hotel.name}</h3>
                  {hotel.city && <p className="mt-0.5 text-sm text-ink-muted">{hotel.city}</p>}
                  {hotel.guestRating && (
                    <p className="mt-1 text-sm font-bold text-brand-dark">★ {hotel.guestRating.toFixed(1)}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {hotel.priceRange && <span className="text-sm font-semibold">{hotel.priceRange}</span>}
                    {hotel.affiliateLinks[0] && (
                      <AffiliateButton linkId={hotel.affiliateLinks[0].id} label="Check availability" size="sm" placement={`itinerary-${itinerary.slug}`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <RelatedActivities
          destinationId={itinerary.destination?.id}
          destinationName={itinerary.destination?.name}
        />
        <RelatedGuides
          destinationId={itinerary.destination?.id}
          destinationName={itinerary.destination?.name}
        />

        {/* Planning CTAs */}
        <section className="mt-14 rounded-3xl bg-sand p-8">
          <h2 className="text-2xl">Lock in the details</h2>
          <p className="mt-2 text-ink-soft">Book your flights, stays, tours and insurance for a smoother trip.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {links.flights && <AffiliateButton linkId={links.flights.id} label="Check flight prices" placement="itinerary-footer" category="FLIGHTS" destination={itinerary.destination?.name ?? undefined} />}
            {links.hotels && <AffiliateButton linkId={links.hotels.id} label="Compare hotels" placement="itinerary-footer" variant="outline" category="HOTELS" destination={itinerary.destination?.name ?? undefined} />}
            {links.activities && <AffiliateButton linkId={links.activities.id} label="Browse tours" placement="itinerary-footer" variant="accent" category="ACTIVITIES" destination={itinerary.destination?.name ?? undefined} />}
            {links.insurance && <AffiliateButton linkId={links.insurance.id} label="Get insurance" placement="itinerary-footer" variant="outline" category="INSURANCE" destination={itinerary.destination?.name ?? undefined} />}
            {links.esim && <AffiliateButton linkId={links.esim.id} label="Get an eSIM" placement="itinerary-footer" variant="outline" category="ESIM" destination={itinerary.destination?.name ?? undefined} />}
          </div>
          <div className="mt-6">
            <AffiliateDisclosure short />
          </div>
        </section>
      </div>
    </main>
  );
}