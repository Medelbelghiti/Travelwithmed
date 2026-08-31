"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AffiliateCategory } from "@prisma/client";

function s(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}
function b(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export async function saveAffiliateLinkAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const data = {
      partnerName: s(formData.get("partnerName")),
      category: (s(formData.get("category")) || "OTHER") as AffiliateCategory,
      productName: s(formData.get("productName")),
      destinationText: s(formData.get("destinationText")) || null,
      targetUrl: s(formData.get("targetUrl")),
      trackingParameter: s(formData.get("trackingParameter")) || null,
      utmCampaign: s(formData.get("utmCampaign")) || null,
      utmContent: s(formData.get("utmContent")) || null,
      disclosureRequired: b(formData.get("disclosureRequired")),
      active: b(formData.get("active")),
      priority: Number(s(formData.get("priority")) || 0),
      dealTitle: s(formData.get("dealTitle")) || null,
      promoCode: s(formData.get("promoCode")) || null,
      dealExpiresAt: s(formData.get("dealExpiresAt")) ? new Date(`${s(formData.get("dealExpiresAt"))}T23:59:59`) : null,
      featuredDeal: b(formData.get("featuredDeal")),
      articleId: s(formData.get("articleId")) || null,
      destinationId: s(formData.get("destinationId")) || null,
      hotelId: s(formData.get("hotelId")) || null,
      activityId: s(formData.get("activityId")) || null,
      productId: s(formData.get("productId")) || null,
    };

    if (!data.partnerName || !data.productName || !data.targetUrl) {
      return { error: "Partner name, product name and URL are required." };
    }

    if (id) {
      await prisma.affiliateLink.update({ where: { id }, data });
    } else {
      await prisma.affiliateLink.create({ data });
    }
    redirect("/admin/affiliate-links");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save affiliate link." };
  }
}