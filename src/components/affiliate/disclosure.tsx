import { cn } from "@/lib/utils";

export function AffiliateDisclosure({ className, short = false }: { className?: string; short?: boolean }) {
  return (
    <p
      className={cn(
        "text-xs leading-relaxed text-ink-muted border border-line rounded-xl bg-sand px-4 py-3",
        className,
      )}
    >
      {short
        ? "As an affiliate partner we may earn a commission if you book through links on this page â€” at no extra cost to you."
        : "Riversmag may earn a commission when you book through the links on this page, at no extra cost to you. This helps keep our guides free. We only recommend products and services we genuinely believe in."}
    </p>
  );
}