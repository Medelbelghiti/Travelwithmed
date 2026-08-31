import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveDestinationAction } from "@/lib/actions/destination";
import type { DestinationType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDestinationEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const isNew = id === "new";

  const [destination, parents] = await Promise.all([
    isNew ? null : prisma.destination.findUnique({ where: { id } }),
    prisma.destination.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }], take: 300 }),
  ]);

  if (!isNew && !destination) return <p className="text-ink-muted">Destination not found.</p>;

  const d = destination;
  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand";
  const L = "mb-1.5 block text-sm font-medium text-ink-soft";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/destinations" className="rounded-xl p-2 text-ink-muted hover:bg-sand" aria-label="Back">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {isNew ? "New destination" : `Edit ${destination?.name}`}
        </h1>
      </div>

      <form action={async (fd: FormData) => { await saveDestinationAction(undefined, fd) }} className="mt-6 space-y-6">
        <input type="hidden" name="id" value={isNew ? "" : id} />

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dest-name" className={L}>Name</label>
              <input id="dest-name" name="name" required defaultValue={d?.name ?? ""} className={inputClass} placeholder="Marrakech" />
            </div>
            <div>
              <label htmlFor="dest-slug" className={L}>Slug (optional)</label>
              <input id="dest-slug" name="slug" defaultValue={d?.slug ?? ""} className={inputClass} placeholder="auto-generated" />
            </div>
            <div>
              <label htmlFor="dest-type" className={L}>Type</label>
              <select id="dest-type" name="type" defaultValue={d?.type ?? "CITY"} className={inputClass}>
                {(["REGION", "COUNTRY", "CITY"] as DestinationType[]).map((t) => (
                  <option key={t} value={t}>{t.toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dest-parent" className={L}>Parent</label>
              <select id="dest-parent" name="parentId" defaultValue={d?.parentId ?? ""} className={inputClass}>
                <option value="">None (top level)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === id}>{p.name} · {p.type.toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dest-tagline" className={L}>Tagline</label>
              <input id="dest-tagline" name="tagline" defaultValue={d?.tagline ?? ""} className={inputClass} placeholder="The red city at the edge of the Sahara" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dest-cover" className={L}>Cover image URL</label>
              <input id="dest-cover" name="coverImage" defaultValue={d?.coverImage ?? ""} className={inputClass} placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dest-overview" className={L}>Overview</label>
              <textarea id="dest-overview" name="overview" defaultValue={d?.overview ?? ""} rows={5} className={inputClass} />
            </div>
            <div>
              <label htmlFor="dest-currency" className={L}>Currency</label>
              <input id="dest-currency" name="currency" defaultValue={d?.currency ?? ""} className={inputClass} placeholder="MAD" />
            </div>
            <div>
              <label htmlFor="dest-language" className={L}>Language</label>
              <input id="dest-language" name="language" defaultValue={d?.language ?? ""} className={inputClass} placeholder="Arabic, French" />
            </div>
            <div>
              <label htmlFor="dest-capital" className={L}>Capital</label>
              <input id="dest-capital" name="capital" defaultValue={d?.capital ?? ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="dest-sort" className={L}>Sort order</label>
              <input id="dest-sort" name="sortOrder" type="number" defaultValue={d?.sortOrder ?? 0} className={inputClass} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Planning information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["bestTimeToVisit", "Best time to visit"],
              ["howToGetThere", "How to get there"],
              ["transportation", "Getting around"],
              ["budget", "Travel budget"],
              ["safety", "Safety"],
              ["visaInfo", "Visa information"],
              ["esimInfo", "Internet & eSIM"],
              ["timezone", "Timezone"],
            ].map(([field, label]) => (
              <div key={field}>
                <label htmlFor={`dest-${field}`} className={L}>{label}</label>
                <textarea id={`dest-${field}`} name={field} defaultValue={(d as Record<string, string | null> | null)?.[field] ?? ""} rows={3} className={inputClass} />
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark">
            <Save className="h-4 w-4" aria-hidden />
            Save destination
          </button>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <input type="checkbox" name="isActive" defaultChecked={d?.isActive ?? true} className="h-4 w-4 accent-brand" />
            Active
          </label>
        </div>
      </form>
    </div>
  );
}