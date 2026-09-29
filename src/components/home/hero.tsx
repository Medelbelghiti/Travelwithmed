import Link from "next/link";
import { Search, Compass, BedDouble, Ticket, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = ["Paris", "Tokyo", "Marrakech", "Rome", "Bali", "Istanbul"];

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[82vh] items-center overflow-hidden bg-brand-deep">
      {/* Was hardcoded to the old violet/pink palette (rgba(139,92,246),
          rgba(255,45,120)) plus the old #0a0910 page black, so it ignored
          every theme token. Now derived from the teal and sienna ramp. */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(15,82,87,0.55),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(168,80,31,0.28),transparent_55%),linear-gradient(180deg,rgba(7,41,44,0.35),rgba(7,41,44,0.9))]"
        aria-hidden
      />
      <div className="container-x relative py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-on-dark backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-on-dark" />
            Plan smarter. Travel better.
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl">
            Travel smarter.
            <br />
            {/* from-brand to-accent was two dark colours on a dark panel, which
                renders as near-invisible gradient text. */}
            <span className="bg-gradient-to-r from-brand-on-dark to-accent-on-dark bg-clip-text text-transparent">
              Discover more.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Destination guides, smart itineraries, trusted recommendations and the best travel
            deals — all in one place.
          </p>

          <form
            action="/search"
            className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/20 bg-black/50 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-sm"
            role="search"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-brand-on-dark" aria-hidden />
            <label htmlFor="hero-search" className="sr-only">
              Search activities and destinations
            </label>
            <input
              id="hero-search"
              name="q"
              type="search"
              defaultValue=""
              placeholder="Search activities, tours, destinations"
              /* Was text-ink / placeholder:text-ink-muted inside a bg-black/50
                 box: near-black text on black, i.e. invisible on the light
                 palette. Dark surfaces need the light ink ramp. */
              className="w-full bg-transparent py-2.5 text-base text-white outline-none placeholder:text-white/55"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand-on-dark px-6 py-3 text-sm font-semibold text-brand-deep shadow-sm transition-colors hover:bg-white"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/55">Popular:</span>
            {SUGGESTIONS.map((s) => (
              <Link
                key={s}
                href={`/search?q=${s}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white"
              >
                {s}
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button href="/activities" variant="primary" size="lg">
              <Ticket className="h-4 w-4" aria-hidden />
              Find activities
            </Button>
            <Button href="/destinations" variant="outline" size="lg" className="border-white/25 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white">
              <Compass className="h-4 w-4" aria-hidden />
              Explore destinations
            </Button>
            <Button href="/hotels" variant="outline" size="lg" className="border-white/25 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white">
              <BedDouble className="h-4 w-4" aria-hidden />
              Find hotels
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
