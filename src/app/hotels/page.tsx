import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Star, ArrowRight } from "lucide-react";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Hotels",
  description:
    "Honest hotel reviews, neighbourhood guides and price comparisons — hand-picked stays with real pros and cons.",
};

export const dynamic = "force-dynamic";

export default async function HotelsPage() {
  const hotels = await prisma.hotel.findMany({
    where: { isActive: true },
    include: { destination: { select: { name: true, slug: true } } },
    orderBy: [{ starRating: "desc" }, { name: "asc" }],
    take: 60,
  });

  const crumbs = buildCrumbs([{ name: "Hotels", href: "/hotels" }]);

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

      {hotels.length === 0 && <p className="text-sm text-ink-muted">Hotel reviews coming soon.</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <Link
            key={hotel.id}
            href={`/hotels/${hotel.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-sand">
              {hotel.image ? (
                <Image
                  src={hotel.image}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-muted">
                  <Building2 className="h-10 w-10" aria-hidden />
                </div>
              )}
              {hotel.guestRating != null && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                  {hotel.guestRating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand">{hotel.name}</h2>
                {hotel.starRating != null && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-accent" aria-label={`${hotel.starRating} star hotel`}>
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                    ))}
                  </span>
                )}
              </div>
              {(hotel.city || hotel.destination) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {[hotel.city, hotel.country].filter(Boolean).join(", ") || hotel.destination?.name}
                </p>
              )}
              {hotel.bestFor && <p className="mt-2 text-sm text-ink-soft">{hotel.bestFor}</p>}
              <div className="mt-auto flex items-center justify-between pt-4">
                {hotel.priceRange && <span className="text-sm font-semibold text-ink">{hotel.priceRange}</span>}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Read review <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}