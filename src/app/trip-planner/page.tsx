import { TripPlanner } from "@/components/trip-planner";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Trip Planner",
  description:
    "Plan your next trip in minutes — pick a destination, dates and travel style to get a day-by-day sketch, budget estimate and the practical booking steps.",
  canonicalPath: "/trip-planner",
});

export default function TripPlannerPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Trip Planner", href: "/trip-planner" }])} />
      <SectionHeading
        eyebrow="Dream it, plan it"
        title="Interactive trip planner"
        description="Sketch out your perfect trip in two minutes — destinations, dates, budget, style and interests."
      />
      <TripPlanner />
    </main>
  );
}