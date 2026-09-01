import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/article-card";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/pagination";

export const metadata = {
  title: "All Travel Guides",
  description:
    "Browse every Riversmag travel guide â€” destination guides, hotel picks, itineraries, gear reviews and practical travel advice.",
};

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

export default async function ArticlesIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam ?? "1");
  const currentPage = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;

  const [total, articles] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      include: { author: true, categories: { include: { category: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (total === 0) {
    return (
      <div className="container-x section-pad">
        <Breadcrumbs items={buildCrumbs([{ name: "Guides", href: "/articles" }])} />
        <SectionHeading title="All Travel Guides" />
        <p className="text-ink-muted">No guides published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Guides", href: "/articles" }])} />
      <SectionHeading
        eyebrow="The library"
        title="All travel guides"
        description="Destination deep-dives, hotel roundups, itineraries and practical advice â€” all in one place."
      />
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
      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/articles" />
    </main>
  );
}