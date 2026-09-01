import { Calendar, Wallet } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { PrintButton } from "@/components/print-button";
import { formatDate } from "@/lib/utils";

type PrintableItinerary = Prisma.ItineraryGetPayload<{
  include: { destination: true; author: true; daysList: { orderBy: { dayNumber: "asc" } } };
}>;

export function PrintableItinerary({ itinerary }: { itinerary: PrintableItinerary }) {
  return (
    <>
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
      </article>
    </>
  );
}