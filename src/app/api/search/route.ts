import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [articles, destinations, itineraries, hotels] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { title: true, slug: true },
      take: 6,
    }),
    prisma.destination.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { tagline: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { name: true, slug: true, type: true },
      take: 6,
    }),
    prisma.itinerary.findMany({
      where: {
        isActive: true,
        title: { contains: q, mode: "insensitive" },
      },
      select: { title: true, slug: true },
      take: 5,
    }),
    prisma.hotel.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: "insensitive" },
      },
      select: { name: true, slug: true },
      take: 5,
    }),
  ]);

  const results = [
    ...destinations.map((d) => ({
      type: "destination" as const,
      title: d.name,
      slug: d.slug,
      href: `/destinations/${d.slug}`,
    })),
    ...articles.map((a) => ({
      type: "article" as const,
      title: a.title,
      slug: a.slug,
      href: `/articles/${a.slug}`,
    })),
    ...itineraries.map((i) => ({
      type: "itinerary" as const,
      title: i.title,
      slug: i.slug,
      href: `/itineraries/${i.slug}`,
    })),
    ...hotels.map((h) => ({
      type: "hotel" as const,
      title: h.name,
      slug: h.slug,
      href: `/hotels/${h.slug}`,
    })),
  ].slice(0, 14);

  return NextResponse.json({ results });
}