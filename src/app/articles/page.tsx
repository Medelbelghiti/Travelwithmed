import { prisma } from "@/lib/prisma";
import { rethrowIfDatabaseUnavailable } from "@/lib/db-errors";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { SectionHeading } from "@/components/ui/card";
import Link from "next/link";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { LinkIndex } from "@/components/ui/link-index";
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

/**
 * Commercial landing pages, stored as articles with a `hub/` slug prefix
 * (best-hotels/tokyo, things-to-do/bali, where-to-stay/rome).
 *
 * These carry the highest commercial intent on the site but are invisible:
 * /articles lists by publishedAt and none of them are linked from any hub, so
 * a crawl only ever reaches them through the sitemap. Grouping them by intent
 * gives them an entry point and turns them into a browsable commercial
 * directory rather than orphaned pages.
 */
async function fetchCommercialHubs() {
  try {
    return await prisma.article.findMany({
      where: { status: "PUBLISHED", slug: { startsWith: "hub/" } },
      select: { title: true, slug: true, excerpt: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    rethrowIfDatabaseUnavailable(error);
    return [];
  }
}

function groupHubs(hubs: { title: string; slug: string; excerpt: string | null }[]) {
  const groups = new Map<string, { title: string; slug: string; excerpt: string | null }[]>();

  for (const hub of hubs) {
    // hub/best-hotels/tokyo -> "Best hotels"
    const intent = hub.slug.split("/")[1] ?? "Other";
    const label = intent
      .split("-")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

    const list = groups.get(label) ?? [];
    list.push(hub);
    groups.set(label, list);
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
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

/**
 * Every published guide, as flat crawlable links.
 *
 * The grid paginates 12 at a time, so this page otherwise links only the
 * current slice of the library. Crawlers reach the rest via pagination, which
 * spreads authority thin and leaves most guides weakly linked from within the
 * site. This index links all of them from the hub itself.
 */
async function fetchAllArticleLinks() {
  try {
    return await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true },
      orderBy: { title: "asc" },
    });
  } catch (error) {
    rethrowIfDatabaseUnavailable(error);
    return [];
  }
}

export default async function ArticlesIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requested = Number(pageParam ?? "1");
  const currentPage = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;

  const [total, articles, allArticles, commercialHubs] = await Promise.all([
    (async () => {
      try {
        return await prisma.article.count({ where: { status: "PUBLISHED" } });
      } catch (error) {
    rethrowIfDatabaseUnavailable(error);
        return 0;
      }
    })(),
    fetchArticles(currentPage, PER_PAGE).catch(() => [] as Awaited<ReturnType<typeof fetchArticles>>),
    fetchAllArticleLinks(),
    fetchCommercialHubs(),
  ]);

  const hubGroups = groupHubs(commercialHubs);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Out-of-range pages would render an empty grid with a self-canonical
  // (a soft 404). Fail properly instead.
  if (currentPage > totalPages) notFound();

  if (total === 0) {
    return (
      <div className="container-x section-pad">
        <Breadcrumbs items={buildCrumbs([{ name: "Guides", href: "/articles" }])} />
        <SectionHeading level={1} title="All Travel Guides" />
        <p className="text-ink-muted">No guides published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Guides", href: "/articles" }])} />
      <SectionHeading
        level={1}
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

      {hubGroups.length > 0 ? (
        <section className="mt-16 border-t border-line pt-10" aria-labelledby="commercial-hubs">
          <h2 id="commercial-hubs" className="text-xl font-semibold text-ink md:text-2xl">
            Book by destination
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Shortlists by intent, so you can go straight to what you need to book.
          </p>

          <div className="mt-8 space-y-10">
            {hubGroups.map(([label, hubs]) => (
              <div key={label}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  {label}
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hubs.map((hub) => (
                    <Link
                      key={hub.slug}
                      href={`/articles/${hub.slug}`}
                      className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand/40"
                    >
                      <span className="text-base font-semibold text-ink group-hover:text-brand">
                        {hub.title}
                      </span>
                      {hub.excerpt ? (
                        <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
                          {hub.excerpt}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <LinkIndex
        title={`Every guide (${allArticles.length})`}
        description="The complete library, indexable in one pass."
        columns={3}
        items={allArticles.map((a) => ({ name: a.title, href: `/articles/${a.slug}` }))}
      />
    </main>
  );
}