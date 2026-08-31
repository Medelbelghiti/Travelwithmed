import Image from "next/image";
import { Package } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { cn } from "@/lib/utils";

export interface GearCardData {
  id?: string;
  name: string;
  image?: string | null;
  brand?: string | null;
  description?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  bestFor?: string | null;
  pros?: string[] | null;
  cons?: string[] | null;
  affiliateLinkId?: string | null;
  ctaLabel?: string;
}

export function GearCard({ product, className }: { product: GearCardData; className?: string }) {
  const { name, image, brand, description, priceRange, rating, bestFor, pros, affiliateLinkId, ctaLabel } = product;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <Package className="h-8 w-8" aria-hidden />
          </div>
        )}
        {bestFor && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            Best for {bestFor}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-ink leading-snug">{name}</h3>
          {rating ? (
            <span className="shrink-0 rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand-dark">
              ★ {rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        {brand && <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{brand}</p>}
        {description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{description}</p>}
        {pros && pros.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-ink-soft">
            {pros.slice(0, 2).map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-success">+</span>
                {p}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          {priceRange && <span className="text-sm font-semibold text-ink">{priceRange}</span>}
          {affiliateLinkId && (
            <AffiliateButton
              linkId={affiliateLinkId}
              label={ctaLabel ?? "View today's deals"}
              placement={`gear-${name}`}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}