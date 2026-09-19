"use client";

import { useConsent } from "@/lib/consent";

const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

export function PlausibleAnalytics() {
  const consent = useConsent();

  // Plausible is cookieless, but per the site's consent policy non-essential
  // tracking only runs after the visitor chooses "Accept all".
  if (!domain || !src || consent !== "accepted") return null;

  return (
    <script
      defer
      data-domain={domain}
      src={src}
    />
  );
}
