"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Mountain, Menu } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { SearchDialog } from "./search-dialog";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

export function Header({ shopEnabled }: { shopEnabled: boolean }) {
  const pathname = usePathname();
  const navItems = shopEnabled
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
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-brand/20 hover:text-white ${
                    isActive(pathname, item.href) ? "bg-brand text-white" : "text-ink-soft"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <SearchDialog />
          <MobileNav shopEnabled={shopEnabled} />
        </div>
      </div>
    </header>
  );
}

function MobileNav({ shopEnabled }: { shopEnabled: boolean }) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const navItems = shopEnabled
    ? [...siteConfig.nav.primary, { label: "Shop", href: "/shop" }]
    : siteConfig.nav.primary;

  useEffect(() => {
    detailsRef.current?.removeAttribute("open");
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <details ref={detailsRef} className="group relative">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand/20 hover:text-white [&::-webkit-details-marker]:hidden">
          <Menu className="h-5 w-5" aria-hidden />
          <span className="sr-only">Open menu</span>
        </summary>

        <div className="absolute right-0 top-12 max-h-[80vh] w-72 overflow-y-auto rounded-2xl border border-line bg-white p-3 shadow-xl">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-brand/20 hover:text-white ${
                    isActive(pathname, item.href) ? "bg-brand text-white" : "text-ink-soft"
                  }`}
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