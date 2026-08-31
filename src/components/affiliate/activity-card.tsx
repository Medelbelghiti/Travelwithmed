import Image from "next/image";
import { Clock, Compass } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { cn } from "@/lib/utils";

export interface ActivityCardData {
  id?: string;
  name: string;
  image?: string | null;
  description?: string | null;
  duration?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  category?: string | null;
  affiliateLinkId?: string | null;
  ctaLabel?: string;
}

export function ActivityCard({ activity, className }: { activity: ActivityCardData; className?: string }) {
  const { name, image, description, duration, priceRange, rating, category, affiliateLinkId, ctaLabel } = activity;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand">
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
            <Compass className="h-8 w-8" aria-hidden />
          </div>
        )}
        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            {category}
          </span>
        )}
        {rating ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
            ★ {rating.toFixed(1)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-ink leading-snug">{name}</h3>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{description}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-sm text-ink-muted">
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {duration}
            </span>
          )}
          {priceRange && <span className="font-semibold text-ink">{priceRange}</span>}
        </div>
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          {affiliateLinkId && (
            <AffiliateButton
              linkId={affiliateLinkId}
              label={ctaLabel ?? "See available tours"}
              placement={`activity-${name}`}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}