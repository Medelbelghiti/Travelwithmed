import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DestinationCard, RegionCard } from "@/components/destination-card";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Destinations",
  description:
    "Explore destination guides from across Europe, Asia, Africa, the Americas and the Middle East — with hotel picks, itineraries and travel tips.",
  canonicalPath: "/destinations",
});

export const dynamic = "force-dynamic";

export default async function DestinationsIndex() {
  const [regions, countries, cities] = await Promise.all([
    prisma.destination.findMany({ where: { isActive: true, type: "REGION" }, orderBy: { sortOrder: "asc" } }),
    prisma.destination.findMany({ where: { isActive: true, type: "COUNTRY" }, include: { _count: { select: { articles: true } } }, orderBy: { name: "asc" }, take: 30 }),
    prisma.destination.findMany({ where: { isActive: true, type: "CITY" }, include: { _count: { select: { articles: true } } }, orderBy: { name: "asc" }, take: 24 }),
  ]);

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Destinations", href: "/destinations" }])} />
      <SectionHeading
        eyebrow="The world awaits"
        title="Explore destinations"
        description="In-depth destination guides with hotels, activities, itineraries and practical advice."
      />

      {regions.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-5 text-2xl font-semibold">Browse by region</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {regions.map((r) => (
              <RegionCard key={r.id} destination={{ id: r.id, name: r.name, slug: r.slug, type: r.type, tagline: r.tagline }} />
            ))}
          </div>
        </section>
      )}

      {countries.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-5 text-2xl font-semibold">Country guides</h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {countries.map((c) => (
              <DestinationCard key={c.id} destination={{ ...c, articleCount: c._count.articles }} />
            ))}
          </div>
        </section>
      )}

      {cities.length > 0 && (
        <section>
          <h2 className="mb-5 text-2xl font-semibold">City guides</h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {cities.map((c) => (
              <DestinationCard key={c.id} destination={{ ...c, articleCount: c._count.articles }} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 rounded-3xl bg-brand-dark p-8 text-white">
        <h2 className="text-2xl text-white md:text-3xl">Can&apos;t decide where to go?</h2>
        <p className="mt-2 max-w-xl text-white/75">
          Browse our best-of lists and style guides to find the destination that matches how you want to travel.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/travel-tips" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-sand">
            Travel tips <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/itineraries" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark">
            Ready-made itineraries <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}