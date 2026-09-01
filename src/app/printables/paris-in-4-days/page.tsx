import { notFound } from "next/navigation";
import { Calendar, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { PrintButton } from "@/components/print-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Paris in 4 Days â€” Free Printable Itinerary",
  description:
    "Download and print the free Riversmag Paris itinerary: 4 days, day-by-day plans, metro-friendly routing, and a budget quick-reference.",
  canonicalPath: "/printables/paris-in-4-days",
  noindex: true,
});

export default async function PrintableParisPage() {
  const itinerary = await prisma.itinerary.findUnique({
    where: { slug: "paris-in-4-days" },
    include: {
      destination: true,
      author: true,
      daysList: { orderBy: { dayNumber: "asc" } },
    },
  });

  if (!itinerary) notFound();

  return (
    <main className="container-x section-pad">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-8 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Riversmag free printable
          </p>
          <PrintButton />
        </div>

        <article className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-12">
          <header className="border-b border-line pb-6">
            <h1 className="text-4xl font-semibold">{itinerary.title}</h1>
            {itinerary.summary && <p className="mt-3 text-lg text-ink-soft">{itinerary.summary}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
              {itinerary.destination && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden />
                  {itinerary.destination.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                {itinerary.days} days
              </span>
              {itinerary.totalEstimatedCost && (
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" aria-hidden />
                  Est. budget {itinerary.currency} {itinerary.totalEstimatedCost.toLocaleString()}
                </span>
              )}
              {itinerary.publishedAt && <span>Updated {formatDate(itinerary.publishedAt)}</span>}
            </div>
          </header>

          <div className="mt-8 space-y-6">
            {itinerary.daysList.map((day) => (
              <section key={day.id} className="rounded-2xl border border-line p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {day.dayNumber}
                  </span>
                  <h2 className="text-xl font-semibold">{day.title ?? `Day ${day.dayNumber}`}</h2>
                  {day.location && <span className="text-sm text-ink-muted">{day.location}</span>}
                </div>

                {day.description && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{day.description}</p>
                )}

                {Array.isArray(day.activities) && day.activities.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Highlights</h3>
                    <ul className="mt-2 space-y-1.5">
                      {day.activities.map((raw, i) => {
                        const item =
                          typeof raw === "string"
                            ? raw
                            : raw && typeof raw === "object" && "name" in raw && typeof raw.name === "string"
                              ? raw.name
                              : "";
                        if (!item) return null;
                        return (
                          <li key={i} className="list-inside list-disc text-sm text-ink-soft">
                            {item}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  {day.hotel && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Stay</h4>
                      <p className="mt-1 text-ink-soft">{day.hotel}</p>
                    </div>
                  )}
                  {day.estimatedCost != null && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Est. cost</h4>
                      <p className="mt-1 text-ink-soft">
                        {itinerary.currency} {day.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-8 border-t border-line pt-6 text-xs text-ink-muted">
            <p>
              Â© {new Date().getFullYear()} Riversmag. Free to print and share for personal use. This itinerary
              reflects editorial guidance at time of writing â€” always double-check opening hours and entry
              rules before you go.
            </p>
          </footer>
        </article>

        <p className="no-print mt-6 text-center text-sm text-ink-muted">
          Found this useful?{" "}
          <a href="/free-guides" className="font-semibold text-brand hover:text-brand-dark">
            Discover more free printables
          </a>
          .
        </p>
      </div>
    </main>
  );
}