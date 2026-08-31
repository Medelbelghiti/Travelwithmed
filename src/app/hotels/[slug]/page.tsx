import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  Building2,
  Check,
  BadgeCheck,
  BedDouble,
  Landmark,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { NewsletterCta } from "@/components/newsletter-cta";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HotelPageProps = {
  params: Promise<{ slug: string }>;
};

type JsonArray = string[];

function asArray(value: unknown): JsonArray {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

export async function generateMetadata({ params }: HotelPageProps) {
  const { slug } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    include: { destination: true, affiliateLinks: { where: { active: true } } },
  });
  if (!hotel || !hotel.isActive) return { title: "Hotel not found" };

  return buildMetadata({
    title: `${hotel.name} Review — Photos & Honest Opinion`,
    description:
      hotel.description?.slice(0, 160) ??
      `An honest, detailed review of ${hotel.name}${hotel.city ? ` in ${hotel.city}` : ""} — amenities, pricing, best rooms and how to book it for less.`,
    canonicalPath: `/hotels/${hotel.slug}`,
    ogImage: hotel.image ?? undefined,
    noindex: false,
  });
}

export default async function HotelPage({ params }: HotelPageProps) {
  const { slug } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { slug },
    include: {
      destination: { select: { id: true, name: true, slug: true } },
      affiliateLinks: { where: { active: true } },
      reviews: { include: { authorRef: true }, orderBy: { createdAt: "desc" }, take: 6 },
      media: true,
    },
  });

  if (!hotel || !hotel.isActive) notFound();

  const amenities = asArray(hotel.amenities);
  const pros = asArray(hotel.pros);
  const cons = asArray(hotel.cons);
  const roomOptions = asArray(hotel.roomOptions);
  const nearby = asArray(hotel.nearbyAttractions);

  const affLink = hotel.affiliateLinks[0];
  const destinationRef = hotel.destination;

  const crumbItems = buildCrumbs([
    { name: "Hotels", href: "/hotels" },
    ...(destinationRef ? [{ name: destinationRef.name, href: `/destinations/${destinationRef.slug}` }] : []),
    { name: hotel.name, href: `/hotels/${hotel.slug}` },
  ]);

  const similarHotels = destinationRef
    ? await prisma.hotel.findMany({
        where: { isActive: true, destinationId: destinationRef.id, id: { not: hotel.id } },
        include: { affiliateLinks: { where: { active: true } } },
        take: 3,
      })
    : [];

  const imageSrc = hotel.image;

  return (
    <main>
      <JsonLdBreadcrumbs items={crumbItems} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: hotel.name,
            description: hotel.description,
            image: hotel.image,
            url: absoluteUrl(`/hotels/${hotel.slug}`),
            address: {
              "@type": "PostalAddress",
              ...(hotel.city ? { addressLocality: hotel.city } : {}),
              ...(hotel.country ? { addressCountry: hotel.country } : {}),
            },
            ...(hotel.starRating ? { starRating: { "@type": "Rating", ratingValue: hotel.starRating } } : {}),
            ...(hotel.guestRating
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: hotel.guestRating, reviewCount: hotel.reviewCount ?? 1 } }
              : {}),
          }),
        }}
      />

      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-dark">
        <div className="container-x relative py-14 md:py-20">
          <Breadcrumbs items={crumbItems} />
          <div className="flex flex-wrap items-center gap-2">
            {hotel.starRating != null && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" aria-hidden />
                ))}
                <span className="ml-1 uppercase tracking-wide">{hotel.starRating} star</span>
              </span>
            )}
            {hotel.guestRating != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                <BadgeCheck className="h-4 w-4 text-accent" aria-hidden />
                {hotel.guestRating.toFixed(1)}{hotel.reviewCount ? ` / ${hotel.reviewCount} reviews` : ""}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white md:text-6xl">{hotel.name}</h1>
          {hotel.city && (
            <p className="mt-4 flex items-center gap-2 text-lg text-white/80">
              <MapPin className="h-5 w-5" aria-hidden />
              {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ")}
            </p>
          )}
          {hotel.bestFor && <p className="mt-3 max-w-2xl text-white/60 italic">Best for: {hotel.bestFor}</p>}
          {affLink && (
            <div className="mt-7">
              <AffiliateButton linkId={affLink.id} label={`Check availability at ${hotel.name}`} placement={`hotel-${hotel.slug}`} />
            </div>
          )}
        </div>
      </div>

      <div className="container-x py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {/* Image */}
            {imageSrc && (
              <div className="relative aspect-video overflow-hidden rounded-3xl">
                <Image src={imageSrc} alt={hotel.name} fill sizes="(max-width: 1024px) 100vw, 800px" priority className="object-cover" />
              </div>
            )}

            {/* Description */}
            {hotel.description && (
              <section className="mt-10">
                <h2 className="text-3xl">About the hotel</h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{hotel.description}</p>
                <div className="mt-6">
                  <AffiliateDisclosure short />
                </div>
              </section>
            )}

            {/* Pros & cons */}
            {(pros.length > 0 || cons.length > 0) && (
              <section className="mt-10">
                <h2 className="text-3xl">What we like and don&apos;t like</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {pros.length > 0 && (
                    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-emerald-700">
                        <Check className="h-5 w-5" aria-hidden /> Pros
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {pros.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-sm text-ink-soft">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cons.length > 0 && (
                    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-rose-700">
                        <span className="text-xl leading-none">−</span> Cons
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {cons.map((c) => (
                          <li key={c} className="flex items-start gap-2 text-sm text-ink-soft">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="mt-10">
                <h2 className="text-3xl">Amenities</h2>
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amenities.map((a) => (
                    <li key={a} className="flex items-center gap-3 rounded-xl border border-line bg-sand/50 px-4 py-3 text-sm text-ink-soft">
                      <Building2 className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Room options */}
            {roomOptions.length > 0 && (
              <section className="mt-10">
                <h2 className="text-3xl">Rooms & rates at a glance</h2>
                <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white shadow-sm">
                  {roomOptions.map((r) => (
                    <li key={r} className="flex items-center gap-3 px-5 py-4">
                      <BedDouble className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                      <span className="text-sm text-ink-soft">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Nearby attractions */}
            {nearby.length > 0 && (
              <section className="mt-10">
                <h2 className="text-3xl">Nearby attractions</h2>
                <ul className="mt-6 space-y-3">
                  {nearby.map((n) => (
                    <li key={n} className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm text-ink-soft">
                      <Landmark className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                      {n}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Reviews */}
            {hotel.reviews.length > 0 && (
              <section className="mt-10">
                <SectionHeading eyebrow="In their words" title="Guest reviews" />
                <div className="mt-6 space-y-4">
                  {hotel.reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark">
                            {(r.author ?? r.authorRef?.name ?? "G").charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-ink">{r.author ?? r.authorRef?.name ?? "Anonymous"}</p>
                            {r.rating != null && (
                              <span className="flex items-center gap-0.5 text-sm text-accent" aria-label={`${r.rating} out of 5 stars`}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating ?? 0) ? "fill-accent" : "fill-line text-line"}`} aria-hidden />
                                ))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {r.title && <p className="mt-3 font-semibold text-ink">{r.title}</p>}
                      {r.content && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.content}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl bg-brand-dark p-6 text-white">
                <h3 className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" aria-hidden />
                  Book for less
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  We compare a dozen booking platforms so you don&apos;t have to. Prices change daily — check the best current rate.
                </p>
                {affLink && (
                  <div className="mt-5">
                    <AffiliateButton linkId={affLink.id} label="Compare prices" placement={`hotel-${hotel.slug}-sidebar`} />
                  </div>
                )}
                {hotel.priceRange && (
                  <p className="mt-4 text-sm text-white/70">
                    Typical price per night: <span className="font-semibold text-white">{hotel.priceRange}</span>
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

        {similarHotels.length > 0 && (
          <section className="mt-16">
            <SectionHeading eyebrow="More stays" title={`Other stays near ${destinationRef?.name ?? "this hotel"}`} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarHotels.map((h) => (
                <Link
                  key={h.id}
                  href={`/hotels/${h.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                    {h.image ? (
                      <Image src={h.image} alt={h.name} fill sizes="400px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink-muted">
                        <Building2 className="h-8 w-8" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{h.name}</h3>
                    {h.bestFor && <p className="mt-1 text-sm text-ink-soft">{h.bestFor}</p>}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      {h.priceRange && <span className="text-sm font-semibold text-ink">{h.priceRange}</span>}
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                        View <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <NewsletterCta
          title={`Planning a trip to ${destinationRef?.name ?? "your next destination"}?`}
          description="Get honest hotel reviews, neighbourhood guides and money-saving booking tips delivered to your inbox."
        />
      </div>
    </main>
  );
}