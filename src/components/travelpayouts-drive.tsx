"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent";

export function TravelpayoutsDrive() {
  const consent = useConsent();

  if (consent !== "accepted") return null;

  return <Script src="https://tpembars.com/NTczMjQx.js?t=573241" strategy="afterInteractive" />;
}
