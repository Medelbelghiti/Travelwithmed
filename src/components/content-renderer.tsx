import Image from "next/image";
import { BedDouble, Plane, Ticket, Signal, ShieldCheck, Flame, Star } from "lucide-react";
import type { AffiliateCategory } from "@prisma/client";
import { parseContentBlocks } from "@/lib/content";
import { resolveAffiliateLink, AFFILIATE_CTA_LABELS } from "@/lib/affiliate";
import { prisma } from "@/lib/prisma";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateModule } from "@/components/affiliate/affiliate-module";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { getProducts, isShopEnabled, formatMoney } from "@/lib/fourthwall";
import { PosterLeadMagnet, type PosterProduct } from "@/components/shop/poster-lead-magnet";

interface RendererProps {
  content: string;
  articleId: string;
  destinationId?: string | null;
  destinationSlug?: string | null;
}

async function fetchBlockHotels(block: { destinationId?: string }, destinationId?: string | null) {
  return prisma.hotel.findMany({
    where: {
      isActive: true,
      ...(block.destinationId ? { destinationId: block.destinationId } : {}),
      ...(destinationId && !block.destinationId ? { destinationId } : {}),
    },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ guestRating: "desc" }],
    take: 3,
  });
}

async function fetchBlockActivities(block: { destinationId?: string }, destinationId?: string | null) {
  return prisma.activity.findMany({
    where: {
      isActive: true,
      ...(block.destinationId ? { destinationId: block.destinationId } : {}),
      ...(destinationId && !block.destinationId ? { destinationId } : {}),
    },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ rating: "desc" }],
    take: 3,
  });
}

async function fetchBlockProducts(block: { category?: string }) {
  return prisma.product.findMany({
    where: { isActive: true, ...(block.category ? { category: block.category } : {}) },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ rating: "desc" }],
    take: 3,
  });
}

