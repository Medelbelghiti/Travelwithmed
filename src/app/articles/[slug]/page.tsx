import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { parseContentBlocks, blocksToText } from "@/lib/content";
import { ContentRenderer } from "@/components/content-renderer";
import { ArticleCard, ARTICLE_TYPE_LABELS } from "@/components/article-card";
import { Badge } from "@/components/ui/badge";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { formatDate } from "@/lib/utils";
import { NewsletterCta } from "@/components/newsletter-cta";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: true, seoMetadata: true },
  });
  if (!article || article.status !== "PUBLISHED") return { title: "Article not found" };

  return buildMetadata({
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt ?? undefined,
    canonicalPath: `/articles/${article.slug}`,
    ogImage: article.ogImage ?? article.coverImage ?? undefined,
    ogType: "article",
    publishedTime: article.publishedAt?.toISOString(),
    modifiedTime: article.updatedDate?.toISOString() ?? article.updatedAt.toISOString(),
    authors: article.author?.name ? [article.author.name] : undefined,
    noindex: !article.allowIndexing,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: true, destination: true, faqItems: true },
  });

  if (!article || article.status !== "PUBLISHED") notFound();

  const [related, relatedByDestination, recommendedHotelLinks] = await Promise.all([
    prisma.relatedArticle.findMany({
      where: { articleId: article.id },
      include: { relatedArticle: { include: { author: true } } },
      orderBy: { relevanceScore: "desc" },
      take: 3,
    }),
    article.destinationId
      ? prisma.article.findMany({
          where: { status: "PUBLISHED", destinationId: article.destinationId, id: { not: article.id } },
          include: { author: true },
          take: 3,
        })
      : Promise.resolve([]),
    article.destinationId
      ? prisma.affiliateLink.findMany({
          where: { active: true, category: "HOTELS", destinationId: article.destinationId },
          take: 3,
          include: { article: { select: { slug: true, title: true } } },
        })
      : Promise.resolve([]),
  ]);

  const blocks = parseContentBlocks(article.content);
  const wordCount = blocksToText(blocks).trim().split(/\s+/).length || article.wordCount || 1;

  const relatedArticles = [...related.map((r) => r.relatedArticle), ...relatedByDestination]
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 3);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.metaDescription ?? article.excerpt ?? undefined,
      image: article.coverImage ?? undefined,
      mainEntityOfPage: { "@type": "WebPage", "@id": `/articles/${article.slug}` },
      author: article.author?.name
        ? { "@type": "Person", name: article.author.name }
        : { "@type": "Organization", name: "Roamora" },
      publisher: { "@type": "Organization", name: "Roamora", logo: { "@type": "ImageObject", url: "/images/logo.png" } },
      datePublished: article.publishedAt?.toISOString(),
      dateModified: article.updatedAt.toISOString(),
    },
  ];
  const faqBlocks = blocks.filter((b) => b.type === "faq");
  if (faqBlocks.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqBlocks
        .flatMap((b) => ("items" in b ? (b.items as { question: string; answer: string }[]) : []))
        .map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
    });
  }

  const destinationCrumb = article.destination
    ? [
        {
          "@type": "ListItem" as const,
          position: 2,
          name: article.destination.name,
          item: `${siteConfig.url}/destinations/${article.destination.slug}`,
        },
      ]
    : [];
  jsonLd.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/` },
      ...destinationCrumb,
      {
        "@type": "ListItem",
        position: article.destination ? 3 : 2,
        name: "Guides",
        item: `${siteConfig.url}/articles`,
      },
    ],
  });

  const tableOfContents = blocks
    .filter((b) => b.type === "h2")
    .map((b, i) => ({ title: b.text, id: `section-${i}` }));

  return (
    <article className="pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="bg-sand">
        <div className="container-x max-w-4xl py-12 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-brand">Home</Link>
              </li>
              <li>/</li>
              {article.destination && (
                <>
                  <li>
                    <Link href={`/destinations/${article.destination.slug}`} className="hover:text-brand">
                      {article.destination.name}
                    </Link>
                  </li>
                  <li>/</li>
                </>
              )}
              <li className="font-medium text-ink">Guides</li>
            </ol>
          </nav>

          <Badge tone="brand">{ARTICLE_TYPE_LABELS[article.type]}</Badge>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">{article.title}</h1>
          {article.excerpt && <p className="mt-5 text-lg leading-relaxed text-ink-soft">{article.excerpt}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden />
              {article.author?.name ?? article.authorName ?? "Roamora Editors"}
            </span>
            {article.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                {formatDate(article.publishedAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {article.readingTimeMinutes || Math.max(1, Math.ceil(wordCount / 220))} min read
            </span>
          </div>
        </div>
      </header>

      {article.coverImage && (
        <div className="container-x max-w-4xl pt-8">
          <Image
            src={article.coverImage}
            alt={article.title}
            width={1280}
            height={720}
            priority
            className="aspect-video w-full rounded-3xl object-cover"
          />
        </div>
      )}

      <div className="container-x mt-8 grid gap-10 lg:grid-cols-[1fr_280px] lg:max-w-6xl">
        <div className="min-w-0 max-w-3xl">
          {tableOfContents.length > 0 && (
            <details className="mb-8 rounded-2xl border border-line bg-white p-5 lg:hidden">
              <summary className="cursor-pointer list-none font-semibold text-ink [&::-webkit-details-marker]:hidden">
                Table of contents
              </summary>
              <ul className="mt-3 space-y-2">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-brand hover:underline">
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <ContentRenderer
            content={article.content}
            articleId={article.id}
            destinationId={article.destinationId}
            destinationSlug={article.destination?.slug}
          />

          <div className="mt-8">
            <AffiliateDisclosure />
          </div>

          <NewsletterCta />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {tableOfContents.length > 0 && (
              <nav className="rounded-2xl border border-line bg-white p-5 shadow-sm" aria-label="Table of contents">
                <h4 className="text-sm font-bold uppercase tracking-wider text-ink-muted">On this page</h4>
                <ul className="mt-3 space-y-2">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-sm text-ink-soft hover:text-brand">
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {article.author?.bio && (
              <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark">
                    {article.author.name[0]}
                  </span>
                  <div>
                    <h4 className="font-semibold text-ink">Written by {article.author.name}</h4>
                    <p className="text-xs text-ink-muted">{article.author.role ?? "Travel writer"}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink-soft">{article.author.bio}</p>
              </div>
            )}

            {recommendedHotelLinks.length > 0 && (
              <div className="rounded-2xl bg-brand-dark p-5 text-white">
                <h4 className="text-white">Plan your stay</h4>
                <p className="mt-1 text-sm text-white/70">
                  Compare prices across booking platforms for {article.destination?.name}.
                </p>
                <a
                  href={`/go/${recommendedHotelLinks[0].id}?placement=article-sidebar`}
                  rel="nofollow sponsored"
                  className="mt-4 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
                >
                  Compare hotels
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>

      {relatedArticles.length > 0 && (
        <section className="container-x pt-14">
          <h2 className="mb-6 text-3xl">Continue planning your trip</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((a) => (
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
        </section>
      )}
    </article>
  );
}