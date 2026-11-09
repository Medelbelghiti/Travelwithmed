export type FallbackLink = { id: string; category: string; destinationId: string | null; targetUrl: string; priority: number };

/**
 * Own link first, then the nearest ancestor's, then a site-wide link. Site-wide
 * links that search for one specific place (q=, ss=) are skipped: a
 * "GetYourGuide - Canada" link must not appear on the Paris page.
 */
export function pickCategoryLink<T extends { id: string; category: string }>(
  category: string,
  own: T[],
  ancestorIds: string[],
  fallback: FallbackLink[],
): T | FallbackLink | undefined {
  const mine = own.find((l) => l.category === category);
  if (mine) return mine;
  for (const id of ancestorIds) {
    const l = fallback.find((f) => f.category === category && f.destinationId === id);
    if (l) return l;
  }
  return fallback.find(
    (f) => f.category === category && f.destinationId === null && !/[?&](q|ss|query)=/.test(f.targetUrl),
  );
}
