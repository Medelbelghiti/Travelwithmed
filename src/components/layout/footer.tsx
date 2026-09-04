import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { isShopEnabled } from "@/lib/fourthwall";
import { Logo } from "./header";
import { NewsletterSignup } from "@/components/newsletter-signup";

export function Footer() {
  const { footer } = siteConfig.nav;
  const plan = isShopEnabled() ? [{ label: "Shop Travel Prints", href: "/shop" }, ...footer.plan] : footer.plan;
  const columns = [
    { title: "Explore", links: footer.explore },
    { title: "Plan Your Trip", links: plan },
    { title: "Resources", links: footer.resources },
    { title: "Company", links: footer.company },
  ];

  return (
    <footer className="mt-auto border-t border-line bg-sand">
      <div className="container-x py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              {siteConfig.description}
            </p>
            <p className="mt-2 max-w-sm text-sm font-medium text-brand-dark">{siteConfig.tagline}</p>

            <div className="mt-6">
              <NewsletterSignup
                variant="inline"
                eyebrow="The newsletter"
                title="Practical tips, guides & deals"
                description="One useful email a week — destination guides, packing hacks and editor-picked travel deals."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-ink-soft transition-colors hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-ink-muted">
            {siteConfig.name} participates in affiliate programs and may earn a commission on qualifying
            bookings and purchases made through links on this site, at no additional cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}