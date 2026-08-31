import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone = "brand",
}: {
  children: ReactNode;
  className?: string;
  tone?: "brand" | "accent" | "neutral" | "success" | "danger";
}) {
  const tones = {
    brand: "bg-brand-light text-brand-dark",
    accent: "bg-accent/15 text-accent-dark",
    neutral: "bg-sand text-ink-soft",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}