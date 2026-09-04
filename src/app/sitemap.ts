import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { isShopEnabled } from "@/lib/fourthwall";

export const dynamic = "force-dynamic";

type PathEntry = { path: string; lastModified?: Date };

const firstDefined = (...values: (Date | null | undefined)[]): Date | undefined =>
  values.find((v): v is Date => v instanceof Date);

async function collectPaths() {
  const [destinations, articles, itineraries, hotels, activities] = await Promise.all([
    prisma.destination.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED", allowIndexing: true },
      select: { slug: true, updatedAt: true, updatedDate: true, publishedAt: true },
    }),
    prisma.itinerary.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
    prisma.hotel.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.activity.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // Static paths: indexable canonical URLs only.
  // Excluded (deliberately not indexed / not useful in the sitemap):
  //   /search (query params), /trip (personal), /printables/* (noindex),
  //   /admin/* and /api/* (auth, disallowed in robots.txt), /out/* (redirect tracker).
  const staticPaths: PathEntry[] = [
    { path: "" },
    { path: "/destinations" },
    { path: "/guides" },
    { path: "/itineraries" },
    { path: "/deals" },
    { path: "/free-guides" },
    { path: "/hotels" },
    { path: "/flights" },
    { path: "/activities" },
    { path: "/travel-gear" },
    { path: "/travel-tips" },
    { path: "/resources" },
    { path: "/resources/esim" },
    { path: "/resources/travel-insurance" },
    { path: "/resources/visas" },
    { path: "/resources/car-rental" },
    { path: "/budget-calculator" },
    { path: "/trip-planner" },
    { path: "/about" },
    { path: "/contact" },
    { path: "/editorial-policy" },
    { path: "/affiliate-disclosure" },
    { path: "/privacy-policy" },
    { path: "/terms" },
    { path: "/cookie-policy" },
  ];
  if (isShopEnabled()) staticPaths.push({ path: "/shop" });

  return {
    destinations: destinations.map((d): PathEntry => ({
      path: `/destinations/${d.slug}`,
      lastModified: d.updatedAt,
    })),
    articles: articles.map((a): PathEntry => ({
      path: `/articles/${a.slug}`,
      lastModified: firstDefined(a.updatedAt, a.updatedDate, a.publishedAt),
    })),
    itineraries: itineraries.map((i): PathEntry => ({
      path: `/itineraries/${i.slug}`,
      lastModified: firstDefined(i.updatedAt, i.publishedAt),
    })),
    hotels: hotels.map((h): PathEntry => ({
      path: `/hotels/${h.slug}`,
      lastModified: h.updatedAt,
    })),
    activities: activities.map((a): PathEntry => ({
      path: `/activities/${a.slug}`,
      lastModified: a.updatedAt,
    })),
    staticPaths,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { destinations, articles, itineraries, hotels, activities, staticPaths } = await collectPaths();

  const staticEntries = staticPaths.map((s): MetadataRoute.Sitemap[number] => ({
    url: `${siteConfig.url}${s.path}`,
    changeFrequency: "yearly",
    priority: s.path === "" ? 1 : s.path === "/destinations" ? 0.9 : 0.7,
  }));

  const dynamicEntries = (entries: PathEntry[], priority: number): MetadataRoute.Sitemap[number][] =>
    entries.map((e) => ({
      url: `${siteConfig.url}${e.path}`,
      lastModified: e.lastModified,
      changeFrequency: "weekly",
      priority,
    }));

  return [
    ...staticEntries,
    ...dynamicEntries(destinations, 0.9),
    ...dynamicEntries(articles, 0.7),
    ...dynamicEntries(itineraries, 0.7),
    ...dynamicEntries(hotels, 0.7),
    ...dynamicEntries(activities, 0.7),
  ];
}
