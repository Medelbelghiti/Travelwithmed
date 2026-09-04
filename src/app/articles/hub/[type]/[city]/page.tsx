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

  const destination = await prisma.destination.findUnique({
    where: { slug: city },
    select: { id: true, name: true, slug: true, coverImage: true, isActive: true },
  });
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

export default async function HubPage({ params }: HubPageProps) {
  const { type, city } = await params;
  if (!isHubTypeSlug(type)) notFound();
  const hubType = HUB_TYPES[type];

  const destination = await prisma.destination.findUnique({
    where: { slug: city },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      hotels: { where: { isActive: true } },
      activities: { where: { isActive: true } },
      itineraries: { where: { isActive: true } },
    },
  });
  if (!destination || !destination.isActive) notFound();

  if (TOUR_HUBS.includes(type)) {
    const activities = await prisma.activity.findMany({
      where: { isActive: true, destinationId: destination.id },
      include: { affiliateLinks: { where: { active: true }, take: 1 } },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    });

    const activityLink = await resolveAffiliateLink({ category: "ACTIVITIES", destinationId: destination.id });

    const articles = await prisma.article.findMany({
      where: { destinationId: destination.id, status: "PUBLISHED", allowIndexing: true },
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

  const hotels = await prisma.hotel.findMany({
    where: { isActive: true, destinationId: destination.id },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ guestRating: "desc" }, { sorts: "desc" }],
  });

  const hotelLink = await resolveAffiliateLink({ category: "HOTELS", destinationId: destination.id });

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
