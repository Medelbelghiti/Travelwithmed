import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveEsimProviderAction } from "@/lib/actions/entities";
import { EntityManager } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

export default async function AdminEsimProvidersPage() {
  await requireUser();
  const providers = await prisma.esimProvider.findMany({
    include: { _count: { select: { plans: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
  });

  return (
    <div>
      <EntityManager
        entity="esim-providers"
        title="eSIM providers"
        description="Providers and plans powering the eSIM comparison. Keep prices, coverage and validity re-verified."
        rows={providers.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sub: `${p._count.plans} plan${p._count.plans === 1 ? "" : "s"}`,
        }))}
        action={saveEsimProviderAction}
      />

      <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line bg-sand px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-ink">Manage plans</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Open a provider to edit or add its plans (coverage, data, validity, price, 5G, hotspot, best for).
          </p>
        </div>
        <ul className="divide-y divide-line">
          {providers.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-semibold text-ink">{p.name}</p>
                <p className="text-sm text-ink-muted">{p._count.plans} plan{p._count.plans === 1 ? "" : "s"}</p>
              </div>
              <Link
                href={`/admin/esim-providers/${p.id}`}
                className="inline-flex shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Manage plans
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
