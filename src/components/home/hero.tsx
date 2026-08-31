"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Compass, BedDouble, Ticket, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = ["Paris", "Tokyo", "Marrakech", "Rome", "Bali", "Istanbul"];

export function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(224,159,62,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(14,94,82,0.6),transparent_60%)]"
        aria-hidden
      />
      <div className="container-x relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Plan smarter. Travel better.
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Travel smarter. <span className="text-accent">Discover more.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Destination guides, smart itineraries, trusted recommendations and the best travel deals—all in one place.
          </p>

          <form
            action="/search"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-white/15 bg-white p-2 shadow-xl"
            role="search"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
            <label htmlFor="hero-search" className="sr-only">
              Search destinations
            </label>
            <input
              id="hero-search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where do you want to go?"
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink-muted"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/60">Popular:</span>
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`/search?q=${s}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 transition-colors hover:bg-white/15"
              >
                {s}
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/destinations" variant="primary" size="lg">
              <Compass className="h-4 w-4" aria-hidden />
              Explore destinations
            </Button>
            <Button href="/hotels" variant="white" size="lg">
              <BedDouble className="h-4 w-4" aria-hidden />
              Find hotels
            </Button>
            <Button href="/activities" variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white">
              <Ticket className="h-4 w-4" aria-hidden />
              Find activities
            </Button>
            <Button href="/itineraries" variant="accent" size="lg">
              <Map className="h-4 w-4" aria-hidden />
              Build itinerary
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}