import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = params.get("category");
  const destinationId = params.get("destinationId");

  const links = await prisma.affiliateLink.findMany({
    where: {
      active: true,
      ...(category ? { category: category as never } : {}),
      ...(destinationId ? { destinationId } : {}),
    },
    select: { id: true, partnerName: true, productName: true, category: true },
    orderBy: [{ priority: "desc" }, { clickCount: "desc" }],
    take: 20,
  });

  return NextResponse.json({ links });
}