"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function s(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveSettingAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN");
    const key = s(formData.get("key"));
    if (!key) return { error: "Key is required." };
    const value = s(formData.get("value"));
    const isSecret = formData.get("isSecret") === "on";

    await prisma.setting.upsert({
      where: { key },
      update: { value, isSecret },
      create: { key, value, isSecret },
    });
    redirect("/admin/settings");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save setting." };
  }
}

export async function deleteSettingAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN");
    const key = s(formData.get("key"));
    if (!key) return { error: "Key is required." };
    await prisma.setting.delete({ where: { key } });
    redirect("/admin/settings");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to delete setting." };
  }
}

export async function saveMediaAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const url = s(formData.get("url"));
    if (!url) return { error: "URL is required." };
    const alt = s(formData.get("altText")) || null;
    const caption = s(formData.get("caption")) || null;
    const credit = s(formData.get("credit")) || null;

    const ext = (url.split("?")[0].match(/\.(\w+)$/)?.[1] ?? "").toLowerCase();
    const format = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg"].includes(ext) ? ext : null;

    await prisma.media.create({
      data: { url, altText: alt, caption, credit, format },
    });
    redirect("/admin/media");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to add media." };
  }
}