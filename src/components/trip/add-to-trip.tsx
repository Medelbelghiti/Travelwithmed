"use client";

import { useTrip, type TripItem } from "@/lib/use-trip";

/** Button that toggles an activity in the saved trip (localStorage). */
export function AddToTrip({ item }: { item: TripItem }) {
  const { items, toggle } = useTrip();
  const added = items.some((i) => i.id === item.id);

  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={added}
      className={
        added
          ? "inline-flex items-center gap-2 rounded-full border border-brand bg-brand-light px-5 py-2.5 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand/10"
          : "inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
      }
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill={added ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 1 1 12 6.2 5.4 5.4 0 1 1 21.3 12C19 16.4 12 21 12 21z"
        />
      </svg>
      {added ? "Added to trip" : "Add to trip"}
    </button>
  );
}

/** Floating badge showing current trip count; links to the trip page. */
export function TripBadge() {
  const { items } = useTrip();

  if (items.length === 0) return null;

  return (
    <a
      href="/trip"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 1 1 12 6.2 5.4 5.4 0 1 1 21.3 12C19 16.4 12 21 12 21z" />
      </svg>
      My trip ({items.length})
    </a>
  );
}
