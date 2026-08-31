import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { FileEdit, CalendarDays, Route } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminItinerariesPage() {
  await requireUser();
  const itineraries = await prisma.itinerary.findMany({
    orderBy: { createdAt: "desc" },
    include: { destination: true, article: { select: { id: true, title: true, status: true } } },
    take: 200,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Itineraries</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Day-by-day trip plans. Each itinerary is published through a linked article.
          </p>
        </div>
        <Link href="/admin/articles/new?type=itinerary" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          <CalendarDays className="h-4 w-4" aria-hidden />
          New itinerary
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {itineraries.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-muted">
            No itineraries yet. Create one as an article with the <span className="font-medium text-ink">type = itinerary</span>.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand">
                <th className="px-4 py-3 font-semibold text-ink">Title</th>
                <th className="px-4 py-3 font-semibold text-ink">Destination</th>
                <th className="px-4 py-3 font-semibold text-ink">Days</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Budget</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Published</th>
                <th className="px-4 py-3 text-right font-semibold text-ink">Article</th>
              </tr>
            </thead>
            <tbody>
              {itineraries.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{it.title}</td>
                  <td className="px-4 py-3 text-ink-muted">{it.destination?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{it.days}</td>
                  <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                    {it.currency} {it.totalEstimatedCost?.toLocaleString() ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${it.publishedAt ? "bg-emerald-50 text-emerald-700" : "bg-sand text-ink-muted"}`}>
                      {it.publishedAt ? "live" : "draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {it.article ? (
                      <Link href={`/admin/articles/${it.article.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-brand hover:bg-sand">
                        <FileEdit className="h-4 w-4" aria-hidden />
                        {it.article.status === "PUBLISHED" ? "Edit" : "Finish"}
                      </Link>
                    ) : (
                      <Link href={"/admin/articles/new?type=itinerary"} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-ink-muted hover:bg-sand hover:text-ink">
                        <Route className="h-4 w-4" aria-hidden />
                        Publish
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}