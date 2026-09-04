import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Seeds eSIM providers and their plans.
 *
 * IMPORTANT: prices, coverage and data allowances change frequently. The rows
 * below use publicly marketed plan names and broadly correct figures, but they
 * MUST be re-verified (and `lastVerifiedAt` refreshed) in the admin before they
 * are relied on for a live page. The `lastVerifiedAt` values here are set in the
 * past on purpose so the UI clearly signals that they need re-checking.
 */

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type PlanSeed = {
  name: string;
  type: "GLOBAL" | "REGIONAL" | "COUNTRY";
  coverage: string;
  dataAmount: string;
  validity: string;
  price: string;
  priceCurrency?: string;
  supports5g: boolean;
  hotspot: boolean;
  bestFor: string;
};

type ProviderSeed = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
  plans: PlanSeed[];
};

// lastVerifiedAt is intentionally in the past: these figures must be re-checked.
const LAST_VERIFIED = new Date("2026-08-01T00:00:00Z");

const PROVIDERS: ProviderSeed[] = [
  {
    name: "Airalo",
    slug: "airalo",
    tagline: "Global eSIM store with country, regional and global plans",
    description:
      "Airalo is one of the most widely used travel eSIM brands, offering plans for 200+ countries and regions plus global multi-country options. Plans are bought in-app or on the website and installed via QR code.",
    pros: ["Huge choice of country, regional and global plans", "Easy app install with QR code", "Frequent promos and referral credits"],
    cons: ["Support is by chat and can be slow during peak travel", "Data-only on many plans (no local number)"],
    plans: [
      { name: "Discover Global", type: "GLOBAL", coverage: "124+ countries", dataAmount: "1 GB", validity: "7 days", price: "4.50", supports5g: true, hotspot: true, bestFor: "Short multi-country trips" },
      { name: "Discover Global", type: "GLOBAL", coverage: "124+ countries", dataAmount: "3 GB", validity: "30 days", price: "9.50", supports5g: true, hotspot: true, bestFor: "Multi-country getaways" },
      { name: "Eurolink", type: "REGIONAL", coverage: "39 European countries", dataAmount: "1 GB", validity: "7 days", price: "4.00", supports5g: true, hotspot: true, bestFor: "Europe rail or road trips" },
    ],
  },
  {
    name: "Holafly",
    slug: "holafly",
    tagline: "Unlimited-data eSIMs backed by 24/7 support",
    description:
      "Holafly specialises in unlimited-data eSIM plans for a huge list of countries and regions, popular with travellers who stream, navigate and post on the go.",
    pros: ["Unlimited data on most plans", "24/7 human support", "Simple QR install"],
    cons: ["Unlimited plans often throttle after a fair-use amount", "Fewer cheap low-data tiers"],
    plans: [
      { name: "Global Unlimited", type: "GLOBAL", coverage: "60+ countries", dataAmount: "Unlimited", validity: "15 days", price: "47.00", supports5g: true, hotspot: true, bestFor: "Heavy users across borders" },
      { name: "Europ Unlimited", type: "REGIONAL", coverage: "32 European countries", dataAmount: "Unlimited", validity: "10 days", price: "27.00", supports5g: true, hotspot: true, bestFor: "Unlimited data across Europe" },
    ],
  },
  {
    name: "Airalo Japan",
    slug: "airalo-japan",
    tagline: "Country-specific eSIM for Japan",
    description:
      "A dedicated Japan eSIM line from Airalo covering the whole country with data-only plans sized for short and long stays.",
    pros: ["Reliable NTT Docomo network coverage", "Simple app install", "Good value for longer stays"],
    cons: ["Data-only; no local phone number", "Hotspot support depends on device"],
    plans: [
      { name: "Moshi Moshi", type: "COUNTRY", coverage: "Japan", dataAmount: "1 GB", validity: "7 days", price: "4.50", supports5g: true, hotspot: true, bestFor: "Short Japan stays" },
      { name: "Moshi Moshi", type: "COUNTRY", coverage: "Japan", dataAmount: "5 GB", validity: "30 days", price: "11.00", supports5g: true, hotspot: true, bestFor: "Longer Japan trips" },
    ],
  },
  {
    name: "Holafly Europe",
    slug: "holafly-europe",
    tagline: "Unlimited-data eSIM across Europe",
    description:
      "Holafly's Europe regional plan delivers unlimited data across a broad set of European countries in one easy install.",
    pros: ["Unlimited data across many countries", "24/7 support", "No daily top-ups"],
    cons: ["Fair-use throttling on truly heavy use", "Not the cheapest if you only need a little data"],
    plans: [
      { name: "Europe Unlimited", type: "REGIONAL", coverage: "32 European countries", dataAmount: "Unlimited", validity: "30 days", price: "54.00", supports5g: true, hotspot: true, bestFor: "Unlimited Europe data" },
    ],
  },
];

function jsonOrUndefined(v: string[] | null): Prisma.InputJsonValue | undefined {
  return v && v.length ? v : undefined;
}

async function main() {
  // Find the global Airalo affiliate link to attach providers to, if available.
  const airaloLinks = await prisma.affiliateLink.findMany({
    where: { category: "ESIM", partnerName: "Airalo" },
    select: { id: true, destinationId: true },
  });

  let providerCount = 0;
  let planCount = 0;

  for (const p of PROVIDERS) {
    // For country/regional providers, prefer the affiliate link scoped to that
    // provider; otherwise fall back to the first generic Airalo ESIM link.
    const providerLink = airaloLinks.find((l) => !l.destinationId) ?? airaloLinks[0];

    const provider = await prisma.esimProvider.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        pros: jsonOrUndefined(p.pros),
        cons: jsonOrUndefined(p.cons),
        affiliateLinkId: providerLink?.id ?? null,
        lastVerifiedAt: LAST_VERIFIED,
        isActive: true,
      },
      create: {
        name: p.name,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        pros: jsonOrUndefined(p.pros) ?? [],
        cons: jsonOrUndefined(p.cons) ?? [],
        affiliateLinkId: providerLink?.id ?? null,
        lastVerifiedAt: LAST_VERIFIED,
        isActive: true,
        sortOrder: 0,
      },
    });
    providerCount++;

    for (const [i, plan] of p.plans.entries()) {
      await prisma.esimPlan.upsert({
        where: { id: `${provider.id}-${i}` },
        update: {
          providerId: provider.id,
          name: plan.name,
          type: plan.type,
          coverage: plan.coverage,
          dataAmount: plan.dataAmount,
          validity: plan.validity,
          price: plan.price,
          priceCurrency: plan.priceCurrency ?? "USD",
          supports5g: plan.supports5g,
          hotspot: plan.hotspot,
          bestFor: plan.bestFor,
          lastVerifiedAt: LAST_VERIFIED,
          isActive: true,
        },
        create: {
          id: `${provider.id}-${i}`,
          providerId: provider.id,
          name: plan.name,
          type: plan.type,
          coverage: plan.coverage,
          dataAmount: plan.dataAmount,
          validity: plan.validity,
          price: plan.price,
          priceCurrency: plan.priceCurrency ?? "USD",
          supports5g: plan.supports5g,
          hotspot: plan.hotspot,
          bestFor: plan.bestFor,
          lastVerifiedAt: LAST_VERIFIED,
          isActive: true,
          sortOrder: i,
        },
      });
      planCount++;
    }
  }

  console.log(`eSIM providers: ${providerCount}, plans: ${planCount}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
