import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbSchema } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

export interface Crumb {
  name: string;
  href: string;
}

export function JsonLdBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(items.map((c) => ({ name: c.name, url: c.href })))) }}
    />
  );
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-muted/60" aria-hidden />}
              {isLast ? (
                <span className="font-medium text-ink" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-brand transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function buildCrumbs(items: Crumb[]): Crumb[] {
  // Always include Home as the first crumb.
  const home: Crumb = { name: "Home", href: "/" };
  if (items[0]?.href === "/") return items;
  return [home, ...items];
}

export { absoluteUrl };