"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, X, Compass, FileText, Map, BedDouble } from "lucide-react";

interface SearchResult {
  type: "article" | "destination" | "itinerary" | "hotel";
  title: string;
  slug: string;
  href: string;
}

const TYPE_ICONS = {
  article: FileText,
  destination: Compass,
  itinerary: Map,
  hotel: BedDouble,
} as const;

const TYPE_LABELS = {
  article: "Article",
  destination: "Destination",
  itinerary: "Itinerary",
  hotel: "Hotel",
} as const;

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        setQuery("");
        setResults([]);
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const runSearch = useCallback(async (value: string) => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-full px-4 text-sm text-ink-muted transition-colors hover:bg-brand-light hover:text-brand-dark"
        aria-label="Search"
      >
        <Search className="h-4.5 w-4.5" aria-hidden />
        <span className="hidden xl:inline">Search…</span>
        <kbd className="hidden rounded-md border border-line bg-sand px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted xl:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/40 p-4 pt-20 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="h-5 w-5 text-ink-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                setOpen(false);
              }
            }}
            placeholder="Where do you want to go?"
            className="h-14 w-full text-lg outline-none placeholder:text-ink-muted"
            aria-label="Search sites, destinations, hotels"
          />
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-sand"
            aria-label="Close search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && <p className="px-4 py-6 text-center text-sm text-ink-muted">Searching…</p>}

          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">
              No results for “{query}”.
            </p>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="px-4 py-6">
              <p className="text-sm text-ink-muted">Type to search destinations, guides, itineraries and hotels.</p>
            </div>
          )}

          <ul className="space-y-0.5">
            {results.map((result) => {
              const Icon = TYPE_ICONS[result.type];
              return (
                <li key={`${result.type}-${result.slug}`}>
                  <Link
                    href={result.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-brand-light"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-brand-dark">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{result.title}</p>
                      <p className="text-xs text-ink-muted">{TYPE_LABELS[result.type]}</p>
                    </div>
                    <CornerDownLeft className="ml-auto h-4 w-4 shrink-0 text-ink-muted/50" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-line px-5 py-2 text-xs text-ink-muted">
          Press <kbd className="rounded border border-line px-1 font-semibold">Enter</kbd> for all results
        </div>
      </div>
    </div>
  );
}