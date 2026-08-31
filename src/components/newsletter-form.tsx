"use client";

import { useState } from "react";
import { Send, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERESTS = ["Budget", "Luxury", "Family", "Solo", "Adventure", "Europe", "Asia", "Africa"];

export function NewsletterForm({
  variant = "full",
  downloadPath,
}: {
  variant?: "full" | "compact" | "lead";
  downloadPath?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, email, interests }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing! Welcome to smarter travel.");
      } else {
        const data = await res.json().catch(() => null);
        setStatus("error");
        setMessage(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 px-5 py-4">
        <p className="font-medium text-success">{variant === "lead" ? "It’s on its way!" : "You’re in!"} 🎉</p>
        <p className="mt-1 text-sm text-ink-soft">{message}</p>
        {variant === "lead" && downloadPath && (
          <a
            href={downloadPath}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            <Download className="h-4 w-4" aria-hidden />
            Open your free guide
          </a>
        )}
      </div>
    );
  }

  const compact = variant === "compact";
  const lead = variant === "lead";

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label="Newsletter signup">
      <div>
        <label htmlFor="newsletter-name" className="block pb-1 text-sm font-medium text-ink-soft">
          First name
        </label>
        <input
          id="newsletter-name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="newsletter-email" className="block pb-1 text-sm font-medium text-ink-soft">
          Email
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
        />
      </div>

      {!compact && !lead && (
        <div>
          <p className="pb-2 text-sm font-medium text-ink-soft">Tell us your travel style (optional)</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const active = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-ink-soft hover:border-brand",
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden />
        {status === "loading"
          ? "Subscribing…"
          : lead
            ? "Unlock my free guide"
            : "Get smarter travel tips"}
      </button>

      {status === "error" && <p className="text-sm text-danger">{message}</p>}
    </form>
  );
}