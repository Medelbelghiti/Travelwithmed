import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/article-card";
import { SectionHeading } from "@/components/ui/card";

export interface CategoryListingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  categoryType?: string;
  categorySlugs?: string[];
  articleType?: string;
  emptyMessage?: string;
  linkHref?: string;
  linkLabel?: string;
  limit?: number;
}

async function fetchArticles({
  categoriesFilter,
  articleType,
  limit,
}: {
  categoriesFilter: { some: { category: { slug: { in?: string[] }; type?: string } } } | undefined;
  articleType?: string;
  limit: number;
}) {
  return prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      ...(categoriesFilter ? { categories: categoriesFilter } : {}),
      ...(articleType ? { type: articleType as never } : {}),
    },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function CategoryListing({
  title,
  eyebrow,
  description,
  categorySlugs,
  categoryType,
  articleType,
  emptyMessage = "No guides published yet. Check back soon.",
  linkHref,
  linkLabel,
  limit = 60,
}: CategoryListingProps) {
  const categoriesFilter =
    categorySlugs || categoryType
      ? { some: { category: { slug: { in: categorySlugs }, ...(categoryType ? { type: categoryType } : {}) } } }
      : undefined;

  let articles: Awaited<ReturnType<typeof fetchArticles>> = [];
  try {
    articles = await fetchArticles({
      categoriesFilter,
      articleType,
      limit,
    });
  } catch {
    articles = [];
  }

  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      {articles.length === 0 ? (
        <p className="text-ink-muted">{emptyMessage}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard
              key={a.id}
              article={{
                id: a.id,
                title: a.title,
                slug: a.slug,
                type: a.type,
                excerpt: a.excerpt,
                coverImage: a.coverImage,
                publishedAt: a.publishedAt,
                authorName: a.author?.name ?? null,
              }}
            />
          ))}
        </div>
      )}
      {linkHref && linkLabel && (
        <p className="mt-8 text-center">
          <a href={linkHref} className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">
            {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </p>
      )}
    </div>
  );
}