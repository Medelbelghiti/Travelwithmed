/**
 * Confirmed Travelpayouts affiliate programs for Riversmag.
 *
 * These 11 URLs are the exact affiliate links supplied by the site owner
 * (TP.media deep links). They are PUBLIC affiliate links — no tokens, API
 * keys or other secrets live in this module and none are ever required for
 * these links. Keep every URL below verbatim: the marker=776824 and
 * trs=573241 tracking parameters must never be altered.
 *
 * The `AffiliateLink` database model remains the source of truth for the
 * DB-managed affiliate links resolved through `/out/[id]`. This module is the
 * single source of truth for these fixed, confirmed Travelpayouts links and
 * is consumed by the reusable CTA components under `components/affiliate`.
 */

export type TravelpayoutsCategory =
  | "FLIGHTS"
  | "ACTIVITIES"
  | "ESIM"
  | "AIRPORT_TRANSFERS"
  | "CAR_RENTAL";

export interface TravelpayoutsProgram {
  id: string;
  name: string;
  category: TravelpayoutsCategory;
  /** Exact link supplied by the site owner — do not modify. */
  affiliateUrl: string;
  campaignId: number;
  marker: number;
  productId: number;
  trs: number;
  ctaLabel: string;
}

export const TRAVELPAYOUTS_PROGRAMS: TravelpayoutsProgram[] = [
  {
    id: "aviasales",
    name: "Aviasales",
    category: "FLIGHTS",
    affiliateUrl:
      "https://tp.media/r?campaign_id=100&marker=776824&p=4114&trs=573241&u=https%3A%2F%2Faviasales.com",
    campaignId: 100,
    marker: 776824,
    productId: 4114,
    trs: 573241,
    ctaLabel: "Search flights on Aviasales",
  },
  {
    id: "klook",
    name: "Klook",
    category: "ACTIVITIES",
    affiliateUrl:
      "https://tp.media/r?campaign_id=137&marker=776824&p=4110&trs=573241&u=https%3A%2F%2Fklook.com",
    campaignId: 137,
    marker: 776824,
    productId: 4110,
    trs: 573241,
    ctaLabel: "Find tours on Klook",
  },
  {
    id: "tiqets",
    name: "Tiqets",
    category: "ACTIVITIES",
    affiliateUrl:
      "https://tp.media/r?campaign_id=89&marker=776824&p=2074&trs=573241&u=https%3A%2F%2Ftiqets.com",
    campaignId: 89,
    marker: 776824,
    productId: 2074,
    trs: 573241,
    ctaLabel: "Book tickets on Tiqets",
  },
  {
    id: "gocity",
    name: "Go City",
    category: "ACTIVITIES",
    affiliateUrl:
      "https://tp.media/r?campaign_id=62&marker=776824&p=1942&trs=573241&u=https%3A%2F%2Fgocity.com",
    campaignId: 62,
    marker: 776824,
    productId: 1942,
    trs: 573241,
    ctaLabel: "Save with Go City pass",
  },
  {
    id: "yesim",
    name: "Yesim",
    category: "ESIM",
    affiliateUrl:
      "https://tp.media/r?campaign_id=224&marker=776824&p=5998&trs=573241&u=https%3A%2F%2Fyesim.tech",
    campaignId: 224,
    marker: 776824,
    productId: 5998,
    trs: 573241,
    ctaLabel: "Get a Yesim eSIM",
  },
  {
    id: "airalo",
    name: "Airalo",
    category: "ESIM",
    affiliateUrl:
      "https://tp.media/r?campaign_id=541&marker=776824&p=8310&trs=573241&u=https%3A%2F%2Fairalo.com",
    campaignId: 541,
    marker: 776824,
    productId: 8310,
    trs: 573241,
    ctaLabel: "Get an Airalo eSIM",
  },
  {
    id: "kiwitaxi",
    name: "Kiwitaxi",
    category: "AIRPORT_TRANSFERS",
    affiliateUrl:
      "https://tp.media/r?campaign_id=1&marker=776824&p=647&trs=573241&u=https%3A%2F%2Fkiwitaxi.com",
    campaignId: 1,
    marker: 776824,
    productId: 647,
    trs: 573241,
    ctaLabel: "Book an airport transfer",
  },
  {
    id: "welcome-pickups",
    name: "Welcome Pickups",
    category: "AIRPORT_TRANSFERS",
    affiliateUrl:
      "https://tp.media/r?campaign_id=627&marker=776824&p=8919&trs=573241&u=https%3A%2F%2Fwelcomepickups.com",
    campaignId: 627,
    marker: 776824,
    productId: 8919,
    trs: 573241,
    ctaLabel: "Book a Welcome Pickups transfer",
  },
  {
    id: "gettransfer",
    name: "GetTransfer",
    category: "AIRPORT_TRANSFERS",
    affiliateUrl:
      "https://tp.media/r?campaign_id=147&marker=776824&p=4439&trs=573241&u=https%3A%2F%2Fgettransfer.com",
    campaignId: 147,
    marker: 776824,
    productId: 4439,
    trs: 573241,
    ctaLabel: "Compare transfers on GetTransfer",
  },
  {
    id: "localrent",
    name: "Localrent",
    category: "CAR_RENTAL",
    affiliateUrl:
      "https://tp.media/r?campaign_id=87&marker=776824&p=2043&trs=573241&u=https%3A%2F%2Flocalrent.com%2Fen",
    campaignId: 87,
    marker: 776824,
    productId: 2043,
    trs: 573241,
    ctaLabel: "Rent a car with Localrent",
  },
  {
    id: "getrentacar",
    name: "GetRentacar",
    category: "CAR_RENTAL",
    affiliateUrl:
      "https://tp.media/r?campaign_id=222&marker=776824&p=5996&trs=573241&u=https%3A%2F%2Fgetrentacar.com",
    campaignId: 222,
    marker: 776824,
    productId: 5996,
    trs: 573241,
    ctaLabel: "Compare cars on GetRentacar",
  },
] as const;

export function getTravelpayoutsProgram(id: string): TravelpayoutsProgram | undefined {
  return TRAVELPAYOUTS_PROGRAMS.find((p) => p.id === id);
}

export function getTravelpayoutsProgramsByCategory(
  category: TravelpayoutsCategory,
): TravelpayoutsProgram[] {
  return TRAVELPAYOUTS_PROGRAMS.filter((p) => p.category === category);
}