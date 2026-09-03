"use client";

import { useState } from "react";
import { Star, Send, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocalReview {
  author: string;
  rating: number;
  title: string;
  content: string;
  activityId: string;
  createdAt: string;
}

const KEY = "riversmag-reviews";

export function ReviewForm({ activityId }: { activityId: string }) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = author.trim().length > 0 && rating > 0 && content.trim().length > 5;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const review: LocalReview = {
      author: author.trim(),
      rating,
      title: title.trim(),
      content: content.trim(),
      activityId,
      createdAt: new Date().toISOString(),
    };
    try {
      const raw = window.localStorage.getItem(KEY);
      const all = raw ? JSON.parse(raw) : [];
      window.localStorage.setItem(KEY, JSON.stringify([...all, review]));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("riversmag-reviews-change"));
    setSubmitted(true);
    setAuthor("");
    setRating(0);
    setTitle("");
    setContent("");
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-brand-light p-5 text-brand-dark">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">Thanks for your review!</p>
          <p className="text-sm">It&apos;s now shown on this page for other travellers.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Send className="h-4 w-4 text-brand" />
        Write a review
      </h3>

      <div className="mt-4">
        <label className="text-sm font-medium text-ink">Your rating</label>
        <div className="mt-1.5 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  (hover || rating) >= n ? "fill-accent text-accent" : "fill-line text-line",
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-ink-muted">{rating > 0 ? `${rating}/5` : "Select"}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="text-sm font-medium text-ink">
            Name
          </label>
          <div className="relative mt-1.5">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="rv-name"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-line py-2.5 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
        <div>
          <label htmlFor="rv-title" className="text-sm font-medium text-ink">
            Title <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id="rv-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summary of your experience"
            className="mt-1.5 w-full rounded-xl border border-line py-2.5 px-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="rv-content" className="text-sm font-medium text-ink">
          Your review
        </label>
        <textarea
          id="rv-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="What did you enjoy? Any tips for other travellers? (min. 6 characters)"
          className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        Submit review
      </button>
      <p className="mt-3 text-xs text-ink-muted">
        Reviews are stored locally on your device and shown immediately to other visitors. They aren&apos;t shared with
        our partner sites.
      </p>
    </form>
  );
}
