"use client";

import { useMemo, useState } from "react";
import { Wallet, BedDouble, Utensils, Bus, Ticket, MoreHorizontal, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AffiliateCtaButtons } from "@/components/affiliate/affiliate-cta-buttons";

const LEVEL_FACTORS = { budget: 1, mid: 1.6, luxury: 2.8 } as const;
const LEVEL_LABELS: Record<keyof typeof LEVEL_FACTORS, string> = {
  budget: "Budget",
  mid: "Mid-range",
  luxury: "Luxury",
};

const BASE_DAILY = {
  accommodation: 70,
  food: 35,
  transportation: 15,
  activities: 30,
  miscellaneous: 12,
};

type Level = keyof typeof LEVEL_FACTORS;

export function BudgetCalculator() {
  const [destination, setDestination] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [days, setDays] = useState(7);
  const [accommodationLevel, setAccommodationLevel] = useState<Level>("mid");
  const [foodLevel, setFoodLevel] = useState<Level>("mid");
  const [transportation, setTransportation] = useState(20);
  const [includeFlights, setIncludeFlights] = useState(true);
  const [flightEstimate, setFlightEstimate] = useState(800);
  const [activitiesBudget, setActivitiesBudget] = useState(400);

  const result = useMemo(() => {
    const accommodation = BASE_DAILY.accommodation * LEVEL_FACTORS[accommodationLevel];
    const food = BASE_DAILY.food * LEVEL_FACTORS[foodLevel];
    const transport = transportation;
    const activities = activitiesBudget / days;
    const miscellaneous = BASE_DAILY.miscellaneous;

    const perPersonTotal =
      (accommodation + food + transport + activities + miscellaneous) * days;

    return {
      accommodationPerDay: accommodation,
      foodPerDay: food,
      transportationPerDay: transport,
      activitiesPerDay: activities,
      miscellaneousPerDay: miscellaneous,
      perPersonTotal,
      total: perPersonTotal * travelers + (includeFlights ? flightEstimate * travelers : 0),
      perPersonWithFlights: perPersonTotal + (includeFlights ? flightEstimate : 0),
      breakdown: [
        { label: "Accommodation", key: "accommodation", icon: BedDouble, value: accommodation * days * travelers },
        { label: "Food", key: "food", icon: Utensils, value: food * days * travelers },
        { label: "Local transport", key: "transport", icon: Bus, value: transport * days * travelers },
        { label: "Activities & tours", key: "activities", icon: Ticket, value: activities * days * travelers },
        { label: "Miscellaneous", key: "misc", icon: MoreHorizontal, value: miscellaneous * days * travelers },
      ],
    };
  }, [travelers, days, accommodationLevel, foodLevel, transportation, activitiesBudget, includeFlights, flightEstimate]);

  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition-colors focus:border-brand";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
        <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold">
          <Calculator className="h-6 w-6 text-brand" aria-hidden />
          Estimate your trip
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="budget-destination" className="mb-1.5 block text-sm font-medium text-ink-soft">
              Destination
            </label>
            <input
              id="budget-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Japan, France, Morocco"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget-travelers" className="mb-1.5 block text-sm font-medium text-ink-soft">
                Travelers
              </label>
              <input id="budget-travelers" type="number" min={1} max={20} value={travelers} onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
            </div>
            <div>
              <label htmlFor="budget-days" className="mb-1.5 block text-sm font-medium text-ink-soft">
                Days
              </label>
              <input id="budget-days" type="number" min={1} max={90} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LevelSelect label="Accommodation" id="accommodation-level" value={accommodationLevel} onChange={setAccommodationLevel} />
            <LevelSelect label="Food & drink" id="food-level" value={foodLevel} onChange={setFoodLevel} />
          </div>

          <div>
            <label htmlFor="budget-transport" className="mb-1.5 block text-sm font-medium text-ink-soft">
              Local transportation / day ({formatCurrency(transportation, "USD")})
            </label>
            <input id="budget-transport" type="range" min={0} max={100} value={transportation} onChange={(e) => setTransportation(Number(e.target.value))} className="w-full accent-brand" />
          </div>

          <div>
            <label htmlFor="budget-activities" className="mb-1.5 block text-sm font-medium text-ink-soft">
              Activities & tours budget ({formatCurrency(activitiesBudget, "USD")})
            </label>
            <input id="budget-activities" type="range" min={0} max={2000} step={50} value={activitiesBudget} onChange={(e) => setActivitiesBudget(Number(e.target.value))} className="w-full accent-brand" />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-sand px-4 py-3">
            <div>
              <p className="font-medium text-ink">Include international flights?</p>
              <p className="text-xs text-ink-muted">Estimate per person round trip ({formatCurrency(flightEstimate, "USD")})</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="range" min={300} max={3000} step={50} value={flightEstimate} onChange={(e) => setFlightEstimate(Number(e.target.value))} disabled={!includeFlights} className="w-28 accent-brand disabled:opacity-40" />
              <button
                onClick={() => setIncludeFlights((v) => !v)}
                role="switch"
                aria-checked={includeFlights}
                className={`relative h-6 w-11 rounded-full transition-colors ${includeFlights ? "bg-brand" : "bg-line"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${includeFlights ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-24 self-start">
        <div className="rounded-3xl bg-brand-dark p-6 text-white md:p-8">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-white">
            <Wallet className="h-6 w-6 text-accent" aria-hidden />
            Your estimated budget
          </h2>

          <div className="mt-4 text-sm text-white/70">
            {destination ? `${destination} · ` : ""}
            {travelers} traveler{travelers > 1 ? "s" : ""} · {days} day{days > 1 ? "s" : ""}
          </div>

          <div className="mt-6">
            <p className="text-sm text-white/60">Total trip estimate</p>
            <p className="text-4xl font-semibold text-white">{formatCurrency(result.total)}</p>
            <p className="mt-1 text-sm text-white/70">
              ≈ {formatCurrency(result.perPersonWithFlights)} per person{includeFlights ? " incl. flights" : ""}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {result.breakdown.map((item) => {
              const Icon = item.icon;
              const pct = result.total > 0 ? Math.round((item.value / result.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-white/85">
                      <Icon className="h-4 w-4 text-accent" aria-hidden />
                      {item.label}
                    </span>
                    <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-white/60">
            Estimates are indicative and based on typical mid-range travel costs. Prices vary by country,
            season and exchange rate.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h3 className="font-serif text-xl font-semibold text-ink">Make it happen</h3>
          <p className="mt-1 text-sm text-ink-soft">Compare options and lock in your trip.</p>
          <div className="mt-4">
            <AffiliateCtaButtons destination={destination} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LevelSelect({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: Level;
  onChange: (l: Level) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as Level)} className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition-colors focus:border-brand">
        {(Object.keys(LEVEL_FACTORS) as Level[]).map((level) => (
          <option key={level} value={level}>
            {LEVEL_LABELS[level]}
          </option>
        ))}
      </select>
    </div>
  );
}