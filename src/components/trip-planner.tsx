"use client";

import { useState } from "react";
import { Sparkles, MapPin, CalendarDays, Wallet, Users, Compass, Save } from "lucide-react";
import { AffiliateCtaButtons } from "./affiliate/affiliate-cta-buttons";

const STYLES = ["Budget", "Mid-range", "Luxury", "Adventure", "Family", "Solo", "Culture", "Beaches"];

export function TripPlanner() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(2000);
  const [style, setStyle] = useState("Mid-range");
  const [interests, setInterests] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  const toggleInterest = (interest: string) =>
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );

  const buildPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerated(true);
  };

  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition-colors focus:border-brand";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          <Sparkles className="h-6 w-6 text-brand" aria-hidden />
          Plan your trip
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Tell us where you&apos;re headed and we&apos;ll sketch out the essentials in one place.
        </p>

        <form onSubmit={buildPlan} className="mt-6 space-y-5">
          <div>
            <label htmlFor="planner-destination" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              <MapPin className="h-4 w-4 text-brand" aria-hidden />
              Destination
            </label>
            <input id="planner-destination" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where are you going?" className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="planner-days" className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink-soft">
                <CalendarDays className="h-3.5 w-3.5 text-brand" aria-hidden />
                Days
              </label>
              <input id="planner-days" type="number" min={1} max={60} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="planner-travelers" className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink-soft">
                <Users className="h-3.5 w-3.5 text-brand" aria-hidden />
                Travelers
              </label>
              <input id="planner-travelers" type="number" min={1} max={20} value={travelers} onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="planner-budget" className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink-soft">
                <Wallet className="h-3.5 w-3.5 text-brand" aria-hidden />
                Budget
              </label>
              <input id="planner-budget" type="number" min={0} step={100} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} className={inputClass} />
            </div>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              <Compass className="h-4 w-4 text-brand" aria-hidden />
              Travel style
            </p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const active = style === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-brand"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-soft">Interests</p>
            <div className="flex flex-wrap gap-2">
              {["Food", "History", "Nature", "Beaches", "Nightlife", "Hiking", "Shopping", "Museums"].map((interest) => {
                const active = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active ? "border-accent bg-accent text-white" : "border-line bg-white text-ink-soft hover:border-accent"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Build my trip plan
          </button>
        </form>
      </div>

      <div className="sticky top-24 self-start space-y-6">
        {!generated ? (
          <div className="rounded-3xl bg-brand-light p-8 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-brand" aria-hidden />
            <h3 className="mt-4 font-serif text-2xl font-semibold text-brand-dark">Your plan will appear here</h3>
            <p className="mt-2 text-sm text-ink-soft">
              Fill in the details on the left and press “Build my trip plan” to get a day-by-day sketch, budget
              estimate and the practical next steps.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-brand-dark p-8 text-white">
              <h3 className="font-serif text-2xl font-semibold text-white">
                {destination} — {days} days
              </h3>
              <p className="mt-1 text-white/75">
                {style} trip for {travelers} traveler{travelers > 1 ? "s" : ""} with a budget of ${budget.toLocaleString()}
              </p>

              <div className="mt-6 space-y-4">
                <DayRow day={1} highlight="Arrive & settle in" detail="Check in, explore your neighbourhood, and line up the first day's highlights." />
                <DayRow day={2} highlight="Explore the core sights" detail={`${interests.slice(0, 2).join(" & ") || "Top landmarks"}, guided tour and a local food stop.`} />
                <DayRow day={3} highlight="Day trip or deep dive" detail="Escape the main area for a memorable day trip or neighbourhood walk." />
                <DayRow day={Math.max(4, days - 1)} highlight="Your must-sees" detail="Revisit favourites or squeeze in what you've missed — leave room to wander." />
                <DayRow day={days} highlight="Wrap up & depart" detail="Final souvenirs, airport transfer arranged, and a relaxed goodbye." />
              </div>

              <div className="mt-6 rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/70">Rough daily budget</p>
                <p className="text-2xl font-semibold">
                  ≈ ${Math.max(50, Math.round(budget / days))} / day per person
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <h3 className="font-serif text-xl font-semibold text-ink">Next steps</h3>
              <p className="mt-1 text-sm text-ink-soft">Compare and book the essentials for your trip to {destination}.</p>
              <div className="mt-4">
                <AffiliateCtaButtons destination={destination} />
              </div>
              <p className="mt-4 text-xs text-ink-muted">
                <Save className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                Save-to-trip accounts arrive in a future update.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DayRow({ day, highlight, detail }: { day: number; highlight: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-serif text-sm font-semibold text-white">
        {day}
      </span>
      <div>
        <p className="font-semibold text-white">Day {day}: {highlight}</p>
        <p className="text-sm text-white/70">{detail}</p>
      </div>
    </div>
  );
}