import { Mail, MessageSquare, Globe } from "lucide-react";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Us",
  description: "Get in touch with the Roamora editorial team.",
  canonicalPath: "/contact",
});

export default function ContactPage() {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: "Contact", href: "/contact" }])} />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="font-serif text-4xl font-semibold md:text-5xl">Contact us</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Have a question about a guide, spotted an error, or interested in working with us? We&apos;d love to
            hear from you.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href="mailto:hello@roamora.com"
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-ink">General enquiries</p>
                <p className="text-sm text-ink-muted">hello@roamora.com</p>
              </div>
            </a>

            <a
              href="mailto:editors@roamora.com"
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                <MessageSquare className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-ink">Editorial corrections</p>
                <p className="text-sm text-ink-muted">editors@roamora.com</p>
              </div>
            </a>

            <a
              href="mailto:partners@roamora.com"
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition-colors hover:border-brand"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                <Globe className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-ink">Partnerships & press</p>
                <p className="text-sm text-ink-muted">partners@roamora.com</p>
              </div>
            </a>
          </div>
        </div>

        <ContactForm />
      </div>
    </main>
  );
}