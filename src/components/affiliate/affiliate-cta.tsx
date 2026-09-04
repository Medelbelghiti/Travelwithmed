import type { ReactNode } from "react";
import { Ticket } from "lucide-react";
import { AffiliateButton } from "./affiliate-button";
import { AffiliateDisclosure } from "./disclosure";
import { cn } from "@/lib/utils";

/**
 * Reusable booking CTA block used across detail pages.
 *
 * Renders an affiliate CTA button with an optional "from" price, an icon and an
 * affiliate disclosure. Prices are only ever shown when the caller supplies a
 * real `priceRange` — nothing is ever invented here.
 */
export interface AffiliateCTAProps {
  linkId?: string | null;
  label?: string;
  placement?: string;
  priceRange?: string | null;
  variant?: "primary" | "accent";
  title?: string;
  subtitle?: string;
  disclosure?: boolean;
  className?: string;
  children?: ReactNode;
}

export function AffiliateCTA({
  linkId,
  label = "See available tours",
  placement,
  priceRange,
  variant = "accent",
  title = "Book in advance",
  subtitle = "Popular tours sell out and prices can rise closer to the date. Book ahead to secure the best rate.",
  disclosure = false,
  className,
  children,
}: AffiliateCTAProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 text-white",
        variant === "accent" ? "bg-brand-dark" : "bg-brand",
        className,
      )}
    >
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Ticket className="h-5 w-5 text-accent" aria-hidden />
        {title}
      </h3>
      {subtitle && <p className="mt-2 text-sm text-white/70">{subtitle}</p>}
      {children}

      {linkId && (
        <div className="mt-5">
          <AffiliateButton
            linkId={linkId}
            label={label}
            placement={`${placement ?? "activity"}-cta`}
            variant={variant === "accent" ? "accent" : "white"}
            size="lg"
            className="w-full sm:w-auto"
          />
        </div>
      )}

      {priceRange && (
        <p className="mt-4 text-sm text-white/70">
          From around <span className="font-semibold text-white">{priceRange}</span> per person
        </p>
      )}

      {disclosure && (
        <div className="mt-4">
          <AffiliateDisclosure short />
        </div>
      )}
    </div>
  );
}
