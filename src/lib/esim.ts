import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Loads active eSIM providers with their published plans.
 *
 * Provider/plan pricing, coverage, validity and feature data lives in the DB
 * and is editable + re-verified in the admin, so nothing is hardcoded here.
 * `lastVerifiedAt` lets the UI signal when data is likely to have changed.
 */
export type EsimProviderWithPlans = Prisma.EsimProviderGetPayload<{
  include: { affiliateLink: { select: { id: true } }; plans: true };
}>;

export async function getActiveEsimProviders({
  includeLinks = false,
  type,
}: {
  includeLinks?: boolean;
  type?: "GLOBAL" | "REGIONAL" | "COUNTRY";
} = {}): Promise<EsimProviderWithPlans[]> {
  return prisma.esimProvider.findMany({
    where: {
      isActive: true,
      ...(type ? { plans: { some: { isActive: true, type } } } : {}),
    },
    include: {
      ...(includeLinks ? { affiliateLink: { select: { id: true } } } : {}),
      plans: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Groups active plans by their coarse type for a "Best eSIMs" breakdown. */
export function groupPlansByType(providers: EsimProviderWithPlans[]) {
  const buckets = {
    GLOBAL: [] as EsimProviderWithPlans[],
    REGIONAL: [] as EsimProviderWithPlans[],
    COUNTRY: [] as EsimProviderWithPlans[],
  };
  for (const provider of providers) {
    const types = new Set(provider.plans.map((p) => p.type));
    if (types.has("GLOBAL")) buckets.GLOBAL.push(provider);
    else if (types.has("REGIONAL")) buckets.REGIONAL.push(provider);
    else buckets.COUNTRY.push(provider);
  }
  return buckets;
}

/** Human-friendly label for a validity string (kept as free text from admin). */
export function validityLabel(validity: string | null, days: number | null): string {
  if (validity) return validity;
  if (days != null) return `${days} days`;
  return "Flexible";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats a `lastVerifiedAt` date as e.g. "Verified Jan 2026". */
export function lastVerifiedLabel(date: Date | null): string | null {
  if (!date) return null;
  return `Prices & coverage verified ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** True when a plan/provider has a usable affiliate link for CTA rendering. */
export function hasCta(linkId: string | null | undefined): boolean {
  return Boolean(linkId);
}
