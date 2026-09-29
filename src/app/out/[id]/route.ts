import { NextRequest, NextResponse } from "next/server";
import {
  resolveAffiliateTargetUrl,
  trackAffiliateClick,
} from "@/lib/affiliate";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Tracking-write budget per IP per minute.
 *
 * Deliberately never blocks the redirect: a rate-limited click still 302s to
 * the partner, it just skips the AffiliateClick row and the clickCount
 * increment. Blocking the redirect would destroy revenue on a false positive.
 * The limit exists only to stop this route being used as a DB write amplifier.
 */
const TRACK_WRITES_PER_MINUTE = 60;

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

  // Over budget -> fall through to the untracked redirect below.
  const mayTrack = rateLimit(`out:${ip ?? "unknown"}`, TRACK_WRITES_PER_MINUTE, 60_000);

  if (mayTrack) {
    try {
      const result = await trackAffiliateClick({
        linkId: id,
        placement,
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
  }

  // Fallback: look up link target directly without tracking.
  // The URL is re-validated so a malformed or non-http(s) target can never
  // become an open redirect; unverifiable ID target URLs fall back home.
  const link = await prisma.affiliateLink.findUnique({ where: { id } });
  const safeTarget = link?.active ? resolveAffiliateTargetUrl(link.targetUrl) : null;
  if (safeTarget) {
    return NextResponse.redirect(safeTarget, { status: 302 });
  }

  return NextResponse.redirect(new URL("/", siteConfig.url), { status: 302 });
}