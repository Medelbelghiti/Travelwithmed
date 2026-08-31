import { DestinationDetail } from "@/components/destination/destination-detail";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const destination = await prisma.destination.findUnique({ where: { slug: path[path.length - 1] } });
  if (!destination) return { title: "Destination not found" };
  return buildMetadata({
    title: `${destination.name} Travel Guide`,
    description:
      destination.tagline ??
      `The complete guide to ${destination.name}: best places to visit, where to stay, tours, itineraries, travel tips and practical advice.`,
    canonicalPath: `/destinations/${path.join("/")}`,
    ogImage: destination.coverImage ?? undefined,
    ogType: "website",
  });
}

export default async function DestinationCatchAll({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const slug = path[path.length - 1];

  const destination = await prisma.destination.findUnique({
    where: { slug },
    include: {
      parent: {
        include: { parent: { include: { parent: true } } },
      },
      articles: { where: { status: "PUBLISHED" }, include: { author: true } },
      hotels: {
        where: { isActive: true },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
      },
      activities: {
        where: { isActive: true },
        include: { affiliateLinks: { where: { active: true }, take: 1 } },
      },
      itineraries: { where: { isActive: true } },
      affiliateLinks: { where: { active: true } },
      faqItems: true,
      seoMetadata: true,
    },
  });

  if (!destination || !destination.isActive) notFound();

  return <DestinationDetail destination={destination} />;
}