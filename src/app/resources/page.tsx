import { CategoryListing } from "@/components/category-listing";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Travel Resources",
  description:
    "Everything you need before you go — eSIMs, travel insurance, visas, packing and money tips.",
  canonicalPath: "/resources",
});

export const dynamic = "force-dynamic";

export default function ResourcesPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Travel Resources", href: "/resources" }])} />
      <CategoryListing
        title="Travel resources"
        eyebrow="Before you go"
        description="Compare eSIM plans, find the right travel insurance, sort your visa and pack smarter."
        categoryType="planning"
      />
    </main>
  );
}