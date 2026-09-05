import { prisma } from "@/lib/prisma";
import { ArticleCard } from "@/components/article-card";
import { SectionHeading } from "@/components/ui/card";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

async function fetchArticles(page: number, perPage: number) {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true, categories: { include: { category: true } } },
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam ?? "1");
  const currentPage = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
  const canonicalPath = currentPage > 1 ? `/articles?page=${currentPage}` : "/articles";
  return buildMetadata({
    title: currentPage > 1 ? `All Travel Guides (Page ${currentPage})` : "All Travel Guides",
    description:
      "Browse every Riversmag travel guide — destination guides, hotel picks, itineraries, gear reviews and practical travel advice.",
    canonicalPath,
  });
}

export default async function ArticlesIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam ?? "1");
  const currentPage = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;

  const [total, articles] = await Promise.all([
    (async () => {
      try {
        return await prisma.article.count({ where: { status: "PUBLISHED" } });
      } catch {
        return 0;
      }
    })(),
    fetchArticles(currentPage, PER_PAGE).catch(() => [] as Awaited<ReturnType<typeof fetchArticles>>),
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
        description="Destination deep-dives, hotel roundups, itineraries and practical advice — all in one place."
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