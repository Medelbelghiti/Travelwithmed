import Link from "next/link";
import {
  FileText,
  Compass,
  Link2,
  BedDouble,
  Ticket,
  Package,
  Map,
  Users,
  MousePointerClick,
  TrendingUp,
  Newspaper,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  await requireUser();

  const [
    articleCount,
    publishedCount,
    destinationCount,
    linkCount,
    linkClicks,
    hotelCount,
    activityCount,
    productCount,
    itineraryCount,
    subscribers,
    authors,
    topArticles,
    recentArticles,
    recentClicks,
    topLinks,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.destination.count(),
    prisma.affiliateLink.count(),
    prisma.affiliateClick.count(),
    prisma.hotel.count(),
    prisma.activity.count(),
    prisma.product.count(),
    prisma.itinerary.count(),
    prisma.newsletterSubscriber.count(),
    prisma.author.count(),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      include: { author: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.affiliateClick.findMany({
      include: { affiliateLink: { select: { partnerName: true, productName: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.affiliateLink.findMany({ orderBy: { clickCount: "desc" }, take: 5 }),
  ]);

  const statCards = [
    { label: "Total articles", value: articleCount, sub: `${publishedCount} published`, icon: Newspaper, href: "/admin/articles" },
    { label: "Destinations", value: destinationCount, icon: Compass, href: "/admin/destinations" },
    { label: "Affiliate links", value: linkCount, sub: `${linkClicks.toLocaleString()} total clicks`, icon: Link2, href: "/admin/affiliate-links" },
    { label: "Newsletter subscribers", value: subscribers, icon: Users, href: "/admin/settings" },
    { label: "Hotels", value: hotelCount, icon: BedDouble, href: "/admin/hotels" },
    { label: "Activities", value: activityCount, icon: Ticket, href: "/admin/activities" },
    { label: "Products", value: productCount, icon: Package, href: "/admin/products" },
    { label: "Itineraries", value: itineraryCount, icon: Map, href: "/admin/itineraries" },
    { label: "Authors", value: authors, icon: Users, href: "/admin/authors" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">An overview of your content and monetization.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card hover className="h-full p-5">
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                  <TrendingUp className="h-4 w-4 text-ink-muted/40" aria-hidden />
                </div>
                <p className="mt-4 text-3xl font-semibold text-ink">{stat.value.toLocaleString()}</p>
                <p className="text-sm font-medium text-ink-soft">{stat.label}</p>
                {stat.sub && <p className="text-xs text-ink-muted">{stat.sub}</p>}
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
            <MousePointerClick className="h-5 w-5 text-brand" aria-hidden />
            Top affiliate links by clicks
          </h2>
          <ul className="mt-4 space-y-3">
            {topLinks.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{link.productName}</p>
                  <p className="text-xs text-ink-muted">{link.partnerName} · {link.category.replace("_", " ").toLowerCase()}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-dark">
                  {link.clickCount.toLocaleString()} clicks
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
            <FileText className="h-5 w-5 text-brand" aria-hidden />
            Top articles by views
          </h2>
          <ul className="mt-4 space-y-3">
            {topArticles.map((article) => (
              <li key={article.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                <Link href={`/admin/articles/${article.id}`} className="min-w-0 truncate text-sm font-medium text-ink hover:text-brand">
                  {article.title}
                </Link>
                <span className="shrink-0 rounded-full bg-sand px-2.5 py-1 text-xs font-bold text-ink-soft">
                  {article.viewCount.toLocaleString()} views
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-serif text-xl font-semibold text-ink">Recently published</h2>
          <ul className="mt-4 space-y-3">
            {recentArticles.map((article) => (
              <li key={article.id} className="flex items-center justify-between gap-3">
                <Link href={`/admin/articles/${article.id}`} className="min-w-0 truncate text-sm font-medium text-ink hover:text-brand">
                  {article.title}
                </Link>
                <span className="shrink-0 text-xs text-ink-muted">
                  {article.publishedAt ? formatDate(article.publishedAt) : "Draft"}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-serif text-xl font-semibold text-ink">Recent affiliate clicks</h2>
          {recentClicks.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No clicks recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentClicks.map((click) => (
                <li key={click.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{click.affiliateLink.productName}</p>
                    <p className="text-xs text-ink-muted">{click.deviceType} · {click.country ?? "Unknown"} · {click.placement ?? "default"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">{formatDate(click.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}