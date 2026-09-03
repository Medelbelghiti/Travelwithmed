"use client";

import { useSyncExternalStore } from "react";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewForm, type LocalReview } from "./review-form";

export interface DbReview {
  id: string;
  title: string | null;
  content: string | null;
  rating: number | null;
  author: string | null;
  createdAt: Date;
}

const KEY = "riversmag-reviews";
const CHANGE_EVENT = "riversmag-reviews-change";

function readAll(): LocalReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  refreshSnapshot();
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedSnapshot: LocalReview[] = [];

function refreshSnapshot(): LocalReview[] {
  cachedSnapshot = readAll();
  return cachedSnapshot;
}

function getSnapshot(): LocalReview[] {
  return cachedSnapshot;
}

const EMPTY_SNAPSHOT: LocalReview[] = [];

function getServerSnapshot(): LocalReview[] {
  return EMPTY_SNAPSHOT;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < rating ? "fill-accent text-accent" : "fill-line text-line")}
        />
      ))}
    </span>
  );
}

function ReviewRow({ author, rating, title, content }: { author: string; rating: number; title?: string; content?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark">
          {author.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-medium text-ink">{author}</p>
          <Stars rating={rating} />
        </div>
      </div>
      {title && <p className="mt-3 font-semibold text-ink">{title}</p>}
      {content && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{content}</p>}
    </div>
  );
}

export function ReviewsSection({ activityId, seed: seedReviews }: { activityId: string; seed: DbReview[] }) {
  const allLocal = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const local = allLocal.filter((r) => r.activityId === activityId);

  // onAdded is handled by ReviewForm dispatching a change event; recompute from store.

  const all = [
    ...local.map((r, i) => ({
      key: `local-${i}`,
      author: r.author,
      rating: r.rating,
      title: r.title || undefined,
      content: r.content,
    })),
    ...seedReviews.map((r) => ({
      key: r.id,
      author: r.author ?? "Anonymous",
      rating: r.rating ?? 5,
      title: r.title ?? undefined,
      content: r.content ?? undefined,
    })),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand" />
          <h2 className="text-2xl font-semibold">{all.length} reviews</h2>
        </div>
        {all.length === 0 ? (
          <p className="rounded-2xl border border-line bg-sand/50 p-6 text-sm text-ink-soft">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <div className="space-y-4">
            {all.map((r) => (
              <ReviewRow key={r.key} author={r.author} rating={r.rating} title={r.title} content={r.content} />
            ))}
          </div>
        )}
      </div>

      <div>
        <ReviewForm activityId={activityId} />
      </div>
    </div>
  );
}
