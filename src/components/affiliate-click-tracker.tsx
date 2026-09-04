"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function AffiliateClickTracker() {
  useEffect(() => {
    if (!window.gtag) return;

    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href*='/out/']") : null;
      if (!target) return;
      const href = target.getAttribute("href") ?? "";
      const placement =
        new URLSearchParams(href.split("?")[1] ?? "").get("placement") ?? "unknown";

      window.gtag?.("event", "generate_lead", {
        event_category: "affiliate_click",
        event_label: placement,
        placement,
        url: href,
        non_interaction: true,
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
