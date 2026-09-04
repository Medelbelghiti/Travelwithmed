import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui/card";
import { ArticleCard } from "@/components/article-card";

interface RelatedGuidesProps {
  destinationId?: string | null;
  destinationName?: string | null;
  excludeId?: string;
  limit?: number;
}

export async function RelatedGuides({
  destinationId,
  destinationName,
  excludeId,
  limit = 3,
}: RelatedGuidesProps) {
  if (!destinationId) return null;

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      destinationId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  if (articles.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading
        eyebrow="Plan your visit"
        title={`Guides about ${destinationName ?? "this destination"}`}
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={{
              id: article.id,
              title: article.title,
              slug: article.slug,
              type: article.type,
              excerpt: article.excerpt,
              coverImage: article.coverImage,
              publishedAt: article.publishedAt,
              authorName: article.author?.name ?? null,
            }}
          />
        ))}
      </div>
    </section>
  );
}
