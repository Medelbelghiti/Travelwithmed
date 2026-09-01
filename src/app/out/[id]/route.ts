import { NextRequest, NextResponse } from "next/server";
import { trackAffiliateClick } from "@/lib/affiliate";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");
  const country = (request as NextRequest & { geo?: { country?: string | null } }).geo?.country ?? null;
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement");

  try {
    const result = await trackAffiliateClick({
      linkId: id,
      placement,
      ctaLabel: placement ? undefined : undefined,
      userAgent,
      referrer,
      ip,
      country,
    });

    if (result) {
      return NextResponse.redirect(result.redirectUrl, { status: 302 });
    }
  } catch (error) {
    console.error("Affiliate click error", error);
  }

  // Fallback: look up link target directly
  const link = await prisma.affiliateLink.findUnique({ where: { id } });
  if (link?.active) {
    return NextResponse.redirect(link.targetUrl, { status: 302 });
  }

  return NextResponse.redirect(new URL("/", request.url), { status: 302 });
}