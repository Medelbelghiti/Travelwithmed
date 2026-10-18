/**
 * Hub type configuration for destination "cluster" pages (e.g. best hotels,
 * where to stay, airport transfer, things to do).
 *
 * Each hub type maps a URL slug to the metadata needed to render a reusable,
 * data-driven hub page for any destination. Adding a new hub type later is a
 * single addition here — no page/component duplication required.
 */

export type HubTypeSlug = "best-hotels" | "where-to-stay" | "best-tours" | "things-to-do";

export interface HubType {
  slug: HubTypeSlug;
  /** Human label shown in breadcrumbs / headings. */
  label: string;
  /** Single-arg formatter used in titles and headings, e.g. "Best hotels in Paris". */
  title: (cityName: string) => string;
  eyebrow: string;
  /** Meta description template with a {city} placeholder. */
  description: (cityName: string) => string;
}

export const HUB_TYPES: Record<HubTypeSlug, HubType> = {
  "best-hotels": {
    slug: "best-hotels",
    label: "Best Hotels",
    title: (cityName) => `Best hotels in ${cityName}`,
    eyebrow: "Where to stay",
    description: (cityName) =>
      `The best hotels in ${cityName}, chosen for value, location and quality — with honest reviews and price comparisons for every budget.`,
  },
  "where-to-stay": {
    slug: "where-to-stay",
    label: "Where to Stay",
    title: (cityName) => `Where to stay in ${cityName}`,
    eyebrow: "Areas & hotels",
    description: (cityName) =>
      `The best areas and neighbourhoods to stay in ${cityName}, with hand-picked hotels for couples, families and every budget.`,
  },
  "best-tours": {
    slug: "best-tours",
    label: "Best Tours",
    title: (cityName) => `Best tours in ${cityName}`,
    eyebrow: "Guided experiences",
    description: (cityName) =>
      `The best guided tours and day trips in ${cityName} — walking tours, food experiences, adventure excursions and skip-the-line tickets at every budget.`,
  },
  "things-to-do": {
    slug: "things-to-do",
    label: "Things to Do",
    title: (cityName) => `Best things to do in ${cityName}`,
    eyebrow: "Experiences",
    description: (cityName) =>
      `The best things to do in ${cityName} — top-rated attractions, hidden gems, cultural experiences and must-see highlights for every type of traveller.`,
  },
};

export function isHubTypeSlug(value: string): value is HubTypeSlug {
  return value in HUB_TYPES;
}

/**
 * Hub types grouped by the data they need to return HTTP 200.
 *
 * The hub page deliberately serves 404 when a destination has no hotels
 * (hub/[type]/[city]/page.tsx) or no activities, so that a thin hub is never
 * indexed. Anywhere these links are rendered must apply the same condition,
 * otherwise the site ships links that 404 - which is what the destination
 * detail page was doing for every destination without inventory.
 *
 * The sitemap already applies this filter independently; both call sites must
 * agree or the sitemap and the rendered links drift apart.
 */
export const HUB_TYPES_BY_DATA = {
  hotels: ["best-hotels", "where-to-stay"] as HubTypeSlug[],
  activities: ["best-tours", "things-to-do"] as HubTypeSlug[],
};

/** True when the hub page for this type would return 200 for the destination. */
export function isHubAvailable(
  type: HubTypeSlug,
  data: { hotels: unknown[]; activities: unknown[] },
): boolean {
  if (HUB_TYPES_BY_DATA.hotels.includes(type)) return data.hotels.length > 0;
  return data.activities.length > 0;
}

/** The subset of hub types that are actually reachable for this destination. */
export function availableHubTypes(
  data: { hotels: unknown[]; activities: unknown[] },
): HubType[] {
  return (Object.values(HUB_TYPES) as HubType[]).filter((t) =>
    isHubAvailable(t.slug, data),
  );
}
