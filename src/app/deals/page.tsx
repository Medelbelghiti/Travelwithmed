import Link from "next/link";
import { BadgePercent, CalendarDays, ArrowRight, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildMetadata, itemListSchema } from "@/lib/seo";
import { AFFILIATE_CATEGORY_LABELS } from "@/lib/affiliate";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { SectionHeading } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Today's Travel Deals & Promo Codes",
  description:
    "Hand-picked travel deals: hotel member prices, flight searches, tours, eSIM plans and more. Updated regularly by the Riversmag editors.",
  canonicalPath: "/deals",
});

export default async function DealsPage() {
  const all = await prisma.affiliateLink.findMany({
    where: { active: true, OR: [{ dealTitle: { not: null } }, { featuredDeal: true }] },
    orderBy: [{ featuredDeal: "desc" }, { priority: "desc" }, { clickCount: "desc" }],
    take: 30,
  });

  const now = new Date();
  const live = all.filter((l) => !l.dealExpiresAt || l.dealExpiresAt > now);
  const featured = live.filter((l) => l.featuredDeal);
  const secondary = live.filter((l) => !l.featuredDeal);

  return (
    <main className="container-x section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-sm font-semibold text-accent-dark">
          <BadgePercent className="h-4 w-4" aria-hidden />
          Updated by the editors
        </div>
        <h1 className="text-4xl md:text-5xl">Travel deals worth your time</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Every deal below is checked by our team for value and availability. When you book through our links
          we may earn a commission — at no extra cost to you.
        </p>
      </div>

      <div className="mt-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              itemListSchema(
                live.map((d) => ({ name: d.dealTitle ?? d.productName, url: `/deals#${d.id}` })),
              ),
            ),
          }}
        />
      </div>

      {live.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
          <Tags className="mx-auto h-8 w-8 text-ink-muted" aria-hidden />
          <p className="mt-3 font-medium text-ink">No active deals right now</p>
          <p className="mt-1 text-sm text-ink-muted">
            New offers land regularly — check back soon, or browse our guides in the meantime.
          </p>
          <Link
            href="/guides"
            className="mt-5 inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark"
          >
            Browse travel guides <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section>
              <SectionHeading eyebrow="Featured" title="Our top picks right now" align="center" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((deal) => (
                  <DealCard key={deal.id} deal={deal} featured />
                ))}
              </div>
            </section>
          )}

          {secondary.length > 0 && (
            <section className="mt-14">
              <SectionHeading eyebrow="More ways to save" title="Also worth a look" align="center" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {secondary.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 rounded-2xl border border-line bg-sand p-6 text-center">
            <p className="text-sm text-ink-soft">
              Don&apos;t see what you need? Use our{" "}
              <Link href="/trip-planner" className="font-semibold text-brand hover:text-brand-dark">
                trip planner
              </Link>{" "}
              to build a trip, or{" "}
              <Link href="/resources" className="font-semibold text-brand hover:text-brand-dark">
                browse travel resources
              </Link>{" "}
              for insurance, eSIMs and more.
            </p>
          </div>

          <div className="mt-12">
            <AffiliateDisclosure />
          </div>
        </>
      )}
    </main>
  );
}

function DealCard({
  deal,
  featured = false,
}: {
  deal: Awaited<ReturnType<typeof prisma.affiliateLink.findMany>>[number];
  featured?: boolean;
}) {
  const cta = `Check ${AFFILIATE_CATEGORY_LABELS[deal.category].toLowerCase()} offers`;
  return (
    <article
      id={deal.id}
      className={`flex flex-col rounded-2xl border border-line bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md ${
        featured ? "border-accent/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">{deal.partnerName}</p>
          <h3 className="mt-1 font-serif text-lg font-semibold leading-snug text-ink">
            {deal.dealTitle ?? deal.productName}
          </h3>
        </div>
        <span className="shrink-0 rounded-lg bg-brand-light px-2 py-1 text-xs font-semibold text-brand-dark">
          {AFFILIATE_CATEGORY_LABELS[deal.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {deal.productName !== deal.dealTitle && (
          <p className="text-sm text-ink-soft">{deal.productName}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {deal.promoCode && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand px-3 py-1 font-mono font-semibold text-brand">
              <Tags className="h-3.5 w-3.5" aria-hidden />
              {deal.promoCode}
            </span>
          )}
          {deal.dealExpiresAt && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Ends {formatDate(deal.dealExpiresAt)}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 pt-0">
        <Link
          href={`/out/${deal.id}?placement=deals`}
          rel="nofollow sponsored"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          {cta} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}