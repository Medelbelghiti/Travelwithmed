import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-line bg-white shadow-sm",
        hover && "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10",
        align === "center" && "text-center mx-auto max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      )}
      <h2 className="text-3xl md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-ink-soft leading-relaxed text-lg">{description}</p>}
    </div>
  );
}