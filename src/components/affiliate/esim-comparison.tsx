import { BadgeCheck, Check, Minus, Signal, Package, Clock3, Globe2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/card";
import { AffiliateButton } from "@/components/affiliate/affiliate-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { groupPlansByType, lastVerifiedLabel, type EsimProviderWithPlans } from "@/lib/esim";

/**
 * Responsive eSIM comparison — a real data table on desktop and card stacks on
 * mobile. Every value (Provider, Coverage, Data, Validity, Price, 5G, Hotspot,
 * Best for) is pulled from the DB; nothing is invented here. CTA buttons are
 * only rendered when a plan actually has an affiliate link.
 */

const TYPE_META: Record<string, { label: string; blurb: string }> = {
  GLOBAL: {
    label: "Global eSIMs",
    blurb: "One plan that works across many countries — ideal if you're travelling to several destinations on one trip.",
  },
  REGIONAL: {
    label: "Regional eSIMs",
    blurb: "A single plan covering a whole region, such as Europe or Asia — often better value than country-by-country data.",
  },
  COUNTRY: {
    label: "Country eSIMs",
    blurb: "Dedicated plans for one destination, usually the cheapest option when you're staying put.",
  },
};

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-700">
      <Check className="h-4 w-4" aria-hidden /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-ink-muted">
      <Minus className="h-4 w-4" aria-hidden /> No
    </span>
  );
}

function PlanRow({ provider, plan }: { provider: EsimProviderWithPlans; plan: EsimProviderWithPlans["plans"][number] }) {
  const linkId = plan.affiliateLinkId ?? provider.affiliateLinkId ?? null;
  return (
    <tr className="border-t border-line">
      <td className="py-4 pr-4 align-top">
        <p className="font-semibold text-ink">{provider.name}</p>
        {plan.name && <p className="mt-0.5 text-xs text-ink-soft">{plan.name}</p>}
        {provider.lastVerifiedAt && (
          <p className="mt-1 text-[11px] text-ink-muted">{lastVerifiedLabel(provider.lastVerifiedAt)}</p>
        )}
      </td>
      <td className="py-4 pr-4 align-top text-sm text-ink-soft">{plan.coverage ?? "—"}</td>
      <td className="py-4 pr-4 align-top text-sm text-ink">{plan.dataAmount ?? "—"}</td>
      <td className="py-4 pr-4 align-top text-sm text-ink-soft">{plan.validity ?? "—"}</td>
      <td className="py-4 pr-4 align-top whitespace-nowrap text-sm font-semibold text-ink">
        {plan.price ? `${plan.priceCurrency ?? "USD"} ${plan.price}` : "—"}
      </td>
      <td className="py-4 pr-4 align-top text-sm"><YesNo value={plan.supports5g} /></td>
      <td className="py-4 pr-4 align-top text-sm"><YesNo value={plan.hotspot} /></td>
      <td className="py-4 pr-4 align-top text-sm text-ink-soft">{plan.bestFor ?? "—"}</td>
      <td className="py-4 align-top text-right">
        {linkId ? (
          <AffiliateButton
            linkId={linkId}
            label="View plan"
            placement={`esim-${provider.slug}`}
            variant="outline"
            size="sm"
            category="ESIM"
            provider={provider.name}
          />
        ) : (
          <span className="text-xs text-ink-muted">Check provider</span>
        )}
      </td>
    </tr>
  );
}

function MobilePlanCard({ provider, plan }: { provider: EsimProviderWithPlans; plan: EsimProviderWithPlans["plans"][number] }) {
  const linkId = plan.affiliateLinkId ?? provider.affiliateLinkId ?? null;
  const rows = [
    { label: "Coverage", value: plan.coverage ?? "—" },
    { label: "Data", value: plan.dataAmount ?? "—" },
    { label: "Validity", value: plan.validity ?? "—" },
    { label: "Price", value: plan.price ? `${plan.priceCurrency ?? "USD"} ${plan.price}` : "—" },
    { label: "5G", value: plan.supports5g ? "Yes" : "No" },
    { label: "Hotspot", value: plan.hotspot ? "Yes" : "No" },
    { label: "Best for", value: plan.bestFor ?? "—" },
  ];
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-ink">{provider.name}</p>
          {plan.name && <p className="mt-0.5 text-xs text-ink-soft">{plan.name}</p>}
        </div>
        {linkId && (
          <AffiliateButton linkId={linkId} label="View plan" placement={`esim-${provider.slug}`} variant="outline" size="sm" category="ESIM" provider={provider.name} />
        )}
      </div>
      <dl className="mt-4 grid gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-ink-muted">{r.label}</dt>
            <dd className="text-right font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function EsimComparison({
  providers,
  sectionEyebrow = "Compare",
}: {
  providers: EsimProviderWithPlans[];
  sectionEyebrow?: string;
}) {
  if (!providers.length) {
    return (
      <p className="rounded-2xl border border-line bg-sand px-5 py-6 text-sm text-ink-soft">
        eSIM comparison data is being updated. Please check back soon.
      </p>
    );
  }

  const buckets = groupPlansByType(providers);

  return (
    <div className="space-y-14">
      {(["GLOBAL", "REGIONAL", "COUNTRY"] as const).map((type) => {
        const meta = TYPE_META[type];
        const bucket = buckets[type];
        if (!bucket.length) return null;
        return (
          <section key={type}>
            <SectionHeading eyebrow={sectionEyebrow} title={meta.label} description={meta.blurb} />
            <div className="space-y-4">
              {bucket.map((provider) =>
                provider.plans.map((plan) => (
                  <MobilePlanCard key={plan.id} provider={provider} plan={plan} />
                )),
              )}
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-sm md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-sand text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Coverage</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Validity</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">5G</th>
                    <th className="px-4 py-3 font-semibold">Hotspot</th>
                    <th className="px-4 py-3 font-semibold">Best for</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bucket.map((provider) =>
                    provider.plans.map((plan) => (
                      <PlanRow key={plan.id} provider={provider} plan={plan} />
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <div className="md:hidden">
        <AffiliateDisclosure className="mt-8" />
      </div>
    </div>
  );
}

/** Small "signal that data changes" icon strip, reused on the hub and country pages. */
export function EsimVerifiedNote({ providers }: { providers: EsimProviderWithPlans[] }) {
  const latest = providers
    .map((p) => p.lastVerifiedAt?.getTime())
    .filter((t): t is number => Boolean(t))
    .sort((a, b) => b - a)[0];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
      <span className="inline-flex items-center gap-1.5">
        <BadgeCheck className="h-4 w-4 text-brand" aria-hidden />
        {latest ? `Prices & coverage last verified by our team ${lastVerifiedLabel(new Date(latest))?.toLowerCase()}` : "Pricing and coverage are supplied by providers and can change."}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Package className="h-4 w-4 text-brand" aria-hidden />
        Data limits shown as marketed by each provider
      </span>
    </div>
  );
}

export function EsimTypeGlyph({ type }: { type: string }) {
  const Icon = type === "GLOBAL" ? Globe2 : type === "REGIONAL" ? Signal : Clock3;
  return <Icon className="h-4 w-4 text-brand" aria-hidden />;
}
