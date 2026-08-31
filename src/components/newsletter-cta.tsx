import { NewsletterForm } from "@/components/newsletter-form";

export function NewsletterCta({
  title = "Planning a trip? Get it right",
  description = "Join the Roamora newsletter for destination guides, packing hacks and editor-picked travel deals in your inbox. No spam, unsubscribe anytime.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section aria-label="Newsletter signup" className="mt-12 rounded-3xl bg-brand-dark p-8 text-white md:p-10">
      <div className="max-w-2xl">
        <h2 className="text-white">{title}</h2>
        <p className="mt-3 text-white/75">{description}</p>
        <div className="mt-6 max-w-md">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}