import { Signal } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { cn } from "@/lib/utils";

export interface ESIMCardData {
  id?: string;
  provider?: string;
  description?: string;
  coverage?: string;
  rating?: number | null;
  bestFor?: string | null;
  affiliateLinkId?: string | null;
  ctaLabel?: string;
}

export function ESIMCard({ esim, className }: { esim: ESIMCardData; className?: string }) {
  const { provider, description, coverage, rating, bestFor, affiliateLinkId, ctaLabel } = esim;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-dark">
            <Signal className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink">{provider ?? "eSIM Provider"}</h3>
        </div>
        {rating ? (
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand-dark">
            ★ {rating.toFixed(1)}
          </span>
        ) : null}
      </div>
      {description && <p className="text-sm text-ink-soft">{description}</p>}
      {coverage && <p className="text-sm font-medium text-ink">Coverage: {coverage}</p>}
      {bestFor && <p className="text-sm text-ink-soft">Best for {bestFor}</p>}
      {affiliateLinkId && (
        <AffiliateButton
          linkId={affiliateLinkId}
          label={ctaLabel ?? "Compare eSIM plans"}
          placement="esim"
          size="sm"
        />
      )}
    </div>
  );
}