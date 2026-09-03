import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { ArticleType } from "@prisma/client";

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  DESTINATION_GUIDE: "Destination Guide",
  THINGS_TO_DO: "Things To Do",
  HOTEL_GUIDE: "Hotel Guide",
  HOTEL_COMPARISON: "Hotel Comparison",
  ACTIVITY_GUIDE: "Activity Guide",
  ITINERARY: "Itinerary",
  COMPARISON: "Comparison",
  LISTICLE: "Listicle",
  TRAVEL_TIPS: "Travel Tips",
  PRODUCT_GUIDE: "Product Guide",
  RESOURCE_GUIDE: "Resource Guide",
  NEWS: "News",
};

export interface ArticleCardData {
  id: string;
  title: string;
  slug: string;
  type: ArticleType;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | string | null;
  authorName?: string | null;
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const href = `/articles/${article.slug}`;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand">
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-serif text-2xl text-ink-muted">Riversmag</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
          {ARTICLE_TYPE_LABELS[article.type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg font-semibold text-ink leading-snug group-hover:text-brand transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{article.excerpt}</p>
        )}
        <div className="mt-auto pt-4 text-xs text-ink-muted">
          {article.authorName && <span>{article.authorName}</span>}
          {article.publishedAt && (
            <span>
              {article.authorName ? " · " : ""}
              {formatDate(article.publishedAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}