import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseContentBlocks } from "@/lib/content";
import { ArticleForm } from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

export default async function AdminArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const [article, authors, destinations, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { author: true, destination: true, categories: { include: { category: true } } } }),
    prisma.author.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.destination.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 200 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!article) notFound();

  return (
    <ArticleForm
      article={article}
      authors={authors.map((a) => ({ id: a.id, name: a.name }))}
      destinations={destinations.map((d) => ({ id: d.id, name: d.name, slug: d.slug }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      initialBlocks={parseContentBlocks(article.content)}
    />
  );
}