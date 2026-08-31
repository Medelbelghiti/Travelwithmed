import Link from "next/link";
import { Map, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Travel Itineraries",
  description:
    "Ready-to-follow travel itineraries with day-by-day plans, budgets, hotel and activity recommendations.",
};

export const dynamic = "force-dynamic";

export default async function ItinerariesIndex() {
  const itineraries = await prisma.itinerary.findMany({
    where: { isActive: true },
    include: { destination: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Itineraries", href: "/itineraries" }])} />
      <SectionHeading
        eyebrow="Day by day"
        title="Travel itineraries"
        description="Follow a proven plan — every day mapped out with stays, sights, food and estimated budgets."
      />

      {itineraries.length === 0 ? (
        <p className="text-ink-muted">No itineraries published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((itinerary) => (
            <Link
              key={itinerary.id}
              href={`/itineraries/${itinerary.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between bg-brand-dark px-6 py-4">
                <span className="inline-flex items-center gap-2 font-serif text-lg font-semibold text-white">
                  <CalendarDays className="h-5 w-5 text-accent" aria-hidden />
                  {itinerary.days} days
                </span>
                <Map className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-serif text-xl font-semibold text-ink group-hover:text-brand">{itinerary.title}</h2>
                {itinerary.destination && (
                  <p className="mt-1 text-sm font-medium text-brand-dark">{itinerary.destination.name}</p>
                )}
                {itinerary.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{itinerary.summary}</p>}
                <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                  {itinerary.totalEstimatedCost ? (
                    <span className="font-semibold text-ink">
                      Est. {itinerary.currency} {itinerary.totalEstimatedCost.toLocaleString()} / person
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="font-semibold text-brand">
                    {itinerary.budgetLevel ?? "View itinerary"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}