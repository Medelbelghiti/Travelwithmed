import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  saveEsimPlanAction,
  toggleEsimPlanAction,
  deleteEsimPlanAction,
} from "@/lib/actions/entities";

export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand";

function PlanFields() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Plan name</label>
          <input name="name" required className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Type</label>
          <select name="type" defaultValue="COUNTRY" className={INPUT_CLASS}>
            <option value="GLOBAL">Global</option>
            <option value="REGIONAL">Regional</option>
            <option value="COUNTRY">Country</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Coverage</label>
          <input name="coverage" placeholder="124+ countries" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Data amount</label>
          <input name="dataAmount" placeholder="3 GB" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Validity</label>
          <input name="validity" placeholder="30 days" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Price</label>
          <input name="price" placeholder="9.50" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Currency</label>
          <input name="priceCurrency" defaultValue="USD" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Affiliate link ID</label>
          <input name="affiliateLinkId" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Last verified (ISO date)</label>
          <input name="lastVerifiedAt" placeholder="2026-08-01" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Sort order</label>
          <input name="sortOrder" type="number" defaultValue="0" className={INPUT_CLASS} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-soft">Best for</label>
        <input name="bestFor" placeholder="Multi-country getaways" className={INPUT_CLASS} />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input name="supports5g" type="checkbox" className="h-4 w-4" /> Supports 5G
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input name="hotspot" type="checkbox" className="h-4 w-4" /> Hotspot allowed
        </label>
      </div>
    </>
  );
}

export default async function AdminEsimProviderPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const provider = await prisma.esimProvider.findUnique({
    where: { id },
    include: { plans: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!provider) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/esim-providers" className="rounded-xl p-2 text-ink-muted hover:bg-sand" aria-label="Back">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-ink">{provider.name}</h1>
            <p className="text-sm text-ink-muted">Manage plans and their live details.</p>
          </div>
        </div>
      </div>

      {/* Plans list */}
      <div className="mt-8 space-y-3">
        {provider.plans.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink-muted">
            No plans yet. Add the first one below.
          </p>
        )}
        {provider.plans.map((plan) => (
          <details key={plan.id} className="group rounded-2xl border border-line bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-semibold text-ink">
                  {plan.name}
                  <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-ink-muted capitalize">
                    {plan.type.toLowerCase()}
                  </span>
                  {!plan.isActive && (
                    <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">Hidden</span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {plan.dataAmount ?? "—"} · {plan.validity ?? "—"} · {plan.priceCurrency ?? "USD"} {plan.price ?? "—"}
                </p>
              </div>
              <span className="text-xs text-ink-muted group-open:hidden">Click to edit</span>
              <span className="hidden text-xs text-ink-muted group-open:inline">Editing…</span>
            </summary>
            <div className="border-t border-line p-5">
              <form action={saveEsimPlanAction} className="space-y-3">
                <input type="hidden" name="id" value={plan.id} />
                <input type="hidden" name="providerId" value={provider.id} />
                <input type="hidden" name="name" value={plan.name} />
                <input type="hidden" name="type" value={plan.type} />
                <input type="hidden" name="coverage" value={plan.coverage ?? ""} />
                <input type="hidden" name="dataAmount" value={plan.dataAmount ?? ""} />
                <input type="hidden" name="validity" value={plan.validity ?? ""} />
                <input type="hidden" name="price" value={plan.price ?? ""} />
                <input type="hidden" name="priceCurrency" value={plan.priceCurrency ?? "USD"} />
                <input type="hidden" name="bestFor" value={plan.bestFor ?? ""} />
                <input type="hidden" name="affiliateLinkId" value={plan.affiliateLinkId ?? ""} />
                <input type="hidden" name="lastVerifiedAt" value={plan.lastVerifiedAt ? plan.lastVerifiedAt.toISOString() : ""} />
                <input type="hidden" name="sortOrder" value={String(plan.sortOrder)} />
                <input type="hidden" name="supports5g" value={plan.supports5g ? "on" : "off"} />
                <input type="hidden" name="hotspot" value={plan.hotspot ? "on" : "off"} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Coverage</p>
                    <p className="text-sm font-medium text-ink">{plan.coverage ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Data</p>
                    <p className="text-sm font-medium text-ink">{plan.dataAmount ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Validity / Price</p>
                    <p className="text-sm font-medium text-ink">
                      {plan.validity ?? "—"} · {plan.priceCurrency ?? "USD"} {plan.price ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Features</p>
                    <p className="text-sm font-medium text-ink">
                      5G: {plan.supports5g ? "Yes" : "No"} · Hotspot: {plan.hotspot ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Best for</p>
                    <p className="text-sm font-medium text-ink">{plan.bestFor ?? "—"}</p>
                  </div>
                  <div className="rounded-xl bg-sand px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Last verified</p>
                    <p className="text-sm font-medium text-ink">
                      {plan.lastVerifiedAt ? plan.lastVerifiedAt.toISOString() : "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                    <Pencil className="h-4 w-4" aria-hidden /> Save changes
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <form action={toggleEsimPlanAction}>
                  <input type="hidden" name="id" value={plan.id} />
                  <input type="hidden" name="providerId" value={provider.id} />
                  <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-sand">
                    {plan.isActive ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    {plan.isActive ? "Hide" : "Show"}
                  </button>
                </form>
                <form action={deleteEsimPlanAction}>
                  <input type="hidden" name="id" value={plan.id} />
                  <input type="hidden" name="providerId" value={provider.id} />
                  <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-danger/20 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10">
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete
                  </button>
                </form>
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* Add plan */}
      <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
          <Plus className="h-5 w-5 text-brand" aria-hidden /> Add a plan
        </h2>
        <form action={saveEsimPlanAction} className="mt-4 space-y-3">
          <input type="hidden" name="id" value="" />
          <input type="hidden" name="providerId" value={provider.id} />
          <PlanFields />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" aria-hidden /> Create plan
          </button>
        </form>
      </div>
    </div>
  );
}
