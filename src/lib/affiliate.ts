import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { AffiliateCategory } from "@prisma/client";
import { prisma } from "./prisma";
import { siteConfig } from "./site";

export type AffiliateLinkRow = Prisma.AffiliateLinkGetPayload<{
  include: { article: { select: { slug: true; title: true } } };
}>;

export const AFFILIATE_CATEGORY_LABELS: Record<AffiliateCategory, string> = {
  HOTELS: "Hotels",
  FLIGHTS: "Flights",
  ACTIVITIES: "Activities",
  CAR_RENTAL: "Car Rental",
  INSURANCE: "Travel Insurance",
  ESIM: "eSIM",
  TRAVEL_GEAR: "Travel Gear",
  AIRPORT_TRANSFERS: "Airport Transfers",
  TRAVEL_CARDS: "Travel Cards",
  OTHER: "Other",
};

export const AFFILIATE_CTA_LABELS: Partial<Record<AffiliateCategory, string>> = {
  HOTELS: "Check prices",
  FLIGHTS: "Check flight prices",
  ACTIVITIES: "See available tours",
  CAR_RENTAL: "Compare car rentals",
  INSURANCE: "Get travel insurance",
  ESIM: "Compare eSIM plans",
  TRAVEL_GEAR: "View today's deals",
  AIRPORT_TRANSFERS: "Book airport transfer",
  TRAVEL_CARDS: "Compare travel cards",
};

const CTAS = [
  "Check prices",
  "Compare hotels",
  "See available tours",
  "Check flight prices",
  "Get travel insurance",
  "Compare eSIM plans",
  "Check availability",
  "See current price",
];

/**
 * Generates the single click identifier used for one affiliate redirect.
 * The value is created exactly once per click and reused everywhere: the
 * stored AffiliateClick record, the redirect URL, the tracking parameter
 * and any downstream analytics.
 */
export function generateClickId(): string {
  return randomUUID();
}

/**
 * Builds the final affiliate destination URL. `clickId` must come from
 * `generateClickId()` so the same identifier is used for storage and
 * redirect. Relative target URLs resolve against the canonical site origin.
 *
 * The optional `trackingParameter` is a deterministic template normalized to
 * exactly one query parameter:
 *  - `subid={click_id}`  ->  `subid=<clickId>` (placeholder replaced)
 *  - `subid`             ->  `subid=<clickId>` (bare name)
 *  - `partner=travel`    ->  `partner=travel` (static value)
 */
export function buildAffiliateUrl(
  targetUrl: string,
  params: {
    trackingParameter?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    placement?: string | null;
  },
  clickId: string,
): string {
  const url = new URL(targetUrl, siteConfig.url);
  // Legacy rows may still carry utm_source=roamora; never leak the old brand
  // into affiliate URLs — normalize it to Riversmag.
  const utmSource =
    params.utmSource && params.utmSource !== "roamora" ? params.utmSource : "riversmag";
  const utmMedium = params.utmMedium || "affiliate";
  const utmCampaign = params.utmCampaign || "general";
  const utmContent = params.utmContent || params.placement || "default";
  url.searchParams.set("utm_source", utmSource);
  url.searchParams.set("utm_medium", utmMedium);
  url.searchParams.set("utm_campaign", utmCampaign);
  url.searchParams.set("utm_content", utmContent);
  const template = params.trackingParameter?.trim();
  if (template) {
    const eq = template.indexOf("=");
    if (eq === -1) {
      url.searchParams.set(template, clickId);
    } else {
      const name = template.slice(0, eq).trim();
      const value = template.slice(eq + 1).startsWith("{click_id}")
        ? clickId
        : template.slice(eq + 1).replaceAll("{click_id}", clickId);
      url.searchParams.set(name, value);
    }
  }
  return url.toString();
}

/**
 * Resolves a stored target URL into a redirectable absolute http(s) URL.
 * Rejects non-http(s) protocols (javascript:, data:, ...) so the `/out/[id]`
 * route can never become an open redirect. Returns null when unsafe/invalid.
 */
