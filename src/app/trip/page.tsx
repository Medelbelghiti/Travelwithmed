"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock, MapPin, Star, Trash2, Compass, Check, Plus } from "lucide-react";
import { useTrip } from "@/lib/use-trip";

function parsePrice(p: string | null): number {
  if (!p) return 0;
  return parseInt(p.replace(/[^0-9]/g, ""), 10) || 0;
}

export default function TripDashboard() {
  const { items, remove, clear, count } = useTrip();
  const [planName, setPlanName] = useState("");

  const totalMin = items.reduce((sum, i) => sum + parsePrice(i.priceRange), 0);
  const avgRating = items.length
    ? items.reduce((sum, i) => sum + (i.rating ?? 0), 0) / items.length
    : 0;
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <main className="container-x py-14">
      <header className="mb-10">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Your selection</span>
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Your trip dashboard</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Build a shortlist of experiences and activities as you browse. Review the total cost, duration and rating,
          then export or start fresh whenever you like.
        </p>
      </header>

      {count === 0 ? (
        <div className="rounded-3xl border border-line bg-sand/50 p-16 text-center">
          <Compass className="mx-auto h-14 w-14 text-ink-muted" />
          <h2 className="mt-5 text-2xl font-semibold text-ink">Your trip is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Browse our tours and activities and tap <span className="font-semibold">Add to trip</span> on anything
            that catches your eye.
          </p>
          <Link
            href="/activities"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Explore activities
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Items list */}
          <section>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:w-32">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="160px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ink-muted">
                        <Compass className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.category && (
                        <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-ink-muted">
                          {item.category}
                        </span>
                      )}
                      {item.rating != null && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <Link href={`/activities/${item.slug}`} className="mt-1 block font-serif text-lg font-semibold text-ink hover:text-brand">
                      {item.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      {item.duration && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {item.duration}
                        </span>
                      )}
                      {item.destinationName && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.destinationName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    {item.priceRange ? (
                      <span className="text-sm font-bold text-ink">from {item.priceRange}</span>
                    ) : (
                      <span className="text-xs text-ink-muted">Price on request</span>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link
                href="/activities"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
              >
                <Plus className="h-4 w-4" />
                Add more activities
              </Link>
              <button onClick={clear} className="text-sm font-medium text-ink-muted hover:text-danger">
                Clear all
              </button>
            </div>
          </section>

          {/* Summary */}
          <aside>
            <div className="sticky top-24 rounded-2xl bg-brand-dark p-6 text-white">
              <h2 className="text-xl font-semibold">Trip summary</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-white/70">Experiences</dt>
                  <dd className="font-semibold">{count}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/70">Estimated total</dt>
                  <dd className="font-semibold">from ${totalMin.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-white/70">Avg. rating</dt>
                  <dd className="font-semibold">★ {avgRating.toFixed(1)}</dd>
                </div>
                {categories.length > 0 && (
                  <div>
                    <dt className="text-white/70">Categories</dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <span key={c} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                          {c}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 border-t border-white/15 pt-5">
                <label className="text-xs font-medium text-white/70">Name this trip (optional)</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Rome in May"
                  className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
                />
              </div>

              <p className="mt-5 flex items-start gap-2 text-xs text-white/60">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                Your shortlist is saved on this device. Booking is handled securely on our partner sites after you
                select each experience.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
