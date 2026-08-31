import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  await requireUser();

  const [pageViewCount, clickCount, subscriberCount, clicksByLink, recentClicks, topArticleGroups, recentEvents] =
    await Promise.all([
      prisma.analyticsEvent.count({ where: { type: "pageview" } }),
      prisma.affiliateClick.count(),
      prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
      prisma.affiliateClick.groupBy({ by: ["affiliateLinkId"], _count: { id: true } }),
      prisma.affiliateClick.findMany({
        orderBy: { createdAt: "desc" },
        include: { affiliateLink: { select: { partnerName: true, productName: true, category: true } } },
        take: 15,
      }),
      prisma.affiliateClick.groupBy({
        by: ["articleId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.analyticsEvent.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    ]);

  const linkIds = clicksByLink.map((g) => g.affiliateLinkId);
  const links = linkIds.length
    ? await prisma.affiliateLink.findMany({ where: { id: { in: linkIds } }, select: { id: true, category: true } })
    : [];
  const categoryOf = new Map(links.map((l) => [l.id, l.category]));
  const clicksByCategory = clicksByLink.map((g) => ({ category: categoryOf.get(g.affiliateLinkId) ?? "OTHER", count: g._count.id }));
  const totalClicks = clicksByCategory.reduce((sum, c) => sum + c.count, 0);

  const articleIds = topArticleGroups.map((g) => g.articleId).filter(Boolean) as string[];
  const articles = articleIds.length
    ? await prisma.article.findMany({ where: { id: { in: articleIds } }, select: { id: true, title: true } })
    : [];
  const titleOf = new Map(articles.map((a) => [a.id, a.title]));
  const topArticles = topArticleGroups.map((g) => ({
    id: g.articleId,
    title: titleOf.get(g.articleId ?? "") ?? "Untitled",
    clicks: g._count.id,
  }));

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-muted">Affiliate performance and site activity — refreshed live.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Page views" value={pageViewCount.toLocaleString()} />
        <StatCard label="Affiliate clicks" value={clickCount.toLocaleString()} />
        <StatCard label="Active subscribers" value={subscriberCount.toLocaleString()} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-ink">Clicks by category</h2>
          <div className="mt-4 space-y-3">
            {clicksByCategory.length === 0 ? (
              <p className="text-sm text-ink-muted">No clicks recorded yet.</p>
            ) : (
              clicksByCategory.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{c.category.toLowerCase()}</span>
                    <span className="text-ink-muted">{c.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-sand">
                    <div className="h-2 rounded-full bg-brand" style={{ width: totalClicks ? `${(c.count / totalClicks) * 100}%` : "0%" }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-ink">Top articles by clicks</h2>
          <div className="mt-4 space-y-2">
            {topArticles.length === 0 ? (
              <p className="text-sm text-ink-muted">No article-linked clicks yet.</p>
            ) : (
              topArticles.map((a) => (
                <Link key={a.id} href={`/admin/articles/${a.id}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-sand">
                  <span className="line-clamp-1 text-sm font-medium text-ink">{a.title}</span>
                  <span className="ml-3 text-sm text-ink-muted">{a.clicks}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-ink">Recent affiliate clicks</h2>
          <div className="mt-4 space-y-3">
            {recentClicks.length === 0 ? (
              <p className="text-sm text-ink-muted">No clicks yet. Published articles and CTAs will record them here.</p>
            ) : (
              recentClicks.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-ink">
                      {c.affiliateLink ? `${c.affiliateLink.partnerName} · ${c.affiliateLink.productName}` : "Unlinked click"}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {c.affiliateLink?.category.toLowerCase() ?? "—"} · {c.deviceType ?? "web"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">{c.createdAt.toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-ink">Recent events</h2>
          <div className="mt-4 space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-ink-muted">No events recorded yet.</p>
            ) : (
              recentEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{e.type}</p>
                    <p className="truncate text-xs text-ink-muted">{e.pagePath ?? "—"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">{e.createdAt.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}