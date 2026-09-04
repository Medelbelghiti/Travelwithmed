import { CategoryListing } from "@/components/category-listing";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Travel Gear",
  description:
    "Better gear, better trips. Reviews and recommendations for backpacks, luggage, and every travel essential.",
  canonicalPath: "/travel-gear",
});

export const dynamic = "force-dynamic";

export default function TravelGearPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Travel Gear", href: "/travel-gear" }])} />
      <CategoryListing
        title="Travel gear"
        eyebrow="Pack right"
        description="Practical picks for backpacks, carry-on luggage, packing cubes and every travel essential."
        categorySlugs={["travel-gear"]}
      />
    </main>
  );
}