export function resolveAffiliateTargetUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, siteConfig.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function detectDeviceType(userAgent?: string | null): string {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}

export async function trackAffiliateClick(params: {
  linkId: string;
  placement?: string | null;
  ctaLabel?: string | null;
  userId?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  articleId?: string | null;
  ip?: string | null;
  country?: string | null;
}) {
  const link = await prisma.affiliateLink.findUnique({ where: { id: params.linkId } });
  if (!link || !link.active) return null;

  const deviceType = detectDeviceType(params.userAgent);
  const ctaLabel = params.ctaLabel || AFFILIATE_CTA_LABELS[link.category] || "Find out more";

  const clickId = generateClickId();
  const redirectUrl = buildAffiliateUrl(
    link.targetUrl,
    {
      trackingParameter: link.trackingParameter,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      utmContent: link.utmContent,
      placement: params.placement,
    },
    clickId,
  );

  await prisma.$transaction([
    prisma.affiliateClick.create({
      data: {
        clickId,
        url: redirectUrl,
        affiliateLinkId: link.id,
        articleId: params.articleId ?? link.articleId,
        referrer: params.referrer,
        ip: params.ip,
        userAgent: params.userAgent,
        deviceType,
        country: params.country,
        placement: params.placement,
        ctaLabel,
      },
    }),
    prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  return {
    clickId,
    redirectUrl,
    ctaLabel,
  };
}

export async function getActiveAffiliateLinks(params: {
  category?: AffiliateCategory;
  destinationId?: string;
  articleId?: string;
  product?: string;
  limit?: number;
}): Promise<AffiliateLinkRow[]> {
  const where: Prisma.AffiliateLinkWhereInput = {
    active: true,
    ...(params.category ? { category: params.category } : {}),
    ...(params.destinationId ? { destinationId: params.destinationId } : {}),
    ...(params.articleId ? { articleId: params.articleId } : {}),
  };
  const grouped = params.product
    ? await prisma.affiliateLink.findMany({
        where: {
          ...where,
          productName: { contains: params.product, mode: "insensitive" },
        },
        include: { article: { select: { slug: true, title: true } } },
        orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
        take: params.limit ?? 5,
      })
    : await prisma.affiliateLink.findMany({
        where,
        include: { article: { select: { slug: true, title: true } } },
        orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
        take: params.limit ?? 5,
      });
  return grouped;
}

/**
 * Resolves the best affiliate link for a category in order of specificity:
 * 1) article-specific link, 2) destination link, 3) any active link for the category.
 */
export async function resolveAffiliateLink(params: {
  category: AffiliateCategory;
  articleId?: string | null;
  destinationId?: string | null;
}): Promise<AffiliateLinkRow | null> {
  const { category, articleId, destinationId } = params;
  if (articleId) {
    const articleLink = await prisma.affiliateLink.findFirst({
      where: { active: true, category, articleId },
      include: { article: { select: { slug: true, title: true } } },
      orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
    });
    if (articleLink) return articleLink;
  }
  if (destinationId) {
    const destinationLink = await prisma.affiliateLink.findFirst({
      where: { active: true, category, destinationId },
      include: { article: { select: { slug: true, title: true } } },
      orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
    });
    if (destinationLink) return destinationLink;
  }
  return prisma.affiliateLink.findFirst({
    where: { active: true, category },
    include: { article: { select: { slug: true, title: true } } },
    orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
  });
}

/** General default CTA suggestion for a category. */
export function ctaForCategory(category: AffiliateCategory, index = 0): string {
  if (AFFILIATE_CTA_LABELS[category]) return AFFILIATE_CTA_LABELS[category]!;
  return CTAS[index % CTAS.length];
}

export const DISCLOSURE_TEXT =
  "Riversmag may earn a commission when you book through the links on this page, at no extra cost to you. This helps keep our content free. We only recommend products and services we genuinely believe in.";

export const SHORT_DISCLOSURE =
  "As an affiliate partner we may earn a commission from qualifying purchases.";