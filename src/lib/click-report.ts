/**
 * Pure aggregation for the admin revenue dashboard, kept free of Prisma so it
 * can be unit tested.
 */

export type ClickRow = {
  createdAt: Date;
  userAgent?: string | null;
  referrer: string | null;
  placement: string | null;
  affiliateLinkId: string;
};

// Crawlers, link previewers, monitoring and headless tools that follow /out
// links. robots.txt disallows /out/, but plenty of bots ignore it.
const BOT_UA =
  /bot|crawl|spider|slurp|preview|fetch|scrape|monitor|uptime|lighthouse|headless|phantom|puppeteer|playwright|selenium|python-requests|python-urllib|aiohttp|httpx|curl|wget|go-http|java\/|okhttp|axios|node-fetch|undici|libwww|facebookexternalhit|whatsapp|telegram|discord|slack|skype|embedly|bingpreview|semrush|ahrefs|mj12|dotbot|petal|yandex|baidu|bytespider|gptbot|claude|perplexity|ccbot|amazonbot|applebot/i;

/** True for known bots and for clicks with no user agent at all. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true;
  return BOT_UA.test(userAgent);
}

export type LinkInfo = { partnerName: string; category: string };

export type Ranked = { key: string; count: number; share: number };

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(value: string | string[] | undefined): Period {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : 30;
}

// Article CTAs pass the article id (a cuid) as placement; group them together.
const CUID = /^c[a-z0-9]{20,}$/;

export function placementLabel(placement: string | null): string {
  if (!placement) return "unspecified";
  if (CUID.test(placement)) return "in-article button";
  if (placement.startsWith("hotel-")) return "hotel card";
  if (placement.startsWith("itinerary-")) return "itinerary";
  return placement;
}

/** Turn a full referrer URL into a site path ("/articles/x"), or "external". */
export function referrerPath(referrer: string | null, siteHost: string): string {
  if (!referrer) return "direct / unknown";
  try {
    const url = new URL(referrer);
    if (url.hostname.replace(/^www\./, "") !== siteHost.replace(/^www\./, "")) return "external";
    return url.pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "direct / unknown";
  }
}

export function rank(keys: string[], limit = 10): Ranked[] {
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  const total = keys.length || 1;
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count, share: count / total }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

/** Start of the current and previous windows for a period of `days`. */
export function periodWindow(days: number, now = new Date()): { since: Date; previousSince: Date } {
  const since = new Date(now.getTime() - days * 86_400_000);
  return { since, previousSince: new Date(since.getTime() - days * 86_400_000) };
}

/** Clicks per day for the last `days` days, oldest first, zero-filled. */
export function dailySeries(rows: { createdAt: Date }[], days: number, now = new Date()): { day: string; count: number }[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const series = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    series.set(new Date(end - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const day = r.createdAt.toISOString().slice(0, 10);
    if (series.has(day)) series.set(day, (series.get(day) ?? 0) + 1);
  }
  return [...series.entries()].map(([day, count]) => ({ day, count }));
}

export function buildClickReport(allRows: ClickRow[], links: Map<string, LinkInfo>, siteHost: string, days: number, now = new Date()) {
  const rows = allRows.filter((r) => !isBotUserAgent(r.userAgent));
  const info = (id: string) => links.get(id) ?? { partnerName: "Unknown partner", category: "OTHER" };
  return {
    total: rows.length,
    botClicks: allRows.length - rows.length,
    byPartner: rank(rows.map((r) => info(r.affiliateLinkId).partnerName)),
    byCategory: rank(rows.map((r) => info(r.affiliateLinkId).category.toLowerCase())),
    byPlacement: rank(rows.map((r) => placementLabel(r.placement))),
    byPage: rank(rows.map((r) => referrerPath(r.referrer, siteHost)), 15),
    daily: dailySeries(rows, days, now),
  };
}
