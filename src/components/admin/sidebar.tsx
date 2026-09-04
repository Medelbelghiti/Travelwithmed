"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@prisma/client";
import {
  LayoutDashboard,
  FileText,
  Compass,
  Tags,
  UserCircle,
  Link2,
  BedDouble,
  Ticket,
  Package,
  Map,
  Image as ImageIcon,
  BarChart3,
  Settings,
  LogOut,
  Mountain,
  Menu,
  Signal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { section: "Content", items: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/articles", label: "Articles", icon: FileText },
    { href: "/admin/destinations", label: "Destinations", icon: Compass },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/authors", label: "Authors", icon: UserCircle },
    { href: "/admin/itineraries", label: "Itineraries", icon: Map },
  ]},
  { section: "Monetization", items: [
    { href: "/admin/affiliate-links", label: "Affiliate Links", icon: Link2 },
    { href: "/admin/hotels", label: "Hotels", icon: BedDouble },
    { href: "/admin/activities", label: "Activities", icon: Ticket },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/esim-providers", label: "eSIM Providers", icon: Signal },
  ]},
  { section: "Growth", items: [
    { href: "/admin/media", label: "Media", icon: ImageIcon },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]},
];

export function AdminSidebar({ user }: { user: Pick<User, "email" | "name" | "role"> }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
          <Mountain className="h-5 w-5 text-brand" aria-hidden />
          Riversmag
        </Link>
        <details className="relative">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-sand [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5" aria-hidden />
          </summary>
          <SidebarContent user={user} pathname={pathname} mobile />
        </details>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-white lg:block">
        <SidebarContent user={user} pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({ user, pathname, mobile }: { user: Pick<User, "email" | "name" | "role">; pathname: string; mobile?: boolean }) {
  return (
    <div className={cn("flex h-full flex-col", mobile && "w-72 rounded-2xl border border-line bg-white p-3 shadow-xl")}>
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
          <Mountain className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-serif text-lg font-semibold leading-tight text-ink">Riversmag</p>
          <p className="text-xs text-ink-muted">Admin CMS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.section} className={cn("mb-4", mobile && "mt-2")}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive ? "bg-brand-light text-brand-dark" : "text-ink-soft hover:bg-sand hover:text-ink",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark">
            {user.name?.[0] ?? user.email[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.name ?? user.email}</p>
            <p className="text-xs capitalize text-ink-muted">{user.role.toLowerCase()}</p>
          </div>
        </div>
        <form action={logoutAction} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </form>
        <Link href="/" className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-sand hover:text-ink">
          <Compass className="h-4 w-4" aria-hidden />
          View site
        </Link>
      </div>
    </div>
  );
}