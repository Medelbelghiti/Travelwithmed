import Image from "next/image";
import Link from "next/link";
import { Compass, Clock, Star, ArrowRight } from "lucide-react";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Activities & Tours",
  description:
    "Discover the best tours and experiences worldwide — from food tours to day trips and adventure activities.",
};

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const activities = await prisma.activity.findMany({
    where: { isActive: true },
    include: { destination: { select: { name: true, slug: true } } },
    orderBy: [{ rating: "desc" }, { name: "asc" }],
    take: 60,
  });

  const crumbs = buildCrumbs([{ name: "Activities", href: "/activities" }]);

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={crumbs} />
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Book unforgettable experiences</span>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Tours & activities</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Curated tours, excursions and experiences in destinations around the world — vetted for quality and value,
          so you can book with confidence.
        </p>
      </header>

      {activities.length === 0 && <p className="text-sm text-ink-muted">Experiences coming soon.</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-sand">
              {activity.image ? (
                <Image
                  src={activity.image}
                  alt={activity.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-muted">
                  <Compass className="h-10 w-10" aria-hidden />
                </div>
              )}
              {activity.category && (
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
                  {activity.category}
                </span>
              )}
              {activity.rating != null && (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                  {activity.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand">{activity.name}</h2>
              {activity.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{activity.description}</p>}
              <div className="mt-3 flex items-center gap-4 text-sm text-ink-muted">
                {activity.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {activity.duration}
                  </span>
                )}
                {activity.priceRange && <span className="font-semibold text-ink">{activity.priceRange}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                {activity.destination && <span className="text-sm text-ink-muted">{activity.destination.name}</span>}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}