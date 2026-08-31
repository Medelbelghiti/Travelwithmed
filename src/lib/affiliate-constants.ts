export const AFFILIATE_CTA_LABELS = {
  HOTELS: "Compare hotels",
  FLIGHTS: "Check flight prices",
  ACTIVITIES: "See available tours",
  CAR_RENTAL: "Compare car rentals",
  INSURANCE: "Get travel insurance",
  ESIM: "Compare eSIM plans",
  TRAVEL_GEAR: "View today's deals",
  AIRPORT_TRANSFERS: "Book airport transfer",
  TRAVEL_CARDS: "Compare travel cards",
  OTHER: "Check prices",
} as const;

export type AffiliateCategoryKey = keyof typeof AFFILIATE_CTA_LABELS;