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
  const fallbackDescription = siteConfig.description;
  const resolvedTitle = title ?? fallbackTitle;
  const og = ogImage ?? `/og?title=${encodeURIComponent(resolvedTitle.slice(0, 110))}&type=${encodeURIComponent(siteConfig.tagline)}`;

  return {
    title: { absolute: resolveTitle(title, fallbackTitle) },
    description: description ?? fallbackDescription,
    keywords: [...(keywords ?? siteConfig.keywords)],
    alternates: {
      canonical: canonicalPath ? absoluteUrl(canonicalPath) : undefined,
      ...(alternates ?? {}),
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: resolveTitle(title, fallbackTitle),
      description: description ?? fallbackDescription,
      url: canonicalPath ? absoluteUrl(canonicalPath) : undefined,
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
      description: description ?? fallbackDescription,
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
  description: string;
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
      ...(item.url ? { url: item.url } : {}),
    })),
  };
}

export function hotelSchema(params: {
  name: string;
  address?: string;
  rating?: number | null;
  priceRange?: string | null;
  url?: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: params.name,
    address: params.address ? { "@type": "PostalAddress", streetAddress: params.address } : undefined,
    aggregateRating: params.rating
      ? { "@type": "AggregateRating", ratingValue: params.rating, bestRating: 5 }
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