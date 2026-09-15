import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TravelpayoutsProgram } from "@/lib/travelpayouts";

export interface TravelpayoutsLinkProps {
  program: TravelpayoutsProgram;
  label?: string;
  variant?: "primary" | "outline" | "accent" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 cursor-pointer";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
  outline: "border border-brand/30 bg-white text-brand-dark hover:bg-brand-light",
  accent: "bg-accent text-white hover:bg-accent-dark shadow-sm",
  white: "bg-white text-brand-dark hover:bg-sand shadow-sm",
};

const sizes = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-4",
};

export function TravelpayoutsLink({
  program,
  label,
  variant = "outline",
  size = "sm",
  className,
}: TravelpayoutsLinkProps) {
  const ctaLabel = label ?? program.ctaLabel;
  return (
    <a
      href={program.affiliateUrl}
      rel="noopener noreferrer sponsored"
      target="_blank"
      aria-label={ctaLabel}
      data-affiliate-category={program.category}
      data-affiliate-provider={program.name}
      data-affiliate-cta={ctaLabel}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {ctaLabel}
      <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
    </a>
  );
}