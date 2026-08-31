"use client";

import { useEffect, useState } from "react";
import { AFFILIATE_CTA_LABELS } from "@/lib/affiliate-constants";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";

interface LinkRow {
  id: string;
  partnerName: string;
  productName: string;
  category: keyof typeof AFFILIATE_CTA_LABELS;
}

export function AffiliateCtaButtons({ destination }: { destination?: string }) {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const categories = ["HOTELS", "FLIGHTS", "ACTIVITIES", "INSURANCE", "ESIM", "CAR_RENTAL"];
    Promise.all(
      categories.map((category) =>
        fetch(`/api/affiliate/links?category=${category}`).then((r) => (r.ok ? r.json() : { links: [] })),
      ),
    )
      .then((results) => {
        if (!active) return;
        const all = results.flatMap((r) => r.links as LinkRow[]);
        const seen = new Set<string>();
        const unique = all.filter((l) => {
          if (seen.has(l.category)) return false;
          seen.add(l.category);
          return true;
        });
        setLinks(unique);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-ink-muted">Loading options…</p>;

  if (links.length === 0) return null;

  return (
    <div className="grid gap-2">
      {links.map((link) => (
        <AffiliateButton
          key={link.id}
          linkId={link.id}
          label={AFFILIATE_CTA_LABELS[link.category] ?? "Check prices"}
          placement={destination ? `calculator-${destination}` : "calculator"}
          variant={link.category === "HOTELS" ? "primary" : "outline"}
          size="sm"
        />
      ))}
    </div>
  );
}