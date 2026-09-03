"use client";

import { useState, useMemo } from "react";
import { Search, X, Star, Clock, MapPin, Compass, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  duration: string | null;
  priceRange: string | null;
  rating: number | null;
  reviewCount: number | null;
  category: string | null;
  bestFor: string | null;
  destinationId: string | null;
  destinationName: string | null;
  destinationSlug: string | null;
  affiliateLinkId: string | null;
}

interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

function classifyDuration(d: string | null): string {
  if (!d) return "other";
  const lower = d.toLowerCase();
  if (lower.includes("hour") && (lower.includes("1") || lower.includes("2"))) return "short";
  if (lower.includes("half")) return "half-day";
  if (lower.includes("full") || lower.includes("8") || lower.includes("10")) return "full-day";
  if (lower.includes("day") || lower.includes("multi")) return "multi-day";
  return "other";
}

function classifyPrice(p: string | null): string {
  if (!p) return "other";
  const num = parseInt(p.replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return "other";
  if (num < 50) return "budget";
  if (num < 150) return "mid-range";
  return "premium";
}

function getFilters(activities: Activity[]): FilterConfig[] {
  const categories = [...new Set(activities.map((a) => a.category).filter(Boolean))] as string[];
  categories.sort();

  return [
    {
      key: "category",
      label: "Category",
      options: categories.map((c) => ({ label: c, value: c })),
    },
    {
      key: "duration",
      label: "Duration",
      options: [
        { label: "Under 3 hours", value: "short" },
        { label: "Half day", value: "half-day" },
        { label: "Full day", value: "full-day" },
        { label: "Multi-day", value: "multi-day" },
      ],
    },
    {
      key: "price",
      label: "Price",
      options: [
        { label: "Under $50", value: "budget" },
        { label: "$50 – $150", value: "mid-range" },
        { label: "$150+", value: "premium" },
      ],
    },
    {
      key: "rating",
      label: "Rating",
      options: [
        { label: "4.5+ stars", value: "4.5" },
        { label: "4+ stars", value: "4" },
      ],
    },
    {
      key: "destination",
      label: "Destination",
      options: (() => {
        const dests = activities
          .filter((a) => a.destinationName)
          .reduce<{ label: string; value: string }[]>((acc, a) => {
            if (!acc.find((d) => d.value === a.destinationId)) {
              acc.push({ label: a.destinationName!, value: a.destinationId! });
            }
            return acc;
          }, []);
        dests.sort((a, b) => a.label.localeCompare(b.label));
        return dests;
      })(),
    },
  ];
}

function ActivityCardItem({ activity }: { activity: Activity }) {
  return (
    <Link
      href={`/activities/${activity.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand">
        {activity.image ? (
          <Image
            src={activity.image}
            alt={activity.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <Compass className="h-8 w-8" aria-hidden />
          </div>
        )}
        {activity.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur-sm">
            {activity.category}
          </span>
        )}
        {activity.rating != null && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
            {activity.rating.toFixed(1)}
            {activity.reviewCount != null && <span className="text-ink-muted font-normal">({activity.reviewCount})</span>}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand">{activity.name}</h2>
        {activity.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{activity.description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          {activity.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {activity.duration}
            </span>
          )}
          {activity.destinationName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {activity.destinationName}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-line/50">
          {activity.priceRange && <span className="text-sm font-semibold text-ink">{activity.priceRange}</span>}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ActivitiesFilter({ activities, initialCategory }: { activities: Activity[]; initialCategory?: string }) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    initialCategory ? { category: initialCategory } : {},
  );
  const [showAll, setShowAll] = useState(true);

  const filters = useMemo(() => getFilters(activities), [activities]);
  const activeCount = Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          a.name.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.destinationName?.toLowerCase().includes(q) ||
          a.bestFor?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (activeFilters.category && a.category !== activeFilters.category) return false;
      if (activeFilters.duration && classifyDuration(a.duration) !== activeFilters.duration) return false;
      if (activeFilters.price && classifyPrice(a.priceRange) !== activeFilters.price) return false;
      if (activeFilters.rating && (!a.rating || a.rating < parseFloat(activeFilters.rating))) return false;
      if (activeFilters.destination && a.destinationId !== activeFilters.destination) return false;
      return true;
    });
  }, [activities, search, activeFilters]);

  const setFilter = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (next[key] === value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setShowAll(true);
  };

  const clearAll = () => {
    setSearch("");
    setActiveFilters({});
    setShowAll(false);
  };

  const displayed = showAll ? filtered : filtered.slice(0, 12);

  return (
    <div className="space-y-8">
      {/* Search + clear */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowAll(true);
            }}
            placeholder="Search tours, activities, destinations..."
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {search && (
            <button onClick={() => { setSearch(""); setShowAll(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-sand transition-colors">
            <X className="h-3.5 w-3.5" />
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Filter pills */}
      {filters.map((f) => (
        <div key={f.key} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted mr-1">{f.label}</span>
          {f.options.map((opt) => {
            const active = activeFilters[f.key] === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(f.key, opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  active
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-line bg-white text-ink-soft hover:border-brand/40 hover:text-ink",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ))}

      {/* Results count */}
      <p className="text-sm text-ink-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {activities.length} experiences
      </p>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-sand/50 p-12 text-center">
          <Compass className="mx-auto h-12 w-12 text-ink-muted" />
          <p className="mt-4 text-lg font-semibold text-ink">No experiences match your filters</p>
          <p className="mt-1 text-sm text-ink-muted">Try adjusting your search or removing some filters.</p>
          <button onClick={clearAll} className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((a) => (
            <ActivityCardItem key={a.id} activity={a} />
          ))}
        </div>
      )}

      {/* Show more */}
      {!showAll && filtered.length > 12 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-sand transition-colors"
          >
            Show all {filtered.length} experiences
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
