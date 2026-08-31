import { CategoryListing } from "@/components/category-listing";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Travel Tips",
  description:
    "Practical travel advice — budget travel, packing, safety, solo travel and smarter ways to plan any trip.",
};

export const dynamic = "force-dynamic";

export default function TravelTipsPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Travel Tips", href: "/travel-tips" }])} />
      <CategoryListing
        title="Travel tips"
        eyebrow="Travel smarter"
        description="Practical advice on budgets, packing, safety and getting the most out of every trip."
        categorySlugs={["travel-tips"]}
      />
    </main>
  );
}