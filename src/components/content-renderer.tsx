import Image from "next/image";
import { BedDouble, Plane, Ticket, Signal, ShieldCheck, Flame } from "lucide-react";
import type { AffiliateCategory } from "@prisma/client";
import { parseContentBlocks } from "@/lib/content";
import { resolveAffiliateLink, AFFILIATE_CTA_LABELS } from "@/lib/affiliate";
import { prisma } from "@/lib/prisma";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { HotelCard } from "@/components/affiliate/hotel-card";
import { ActivityCard } from "@/components/affiliate/activity-card";
import { GearCard } from "@/components/affiliate/gear-card";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { getProducts, isShopEnabled, formatMoney } from "@/lib/fourthwall";
import { PosterLeadMagnet, type PosterProduct } from "@/components/shop/poster-lead-magnet";

interface RendererProps {
  content: string;
  articleId: string;
  destinationId?: string | null;
  destinationSlug?: string | null;
}

export async function ContentRenderer({ content, articleId, destinationId }: RendererProps) {
  const blocks = parseContentBlocks(content);
  if (blocks.length === 0) return null;

  const rendered = [];
  let hasAffiliateBlocks = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const key = `${block.type}-${i}`;

    switch (block.type) {
      case "p":
        rendered.push(<p key={key} className="prose-roamora">{block.text}</p>);
        break;
      case "h2":
        rendered.push(<h2 key={key} id={`section-${i}`}>{block.text}</h2>);
        break;
      case "h3":
        rendered.push(<h3 key={key}>{block.text}</h3>);
        break;
      case "ul":
        rendered.push(
          <ul key={key} className="prose-roamora">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>,
        );
        break;
      case "ol":
        rendered.push(
          <ol key={key} className="prose-roamora">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ol>,
        );
        break;
      case "quote":
        rendered.push(
          <blockquote key={key} className="prose-roamora">
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
            <table className="prose-roamora m-0">
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
        const link = await resolveAffiliateLink({
          category: block.category,
          articleId,
          destinationId,
        });
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
        rendered.push(
          <p key={key} className="my-6">
            <AffiliateButton linkId={block.linkId} label={block.label ?? "Check prices"} placement={articleId} />
          </p>,
        );
        hasAffiliateBlocks = true;
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
        const hotels = await prisma.hotel.findMany({
          where: {
            isActive: true,
            ...(block.destinationId ? { destinationId: block.destinationId } : {}),
            ...(destinationId && !block.destinationId ? { destinationId } : {}),
          },
          include: { affiliateLinks: { where: { active: true }, take: 1 } },
          orderBy: [{ guestRating: "desc" }],
          take: 3,
        });
        if (hotels.length > 0) {
          hasAffiliateBlocks = true;
          rendered.push(
            <div key={key} className="my-8">
              {block.title && <h3>{block.title}</h3>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={{
                      id: hotel.id,
                      name: hotel.name,
                      image: hotel.image,
                      location: hotel.city ? `${hotel.city}${hotel.country ? `, ${hotel.country}` : ""}` : null,
                      rating: hotel.guestRating,
                      priceRange: hotel.priceRange,
                      bestFor: hotel.bestFor,
                      affiliateLinkId: hotel.affiliateLinks[0]?.id ?? null,
                    }}
                  />
                ))}
              </div>
            </div>,
          );
        }
        break;
      }
      case "activities": {
        const activities = await prisma.activity.findMany({
          where: {
            isActive: true,
            ...(block.destinationId ? { destinationId: block.destinationId } : {}),
            ...(destinationId && !block.destinationId ? { destinationId } : {}),
          },
          include: { affiliateLinks: { where: { active: true }, take: 1 } },
          orderBy: [{ rating: "desc" }],
          take: 3,
        });
        if (activities.length > 0) {
          hasAffiliateBlocks = true;
          rendered.push(
            <div key={key} className="my-8">
              {block.title && <h3>{block.title}</h3>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={{
                      id: activity.id,
                      name: activity.name,
                      image: activity.image,
                      description: activity.description,
                      duration: activity.duration,
                      priceRange: activity.priceRange,
                      rating: activity.rating,
                      category: activity.category,
                      affiliateLinkId: activity.affiliateLinks[0]?.id ?? null,
                    }}
                  />
                ))}
              </div>
            </div>,
          );
        }
        break;
      }
      case "products": {
        const products = await prisma.product.findMany({
          where: { isActive: true, ...(block.category ? { category: block.category } : {}) },
          include: { affiliateLinks: { where: { active: true }, take: 1 } },
          orderBy: [{ rating: "desc" }],
          take: 3,
        });
        if (products.length > 0) {
          hasAffiliateBlocks = true;
          rendered.push(
            <div key={key} className="my-8">
              {block.title && <h3>{block.title}</h3>}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <GearCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      image: product.image,
                      brand: product.brand,
                      description: product.description,
                      priceRange: product.priceRange,
                      rating: product.rating,
                      bestFor: product.bestFor,
                      pros: (product.pros as string[] | null) ?? null,
                      affiliateLinkId: product.affiliateLinks[0]?.id ?? null,
                    }}
                  />
                ))}
              </div>
            </div>,
          );
        }
        break;
      }
      case "shop": {
        if (isShopEnabled()) {
          try {
            const all = await getProducts();
            const q = (block.query ?? "").toLowerCase();
            const available = all
              .filter((p) => !p.soldOut)
              .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q))
              .slice(0, block.limit ?? 4);
            if (available.length > 0) {
              const products: PosterProduct[] = available.map((product) => ({
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                priceLabel: formatMoney(product.price, product.currency) || null,
                url: product.url,
                soldOut: product.soldOut,
                description: product.description,
              }));
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
          } catch {
            // Swallow shop failures so articles still render.
          }
        }
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className="prose-roamora">
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