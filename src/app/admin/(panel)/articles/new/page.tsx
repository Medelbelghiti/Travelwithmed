import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ArticleForm } from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

export default async function AdminArticleNewPage() {
  await requireUser();
  const [authors, destinations] = await Promise.all([
    prisma.author.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.destination.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 200 }),
  ]);

  return <ArticleForm authors={authors.map((a) => ({ id: a.id, name: a.name }))} destinations={destinations.map((d) => ({ id: d.id, name: d.name, slug: d.slug }))} categories={[]} />;
}