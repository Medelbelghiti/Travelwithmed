"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { blocksToText, parseContentBlocks } from "@/lib/content";
import type { ArticleStatus, ArticleType } from "@prisma/client";

export type ArticleFormState = { error?: string; articleId?: string } | void;

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function saveArticleAction(prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  try {
    await requireRole("ADMIN", "EDITOR", "AUTHOR");

    const id = asString(formData.get("id"));
    const title = asString(formData.get("title"));
    if (!title) return { error: "Title is required." };

    const slugInput = asString(formData.get("slug"));
    const slug = slugInput || slugify(title);
    const type = (asString(formData.get("type")) || "TRAVEL_TIPS") as ArticleType;
    const status = (asString(formData.get("status")) || "DRAFT") as ArticleStatus;
    const excerpt = asString(formData.get("excerpt"));
    const contentRaw = asString(formData.get("content"));

    let contentJson: string;
    try {
      const parsed = JSON.parse(contentRaw);
      contentJson = Array.isArray(parsed) ? JSON.stringify(parsed) : contentRaw;
    } catch {
      contentJson = contentRaw;
    }

    const blocks = parseContentBlocks(contentJson);
    const wordCount = blocksToText(blocks).trim().split(/\s+/).filter(Boolean).length;

    const data = {
      title,
      slug,
      type,
      status,
      excerpt: excerpt || null,
      content: contentJson,
      coverImage: asString(formData.get("coverImage")) || null,
      destinationId: asString(formData.get("destinationId")) || null,
      authorId: asString(formData.get("authorId")) || null,
      focusKeyword: asString(formData.get("focusKeyword")) || null,
      metaTitle: asString(formData.get("metaTitle")) || null,
      metaDescription: asString(formData.get("metaDescription")) || null,
      canonicalUrl: asString(formData.get("canonicalUrl")) || null,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 220)),
      scheduledAt: asString(formData.get("scheduledAt")) ? new Date(asString(formData.get("scheduledAt"))) : null,
      ...(status === "PUBLISHED" ? { publishedAt: new Date(), lastReviewedAt: new Date() } : {}),
    };

    if (id) {
      const existing = await prisma.article.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
      const wasPublished = existing?.status === "PUBLISHED";
      // Never clear an existing published date; only set it on first publish.
      if (wasPublished) {
        const safeData = { ...data };
        delete safeData.publishedAt;
        delete safeData.lastReviewedAt;
        await prisma.article.update({ where: { id }, data: { ...safeData, lastReviewedAt: status === "PUBLISHED" ? new Date() : undefined } });
      } else {
        await prisma.article.update({ where: { id }, data });
      }
      redirect(`/admin/articles`);
    } else {
      await prisma.article.create({ data });
      redirect("/admin/articles");
    }
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    console.error("saveArticleAction error", error);
    if ((error as Error).message === "FORBIDDEN") return { error: "You don't have permission to edit articles." };
    return { error: "Failed to save the article." };
  }
}