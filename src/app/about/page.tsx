import Link from "next/link";
import { Compass, ShieldCheck, Sparkles, HeartHandshake } from "lucide-react";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "About Riversmag",
  description:
    "Riversmag is an independent travel media brand helping people plan smarter and travel better.",
  canonicalPath: "/about",
});

const VALUES = [
  {
    icon: Compass,
    title: "Plan smarter",
    description:
      "We distil the noise down to clear, practical guidance — so you spend less time researching and more time travelling.",
  },
  {
    icon: ShieldCheck,
    title: "Trust first",
    description:
      "Honest recommendations, transparent disclosures and editorial independence. Your trust is our most important asset.",
  },
  {
    icon: Sparkles,
    title: "Travel better",
    description:
      "Whether it's a budget backpacking adventure or a once-in-a-lifetime luxury escape, we help you make the most of it.",
  },
  {
    icon: HeartHandshake,
    title: "People over pixels",
    description:
      "Every guide is written to help a real person plan a real trip — never to chase clicks or commissions.",
  },
];

export default function AboutPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "About", href: "/about" }])} />

      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">Our story</p>
        <h1 className="text-4xl font-semibold md:text-5xl">
          Plan smarter. <span className="text-brand">Travel better.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          {siteConfig.name} is an independent travel media platform on a mission to make trip planning
          simpler, smarter and more transparent. We combine destination journalism, honest reviews and
          practical tools — so you can plan with confidence, whatever kind of traveller you are.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((value) => {
          const Icon = value.icon;
          return (
            <div key={value.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <Icon className="h-7 w-7 text-brand" aria-hidden />
              <h2 className="mt-4 font-serif text-xl font-semibold text-ink">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{value.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-sand p-8">
          <h2 className="text-2xl">How we stay independent</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            We are reader-funded through transparent affiliate partnerships and never accept payment for
            positive coverage. When you book through our links we may earn a commission — at no extra cost to
            you — and that commitment is documented in our{" "}
            <Link href="/affiliate-disclosure" className="text-brand underline underline-offset-2">
              Affiliate Disclosure
            </Link>{" "}
            and{" "}
            <Link href="/editorial-policy" className="text-brand underline underline-offset-2">
              Editorial Policy
            </Link>.
          </p>
        </div>
        <div className="rounded-3xl bg-brand-dark p-8 text-white">
          <h2 className="text-2xl text-white">How we research</h2>
          <p className="mt-3 leading-relaxed text-white/75">
            Our editors visit destinations where possible, and clearly mark guides that are research-led.
            We verify prices, hours and practicalities, update content regularly, and correct errors promptly.
            If we can&apos;t verify something, we say so.
          </p>
        </div>
      </div>

      <div className="mt-14 rounded-3xl border border-line bg-white p-8 text-center">
        <h2 className="text-3xl">Ready to plan your next trip?</h2>
        <p className="mx-auto mt-2 max-w-xl text-ink-soft">
          Explore destination guides, build an itinerary or compare hotels and tours.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/destinations" className="rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark">
            Explore destinations
          </Link>
          <Link href="/itineraries" className="rounded-full border border-line bg-white px-7 py-3.5 text-sm font-semibold text-ink hover:border-brand">
            Browse itineraries
          </Link>
          <Link href="/budget-calculator" className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white hover:bg-accent-dark">
            Calculate your budget
          </Link>
        </div>
      </div>
    </main>
  );
}