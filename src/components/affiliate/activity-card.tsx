import Image from "next/image";
import Link from "next/link";
import { Clock, Compass, Star, MapPin } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { cn } from "@/lib/utils";

export interface ActivityCardData {
  id?: string;
  slug?: string;
  name: string;
  image?: string | null;
  description?: string | null;
  duration?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  category?: string | null;
  bestFor?: string | null;
  destinationName?: string | null;
  location?: string | null;
  affiliateLinkId?: string | null;
  ctaLabel?: string;
}

export function ActivityCard({
  activity,
  className,
  linked = false,
}: {
  activity: ActivityCardData;
  className?: string;
  linked?: boolean;
}) {
  const { name, image, description, duration, priceRange, rating, reviewCount, category, destinationName, location, slug, affiliateLinkId, ctaLabel } = activity;
  const placeLabel = location ?? destinationName;

  const cardContent = (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:bg-card-hover hover:shadow-xl",
        linked && "cursor-pointer",
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
            {category}
          </span>
        )}
        {rating != null && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
            {rating.toFixed(1)}
            {reviewCount != null && <span className="font-normal text-white/75">({reviewCount})</span>}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand">{name}</h3>
        {description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
          {duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-brand" aria-hidden />
              {duration}
            </span>
          )}
          {placeLabel && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {placeLabel}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-line/60">
          {priceRange && <span className="text-lg font-bold text-brand">{priceRange}</span>}
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

  if (linked && slug) {
    return <Link href={`/activities/${slug}`} className="block">{cardContent}</Link>;
  }

  return cardContent;
}
