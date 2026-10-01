import { DestinationDetail } from "@/components/destination/destination-detail";
import { notFound, permanentRedirect } from "next/navigation";
import { rethrowIfDatabaseUnavailable } from "@/lib/db-errors";
import { prisma } from "@/lib/prisma";
import { buildMetadata, articleSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

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
  } catch (error) {
    rethrowIfDatabaseUnavailable(error);
    destination = null;
  }
  if (!destination) return { title: "Destination not found" };
  const seo = destination.seoMetadata;
  return buildMetadata({
    title: seo?.title ?? `${destination.name} Travel Guide`,
    description: seo?.description ?? (destination.tagline ?? `The complete guide to ${destination.name}: best places to visit, where to stay, tours, itineraries, travel tips and practical advice.`),
    canonicalPath: seo?.canonicalUrl ?? `/destinations/${slug}`,
    ogImage: seo?.ogImage ?? destination.coverImage ?? undefined,
    ogType: "article",
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

  // Destinations live at a single canonical depth (/destinations/{slug}).
  // Collapse any deeper hierarchy path (e.g. /destinations/europe/france/paris)
  // to the canonical URL so search engines index one version only.
  if (path.length > 1) permanentRedirect(`/destinations/${slug}`);

  let destination: Awaited<ReturnType<typeof fetchDestination>> | null = null;
  try {
    destination = await fetchDestination(slug);
  } catch (error) {
    rethrowIfDatabaseUnavailable(error);
    destination = null;
  }

  if (!destination || !destination.isActive) notFound();

  const seo = destination.seoMetadata;

  /*
   * A destination guide is editorial content that changes when prices, visa
   * rules or transport options move. Emitting it as an Article with a
   * dateModified lets search engines treat it as a living page instead of a
   * flat web page, which is how the big travel publishers rank destination
   * pages at all. ogType "website" plus a bare name gave Google no freshness
   * signal and no author.
   */
  const schema = articleSchema({
    title: seo?.title ?? `${destination.name} Travel Guide`,
    description: seo?.description ?? destination.tagline ?? undefined,
    url: absoluteUrl(`/destinations/${slug}`),
    image: seo?.ogImage ?? destination.coverImage ?? null,
    modifiedTime: destination.updatedAt,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <DestinationDetail destination={destination} />
    </>
  );
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