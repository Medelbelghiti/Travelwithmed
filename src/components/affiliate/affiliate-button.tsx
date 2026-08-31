import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AffiliateButtonProps {
  linkId: string;
  label?: string;
  placement?: string;
  variant?: "primary" | "outline" | "accent" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
  external?: boolean;
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

export function AffiliateButton({
  linkId,
  label = "Check prices",
  placement,
  variant = "primary",
  size = "md",
  className,
  external = false,
}: AffiliateButtonProps) {
  const href = `/go/${linkId}${placement ? `?placement=${encodeURIComponent(placement)}` : ""}`;
  const rel = external ? "nofollow sponsored noopener" : undefined;
  const target = external ? "_blank" : undefined;

  return (
    <Link
      href={href}
      rel={rel}
      target={target}
      className={cn(base, variants[variant], sizes[size], className)}
      aria-label={label}
    >
      {label}
      <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
    </Link>
  );
}