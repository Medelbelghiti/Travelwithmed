import { cn } from "@/lib/utils";
import { TRAVELPAYOUTS_PROGRAMS, type TravelpayoutsCategory } from "@/lib/travelpayouts";
import { TravelpayoutsLink } from "@/components/affiliate/travelpayouts-link";

const CATEGORY_ORDER: TravelpayoutsCategory[] = [
  "FLIGHTS",
  "ACTIVITIES",
  "AIRPORT_TRANSFERS",
  "ESIM",
  "CAR_RENTAL",
];

const CATEGORY_LABELS: Record<TravelpayoutsCategory, string> = {
  FLIGHTS: "Flights",
  ACTIVITIES: "Tours & tickets",
  AIRPORT_TRANSFERS: "Airport transfers",
  ESIM: "Connectivity",
  CAR_RENTAL: "Car rental",
};

export interface TravelpayoutsProgramGridProps {
  className?: string;
}

export function TravelpayoutsProgramGrid({ className }: TravelpayoutsProgramGridProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {CATEGORY_ORDER.map((category) => {
        const programs = TRAVELPAYOUTS_PROGRAMS.filter((p) => p.category === category);
        if (programs.length === 0) return null;
        return (
          <div key={category} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {CATEGORY_LABELS[category]}
            </span>
            <div className="flex flex-wrap gap-2">
              {programs.map((program) => (
                <TravelpayoutsLink key={program.id} program={program} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}