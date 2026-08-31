import { CategoryListing } from "@/components/category-listing";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Flights",
  description:
    "Smart flight tips, route guides and the best ways to find cheap flights for your next trip.",
};

export const dynamic = "force-dynamic";

export default function FlightsPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Flights", href: "/flights" }])} />
      <CategoryListing
        title="Flight guides"
        eyebrow="Up, up and away"
        description="How to find cheap flights, when to book, and which routes suit your trip."
        categorySlugs={["flights"]}
      />
    </main>
  );
}