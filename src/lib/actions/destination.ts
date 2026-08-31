"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { DestinationType } from "@prisma/client";

function s(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveDestinationAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const name = s(formData.get("name"));
    if (!name) return { error: "Name is required." };

    const slugInput = s(formData.get("slug"));
    const slug = slugInput || slugify(name);
    const type = (s(formData.get("type")) || "CITY") as DestinationType;
    const parentId = s(formData.get("parentId")) || null;

    const data = {
      name,
      slug,
      type,
      parentId,
      tagline: s(formData.get("tagline")) || null,
      overview: s(formData.get("overview")) || null,
      coverImage: s(formData.get("coverImage")) || null,
      bestTimeToVisit: s(formData.get("bestTimeToVisit")) || null,
      howToGetThere: s(formData.get("howToGetThere")) || null,
      transportation: s(formData.get("transportation")) || null,
      budget: s(formData.get("budget")) || null,
      safety: s(formData.get("safety")) || null,
      visaInfo: s(formData.get("visaInfo")) || null,
      esimInfo: s(formData.get("esimInfo")) || null,
      currency: s(formData.get("currency")) || null,
      language: s(formData.get("language")) || null,
      timezone: s(formData.get("timezone")) || null,
      capital: s(formData.get("capital")) || null,
      population: s(formData.get("population")) || null,
      sortOrder: Number(s(formData.get("sortOrder")) || 0),
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    };

    if (parentId === id) {
      return { error: "A destination cannot be its own parent." };
    }

    if (id) {
      const exists = await prisma.destination.findUnique({ where: { slug } , select: { id: true } });
      if (exists && exists.id !== id) return { error: "A destination with this slug already exists." };
      await prisma.destination.update({ where: { id }, data });
    } else {
      const exists = await prisma.destination.findUnique({ where: { slug }, select: { id: true } });
      if (exists) return { error: "A destination with this slug already exists." };
      await prisma.destination.create({ data });
    }
    redirect("/admin/destinations");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save destination." };
  }
}