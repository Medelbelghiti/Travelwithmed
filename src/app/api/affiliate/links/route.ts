import { NextRequest, NextResponse } from "next/server";
import { AffiliateCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const CATEGORIES = new Set<string>(Object.values(AffiliateCategory));

/** Public read endpoint: 30 requests per IP per minute. */
const READS_PER_MINUTE = 30;

export async function GET(request: NextRequest) {
  if (!rateLimit(`affiliate-links:${getClientIp(request)}`, READS_PER_MINUTE, 60_000)) {
    return NextResponse.json(
      { links: [], error: "Too many requests." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const destinationId = params.get("destinationId")?.slice(0, 64) || null;

  if (category !== null && !CATEGORIES.has(category)) {
    return NextResponse.json({ links: [], error: "Invalid category." }, { status: 400 });
  }

  const links = await prisma.affiliateLink.findMany({
    where: {
      active: true,
      ...(category ? { category: category as AffiliateCategory } : {}),
      ...(destinationId ? { destinationId } : {}),
    },
    // targetUrl is deliberately not returned: this endpoint is public and
    // unauthenticated, so it must not be usable to harvest affiliate targets.
    select: { id: true, partnerName: true, productName: true, category: true },
    orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
    take: 20,
  });

  return NextResponse.json({ links });
}
