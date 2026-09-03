"use client";

import { useState, useMemo } from "react";
import { Search, X, Star, MapPin, Building2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  city: string | null;
  country: string | null;
  starRating: number | null;
  guestRating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  bestFor: string | null;
  destinationId: string | null;
  destinationName: string | null;
  destinationSlug: string | null;
  affiliateLinkId: string | null;
}

function classifyPrice(p: string | null): string {
  if (!p) return "other";
  const num = parseInt(p.replace(/[^0-9]/g, ""), 10);
  if (isNaN(num)) return "other";
  if (num < 100) return "budget";
  if (num < 250) return "mid-range";
  return "luxury";
}

function getFilters(hotels: Hotel[]) {
  const dests = hotels
    .filter((h) => h.destinationName)
    .reduce<{ label: string; value: string }[]>((acc, h) => {
      if (!acc.find((d) => d.value === h.destinationId)) {
        acc.push({ label: h.destinationName!, value: h.destinationId! });
      }
      return acc;
    }, []);
  dests.sort((a, b) => a.label.localeCompare(b.label));

  return [
    {
      key: "starRating",
      label: "Star rating",
      options: [
        { label: "5 stars", value: "5" },
        { label: "4 stars", value: "4" },
        { label: "3 stars", value: "3" },
      ],
    },
    {
      key: "price",
      label: "Price",
      options: [
        { label: "Under $100", value: "budget" },
        { label: "$100 – $250", value: "mid-range" },
        { label: "$250+", value: "luxury" },
      ],
    },
    {
      key: "guestRating",
      label: "Guest rating",
      options: [
        { label: "9+ rating", value: "9" },
        { label: "8+ rating", value: "8" },
        { label: "7+ rating", value: "7" },
      ],
    },
    {
      key: "destination",
      label: "Destination",
      options: dests,
    },
  ];
}

function HotelCardItem({ hotel }: { hotel: Hotel }) {
  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {hotel.image ? (
          <Image
            src={hotel.image}
            alt={hotel.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <Building2 className="h-8 w-8" aria-hidden />
          </div>
        )}
        {hotel.guestRating != null && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
            {hotel.guestRating.toFixed(1)}
          </span>
        )}
        {hotel.starRating != null && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur-sm">
            {hotel.starRating}★
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand truncate">{hotel.name}</h2>
        </div>
        {(hotel.city || hotel.destinationName) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {[hotel.city, hotel.country].filter(Boolean).join(", ") || hotel.destinationName}
          </p>
        )}
        {hotel.bestFor && <p className="mt-2 line-clamp-1 text-sm text-ink-soft">{hotel.bestFor}</p>}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-line/50">
          {hotel.priceRange && <span className="text-sm font-semibold text-ink">{hotel.priceRange}</span>}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Review <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HotelsFilter({ hotels }: { hotels: Hotel[] }) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  const filters = useMemo(() => getFilters(hotels), [hotels]);
  const activeCount = Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          h.name.toLowerCase().includes(q) ||
          h.description?.toLowerCase().includes(q) ||
          h.city?.toLowerCase().includes(q) ||
          h.country?.toLowerCase().includes(q) ||
          h.bestFor?.toLowerCase().includes(q) ||
          h.destinationName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (activeFilters.starRating && h.starRating !== parseInt(activeFilters.starRating)) return false;
      if (activeFilters.price && classifyPrice(h.priceRange) !== activeFilters.price) return false;
      if (activeFilters.guestRating && (!h.guestRating || h.guestRating < parseFloat(activeFilters.guestRating))) return false;
      if (activeFilters.destination && h.destinationId !== activeFilters.destination) return false;
      return true;
    });
  }, [hotels, search, activeFilters]);

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
            placeholder="Search hotels by name, city, destination..."
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

      <p className="text-sm text-ink-muted">
        Showing <span className="font-semibold text-ink">{filtered.length}</span> of {hotels.length} hotels
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-sand/50 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-ink-muted" />
          <p className="mt-4 text-lg font-semibold text-ink">No hotels match your filters</p>
          <p className="mt-1 text-sm text-ink-muted">Try adjusting your search or removing some filters.</p>
          <button onClick={clearAll} className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((h) => (
            <HotelCardItem key={h.id} hotel={h} />
          ))}
        </div>
      )}

      {!showAll && filtered.length > 12 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-sand transition-colors"
          >
            Show all {filtered.length} hotels
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
