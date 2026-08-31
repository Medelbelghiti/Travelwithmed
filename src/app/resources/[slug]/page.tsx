import { notFound } from "next/navigation";
import { CategoryListing } from "@/components/category-listing";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const RESOURCE_CATEGORIES: Record<string, { label: string; blurb: string }> = {
  esim: { label: "eSIM", blurb: "Compare the best eSIM providers for travel and stay connected anywhere." },
  "travel-insurance": { label: "Travel Insurance", blurb: "Find the right travel insurance for your trip and budget." },
  visas: { label: "Visa Information", blurb: "Practical visa guidance for destinations around the world." },
  "car-rental": { label: "Car Rental", blurb: "Smart car rental tips and comparison guides." },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = RESOURCE_CATEGORIES[slug];
  if (!resource) return { title: "Resource not found" };
  return buildMetadata({
    title: `${resource.label} — Guides & Comparison`,
    description: resource.blurb,
    canonicalPath: `/resources/${slug}`,
  });
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = RESOURCE_CATEGORIES[slug];
  if (!resource) notFound();

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Resources", href: "/resources" }, { name: resource.label, href: `/resources/${slug}` }])} />
      <CategoryListing
        title={`${resource.label} guides`}
        eyebrow="Travel resources"
        description={resource.blurb}
        categorySlugs={[slug]}
      />
      <div className="mt-12">
        <AffiliateDisclosure />
      </div>
    </main>
  );
}