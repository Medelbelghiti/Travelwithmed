import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { HotelsFilter } from "@/components/hotels-filter";
import { SectionHeading } from "@/components/ui/card";

export const metadata = buildMetadata({
  title: "Hotels",
  description:
    "Honest hotel reviews, neighbourhood guides and price comparisons — hand-picked stays with real pros and cons.",
  canonicalPath: "/hotels",
});

export const dynamic = "force-dynamic";

export default async function HotelsPage() {
  const hotels = await prisma.hotel.findMany({
    where: { isActive: true },
    include: {
      destination: { select: { name: true, slug: true } },
      affiliateLinks: { where: { active: true }, take: 1 },
    },
    orderBy: [{ starRating: "desc" }, { guestRating: "desc" }],
    take: 60,
  });

  const crumbs = buildCrumbs([{ name: "Hotels", href: "/hotels" }]);

  const filterData = hotels.map((h) => ({
    id: h.id,
    name: h.name,
    slug: h.slug,
    image: h.image,
    description: h.description,
    city: h.city,
    country: h.country,
    starRating: h.starRating,
    guestRating: h.guestRating,
    reviewCount: h.reviewCount,
    priceRange: h.priceRange,
    bestFor: h.bestFor,
    destinationId: h.destinationId,
    destinationName: h.destination?.name ?? null,
    destinationSlug: h.destination?.slug ?? null,
    affiliateLinkId: h.affiliateLinks?.[0]?.id ?? null,
  }));

  const topRated = hotels.filter((h) => h.guestRating && h.guestRating >= 9).slice(0, 6);

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={crumbs} />

      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Stay well</span>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Hotel reviews & stays</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          We visit, review and compare the best places to stay — so you can book the right room for your budget without
          the guesswork.
        </p>
      </header>

      {/* Top rated strip */}
      {topRated.length > 0 && (
        <section className="mb-12">
          <SectionHeading eyebrow="Guest favourites" title="Top-rated hotels" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRated.map((h) => (
              <a
                key={h.id}
                href={`/hotels/${h.slug}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {h.image ? (
                    <img src={h.image} alt={h.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-muted text-lg">★</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{h.name}</p>
                  <p className="text-xs text-ink-muted">{[h.city, h.country].filter(Boolean).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">★ {h.guestRating?.toFixed(1)}</p>
                  {h.priceRange && <p className="text-xs text-ink-muted">{h.priceRange}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <HotelsFilter hotels={filterData} />
      </section>
    </main>
  );
}
