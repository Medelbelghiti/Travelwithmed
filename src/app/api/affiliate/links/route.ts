import { NextRequest, NextResponse } from "next/server";
import { AffiliateCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CATEGORIES = new Set<string>(Object.values(AffiliateCategory));

export async function GET(request: NextRequest) {
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
    select: { id: true, partnerName: true, productName: true, category: true },
    orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
    take: 20,
  });

  return NextResponse.json({ links });
}
