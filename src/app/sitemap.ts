import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

async function collectPaths() {
  const [destinations, articles, itineraries, hotels, activities] = await Promise.all([
    prisma.destination.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.article.findMany({ where: { status: "PUBLISHED", allowIndexing: true }, select: { slug: true } }),
    prisma.itinerary.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.hotel.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.activity.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  const staticPaths = [
    "",
    "/destinations",
    "/guides",
    "/itineraries",
    "/deals",
    "/free-guides",
    "/hotels",
    "/flights",
    "/activities",
    "/travel-gear",
    "/travel-tips",
    "/resources",
    "/resources/esim",
    "/resources/travel-insurance",
    "/resources/visas",
    "/resources/car-rental",
    "/budget-calculator",
    "/trip-planner",
    "/about",
    "/contact",
    "/editorial-policy",
    "/affiliate-disclosure",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
  ];
  const staticPaths2 = staticPaths.map((p) => ({ path: p, lastModified: undefined as undefined }));

  return {
    destinations: destinations.map((d) => ({ path: `/destinations/${d.slug}`, lastModified: undefined as Date | undefined })),
    articles: articles.map((a) => ({ path: `/articles/${a.slug}` })),
    itineraries: itineraries.map((i) => ({ path: `/itineraries/${i.slug}` })),
    hotels: hotels.map((h) => ({ path: `/hotels/${h.slug}`, lastModified: undefined as Date | undefined })),
    activities: activities.map((a) => ({ path: `/activities/${a.slug}`, lastModified: undefined as Date | undefined })),
    staticPaths2,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { destinations, articles, itineraries, hotels, activities, staticPaths2 } = await collectPaths();

  const all = [
    ...staticPaths2.map((s) => ({
      url: `${siteConfig.url}${s.path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: s.path === "" ? 1 : 0.8,
    })),
    ...destinations.map((d) => ({
      url: `${siteConfig.url}${d.path}`,
      lastModified: d.lastModified ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...articles.map((a) => ({
      url: `${siteConfig.url}${a.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...itineraries.map((i) => ({
      url: `${siteConfig.url}${i.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...hotels.map((h) => ({
      url: `${siteConfig.url}${h.path}`,
      lastModified: h.lastModified ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...activities.map((a) => ({
      url: `${siteConfig.url}${a.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];

  return all as MetadataRoute.Sitemap;
}