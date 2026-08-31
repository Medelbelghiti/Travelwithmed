import { Plane } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { cn } from "@/lib/utils";

export interface FlightCardData {
  id?: string;
  from?: string;
  to?: string;
  priceNote?: string;
  affiliateLinkId?: string | null;
  ctaLabel?: string;
}

export function FlightCard({ flight, className }: { flight: FlightCardData; className?: string }) {
  const { from, to, priceNote, affiliateLinkId, ctaLabel } = flight;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-dark">
          <Plane className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-semibold text-ink">
            {from} <span className="text-ink-muted">→</span> {to}
          </p>
          {priceNote && <p className="text-sm text-ink-muted">{priceNote}</p>}
        </div>
      </div>
      {affiliateLinkId && (
        <AffiliateButton
          linkId={affiliateLinkId}
          label={ctaLabel ?? "Check flight prices"}
          placement={to ? `flights-${from}-${to}` : "flights"}
          size="sm"
        />
      )}
    </div>
  );
}