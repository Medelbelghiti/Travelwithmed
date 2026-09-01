import { CategoryListing } from "@/components/category-listing";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Travel Guides",
  description:
    "In-depth travel guides covering destinations, hotels, itineraries, travel gear and practical advice â€” from the Riversmag editorial team.",
};

export const dynamic = "force-dynamic";

export default function GuidesPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Travel Guides", href: "/guides" }])} />
      <CategoryListing
        title="Travel guides"
        eyebrow="The library"
        description="Deep-dive destination guides, hotel roundups, itineraries and practical planning advice."
        categoryType="content"
        linkHref="/articles"
        linkLabel="Browse every guide"
      />
    </main>
  );
}