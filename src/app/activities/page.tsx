import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { ActivitiesFilter } from "@/components/activities-filter";
import { SectionHeading } from "@/components/ui/card";

export const metadata = {
  title: "Activities & Tours",
  description:
    "Discover the best tours and experiences worldwide — from food tours to day trips and adventure activities. Filter by category, duration, price and rating.",
};

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;

  const activities = await prisma.activity.findMany({
    where: { isActive: true },
    include: {
      destination: { select: { name: true, slug: true } },
      affiliateLinks: { where: { active: true }, take: 1 },
    },
    orderBy: [{ rating: "desc" }, { name: "asc" }],
    take: 60,
  });

  const crumbs = buildCrumbs([{ name: "Activities", href: "/activities" }]);

  const filterData = activities.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    image: a.image,
    description: a.description,
    duration: a.duration,
    priceRange: a.priceRange,
    rating: a.rating,
    reviewCount: a.reviewCount,
    category: a.category,
    bestFor: a.bestFor,
    destinationId: a.destinationId,
    destinationName: a.destination?.name ?? null,
    destinationSlug: a.destination?.slug ?? null,
    affiliateLinkId: a.affiliateLinks?.[0]?.id ?? a.affiliateLinkId ?? null,
  }));

  const categories = [...new Set(activities.map((a) => a.category).filter(Boolean))] as string[];
  categories.sort();

  const topRated = activities.filter((a) => a.rating && a.rating >= 4.5).slice(0, 6);

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={crumbs} />

      {/* Hero */}
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Book unforgettable experiences</span>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Tours & activities</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Curated tours, excursions and experiences in destinations around the world — vetted for quality and value,
          so you can book with confidence.
        </p>
      </header>

      {/* Top rated strip */}
      {topRated.length > 0 && (
        <section className="mb-12">
          <SectionHeading eyebrow="Most popular" title="Top-rated experiences" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topRated.map((a) => (
              <a
                key={a.id}
                href={`/activities/${a.slug}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {a.image ? (
                    <img src={a.image} alt={a.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-muted">★</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{a.name}</p>
                  <p className="text-xs text-ink-muted">{a.destination?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">★ {a.rating?.toFixed(1)}</p>
                  {a.priceRange && <p className="text-xs text-ink-muted">{a.priceRange}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Filter + grid */}
      <section>
        <ActivitiesFilter activities={filterData} initialCategory={categoryParam} />
      </section>

      {/* Category quick links */}
      {categories.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            eyebrow="Browse by type"
            title="Popular categories"
            description="Find the experience that matches your travel style."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((cat) => {
              const count = activities.filter((a) => a.category === cat).length;
              return (
                <a
                  key={cat}
                  href={`/activities?category=${encodeURIComponent(cat)}`}
                  className="group flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
                >
                  <span className="font-medium text-ink group-hover:text-brand">{cat}</span>
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-ink-muted">{count}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
