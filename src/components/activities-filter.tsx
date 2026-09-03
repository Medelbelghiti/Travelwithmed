"use client";

import { useState, useMemo } from "react";
import { Search, X, Star, Clock, MapPin, Compass, ArrowRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

const SORT_OPTIONS = [
  { value: "rating", label: "Highest rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "duration", label: "Duration: short to long" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

interface FilterOption {
  label: string;
  value: string;
}

function FilterGroupInner({
  label,
  options,
  activeFilters,
  onFilter,
}: {
  label: string;
  options: FilterOption[];
  activeFilters: Record<string, string>;
  onFilter: (key: string, value: string) => void;
}) {
  return (
    <div className="border-b border-line/70 pb-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">{label}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const active = activeFilters[label.toLowerCase()] === opt.value;
          return (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft hover:text-ink">
              <input
                type="checkbox"
                checked={active}
                onChange={() => onFilter(label.toLowerCase(), opt.value)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
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

function parsePrice(p: string | null): number {
  if (!p) return 0;
  return parseInt(p.replace(/[^0-9]/g, ""), 10) || 0;
}

function classifyPrice(p: string | null): string {
  const num = parsePrice(p);
  if (num <= 0) return "other";
  if (num < 50) return "budget";
  if (num < 150) return "mid-range";
  return "premium";
}

function ActivityCardItem({ activity }: { activity: Activity }) {
  return (
    <Link
      href={`/activities/${activity.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:bg-card-hover hover:shadow-xl"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
        {activity.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
            {activity.category}
          </span>
        )}
        {activity.rating != null && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
            {activity.rating.toFixed(1)}
            {activity.reviewCount != null && (
              <span className="font-normal text-white/75">({activity.reviewCount})</span>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand">
          {activity.name}
        </h2>
        {activity.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{activity.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          {activity.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-brand" aria-hidden />
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

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-line/60">
          <div>
            {activity.priceRange ? (
              <span className="text-base font-bold text-brand">from {activity.priceRange}</span>
            ) : (
              <span className="text-xs text-ink-muted">Price on request</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            View <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ActivitiesFilter({
  activities,
  initialCategory,
}: {
  activities: Activity[];
  initialCategory?: string;
}) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    initialCategory ? { category: initialCategory } : {},
  );
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [showAll, setShowAll] = useState(true);

  const categories = useMemo(
    () => [...new Set(activities.map((a) => a.category).filter(Boolean))].sort() as string[],
    [activities],
  );
  const destinations = useMemo(
    () =>
      [...new Map(activities.filter((a) => a.destinationName).map((a) => [a.destinationId, a])).values()]
        .sort((a, b) => (a.destinationName ?? "").localeCompare(b.destinationName ?? "")),
    [activities],
  );

  const activeCount = Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    let list = activities.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.description?.toLowerCase().includes(q) &&
          !a.category?.toLowerCase().includes(q) &&
          !a.destinationName?.toLowerCase().includes(q) &&
          !a.bestFor?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (activeFilters.category && a.category !== activeFilters.category) return false;
      if (activeFilters.duration && classifyDuration(a.duration) !== activeFilters.duration) return false;
      if (activeFilters.price && classifyPrice(a.priceRange) !== activeFilters.price) return false;
      if (activeFilters.rating && (!a.rating || a.rating < parseFloat(activeFilters.rating))) return false;
      if (activeFilters.destination && a.destinationId !== activeFilters.destination) return false;
      return true;
    });

    switch (sortBy) {
      case "rating":
        list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "reviews":
        list = [...list].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case "price-asc":
        list = [...list].sort((a, b) => parsePrice(a.priceRange) - parsePrice(b.priceRange));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => parsePrice(b.priceRange) - parsePrice(a.priceRange));
        break;
      case "duration": {
        const order: Record<string, number> = { short: 1, "half-day": 2, "full-day": 3, "multi-day": 4, other: 5 };
        list = [...list].sort(
          (a, b) => (order[classifyDuration(a.duration)] ?? 5) - (order[classifyDuration(b.duration)] ?? 5),
        );
        break;
      }
    }
    return list;
  }, [activities, search, activeFilters, sortBy]);

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

  const displayed = showAll ? filtered : filtered.slice(0, 9);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Sidebar filters (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Filter results</h2>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-brand hover:underline">
                Clear ({activeCount})
              </button>
            )}
          </div>
          <div className="space-y-5">
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="category"
              options={categories.map((c) => ({ label: c, value: c }))}
            />
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="duration"
              options={[
                { label: "Under 3 hours", value: "short" },
                { label: "Half day", value: "half-day" },
                { label: "Full day", value: "full-day" },
                { label: "Multi-day", value: "multi-day" },
              ]}
            />
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="price"
              options={[
                { label: "Under $50", value: "budget" },
                { label: "$50 – $150", value: "mid-range" },
                { label: "$150+", value: "premium" },
              ]}
            />
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="rating"
              options={[
                { label: "4.5+ stars", value: "4.5" },
                { label: "4+ stars", value: "4" },
              ]}
            />
            {destinations.length > 1 && (
              <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
                label="destination"
                options={destinations.map((d) => ({ label: d.destinationName!, value: d.destinationId! }))}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="min-w-0 space-y-6">
        {/* Search bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
              <button
                onClick={() => {
                  setSearch("");
                  setShowAll(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full appearance-none rounded-xl border border-line bg-white py-2.5 pl-4 pr-9 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              aria-label="Sort activities"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-ink-muted">
          Showing <span className="font-semibold text-ink">{filtered.length}</span> of {activities.length} experiences
        </p>

        {/* Mobile filter disclosure */}
        <details className="rounded-2xl border border-line bg-white p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filter results {activeCount > 0 && `(${activeCount})`}
            </span>
            <span className="text-brand">+</span>
          </summary>
          <div className="mt-4 space-y-4">
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="category"
              options={categories.map((c) => ({ label: c, value: c }))}
            />
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="duration"
              options={[
                { label: "Under 3 hours", value: "short" },
                { label: "Half day", value: "half-day" },
                { label: "Full day", value: "full-day" },
                { label: "Multi-day", value: "multi-day" },
              ]}
            />
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="price"
              options={[
                { label: "Under $50", value: "budget" },
                { label: "$50 – $150", value: "mid-range" },
                { label: "$150+", value: "premium" },
              ]}
            />
            <FilterGroupInner activeFilters={activeFilters} onFilter={setFilter}
              label="rating"
              options={[
                { label: "4.5+ stars", value: "4.5" },
                { label: "4+ stars", value: "4" },
              ]}
            />
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-sm font-medium text-brand hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        </details>

        {/* Results grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-sand/50 p-12 text-center">
            <Compass className="mx-auto h-12 w-12 text-ink-muted" />
            <p className="mt-4 text-lg font-semibold text-ink">No experiences match your filters</p>
            <p className="mt-1 text-sm text-ink-muted">Try adjusting your search or removing some filters.</p>
            <button
              onClick={clearAll}
              className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((a) => (
              <ActivityCardItem key={a.id} activity={a} />
            ))}
          </div>
        )}

        {!showAll && filtered.length > 9 && (
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
    </div>
  );
}
