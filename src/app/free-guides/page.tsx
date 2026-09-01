import Link from "next/link";
import { Download, FileText, Map, Sparkles } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { NewsletterForm } from "@/components/newsletter-form";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export const metadata = buildMetadata({
  title: "Free Travel Printables & Guides",
  description:
    "Download free Riversmag printables — printable itineraries, packing checklists and travel planning worksheets. Free forever, created by our editors.",
  canonicalPath: "/free-guides",
});

const GUIDES = [
  {
    slug: "paris-in-4-days",
    title: "Paris in 4 Days — Printable Itinerary",
    blurb: "A day-by-day plan for first-timers: what to see, where to eat and how to side-step the crowds.",
    points: ["4 day-by-day plans", "Metro-friendly route map", "Budget quick-reference", "Print-ready A4 & Letter"],
    tag: "Itinerary",
  },
  {
    slug: "rome-in-4-days",
    title: "Rome in 4 Days — Printable Itinerary",
    blurb: "Ancient Rome, the Vatican and baroque piazzas — routed to keep your feet and budget happy.",
    points: ["4 day-by-day plans", "Skip-the-line tips", "Walking-time estimates", "Print-ready"],
    tag: "Itinerary",
  },
  {
    slug: "bali-in-7-days",
    title: "7 Days in Bali — Printable Itinerary",
    blurb: "Beaches, Ubud and the Uluwatu cliffs in one week — without racing across the island.",
    points: ["7 day-by-day plans", "Island routing by region", "Budget per day", "Print-ready"],
    tag: "Itinerary",
  },
  {
    slug: "tokyo-in-4-days",
    title: "Tokyo in 4 Days — Printable Itinerary",
    blurb: "Asakusa, Shibuya, Shinjuku and one bold finale — the essentials without the sensory overload.",
    points: ["4 day-by-day plans", "Neighborhood routes", "Budget per day", "Print-ready"],
    tag: "Itinerary",
  },
  {
    slug: "free-packing-checklist",
    title: "The Ultimate Carry-On Packing Checklist",
    blurb: "Never over-pack again. A field-tested checklist built for one-bag and carry-on travellers.",
    points: ["Docs & wallet", "Carry-on essentials", "Clothing by climate", "Print-ready"],
    tag: "Checklist",
  },
];

export default function FreeGuidesPage() {
  return (
    <main className="container-x section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand-dark">
          <Sparkles className="h-4 w-4" aria-hidden />
          Free forever
        </div>
        <h1 className="text-4xl md:text-5xl">Free travel printables</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Grab the same checklists and itineraries our editors use to plan trips. Built to print, built to travel.
        </p>
      </div>

      <div className="mt-12">
        <Breadcrumbs items={buildCrumbs([{ name: "Free Printables", href: "/free-guides" }])} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {GUIDES.map((guide) => (
          <article
            key={guide.slug}
            className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <Map className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-dark">
                  {guide.tag}
                </span>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">{guide.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{guide.blurb}</p>
              </div>
            </div>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {guide.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-ink-soft">
                  <FileText className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl bg-sand p-5">
              <p className="mb-3 text-sm font-semibold text-ink">Enter your email to unlock it free:</p>
              <NewsletterForm variant="lead" downloadPath={`/printables/${guide.slug}`} />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-sand p-6 text-center">
        <p className="text-sm text-ink-soft">
          Prefer the full experience?{" "}
          <Link href="/itineraries" className="font-semibold text-brand hover:text-brand-dark">
            Browse all itineraries
          </Link>{" "}
          or{" "}
          <Link href="/guides" className="font-semibold text-brand hover:text-brand-dark">
            read our travel guides
          </Link>
          .
        </p>
      </div>
    </main>
  );
}