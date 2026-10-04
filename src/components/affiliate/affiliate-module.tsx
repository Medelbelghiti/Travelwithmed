import { Star, ExternalLink } from "lucide-react";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";

export interface AffiliateModuleProps {
  linkId: string;
  name: string;
  /** Our own score, 0-5. Never the merchant's number. */
  rating?: number | null;
  reviewCount?: number | null;
  /** One line: who this is for. The whole reason to click. */
  bestFor?: string | null;
  verdict?: string | null;
  pros?: string[] | null;
  cons?: string[] | null;
  category?: string | null;
  provider?: string | null;
  destination?: string;
  placement?: string;
  ctaLabel?: string;
  className?: string;
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rounded ? "fill-amber-400 text-amber-400" : "text-line"}`}
        />
      ))}
    </span>
  );
}

/**
 * A self-rated affiliate module.
 *
 * Inline links inside prose are the weakest affiliate format: no visual
 * hierarchy, no trust signal, and nothing for the reader to evaluate. The
 * publishers that convert best (The Points Guy) box each offer instead, with
 * our own score out of five, a one-line verdict, and the terms stated up front.
 * That framing is also a legal hedge, since the rating is our editorial claim
 * rather than a pass-through of the merchant's marketing.
 */
export function AffiliateModule({
  linkId,
  name,
  rating,
  reviewCount,
  bestFor,
  verdict,
  pros,
  cons,
  category,
  provider,
  destination,
  placement,
  ctaLabel,
  className,
}: AffiliateModuleProps) {
  const prosList = Array.isArray(pros) ? pros.filter(Boolean) : [];
  const consList = Array.isArray(cons) ? cons.filter(Boolean) : [];
  const hasScore = typeof rating === "number" && rating > 0;

  return (
    <aside
      className={`my-8 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6 ${className ?? ""}`}
      aria-label={`Our review of ${name}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Riversmag review
          </p>
          <h3 className="mt-1 text-lg font-semibold text-ink md:text-xl">{name}</h3>
        </div>

        {hasScore ? (
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1.5">
              <Stars value={rating} />
              <span className="text-sm font-semibold text-ink">
                {rating.toFixed(1)}
                <span className="text-ink-muted">/5</span>
              </span>
            </div>
            {typeof reviewCount === "number" && reviewCount > 0 ? (
              <p className="mt-0.5 text-xs text-ink-muted">
                our score{reviewCount > 1 ? ", based on usage" : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {verdict ? <p className="mt-3 text-sm leading-relaxed text-ink-soft">{verdict}</p> : null}

      {bestFor ? (
        <p className="mt-2 text-sm text-ink-soft">
          <span className="font-semibold text-ink">Best for: </span>
          {bestFor}
        </p>
      ) : null}

      {prosList.length > 0 || consList.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {prosList.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Pros</p>
              <ul className="mt-1.5 space-y-1">
                {prosList.map((p) => (
                  <li key={p} className="text-sm text-ink-soft">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {consList.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Cons</p>
              <ul className="mt-1.5 space-y-1">
                {consList.map((c) => (
                  <li key={c} className="text-sm text-ink-soft">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <AffiliateButton
          linkId={linkId}
          label={ctaLabel ?? "See prices"}
          placement={placement}
          category={category}
          provider={provider}
          destination={destination}
        />
        <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
          <ExternalLink className="h-3 w-3" aria-hidden />
          Opens the provider&apos;s site
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Ratings are our own editorial judgement, not the provider&apos;s. We may earn a commission if
        you book, at no extra cost to you. Prices and terms are set by the provider and can change.
      </p>
    </aside>
  );
}

export { AffiliateDisclosure };
