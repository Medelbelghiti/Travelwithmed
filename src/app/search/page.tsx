import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { ArticleCard } from "@/components/article-card";
import { Card, SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import Link from "next/link";
import { Compass, FileText, BedDouble, Map } from "lucide-react";
import type { ArticleType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface ResultGroup {
  title: string;
  icon: "destination" | "article" | "hotel" | "itinerary";
  hrefBase: string;
  items: { title: string; slug: string }[];
}

const ICONS = {
  destination: Compass,
  article: FileText,
  hotel: BedDouble,
  itinerary: Map,
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search: ${q}` : "Search",
    description: "Search destinations, travel guides, hotels, itineraries and resources on Riversmag.",
    canonicalPath: `/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (query.length < 2) {
    return (
      <div className="container-x section-pad">
        <Breadcrumbs items={buildCrumbs([{ name: "Search", href: "/search" }])} />
        <SectionHeading title="Search Riversmag" description="Search destinations, travel guides, hotels, itineraries and more." />
        <Card className="p-10 text-center">
          <p className="text-ink-muted">Enter at least two characters to start searching.</p>
        </Card>
      </div>
    );
  }

  const [articles, destinations, itineraries, hotels] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ title: { contains: query, mode: "insensitive" } }, { excerpt: { contains: query, mode: "insensitive" } }],
      },
      select: { title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true, type: true },
      take: 20,
    }),
    prisma.destination.findMany({
      where: {
        isActive: true,
        OR: [{ name: { contains: query, mode: "insensitive" } }, { tagline: { contains: query, mode: "insensitive" } }],
      },
      select: { name: true, slug: true, type: true, tagline: true },
      take: 20,
    }),
    prisma.itinerary.findMany({
      where: { isActive: true, title: { contains: query, mode: "insensitive" } },
      select: { title: true, slug: true, summary: true },
      take: 20,
    }),
    prisma.hotel.findMany({
      where: { isActive: true, name: { contains: query, mode: "insensitive" } },
      select: { name: true, slug: true, city: true },
      take: 20,
    }),
  ]);

  const total = articles.length + destinations.length + itineraries.length + hotels.length;

  const groups: ResultGroup[] = [
    ...(destinations.length
      ? [{ title: "Destinations", icon: "destination" as const, hrefBase: "/destinations", items: destinations.map((d) => ({ title: d.name, slug: d.slug })) }]
      : []),
    ...(articles.length
      ? [{ title: "Travel guides & articles", icon: "article" as const, hrefBase: "/articles", items: articles.map((a) => ({ title: a.title, slug: a.slug })) }]
      : []),
    ...(itineraries.length
      ? [{ title: "Itineraries", icon: "itinerary" as const, hrefBase: "/itineraries", items: itineraries.map((i) => ({ title: i.title, slug: i.slug })) }]
      : []),
    ...(hotels.length
      ? [{ title: "Hotels", icon: "hotel" as const, hrefBase: "/hotels", items: hotels.map((h) => ({ title: h.name, slug: h.slug })) }]
      : []),
  ];

  return (
    <div className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Search", href: "/search" }])} />
      <SectionHeading
        title={total > 0 ? `${total} result${total > 1 ? "s" : ""} for â€œ${query}â€` : `No results for â€œ${query}â€`}
        description={total === 0 ? "Try a different search term or browse our destination guides." : undefined}
      />

      {total === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-ink-muted">Try searching for a city like â€œParisâ€, â€œTokyoâ€ or â€œMarrakechâ€.</p>
        </Card>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => {
            const Icon = ICONS[group.icon];
            return (
              <section key={group.title}>
                <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                  {group.title}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={`${group.icon}-${item.slug}`}>
                      <Link
                        href={`${group.hrefBase}/${item.slug}`}
                        className="block rounded-xl border border-line bg-white px-5 py-4 shadow-sm transition-colors hover:border-brand"
                      >
                        <span className="font-semibold text-ink">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {articles.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold">Matching guides</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.slug} article={{ ...article, id: article.slug, type: article.type as ArticleType, authorName: null }} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}