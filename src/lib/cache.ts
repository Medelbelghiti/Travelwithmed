import { revalidateTag, unstable_cache } from "next/cache";

/**
 * Cache tags. Public pages read through these; admin saves invalidate them
 * (see revalidateContent) so an edit shows up on the next visit instead of
 * after the revalidate window.
 */
export const CACHE_TAGS = {
  content: "content",
} as const;

/** Default time-to-live for cached public content, in seconds. */
export const CONTENT_TTL = 3600;

const DATE_KEY = "__date";

// Only walk plain objects; anything else (e.g. a class with toJSON) is left to
// JSON.stringify as before.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * unstable_cache stores results as JSON, which turns every Date into a string.
 * Prisma rows are full of Dates and the pages call .toISOString() on them, so a
 * plain unstable_cache would crash on the second (cached) render. Dates are
 * tagged on the way in and revived on the way out.
 */
export function encodeDates(value: unknown): unknown {
  if (value instanceof Date) return { [DATE_KEY]: value.toISOString() };
  if (Array.isArray(value)) return value.map(encodeDates);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = encodeDates(v);
    return out;
  }
  return value;
}

export function decodeDates(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decodeDates);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 1 && keys[0] === DATE_KEY && typeof record[DATE_KEY] === "string") {
      return new Date(record[DATE_KEY] as string);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) out[k] = decodeDates(v);
    return out;
  }
  return value;
}

/**
 * Cache a database read for public pages. Arguments are part of the cache key,
 * so they must be serialisable (slugs, ids). Errors are not cached: a database
 * outage still reaches the page's own error handling.
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] } = {},
): (...args: Args) => Promise<Result> {
  const cached = unstable_cache(async (...args: Args) => encodeDates(await fn(...args)), keyParts, {
    revalidate: options.revalidate ?? CONTENT_TTL,
    tags: [CACHE_TAGS.content, ...(options.tags ?? [])],
  });
  return async (...args: Args) => decodeDates(await cached(...args)) as Result;
}

/**
 * Call after any admin write that changes public content. `expire: 0` makes
 * the next visit fetch fresh data, so editors see their change immediately.
 * The homepage keeps its own "home" tag and is refreshed too.
 */
export function revalidateContent(): void {
  revalidateTag(CACHE_TAGS.content, { expire: 0 });
  revalidateTag("home", { expire: 0 });
}
