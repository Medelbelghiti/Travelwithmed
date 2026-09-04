import { NewsletterSignup } from "@/components/newsletter-signup";

/**
 * Backward-compatible wrapper for the article/detail-page end CTA.
 * Delegates to the reusable `NewsletterSignup` and defaults to the site-wide
 * value proposition (practical travel tips, destination guides, travel deals).
 */
export function NewsletterCta({
  title,
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <NewsletterSignup
      title={title}
      description={description}
      variant="panel"
      className={className}
    />
  );
}
