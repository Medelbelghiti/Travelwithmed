import Link from "next/link";
import { Mountain, Menu } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { isShopEnabled } from "@/lib/fourthwall";
import { SearchDialog } from "./search-dialog";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label={`${siteConfig.name} home`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
        <Mountain className="h-5 w-5" aria-hidden />
      </span>
      <span className="font-serif text-2xl font-semibold tracking-tight text-ink">
        {siteConfig.name}
      </span>
    </Link>
  );
}

export function Header() {
  const navItems = isShopEnabled()
    ? [...siteConfig.nav.primary, { label: "Shop", href: "/shop" }]
    : siteConfig.nav.primary;
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden lg:block" aria-label="Primary">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-light hover:text-brand-dark"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <SearchDialog />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const navItems = isShopEnabled()
    ? [...siteConfig.nav.primary, { label: "Shop", href: "/shop" }]
    : siteConfig.nav.primary;
  return (
    <div className="lg:hidden">
      <details className="group relative">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-light hover:text-brand-dark [&::-webkit-details-marker]:hidden">
          <Menu className="h-5 w-5" aria-hidden />
          <span className="sr-only">Open menu</span>
        </summary>

        <div className="absolute right-0 top-12 max-h-[80vh] w-72 overflow-y-auto rounded-2xl border border-line bg-white p-3 shadow-xl">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-brand-light hover:text-brand-dark"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}