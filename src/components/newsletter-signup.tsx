import type { ReactNode } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  benefits?: string[];
  compact?: boolean;
  variant?: "panel" | "inline";
  className?: string;
  downloadPath?: string;
  onSuccess?: () => void;
}

/**
 * Reusable newsletter signup block.
 *
 * Central wrapper around the client `NewsletterForm` (which posts to
 * `/api/newsletter` — no secrets are ever exposed to the browser). Use
 * `variant="panel"` for a large, high-converting CTA and `variant="inline"`
 * (compact) for footers and sidebars. What to say is configurable per caller
 * but defaults to the site-wide `siteConfig.newsletter` value proposition.
 */
export function NewsletterSignup({
  title,
  description,
  eyebrow,
  benefits,
  compact = false,
  variant = "panel",
  className,
  downloadPath,
  onSuccess,
}: NewsletterSignupProps) {
  const cfg = siteConfig.newsletter;
  const showBenefits = (benefits ?? cfg.benefits).length > 0;

  if (variant === "inline") {
    return (
      <div className={cn("rounded-2xl border border-line bg-white p-6 shadow-sm", className)}>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
        )}
        <h3 className="font-serif text-lg font-semibold text-ink leading-snug">
          {title ?? cfg.title}
        </h3>
        {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
        <div className="mt-4">
          <NewsletterForm
            variant="compact"
            downloadPath={downloadPath}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Newsletter signup" className={cn("rounded-3xl bg-brand-dark p-8 text-white md:p-10", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <Mail className="h-4 w-4" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 className="text-white">{title ?? cfg.title}</h2>
        <p className="mt-3 text-white/75 text-lg">
          {description ?? cfg.description}
        </p>

        {showBenefits && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-1">
            {(benefits ?? cfg.benefits).map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-white/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 max-w-md">
          <NewsletterForm
            variant={compact ? "compact" : "full"}
            downloadPath={downloadPath}
            onSuccess={onSuccess}
          />
          <p className="mt-3 text-xs text-white/50">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
