"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function readAttr(anchor: HTMLAnchorElement, name: string): string | undefined {
  const value = anchor.getAttribute(name);
  return value && value.length > 0 ? value : undefined;
}

/**
 * Fires a single GA4 `affiliate_click` event when an affiliate CTA is clicked.
 *
 * Recognized anchors (one delegated listener, one event per click):
 *  - server-tracked `/out/` links (existing behavior, unchanged)
 *  - direct affiliate CTAs carrying `data-affiliate-provider` (e.g. the
 *    Travelpayouts CTA component) — tracked client-side only; the `tp.media`
 *    destination URL is never modified and Travelpayouts attribution via
 *    marker/trs is untouched.
 *
 * Dimensions attached (no personal data):
 *  - page_location / page_path : source page the click happened on
 *  - affiliate_category        : Hotels, Activities, eSIM, Insurance, Car Rental, Flights, Travel Gear...
 *  - affiliate_provider        : partner name (e.g. Booking.com, GetYourGuide, Airalo)
 *  - affiliate_destination     : destination name where available
 *  - affiliate_cta             : label of the link that was clicked
 *  - affiliate_placement       : placement context (article, sidebar, comparison table...)
 *
 * Click counts are the source of truth in the server-side AffiliateClick table
 * (tracked in the `/out/[id]` route); this event mirrors them into GA4 so the
 * same dimensions can be sliced in your GA4 reporting property.
 *
 * The listener binds unconditionally on mount and `window.gtag` is only checked
 * at click time, so a late-loading gtag cannot silently disable tracking.
 */
export function AffiliateClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>(
              "a[href*='/out/'], a[data-affiliate-provider]",
            )
          : null;
      if (!target) return;
      if (!window.gtag) return;
      const href = target.getAttribute("href") ?? "";
      const placement =
        new URLSearchParams(href.split("?")[1] ?? "").get("placement") ?? "unknown";

      const category = readAttr(target, "data-affiliate-category");
      const provider = readAttr(target, "data-affiliate-provider");
      const destination = readAttr(target, "data-affiliate-destination");
      const cta = readAttr(target, "data-affiliate-cta");

      window.gtag("event", "affiliate_click", {
        event_category: "affiliate",
        event_label: placement,
        page_location: window.location.href,
        page_path: window.location.pathname,
        affiliate_category: category ?? undefined,
        affiliate_provider: provider ?? undefined,
        affiliate_destination: destination ?? undefined,
        affiliate_cta: cta ?? undefined,
        affiliate_placement: placement,
        non_interaction: false,
      });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
