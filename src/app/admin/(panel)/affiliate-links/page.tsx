import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { AFFILIATE_CATEGORY_LABELS } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateLinksPage() {
  await requireUser();
  const links = await prisma.affiliateLink.findMany({
    include: { article: { select: { title: true } }, destination: { select: { name: true } } },
    orderBy: [{ active: "desc" }, { priority: "desc" }, { clickCount: "desc" }],
    take: 200,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Affiliate links</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage every affiliate link in one place. Changes apply site-wide instantly.
          </p>
        </div>
        <Link href="/admin/affiliate-links/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" aria-hidden />
          New affiliate link
        </Link>
      </div>

      {links.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <p className="text-ink-muted">
            No affiliate links yet. Add your partners to start monetizing.
          </p>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand">
                <th className="px-4 py-3 font-semibold text-ink">Product</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Partner</th>
                <th className="hidden px-4 py-3 font-semibold text-ink lg:table-cell">Category</th>
                <th className="hidden px-4 py-3 font-semibold text-ink lg:table-cell">Context</th>
                <th className="px-4 py-3 font-semibold text-ink">Clicks</th>
                <th className="px-4 py-3 font-semibold text-ink">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-ink">Edit</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="max-w-xs truncate font-medium text-ink">{link.productName}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                      {link.id.slice(0, 8)}…
                      {link.featuredDeal && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent-dark">deal</span>
                      )}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">{link.partnerName}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-xs text-ink-muted">{AFFILIATE_CATEGORY_LABELS[link.category]}</span>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {link.destination?.name ?? link.destinationText ?? (link.article ? `Article: ${link.article.title.slice(0, 24)}…` : "—")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand-dark">
                      {link.clickCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${link.active ? "bg-success/10 text-success" : "bg-ink/10 text-ink-muted"}`}>
                      {link.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/affiliate-links/${link.id}`} className="inline-flex items-center gap-1 rounded-lg p-2 text-ink-muted hover:bg-sand hover:text-ink">
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}