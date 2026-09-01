import { PrismaClient, AffiliateCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const GYG_CITY_PAGES: Record<string, string> = {
  paris: "https://www.getyourguide.com/paris-l16/?partner_id=K0KEBIE",
  kyoto: "https://www.getyourguide.com/kyoto-l204/?partner_id=K0KEBIE",
};

/**
 * Fixes affiliate link targeting for destination-specific CTAs.
 *
 * Before this fix, seeds collapsed every Booking.com / GetYourGuide entry into a
 * single row per partner (last one won), so "Compare hotels in Rome" pointed at a
 * Marrakech search and "Browse Rome tours" at a Kyoto search.
 *
 * This script:
 *  1. Creates a per-destination Booking.com (HOTELS) and GetYourGuide (ACTIVITIES)
 *     link for every destination that has published articles, plus one generic hub.
 *  2. Rewrites every `affiliate_link` content block in published articles so HOTELS
 *     blocks target the article's own destination (generic hub when none).
 *
 * Idempotent: safe to re-run at any time.
 */
async function main() {
  const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
  const prisma = new PrismaClient({ adapter });

  const destinationById = new Map(
    (await prisma.destination.findMany({ select: { id: true, name: true } })).map((d) => [d.id, d.name]),
  );

  const linksById = new Map((await prisma.affiliateLink.findMany()).map((l) => [l.id, l]));

  // -------- 1. per-destination + generic hub links --------
  const bookingCache = new Map<string, string>();
  const gygCache = new Map<string, string>();

  async function bookingFor(destinationId: string | null): Promise<string> {
    const key = destinationId ?? "*";
    if (bookingCache.has(key)) return bookingCache.get(key)!;
    const dest = destinationId ? destinationById.get(destinationId) : null;
    const productName = `Booking.com search${dest ? ` - ${dest}` : " (any destination)"}`;
    const existing = await prisma.affiliateLink.findFirst({
      where: { partnerName: "Booking.com", category: "HOTELS", productName },
    });
    const link =
      existing ??
      (await prisma.affiliateLink.create({
        data: {
          partnerName: "Booking.com",
          category: AffiliateCategory.HOTELS,
          productName,
          destinationText: dest ?? null,
          destinationId: destinationId ?? null,
          targetUrl: dest
            ? `https://www.booking.com/searchresults.en.html?ss=${encodeURIComponent(dest)}`
            : "https://www.booking.com/searchresults.en.html",
          dealTitle: "Member prices on stays",
          promoCode: "ROAMORA15",
          active: true,
          priority: 90,
          utmCampaign: "destination-fix",
        },
      }));
    bookingCache.set(key, link.id);
    linksById.set(link.id, link);
    return link.id;
  }

  async function gygFor(destinationId: string | null): Promise<string> {
    const key = destinationId ?? "*";
    if (gygCache.has(key)) return gygCache.get(key)!;
    const dest = destinationId ? destinationById.get(destinationId) : null;
    const productName = `GetYourGuide${dest ? ` - ${dest}` : " (any destination)"}`;
    const existing = await prisma.affiliateLink.findFirst({
      where: { partnerName: "GetYourGuide", category: "ACTIVITIES", productName },
    });
    const page = dest ? GYG_CITY_PAGES[dest.toLowerCase()] : null;
    const link =
      existing ??
      (await prisma.affiliateLink.create({
        data: {
          partnerName: "GetYourGuide",
          category: AffiliateCategory.ACTIVITIES,
          productName,
          destinationText: dest ?? null,
          destinationId: destinationId ?? null,
          targetUrl:
            page ??
            (dest
              ? `https://www.getyourguide.com/s/?partner_id=K0KEBIE&q=${encodeURIComponent(dest)}`
              : "https://www.getyourguide.com/?partner_id=K0KEBIE"),
          dealTitle: "Free cancellation on most tours",
          active: true,
          priority: 80,
          utmCampaign: "destination-fix",
        },
      }));
    gygCache.set(key, link.id);
    linksById.set(link.id, link);
    return link.id;
  }

  // -------- 2. rewrite affiliate_link blocks per destination --------
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, destinationId: true, content: true },
  });

  let updatedBlocks = 0;
  let updatedArticles = 0;

  for (const article of articles) {
    let blocks: unknown[];
    try {
      blocks = JSON.parse(article.content);
    } catch {
      continue;
    }
    if (!Array.isArray(blocks)) continue;

    let changed = false;
    for (const block of blocks) {
      if (!block || typeof block !== "object" || (block as { type?: string }).type !== "affiliate_link") continue;
      const linkId = (block as { linkId?: string }).linkId;
      const link = linkId ? linksById.get(linkId) : null;
      if (!link) continue;

      let replacement: string | null = null;
      if (link.partnerName === "Booking.com" && link.category === "HOTELS") {
        replacement = await bookingFor(article.destinationId);
      } else if (link.partnerName === "GetYourGuide" && link.category === "ACTIVITIES") {
        replacement = await gygFor(article.destinationId);
      }
      if (replacement && replacement !== linkId) {
        (block as { linkId: string }).linkId = replacement;
        changed = true;
        updatedBlocks++;
      }
    }

    if (changed) {
      await prisma.article.update({ where: { id: article.id }, data: { content: JSON.stringify(blocks) } });
      updatedArticles++;
    }
  }

  console.log(`Per-destination Booking links created/resolved: ${bookingCache.size}`);
  console.log(`Per-destination GetYourGuide links created/resolved: ${gygCache.size}`);
  console.log(`Affiliate blocks rewritten: ${updatedBlocks} across ${updatedArticles} articles`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});