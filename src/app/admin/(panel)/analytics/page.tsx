import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import { buildClickReport, parsePeriod, periodWindow, PERIODS, type LinkInfo, type Ranked } from "@/lib/click-report";

export const dynamic = "force-dynamic";

// Upper bound on rows aggregated in memory; far above current volume.
const MAX_ROWS = 50_000;

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function RankedList({ title, rows, empty, hint }: { title: string; rows: Ranked[]; empty: string; hint?: string }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-muted">{empty}</p>
        ) : (
          rows.map((r) => (
            <div key={r.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="line-clamp-1 font-medium text-ink">{r.key}</span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {r.count.toLocaleString()} · {Math.round(r.share * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-sand">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(2, r.share * 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  await requireUser();
  const days = parsePeriod((await searchParams).days);
  const { since, previousSince } = periodWindow(days);

  const [rows, previousCount, subscriberTotal, subscriberNew, recentClicks] = await Promise.all([
    prisma.affiliateClick.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, referrer: true, placement: true, affiliateLinkId: true },
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
    }),
    prisma.affiliateClick.count({ where: { createdAt: { gte: previousSince, lt: since } } }),
    prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
    prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED", createdAt: { gte: since } } }),
    prisma.affiliateClick.findMany({
      orderBy: { createdAt: "desc" },
      include: { affiliateLink: { select: { partnerName: true, productName: true, category: true } } },
      take: 15,
    }),
  ]);

  const linkIds = [...new Set(rows.map((r) => r.affiliateLinkId))];
  const linkRows = linkIds.length
    ? await prisma.affiliateLink.findMany({
        where: { id: { in: linkIds } },
        select: { id: true, partnerName: true, category: true },
      })
    : [];
  const links = new Map<string, LinkInfo>(linkRows.map((l) => [l.id, { partnerName: l.partnerName, category: l.category }]));
  const report = buildClickReport(rows, links, new URL(siteConfig.url).hostname, days);

  const trend =
    previousCount > 0
      ? `${report.total >= previousCount ? "+" : ""}${Math.round(((report.total - previousCount) / previousCount) * 100)}% vs previous ${days} days`
      : `previous ${days} days: ${previousCount}`;
  const maxDaily = Math.max(1, ...report.daily.map((d) => d.count));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Revenue analytics</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Affiliate clicks by partner, placement and page. Commissions themselves live in each partner dashboard;
            page views live in Plausible / Google Analytics.
          </p>
        </div>
        <nav aria-label="Period" className="flex gap-1 rounded-full border border-line bg-white p-1">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?days=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${p === days ? "bg-brand text-white" : "text-ink-soft hover:bg-sand"}`}
            >
              {p} days
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Affiliate clicks" value={report.total.toLocaleString()} hint={trend} />
        <StatCard label="Clicks per day" value={(report.total / days).toFixed(1)} hint={`average over ${days} days`} />
        <StatCard label="New subscribers" value={subscriberNew.toLocaleString()} hint={`last ${days} days`} />
        <StatCard label="Active subscribers" value={subscriberTotal.toLocaleString()} hint="all time" />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold text-ink">Clicks per day</h2>
        <div className="mt-4 flex h-32 items-end gap-px" role="img" aria-label={`Daily affiliate clicks over the last ${days} days`}>
          {report.daily.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.count}`}
              className="flex-1 rounded-t bg-brand/80"
              style={{ height: `${d.count === 0 ? 1 : Math.max(4, (d.count / maxDaily) * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-muted">
          <span>{report.daily[0]?.day}</span>
          <span>{report.daily[report.daily.length - 1]?.day}</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RankedList title="Clicks by partner" rows={report.byPartner} empty="No clicks in this period." />
        <RankedList title="Clicks by category" rows={report.byCategory} empty="No clicks in this period." />
        <RankedList
          title="Top pages by clicks"
          rows={report.byPage}
          empty="No clicks in this period."
          hint="The page the reader was on when they clicked. Pages with traffic but few clicks need better CTAs."
        />
        <RankedList
          title="Clicks by placement"
          rows={report.byPlacement}
          empty="No clicks in this period."
          hint="Which CTA format earns clicks: put more of the winners on more pages."
        />

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:col-span-2">
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
                      {c.affiliateLink?.category.toLowerCase() ?? "—"} · {c.placement ?? "—"} · {c.deviceType ?? "web"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">{c.createdAt.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
