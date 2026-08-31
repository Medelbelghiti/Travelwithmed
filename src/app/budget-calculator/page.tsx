import { BudgetCalculator } from "@/components/budget-calculator";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { SectionHeading } from "@/components/ui/card";

export const metadata = {
  title: "Travel Budget Calculator",
  description:
    "Estimate the real cost of your next trip — accommodation, food, transport, activities and flights, instantly.",
};

export default function BudgetCalculatorPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Travel Budget", href: "/budget-calculator" }])} />
      <SectionHeading
        eyebrow="Plan the numbers"
        title="Travel budget calculator"
        description="Get a realistic trip estimate in seconds. Adjust the sliders to match your travel style."
      />
      <BudgetCalculator />
    </main>
  );
}