"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AffiliateCategory } from "@prisma/client";

function s(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}
function b(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

const CATEGORY_VALUES = Object.values(AffiliateCategory) as [
  AffiliateCategory,
  ...AffiliateCategory[],
];

const categorySchema = z.enum(CATEGORY_VALUES);

const targetUrlSchema = z
  .string()
  .min(1, "Target URL is required.")
  .refine(
    (raw) => {
      try {
        const url = new URL(raw, "https://riversmag.com");
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    "Target URL must be a valid http(s) URL.",
  );

const optionalDateSchema = z
  .union([z.literal(""), z.string().min(1)])
  .optional()
  .transform((val) => {
    if (!val) return null;
    const d = new Date(`${val}T23:59:59`);
    return Number.isNaN(d.getTime()) ? null : d;
  });

export async function saveAffiliateLinkAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");

    const categoryParsed = categorySchema.safeParse(s(formData.get("category")) || "OTHER");
    const targetUrlParsed = targetUrlSchema.safeParse(s(formData.get("targetUrl")));
    if (!targetUrlParsed.success) {
      return { error: "Target URL must be a valid http(s) URL." };
    }
    const priority = Number(s(formData.get("priority")) || 0);
    const dealExpiresAt = optionalDateSchema.parse(s(formData.get("dealExpiresAt")));

    const id = s(formData.get("id"));
    const data = {
      partnerName: s(formData.get("partnerName")),
      category: categoryParsed.success ? categoryParsed.data : AffiliateCategory.OTHER,
      productName: s(formData.get("productName")),
      destinationText: s(formData.get("destinationText")) || null,
      targetUrl: targetUrlParsed.data,
      trackingParameter: s(formData.get("trackingParameter")) || null,
      utmCampaign: s(formData.get("utmCampaign")) || null,
      utmContent: s(formData.get("utmContent")) || null,
      disclosureRequired: b(formData.get("disclosureRequired")),
      active: b(formData.get("active")),
      priority: Number.isFinite(priority) ? priority : 0,
      dealTitle: s(formData.get("dealTitle")) || null,
      promoCode: s(formData.get("promoCode")) || null,
      dealExpiresAt,
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