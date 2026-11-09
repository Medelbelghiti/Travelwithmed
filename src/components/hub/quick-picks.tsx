import Link from "next/link";
import { Star } from "lucide-react";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import type { QuickPick } from "@/lib/quick-picks";

/**
 * Above-the-fold shortlist on commercial hub pages. Most readers never reach
 * the full grid; this gives them a decision and a booking button immediately.
 */
export function QuickPicks({
  title,
  picks,
  placement,
  category,
  destination,
  ctaLabel,
}: {
  title: string;
  picks: QuickPick[];
  placement: string;
  category: string;
  destination: string;
  ctaLabel: string;
}) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="quick-picks-heading" className="mb-12 rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
      <h2 id="quick-picks-heading" className="text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Short on time? Start with these. Full reviews are further down.</p>
      <ol className="mt-6 divide-y divide-line">
        {picks.map((pick) => (
          <li key={pick.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">{pick.label}</p>
              <p className="mt-1 font-serif text-lg font-semibold text-ink">
                <Link href={pick.href} className="hover:text-brand">
                  {pick.name}
                </Link>
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
                {pick.rating ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                    {pick.rating.toFixed(1)}
                  </span>
                ) : null}
                {pick.priceRange && <span>{pick.priceRange}</span>}
                {pick.detail && <span className="line-clamp-1">{pick.detail}</span>}
              </p>
            </div>
            {pick.affiliateLinkId && (
              <div className="shrink-0">
                <AffiliateButton
                  linkId={pick.affiliateLinkId}
                  label={ctaLabel}
                  placement={`${placement}-quick-picks`}
                  category={category}
                  destination={destination}
                  size="sm"
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
