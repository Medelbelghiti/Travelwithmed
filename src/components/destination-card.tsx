import Image from "next/image";
import Link from "next/link";
import type { DestinationType } from "@prisma/client";

export interface DestinationCardData {
  id: string;
  name: string;
  slug: string;
  type: DestinationType;
  tagline?: string | null;
  coverImage?: string | null;
  articleCount?: number;
}

export function DestinationCard({ destination, className }: { destination: DestinationCardData; className?: string }) {
  const { name, slug, tagline, coverImage, articleCount } = destination;
  return (
    <Link
      href={`/destinations/${slug}`}
      className={`group relative block overflow-hidden rounded-2xl border border-line bg-sand shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${className ?? ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 350px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-light">
            <span className="font-serif text-3xl font-semibold text-brand">{name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-serif text-xl font-semibold text-white drop-shadow">{name}</h3>
          {tagline && <p className="mt-0.5 line-clamp-1 text-sm text-white/85">{tagline}</p>}
          {typeof articleCount === "number" && articleCount > 0 && (
            <p className="mt-1 text-xs font-medium text-accent">{articleCount} guides</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RegionCard({ destination }: { destination: DestinationCardData }) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:border-brand"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light font-serif text-lg font-semibold text-brand-dark">
        {destination.name[0]}
      </span>
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{destination.name}</h3>
        {destination.tagline && <p className="text-sm text-ink-muted">{destination.tagline}</p>}
      </div>
    </Link>
  );
}