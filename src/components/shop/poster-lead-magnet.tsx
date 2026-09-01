"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Download, Sparkles } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

export type PosterProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  priceLabel: string | null;
  url: string;
  soldOut: boolean;
  description: string | null;
};

export function PosterLeadMagnet({
  query,
  downloadPath,
  products,
}: {
  query: string;
  downloadPath: string;
  products: PosterProduct[];
}) {
  const [unlocked, setUnlocked] = useState(false);

  const place = query.trim() || "your destination";

  return (
    <div className="my-8 overflow-hidden rounded-3xl border border-line bg-brand-dark text-white">
      <div className="grid lg:grid-cols-2">
        <div className="p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Free {place} poster
          </div>
          <h2 className="mt-4 text-2xl md:text-3xl">Get the free {place} travel poster</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Drop your email and download the print-ready {place} poster for free — plus, if you love it, grab the
            framed print version below.
          </p>

          {!unlocked ? (
            <div className="mt-6 max-w-md">
              <NewsletterForm
                variant="lead"
                downloadPath={downloadPath}
                onSuccess={() => setUnlocked(true)}
              />
            </div>
          ) : (
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-sm text-white/85">
              <Download className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
              <span>
                <strong className="font-semibold text-white">It’s on its way!</strong> Use the{" "}
                <a href={downloadPath} className="font-semibold underline">
                  download link
                </a>{" "}
                above to save your free {place} poster. Scroll for the printed version.
              </span>
            </div>
          )}
        </div>

        {unlocked && products.length > 0 && (
          <div className="border-t border-white/10 bg-sand/10 p-8 md:p-10 lg:border-l lg:border-t-0">
            <h3 className="text-lg font-semibold text-white">Want the printed version?</h3>
            <p className="mt-1 text-sm text-white/70">
              Made to order, shipped worldwide — a piece of {place} without the jet lag.
            </p>
            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <a
                  key={product.id}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl bg-white p-3 text-ink transition-colors hover:bg-white/95"
                >
                  {product.imageUrl ? (
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-lg bg-sand text-xs text-ink-muted">
                      Print
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{product.name}</p>
                    {product.description && (
                      <p className="truncate text-xs text-ink-muted">{product.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {product.priceLabel && (
                      <span className="font-semibold text-brand-dark">{product.priceLabel}</span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}