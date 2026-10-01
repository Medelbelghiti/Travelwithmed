import Link from "next/link";

export interface LinkIndexItem {
  name: string;
  href: string;
  hint?: string | null;
}

/**
 * A crawlable, plain-text index of every page under a hub.
 *
 * Card grids cap what they render, which is right for design and wrong for
 * internal linking: any page outside the cap is reachable from the sitemap but
 * carries almost no PageRank inside the site. Big travel publishers solve this
 * by inlining a full link list on every hub (Lonely Planet links 554 pages from
 * a single destination page).
 *
 * This renders the same idea as a quiet list at the bottom of the page, where
 * it costs no visual weight: real <a> elements, grouped in columns, each label
 * a human-readable destination or article title rather than a raw slug.
 */
export function LinkIndex({
  title,
  description,
  items,
  columns = 4,
}: {
  title: string;
  description?: string;
  items: LinkIndexItem[];
  columns?: number;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-line pt-10" aria-labelledby="link-index-heading">
      <h2 id="link-index-heading" className="text-xl font-semibold text-ink md:text-2xl">
        {title}
      </h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p> : null}

      <ul
        className="mt-6 grid gap-x-8 gap-y-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <li key={item.href} className="min-w-0">
            <Link
              href={item.href}
              className="block truncate text-sm text-ink-soft underline-offset-4 hover:text-brand hover:underline"
            >
              {item.name}
            </Link>
            {item.hint ? <span className="sr-only">. {item.hint}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}