import Image from "next/image";
import { ArrowUpRight, PackageX } from "lucide-react";
import type { ShopProduct } from "@/lib/fourthwall";
import { formatMoney } from "@/lib/fourthwall";

export function ShopCard({ product }: { product: ShopProduct }) {
  const price = formatMoney(product.price, product.currency);

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-line bg-white p-3 shadow-sm transition-colors hover:border-brand"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <PackageX className="h-8 w-8" aria-hidden />
          </div>
        )}
        {product.soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold leading-snug text-ink">{product.name}</h3>
          {price && <p className="shrink-0 font-semibold text-brand-dark">{price}</p>}
        </div>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{product.description}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors group-hover:text-brand-dark">
          View product
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </a>
  );
}