export async function ContentRenderer({ content, articleId, destinationId }: RendererProps) {
  const blocks = parseContentBlocks(content);
  if (blocks.length === 0) return null;

  const rendered = [];
  let hasAffiliateBlocks = false;

  // An "affiliate_link" block stores a concrete link id, so it bypasses
  // resolveAffiliateLink and therefore the `active: true` filter every other CTA
  // path goes through. /out/[id] redirects an inactive link to the homepage, so
  // rendering a disabled link produced a dead CTA that dumped the reader on "/".
  // Resolve the whole set up front: one query instead of one per block, and a
  // database problem degrades to "render no affiliate CTA" rather than throwing.
  const explicitLinkIds = [
    ...new Set(
      blocks
        .filter((b) => b.type === "affiliate_link" && b.linkId)
        .map((b) => (b as { linkId: string }).linkId),
    ),
  ];
  const activeExplicitLinkIds = new Set<string>();
  if (explicitLinkIds.length > 0) {
    const active = await prisma.affiliateLink
      .findMany({ where: { id: { in: explicitLinkIds }, active: true }, select: { id: true } })
      .catch(() => []);
    for (const row of active) activeExplicitLinkIds.add(row.id);
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const key = `${block.type}-${i}`;

    switch (block.type) {
      case "p":
        rendered.push(<p key={key} className="prose-riversmag">{block.text}</p>);
        break;
      case "h2":
        rendered.push(<h2 key={key} id={`section-${i}`}>{block.text}</h2>);
        break;
      case "h3":
        rendered.push(<h3 key={key}>{block.text}</h3>);
        break;
      case "ul":
        rendered.push(
          <ul key={key} className="prose-riversmag">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>,
        );
        break;
      case "ol":
        rendered.push(
          <ol key={key} className="prose-riversmag">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ol>,
        );
        break;
      case "quote":
        rendered.push(
          <blockquote key={key} className="prose-riversmag">
            {block.text}
          </blockquote>,
        );
        break;
      case "image":
        rendered.push(
          <figure key={key}>
            <Image
              src={block.src}
              alt={block.alt}
              width={1200}
              height={800}
              className="rounded-2xl"
              loading="lazy"
            />
            {block.caption && <figcaption className="mt-2 text-center text-sm text-ink-muted">{block.caption}</figcaption>}
          </figure>,
        );
        break;
      case "table":
        rendered.push(
          <div key={key} className="overflow-x-auto rounded-2xl border border-line">
            <table className="prose-riversmag m-0">
              <thead>
                <tr>
                  {block.headers.map((h, j) => (
                    <th key={j}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j}>
                    {row.map((cell, k) => (
                      <td key={k}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        break;
      case "cta": {
        let link: { id: string } | null = null;
        try {
          link = await resolveAffiliateLink({
            category: block.category,
            articleId,
            destinationId,
          });
        } catch {
          link = null;
        }
        if (link) {
          hasAffiliateBlocks = true;
          rendered.push(
            <AffiliateCtaBand
              key={key}
              linkId={link.id}
              label={block.label ?? AFFILIATE_CTA_LABELS[block.category as AffiliateCategory] ?? "Check prices"}
              category={block.category}
            />,
          );
        }
        break;
      }
      case "affiliate_link": {
        if (activeExplicitLinkIds.has(block.linkId)) {
          rendered.push(
            <p key={key} className="my-6">
              <AffiliateButton linkId={block.linkId} label={block.label ?? "Check prices"} placement={articleId} />
            </p>,
          );
          hasAffiliateBlocks = true;
        }
        break;
      }
      case "faq":
        rendered.push(
          <div key={key} className="my-8">
            <h2>Frequently asked questions</h2>
            <div className="mt-4 space-y-3">
              {block.items.map((item, j) => (
                <details key={j} className="group rounded-2xl border border-line bg-white shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span className="text-brand transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm leading-relaxed text-ink-soft">{item.answer}</div>
                </details>
              ))}
            </div>
          </div>,
        );
        break;
      case "hotels": {
        let hotels: Awaited<ReturnType<typeof fetchBlockHotels>> = [];
        try {
          hotels = await fetchBlockHotels(block, destinationId);
        } catch {
          hotels = [];
        }
        if (hotels.length > 0) {
          hasAffiliateBlocks = true;
          rendered.push(
            <div key={key} className="my-10">
              {block.title && <h2>{block.title}</h2>}

              {/*
               * Same treatment as the products block: the top-rated hotel
               * becomes a full AffiliateModule, the rest become comparable
               * rows. Guest rating, price and best-for sit next to each other
               * so the choice is explicit rather than decorative. Guest ratings
               * are the property's own number, which the copy makes clear, as
               * opposed to our editorial score in AffiliateModule.
               */}
              <div className="mt-5 space-y-4">
                {hotels.map((hotel, index) => {
                  const linkId = hotel.affiliateLinks[0]?.id;
                  const pros = (hotel.pros as string[] | null) ?? null;
                  const cons = (hotel.cons as string[] | null) ?? null;
                  const location = hotel.city
                    ? `${hotel.city}${hotel.country ? `, ${hotel.country}` : ""}`
                    : hotel.country;

                  if (index === 0 && linkId) {
                    return (
                      <AffiliateModule
                        key={hotel.id}
                        linkId={linkId}
                        name={hotel.name}
                        rating={hotel.guestRating}
                        reviewCount={hotel.reviewCount}
                        bestFor={hotel.bestFor}
                        verdict={hotel.description}
                        pros={pros}
                        cons={cons}
                        category="hotel"
                        provider={hotel.name}
                        placement={articleId}
                        ctaLabel="See rates"
                      />
                    );
                  }

                  return (
                    <div
                      key={hotel.id}
                      className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-base font-semibold text-ink">{hotel.name}</h3>
                          {hotel.guestRating ? (
                            <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                              <span className="font-semibold text-ink">
                                {hotel.guestRating.toFixed(1)}
                              </span>
                              <span className="text-ink-muted">guest rating</span>
                            </span>
                          ) : null}
                          {hotel.starRating ? (
                            <span className="text-xs text-ink-muted">
                              {"*".repeat(Math.max(0, Math.min(5, hotel.starRating)))}
                            </span>
                          ) : null}
                        </div>
                        {location ? <p className="mt-1 text-sm text-ink-soft">{location}</p> : null}
                        {hotel.bestFor ? (
                          <p className="mt-1 text-sm text-ink-soft">
                            <span className="font-semibold text-ink">Best for: </span>
                            {hotel.bestFor}
                          </p>
                        ) : null}
                        {hotel.priceRange ? (
                          <p className="mt-1 text-sm font-medium text-ink">{hotel.priceRange}</p>
                        ) : null}
                      </div>

                      {linkId ? (
                        <AffiliateButton
                          linkId={linkId}
                          label="See rates"
                          variant="outline"
                          placement={articleId}
                          category="hotel"
                          provider={hotel.name}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>,
          );
        }
        break;
      }
      case "activities": {
        let activities: Awaited<ReturnType<typeof fetchBlockActivities>> = [];
        try {
          activities = await fetchBlockActivities(block, destinationId);
        } catch {
          activities = [];
        }
        if (activities.length > 0) {
          hasAffiliateBlocks = true;
          rendered.push(
            <div key={key} className="my-10">
              {block.title && <h2>{block.title}</h2>}
              <div className="mt-5 space-y-4">
                {activities.map((activity, index) => {
                  const linkId = activity.affiliateLinks[0]?.id;
                  // Activity records factual inclusions rather than an
                  // editorial pros/cons pair, so reuse those columns instead of
                  // leaving the module's verdict unsupported.
                  const included = (activity.included as string[] | null) ?? null;
                  const notIncluded = (activity.notIncluded as string[] | null) ?? null;

                  if (index === 0 && linkId) {
                    return (
                      <AffiliateModule
                        key={activity.id}
                        linkId={linkId}
                        name={activity.name}
                        rating={activity.rating}
                        reviewCount={activity.reviewCount}
                        bestFor={activity.bestFor}
                        verdict={activity.description}
                        pros={included}
                        cons={notIncluded}
                        category={activity.category ?? "activity"}
                        placement={articleId}
                        ctaLabel="See prices"
                      />
                    );
                  }

                  return (
                    <div
                      key={activity.id}
                      className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-base font-semibold text-ink">{activity.name}</h3>
                          {activity.rating ? (
                            <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                              <span className="font-semibold text-ink">{activity.rating.toFixed(1)}</span>
                              <span className="text-ink-muted">/5</span>
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-soft">
                          {activity.duration ? <span>{activity.duration}</span> : null}
                          {activity.priceRange ? (
                            <span className="font-medium text-ink">{activity.priceRange}</span>
                          ) : null}
                        </div>
                      </div>

                      {linkId ? (
                        <AffiliateButton
                          linkId={linkId}
                          label="See prices"
                          variant="outline"
                          placement={articleId}
                          category={activity.category ?? "activity"}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>,
          );
        }
        break;
      }
      case "products": {
        let products: Awaited<ReturnType<typeof fetchBlockProducts>> = [];
        try {
          products = await fetchBlockProducts(block);
        } catch {
          products = [];
        }
        if (products.length > 0) {
          hasAffiliateBlocks = true;
          rendered.push(
            <div key={key} className="my-10">
              {block.title && <h2>{block.title}</h2>}

              {/*
               * A single comparison table instead of a card grid.
               *
               * Cards ask the reader to evaluate one offer at a time and give
               * them nothing to compare against, so they default to the first
               * CTA. A table puts the trade-off next to the price (our score,
               * best-for, pros, cons), which is what actually makes someone
               * pick. The first row is expanded into a full AffiliateModule
               * because the top-rated option is the one most people take, and
               * it deserves the editorial framing.
               */}
              <div className="mt-5 space-y-4">
                {products.map((product, index) => {
                  const linkId = product.affiliateLinks[0]?.id;
                  const pros = (product.pros as string[] | null) ?? null;
                  const cons = (product.cons as string[] | null) ?? null;

                  if (index === 0 && linkId) {
                    return (
                      <AffiliateModule
                        key={product.id}
                        linkId={linkId}
                        name={product.name}
                        rating={product.rating}
                        bestFor={product.bestFor}
                        verdict={product.description}
                        pros={pros}
                        cons={cons}
                        category={product.category}
                        provider={product.brand}
                        placement={articleId}
                        ctaLabel="See prices"
                      />
                    );
                  }

                  return (
                    <div
                      key={product.id}
                      className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h3 className="text-base font-semibold text-ink">{product.name}</h3>
                          {product.rating ? (
                            <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                              <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
                              <span className="text-ink-muted">/5</span>
                            </span>
                          ) : null}
                        </div>
                        {product.bestFor ? (
                          <p className="mt-1 text-sm text-ink-soft">
                            <span className="font-semibold text-ink">Best for: </span>
                            {product.bestFor}
                          </p>
                        ) : product.description ? (
                          <p className="mt-1 text-sm text-ink-soft">{product.description}</p>
                        ) : null}
                        {product.priceRange ? (
                          <p className="mt-1 text-sm font-medium text-ink">{product.priceRange}</p>
                        ) : null}
                      </div>

                      {linkId ? (
                        <AffiliateButton
                          linkId={linkId}
                          label={product.priceRange ? "See prices" : "Check prices"}
                          variant="outline"
                          placement={articleId}
                          category={product.category}
                          provider={product.brand}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>,
          );
        }
        break;
      }
      case "shop": {
        if (isShopEnabled()) {
          let products: PosterProduct[] = [];
          try {
            const all = await getProducts();
            const q = (block.query ?? "").toLowerCase();
            const available = all
              .filter((p) => !p.soldOut)
              .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q))
              .slice(0, block.limit ?? 4);
            products = available.map((product) => ({
              id: product.id,
              name: product.name,
              imageUrl: product.imageUrl,
              priceLabel: formatMoney(product.price, product.currency) || null,
              url: product.url,
              soldOut: product.soldOut,
              description: product.description,
            }));
          } catch {
            // Swallow shop failures so articles still render.
          }
          if (products.length > 0) {
            const placeSlug = (block.query ?? "").trim().toLowerCase() || "travel";
            rendered.push(
              <div key={key} className="my-8">
                <PosterLeadMagnet
                  query={placeSlug}
                  downloadPath={`/printables/poster/${encodeURIComponent(placeSlug)}`}
                  products={products}
                />
              </div>,
            );
          }
        }
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className="prose-riversmag">
      {rendered}
      {hasAffiliateBlocks && <AffiliateDisclosure />}
    </div>
  );
}

function AffiliateCtaBand({ linkId, label, category }: { linkId: string; label: string; category: string }) {
  const Icon =
    category === "HOTELS"
      ? BedDouble
      : category === "FLIGHTS"
        ? Plane
        : category === "ACTIVITIES"
          ? Ticket
          : category === "ESIM"
            ? Signal
            : category === "INSURANCE"
              ? ShieldCheck
              : Flame;
  return (
    <div className="my-6 flex flex-col items-center gap-4 rounded-2xl bg-brand-light p-6">
      <p className="flex items-center gap-2 text-center font-semibold text-brand-dark">
        <Icon className="h-5 w-5" aria-hidden />
        Ready to book?
      </p>
      <AffiliateButton linkId={linkId} label={label} placement="content-band" size="lg" />
    </div>
  );
}