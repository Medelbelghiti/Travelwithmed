import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cachedQuery } from "@/lib/cache";
import { rethrowIfDatabaseUnavailable } from "@/lib/db-errors";
import { buildMetadata, personSchema, authorSameAs } from "@/lib/seo";
import { Breadcrumbs, buildCrumbs, JsonLdBreadcrumbs } from "@/components/ui/breadcrumbs";
import { ArticleCard } from "@/components/article-card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const fetchAuthor = cachedQuery(
  async (slug: string) =>
    prisma.author.findUnique({
      where: { slug },
      include: {
        articles: {
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          select: { id: true, title: true, slug: true, type: true, excerpt: true, coverImage: true, publishedAt: true },
        },
      },
    }),
  ["author"],
);

async function loadAuthor(slug: string) {
  try {
    const author = await fetchAuthor(slug);
    return author?.isActive ? author : null;
  } catch (error) {
    rethrowIfDatabaseUnavailable(error);
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const author = await loadAuthor(slug);
  if (!author) return { title: "Author not found" };
  return buildMetadata({
    title: `${author.name}${author.role ? `, ${author.role}` : ""} | Riversmag`,
    description:
      author.bio?.slice(0, 155) ??
      `Travel guides and itineraries by ${author.name} for Riversmag.`,
    canonicalPath: `/authors/${author.slug}`,
    ogType: "profile",
    // An author with nothing published is a thin page: keep it out of the index.
    noindex: author.articles.length === 0,
  });
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = await loadAuthor(slug);
  if (!author) notFound();

  const path = `/authors/${author.slug}`;
  const sameAs = authorSameAs(author.socialLinks);
  const crumbs = buildCrumbs([
    { name: "About", href: "/about" },
    { name: author.name, href: path },
  ]);
  const schema = personSchema({
    name: author.name,
    path,
    description: author.bio,
    image: author.avatar,
    jobTitle: author.role,
    knowsAbout: author.expertise,
    sameAs,
  });

  return (
    <div className="pb-16">
      <JsonLdBreadcrumbs items={crumbs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <header className="bg-sand">
        <div className="container-x max-w-4xl py-12 md:py-16">
          <Breadcrumbs items={crumbs} />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {author.avatar ? (
              <Image
                src={author.avatar}
                alt={author.name}
                width={112}
                height={112}
                className="h-28 w-28 shrink-0 rounded-full object-cover"
                priority
              />
            ) : (
              <span
                aria-hidden
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-brand-light font-serif text-4xl font-semibold text-brand-dark"
              >
                {author.name[0]}
              </span>
            )}
            <div>
              <h1 className="text-4xl font-semibold md:text-5xl">{author.name}</h1>
              {author.role && <p className="mt-2 text-lg text-ink-soft">{author.role}</p>}
              {author.location && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {author.location}
                </p>
              )}
            </div>
          </div>

          {author.bio && <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-ink-soft">{author.bio}</p>}

          {author.expertise && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Areas of expertise">
              {author.expertise
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean)
                .map((e) => (
                  <li key={e} className="rounded-full border border-line bg-white px-3 py-1 text-sm text-ink-soft">
                    {e}
                  </li>
                ))}
            </ul>
          )}

          {sameAs.length > 0 && (
            <p className="mt-6 flex flex-wrap gap-4 text-sm">
              {sameAs.map((url) => (
                <a key={url} href={url} rel="me noopener" target="_blank" className="text-brand underline underline-offset-2">
                  {new URL(url).hostname.replace(/^www\./, "")}
                </a>
              ))}
            </p>
          )}
        </div>
      </header>

      <section className="container-x pt-12">
        <h2 className="mb-6 text-3xl">
          {author.articles.length > 0 ? `Guides by ${author.name} (${author.articles.length})` : `No published guides yet`}
        </h2>
        {author.articles.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {author.articles.map((a) => (
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
                  authorName: author.name,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
