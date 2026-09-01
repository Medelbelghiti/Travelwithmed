import type { Prisma } from "@prisma/client";
import { AffiliateCategory } from "@prisma/client";
import { prisma } from "./prisma";

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

function buildUtmUrl(
  targetUrl: string,
  params: {
    trackingParameter?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmContent?: string | null;
    placement?: string | null;
  },
): string {
  const url = new URL(targetUrl, "https://riversmag.com");
  const utmSource = params.utmSource || "riversmag";
  const utmMedium = params.utmMedium || "affiliate";
  const utmCampaign = params.utmCampaign || "general";
  const utmContent = params.utmContent || params.placement || "default";
  url.searchParams.set("utm_source", utmSource);
  url.searchParams.set("utm_medium", utmMedium);
  url.searchParams.set("utm_campaign", utmCampaign);
  url.searchParams.set("utm_content", utmContent);
  if (params.trackingParameter) {
    // If the tracking param contains a placeholder token, replace it.
    if (params.trackingParameter.includes("{click_id}")) {
      const clickId = Math.random().toString(36).slice(2, 10);
      url.searchParams.set("click_id", clickId);
    } else {
      url.searchParams.set(params.trackingParameter, "/"); // marker for param presence
    }
  }
  return url.toString();
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

  await prisma.affiliateClick.create({
    data: {
      url: buildUtmUrl(link.targetUrl, {
        trackingParameter: link.trackingParameter,
        utmSource: link.utmSource,
        utmMedium: link.utmMedium,
        utmCampaign: link.utmCampaign,
        utmContent: link.utmContent,
        placement: params.placement,
      }),
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
  });

  await prisma.affiliateLink.update({
    where: { id: link.id },
    data: { clickCount: { increment: 1 } },
  });

  return {
    redirectUrl: buildUtmUrl(link.targetUrl, {
      trackingParameter: link.trackingParameter,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      utmContent: link.utmContent,
      placement: params.placement,
    }),
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