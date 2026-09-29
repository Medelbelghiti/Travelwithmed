import type { Metadata } from "next";
import { siteConfig } from "./site";
import { absoluteUrl } from "./utils";

export interface SeoProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: readonly string[];
  noindex?: boolean;
  alternates?: Record<string, string>;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function resolveTitle(title: string | undefined, fallback: string): string {
  const base = title ?? fallback;
  if (base.toLowerCase().includes(siteConfig.name.toLowerCase())) return base;
  return `${base} | ${siteConfig.name}`;
}

/** SERP titles are truncated in results at roughly 60 characters. */
export const META_TITLE_MAX = 60;
/** Below this a title wastes SERP space without adding information. */
export const META_TITLE_MIN = 30;

/**
 * Builds a SERP title for an article that has no curated metaTitle.
 *
 * The previous seed pattern was `${title} — ${destination} Guide | Riversmag`,
 * which produced titles of 77-89 characters for the eSIM articles and was
 * clipped in search results. This version:
 *
 *   - does not repeat the destination when the title already names it
 *   - never exceeds META_TITLE_MAX, dropping trailing clauses before truncating
 *   - never emits an ellipsis, because "Best Things to Do in..." reads as broken
 *
 * It only ever runs for titles with no curated value, so an editor's wording is
 * never rewritten.
 */
export function buildMetaTitle(
  articleTitle: string | null | undefined,
  destinationName?: string | null,
): string {
  const brand = siteConfig.name;
  const title = (articleTitle ?? "").trim().replace(/\s+/g, " ");
  if (!title) {
    return destinationName
      ? `${destinationName} Travel Guide | ${brand}`
      : `Travel Guide | ${brand}`;
  }

  const namesDestination =
    !!destinationName && title.toLowerCase().includes(destinationName.trim().toLowerCase());

  let candidate = namesDestination
    ? `${title} | ${brand}`
    : destinationName
      ? `${title} — ${destinationName} | ${brand}`
      : `${title} | ${brand}`;

  if (candidate.length <= META_TITLE_MAX) return candidate;

  // Too long: keep the leading clause only ("eSIM in Rome: Stay Connected"
  // -> "eSIM in Rome"), then re-attach the brand.
  const head = title.split(/[:—–|]/)[0].trim();
  if (head && head !== title) {
    candidate = `${head} | ${brand}`;
    if (candidate.length <= META_TITLE_MAX) return candidate;
    // Still too long: hard-clamp the leading clause, keeping whole words.
  }

  const budget = META_TITLE_MAX - (brand.length + 3); // " | " separator
  const words = head.split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const w of words) {
    // +1 for the space that will join this word to the previous one.
    const projected = kept.length ? kept.join(" ").length + 1 + w.length : w.length;
    if (projected > budget) break;
    kept.push(w);
  }
  const clamped = kept.join(" ").trim();
  if (clamped) return `${clamped} | ${brand}`;

  // Degenerate case: a single word longer than the whole budget.
  return `${title.slice(0, budget).trimEnd()} | ${brand}`;
}

export function buildMetadata({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords,
  noindex,
  alternates,
}: SeoProps): Metadata {
  const fallbackTitle = `${siteConfig.name} — Travel Guides, Itineraries & Smart Travel Recommendations`;
  const resolvedTitle = title ?? fallbackTitle;
  const og = ogImage ?? `/og?title=${encodeURIComponent(resolvedTitle.slice(0, 110))}&type=${encodeURIComponent(siteConfig.tagline)}`;

  return {
    title: { absolute: resolveTitle(title, fallbackTitle) },
    description,
    keywords: [...(keywords ?? siteConfig.keywords)],
    alternates: {
      canonical: canonicalPath ? absoluteUrl(canonicalPath) : undefined,
      ...(alternates ?? {}),
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      title: resolveTitle(title, fallbackTitle),
      description,
      url: canonicalPath ? absoluteUrl(canonicalPath) : absoluteUrl("/"),
      siteName: siteConfig.name,
      type: ogType,
      images: [{ url: absoluteUrl(og), width: 1200, height: 630, alt: resolveTitle(title, fallbackTitle) }],
      publishedTime,
      modifiedTime,
      authors,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: resolveTitle(title, fallbackTitle),
      description,
      images: [absoluteUrl(og)],
    },
  };
}

/* ---------- Schema.org builders ---------- */

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/logo.png"),
    sameAs: Object.values(siteConfig.socials),
  };
}

export function articleSchema(params: {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  authorName?: string | null;
}) {
  const { title, description, url, image, publishedTime, modifiedTime, authorName } = params;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? absoluteUrl(image) : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: authorName
      ? { "@type": "Person", name: authorName }
      : { "@type": "Organization", name: siteConfig.name },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/logo.png") },
    },
    datePublished: publishedTime ? new Date(publishedTime).toISOString() : undefined,
    dateModified: modifiedTime ? new Date(modifiedTime).toISOString() : undefined,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function touristAttractionSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image ? absoluteUrl(params.image) : undefined,
  };
}

export function touristDestinationSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string | null;
  includesAttractionNames?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: params.name,
    description: params.description,
    url: params.url,
    image: params.image ? absoluteUrl(params.image) : undefined,
    ...(params.includesAttractionNames && params.includesAttractionNames.length
      ? {
          includesAttraction: params.includesAttractionNames.map((n) => ({
            "@type": "TouristAttraction",
            name: n,
          })),
        }
      : {}),
  };
}

export function itemListSchema(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { url: absoluteUrl(item.url) } : {}),
    })),
  };
}

export function hotelSchema(params: {
  name: string;
  address?: string;
  rating?: number | null;
  reviewCount?: number | null;
  priceRange?: string | null;
  url?: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: params.name,
    address: params.address ? { "@type": "PostalAddress", streetAddress: params.address } : undefined,
    aggregateRating:
      params.rating !== undefined && params.rating !== null &&
      params.reviewCount !== undefined && params.reviewCount !== null &&
      params.rating >= 0 && params.rating <= 5 && params.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: params.rating,
            bestRating: 5,
            reviewCount: params.reviewCount,
          }
        : undefined,
    priceRange: params.priceRange ?? undefined,
    url: params.url ?? undefined,
    image: params.image ? absoluteUrl(params.image) : undefined,
  };
}

export function imageObjects(images: (string | null | undefined)[]): Record<string, unknown> {
  const urls = images.filter((i): i is string => Boolean(i));
  return {
    image: urls.map((u) => ({ "@type": "ImageObject", url: absoluteUrl(u) })),
  };
}