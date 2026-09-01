import "server-only";

const API_BASE = "https://storefront-api.fourthwall.com/v1";

export type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  soldOut: boolean;
  url: string;
};

type RawRecord = Record<string, unknown>;
type RawMoney = { value?: unknown; currency?: unknown };
type RawImage = { url: string | null; transformedUrl: string | null; width: number | null; height: number | null };

const nextFetch = {
  next: { revalidate: 3600 },
};

export function isShopEnabled(): boolean {
  return Boolean(process.env.FOURTHWALL_TOKEN && process.env.FOURTHWALL_SHOP_DOMAIN);
}

function shopBaseUrl(): string {
  return `https://${process.env.FOURTHWALL_SHOP_DOMAIN ?? ""}`;
}

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" ? (value as RawRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asImage(value: unknown): RawImage | null {
  const rec = asRecord(value);
  if (!rec) return null;
  const width = typeof rec.width === "number" ? rec.width : null;
  const height = typeof rec.height === "number" ? rec.height : null;
  const url = asString(rec.url);
  const transformedUrl = asString(rec.transformedUrl);
  return { url, transformedUrl, width, height };
}

function heroImage(raw: RawRecord): RawImage | null {
  if (!Array.isArray(raw.images)) return null;
  const image = raw.images
    .map(asImage)
    .find((img): img is RawImage => img !== null && (img.url !== null || img.transformedUrl !== null));
  return image ?? null;
}

function productMoney(raw: RawRecord): { unitPrice: RawMoney | null; compareAtPrice: RawMoney | null; currency: string } {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  let unitPrice: RawMoney | null = null;
  let compareAtPrice: RawMoney | null = null;
  let currency = (process.env.FOURTHWALL_CURRENCY ?? "USD") as string;
  for (const v of variants) {
    const variant = asRecord(v);
    const unit = variant ? asRecord(variant.unitPrice) : null;
    if (unit) {
      if (typeof unit.value === "number" && (unitPrice === null || Number(unit.value) < Number(unitPrice.value))) {
        unitPrice = unit;
      }
      const c = asString(unit.currency);
      if (c) currency = c;
    }
    const compare = variant ? asRecord(variant.compareAtPrice) : null;
    if (compare && typeof compare.value === "number" && (compareAtPrice === null || Number(compare.value) < Number(compareAtPrice.value))) {
      compareAtPrice = compare;
    }
  }
  return { unitPrice, compareAtPrice, currency };
}

function normalizeProduct(raw: RawRecord): ShopProduct | null {
  const access = asRecord(raw.access);
  if (access && asString(access.type) !== "PUBLIC") return null;

  const state = asRecord(raw.state);
  const soldOut = asString(state?.type) === "SOLD_OUT";

  const name = asString(raw.name) ?? "Travel print";
  const slug = asString(raw.slug) ?? "";
  const description = asString(raw.description)?.trim() || null;

  const money = productMoney(raw);
  const image = heroImage(raw);

  return {
    id: asString(raw.id) ?? slug,
    name,
    slug,
    description: description ? description.slice(0, 220) : null,
    imageUrl: image?.transformedUrl ?? image?.url ?? null,
    imageWidth: image?.width ?? null,
    imageHeight: image?.height ?? null,
    price: money.unitPrice && typeof money.unitPrice.value === "number" ? money.unitPrice.value : null,
    compareAtPrice:
      money.compareAtPrice && typeof money.compareAtPrice.value === "number" ? money.compareAtPrice.value : null,
    currency: money.currency,
    soldOut,
    url: slug
      ? `${shopBaseUrl()}/products/${slug}?utm_source=riversmag&utm_medium=shop&utm_campaign=grid`
      : shopBaseUrl(),
  };
}

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    ...nextFetch,
  });
  if (!res.ok) {
    throw new Error(`Fourthwall API error ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getProducts(): Promise<ShopProduct[]> {
  if (!isShopEnabled()) return [];
  const token = process.env.FOURTHWALL_TOKEN ?? "";
  const products: ShopProduct[] = [];
  let page = 0;
  let hasMore = true;
  while (hasMore && page < 10) {
    const data = await fetchJson<{ results?: unknown[]; paging?: { hasNextPage?: boolean } }>(
      "/collections/all/products",
      { storefront_token: token, page: String(page), size: "50" },
    );
    const results = Array.isArray(data.results) ? data.results : [];
    for (const item of results) {
      const raw = asRecord(item);
      const product = raw ? normalizeProduct(raw) : null;
      if (product) products.push(product);
    }
    hasMore = data.paging?.hasNextPage === true;
    page += 1;
  }
  return products;
}

export function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) return "";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}