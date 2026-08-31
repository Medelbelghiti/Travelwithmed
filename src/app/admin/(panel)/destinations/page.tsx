import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDestinationsPage() {
  await requireUser();
  const destinations = await prisma.destination.findMany({
    include: { parent: true, _count: { select: { articles: true, hotels: true, activities: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    take: 300,
  });

  const counts = (d: (typeof destinations)[number]) => ({
    articles: d._count.articles,
    hotels: d._count.hotels,
    activities: d._count.activities,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Destinations</h1>
          <p className="mt-1 text-sm text-ink-muted">Build your destination hierarchy: regions + countries + cities.</p>
        </div>
        <Link href="/admin/destinations/new" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" aria-hidden />
          New destination
        </Link>
      </div>

      {destinations.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <p className="text-ink-muted">No destinations yet.</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand">
                <th className="px-4 py-3 font-semibold text-ink">Destination</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Type</th>
                <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Parent</th>
                <th className="hidden px-4 py-3 font-semibold text-ink lg:table-cell">Content</th>
                <th className="px-4 py-3 text-right font-semibold text-ink">Edit</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-ink-muted">{d.slug}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${d.type === "REGION" ? "bg-accent/15 text-accent-dark" : d.type === "COUNTRY" ? "bg-brand-light text-brand-dark" : "bg-sand text-ink-soft"}`}>
                      {d.type.toLowerCase()}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-muted md:table-cell">{d.parent?.name ?? "—"}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-xs text-ink-muted">
                      {counts(d).articles} articles · {counts(d).hotels} hotels · {counts(d).activities} activities
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/destinations/${d.id}`} className="inline-flex items-center gap-1 rounded-lg p-2 text-ink-muted hover:bg-sand hover:text-ink">
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