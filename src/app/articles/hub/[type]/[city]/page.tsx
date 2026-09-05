import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveAffiliateLink } from "@/lib/affiliate";
import { HUB_TYPES, isHubTypeSlug, type HubTypeSlug } from "@/lib/hubs";
import { HotelsHub, HubMetadata, type HotelsHubData } from "@/components/hub/hotels-hub";
import { ToursHub, ToursHubMetadata, type ToursHubData } from "@/components/hub/tours-hub";

export const dynamic = "force-dynamic";

const TOUR_HUBS: HubTypeSlug[] = ["best-tours", "things-to-do"];

type HubPageProps = {
  params: Promise<{ type: string; city: string }>;
};

export async function generateMetadata({ params }: HubPageProps) {
  const { type, city } = await params;
  if (!isHubTypeSlug(type)) return {};
  const hubType = HUB_TYPES[type];

  let destination: Awaited<ReturnType<typeof fetchDestinationMeta>> | null = null;
  try {
    destination = await fetchDestinationMeta(city);
  } catch {
    destination = null;
  }
  if (!destination || !destination.isActive) return {};

  if (TOUR_HUBS.includes(type)) {
    return ToursHubMetadata({
      hubType,
      destination: { name: destination.name, slug: destination.slug, coverImage: destination.coverImage },
      pageTitle: hubType.title(destination.name),
      pageDescription: hubType.description(destination.name),
    });
  }

  return HubMetadata({
    hubType,
    destination: { name: destination.name, slug: destination.slug, coverImage: destination.coverImage },
    pageTitle: hubType.title(destination.name),
    pageDescription: hubType.description(destination.name),
  });
}

async function fetchDestinationMeta(slug: string) {
  return prisma.destination.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, coverImage: true, isActive: true },
  });
}

export default async function HubPage({ params }: HubPageProps) {
  const { type, city } = await params;
  if (!isHubTypeSlug(type)) notFound();
  const hubType = HUB_TYPES[type];

  let destination: Awaited<ReturnType<typeof fetchDestination>> | null = null;
  try {
    destination = await fetchDestination(city);
  } catch {
    destination = null;
  }
  if (!destination || !destination.isActive) notFound();

  if (TOUR_HUBS.includes(type)) {
    let activities: Awaited<ReturnType<typeof fetchHubActivities>> = [];
    let articles: Awaited<ReturnType<typeof fetchHubArticles>> = [];
    let activityLink: Awaited<ReturnType<typeof resolveAffiliateLink>> = null;

    try {
      [activities, articles, activityLink] = await Promise.all([
        fetchHubActivities(destination.id),
        fetchHubArticles(destination.id),
        resolveAffiliateLink({ category: "ACTIVITIES", destinationId: destination.id }),
      ]);
    } catch {
      activities = [];
      articles = [];
      activityLink = null;
    }

    const itineraries = destination.itineraries.map((it) => ({
      id: it.id,
      title: it.title,
      slug: it.slug,
      days: it.days,
      summary: it.summary,
    }));

    const hub: ToursHubData = {
      hubType,
      destination: {
        id: destination.id,
        name: destination.name,
        slug: destination.slug,
        type: destination.type,
        tagline: destination.tagline,
        overview: destination.overview,
        coverImage: destination.coverImage,
        parent: destination.parent
          ? { name: destination.parent.name, slug: destination.parent.slug }
          : null,
        activityLinkId: activityLink?.id ?? null,
        activityLinkLabel: null,
      },
      activities,
      articles,
      itineraries,
      pageTitle: hubType.title(destination.name),
      pageDescription: hubType.description(destination.name),
    };

    return <ToursHub hub={hub} />;
  }

  let hotels: Awaited<ReturnType<typeof fetchHubHotels>> = [];
  let hotelLink: Awaited<ReturnType<typeof resolveAffiliateLink>> = null;

  try {
    [hotels, hotelLink] = await Promise.all([
      fetchHubHotels(destination.id),
      resolveAffiliateLink({ category: "HOTELS", destinationId: destination.id }),
    ]);
  } catch {
    hotels = [];
    hotelLink = null;
  }

  const hub: HotelsHubData = {
    hubType,
    destination: {
      id: destination.id,
      name: destination.name,
      slug: destination.slug,
      type: destination.type,
      tagline: destination.tagline,
      overview: destination.overview,
      coverImage: destination.coverImage,
      parent: destination.parent
        ? { name: destination.parent.name, slug: destination.parent.slug }
        : null,
      hotelLinkId: hotelLink?.id ?? null,
      hotelLinkLabel: null,
    },
    hotels,
    activities: destination.activities,
    itineraries: destination.itineraries,
    pageTitle: hubType.title(destination.name),
    pageDescription: hubType.description(destination.name),
  };

  return <HotelsHub hub={hub} />;
}

async function fetchDestination(slug: string) {
  return prisma.destination.findUnique({
    where: { slug },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      hotels: { where: { isActive: true } },
      activities: { where: { isActive: true } },
      itineraries: { where: { isActive: true } },
    },
  });
}

async function fetchHubActivities(destinationId: string) {
  return prisma.activity.findMany({
    where: { isActive: true, destinationId },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
  });
}

async function fetchHubArticles(destinationId: string) {
  return prisma.article.findMany({
    where: { destinationId, status: "PUBLISHED", allowIndexing: true },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 6,
  });
}

async function fetchHubHotels(destinationId: string) {
  return prisma.hotel.findMany({
    where: { isActive: true, destinationId },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ guestRating: "desc" }, { sorts: "desc" }],
  });
}
