/**
 * "Quick picks" for commercial hub pages: a short, labelled shortlist at the
 * top of the page so a reader who will not scroll can still choose. Every
 * label is derived from data we hold (guest rating, price tier), never invented.
 */

export type PickCandidate = {
  id: string;
  name: string;
  href: string;
  rating: number | null;
  priceRange: string | null;
  affiliateLinkId: string | null;
  detail?: string | null;
};

export type QuickPick = PickCandidate & { label: string };

/**
 * Price level for sorting: "$$" -> 2, "$89" -> 89. Tiers and amounts are
 * never mixed within one list in our data; unknown sorts last.
 */
export function priceLevel(priceRange: string | null): number {
  if (!priceRange) return Number.POSITIVE_INFINITY;
  const amount = priceRange.match(/\d+(?:[.,]\d+)?/);
  if (amount) return Number(amount[0].replace(",", "."));
  const tier = priceRange.trim().match(/^\$+$/);
  return tier ? tier[0].length : Number.POSITIVE_INFINITY;
}

const byRating = (a: PickCandidate, b: PickCandidate) => (b.rating ?? -1) - (a.rating ?? -1);

/**
 * Up to three distinct picks: best rated, best value (cheapest of the rest
 * that has a price) and, for tiered hotel prices, the most upscale option.
 * Only bookable candidates (with an affiliate link) are considered.
 */
export function selectQuickPicks(
  candidates: PickCandidate[],
  labels: { best: string; value: string; premium?: string },
): QuickPick[] {
  const bookable = candidates.filter((c) => c.affiliateLinkId);
  if (bookable.length < 2) return [];

  const picks: QuickPick[] = [];
  const used = new Set<string>();
  const take = (c: PickCandidate | undefined, label: string) => {
    if (!c || used.has(c.id)) return;
    used.add(c.id);
    picks.push({ ...c, label });
  };

  take([...bookable].sort(byRating)[0], labels.best);

  const priced = bookable.filter((c) => !used.has(c.id) && Number.isFinite(priceLevel(c.priceRange)));
  take([...priced].sort((a, b) => priceLevel(a.priceRange) - priceLevel(b.priceRange) || byRating(a, b))[0], labels.value);

  if (labels.premium) {
    const tiered = bookable.filter((c) => !used.has(c.id) && /^\${3,}$/.test(c.priceRange?.trim() ?? ""));
    take([...tiered].sort((a, b) => priceLevel(b.priceRange) - priceLevel(a.priceRange) || byRating(a, b))[0], labels.premium);
  }

  return picks;
}
