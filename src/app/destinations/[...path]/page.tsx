import { DestinationDetail } from "@/components/destination/destination-detail";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const slug = path[path.length - 1];
  let destination: { name: string; tagline: string | null; coverImage: string | null; seoMetadata: { title: string | null; description: string | null; canonicalUrl: string | null; ogImage: string | null; keywords: string | null } | null } | null = null;
  try {
    destination = await prisma.destination.findUnique({
      where: { slug },
      include: { seoMetadata: true },
    });
  } catch {
    destination = null;
  }
  if (!destination) return { title: "Destination not found" };
  const seo = destination.seoMetadata;
  return buildMetadata({
    title: seo?.title ?? `${destination.name} Travel Guide`,
    description: seo?.description ?? (destination.tagline ?? `The complete guide to ${destination.name}: best places to visit, where to stay, tours, itineraries, travel tips and practical advice.`),
    canonicalPath: seo?.canonicalUrl ?? `/destinations/${path.join("/")}`,
    ogImage: seo?.ogImage ?? destination.coverImage ?? undefined,
    ogType: "website",
    keywords: seo?.keywords ? seo.keywords.split(",").map((k) => k.trim()) : undefined,
  });
}

export default async function DestinationCatchAll({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const slug = path[path.length - 1];

  let destination: Awaited<ReturnType<typeof fetchDestination>> | null = null;
  try {
    destination = await fetchDestination(slug);
  } catch {
    destination = null;
  }

  if (!destination || !destination.isActive) notFound();

  return <DestinationDetail destination={destination} />;
}

async function fetchDestination(slug: string) {
  return prisma.destination.findUnique({
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
}