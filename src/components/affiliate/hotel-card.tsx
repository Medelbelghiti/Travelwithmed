import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { cn } from "@/lib/utils";

export interface HotelCardData {
  id?: string;
  name: string;
  image?: string | null;
  location?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceRange?: string | null;
  bestFor?: string | null;
  affiliateLinkId?: string | null;
  ctaLabel?: string;
}

export function HotelCard({ hotel, className }: { hotel: HotelCardData; className?: string }) {
  const { name, image, location, rating, priceRange, bestFor, affiliateLinkId, ctaLabel } = hotel;

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
            <MapPin className="h-8 w-8" aria-hidden />
          </div>
        )}
        {rating ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
            {rating.toFixed(1)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-ink leading-snug">{name}</h3>
        {location && (
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {location}
          </p>
        )}
        {bestFor && <p className="mt-2 text-sm text-ink-soft">{bestFor}</p>}
        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          {priceRange && <span className="text-sm font-semibold text-ink">{priceRange}</span>}
          {affiliateLinkId && (
            <AffiliateButton
              linkId={affiliateLinkId}
              label={ctaLabel ?? "Check availability"}
              placement={`hotel-${name}`}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}