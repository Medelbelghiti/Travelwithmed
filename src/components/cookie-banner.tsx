"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "roamora-consent";

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

export function CookieBanner() {
  const [dismissed, setDismissed] = useState(false);
  const showBanner = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!showBanner || dismissed) return null;

  function decide(choice: "accepted" | "essential") {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4" role="dialog" aria-label="Cookie consent">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-2xl sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-3">
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand sm:flex">
            <Cookie className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-ink">We value your privacy</p>
            <p className="mt-1 text-sm text-ink-soft">
              We use cookies to improve your experience and measure our content. You can always change your
              mind in our{" "}
              <Link href="/cookie-policy" className="font-semibold text-brand hover:text-brand-dark">
                cookie policy
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}