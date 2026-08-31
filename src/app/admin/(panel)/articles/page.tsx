import Link from "next/link";
import { Plus, Pencil, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ARTICLE_TYPE_LABELS } from "@/components/article-card";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ArticleStatus } from "@prisma/client";

const STATUS_STYLES: Record<ArticleStatus, string> = {
  DRAFT: "bg-sand text-ink-soft",
  REVIEW: "bg-warning/10 text-warning",
  PUBLISHED: "bg-success/10 text-success",
  SCHEDULED: "bg-info/10 text-info",
  ARCHIVED: "bg-ink/10 text-ink-muted",
};

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  await requireUser();
  const articles = await prisma.article.findMany({
    include: { author: true, destination: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Articles</h1>
          <p className="mt-1 text-sm text-ink-muted">{articles.length} total</p>
        </div>
        <Link href="/admin/articles/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" aria-hidden />
          New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <p className="text-ink-muted">No articles yet. Create your first one.</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand">
                <th className="px-4 py-3 font-semibold text-ink">Article</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Type</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Destination</th>
                <th className="px-4 py-3 font-semibold text-ink">Status</th>
                <th className="hidden px-4 py-3 font-semibold text-ink lg:table-cell">Updated</th>
                <th className="px-4 py-3 text-right font-semibold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="max-w-xs truncate font-medium text-ink lg:max-w-sm">{article.title}</p>
                    <p className="text-xs text-ink-muted">
                      {article.author?.name ?? "No author"} · {article.viewCount.toLocaleString()} views
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="text-xs text-ink-muted">{ARTICLE_TYPE_LABELS[article.type]}</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {article.destination ? <span className="text-xs text-ink-muted">{article.destination.name}</span> : <span className="text-xs text-ink-muted/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[article.status]}`}>
                      {article.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-ink-muted lg:table-cell">{formatDate(article.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {article.status === "PUBLISHED" && (
                        <Link href={`/articles/${article.slug}`} className="rounded-lg p-2 text-ink-muted hover:bg-sand hover:text-ink" aria-label="View">
                          <Eye className="h-4 w-4" aria-hidden />
                        </Link>
                      )}
                      <Link href={`/admin/articles/${article.id}`} className="rounded-lg p-2 text-ink-muted hover:bg-sand hover:text-ink" aria-label="Edit">
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}