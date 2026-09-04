import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/card";
import { ArticleCard } from "@/components/article-card";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import {
  EsimComparison,
  EsimVerifiedNote,
} from "@/components/affiliate/esim-comparison";
import { getActiveEsimProviders } from "@/lib/esim";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Best eSIM for Travel: Compare Plans & Stay Connected",
  description:
    "Compare the best travel eSIM providers by coverage, data, validity and price. Find the right plan for your destination, region or global trip — with data we keep verified.",
  canonicalPath: "/resources/esim",
});

export default async function EsimHubPage() {
  const [providers, guides, cityGroups] = await Promise.all([
    getActiveEsimProviders({ includeLinks: true }),
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        slug: {
          in: [
            "best-esim-for-travel-guide",
            "how-to-activate-travel-esim",
            "esim-vs-regular-sim-travel",
            "travel-esim-data-calculator",
          ],
        },
      },
      include: { author: true },
      orderBy: { publishedAt: "desc" },
    }),
    buildCityEsimGroups(),
  ]);

  return (
    <main>
      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-dark">
        <div className="container-x relative py-14 md:py-20">
          <Breadcrumbs items={buildCrumbs([{ name: "Resources", href: "/resources" }, { name: "eSIM", href: "/resources/esim" }])} />
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold text-white md:text-5xl">
            Compare the best travel eSIMs
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            One scan before you fly, data live the moment you land. We compare eSIM providers
            by coverage, data, validity and price — and we re-verify the figures so the
            numbers stay honest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {guides.map((g) => (
              <Link
                key={g.id}
                href={`/articles/${g.slug}`}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
              >
                {g.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container-x section-pad">
        <div className="mb-10">
          <EsimVerifiedNote providers={providers} />
        </div>

        <EsimComparison providers={providers} />

        {/* Evergreen guides */}
        {guides.length > 0 && (
          <section className="mt-16">
            <SectionHeading
              eyebrow="Learn"
              title="How to choose & activate your eSIM"
              description="Practical, evergreen guides to picking the right plan and setting it up without the usual pitfalls."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => (
                <ArticleCard
                  key={g.id}
                  article={{
                    id: g.id,
                    title: g.title,
                    slug: g.slug,
                    type: g.type,
                    excerpt: g.excerpt,
                    coverImage: g.coverImage,
                    publishedAt: g.publishedAt,
                    authorName: g.author?.name ?? null,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Best eSIM by destination — Country → City */}
        {cityGroups.length > 0 && (
          <section className="mt-16">
            <SectionHeading
              eyebrow="By destination"
              title="Best eSIM for your city"
              description="Dedicated eSIM guides for the destinations we cover, grouped by country."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cityGroups.map((country) => (
                <div key={country.countrySlug} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
                    <MapPin className="h-5 w-5 text-brand" aria-hidden />
                    {country.countryName}
                  </h3>
                  <ul className="mt-4 space-y-1">
                    {country.cities.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/articles/${c.slug}`}
                          className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-brand"
                        >
                          {c.title}
                          <ChevronRight className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12">
          <AffiliateDisclosure />
        </div>
      </div>
    </main>
  );
}

async function buildCityEsimGroups() {
  const esimArticles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      type: "DESTINATION_GUIDE",
      OR: [{ slug: { contains: "-esim" } }, { title: { contains: "eSIM", mode: "insensitive" } }],
      destinationId: { not: null },
    },
    include: {
      destination: {
        include: { parent: { select: { id: true, name: true, slug: true } } },
      },
    },
    orderBy: { title: "asc" },
  });

  const grouped = new Map<string, { countrySlug: string; countryName: string; cities: { slug: string; title: string }[] }>();
  for (const a of esimArticles) {
    const country = a.destination?.parent;
    const key = country?.slug ?? "other";
    if (!grouped.has(key)) {
      grouped.set(key, { countrySlug: key, countryName: country?.name ?? "More destinations", cities: [] });
    }
    grouped.get(key)!.cities.push({ slug: a.slug, title: a.title });
  }
  return [...grouped.values()].sort((a, b) => a.countryName.localeCompare(b.countryName));
}
