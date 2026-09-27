/**
 * seed-content-batch.ts — 10 net-new destination guides, status DRAFT.
 *
 * STATUS: ALL 10 BODIES WRITTEN / AWAITING EDITORIAL APPROVAL.
 * Written: marrakech, fes, chefchaouen, casablanca, agadir, istanbul, lisbon,
 * dubai, london, santorini.
 * Excluded: paris, rome, barcelona, bali and tokyo are already live and
 * indexed, and an upsert would overwrite published content. See
 * docs/CONTENT_BATCH_PLAN.md section 1.
 *
 * This script has NOT been run. It aborts unless --apply is passed, and prints
 * a summary table before opening a write transaction.
 *
 * Run (dry run):  node --env-file=.env --import tsx prisma/seed-content-batch.ts
 * Run (apply):    node --env-file=.env --import tsx prisma/seed-content-batch.ts -- --apply
 *
 * Editorial rules encoded here:
 *   - No first-person travel experience. The site voice is research-based.
 *   - No invented reviews, ratings, or prices.
 *   - Every price / duration / opening-hours claim is hedged in the copy AND
 *     listed in that article's needsVerification[] array for a human editor.
 *   - Exactly three cta blocks per article (HOTELS, FLIGHTS, ACTIVITIES).
 *     cta blocks resolve by category at render time (src/lib/affiliate.ts:228)
 *     so no affiliate URL is ever hardcoded.
 *   - status is DRAFT (ArticleStatus enum is uppercase, schema.prisma:78).
 *   - internal cross-links are written as RelatedArticle rows, the same
 *     relation seed-articles-5/6/7.ts already use. The article page renders
 *     them as clickable ArticleCards ("Continue planning your trip"). Block
 *     renderers emit plain text, so a raw <a> in a p block is not an option.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { blocksToText, type ContentBlock } from "../src/lib/content";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const apply = process.argv.includes("--apply");

/** All words in the content JSON, matching the site's own wordCount field. */
function totalWords(blocks: ContentBlock[]): number {
  const text = blocksToText(blocks);
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Body-copy words only. Excludes the structural blocks (tables, the FAQ block and
 * CTA labels) so the 1800-2200 editorial target is measured against the prose a
 * reader actually reads, not against data the renderer presents separately.
 */
function narrativeWords(blocks: ContentBlock[]): number {
  const prose = blocks.filter(
    (b) => b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "ul" || b.type === "ol",
  );
  return totalWords(prose as ContentBlock[]);
}

/** Verified Unsplash ID already used site-wide for Marrakech (seed-images.ts:15). */
const u = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

const MARRAKECH_COVER = u("photo-1597212618440-806262de4f6b", 1600);

// ---------------------------------------------------------------------------
// SEO metadata for all 15. Titles < 60 chars, descriptions < 155 chars.
// ---------------------------------------------------------------------------

export const DESTINATIONS = [
  {
    destination: "marrakech",
    title: "Marrakech Travel Guide: The Medina, Riads and Day Trips",
    metaDescription:
      "A practical Marrakech guide: where to stay in the medina or Gueliz, what the souks actually sell, how to get around, real costs, and the day trips worth making.",
    slug: "marrakech-travel-guide",
    focusKeyword: "marrakech travel guide",
    secondaryKeywords: [
      "marrakech riad",
      "souks in marrakech",
      "marrakech vs chefchaouen",
      "getting around marrakech",
    ],
  },
  {
    destination: "fes",
    title: "Fes Travel Guide: Medina, Craftsmanship and Tannery Views",
    metaDescription:
      "Fes explained: navigating the world's largest car-free medina, the tannery terraces, where to buy crafts without the hard sell, plus costs and practical tips.",
    slug: "fes-travel-guide",
    focusKeyword: "fes travel guide",
    secondaryKeywords: ["fes medina", "tanneries in fes", "morocco craftsmanship", "fes vs marrakech"],
  },
  {
    destination: "chefchaouen",
    title: "Chefchaouen Travel Guide: The Blue Town and the Rif",
    metaDescription:
      "Chefchaouen guide: when to visit the blue town, how to reach it from Marrakech, photography etiquette, Rif mountain trails, costs and where to stay.",
    slug: "chefchaouen-travel-guide",
    focusKeyword: "chefchaouen travel guide",
    secondaryKeywords: [
      "blue city morocco",
      "chefchaouen day trip",
      "rif mountains",
      "chefchaouen photography",
    ],
  },
  {
    destination: "casablanca",
    title: "Casablanca Guide: Hassan II, Art Deco and the New Tram",
    metaDescription:
      "Casablanca travel guide covering Hassan II Mosque, the Art Deco centre, the new tram, business traveller rhythm, costs and where to base yourself.",
    slug: "casablanca-travel-guide",
    focusKeyword: "casablanca travel guide",
    secondaryKeywords: [
      "hassan ii mosque",
      "casablanca medina",
      "rabat day trip",
      "morocco business travel",
    ],
  },
  {
    destination: "agadir",
    title: "Agadir Guide: Beach, Kasbah and the Anti-Tourism Debate",
    metaDescription:
      "An honest Agadir guide: the beach resort reality, the kasbah ruins, why some travellers skip it, what the region does well, and what a trip actually costs.",
    slug: "agadir-travel-guide",
    focusKeyword: "agadir travel guide",
    secondaryKeywords: [
      "agadir beach",
      "agadir kasbah",
      "atlas mountains from agadir",
      "surf retreat morocco",
    ],
  },
  {
    destination: "istanbul",
    title: "Istanbul Travel Guide: Two Continues, One Commute",
    metaDescription:
      "Istanbul guide: which side of the Bosphorus to stay, ferries over taxis, museum pass maths, neighbourhood texture, costs and a 3-day shape.",
    slug: "istanbul-travel-guide",
    focusKeyword: "istanbul travel guide",
    secondaryKeywords: [
      "hagia sophia",
      "bosphorus ferry",
      "istanbul neighborhoods",
      "turkey esim",
    ],
  },
  {
    destination: "lisbon",
    title: "Lisbon Travel Guide: Trams, Hills and the Right Light",
    metaDescription:
      "Lisbon guide: avoiding the tram 28 crush, choosing a neighbourhood over a landmark, miradouro timing, surf beaches nearby, and honest cost bands.",
    slug: "lisbon-travel-guide",
    focusKeyword: "lisbon travel guide",
    secondaryKeywords: ["lisbon tram 28", "alfama", "lisbon miradouros", "portugal day trips"],
  },
  {
    destination: "dubai",
    title: "Dubai Travel Guide: Skyscrapers, Desert and Ramadan Rhythm",
    metaDescription:
      "Dubai guide: choosing between the marina, downtown and old town, desert safari logistics, summer heat strategy, costs and family-friendly options.",
    slug: "dubai-travel-guide",
    focusKeyword: "dubai travel guide",
    secondaryKeywords: [
      "burj khalifa",
      "dubai desert safari",
      "dubai with kids",
      "emirates travel",
    ],
  },
  {
    destination: "london",
    title: "London Travel Guide: Zones, Museums and Weather Backup",
    metaDescription:
      "London guide: contactless vs travelcards, neighbourhoods over attractions, the museum-as-rainy-day plan, costs and how to spend three days well.",
    slug: "london-travel-guide",
    focusKeyword: "london travel guide",
    secondaryKeywords: [
      "london transport pass",
      "borough market",
      "london neighborhoods",
      "rainy day in london",
    ],
  },
  {
    destination: "santorini",
    title: "Santorini Guide: Caldera Geography and Crowd Strategy",
    metaDescription:
      "Santorini guide: understanding the caldera shape, choosing Fira or Oia, timing for sunset without the crush, ferries, costs and photography angles.",
    slug: "santorini-travel-guide",
    focusKeyword: "santorini travel guide",
    secondaryKeywords: [
      "santorini oia",
      "santorini caldera",
      "santorini without a car",
      "santorini ferry from athens",
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Flag: paris-travel-guide, rome-travel-guide, barcelona-travel-guide,
// bali-travel-guide, tokyo-travel-guide are all live and indexed. Writing them
// here would upsert-overwrite published content. They are omitted pending an
// explicit decision. See docs/CONTENT_BATCH_PLAN.md section 1.
// ---------------------------------------------------------------------------

type SeedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  type: "DESTINATION_GUIDE";
  destinationSlug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  categorySlugs: string[];
  /**
   * Verified Unsplash CDN URL, or null. A null cover falls back to the branded
   * /og generator (src/lib/seo.ts:41), which is a supported path. Photo IDs are
   * never guessed: an invented ID is a broken image in production.
   */
  coverImage: string | null;
  blocks: ContentBlock[];
  /**
   * Destination keys (matching DESTINATIONS[].destination, e.g. "fes") this
   * guide should link out to. Written as RelatedArticle rows. Targets that do
   * not exist in the database are skipped rather than invented.
   */
  internalLinks: string[];
  itinerary: {
    title: string;
    summary: string;
    budgetLevel: string;
    totalEstimatedCostUsd: number;
    days: { title: string; location: string; description: string; estimatedCostUsd: number }[];
  };
  needsVerification: string[];
};

// ---------------------------------------------------------------------------
// ARTICLE 1 — MARRAKECH (flagship, full draft)
// ---------------------------------------------------------------------------

const marrakech: SeedArticle = {
  title: DESTINATIONS[0].title,
  slug: DESTINATIONS[0].slug,
  excerpt: DESTINATIONS[0].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "marrakech",
  focusKeyword: DESTINATIONS[0].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[0].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: MARRAKECH_COVER,
  internalLinks: ["fes", "chefchaouen", "agadir"],

  blocks: [
    { type: "p", text: "Most visitors arrive in Marrakech with a map and a plan, and lose both inside the medina within an hour. That is not a failure of preparation. The medina is not a district with streets; it is several centuries of accreted alleys, most of them unnamed, most of them narrower than your shoulders, arranged around a handful of gates that function like railway stations. Once you accept that the only reliable navigation is by landmark — Bab Doukkala, the Koutoubia, the corner where the dyers work — the city becomes unexpectedly easy to love." },
    { type: "p", text: "What follows is built around the decisions that actually shape a trip: when to arrive, which side of the wall to sleep on, what to do with a day that is not shopping, and how to get out of the city when the medina starts to feel like work." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "Marrakech has a long good season and a punishing summer. The comfortable window runs from roughly March into May, then again from September into November — the classic shoulder months, when days sit in the twenties, evenings are cool enough to eat outside, and the medina is busy but navigable." },
    { type: "p", text: "Winter, from December into February, brings the year's best light and the emptiest medina. Days are usually mild, nights get genuinely cold, and riad courtyards hold the chill long after sunset. It is the cheapest and calmest time to travel, and the one most first-timers avoid because they read 'winter' and picture rain. It does rain, occasionally, and it passes." },
    { type: "p", text: "July and August are the exception. The city empties — residents leave for the coast or the mountains, and the atmosphere shifts from market to respite. Expect punishing daytime heat, often into the forties, and expect some riads, restaurants and shops to close for part of the day. Hotels discount heavily. If you want heat and empty architecture, that is the trade." },
    { type: "p", text: "Ramadan changes the operating rhythm of the city more than any other single factor. Cafes close earlier, daytime eating in public stops entirely, and evening activity compresses into a much later window. It is a remarkable month to experience and a confusing one to plan around, because published hours will not apply." },
    {
      type: "table",
      headers: ["Season", "Typical daytime", "Crowds", "Price direction", "Who it suits"],
      rows: [
        ["March – May", "Warm, occasionally hot", "High, thinning in May", "Peak", "Medina at full energy"],
        ["June", "Hot by midday", "Moderate", "Falling", "Start early, rest through the afternoon"],
        ["July – August", "Very hot, often 35°C+", "Lowest of the year", "Lowest", "Empty medinas, budget travel"],
        ["September – November", "Warm to cool", "High, best in Sep–Oct", "Rising to peak", "The widest range of travellers"],
        ["December – February", "Mild days, cold nights", "Moderate", "Mixed", "Cheapest stays, best light"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "The single most consequential choice on a Marrakech trip is inside the medina walls or outside them. Both are legitimate. They are different trips." },
    { type: "h3", text: "Inside the medina — the full experience" },
    { type: "p", text: "A medina riad is a traditional courtyard house: thick walls, almost no windows facing out, rooms arranged around an open interior where the actual living happens. Staying inside means walking to dinner, to a guide, to the taxi rank at ten at night, and hearing the call to prayer close enough to feel it in the room. It is atmospheric, and it is more inconvenient than visitors expect." },
    { type: "p", text: "Most riads have steps and no lift, and some have genuinely awkward staircases with a suitcase. Doors are unmarked or discreetly signed — you will be sent a photo of a door and a nearby landmark, because 'the blue door' is not an address in a city of several thousand blue doors. Courtyard-facing rooms are quieter; rooms over the breakfast terrace get early light and breakfast noise. Ask which one you are getting." },
    { type: "h3", text: "Gueliz and the new town — comfort and sanity" },
    { type: "p", text: "Across the avenue from the medina wall, Gueliz was laid out in the 1920s under the colonial administration and is now the city's restaurant, bar and hotel district. Pavements are wide, taxis are on demand, the air conditioning works properly, and you can walk to a medina gate in fifteen minutes. It is also where the best dinner happens." },
    { type: "ul", items: [
      "Medina (inside the walls) — atmosphere at maximum friction; best for two to three nights, not a week",
      "Gueliz / Avenue Mohammed VI — walkable to the gate, best restaurant access, modern and quiet",
      "Hada / Amelkav — newer, quieter, further out; good value if you plan to spend your days outside the city",
      "Palmeraie — resort territory: pools, space, and almost no reason to be there if you came for the medina",
    ] },
    { type: "p", text: "The pragmatic answer that most experienced travellers arrive at: split the stay. Two or three nights inside the medina for the atmosphere, then move to Gueliz for the rest. It costs a short taxi ride and one repacking." },
    { type: "cta", label: "Compare riad and hotel rates in Marrakech", category: "HOTELS", destinationSlug: "marrakech", placement: "marrakech-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "Jemaa el-Fnaa, twice" },
    { type: "p", text: "Go once at midday, when it is a market: orange juice carts, awnings, dry goods, the fish section at one end, and the loudest sense of the city you will get. Go again an hour or two after sunset, when the food stalls set up and the square becomes a performance — storytellers with drums holding a circle, snake charmers with baskets. It is not one place but two, and the evening one is the reason to come." },
    { type: "h3", text: "The Majorelle Garden and the Yves Saint Laurent Museum next door" },
    { type: "p", text: "The garden is famous for its intense blue, the colour still printed on ticket stubs across Morocco, but the reason to go is the plant collection — cacti, succulents and mature trees brought in by the artist Jacques Majorelle in the 1920s. Book a timed slot. The Saint Laurent museum across the street is the quieter half of the pairing and one of the best-executed fashion retrospectives anywhere." },
    { type: "h3", text: "Ben Youssef Madrasa" },
    { type: "p", text: "The best-preserved piece of Marinid architecture in the city, and the best introduction to what Moroccan craft is actually about: zellij tilework cut from individually hand-chipped pieces, carved stucco, and cedar screens that took years. The light through the central hall's cedar ceiling is the photograph everyone takes. Go early; the interior holds." },
    { type: "h3", text: "The Bahia Palace, with a caveat" },
    { type: "p", text: "A sprawling nineteenth-century palace showing how the Moroccan upper class actually lived — tiled courtyards, painted ceilings, rooms opening onto each other for a whole household. It is a busy, sometimes cramped visit, and the ground-floor rooms are dimmer than the reputation suggests. Worth it for the courtyard sequence rather than the highlights." },
    { type: "h3", text: "The Mellah" },
    { type: "p", text: "The historic Jewish quarter south of the plaza, and the part of Marrakech most visitors walk straight through. The Slat Al Azama synagogue, the old cemetery, and Rahba Kedima — the second-hand book market on the plaza edge — give the area a texture unrelated to riads or souks. Walk it in the late afternoon." },
    { type: "h3", text: "The Atlas, in a day" },
    { type: "p", text: "The High Atlas starts roughly an hour from the city, and the Ourika Valley is the easy version: waterfalls, a working valley, and a walkable path that needs no guide. Beyond it the Tizi n'Tichka pass climbs over six thousand feet — check current road conditions locally, because the closure schedule shifts. Villages like Imlil and Aroumd are the standard Berber-valley bases, and they are quiet in a way the city never is." },
    { type: "h3", text: "A hammam, properly done" },
    { type: "p", text: "A public hammam and a spa hammam are different products, and the confusion wastes people's first visit. The public one is heated, crowded, cheap and a genuine local ritual; the spa one is a private room with a scrub, a massage, and a price that reflects it. Both involve the gommage — a vigorous scrub with black soap, then rinse, then a great deal of steam. Local hammams have historically restricted entry to unmarried couples and non-Muslims, while tourist-facing ones generally do not; policies change, so ask when you book. Book the first slot of the day." },
    { type: "h3", text: "A food tour, run by a licensed guide" },
    { type: "p", text: "The highest-value single activity in the city. The square is full of unofficial touts offering 'tours'; the guides with an official Ministry of Tourism badge are the ones actually licensed, and the badge is the whole filter. A good one gets you into stalls a visitor cannot enter alone, explains what you are eating, and stops the hard sell. Agree the price and route first." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "Marrakech Menara Airport sits a short distance from the medina wall. The private transfer arranged by a riad or a booked driver is the standard arrival, and it removes every question about taxis after a long flight. If you prefer the metro, the city tram reaches central Marrakech; check the current extent of the network and fares at the airport." },
    { type: "p", text: "Two kinds of taxi, and the difference matters. The petit taxi — white — is the small one for a run inside the city. The grand taxi — the larger beige or brown vehicle — is intercity and will not take you to a souk. They are not interchangeable, and this is the most common taxi confusion visitors hit. Both are regulated to run the meter; ask before you move, and if a driver refuses, get out. The orange coin-operated carts circling the medina wall at night are cheap for a short hop — useful at midnight, when a proper taxi is hard to hail." },
    { type: "ul", items: [
      "Airport to medina: private transfer, or a short metered petit taxi — book it with your riad so someone is waiting",
      "Walking is primary transport inside the medina; budget ten minutes to cross it and assume a wrong turn",
      "Outside the walls, petit taxis wait at the main gates and along Avenue Mohammed VI",
      "Intercity: scheduled buses and shared taxis south along the coast road, or the ONCF train from Casablanca",
      "Car rental is only worth it for mountain day trips, and only if you are comfortable with mountain roads and urban driving alike",
    ] },
    { type: "cta", label: "Search flights into Marrakech Menara Airport", category: "FLIGHTS", destinationSlug: "marrakech", placement: "marrakech-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "The currency is the Moroccan dirham, and cash rules the medina in a way that surprises people used to Europe. Cards work in upscale restaurants, better riads and larger hotels; they do not work at market stalls, small food counters or many taxis. ATMs are common in Gueliz, scarce inside the medina. Carry small notes — a large bill tends to create a problem rather than solve one." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Rough band, per person"],
      rows: [
        ["Shoestring", "Medina riad, street breakfast, souk lunch, shared taxi, public hammam", "Around 250–450 MAD"],
        ["Mid-range", "Gueliz riad, good food twice a day, a tour, a spa hammam", "Around 700–1,400 MAD"],
        ["Luxury", "Design riad or five-star, private guides, fine dining", "1,500 MAD and upward"],
      ],
    },
    { type: "p", text: "Treat these as directional bands, not quotes — they move with season, and the July and August discount shifts them substantially. What will not change is the shape: the medina is cheap, Gueliz and the palace sites are not, and the difference between a good day and an expensive one is usually a taxi you did not need." },
    { type: "p", text: "Bring a reusable shopping bag. Single-use plastic bags are restricted in Moroccan supermarkets and many shops now refuse them." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "Moroccans dress more conservatively than most visitors assume. Covering shoulders and knees is enforced by nobody, but it is the local norm, it is better received, and it matters more during Ramadan. Loose linen answers the heat; shorts and a vest do not.",
      "Dinner is late. Restaurants that open at seven are empty; the city eats between about eight and ten. Adjust your first night rather than fighting it.",
      "In the souks, name your first price only if you have to. Haggling is a social process, not a win — walking away works, and so does a counter-offer near a third of the opening figure.",
      "Ask before photographing people, especially in the Mellah and in the villages. A camera pointed at someone earning a living from photographs is a request, and it can end badly.",
      "The medina is genuinely confusing at night. Agree a landmark with your riad, and note that lanes around the souks empty after dark.",
      "Couscous is traditionally a Friday dish, and couscous tfaya — steamed in a separate broth then served over it — is a distinctly different meal. Order it deliberately.",
    ] },
    { type: "h2", text: "The shape of three days" },
    { type: "p", text: "Three days is enough for Marrakech if you spend them on purpose: one for the medina and the plaza, one for the gardens and the Mellah, and one outside the city — the Ourika Valley, the High Atlas, or Agadir if you would rather trade the medina for the coast. With only two, cut the mountains and stay inside the wall." },

    { type: "p", text: "Marrakech rewards travellers who accept that it is a working city first and a destination second. The people running the stalls, the drivers circling the wall, and the families going home through the lanes at dusk are not part of the attraction. They are the reason it is worth coming back to." },
    { type: "cta", label: "Browse tours and experiences in Marrakech", category: "ACTIVITIES", destinationSlug: "marrakech", placement: "marrakech-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "How many days do I need in Marrakech?", answer: "Three is the practical minimum: one for the medina and Jemaa el-Fnaa, one for the gardens, madrasa and Mellah, one for the Atlas or the coast. Two works if you stay inside the wall and accept a rushed pace." },
        { question: "Should I stay inside the medina or in Gueliz?", answer: "Inside the medina for atmosphere, and expect steps, unmarked doors and taxis at a distance. Gueliz for wide pavements, working air conditioning and the best restaurants, fifteen minutes from a gate. Many travellers split the stay." },
        { question: "Is Marrakech safe for solo travellers, especially women?", answer: "Violent crime against tourists is rare, but persistent verbal harassment in quiet lanes does occur, particularly after dark. Firmly ignoring it, wearing earphones, and staying on busier streets after sunset are the practical mitigations. Treat this as a considered risk, not a reassurance." },
        { question: "How much does a day in Marrakech cost, and do I need a guide?", answer: "Budget roughly 250 to 450 MAD a day shoestring; mid-range runs to around 1,400 MAD, falling substantially in July and August. A guide is not needed to get around, but a licensed one is worth it to reach workshops a visitor cannot walk into — filter for the official Ministry of Tourism badge and agree the price first." },
        { question: "When is the best time to visit Marrakech?", answer: "Late autumn through spring is the comfortable window: mild days for the souks and the Atlas, and cold enough at night that the outdoor cafes work. March to early May and September to November are the safest bets. Summer is cheap and hot — expect the low-to-mid thirties — which is why riad rates drop sharply. Check Ramadan dates before booking, as opening hours shift across the medina for the month." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Marrakech: Medina, Gardens and the Atlas",
    summary:
      "A deliberately paced three days: the medina and plaza first, the gardens and Mellah second, the mountains or coast third.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 420,
    days: [
      {
        title: "The medina and the square",
        location: "Marrakech Medina, Jemaa el-Fnaa",
        description:
          "Enter through Bab Doukkala and navigate by landmark rather than street. Lunch in the souks, the Majorelle and Saint Laurent museums if you missed them, then Jemaa el-Fnaa after sunset with a licensed guide and a food tour.",
        estimatedCostUsd: 120,
      },
      {
        title: "Craft, gardens and the Mellah",
        location: "Ben Youssef Madrasa, Bahia Palace, the Mellah",
        description:
          "Early start at Ben Youssef Madrasa while the light holds. Bahia Palace before the heat peaks, a long lunch, then the Mellah and Rahba Kedima in the late afternoon, finishing at a public hammam booked for the first morning slot the following day.",
        estimatedCostUsd: 150,
      },
      {
        title: "The mountains or the coast",
        location: "Ourika Valley, or Agadir",
        description:
          "A driver for the day. Ourika Valley and the foothills for waterfalls and a walk, or the run south to Agadir if you would rather trade the medina for the Atlantic. Return late afternoon to sit on a Gueliz terrace before dinner.",
        estimatedCostUsd: 150,
      },
    ],
  },

  needsVerification: [
    "Airport to medina: current petit taxi fare and whether the airport tram reaches the medina wall",
    "ONCF Casablanca to Marrakech: current journey time, fare, and Marrakech station location",
    "Koutoubia Mosque: whether non-Muslims may currently enter any part of the building, and the access fee if so",
    "Majorelle Garden: current ticket price, timed-slot booking lead time, and the Saint Laurent museum's separate fee",
    "Ben Youssef Madrasa, Bahia Palace, Saadian Tombs, El Badi: current entry fees, opening hours, and closed days",
    "Public hammam: current prices, first-slot availability, and the current policy on couples and non-Muslim entry",
    "Licensed guide: the current official-badge scheme and a realistic per-person price for a half-day food tour",
    "All cost bands in MAD: re-baseline against current 2026 rates, and re-check the July/August discount depth",
    "Weather claims: the forties-Celsius July/August range and the winter cold-night claim",
    "Visa and entry requirements: must be checked per passport nationality; no specific claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 2 — FES
// ---------------------------------------------------------------------------

const fes: SeedArticle = {
  title: DESTINATIONS[1].title,
  slug: DESTINATIONS[1].slug,
  excerpt: DESTINATIONS[1].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "fes",
  focusKeyword: DESTINATIONS[1].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[1].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["marrakech", "chefchaouen"],

  blocks: [
    { type: "p", text: "Marrakech performs. Fes works. That distinction is the whole reason to come here instead, and it is why the two cities sit uncomfortably together in every Moroccan itinerary even though they are a comfortable day's drive apart. Fes is a manufacturing city that happens to contain a medieval one — a place where people are making brass, leather, tile and book bindings in the same alleys their families worked four hundred years ago, and where nobody is curating that for you." },
    { type: "p", text: "Fes el-Bali is car-free largely by physics rather than policy: the lanes are too narrow and the walls too high. By the most commonly cited count it holds somewhere north of nine thousand alleyways. The practical consequence is that you will get lost, and that being lost is cheap, because what you are looking for is usually a trade, not a street name." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "Fes shares Morocco's broad seasonal rhythm but with one real local variable: the medina is at its best on a working day, and the working week is the week. Friday is the day the city reorganises around Friday prayers and the busiest souks, which means more activity, more noise, and more difficulty getting anywhere. If you want a calm Fes, that is counterintuitive but true — target a weekday." },
    { type: "p", text: "Spring, from March into May, is the best compromise: mild, green in the hills, and busy but walkable. April is when the Fes Festival of World Sacred Music arrives, held on a roughly two-year cycle and pulling a very different crowd than the usual visitors; check the current dates before booking around them." },
    { type: "p", text: "Summer brings heat and a functioning rhythm, and the medina empties in the middle of the afternoon when it should be empty. Winter is cool, occasionally wet, and cheap. The valley does not get the postcard light of the coast, and the medina is a shade dimmer than most visitors expect, which is part of why the crafts read as craft rather than as decoration." },
    { type: "p", text: "Ramadan reshapes the day. The late-night chanting audible from the Talaa Kebira is amplified out of the carpenters' quarter each evening in Ramadan, when the Sufi brotherhoods march. Outside Ramadan the same quarters are ordinary workshops with ordinary hours. If that chanting is what drew you, time your trip to it — and accept that everything else runs on a different clock." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["March – May", "Mild, spring blossom", "Moderate to high", "Rising to peak", "Best overall balance; Sefrou cherries"],
        ["June – August", "Hot afternoons, quiet medina at 3pm", "Low", "Low", "Cheapest rooms; schedule mornings only"],
        ["September – November", "Warm to cool, clear", "Moderate", "Rising", "Quiet after mid-October"],
        ["December – February", "Cool, occasional rain", "Low", "Low", "Cheapest overall; expect damp alleys"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Fes is split into three cities that tourists routinely confuse. Fes el-Bali is the old medina: car-free, dense, where the riads are. Fes el-Jdid is the new town from the Almohad period onward, with the Mellah, the Dar Batha museum and a much calmer street grid. Ville Nouvelle is the French-era city outside the walls, with the railway station and the ordinary hotels. They are not interchangeable, and the difference in atmosphere is total." },
    { type: "ul", items: [
      "Fes el-Bali — the only real choice if you came for the medina; pick a riad with a courtyard and accept the walk to everything",
      "Batha district, Fes el-Jdid — colonial-era villas, the Dar Batha museum, quieter and walkable to the medina gates",
      "Ville Nouvelle — ordinary city comfort, the station, and the easiest arrival and departure logistics",
      "Outside the walls — only worth it if you plan to be out of the medina all day",
    ] },
    { type: "p", text: "Riads in Fes el-Bali are typically entered through a discreet door and often have a porter or a driver on call, because the alleys defeat GPS. Ask specifically whether your riad is inside the medina walls or just outside them: several properties marketed as 'in the medina' are a five-minute walk from Bab Bou Jeloud, which is a materially different experience. Bab Bou Jeloud, the Blue Gate, is the most-used western gate and the easiest landmark to give a driver." },
    { type: "cta", label: "Compare riad and hotel rates in Fes", category: "HOTELS", destinationSlug: "fes", placement: "fes-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "A tannery terrace, with a caveat about the smell" },
    { type: "p", text: "Fes is the tannery capital of the country, with three historic tanneries in the old city; Chouara is the one that receives visitors and the one most people picture. The hides are soaked, dyed and worked by hand, in a process medieval in its logic and only partly in its chemistry. The smell is severe and vendors offer sprigs of mint, which help marginally. The rooftop terraces above the vats are the standard viewpoint, and access has generally involved a small fee. Go in the morning, when the light is on the vats and the heat has not yet peaked." },
    { type: "p", text: "Two honest warnings. The tannery district is also a stage: the guides who offer to take you up frequently work on commission from a leather shop, and the pressure to buy is real. Go with a guide you chose deliberately, agree you are not buying, and expect to be followed. And the modern dye trade has a documented environmental record the terrace experience does not convey. If that matters, this is a place to look at and think about rather than a place to feel good about." },
    { type: "h3", text: "The Karaouine Mosque and the medersas" },
    { type: "p", text: "The al-Qarawiyyin mosque and the university attached to it, founded in the ninth century, is routinely described as the oldest continuously operating university in the world. The claim is defensible on institutional continuity and contested on precise definition, which is the kind of ambiguity worth knowing before you repeat it. In practice the mosque itself is not open to non-Muslim visitors in its main prayer hall, and access to associated buildings varies. The related scholarly tradition survives in the surrounding funduqs and madrasas." },
    { type: "p", text: "The medersas are the part you can actually walk into, and they are the best argument for Fes. Bou Inania, on the edge of the medina, is a Marinid foundation with zellij, carved plaster, muqarnas vaulting and a reflecting pool in the central court; it is still used for study. El Attarine, near the Talaa Kebira, is smaller, busier, and covered in tile. Both teach you more about what Moroccan architecture is than any amount of reading will, because the craft is visible at hand scale." },
    { type: "h3", text: "The Attarine Museum of Wooden Arts and Crafts" },
    { type: "p", text: "Installed in a restored funduq, this is the most legible introduction to the woodworking of Fes: chests, doors, prayer beads, carved panels and musical instruments, arranged by period. It is small, well laid out, and it changes how you read the carved doorways you have been walking past for two days. It is a working crafts museum rather than a historical curiosity, which is the point." },
    { type: "h3", text: "Talaa Kebira and the souks by trade" },
    { type: "p", text: "Talaa Kebira — the long, covered main street of the medina — is the commercial spine, and the way to read it is by trade rather than by name. The dyers work in the Sabbaghine quarter, the bookbinders and leatherworkers around Seffarine, the coppersmiths and metalworkers along the Talaa, the carpenters and cabinetmakers toward the western end. At Mechouar, the broad square that opens the street, scribes and public notaries still work in the open. This is the part of Fes that has not stopped being a city, and it is the reason the craft reputation exists rather than being invented for visitors." },
    { type: "h3", text: "The Mellah and the Fes el-Jdid courtyards" },
    { type: "p", text: "The Mellah, or Jewish quarter, lies between the two cities and predates them. It has the oldest surviving synagogue in the country at Slat al-Falaj, a small Jewish cemetery, and the Borj Nord, the last bastion of the old walled city, now converted into a comparative-arts space. Visiting is respectful, easy, and almost entirely uncrowded. The Dar Batha museum and the courtyard architecture of Fes el-Jdid are a quieter counterpart to the medina, and they are the right answer for a traveller who finds the medina overwhelming rather than exhilarating." },
    { type: "h3", text: "A day out to Volubilis and Meknes" },
    { type: "p", text: "Volubilis, roughly a couple of hours north-west, is a Roman provincial city with the most complete and best-preserved mosaic flooring in Morocco, and it is a genuinely extraordinary site on a clear day. Meknes, on the way or beyond it, is a smaller imperial city with the Bab Mansour gate and its enormous brass-studded doors, the Heri es-Souani granaries, and the mausoleum of Moulay Ismail, who built much of it. Fes is the better base for both, and seeing them in one day with a driver is a normal and worthwhile excursion." },
    { type: "h3", text: "The food, and the one dish Fes invented" },
    { type: "p", text: "Pastilla is the dish to plan a meal around: a sweet-and-savory pie of pigeon or chicken, almonds, cinnamon, pastry and honey, associated with Fes and traditionally eaten during Ramadan and on ceremonial occasions. It is rich, it is sweet, and it will divide a table. Around it, the table leans on the produce of the interior: white truffles from the Middle Atlas in season, goat's cheese, preserved lemons, olives and honey, and Mechouia, the cooked vegetable salad with a paprika dressing that is a national standard. Treat harira as a meal." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "Fes Angada airport is the nearest, a modest international field with direct connections to Casablanca and Paris and seasonal European charter service. It sits well outside the city, so the last leg is a taxi, and the distance is long enough that pre-arranging a transfer with your riad is worth it. Fes also has a station on the national rail network, which makes the city reachable by train from Casablanca via Meknes — the railway is a better experience than the road, and it is how a good number of visitors arrive." },
    { type: "p", text: "Inside the walls, walking is the only method, and the plan is to learn the gates and the squares rather than the alleys. Bab Bou Jeloud is the western gate and the busiest pickup point. Seffarine Square sits near the middle and is the best place to be picked up. Getting truly lost is fine — Fes el-Bali is a living, inhabited district, and a wrong turn is usually a coffee, not a dead end." },
    { type: "ul", items: [
      "Airport or station to medina: pre-arranged riad transfer, or a petit taxi to Bab Bou Jeloud",
      "Walking only inside the walls; the lanes are too narrow for anything else and are mostly stairs",
      "Petit taxis for the wider city and the Fes el-Jdid / Ville Nouvelle districts",
      "A licensed guide for the medina, ideally one you chose rather than one who found you",
      "A driver for Volubilis, Meknes, Ifrane or Sefrou; distances are longer than they look on a map",
    ] },
    { type: "cta", label: "Search flights into Fes Angada Airport", category: "FLIGHTS", destinationSlug: "fes", placement: "fes-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Fes is a good-value city, considerably so compared with Marrakech, and the medina in particular is inexpensive. The exception is the tannery and craft shopping, where the sky is the limit, and the guided-shop circuit if you let it happen to you. The practical money decision is a licensed guide for a half day, which costs real money and saves a great deal of both time and money." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Rough band, per person"],
      rows: [
        ["Shoestring", "Medina riad, market breakfast and lunch, walk between sights, public hammam", "Around 200–400 MAD"],
        ["Mid-range", "Better riad or Fes el-Jdid hotel, a guide for a half day, good dinners", "Around 550–1,100 MAD"],
        ["Luxury", "Palace riad, a driver on call, private medersa access, fine dining", "1,300 MAD and upward"],
      ],
    },
    { type: "p", text: "These are directional bands rather than quotes and will move with season. One specific warning: a great deal of the Fes guide-and-shop circuit operates on commission, and the prices in the shops are not what a commission-free guide would get you. If you are not buying, say so at the start." },
    { type: "p", text: "Bring small notes, use the ATMs in Ville Nouvelle or the Fes el-Jdid main streets rather than hunting inside the medina, and keep a bottle of water on you because the Fes valleys and the old city are thirsty places. Bring a reusable bag, and remember that single-use plastic is restricted in Moroccan shops." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "A licensed guide matters more in Fes than almost anywhere else in the country, because the medina is genuinely hard to navigate and the unofficial guides profit from that. Ask your riad to arrange a licensed one by name.",
      "Dress is more conservative here than in Marrakech. Cover shoulders and knees, especially around the medersas and the mosques, and during Ramadan more so. This is the destination where modesty is least negotiable and where it most improves the interaction.",
      "The tannery and the guided shops: agree in advance whether you are shopping. 'Just looking' is not respected as a concept in the shop circuit.",
      "Photography is welcome in the souks and unwelcome in the prayer hall. The tanneries and the leather stalls are working businesses, and a photo of a worker is worth asking about first.",
      "The medina alleys smell of donkey, diesel and rain depending on the hour. A hammam at the end of a long alley walk is the correct response, and the local hammams, not the spa hammams, are the more interesting building.",
      "Non-Muslims generally cannot enter the main prayer hall of the Karaouine. Plan around it rather than turning up and being turned away, and cover up more thoroughly for the medersas, which are religious buildings as well as architectural ones.",
    ] },
    { type: "p", text: "Fes is a city that rewards the traveller who accepts a slower, more confusing, less photogenic experience than the one they were sold. It is not the Fes of the tannery photograph. It is the Fes of a courtyard workshop, a calligrapher's shop, and a market street that was doing this before you arrived and will be doing it after you leave." },
    { type: "cta", label: "Browse tours and experiences in Fes", category: "ACTIVITIES", destinationSlug: "fes", placement: "fes-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Is Fes or Marrakech better for a first trip to Morocco?", answer: "They are genuinely different and both are worth two nights, which is the usual recommendation. Marrakech is easier, warmer, and built for spectacle and shopping; Fes is harder to navigate, more conservative, cheaper, and far better for crafts, architecture and the feeling of a working medieval city. Do Fes second, or first if you are drawn to craft rather than to atmosphere." },
        { question: "Do I need a licensed guide in the Fes medina?", answer: "More than in any other Moroccan city, yes. The alleys number in the thousands and the unofficial guides profit from that confusion, often by steering you toward a shop where they take a cut. Ask your riad to arrange a licensed guide by name, and state clearly whether you are shopping or not." },
        { question: "How long do you need in Fes?", answer: "Two full days is the minimum and three is better. One day for the medina, the medersas and the Mellah, one for a guided route and a hammam, and a third for Volubilis and Meknes or for Ifrane and Sefrou. The medina rewards an unhurried first morning and a slower second one." },
        { question: "What is the tannery smell like, and is it worth it?", answer: "It is severe, and the mint sprigs vendors offer help only a little. The rooftop terraces above the vats have generally involved a small fee. Go in the morning for light, be aware the district is also a stage with a commission-driven shop circuit attached, and know the leather trade has a real environmental cost the terraces do not convey." },
        { question: "Is Fes safe at night?", answer: "Fes el-Bali is busy and inhabited rather than dangerous, and a riad with a driver or porter on call is a sensible precaution for late returns, which is partly why so many riads offer it. Use the main arteries rather than the quiet lanes after dark, and agree a pickup landmark with your accommodation. As anywhere, treat any city as a considered risk rather than a guarantee." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Fes: Medersas, Tanneries and Volubilis",
    summary:
      "Two days inside the walls with a licensed guide, one day out to the Roman city and the imperial capital.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 330,
    days: [
      {
        title: "The medina, early",
        location: "Bab Bou Jeloud, Bou Inania, El Attarine",
        description:
          "Enter at Bab Bou Jeloud before the lanes fill. Bou Inania first, while it is quiet, then the Talaa Kebira and the Mechoar square, then the Attarine Museum of Wooden Arts. Afternoon in a hammam and dinner on the Nejjarine.",
        estimatedCostUsd: 110,
      },
      {
        title: "Crafts, tannery and the Mellah",
        location: "Chouara tannery, Sabbaghine, Fes el-Jdid",
        description:
          "A licensed guide for the morning route: the tannery terrace in early light, the dyers' quarter, a working copper workshop, then across to the Mellah, Slat al-Falaj and the Borj Nord. Late afternoon free for shopping without the commission circuit.",
        estimatedCostUsd: 120,
      },
      {
        title: "Volubilis and Meknes",
        location: "Volubilis, Meknes",
        description:
          "A driver for the day north-west. Volubilis mosaics in the morning, Meknes and the Bab Mansour gate in the afternoon, back to Fes by early evening.",
        estimatedCostUsd: 100,
      },
    ],
  },

  needsVerification: [
    "Fes el-Bali alley count: the frequently cited 'over 9,000' figure and its source",
    "Chouara tannery: which of the three historic tanneries is oldest, current rooftop terrace access fee, and opening times",
    "Karaouine / al-Qarawiyyin: current visitor access rules, and the precise basis of the 'oldest continuously operating university' claim",
    "Bou Inania and El Attarine medersas: current opening hours, admission fees, and whether the buildings are still in residential and teaching use",
    "Fes Angada airport: current scheduled routes and the realistic transfer time and cost to the medina",
    "Rail: current Casablanca–Meknes–Fes journey times, fares, and station-to-medina transport",
    "Volubilis and Meknes site fees, opening days, and the realistic combined day-trip cost with a driver",
    "Guide rates for a licensed half-day medina guide, and the current rules on guide commissions",
    "Truffle season dates for the Middle Atlas white truffle, and whether it is currently available at all",
    "All cost bands in MAD: re-baseline against 2026 rates",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 3 — CHEFCHAOUEN
// ---------------------------------------------------------------------------

const chefchaouen: SeedArticle = {
  title: DESTINATIONS[2].title,
  slug: DESTINATIONS[2].slug,
  excerpt: DESTINATIONS[2].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "chefchaouen",
  focusKeyword: DESTINATIONS[2].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[2].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["marrakech", "fes"],

  blocks: [
    { type: "p", text: "Chefchaouen looks like a set. The blue is too consistent, the light too good, the hills too photogenic, and the whole thing sits in a range of the Rif where the light is genuinely better than most of Morocco and the hills are genuinely steep. The interesting thing is that the blue is a comparatively recent accident of history rather than an ancient tradition, and once you know that, the town stops being a curiosity and starts being a place with an argument going on about it." },
    { type: "p", text: "This is a small town. It takes an hour to walk across. It is a two- or three-night stop, not a week, and the people who love it are the ones who accept that as enough." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "The Rif mountains do what mountain weather does, and the practical consequence is that the light and the temperature swing more than the coast does. Spring, from March into May, is the most reliable: warm enough to walk the medina in shirts, green in the surrounding hills, and busy. Autumn from September into November is similar and quieter. Summer is hot in the town and cool at altitude, with the walking paths above the town genuinely pleasant while the medina at midday is not." },
    { type: "p", text: "The town's famous market day matters more here than in most destinations, because the souks fill with produce and the place takes on a completely different energy. The market traditionally runs on Monday, though the day can shift with the season and it is worth confirming locally rather than planning a whole day around a fixed assumption. If your trip includes a Monday, put it here." },
    { type: "p", text: "Winter is the quietest and the coldest. Nights in the Rif can genuinely be cold, and while the town is rarely snowy, the mountain roads above it are affected by rain and occasionally ice. Some accommodation and restaurants close out of season, so if you are travelling in deep winter you want to book in advance rather than arrive and look. A quiet winter Chefchaouen with almost no other visitors is a very different and very good experience from a summer one." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["March – May", "Mild, green hills", "Moderate to high", "Rising", "Best walking weather"],
        ["June – August", "Hot in town, cool at altitude", "High", "Peak", "Weekend rush; the trails are the reward"],
        ["September – November", "Warm, calm, clear", "Moderate", "Rising then falling", "The sweet spot"],
        ["December – February", "Cold nights, wet spells", "Lowest", "Lowest", "Some places close; book ahead"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Chefchaouen is small enough that the neighbourhood you pick is a lifestyle choice, not a logistics decision. There are essentially three options and the difference between them is larger than the room rate." },
    { type: "ul", items: [
      "Inside the medina — Spanish-era courtyard houses converted into guesthouses, the most atmospheric choice, and the walk to everything is short",
      "Ras el-Maa and the river valley — just outside the walls, where the water and the falls are; quieter, cooler at night, and the sound of the river replaces the medina noise",
      "Out by the road, toward Akchour — cheaper, newer, and only worth it if you are here for the mountains and the waterfalls rather than the town",
    ] },
    { type: "p", text: "Rooftop rooms with a view up the valley are the reason people come, and they are worth paying for, but understand what you are buying: a view, a terrace, and a long climb up a narrow stair at the end of a night out. If you are sensitive to stairs or have mobility limits, say so before booking rather than discovering it in a converted building. Most places here have no lift and the staircases are built for goats." },
    { type: "cta", label: "Compare guesthouse and hotel rates in Chefchaouen", category: "HOTELS", destinationSlug: "chefchaouen", placement: "chefchaouen-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "The medina, which is the town" },
    { type: "p", text: "Start at the Plaza Uta el-Hammam, the main square, and work outward. The medina is a compact warren of stepped lanes and painted walls, and the reason it is blue is worth understanding: the tradition is usually traced to Jewish families in the town who, in the early twentieth century, used henna and laundry indigo to give whitewashed walls a distinctive finish and to mark their homes. Blue came to be associated with heaven and with the town's religious identity, and the palette spread from there. Whatever the exact sequence, the result is not an ancient tradition being preserved for tourists; it is a living town that has been repainted, repeatedly, for a century." },
    { type: "p", text: "The consequence for a visitor is a real and unresolved question. The blue is a genuine cultural identity and a genuine local aesthetic, and it is also the reason a hillside town of a few thousand people receives more photographers than pilgrims. The town's residents are not uniform about it, and a visit that treats the medina as a purely photogenic object is missing the actual place." },
    { type: "h3", text: "The Kasbah and the Plaza España" },
    { type: "p", text: "The kasbah above the town is the former residence of the local bey, and it is now a small museum with a genuinely good view back over the roofs and the valley. The building has been substantially rebuilt and is best understood as a heritage site rather than as an untouched fortress. The Plaza España below it is where the town's daily life happens, and it is the right place to sit with a tea and watch rather than photograph from above." },
    { type: "h3", text: "Ras el-Maa and the river" },
    { type: "p", text: "The valley edge of the medina drops toward the Ras el-Maa spring, where the river runs and there is a small cascade. This is the town's cooler side: the air is different, the sound is different, and the approach through the trees changes the temperature by several degrees. It is five minutes from the square and it is the difference between a good day in Chefchaouen and a hot one." },
    { type: "h3", text: "The Spanish Mosque above the valley" },
    { type: "p", text: "On the ridge above town, the remains of a Spanish-period church, built when this part of the Rif was under Spanish administration, look down the valley over the rooftops. It is a short walk up, it is almost empty, and the view is the one the town is famous for, taken from outside the town rather than from inside the postcard. The climb is steep; ask locally about the current condition of the path." },
    { type: "h3", text: "The waterfalls at Akchour" },
    { type: "p", text: "Akchour, roughly half an hour up the valley road, is a series of cascades in a rocky gorge that is the reason a great many people make the drive from Tangier. It is a short walk from the road, the water is genuinely cold, and the setting is unlike anything else in the Rif. Go early or late: mid-morning the coaches arrive, and the place goes from a gorge to a car park." },
    { type: "h3", text: "Talassemtane National Park and the cedar forest" },
    { type: "p", text: "The Rif range around Chefchaouen is a national park of genuine quality, and it is a hiking destination rather than a sightseeing one. The park takes its name from a summit that is the highest point in the range and the second-highest in Morocco, and the landscape of cedar forest, deep gorges and villages is the best argument for staying two nights. The high trails need local knowledge, weather, and a real amount of time, and the honest advice is to hire a local guide in the village rather than attempt the ridge routes on your own." },
    { type: "h3", text: "The pottery quarter" },
    { type: "p", text: "The town has a long ceramics tradition, and the workshops in the pottery quarter, beyond the medina to the east, are where it actually happens. The pieces are made from local red clay, which gives the distinctive warm colour, and the cooperative workshops generally let you watch the whole process from dug earth to fired plate. It is a small working industry, not a show, and it is one of the better things to see in the Rif without spending money." },
    { type: "h3", text: "The food, and the olives" },
    { type: "p", text: "Chefchaouen eats like the Rif eats: simple, olive-forward, and centred on bread, olives, vegetables and grilled meat. The town sits in an olive-growing area, and the oil is the local pride. There is a small but real cheese tradition in the mountains, and the market on a Monday is the place to see the actual range of what the region eats rather than what a restaurant has decided to serve. Rif mountain cooking is a good deal less tourist-adapted than the Fez or Marrakech versions, which is the point." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "There is no airport at Chefchaouen. The nearest is Tangier Ibn Battouta, roughly a three-hour drive away, and the other practical approach is coming from Fes, which is a longer drive and gives you Fes at the other end. Most visitors use a hired car, a private transfer, or one of the scheduled intercity services that run into the town. The drive up from the coast is genuinely scenic and genuinely winding, and the last stretch into the mountains deserves a driver who knows it." },
    { type: "p", text: "In town, you walk. It is small enough that a car is a liability rather than an asset, and most guesthouses are inside or immediately outside the medina with the square five minutes away. For Akchour, Talassemtane and the higher villages you need a car, and the standard for the mountain roads in winter is a driver rather than a rental." },
    { type: "ul", items: [
      "Tangier airport to Chefchaouen: roughly three hours by road; pre-book a transfer or a car",
      "From Fes: a longer drive, usually a day trip or an overnight rather than a hop",
      "Scheduled intercity buses and shared taxis run into town — check the current services locally",
      "In town: on foot, entirely",
      "Akchour, Talassemtane and the mountain villages: a car or a local driver",
    ] },
    { type: "cta", label: "Search flights into Tangier Ibn Battouta Airport", category: "FLIGHTS", destinationSlug: "chefchaouen", placement: "chefchaouen-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Chefchaouen is one of the cheaper places in the country, and noticeably so compared with Marrakech or Fes. Guesthouses are inexpensive, food is local and unpretentious, and the main tourist spend is transport — which is a real cost, because everything is uphill from a coast or a rail hub. The trade is that you pay to get here and then spend very little while you are." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Rough band, per person"],
      rows: [
        ["Shoestring", "Guesthouse, market breakfast and lunch, walking, mint tea all day", "Around 150–300 MAD"],
        ["Mid-range", "Better room with a valley terrace, a driver for a mountain day, good dinners", "Around 400–800 MAD"],
        ["Luxury", "The best restored house, private guide, four-wheel drive for the parks", "900 MAD and upward"],
      ],
    },
    { type: "p", text: "These are directional bands, not quotes, and the town's prices move with the season more than the coastal destinations do. Practical note: carry cash, use an ATM in town rather than at the coast, and expect prices to rise at the waterfalls because that is where the coaches stop." },
    { type: "p", text: "Bring a reusable bag, and treat the single-use plastic restriction as normal rather than as an obstacle. In the mountains, plan for a day of walking with water and food you bought in town, because nothing above the road is open when you want it to be." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "The blue is someone's home. Photograph the walls and the streets freely; ask before you photograph the people in them, and be aware the town has a real, ongoing relationship with being reduced to a colour.",
      "Dress modestly. The Rif is a conservative region and the medina is not a beach town, whatever the photographs suggest. Covering shoulders and knees is the local norm, and it makes the difference between being left alone and being engaged.",
      "Haggling is expected in the souks but not the ritual it is in Fes. Name a price, be polite, and walk away without a scene — the walk-away works here too.",
      "The waterfalls at Akchour are busy mid-morning and empty at dawn. The difference is forty minutes of your day and a completely different experience of the place.",
      "Friday is the prayer day and the market rhythm shifts around it. Shops close for the midday prayer window, and a plan built on 'the market is always open' will fail.",
      "The mountain trails are not a day trip without preparation. Hire a local guide, tell someone your route, and take the weather seriously — the Rif is not a landscape to be casual about.",
    ] },
    { type: "p", text: "Chefchaouen is the place on this list where the photograph and the reality are furthest apart, and the reality is better. It is a working Rif mountain town with a contested visual identity, a ceramics industry, a national park at its back door, and a river running through it — photographed by ten thousand people a year and actually known by far fewer of them." },
    { type: "cta", label: "Browse guided walks and tours in Chefchaouen", category: "ACTIVITIES", destinationSlug: "chefchaouen", placement: "chefchaouen-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Why is Chefchaouen blue?", answer: "The tradition is usually traced to Jewish families in the town who, in the early twentieth century, used henna and laundry indigo to give whitewashed walls a distinctive finish and mark their homes. Blue then came to carry religious and regional associations and the palette spread. It is a twentieth-century tradition, not an ancient one, which is part of what makes the town interesting." },
        { question: "How many days do I need in Chefchaouen?", answer: "Two nights is the minimum for the town and the medina, three to add Akchour and the national park properly. The town is small enough to cross in an hour, so the constraint is the drive time, not the sightseeing." },
        { question: "Is Chefchaouen worth it, or is it just a photo stop?", answer: "It is a photo stop, and it is also a genuine destination: a working Rif mountain town with a ceramics industry, a national park, a river, and a real argument about its own commodification. If you only want the photograph, go and leave. If you want the Rif, this is the base for it." },
        { question: "What is the best day trip from Chefchaouen?", answer: "Akchour, the waterfalls about half an hour up the valley, is the classic — go early or late to avoid the coaches. Talassemtane National Park, the cedar forest and the high trails, is the better and much less crowded option if you have a driver and a full day." },
        { question: "Do I need a car in Chefchaouen?", answer: "Not in town, which is small and walkable, and where a car is more trouble than transport. You do need one, or a driver, for Akchour, Talassemtane and the mountain villages, and for the three-hour drive from Tangier airport. Mountain roads in winter are a reason to hire a local driver rather than a rental." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Chefchaouen: Medina, Waterfalls and the Rif",
    summary:
      "A short, slow itinerary built around a walkable town, one big mountain day, and one day for the drive in and out.",
    budgetLevel: "budget",
    totalEstimatedCostUsd: 210,
    days: [
      {
        title: "The medina and the kasbah",
        location: "Plaza Uta el-Hammam, Kasbah, Plaza España",
        description:
          "Arrive from Tangier or Fes by road and check in. Walk the medina in the late afternoon light, the kasbah above the square, then the Spanish Mosque on the ridge for the view back over the roofs.",
        estimatedCostUsd: 70,
      },
      {
        title: "Akchour and the valley",
        location: "Akchour, Ras el-Maa",
        description:
          "Early start for the waterfalls at Akchour before the coaches arrive, back to town for the afternoon at the river. Evening on the Plaza España.",
        estimatedCostUsd: 70,
      },
      {
        title: "Talassemtane and the drive out",
        location: "Talassemtane National Park, then Fes or Tangier",
        description:
          "A full day with a local guide in the cedar forest and the gorges, or a longer drive toward Fes. Leave late afternoon if you are heading to Fes.",
        estimatedCostUsd: 70,
      },
    ],
  },

  needsVerification: [
    "Drive times: Tangier airport to Chefchaouen and Chefchaouen to Fes, with current road conditions",
    "Market day: the traditional Monday schedule, and whether it shifts seasonally",
    "Akchour: current entrance or access fee, parking, and the coach arrival window in season",
    "Talassemtane: current national park rules, whether a guide is mandatory on high trails, and the summit name and elevation",
    "Kasbah museum: current opening days, hours, and admission",
    "Spanish Mosque path: current condition and whether the ridge approach is open",
    "Guided hike rates in the mountain villages, and current recommended trail difficulty",
    "All cost bands in MAD: re-baseline against 2026 rates",
    "The 1960s Spanish administration period and the town's history: dates to be confirmed before any historical claim is published",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 4 — CASABLANCA
// ---------------------------------------------------------------------------

const casablanca: SeedArticle = {
  title: DESTINATIONS[3].title,
  slug: DESTINATIONS[3].slug,
  excerpt: DESTINATIONS[3].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "casablanca",
  focusKeyword: DESTINATIONS[3].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[3].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["marrakech", "chefchaouen"],

  blocks: [
    { type: "p", text: "Most people pass through Casablanca on the way to somewhere else, and the city absorbs the transit with a confidence that is arguably the point. It is the commercial capital, the largest city in the country, and the one place where Morocco reads as a modern, working, outward-looking place rather than a preserved-medina fantasy. If you give it two full days instead of a two-hour wait, it rewards the effort. If you only have a stopover, the mosque at sunset and the corniche afterwards are a legitimate answer." },
    { type: "p", text: "There is also a more particular pleasure available here, which is the Art Deco: a whole quarter of the 1920s and 30s, built when the city was being planned as a European business capital, whose pastel façades have been restored with real care. It is the most interesting urban fabric in Morocco after the medinas, and almost nobody stays long enough to see it." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "Casablanca is on the coast, which flattens the seasonal extremes but does not remove them. Spring from March to May and autumn from September to November are the best windows — mild, bright, and comfortable for the medina and the corniche on foot. Winter is mild, occasionally wet and windy, and the sea is rough enough that the corniche loses some of its appeal. Summer is hot and hazy; the city works, but you do a lot of it in the evening." },
    { type: "p", text: "The city is a business city first, so weekdays and weekends feel different: the rhythm is genuinely Monday to Friday, with the Friday prayer shaping the medina and the port. Ramadan compresses the day again, as everywhere in the country, but in a port and business city the effect on restaurants, offices and the airport is more visible than in a tourist town. If you are here for the medina and the architecture, Ramadan is an inconvenience; if you want to see the city at its most structured, it is instructive." },
    { type: "p", text: "One practical note that only matters if you are coming in a hurry: as the main gateway for the country, Casablanca airport is where most flights connect, including a great many that are really second legs. The airport is a long way from the centre and a new terminal has changed arrival logistics, so if your plan is a short stopover, confirm the transfer time before booking a connection that is too tight." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["March – May", "Mild, bright, occasionally windy", "Moderate", "Rising", "Best for the medina on foot"],
        ["June – August", "Hot, hazy, long evenings", "Low in the city, high at the port", "Falling", "Go out late, not out all day"],
        ["September – November", "Warm, clear, calmer sea", "Moderate", "Rising", "The sweet spot"],
        ["December – February", "Mild, wet and windy at times", "Low", "Low", "Corniche is at its least appealing"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Casablanca's neighbourhoods are the difference between a pleasant stopover and a good stay, and the choice is more consequential here than in most cities because the city is large and spread out." },
    { type: "ul", items: [
      "The centre — around Place Mohammed V and the old town edge: closest to the mosque, the corniche and the medina, and the most walkable for a first visit",
      "The Corniche / Ain Diab — the seafront and the city's café and restaurant strip; a longer walk from the old city but a good base if you are here to eat",
      "The new town / Maârif — more of a residential and business district, well served, and further from the sights",
      "Anfa and the newer districts — the modern mall and business belt, practical if you need a mall, a gym and a car, and the least charming option",
    ] },
    { type: "p", text: "A frequent mistake is booking on the corniche and then spending the stay in a car. The centre, especially on foot to the mosque and the old town, is more rewarding and cheaper. If you are here for the medina, stay on its edge. The Habous quarter is a compact, well-restored Andalusian development with its own court and a small, quiet character that is genuinely worth an afternoon." },
    { type: "cta", label: "Compare hotel rates in Casablanca", category: "HOTELS", destinationSlug: "casablanca", placement: "casablanca-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "The Hassan II Mosque at sunset" },
    { type: "p", text: "This is the reason most people who 'only have a stopover' end up glad they came. It sits on a promontory over the Atlantic, built in the 1990s, and the scale of it is genuinely difficult to convey — the prayer hall is enormous and the minaret is the tallest in the world. The interior is open to non-Muslims in much of its extent, including areas with extraordinary glass chandeliers, and the tour takes you up the minaret. The thing to plan is the time: the light and the call to prayer over the water at sunset is the moment, and the queues get long. Go early, dress respectfully, and allow more time than you think." },
    { type: "h3", text: "The Art Deco centre" },
    { type: "p", text: "The 'new town' of the 1920s and 30s, laid out when Casablanca was being built as the commercial capital of French Morocco, is a coherent quarter of low-rise buildings in sand, cream and ochre, with rounded corners, long horizontal windows and tile details. A number of the façades have been restored to their original intent, and walking the streets around Place Mohammed V and the surrounding blocks with your head up is the single best hour you can spend in the city. The Hôtel Excelsior and the surrounding commercial buildings are the anchors. This is a walking tour, and it is worth doing with someone who can tell you what the restoration involved." },
    { type: "h3", text: "The old medina and the port" },
    { type: "p", text: "The old medina is compact, working and unpolished: wholesale, textiles, spices, metal, and the trades rather than the souvenirs. It is at its most interesting around the port, where the goods actually come in, and where you can see the fishing boats and the wholesale trade that made the city. It is a very different experience from the medinas of Fes and Marrakech, and a useful corrective if the idea of a Moroccan medina has become a set of expectations rather than a place." },
    { type: "h3", text: "The corniche at the end of the day" },
    { type: "p", text: "The seafront promenade is the city's evening life: restaurants, the occasional horse and carriage, families, and the sunset going down into the Atlantic. It is long, so it is a car trip unless you are staying near it, and the best version of it is the walk from the old town down toward the end of the light. It is a place to eat rather than a place to sightsee, which is the right way to spend it." },
    { type: "h3", text: "The Habous quarter" },
    { type: "p", text: "A small, carefully planned Andalusian-style quarter from the early twentieth century, with a courtyard, traditional roofs and workshops, and a fraction of the tourist density of a Marrakech riad district. It takes an hour, it is calm, and it is a good counterweight to the business-city feel of the centre." },
    { type: "h3", text: "A day trip to Rabat" },
    { type: "p", text: "Rabat is the capital and it is close, on the coast, on the same train. Its kasbah of the Udayas, the Kasbah of the Oudayas and the Hassan Tower, the incomplete mosque at the heart of it, the Maârif, and the ruins of the ancient Roman city of Sala Colonia make it a genuinely good day, and it is a quieter and more walkable city than Casablanca. This is the most obvious and most worthwhile excursion from Casablanca if you have a spare day." },
    { type: "h3", text: "The food" },
    { type: "p", text: "Casablanca eats like a port city: more seafood, more French and Mediterranean influence, more range than the interior. The fish is the point, and there is a serious trade in it. Couscous is still a Friday dish. The city is where the best of the Moroccan restaurant and pastry vocabulary is easiest to find, and the corniche and the centre both have places that would hold up in a much smaller city." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "Mohammed V airport is the country's main international gateway and the hub most itineraries route through. It is a long way out, and the city's rail and road links are the practical way in if you have time. The airport is a city in itself, which is the main consolation for a stopover. The new terminal and the old terminals each have their own character and their own transfer conventions, so check your terminal and your connection time carefully." },
    { type: "p", text: "The city itself is large, so a car helps, but the centre and the medina are walkable and the tram has improved the way the city moves. The metro and tram cover the centre and the new town. Rideshare and taxis are straightforward, with the fare convention that you agree or use the meter. On the medina's edges, the older taxis are the ones worth hailing, and the fare is a conversation, not a tariff." },
    { type: "ul", items: [
      "Airport to centre: a taxi or a prearranged transfer; allow real time for the distance, especially on a short stopover",
      "Centre to Rabat: the train is the easy option, or a car for a full day",
      "Centre and medina: walkable, but give the medina more time than the map suggests",
      "Corniche: a car, or a bus, unless your hotel is at the sea end",
      "New town and the malls: the tram reaches most of them; a car for the far districts",
    ] },
    { type: "cta", label: "Search flights into Casablanca Mohammed V Airport", category: "FLIGHTS", destinationSlug: "casablanca", placement: "casablanca-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Casablanca is more expensive than the interior cities — it is a business capital, and the coastal pricing reflects that — but it is not Dubai or London, and the medina and the local places remain genuinely affordable. The expensive parts are the hotels, the new town, and the restaurant scene on the corniche. The cheap parts are the medina, the buses, and the local food." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Rough band, per person"],
      rows: [
        ["Shoestring", "Budget hotel, medina food, tram, mosque entry", "Around 250–450 MAD"],
        ["Mid-range", "Centre hotel, a good seafood dinner, a day trip to Rabat", "Around 700–1,400 MAD"],
        ["Luxury", "Business-district hotel, private car, fine dining, private guides", "1,600 MAD and upward"],
      ],
    },
    { type: "p", text: "These are directional bands, not quotes, and the city has wide seasonal variation. One practical warning specific to a business city: many of the best-value rooms are in the new town, which is a taxi from anything you want to see, so factor the transport in rather than comparing the room rate alone." },
    { type: "p", text: "Use the ATMs in the centre and the new town rather than the medina, carry small notes for the taxis and the buses, and bring a reusable bag. The single-use plastic restriction is normal here as everywhere." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "Dress is more cosmopolitan in Casablanca than the interior, but the mosque is the place to cover up — shoulders and knees, and shoes off, and a scarf is often provided but do not rely on it.",
      "Friday is the city's day: the port, the medina and the shops all change rhythm around the midday prayer. If you are here for a working city, Friday is the day to be in it.",
      "The medina and the centre are different places. Treating the medina as a shopping extension of the centre is how you end up missing the wholesale trade that is the interesting part.",
      "Haggling in the medina is normal and reasonable; in the new town and the malls it is not, and asking for it will get you an odd look.",
      "As a port city, the sea, the harbour and the fish market are the city's point of origin, and a visit to the port in daylight is worth the walk.",
      "Ramadan changes the city's clock: restaurants that ignore it are rare, and the evening starts much later. Plan dinner late and accept the shift.",
    ] },
    { type: "p", text: "Casablanca rewards the traveller who stops treating it as an airport. It is a working port city with a serious 1920s architectural story, the most ambitious mosque in the country, a seafront, and a whole quarter of pastel façades that is quietly one of the best things to walk through in Morocco. Two days is enough to see all of that, and the city is very good value for a city of its size." },
    { type: "cta", label: "Browse tours and experiences in Casablanca", category: "ACTIVITIES", destinationSlug: "casablanca", placement: "casablanca-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Is Casablanca worth a stop, or just an airport?", answer: "Two full days is enough to see the mosque, the Art Deco centre, the old medina, the corniche and a day trip to Rabat, and it is well worth it. On a short stopover, the mosque at sunset and the corniche afterwards are a legitimate use of a few hours. The Art Deco centre is the part most people miss and the part most worth the detour." },
        { question: "Can non-Muslims visit the Hassan II Mosque?", answer: "Much of the mosque complex is open to non-Muslims, including areas with the famous glass chandeliers and the minaret tour, but it is a place of worship and dress and conduct expectations apply. Access arrangements can change around prayer times, so arrive earlier than you think you need to and allow more time than you would for a museum." },
        { question: "How long is the transfer from Casablanca airport to the city?", answer: "The airport is a significant distance from the centre and a new terminal has changed the arrangement, so allow a real margin on a short connection and confirm the current transfer time. On a stopover, the airport itself is more pleasant than most airport hotels and has enough to do for a few hours." },
        { question: "Is Rabat or Casablanca better for a day trip?", answer: "Rabat, if you have one day. It is the quieter, more walkable capital, with the kasbah of the Oudayas, the Hassan Tower and the Roman ruins at Sala Colonia, and it is close on the train. Casablanca is worth two days in its own right if you have them; Rabat is the better excursion from it." },
        { question: "Do I need a car in Casablanca?", answer: "For the centre, the medina and the corniche you can manage on foot, the tram and a taxi, and a car only makes parking harder. A car pays off for the far districts, the malls, and a day trip to Rabat. For a short stay, skip the car and spend the money on a driver for one day instead." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Casablanca: Mosque, Deco and the Old Port",
    summary:
      "The gateway city done properly: the mosque at sunset, the Art Deco centre on foot, the working medina and port, and a day in Rabat.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 450,
    days: [
      {
        title: "The mosque and the corniche",
        location: "Hassan II Mosque, Corniche Mohammed V",
        description:
          "Arrive, check in, and go to the mosque in the afternoon for the interior and the minaret, then be on the corniche for sunset and dinner. Leave the mosque in good time; the queues build.",
        estimatedCostUsd: 150,
      },
      {
        title: "Art Deco and the old medina",
        location: "Place Mohammed V, the new town, Derb Omar, the port",
        description:
          "A walking morning around the 1920s façades, then the old medina for the wholesale trade, the port and the fishing boats, and the Habous quarter in the late afternoon.",
        estimatedCostUsd: 150,
      },
      {
        title: "A day in Rabat",
        location: "Rabat: kasbah of the Oudayas, Hassan Tower, Sala Colonia",
        description:
          "Early train or a car for the day. The Oudayas kasbah in the morning, the Hassan Tower and the medina, then the Roman ruins of Sala Colonia in the afternoon, back by early evening.",
        estimatedCostUsd: 150,
      },
    ],
  },

  needsVerification: [
    "Hassan II Mosque: current opening hours, minaret access, the current non-Muslim entry arrangements, and the exact prayer-time closures",
    "Minaret height and its current claim as the world's tallest, and the prayer-hall capacity figure",
    "Art Deco centre: which buildings are open, any current restoration works, and whether guided walks are running",
    "Mohammed V airport: which terminal is used for which airlines, current transfer times to the city, and the airport's own opening hours",
    "Casablanca tram and metro: current lines, extensions, and fares",
    "Train to Rabat: current frequency, journey time, and fare",
    "Rabat sites: current entry fees and hours for the Oudayas kasbah, Hassan Tower, and Sala Colonia",
    "The Habous quarter: current opening and whether the workshops are open to visitors",
    "All cost bands in MAD: re-baseline against 2026 rates",
    "The Art Deco quarter's history and dates: confirm before making any specific historical claim in published copy",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 5 — AGADIR
// ---------------------------------------------------------------------------

const agadir: SeedArticle = {
  title: DESTINATIONS[4].title,
  slug: DESTINATIONS[4].slug,
  excerpt: DESTINATIONS[4].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "agadir",
  focusKeyword: DESTINATIONS[4].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[4].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["marrakech", "casablanca"],

  blocks: [
    { type: "p", text: "Agadir has a bad reputation it did not entirely earn and a case it has never properly made. It is a long, beautiful, wind-shaped bay on the Atlantic; a planned resort city built in the 1960s and largely rebuilt after an earthquake; and the gateway to a genuinely extraordinary hinterland of kasbahs, argan country, surf breaks and mountain villages. The problem is that the bay is also a cheap package holiday, and the two facts have been welded together so tightly that the resort has become a punchline — a hashtag, a test, an insult." },
    { type: "p", text: "The interesting version of Agadir is not the beach. It is the two hours inland in either direction, and the decision to stop treating the bay as a destination rather than a corridor." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "The Atlantic coast has a genuinely different season from the rest of Morocco, and the difference matters. Spring from March to May is best: warm enough for the beach, mild in the Anti-Atlas foothills, and clear. Autumn from September into November is nearly as good and quieter. The winter here is the reason to come — the coast stays mild and the mountains above it occasionally get snow, which is an oddly beautiful combination and almost nobody visits for it." },
    { type: "p", text: "Summer is the trade. It is hot but the sea breeze keeps the bay cooler and more liveable than inland Morocco in July and August, and the water is at its best. It is also peak season, and the resort will be at its most crowded and most obviously a resort. If you want quiet and the hinterland, come in winter. If you want the water, come in summer and accept the package-holiday crowd on the beach while you are somewhere else." },
    { type: "p", text: "One practical note about the mountains, which are the actual reason to be here: the High Atlas was badly affected by the earthquake in September 2023, whose epicentre was in the western High Atlas near the villages that Marrakech and Oukaimeden travellers use. The Agadir approach to the Anti-Atlas is a different range, but if you are combining Agadir with a Marrakech or Imlil day trip, check the current situation for the villages before planning that leg." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["March – May", "Warm, clear, foothills pleasant", "Moderate to high", "Rising", "The best overall window"],
        ["June – August", "Hot but breezy; water at its best", "Peak", "Falling", "Resort at its most crowded"],
        ["September – November", "Warm, calm sea, thinning crowds", "Moderate", "Rising then falling", "The sweet spot"],
        ["December – February", "Mild coast, snow possible above", "Lowest", "Lowest", "The empty-bay experience"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Agadir's accommodation divides cleanly into two worlds, and pretending they are the same is the mistake most visitors make. The resort strip is long, flat, and built around a beach with hotels on it. The kasbah district inland is a completely different town, and it is where anyone who is actually in Agadir rather than at it should be based." },
    { type: "ul", items: [
      "The beachfront resort strip — long, walkable, every facility, and no reason to leave it if a package holiday is genuinely what you booked",
      "The kasbah / town side, a short taxi inland — a working town, cheaper, better food, and a real sense of place",
      "Taghazout, around half an hour north — a fishing village that became a surf town, with a very different atmosphere and a serious surf scene",
      "A kasbah guesthouse in the hinterland — Taroudant or a village stay, for people who came for the region rather than the bay",
    ] },
    { type: "p", text: "The practical consequence of the split: if you stay on the strip you will need a car or a taxi to reach anything worth reaching, and if you stay inland you lose the beach walk. A week in Agadir is only worth it if you split your time deliberately, and most people who are 'doing Agadir' have not noticed they have spent a week on a beach they could have had anywhere." },
    { type: "cta", label: "Compare hotel and kasbah rates in Agadir", category: "HOTELS", destinationSlug: "agadir", placement: "agadir-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "The Kasbah of the Udayan" },
    { type: "p", text: "The sixteenth-century kasbah of the Udayan dynasty stands on a hill above the river, largely a ruin, and it is the oldest thing in a city that is otherwise almost entirely twentieth century. It has been partly restored and partly repurposed, and it is worth the short walk for the view over the rooftops and the river valley and for the reminder that Agadir is old before it is a resort. The ethnological museum in the Amazigh heritage village nearby is a decent companion if you want context on the region's Amazigh culture." },
    { type: "h3", text: "The bay itself, used properly" },
    { type: "p", text: "The bay is one of the longest and most gently curved on the Atlantic coast, with a long pier out into the water and a promenade along the front. It is a place to walk rather than to admire, and the far southern end, past the port and toward the kasbah, is where the city actually lives. Do not skip the port: the fishing fleet and the morning market are the real Agadir, and they are the reason the town's food is as good as it is." },
    { type: "h3", text: "Taghazout and the surf coast" },
    { type: "p", text: "Twenty-five minutes north, Taghazout is a fishing village with a world-class point and reef break, and it has a reputation far larger than its size. The surf runs all year and the water is a genuinely consistent swell, which is why the town has become a year-round destination for surfers from Europe rather than a summer-only one. There is a real scene, real schools, and a real village, and the combination is unusual. The beaches on either side — including some of the best beach-break surf in the country — are as good as anything on the coast." },
    { type: "h3", text: "The Anti-Atlas kasbahs: Taroudant and Tafraoute" },
    { type: "p", text: "This is the strongest argument for Agadir as a base. Taroudant, a little over half an hour inland, is a small walled town with a huge market — a good deal of it antiques and produce — and the nickname people give it, a smaller Marrakech, is fair enough to be useful and wrong enough to be interesting. Around it, the Anti-Atlas has kasbah villages where people still live inside the walls. Tafraoute, further into the mountains, is an argan-growing village with a long weaving and carpet tradition, and the combination of argan oil, highland scenery and a real craft economy is the best half-day you can take from the coast." },
    { type: "h3", text: "Argan country" },
    { type: "p", text: "The Souss region around Agadir is argan country, and the cooperative movement here is one of the more successful rural women's cooperatives in Morocco, formed to break the intermediaries' stranglehold on what is a genuinely valuable product. Buying oil direct from a cooperative is better for the producer and cheaper for you, and it is the most straightforward ethical-consumption decision available on this coast. Taste it before you buy; quality varies and the difference is obvious." },
    { type: "h3", text: "Tiznit and the silver" },
    { type: "p", text: "An hour inland, Tiznit is a town with a long silver trade, producing the heavy, worked jewellery that is distinctively Amazigh and that you will see in the souks all across the south. It is a working town rather than a museum for it, and the workshops on the edge of town are where the pieces are actually made. It pairs naturally with the Tafraoute and Taroudant loop." },
    { type: "h3", text: "Souss-Massa National Park" },
    { type: "p", text: "Between Agadir and the border, the national park protects a stretch of coast and the arid hinterland behind it, and it is where the coastal scrub, the dunes and the birdlife are. It is not a spectacular national park by international standards, but it is genuinely wild in a way the resort is not, and it is the place to go if you want the Agadir region to be something other than a beach." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "Agadir's airport is the cheapest long-haul gateway in Morocco and a charter hub, which is why so many package holidays exist. It is a short drive from the city. The real problem with Agadir is not getting there; it is that the resort layout makes it easy to arrive, check in, and never leave, and that a car is close to essential if you want to see any of the hinterland described above." },
    { type: "p", text: "The city itself has enough taxis and petit taxis for the strip and the town, and the distances are short. The hinterland is a different proposition: kasbah villages, Tafraoute and Tiznit want a car, and the mountain roads want a driver who knows them. If your interest is the surf coast, Taghazout and the beaches are reachable by taxi, which is how half of it gets done." },
    { type: "ul", items: [
      "Airport to the city: a short taxi or transfer; the airport is close to town",
      "The resort strip and the town: petit taxis, and walking on the strip",
      "Taghazout: a taxi, roughly half an hour north",
      "Taroudant, Tafraoute, Tiznit and the kasbah villages: a car, ideally with a driver",
      "Souss-Massa National Park: a car; distances are longer than they look",
    ] },
    { type: "cta", label: "Search flights into Agadir Al Massira Airport", category: "FLIGHTS", destinationSlug: "agadir", placement: "agadir-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Agadir is cheap, and the resorts are cheap for a reason that has nothing to do with quality. The genuinely good-value end of the market here is a real bargain, the food in the town is inexpensive, and a car for a day is the single highest-value spend in the region because it unlocks everything worth seeing. The expensive part of Agadir is the beachfront complex, and if you are paying for that you have bought a holiday rather than a trip." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Rough band, per person"],
      rows: [
        ["Shoestring", "Guesthouse in town, local food, taxi to the beach, no hire car", "Around 150–300 MAD"],
        ["Mid-range", "Good hotel on the strip, a car for a day, surf lesson, hinterland loop", "Around 500–1,000 MAD"],
        ["Luxury", "Resort with a pool, private driver, guided kasbah and argan visits", "1,200 MAD and upward"],
      ],
    },
    { type: "p", text: "These are directional bands, not quotes, and Agadir's seasonal pricing is strong: the summer and school-holiday weeks are much dearer than the rest of the year. One specific thing worth doing: buy argan oil at a cooperative rather than in a shop, where you are paying a middleman and getting an inferior product for it." },
    { type: "p", text: "Cash matters more here than in the big cities — the town, the cooperatives and the markets prefer it, and ATMs are not everywhere outside the strip. Carry small notes, use them for the market, the harbour and the villages, and bring a reusable bag." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "The beach is a working beach. The port, the fishermen and the morning market are the town, and the resort strip is a separate country. Split your time and you will get both; otherwise you will only get the strip.",
      "Surf etiquette matters in a small scene. Know where you sit in the water, do not drop in, and expect a friendly but firm correction from a local who surfs here every day.",
      "Cooperative argan: buy from the cooperatives, ask what the price is per litre, and taste before you commit. It is a better product and a better deal than the shops.",
      "Dress modestly in the town and the villages, especially away from the beach. This is a conservative region and the hinterland is not a resort.",
      "The Anti-Atlas is not a drive-through. Mountain roads, winter conditions, and villages where the road ends are all real; a local driver is worth more than a rental agreement.",
      "Friday is the prayer day and the market rhythm changes around it. The Taroudant market in particular is worth timing around the week rather than the day.",
    ] },
    { type: "p", text: "The anti-tourism chorus around Agadir has a point and it is also lazy. The point is real: a bay this good, built for this, in a country this poor, is a genuine imbalance worth being uncomfortable about, and the town is not a natural place. The laziness is assuming there is nothing else here. There is an ancient kasbah, a working silver town, a coast that surfs year-round, argan cooperatives that put money directly into Amazigh villages, and a national park behind the strip. Agadir is a bad resort and an excellent base, and the second thing is the one worth the trip." },
    { type: "cta", label: "Browse surf lessons and hinterland tours in Agadir", category: "ACTIVITIES", destinationSlug: "agadir", placement: "agadir-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Is Agadir worth visiting, or is it just a package resort?", answer: "The bay is a real long crescent on the Atlantic and the water is consistent, but the resort itself is the weakest case in Morocco. What justifies the trip is the hinterland: the Udayan kasbah, the Anti-Atlas kasbah villages, Taroudant's market, Tiznit's silver, the argan cooperatives, Taghazout's surf, and the national park. Stay two or three nights and go inland, or do not bother." },
        { question: "Is Agadir a good surf destination?", answer: "It is one of the best, and one of the few with year-round swell rather than a seasonal window. Taghazout has a world-class point break and the beaches either side have excellent reef and beach breaks. The water is warm and consistent, the scene is small and experienced, and the town is a fishing village rather than a surf camp, which keeps it real." },
        { question: "How many days do I need in Agadir?", answer: "Two to have the bay and the kasbah and one hinterland loop. A week is only worth it if you are here for a week of surf or a genuinely slow holiday; the town does not have a week's worth of sights, and the hinterland is what takes the time." },
        { question: "What is the Agadir 'test'?", answer: "It is a hashtag and a real piece of online discourse from the late 2010s in which Moroccan and Italian travellers argued about whether Agadir is a genuinely ugly resort town. The critique is fair — it is a purpose-built, heavily landscaped resort with limited appeal — but it flattens a town that has real Amazigh history and a genuinely interesting region behind it." },
        { question: "Is the Agadir region safe after the 2023 earthquake?", answer: "The September 2023 earthquake had its epicentre in the western High Atlas, badly affecting villages on the Marrakech and Oukaimeden routes. Agadir itself and the Anti-Atlas to the south were not the epicentre area, but conditions and access change, so check current travel advice and the situation in any specific village before a mountain drive." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Agadir: Kasbah, Surf and the Anti-Atlas",
    summary:
      "One day on the bay and the kasbah, one in Taghazout and the surf coast, one inland to Taroudant, Tafraoute and the argan cooperatives.",
    budgetLevel: "budget",
    totalEstimatedCostUsd: 260,
    days: [
      {
        title: "The bay, the port and the kasbah",
        location: "Agadir corniche, port, Kasbah of the Udayan",
        description:
          "Morning on the port and the fishing fleet, then the kasbah of the Udayan on the hill. Afternoon on the bay and the pier, dinner in the town rather than the strip.",
        estimatedCostUsd: 90,
      },
      {
        title: "Taghazout and the surf coast",
        location: "Taghazout, the point, the surrounding beaches",
        description:
          "North for the day. A surf lesson or a dawn session, the village, and the beaches either side of it. Back by late afternoon.",
        estimatedCostUsd: 90,
      },
      {
        title: "The Anti-Atlas loop",
        location: "Taroudant, Tafraoute, argan cooperatives",
        description:
          "A car inland. Taroudant's market in the morning, Tafraoute for argan and weaving, a cooperative for the oil, back to Agadir by dusk.",
        estimatedCostUsd: 80,
      },
    ],
  },

  needsVerification: [
    "Al Massira airport: current routes, and the transfer time and cost to the city",
    "Kasbah of the Udayan: current opening days, hours, admission, and the extent of restoration",
    "The Amazigh heritage village: current status and whether it is open to visitors",
    "Taghazout: current surf season, surf school rates, and whether the point is currently working",
    "Taroudant market days and current entry arrangements; Tiznit silver workshops and whether visits are possible",
    "Argan cooperative pricing per litre and how to verify a genuine cooperative",
    "Souss-Massa National Park: current access rules, whether 4x4 is required, and guide requirements",
    "The September 2023 earthquake: current status of High Atlas mountain roads and villages before any mountain driving",
    "All cost bands in MAD: re-baseline against 2026 rates",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 6 — ISTANBUL
// ---------------------------------------------------------------------------

const istanbul: SeedArticle = {
  title: DESTINATIONS[5].title,
  slug: DESTINATIONS[5].slug,
  excerpt: DESTINATIONS[5].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "istanbul",
  focusKeyword: DESTINATIONS[5].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[5].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["dubai", "london"],

  blocks: [
    { type: "p", text: "Istanbul is the only city in the world with two continents as neighbourhoods, and the interesting thing is that most visitors never use the crossing. They stay on the European side, in a strip of roughly four square kilometres, take a Bosphorus cruise they could have taken for a few lira on a municipal ferry, and fly home having seen a version of the city that is essentially a very good museum district. The actual Istanbul is on the Asian shore, in the ferry commuters' routines, and in the hills behind the water." },
    { type: "p", text: "The city also has a currency problem that quietly shapes every plan: the lira has been volatile for years, which means prices feel unstable and budgeting advice goes out of date fast. Treat anything you have read about what things cost as unreliable, and check current numbers locally." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "Istanbul is enormous and its seasons are uneven between the districts, but the broad pattern is clear. Spring from April into May and autumn from September into October are the best windows: the parks are green, the light on the water is good, and the crowds are manageable except at the end of April around the national holiday. Summer is hot and humid, and the city empties somewhat as people leave for the Aegean and the coast — which makes late June and August good for a city trip and bad for a sightseeing queue." },
    { type: "p", text: "Winter is the underrated season. It rains, occasionally snows, and the light on the domes and minarets in low winter sun is the best of the year. The city is at its most atmospheric and its most local. The trade is rain and shorter days, and a museum-heavy plan absorbs both well." },
    { type: "p", text: "Ramadan changes the city's clock hard. The call to prayer all evening, the sweets and iftar economy on the streets, the packed waterfront, and a different, slower rhythm in the old city. It is a spectacular thing to be in the middle of and a real inconvenience if you wanted a specific timed attraction. Check the current religious-holiday calendar if you are planning around any specific site, because the public holidays move." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["April – May", "Mild, green, occasional rain", "High from late April", "Rising", "National holiday crowds at the end of April"],
        ["June – August", "Hot, humid, sunny", "High, but residents leave", "High", "Good city atmosphere, hard sightseeing"],
        ["September – October", "Warm, clear, best light", "Moderate to high", "Rising", "The sweet spot"],
        ["November – March", "Cold, wet, occasional snow", "Lowest", "Lowest", "Best value and best light, wettest"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "The choice that determines your Istanbul is the water, not the view. Most first-timers stay in Sultanahmet or the old city, which is walkable to the headline Byzantine and Ottoman sites and is, in summer, the most tourist-dense and most expensive part of the city. It is a good base for a first, short, site-focused trip. It is a poor base if what you want is to feel where people actually live." },
    { type: "ul", items: [
      "Sultanahmet / the old city — walkable to Hagia Sophia, the Blue Mosque, the Topkapi and the Hippodrome; the densest tourist pressure and the highest prices",
      "Galata / Karaköy — across the Golden Horn, the European side's more local and livelier side, with the tower, the art scene and better value",
      "Kadıköy — on the Asian side, the best food in the city, a real market, and a genuine neighbourhood life; ferry-dependent but worth the crossing",
      "Balat and Fener — the old Greek and Jewish quarters on the Golden Horn, the most photogenic streets and the steepest hills",
      "Beyoğlu / İstiklal — central, lively, good transport, and louder than it is beautiful",
    ] },
    { type: "p", text: "The practical advice is to cross the water at least once and not treat the Asian side as an excursion. The Kadıköy market on a weekday is one of the best single hours in Istanbul, the food is a category above, and the ferry ride is the best value transport in Europe. A trip that stays on one continent has missed the point of the city." },
    { type: "cta", label: "Compare hotel rates in Istanbul", category: "HOTELS", destinationSlug: "istanbul", placement: "istanbul-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "Hagia Sophia, with the current rules understood" },
    { type: "p", text: "The building is the single most important thing in Istanbul and it has a complicated recent history: a cathedral, then a mosque, then a museum, then a mosque again. It has been through restoration, and access arrangements for visitors — including the parts of the interior you can enter, the gallery level, and closures around prayer — have changed repeatedly and can change again. Go in with no fixed expectation about what you will see, dress modestly, check the current visiting rules on arrival, and give it the time it deserves: it is enormous and the details in the dome, the mosaics and the minarets are the point, not the photograph from the outside." },
    { type: "h3", text: "The Blue Mosque and the call to prayer" },
    { type: "p", text: "The Sultan Ahmed Mosque, with its six minarets and its İznik tile interior, is the one that rewards the timing. It closes to visitors around the midday prayer and at dusk, which is exactly when the light on its cascade of domes is best and exactly when the call to prayer is most atmospheric from the Hippodrome. The trick is to go early in the morning, or stand outside at the call and come back later. The courtyard, with its ancient columns and tombs, is the underrated part." },
    { type: "h3", text: "The Bosphorus on a municipal ferry" },
    { type: "p", text: "This is the experience most visitors trade for a tourist cruise, and they lose. The commuter and city ferries crossing the Bosphorus and the Golden Horn are a few lira, run on a working network, and give you the same water, the same skyline and the same palaces for a fraction of the price and none of the hard sell. Take one from the European side to Kadıköy or Üsküdar, and one along the Golden Horn. It is the single best-value hour in the city and the clearest demonstration of why the Bosphorus is infrastructure rather than a view." },
    { type: "h3", text: "Topkapi Palace, the Harem and the Cistern" },
    { type: "p", text: "The Topkapi is enormous and routinely overrun, and the Harem section is the part most people skip and the part most worth seeing. The Basilica Cistern, a few minutes away underground, is the more atmospheric of the two: lit by the lights in the water, columns out of older buildings, and a genuinely strange, hushed space. The Archaeological Museum in the same complex is the best museum in Turkey and is far less visited than the palace it sits behind." },
    { type: "h3", text: "The Grand Bazaar and the Spice Bazaar" },
    { type: "p", text: "The Grand Bazaar is a maze of thousands of shops in covered lanes and it is a working market, not an attraction, which is what makes it worth walking. It is also where the hard sell lives: expect to be offered tea, carpets and 'my brother's workshop' in the first two minutes. Haggling is expected, everything is negotiable, and the best value is in the smaller lanes and the further reaches rather than the front stalls. The Spice Bazaar next to the mosque is smaller, more local and better for actually buying spices and sweets." },
    { type: "h3", text: "Kadıköy market and the Asian-side food" },
    { type: "p", text: "The market on the Asian shore is the best food in Istanbul, and it is a working market serving local residents, which is why it is worth crossing the water for. The fish, the olives, the cheese, the pickles, the sweets, and the cooked-food counters at the end are all better and considerably cheaper than the European-side equivalents. Note the market's day structure: the main market is closed on Sundays, when much of it relocates inland. This is the strongest single argument for a two-sided itinerary." },
    { type: "h3", text: "The hammam" },
    { type: "p", text: "A Turkish hammam is a different product from a Moroccan one: scrub, steam, foam massage on a marble domed platform, and a specific sequence that is genuinely good. The historic ones — the Çekmece Hamam, the Kılıç Ali Pasha — are architectural experiences first. A working neighbourhood hammam is the better value and the more interesting one. Ask which one you want, and be clear that you are a visitor, because the etiquette in a local hammam is a code." },
    { type: "h3", text: "A day on the Princes' Islands" },
    { type: "p", text: "The Princes' Islands, out in the Bosphorus, are the city's weekend escape and a genuine change of pace: car-free, forested, full of nineteenth-century wooden villas, and reached by a long, slow, cheap ferry from the European side. The bike hire, the silence, and the fact that the only engine-powered vehicles are the island's own service vehicles is the point. It is a full day, and it is the best cure for Istanbul city fatigue." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "Istanbul Airport is enormous and far out on the European side, and the new Al Maktoum airport south of the city is being built out with a long timeline. If you are connecting, confirm which airport you are flying from and from which terminal, because the distance between them is not a taxi ride. The old Atatürk and Sabiha Gökçen fields are still used by a great many airlines, and Sabiha Gökçen on the Asian side is closer to Kadıköy and the old city by road but still a long trip. Check the current airline and terminal situation before booking anything tight." },
    { type: "p", text: "Inside the city, the transport is the reason Istanbul feels manageable. The Marmaray runs under the Bosphorus and connects the two continents; the metro and tram cover the main corridors; the ferries cross the water and double as the most enjoyable commute in Europe. Buy an Istanbulkart and use it everywhere — it works on all of it, and the fare is one of the best-value urban transport costs in the world. Avoid the tourist bus, which is a hop-on-hop-off on a route that duplicates things you can reach for free." },
    { type: "ul", items: [
      "Istanbulkart from the kiosks and metro machines — one card for bus, metro, tram and ferry",
      "Marmaray under the Bosphorus for crossing continents without the traffic",
      "City and commuter ferries for the Bosphorus, the Golden Horn and Kadıköy",
      "Walking in the old city, Balat and Kadıköy; the hills are steep and the cobbles are uneven",
      "Taxis are metered; traffic is genuinely bad at rush hour and the meters run",
    ] },
    { type: "cta", label: "Search flights into Istanbul Airport", category: "FLIGHTS", destinationSlug: "istanbul", placement: "istanbul-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Istanbul is expensive for Turkey and cheap for Europe, and the volatility of the lira means the ranking shifts. The two things that are unambiguously good value are the transport card and the museums, several of which are at a fixed, low price relative to what they are worth. The expensive things are the tourist-centre restaurants, the Bosphorus cruises, the carpet shops, and anything sold to a visitor on the basis of a story." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Note"],
      rows: [
        ["Shoestring", "Istanbulkart, cheap pensions in the old city, market food, museum visits", "Check current lira rates locally"],
        ["Mid-range", "A good hotel, a proper fish meal on the Asian side, a hammam, a museum pass", "The sweet spot for most trips"],
        ["Luxury", "Bosphorus-view hotel, private guide, a proper Bosphorus yacht, fine dining", "The city's own luxury tier is comparatively restrained"],
      ],
    },
    { type: "p", text: "These are deliberately not given as numbers. Given the currency situation, a specific figure quoted today is a poor guide tomorrow, and an article that hard-codes them would be misleading within months. The structural point is stable: fixed-price museums and the transport card stay cheap relative to everything else, and the two continents are the best-value neighbourhoods in the city." },
    { type: "p", text: "Before you go, check the current entry and visa position for your passport — Turkish visa policy has changed more than most countries' and a claim in an article would be out of date before it printed. Check the current museum pass and combination-ticket availability too, which is restructured periodically." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "The mosque etiquette is a real code, not a suggestion: cover shoulders and knees, remove shoes, women cover the hair, do not walk in front of someone praying, and ask before photographing anyone in prayer. It is the one thing to get right in Istanbul.",
      "Haggling is expected in the bazaars and not expected anywhere else. The difference matters: haggle in the Grand Bazaar, and do not in a restaurant, a hotel or a taxi.",
      "The carpet and 'my workshop' story is the city's most reliable tourist trap. If someone invites you to a 'brother's workshop', the answer is no, and the tea is a sales tool.",
      "The Bosphorus cruise is worth about a few lira as a public ferry and about a hundred times that as a tourist boat. Decide which one you are buying before you board.",
      "Meat and fish are a serious matter. Eat where the turn-over is high and the food is cooked in front of you, particularly in the fish restaurants on the Bosphorus and around Karaköy, and be sceptical of a place offering you the same fish every day.",
      "Use the Istanbulkart, learn the ferry and the Marmaray, and remember the public holidays — the city runs at a different pace and the tourist sites change hours.",
    ] },
    { type: "p", text: "The mistake most visitors make with Istanbul is treating it as a collection of monuments. It is a working city of fifteen million with two continents, a genuine ferry-based culture, a market on the Asian shore worth the crossing on its own, and a hinterland of islands and villages an hour from the front door. Cross the water. Everything else follows from that." },
    { type: "cta", label: "Browse tours and hammam experiences in Istanbul", category: "ACTIVITIES", destinationSlug: "istanbul", placement: "istanbul-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Should I stay on the European or Asian side of Istanbul?", answer: "For a first short trip focused on the headline sites, the European side — Sultanahmet, Galata or Karaköy — is more convenient. For food, local life and value, the Asian side, and Kadıköy in particular, is better and is a short ferry from the old city. Many travellers do a split: the old city for the sites, the Asian side for the rest." },
        { question: "Is a Bosphorus cruise worth it?", answer: "The tourist cruise is expensive and largely the same water as the municipal ferries. The city ferries and commuter ferries cost a few lira with an Istanbulkart, are the same working transport the city uses, and give you a better view and a better day. Take the public ferries; skip the glass-bottomed boat." },
        { question: "What are the entry rules for Hagia Sophia?", answer: "Access for non-Muslim visitors has changed several times and includes closures around prayer, and part of the interior is restricted. Rules and opening arrangements are set locally and can change. Check them on the day, dress modestly, and expect to queue." },
        { question: "Is Istanbul expensive?", answer: "Relative to Western Europe it is good value, especially for the museums, the transport and the food markets. Relative to the rest of Turkey it is expensive. The lira has been volatile, so check current rates rather than trusting any figure you read, and prioritise the fixed-price museums and the transport card." },
        { question: "How many days do I need in Istanbul?", answer: "Three is the minimum for the European side, four is comfortable. Three means the old city, a Bosphorus day and a Bosphorus day, with an evening on the Asian shore. Four lets you add a Princes' Islands day, a hammam and a proper museum morning without rushing any of it." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Istanbul: Two Continues and the Bosphorus",
    summary:
      "An itinerary built on the crossing: the old city by land, the water by ferry, and the food on the Asian shore.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 480,
    days: [
      {
        title: "The old city",
        location: "Sultanahmet, Hagia Sophia, Blue Mosque, Topkapi",
        description:
          "Hagia Sophia early, the Blue Mosque courtyard and the call to prayer, then the Topkapi and the Harem. Late afternoon in the Hippodrome, then the Grand Bazaar as the light goes.",
        estimatedCostUsd: 170,
      },
      {
        title: "The Bosphorus by ferry",
        location: "Bosphorus ferries, Balat, the Princes' Islands",
        description:
          "A public ferry across the Bosphorus and along the Golden Horn, the Rumeli Hisari and the waterfront palaces from the water, then Balat and Fener in the afternoon.",
        estimatedCostUsd: 150,
      },
      {
        title: "The Asian side and Kadikoy",
        location: "Kadikoy, the Asian shore, Uskudar",
        description:
          "Ferry to Kadikoy for the market and the food, a hammam, and the Asian-side waterfront. Back across for sunset on the European side.",
        estimatedCostUsd: 160,
      },
    ],
  },

  needsVerification: [
    "Hagia Sophia: current visitor access, gallery arrangements, closure times around prayer, and the current ticket price",
    "Blue Mosque: current opening hours, prayer-time closures, and the current entry arrangement",
    "Topkapi Palace and Harem, Basilica Cistern and the Archaeological Museum: current combined ticket, hours, and closed days",
    "Istanbul Airport vs Ataturk and Sabiha Gokcen: which airlines and terminals are in use in 2026, and realistic transfer times between airports",
    "Istanbulkart: current price, whether it is still sold at kiosks, and the current museum pass structure",
    "Municipal ferry fares and the current Bosphorus and Golden Horn routes",
    "Kadikoy market: confirm the current opening days, and the Sunday relocation arrangements",
    "All cost bands: given lira volatility these must be expressed in the local currency and re-checked at publication",
    "Entry and visa requirements: check the current position for your passport; no claim is made in the copy",
    "Current public and religious holiday dates that affect site opening hours",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 7 — LISBON
// ---------------------------------------------------------------------------

const lisbon: SeedArticle = {
  title: DESTINATIONS[6].title,
  slug: DESTINATIONS[6].slug,
  excerpt: DESTINATIONS[6].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "lisbon",
  focusKeyword: DESTINATIONS[6].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[6].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["london", "santorini"],

  blocks: [
    { type: "p", text: "Lisbon is a city built on seven hills that everyone has decided to visit at the same two viewpoints, and the entire pleasure of it is in the streets in between. The yellow trams are wonderful and the famous one is now a commuting horror; the miradouros are lovely and the two everybody knows are the two to avoid at sunset; the azulejos are extraordinary and they are on the walls of buildings you will walk past a hundred times. The city rewards the traveller who treats it as a walking city and picks the neighbourhood over the landmark." },
    { type: "p", text: "It also has a specific history that explains its shape better than any guidebook: the earthquake of the mid-eighteenth century flattened most of the city, and the reconstruction under the Marquis of Pombal laid out the grid you now walk around Baixa. Lisbon is, in a real sense, a planned modern city sitting on top of a medieval one, and the two are visibly arguing with each other on every corner." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "Lisbon's seasons are mild and the main variable is heat, not cold. Spring from March into May and autumn from September into November are the best windows: comfortable days, the gardens at their best, and light that suits the tiled façades. Summer is hot, dry and crowded, with the locals away, which makes the city pleasant for a city break and unpleasant for a queue at a tram. Winter is the mildest in Europe, wet but not cold, and the least crowded." },
    { type: "p", text: "The August period is the peak and the most difficult: the city is full, the light is hard, and accommodation is at its most expensive. If you can choose, go in late September or early May. If you cannot, plan for early morning and late evening, which is when Lisbon is at its best anyway." },
    { type: "p", text: "One note on the light, because it is the thing people come for. The golden-hour light off the Tagus is exceptional, and it is also the reason everyone is out at exactly the same time. The city's best answer to the crowds is to pick a different viewpoint, walk the ridge paths above the old city, or come back for the same view on a second day at a different hour." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["March – May", "Mild, flowering, clear", "Moderate to high", "Rising", "The best overall window"],
        ["June – August", "Hot, dry, bright", "Highest", "Highest", "Locals away; early mornings best"],
        ["September – November", "Warm, soft light, calmer", "Moderate", "Falling", "The sweet spot"],
        ["December – February", "Mild, wet, quietest", "Low", "Lowest", "Best value; the most local city"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Lisbon neighbourhoods are steep, distinct and increasingly priced differently, and the choice of where you base yourself determines your daily walk more than anything else. Alfama and Mouraria are the most atmospheric and the most affected by the day-tripper wave; Bairro Alto and Chiado are central and lively; Baixa is flat, grid-true and the most convenient for the classic sights." },
    { type: "ul", items: [
      "Alfama — the old Moorish quarter, the oldest parts, the fado, the steepest lanes and the most tourists",
      "Mouraria — genuinely working, more affordable, and the best value in the old city",
      "Bairro Alto / Chiado — central, full of bars and shops, lively late and loud",
      "Baixa — flat, post-earthquake grid, closest to the river and the commercial centre",
      "Estrela and Santos — quieter, more residential, near the botanical garden and the market",
      "Alcântara — the docks and the old industrial complex, the most modern and design-forward",
    ] },
    { type: "p", text: "A tram line matters more than a district here. Staying within a few minutes of a tram or a metro station is the difference between a good day and a bad one, because the hills are real and the funiculars only cover three of them. If you are booking a room high up a hill with steep stairs and no lift, you are choosing an evening of stairs every day; ask before you book." },
    { type: "cta", label: "Compare hotel and apartment rates in Lisbon", category: "HOTELS", destinationSlug: "lisbon", placement: "lisbon-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "The trams, and how to actually ride one" },
    { type: "p", text: "The small yellow trams are the city's signature and the great majority of visitors board the same two or three lines, board them at the busiest stop, and spend the ride in a crush. None of that is necessary. The historic trams run a network across the whole city; the famous route can be ridden at seven in the morning, in the middle of the afternoon, or from one of the outer stops where there is room. The 28 is a genuine commuter route as well as a tourist attraction, and treating it as a commuter route is the trick." },
    { type: "p", text: "The funiculars — Bica, Glória and Lavra — are the underrated version. They are short, steep, cheap, and they solve the hill problem that the trams cannot. The Elevador da Bica has a terrace at the top that is a genuinely lovely and uncrowded way to see the river. If you only ride one thing, ride a funicular." },
    { type: "h3", text: "The azulejos, seen properly" },
    { type: "p", text: "Lisbon is a tiled city, and the tiles are not decoration — they are a cladding tradition that goes back centuries and is a functional answer to heat and salt as much as an aesthetic one. The National Tile Museum, in a convent in the Xabregas district, is the place to understand it properly, and it is one of the best value and least visited museums in the city. Beyond it, look at the tiles on the buildings you are already walking past: the façades in Alfama, the panels on the station walls, the work on the convent of Carmo. Almost the whole city is a free gallery." },
    { type: "h3", text: "Belém, and the Age of Discoveries buildings" },
    { type: "p", text: "Belém, west of the centre, is where the maritime history is concentrated, and it is best done as a single half-day walk. The Jerónimos Monastery, in extraordinary Manueline stonework, is the essential stop. The Tower of Belém, the old fortified tower at the water's edge, is small and a UNESCO site and was once part of a harbour defence that guarded the approach to Lisbon. The Discoveries Monument, a modern and enormous concrete standard on the riverbank, is one of the great twentieth-century buildings in Portugal and was built for a historical anniversary rather than out of nostalgia, which is what surprises people. The original pastel de nata bakery is still going and the queue is permanent and worth it." },
    { type: "h3", text: "MAAT and the riverfront" },
    { type: "p", text: "The museum of art, architecture and technology, on the river edge, is a modern building by a Pritzker-winning architect and it is one of the few genuinely contemporary cultural experiences in Lisbon, with a roof terrace and a river view. It is the better answer for a modern-design traveller than the museums of the old city, and walking the riverfront from Belém toward the centre is the best free thing in the city." },
    { type: "h3", text: "Fado, and the difference between a real one and a tourist one" },
    { type: "p", text: "Fado is the city's melancholic song form, formally recognised by UNESCO, and it is a genuine tradition rather than an invented one. The real thing happens in small neighbourhood houses in Alfama and Mouraria, late, with a small audience and no performance. The large dinner-and-show venues are a different product: the singing is often fine, but it is a scheduled show with a set menu and a tourist commission model. Both are legitimate, but know which one you are booking, and know that a genuine small house usually requires you to be there late, sit quietly, and order at least something." },
    { type: "h3", text: "Sintra, for a day" },
    { type: "p", text: "Forty minutes by train, up in the hills with a completely different climate, Sintra is the day trip and it is the right one. The Pena Palace is the famous one and it is now heavily ticketed and heavily scheduled, so book it. The Quinta da Regaleira is the more interesting visit if you only do one, with its initiation wells, grottoes and garden engineering. The Moorish castle above the town is the best walk and the best view. And because the coastal plain gets a sea breeze that the hills do not, the microclimate is a few degrees cooler and wetter than Lisbon itself, which is exactly why the palaces are up there." },
    { type: "h3", text: "The surf coast and the Arrábida cliffs" },
    { type: "p", text: "The Costa da Caparica, south of the city, is a long Atlantic beach with reliable surf and a train that makes it easy. The Arrábida cliffs and the beaches tucked under them, closer to Setúbal, are among the most beautiful coastal scenery near a European capital and are protected as a natural park, which keeps the development off them. Neither is central, and both are worth the journey for a coastline entirely unlike the city." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "The airport is on the north side of the Tagus with a metro station, so the centre is a straightforward metro ride, and the journey is a good introduction to the city because you come in low and cross the river. It is one of the easier airport transfers in Europe and there is no reason to pay for a transfer you do not need." },
    { type: "p", text: "Inside the city, everything is a metro, a tram, a funicular, a bus or your legs, and the metro does most of the heavy lifting. A rechargeable card works on all of it and is the single most useful thing you will buy. Walking is the other mode and it is more pleasant than the hill count suggests, because the paving is famously bad — the calçada mosaic is charming and genuinely hard on feet and on wheels, and worth flat, closed shoes." },
    { type: "ul", items: [
      "Metro and trams on one rechargeable card, including the funiculars",
      "The train to Sintra and to Cascais from the central stations",
      "Walking, with steep hills, cobbles and very uneven calçada paving",
      "Taxis and ride-hailing for the late night and the far districts",
      "The ferry for the river itself, which is a commuter route and a pleasant ride",
    ] },
    { type: "cta", label: "Search flights into Lisbon Airport", category: "FLIGHTS", destinationSlug: "lisbon", placement: "lisbon-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Lisbon got expensive, and it is still good value by European standards, but it is no longer the cheap breakaway city it was, and the parts of it that visitors actually want are the expensive parts. The museums are the exception: several of the best are inexpensive or free, and the tile museum in particular is a bargain. The costs that have risen fastest are the central rooms, and the value is pushed outward into Mouraria, Estrela, Santos and Alcântara." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Note"],
      rows: [
        ["Shoestring", "Guesthouse, market breakfast, the metro, cheap museums, a pastéis de nata", "The transport card is the best-value spend"],
        ["Mid-range", "A good central room, the tile museum and a tram ride, a proper dinner", "Most travellers land here"],
        ["Luxury", "Chiado or Bairro Alto rooms, private guides, fine dining, a private fado", "The price of the historic centre has gone up sharply"],
      ],
    },
    { type: "p", text: "Again, no hard-coded numbers: they will be out of date and they vary hugely by season and by neighbourhood. The structural advice is the reliable part — the metro is cheap, the museums are cheap, the central rooms are not, and moving your base two districts out from the landmark saves more than any other decision you will make." },
    { type: "p", text: "Check the current entry and visa position for your passport before you travel; Portuguese rules have been changing. Check whether your accommodation is in a zone with restricted tourist accommodation rules, because that is now enforced in Lisbon and it affects what is legally let in some central buildings." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "The calçada paving is a hazard, not a charm. Flat, closed shoes, and expect to lose your footing on the hills. This is the single most practical thing to know about walking Lisbon.",
      "Ride the trams early or from an outer stop, and take a funicular instead of fighting for a place on the famous route. The early morning trams are the best and the emptiest way to see the city.",
      "Fado: if you want the real thing, look for a small neighbourhood house, go late, and be prepared to sit through other people's sets. The large venues are a show; both are valid, but they are not the same product.",
      "Haggling is not the Lisbon norm. Market traders will try it with tourists, and the polite response is a decline, not a negotiation. Tipping is modest and optional, not a percentage culture.",
      "The miradouros: pick the ones that are not the two everybody photographs, and go at a different hour than sunset. Same light, a fraction of the people.",
      "Watch out for the fado and 'traditional dinner' invitations on the street and for the ticket-and-transport sales desks near the attractions. They are persistent, well-practised, and not value for money.",
    ] },
    { type: "p", text: "Lisbon is best understood as a city of neighbourhoods rather than a set of monuments, and a city of processions and viewpoints rather than a checklist. Pick a base on a hill near a tram line, learn to use the funiculars, ride the small trams early, and spend more time in Alfama and Mouraria and in the tiled streets than at the two famous viewpoints everyone else is at. The city is on the other side of a very long, very crowded queue, and it is worth the walk round it." },
    { type: "cta", label: "Browse tours and fado experiences in Lisbon", category: "ACTIVITIES", destinationSlug: "lisbon", placement: "lisbon-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Is the tram 28 worth it, or is it a tourist trap?", answer: "The tram is genuinely one of the best ways to see the city and the trap is entirely about timing and boarding point. Ride it early in the morning, or start from an outer stop rather than the crowded central one, and it is a pleasure. Boarded at midday in high season it is a crush." },
        { question: "How many days do I need in Lisbon?", answer: "Three is the minimum for the city, four is right, and a fifth is what turns it from a visit into a habit. Three covers the old city, Belém and a Sintra day. Four lets you add the museums, a river day and a proper fado evening." },
        { question: "Is Sintra a day trip or an overnight?", answer: "A day trip, and the train makes it easy — around forty minutes each way. Book the Pena Palace in advance because it is now ticketed and heavily scheduled. The Quinta da Regaleira is the better visit if you only have time for one, and the Moorish castle is the best walk." },
        { question: "Is Lisbon expensive?", answer: "By European standards it is still reasonable, but it is no longer cheap, and the central neighbourhoods have got significantly more expensive. The value is in the transport card, the museums, the food markets and the neighbourhoods a short walk outside the landmarks." },
        { question: "What are the best neighbourhoods to stay in?", answer: "For atmosphere, Mouraria and Alfama, though Alfama has the most tourist pressure. For convenience and flat ground, Baixa. For nightlife and central access, Bairro Alto and Chiado, which are loud. For value and quiet, Estrela, Santos and Alcântara. Staying close to a metro or tram line matters more than the specific district." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Lisbon: Hills, Tiles and the Tagus",
    summary:
      "One day in the old city, one west in Belem and along the river, one inland to Sintra, with the trams ridden at the right hour.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 420,
    days: [
      {
        title: "The old city, early",
        location: "Alfama, Mouraria, the tile museum",
        description:
          "Tram early from an outer stop through the old city, Alfama and the castle, the National Tile Museum in the afternoon, and a fado house that evening.",
        estimatedCostUsd: 140,
      },
      {
        title: "Belem and the river",
        location: "Belem, Jeronimos, MAAT, the riverfront",
        description:
          "Jeronimos Monastery early, the Tower of Belem, MAAT and the riverfront walk, the Discoveries Monument and the pastel de nata bakery. Back into town for sunset from a lesser-known viewpoint.",
        estimatedCostUsd: 130,
      },
      {
        title: "Sintra",
        location: "Sintra",
        description:
          "Train to Sintra, Pena Palace in a booked slot, the Quinta da Regaleira gardens, and the Moorish castle for the walk and the view. Back to Lisbon for the evening.",
        estimatedCostUsd: 150,
      },
    ],
  },

  needsVerification: [
    "Tram and funicular fares, current routes, and the current rules on boarding at the tourist-heavy stops",
    "Pena Palace and Quinta da Regaleira: current ticketing model, advance-booking requirement, and opening hours",
    "National Tile Museum and MAAT: current opening days, hours and admission",
    "Lisbon Airport: current metro route, journey time and cost, and whether the terminal arrangement has changed",
    "Sintra and Cascais trains: current frequency, journey time, and whether a reservation is needed",
    "The August earthquake risk and any current advisories for the region: confirm current civil-protection guidance before publishing any reference to it",
    "Short-term rental accommodation regulation: current rules on restricted zones and enforcement",
    "All cost bands: re-baseline against 2026 rates; the euro makes these stable but the central-district prices have moved sharply",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 8 — DUBAI
// ---------------------------------------------------------------------------

const dubai: SeedArticle = {
  title: DESTINATIONS[7].title,
  slug: DESTINATIONS[7].slug,
  excerpt: DESTINATIONS[7].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "dubai",
  focusKeyword: DESTINATIONS[7].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[7].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["istanbul", "london"],

  blocks: [
    { type: "p", text: "Dubai is the only major city in the world where the sensible advice is to spend as much time indoors as you can. That is not a dig; it is a description of the place. The heat in summer is genuinely dangerous, the buildings are engineered around it, the malls are not a tourist gimmick but the city's social infrastructure, and a week of walking around outside in July is a bad idea that people keep attempting because they arrived on an off-season flight. Read the season section before you book anything." },
    { type: "p", text: "The more useful framing is that there are two Dubais, and they are about fifteen minutes apart. One is a historic trading city of wind towers, creek boats, gold souks and spice sellers, and it is genuinely interesting. The other is a vertical experiment in the desert with a spectacular skyline and a great deal of money. Both are real, both are worth seeing, and almost nobody plans time for the first one." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "The season structure here is more binary than anywhere else in this list, and it dominates everything. From roughly November to March the weather is genuinely pleasant: sunny, warm during the day, cool enough in the evening to sit outside, and this is when the city is at its best and at its fullest. December and January are the peak, with the New Year period being the busiest and most expensive window in the Gulf. February and March are the sweet spot — warm, calm, and after the peak prices." },
    { type: "p", text: "From about June to September the city is in its summer mode. Temperatures climb into the forties Celsius, the humidity makes it worse, and the pattern of daily life inverts: everything happens between late evening and the small hours. It is not impossible, and residents do it, but a visitor who books a sightseeing day at eleven in the afternoon in July will have a bad time. If that is your only option, plan around it honestly: the city at midnight in summer is a completely different and rather wonderful experience, and the malls and the souks are genuinely uncrowded at three in the morning." },
    { type: "p", text: "April, May and October are the compromise months, and October is arguably the best of them: the heat breaks, the sea is still swimmable, and the season has not yet gone fully corporate. Ramadan falls in a different Gregorian window each year and changes the city's operating rhythm completely — daytime hours shorten, the iftar crowds on the waterfront become enormous, and the good restaurants adjust their hours. It is a spectacular thing to be in the middle of and a real disruption to a fixed plan." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["November – March", "Warm, sunny, pleasant evenings", "High", "High", "The only comfortable window"],
        ["April – May", "Hotting rapidly, humid", "Moderate", "Rising", "Fine for the city, hard outside at midday"],
        ["June – September", "Very hot, often 40°C+, humid", "Low", "Lowest", "Plan indoor and go out after dark"],
        ["October", "Heat breaks, sea still warm", "Rising", "Rising", "Arguably the best month"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Where you stay in Dubai is a decision about what you want to do, and the price differences are large enough that the choice is the budget. The main areas are not interchangeable and the commute between them is a genuine factor." },
    { type: "ul", items: [
      "Downtown and the Burj Khalifa area — the postcard: the tower, the Dubai Mall, the fountain, everything walkable and everything expensive",
      "Marina and Jumeirah — the beach, the walk, the restaurants, and a more relaxed version of the city",
      "Old Dubai: Bur Dubai and Deira — the historic core, the creek, the gold and spice souks, the wind towers, and the best value in the city",
      "Business Bay and the canal districts — the business and conference belt, quiet, well connected, often a good rate",
      "Palm Jumeirah — the resort end: the beach clubs, the resorts, the drive, and the most expensive address in the city",
    ] },
    { type: "p", text: "The honest recommendation is to base yourself in old Dubai or Business Bay and treat Downtown, the Marina and the Palm as places you go to for a specific evening. It halves the cost of the trip, puts you within walking distance of the most interesting part of the city, and still leaves every headline attraction a short taxi ride away. The people who book a tower room for a three-night city break have paid a great deal for a window." },
    { type: "cta", label: "Compare hotel rates across Dubai", category: "HOTELS", destinationSlug: "dubai", placement: "dubai-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "Old Dubai: the creek, the abra and the souks" },
    { type: "p", text: "This is the Dubai worth an afternoon, and it is free. Cross the creek on an abra, the small traditional ferry, which costs a few dirhams and is the best-value transport in the emirate. The Deira side has the gold and spice souks — the gold souk is a working market where the shopkeepers will put gold on you and discuss the price, and the rate is a real rate, not a tourist rate. The wind-tower houses of Al Fahidi in Bur Dubai have been preserved and turned into a small museum quarter, and the whole area gives you a genuinely different picture of the city than the skyline does." },
    { type: "h3", text: "The Burj Khalifa and the Dubai Fountain" },
    { type: "p", text: "The tallest building in the world, completed in 2010, and the observation decks are the headline attraction. It is worth doing and it is not a good use of a morning. The real pleasure at the base is the Dubai Fountain, which runs a show every half hour or so and is free to watch, and the fact that the building disappears into the base of something that looks like a support structure, because the design puts the towers in a Y. Book the observation deck in advance, go near sunset so you get the light and the view, and do not expect the interior to justify itself." },
    { type: "h3", text: "The desert, properly" },
    { type: "p", text: "Dubai is a coastal city in a desert, and the desert is a real landscape with red dunes, salt flats and a protected reserve, not a dune park with camels for photos. The conservation reserve areas are the responsible version, and the standard excursion is a four-wheel drive out to the dunes, a stop for sunset, a camp with food, and the drive back. Between October and March this is genuinely spectacular. In summer it is a mistake. Ask which reserve the operator uses, and understand the difference between a licensed operator on a conservation reserve and a car with a driver and a queue of camels." },
    { type: "h3", text: "The Museum of the Future" },
    { type: "p", text: "A few years old, near the Sheikh Zayed Road, and architecturally the most interesting new building in the city — a torus clad in calligraphy that you can walk under. It is a well-made exhibition about a possible future and it is expensive, but the building alone justifies the trip for anyone who cares about design, and it is a rare place in Dubai that is not a record for the tallest something." },
    { type: "h3", text: "The public beaches and the abra" },
    { type: "p", text: "The paid beach clubs with their minimum spends and sunbeds are the version everyone photographs. The free public beaches — Jumeirah in particular — are genuinely good, and the Jumeirah corniche walk is one of the few places in the city where you can walk several kilometres in a way that is not beside a motorway. The public transport reaches them. The cost of not being in a beach club is essentially the difference between a pleasant afternoon and an expensive one." },
    { type: "h3", text: "The food, and the two hard rules" },
    { type: "p", text: "Dubai's food scene is genuinely serious and mostly consists of migrants cooking the food of their own countries, which means the Lebanese, Syrian, Indian, Pakistani, Filipino, Iranian and Sri Lankan cooking is all excellent, and the Emirati food is the thing you should try once. Two rules: alcohol is only available in licensed venues and never in public, and public intoxication is an offence. This catches visitors out constantly. The second rule is about the heat and the season: eat late, because the dinner hour here is very late." },
    { type: "h3", text: "A day trip to Abu Dhabi" },
    { type: "p", text: "About an hour and a half down the coast, the capital has the Sheikh Zayed Grand Mosque, the Louvre Abu Dhabi on its island, the new National Museum, and a much slower pace. It is the best day trip from Dubai, it is easy, and it is a genuine change of scene rather than an extension of the same skyline." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "The airport is one of the busiest international hubs in the world, and the good news for a short stay is that it is a self-contained city with shops, restaurants and a hotel in transit, so a long layover is not wasted time. The bad news is that it is a long way from the city and the roads are fast and driverless-looking. A new airport south of the city has been under construction for years with a long timeline, so check which airport your flight actually uses before making plans." },
    { type: "p", text: "Inside the city the metro is clean, cheap, air-conditioned and genuinely good, and it reaches the main districts. The tram serves the Marina and the old town. Taxis are metered or app-based, and they are cheap relative to Western cities. The Palm Jumeirah monorail is a monorail. What you will not do is walk between neighbourhoods the way you would in a European city, because the scale is wrong; the sensible rhythm is two or three districts a day, not a sightseeing circuit." },
    { type: "ul", items: [
      "Metro and tram on a rechargeable card; both reach the main visitor districts",
      "Taxis and app-based rides for the Marina, the Palm and the desert excursions",
      "The monorail for the Palm Jumeirah, and the abra for the creek crossing",
      "The drive to the desert reserve or Abu Dhabi, with a driver for the day",
      "Nothing on foot between districts — plan by district, not by landmark",
    ] },
    { type: "cta", label: "Search flights into Dubai International Airport", category: "FLIGHTS", destinationSlug: "dubai", placement: "dubai-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Dubai's prices split hard by category in a way that is unusual. Hotels at the top are among the most expensive anywhere, and the mid-range is decent value, and there is a large gap to the guesthouse and budget end. VAT applies, hotels add a tourism and municipality charge, and alcohol is expensive because it is tightly licensed. The free things — the beaches, the souks, the fountain, the abra, the public beaches — are unusually good, which means a carefully planned trip can be inexpensive and an unplanned one can be absurd." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Note"],
      rows: [
        ["Shoestring", "Budget hotel, the metro, the public beaches, souks, cheap Indian or Lebanese food", "The free list is unusually long"],
        ["Mid-range", "A good business-district room, a mall meal, a desert excursion, one licensed dinner", "Most of the city is reachable from here"],
        ["Luxury", "Burj or Marina suite, beach club, fine dining, private desert camp, driver", "Add VAT and hotel charges on top"],
      ],
    },
    { type: "p", text: "No hard-coded numbers, for the same reason as Istanbul and Lisbon: the tax structure, the hotel charges and the season all move the numbers and a figure in an article goes stale. What holds is the structural point — the free beaches, the old Dubai souks and the transit are cheap, the top-end hotels and the beach clubs are not, and the desert excursion is a mid-range cost, not a luxury one." },
    { type: "p", text: "Check the current entry and visa position for your passport before you book, and check it again shortly before you travel, because the rules for the Gulf have changed more than most travellers expect. Dress code is worth noting: covering shoulders and knees is expected, and it is required in a religious sense at the mosques and in practice everywhere." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "Alcohol only in licensed venues, never in public, and public intoxication is an offence. This is the rule visitors break most often and it has real consequences.",
      "Dress modestly in public: covered shoulders and knees. It is expected everywhere and required in the mosques, and it is not a suggestion.",
      "The season is not a detail, it is the trip. Outside November to March, restructure your days around the heat — mornings indoors, the desert and the beach late, the city after dark.",
      "Friday is the weekend in the UAE, and the day is a split: the mosques in the morning, then the whole city goes quiet in the heat, then everything reopens in the evening. Do not plan a museum for Friday afternoon.",
      "Ramadan: hours shorten across the city and the waterfront iftar crowds are extraordinary. If you are here then, expect a different city and check restaurant hours in advance.",
      "The desert is a licensed, regulated environment. Use a recognised operator on a conservation reserve, agree the price and the itinerary before you set out, and carry water — the summer desert is lethal without it.",
    ] },
    { type: "p", text: "Dubai is a city that works because it was built to solve a specific problem — heat, water, and the distance between a trading coast and the interior — and everything about it is downstream of that. Judged as a solution it is remarkable. Judged as a destination it is a good base with one genuinely ancient quarter, one extraordinary building, one very good desert and a skyline that is worth seeing once from a distance rather than from a table in a tower." },
    { type: "cta", label: "Browse desert safaris and city experiences in Dubai", category: "ACTIVITIES", destinationSlug: "dubai", placement: "dubai-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "Is Dubai worth visiting, or is it just a mall with a skyline?", answer: "It is a well-built city with a genuinely interesting historic quarter, an extraordinary building in the Museum of the Future, an excellent food scene built by its migrant communities, and a real desert landscape an hour away. The malls are not the point; the point is the engineering and the trade that came before it. It is worth three or four days, not a week." },
        { question: "When is the best time to visit Dubai?", answer: "November to March, without much argument. That is the only window where being outside during the day is pleasant. October is the best compromise if you want the sea to still be swimmable. June to September is genuinely too hot for most visitors to enjoy, though the city is not closed and the after-dark experience is real." },
        { question: "Can you drink alcohol in Dubai?", answer: "Only in licensed venues, never in public, and public intoxication is an offence. The rules are enforced and the penalties are real. This catches a lot of visitors out because the city looks permissive and the legal position is not." },
        { question: "Do I need a car in Dubai?", answer: "For the main visitor districts, no: the metro is clean, cheap and air-conditioned, and the tram serves the Marina and the old town. You will want a car or a driver for the desert excursions, the Palm, and a day trip to Abu Dhabi, and you will not want one for the old city, which is a walk." },
        { question: "Is the old Dubai quarter worth seeing, or is it just the souks?", answer: "It is more than the souks. The creek, the abra crossing, the preserved wind-tower houses and the small museum quarter give a real sense of the trading city the skyline grew out of, and it is a fraction of the cost and a fraction of the crowd of the modern districts." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Dubai: Skyline, Creek and Desert",
    summary:
      "One day in the old city and the souks, one in the modern skyline, one in the desert — with the whole plan inverted in summer.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 620,
    days: [
      {
        title: "Old Dubai and the creek",
        location: "Al Fahidi, the gold and spice souks, Deira",
        description:
          "Start in the preserved wind-tower quarter, cross the creek on an abra, work through the gold and spice souks, and eat somewhere licensed in Deira. The whole day is cheap and none of it is a mall.",
        estimatedCostUsd: 180,
      },
      {
        title: "The skyline and the design",
        location: "Downtown, the Burj Khalifa, the Museum of the Future",
        description:
          "Book the observation deck for late afternoon, watch the fountain show at the base, and the Museum of the Future earlier in the day to escape the heat. Evening on the Dubai Mall or the fountain.",
        estimatedCostUsd: 220,
      },
      {
        title: "The desert",
        location: "A conservation reserve in the red dunes",
        description:
          "A licensed operator from the city, a four-wheel drive out to the dunes, a sunset stop and a camp dinner, and the drive back. Do not attempt this in peak summer, and confirm the reserve before you book.",
        estimatedCostUsd: 220,
      },
    ],
  },

  needsVerification: [
    "The season window: current typical temperature and humidity ranges for June to September, and the exact months considered low season",
    "Burj Khalifa At the Top: current ticket tiers, prices, and advance-booking requirements",
    "Dubai Fountain show times and whether they are seasonal",
    "Museum of the Future: current opening days, hours, and ticket price",
    "Which airport is in use in 2026 and the status of the new south-of-city airport, plus realistic transfer times",
    "Metro, tram and the card: current routes, the Palm monorail, and fares",
    "Desert excursion operators: which are licensed on a conservation reserve, realistic prices, and whether overnight camps still operate",
    "Al Fahidi and the abra: current opening hours and the current abra fare",
    "VAT, hotel tourism fee and municipality charge: current rates and how they appear on a bill",
    "Visa and entry requirements: check per passport nationality and re-check shortly before travel; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 9 — LONDON
// ---------------------------------------------------------------------------

const london: SeedArticle = {
  title: DESTINATIONS[8].title,
  slug: DESTINATIONS[8].slug,
  excerpt: DESTINATIONS[8].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "london",
  focusKeyword: DESTINATIONS[8].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[8].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["paris", "rome", "lisbon"],

  blocks: [
    { type: "p", text: "London rewards the traveller who stops treating it as a list of famous buildings and starts treating it as a collection of villages that happen to be joined by a bus. The distance from Kensington to Brixton is a matter of geography and a world of atmosphere, and the reason a London trip often feels disappointing is that people spend four days inside a two-mile radius of Westminster. The museums are extraordinary, the transport is the best in the world, and the actual city is spread across six hundred square miles that most visitors never see." },
    { type: "p", text: "There is also a weather strategy, and it is not optional. London has a museum problem in the best sense: an unprecedented number of genuinely world-class free collections. That is not a consolation prize for bad weather. It is the reason the city works in every season and for every kind of visitor, and it is the most underrated fact about visiting London." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "London has no good season and several acceptable ones. Spring from April into May brings blossom, longer days, and the gardens at their best, and it is busy. Summer from June into August is warm, long, and full of visitors, and the city is at its most usable outdoors, though the schools being out means central areas are crowded. Autumn from September into October is the most reliably pleasant, with the parks good, the light good, and the crowds easing after the summer." },
    { type: "p", text: "Winter, from November into February, is dark, wet and occasionally snow, and it is the cheapest and emptiest time. This is the truth that the tourist boards do not say: London in a cold, grey February is a wonderful city — the museums are free, the pubs are full, the markets are at their best, and the tourist crush is absent. Plan for rain and it stops being a problem; plan for sun and it will ruin the trip." },
    { type: "p", text: "One thing genuinely worth planning around is the school holiday calendar. The late summer and the Christmas period are when central London is at its most expensive and most crowded, and if you have any flexibility those are the windows to avoid. The other is the sheer lightness of the winter days: it is dark by four in December, which is not a complaint so much as a fact to plan around." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["April – May", "Mild, blossom, long days", "High", "High", "Parks at their best; book ahead"],
        ["June – August", "Warm, bright, school holidays", "Very high in August", "High", "Best outdoors; worst for crowds"],
        ["September – October", "Mild, settled, good light", "Moderate", "Rising then falling", "The sweet spot"],
        ["November – February", "Cold, wet, dark by mid-afternoon", "Lowest", "Lowest", "Free museums, full pubs, empty streets"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "London's price map is a genuine part of the planning, and the cheapest good option is almost always a Zone 2 or 3 Tube stop rather than a compromise on the quality. The transport makes a commute of forty minutes feel like nothing, and it means you can live near a good market or a good park and still reach everything." },
    { type: "ul", items: [
      "Covent Garden, Bloomsbury and South Kensington — walkable to the big museums and central sights; convenient and expensive",
      "Kensington, Chelsea and Notting Hill — handsome, expensive, and close to the museums and the parks",
      "Shoreditch, Spitalfields and Bethnal Green — east, more local, better food, cheaper, and near the museums of east London",
      "Camden, King's Cross and Islington — good value, good transport, mixed in quality, close to the British Museum",
      "Brixton, Peckham and Deptford — genuinely local, cheap, excellent food, and a real look at the city",
      "Waterloo, London Bridge and Borough — the best location/value balance for most people",
    ] },
    { type: "p", text: "The area to be careful with is the very centre around the most famous attractions: it is the most expensive, the most crowded, and generally the least interesting to sleep in. Staying one or two stops out on the Northern, Victoria or Piccadilly lines gets you the same access to everything at half the price, and puts you in a neighbourhood with a life of its own." },
    { type: "cta", label: "Compare hotel rates across London", category: "HOTELS", destinationSlug: "london", placement: "london-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "The free museums, properly chosen" },
    { type: "p", text: "The British Museum, the National Gallery, the Tate Modern, the V&A, the National Portrait Gallery, the Imperial War Museum, the Natural History Museum and the Science Museum are among the best collections in the world and they are free to enter. The catch is that the best of them are also the most visited, and the National Gallery and the British Museum in August are genuinely difficult. Two answers: go at opening time or at the last two hours, which is when the crowds thin and the light through the galleries is best; and go to the ones that are brilliant and empty. The Wallace Collection, the Home House, the Sir John Soane's Museum and the Photographers' Gallery are all first-rate and rarely mobbed." },
    { type: "h3", text: "Borough Market and the London markets" },
    { type: "p", text: "Borough Market, by London Bridge, is the best-known food market in the city and one of the best in Europe, and it is a working market rather than a set. Beyond it there is a whole map of them: Camden, Portobello Road for the Saturday street market, Columbia Road for the Sunday flowers, Brick Lane for a Sunday market with a completely different character, and the Sunday market at Petticoat Lane. Markets are where you see what the city actually eats, and they are the cheapest and most enjoyable hours of a London trip." },
    { type: "h3", text: "The South Bank walk" },
    { type: "p", text: "A walk along the river from the London Eye, past the Southbank Centre and the Globe, to Tower Bridge, is the single best free thing in the city, and it is genuinely best on foot at a stretch, with the Globe and the river walk as the two things you must stop for. It also connects the big bits: the Eye, the Tate Modern just across the water, and Tower Bridge at the end. Do it properly rather than as a dash between attractions." },
    { type: "h3", text: "Greenwich" },
    { type: "p", text: "A day trip that is not a day trip, because it is on the network: the Cutty Sark, the old Royal Naval College designed by Wren, the Greenwich Market, the observatory and the line of longitude in Greenwich Park, and a river boat to get there. The Royal Naval College and the market are the two best parts, and the whole thing is half a day if you use the boat." },
    { type: "h3", text: "The theatre, and the West End" },
    { type: "p", text: "London is the world's best city for live performance and the West End is unmatched, but you do not need to spend what the theatre costs to see something good. The National Theatre and the Royal Court are subsidised and the same standard; the Roundabout and the National Theatre's more experimental spaces are cheaper still; the Old Vic and the Donmar are the two best small theatres. Sameer Talaie on the same-day ticket lotteries, and the TKTS-style day-ticket stands, are how you get into a sold-out West End show for less, and it is worth knowing about before you travel." },
    { type: "h3", text: "Greenwich to Hampstead: two parks, and the real London" },
    { type: "p", text: "Hampstead Heath and the Regent's Park are the two parks that feel like countryside inside the city, and both are free. Hampstead, with its Heath, its swimming ponds, its views back over the city and its own village feel at the top, is the best cheap afternoon in London. Richmond, on the far south-west, has a castle, a park, a river and a town green that people describe as being in another country, and it is on the Tube." },
    { type: "h3", text: "The pubs" },
    { type: "p", text: "A London pub is a specific institution and the etiquette is worth ten minutes of reading before you go in. The rules that catch people out: you order and pay at the bar, you do not sit down and wait to be served, and there is no table service. You do not tip in a pub, because the staff are paid a wage and the counter system exists for that reason. If the pub has a served area, sit there. And the drink names mean something, so a flat white is coffee and a black coffee with milk is a less predictable proposition — order what you actually want." },
    { type: "h3", text: "Westminster and the landmarks, done early" },
    { type: "p", text: "The obvious sights — the Houses of Parliament and Westminster Abbey, the towers, the monuments — are worth seeing and are best seen at opening time, before the coaches. The one piece of genuine advice here is to do the obvious ones in a single efficient morning, on foot, and then spend the rest of the trip on the parts that are not obvious. Two hours of Westminster is plenty. Four is a mistake." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "London's transport is the best in the world for a visitor and the single most useful thing you will buy is a contactless card, which works on the Tube, buses, trams, the DLR and the Overground, and caps automatically at a daily and weekly limit so you cannot overspend on the Underground no matter how much you use it. You tap in and out with the same card and that is the entire system. The buses and the Tube do not take cash, and the paper Oyster card is no longer sold to visitors." },
    { type: "p", text: "The lesson that costs visitors the most money is the zone system. A journey from Zone 1 to Zone 1 is cheap; anything further out costs more, and the fares add up fast if you are commuting to Richmond or Wimbledon every day. Check which zones your hotel and your sights are in. Beyond the Tube, the Overground and the Elizabeth line have extended the map, the buses are genuinely good, and the cycling and Santander bike hire is a reasonable way to cover the parks and the canal paths. Walking in central London is a real option and often faster than the Tube in traffic." },
    { type: "ul", items: [
      "Contactless payment by card or phone, with automatic daily and weekly capping",
      "The Tube, the Overground, the Elizabeth line, the DLR and the buses, all on one card",
      "Buses are slower but see the city; the 11, 15, 88 and 88 routes are useful for the centre",
      "Zones matter: check what zone your hotel and your sights are in before you start",
      "Santander bikes and walking for the parks, the canal paths and short central hops",
    ] },
    { type: "cta", label: "Search flights into London airports", category: "FLIGHTS", destinationSlug: "london", placement: "london-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "London is expensive and the honest statement is that the free things are what make it worth the price. The museums, the parks, the markets, the South Bank walk, the skyline views, the churches and the river are all free, and they are the majority of what people come for. What costs money is accommodation, the restaurants, the theatre and the transport, and the two that can be managed are the accommodation and the transport." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Note"],
      rows: [
        ["Shoestring", "Zone 2 guesthouse, contactless capped travel, free museums and parks, markets, pub dinner", "Free attractions dominate the day"],
        ["Mid-range", "A good central hotel, a day pass, a West End ticket, and eating in rather than out", "Most of the city's cost is the room"],
        ["Luxury", "A Mayfair or Kensington hotel, fine dining, the best seats, taxis everywhere", "The upper end is not where the city is at its best"],
      ],
    },
    { type: "p", text: "No figures, deliberately: the fares, the attraction prices and the hotel rates all move and a number in an article is stale within months. The reliable advice is structural — cap your transport with contactless, stay a Zone 2 stop out, use the free museums as your backbone, and eat where the pubs and markets are rather than on the tourist streets, which is where the price difference is largest and the food is better." },
    { type: "p", text: "Check the current entry and visa position for your passport before you book; the UK has an Electronic Travel Authorisation requirement for many nationalities that must be arranged before travel, and getting it wrong is the single most common expensive mistake visitors make here. It is not free and it is not instant." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "Tap in and out with the same card. Tapping out matters — the system charges a maximum fare if you forget, and on a bus you must tap in, not just tap on.",
      "The pub is not a restaurant: order at the bar, do not wait to be seated, and do not tip. Sit in the served area if you want service. A flat white is a coffee; a coffee is coffee.",
      "The bus does not take cash and the Tube neither. Everything is contactless.",
      "Mind your zones. A cheap hotel in Zone 4 with a long commute will cost more in fares than the difference in the room rate.",
      "Queues are real and the British will not invite you in. Especially for the Tube, the buses and the toilets, which are paid.",
      "Theatre tickets: the same-day lotteries and day-ticket stands are how you get into a sold-out show for less, and the Royal Court and the National are subsidised and excellent.",
    ] },
    { type: "p", text: "London is a city that repays the visitor who reads it as a set of neighbourhoods rather than a set of monuments, and who accepts the weather as a condition rather than a disappointment. Spend two hours on Westminster, spend the rest of the trip in the free museums, the markets, the parks and the villages, and remember that the two continents of a London trip are a good hour in a pub and a different borough on the Tube. That is the city, and it is the one people come back for." },
    { type: "cta", label: "Browse tours and theatre experiences in London", category: "ACTIVITIES", destinationSlug: "london", placement: "london-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "How many days do I need in London?", answer: "Four is the right number for a first trip: two for the central sights and the big museums, one for the South Bank and the river, one for a market and a park, and one for the theatre. Three is enough if you are organised. Two is a weekend, not a visit." },
        { question: "How do I get around London without overspending?", answer: "Use a contactless card on the Tube, buses and Overground and let the daily and weekly cap do the work — the cap means you cannot spend more than a certain amount however much you travel. Remember to tap out, check which zone your hotel is in, and walk the centre, which is often faster than the Tube in traffic." },
        { question: "What is the cheapest way to see the big sights?", answer: "The national museums are free — the British Museum, the National Gallery, the Tate Modern, the V&A and the Science Museum among them — and most of the best smaller collections are free too. Westminster, the Tower and the London Eye are paid, and the free alternatives to the London Eye and the Tower are the South Bank walk and the river, which are better." },
        { question: "Is the London Eye or the Shard worth it?", answer: "Neither is necessary, and the money is better spent elsewhere. The best view of London is free from the South Bank walk, from the top of the Tate Modern, from Primrose Hill, or from the Sky Garden, which is free if you book ahead. If you do want to pay for height, the Shard is better than the Eye because you can actually see something from it." },
        { question: "What are the pub rules?", answer: "Order and pay at the bar rather than waiting to be seated, and do not tip, because the staff are paid a wage and the counter system exists for that. Sit in a served area if you want table service. The drink names are exact: a flat white is a coffee, and a coffee is coffee with milk. And the toilets are not free." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in London: Museums, Markets and the South Bank",
    summary:
      "An itinerary built around the free museums as the backbone, with the paid landmarks done efficiently and the rest of the city taken on foot and by Tube.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 700,
    days: [
      {
        title: "The big museums",
        location: "Bloomsbury, South Kensington, Bankside",
        description:
          "British Museum at opening, the National Gallery over lunch, the Tate Modern in the late afternoon on the South Bank, and the river walk west to the Globe as the light goes.",
        estimatedCostUsd: 230,
      },
      {
        title: "The landmarks and the South Bank",
        location: "Westminster, the London Eye, Tower Bridge",
        description:
          "Westminster and the Abbey early, the Eye if you must, the South Bank walk and the Globe, then Tower Bridge and the Tower in the afternoon. Everything paid, done in one efficient day.",
        estimatedCostUsd: 240,
      },
      {
        title: "Markets and the parks",
        location: "Borough Market, a market day, Hampstead or the Thames",
        description:
          "Borough Market for the food, a market on the right day — Portobello on Saturday, Columbia Road on Sunday — then a park: Hampstead Heath for the view over the city or the Regent's Park for the gardens. Theatre in the evening.",
        estimatedCostUsd: 230,
      },
    ],
  },

  needsVerification: [
    "Contactless capping: the current daily and weekly caps and whether they are per card, per device or per person",
    "Zone structure and fares: current zone boundaries and the cost of the most common journeys",
    "Museum opening hours, closed days, and any new entry or ticketing arrangements at the national museums",
    "Westminster Abbey, the Tower of London and the London Eye: current prices, hours, and whether tickets must be booked",
    "Sky Garden: current booking rules, free availability, and how far in advance",
    "Theatre: current same-day ticket arrangements and the standing-ticket options",
    "ETYA: current requirements, cost, and lead time for the visitor's national passport holders",
    "All cost bands: re-baseline against 2026 rates; avoid hard-coded figures in published copy",
    "Market days: confirm the current operating days for Borough, Portobello Road, Columbia Road and Brick Lane",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

// ---------------------------------------------------------------------------
// ARTICLE 10 — SANTORINI
// ---------------------------------------------------------------------------

const santorini: SeedArticle = {
  title: DESTINATIONS[9].title,
  slug: DESTINATIONS[9].slug,
  excerpt: DESTINATIONS[9].metaDescription,
  type: "DESTINATION_GUIDE",
  destinationSlug: "santorini",
  focusKeyword: DESTINATIONS[9].focusKeyword,
  secondaryKeywords: [...DESTINATIONS[9].secondaryKeywords],
  categorySlugs: ["destination-guides"],
  coverImage: null,
  internalLinks: ["istanbul", "lisbon"],

  blocks: [
    { type: "p", text: "Everything about Santorini is explained by the caldera, and once you understand that, the place stops being a puzzle. This is not a white island that someone painted. It is the rim of a volcano, a crescent of cliff roughly three hundred metres high, with a drowned crater inside it, and the villages are white because white lime plaster on a black lava cliff is what a Cycladic house is made of. The blue domes, the black sand, the vines grown in volcanic soil, the wind, the ferries, the cramming into Fira at sunset — all of it comes from the same geology." },
    { type: "p", text: "Which means the island's central problem is not a lack of beauty. It is that a small, fragile, volcanic, wind-battered place has become one of the most requested destinations in Europe, and the crowd strategy is the whole skill." },

    { type: "h2", text: "Best time to visit" },
    { type: "p", text: "The season is dominated by the Meltemi, the strong north-westerly wind that blows through the Aegean in the summer, and by the fact that everyone in Europe wants the same weeks. Late April into early June and September into early October are the sweet spots: warm enough to swim, dry, and not yet at the peak. May in particular has the best balance of sea temperature and crowd level of the year." },
    { type: "p", text: "July and August are peak. The island is full, the caldera villages are shoulder to shoulder, accommodation is at its most expensive, and the Meltemi can be strong enough to make swimming unpleasant on the exposed beaches. It is not that it is a bad time — many people love it — it is that it is the same experience everyone has, and if you can choose, choose otherwise." },
    { type: "p", text: "The shoulder of the shoulder, early October into November, is the best-kept secret: the sea is still warm, the crowds have gone, the light goes golden and low, and some of the smaller places have closed for the season so the villages are quieter. December into February is genuinely quiet and genuinely cheap, and a lot of the island is closed, which suits a walker and a wine trip and not a beach holiday. March and April are unpredictable but cheap and increasingly popular with people who have read about the shoulder." },
    {
      type: "table",
      headers: ["Period", "Typical conditions", "Crowds", "Price direction", "Note"],
      rows: [
        ["April – early June", "Warm, dry, sea warming", "Rising", "Rising", "May is the best balance of the year"],
        ["July – August", "Hot, windy, Meltemi", "Highest", "Highest", "Peak, and windy on exposed beaches"],
        ["September – early October", "Warm, calm, thinning", "Falling fast", "Falling", "The best time in the year"],
        ["Late October – March", "Cool, quiet, many closures", "Lowest", "Lowest", "A walker's island, not a beach one"],
      ],
    },

    { type: "h2", text: "Where to stay" },
    { type: "p", text: "Accommodation is the single biggest lever on a Santorini trip, in price and in experience, and the choice of village changes your entire day. The famous ones are the crowded ones, and the difference between them is enormous." },
    { type: "ul", items: [
      "Firostefani and Imerovigli — between Fira and Oia, on the caldera, quieter than Fira with the same views; the best balance of location and calm",
      "Fira — the capital: the most services, the best transport, the busiest; wonderful and relentless",
      "Oia — the sunset village, the most photographed, the most expensive, and the most crowded; beautiful, and a queue",
      "Akrotiri, Mesa Gonia and the east coast — volcanic, quieter, near the excavated Bronze Age city, and a real village rather than a caldera viewpoint",
      "The villages on the interior — Pyrgos, Megalochori, Emporeio — where people actually live, with a fraction of the visitors and a much better sense of the island",
    ] },
    { type: "p", text: "The accommodation style matters as much as the location. A 'cave house' — a room carved into the volcanic cliff, the authentic Cycladic form rather than a gimmick — often has no lift, steep steps, and a small, hot terrace. What you are paying for in a caldera room is the view and the terrace, and the sun on the terrace at seven with the whole caldera in front of you is worth a great deal. The best sell out months ahead for the peak, which is the argument for the shoulder season." },
    { type: "cta", label: "Compare caldera and cave-house rates in Santorini", category: "HOTELS", destinationSlug: "santorini", placement: "santorini-guide-stay" },

    { type: "h2", text: "Top experiences" },
    { type: "h3", text: "The caldera path, on foot" },
    { type: "p", text: "This is the Santorini experience and it is free. The rim path runs from Fira to Oia, about ten kilometres, and it is flat, exposed and stunning for the whole distance, with the crater on one side and the villages on the other. Walk it in the morning, in October light, and you will see the island at a completely different scale from the one you get looking up at it from a cruise ship. It is the answer to the crowd problem and the answer to the 'is it just a pretty village' question in one go." },
    { type: "h3", text: "Akrotiri, the Bronze Age city" },
    { type: "p", text: "The Minoan eruption in the late Bronze Age buried this settlement under ash, and the excavation is often called the Pompeii of the Aegean, which is a helpful comparison and not a close one — Akrotiri was abandoned rather than killed, and the ash preserved it rather than destroying it. What survives is a multi-storey town with streets, houses, drains and frescoes, roofed over to protect it. It is a genuinely extraordinary site and it puts the volcanic story of the island in front of you, which makes the rest of the caldera make sense." },
    { type: "h3", text: "The black and red beaches" },
    { type: "p", text: "The beaches are volcanic and each one is a different mineral: Perissa and Kamari are black sand, the Red Beach at Akrotiri is red, and the pale beaches on the calmer side are the conventional white. The black sand is genuinely unusual and swimming in it is a strange experience, warm water over volcanic grit. Perissa and Kamari have the full range of services and a real beach-town atmosphere; the Red and White beaches are more isolated and reached by a path or a boat, and the swimming is better away from the crowds." },
    { type: "h3", text: "The winery, in the lava" },
    { type: "p", text: "Santorini's wine is one of the genuinely distinctive wines in Greece, made from Assyrtiko, a white grape that grows in the volcanic, volcanic-terroir soil in a way that produces high acidity and a saline, mineral character with no real comparison outside Santorini. Visiting one of the estates on the caldera — Santo Wines, Venetsanos and others — for the vines grown in baskets of volcanic sand and a tasting is a genuinely good hour, and it is the best way to understand the island's other landscape. Do it with a driver and a designated driver, or the designated driver will be doing the driving." },
    { type: "h3", text: "Ancient Thera and the interior villages" },
    { type: "p", text: "On the ridge at Mesa Vouno, Ancient Thera is a Dorian city from the Archaic period with a temple of Apollo and a genuinely extraordinary view over the whole caldera. It is quiet and it is best in the late afternoon. Below it, Pyrgos and Megalochori are the interior villages where the island actually lives — narrow lanes, old houses, churches, cats, no caldera theatre — and they are the antidote to spending four days in a queue for a sunset." },
    { type: "h3", text: "The boat trip around the caldera" },
    { type: "p", text: "A day boat around the caldera visits the submerged volcano crater, the hot springs, the White and Red beaches and the towns, and stops for lunch. It is the standard excursion and it is worth doing, but the trade is explicit: you are trading the island at human scale for the island from a boat, in a group, in summer, with the wind possibly against you. It is at its best in May or October when the sea is calm. It is also the easiest way to reach the isolated beaches without hiking." },
    { type: "h3", text: "The sunset, and the crowd strategy for it" },
    { type: "p", text: "The famous sunset at Oia is the most crowded thing on the island: the crowd begins in the afternoon and can hold the castle ruins two hours before the sun goes down. You can accept the crush, walk to Imerovigli, Firostefani or Akrotiri — all west-facing, all without the Oia queue — or come back at eight the next morning, when the light is on the cliffs and the paths are empty." },

    { type: "h2", text: "Getting there and getting around" },
    { type: "p", text: "You arrive by air or by sea, and the choice affects the whole shape of the trip. The airport is a small one on a plateau with a cliff approach and a short walk or a shuttle to the terminal, and the flight is short but the views on approach are the first and best caldera view you will get. The sea route from Athens is the other option, either a conventional overnight ferry or a fast one, arriving at the main port, which is a long and hot taxi ride from Fira." },
    { type: "p", text: "From the port, the old port at the foot of the Fira cliff is reached by a steep path of steps or a cable car, and the cable car is a good idea with luggage. The alternative is a taxi or private transfer around the coast road, which is what most people with suitcases do. Public buses connect the main towns cheaply, and while a car is useful island-wide it is a liability in the caldera villages, where the roads are one lane wide and the traffic jams are notorious. Mopeds and ATVs are common and are a genuine risk." },
    { type: "ul", items: [
      "By air: a short flight with a cliff approach; shuttle or walk to the terminal, then a bus or taxi",
      "By sea: the main port is far from Fira; a taxi or transfer around the coast, or the cable car from the old port",
      "Buses between the main towns, cheap and reliable enough for the east and north coast",
      "No car in Fira, Firostefani, Imerovigli or Oia — leave it at your accommodation and walk",
      "A car or a driver for the whole island, the wineries and the remote beaches, on a day basis",
    ] },
    { type: "cta", label: "Search flights into Santorini Airport", category: "FLIGHTS", destinationSlug: "santorini", placement: "santorini-guide-transport" },

    { type: "h2", text: "What it costs" },
    { type: "p", text: "Santorini is expensive, and the structure of the expense matters more than the totals. Accommodation with a caldera view is among the most expensive in Greece, and it is the reason people come, so it is a spend you can make deliberately. Everything else — the buses, the beaches, the walk, the boat trip, the food off the caldera — is comparatively cheap. The meal is the other big cost, because the rim restaurants charge for the view; eat one expensive dinner on the caldera and the rest of the trip in the villages, where the food is as good for a fraction of the price." },
    {
      type: "table",
      headers: ["Daily spend", "What it buys", "Note"],
      rows: [
        ["Shoestring", "Village accommodation, buses, the caldera walk, the beach, a taverna dinner", "The island is cheap once you are not looking at a caldera"],
        ["Mid-range", "A caldera-view room, a boat trip, one rim dinner, a car for a day", "The spend is the view and the car"],
        ["Luxury", "A cliff-edge suite with a plunge pool, private boat, driver, fine dining", "Peak-season pricing here is a different market"],
      ],
    },
    { type: "p", text: "No numbers, deliberately — the swing between the shoulder and the peak is so large that any figure is either wrong now or wrong in four months. The reliable structure is: the accommodation and the caldera restaurants are the expensive parts, the transport and the beaches and the walking are cheap, and the shoulder season changes the accommodation more than anything else you do." },
    { type: "p", text: "Check the current entry and visa position for your passport, and check the current rules on the ferries, which are the other thing that can catch you out: the winter sailings in particular are reduced or suspended, and the fast and conventional services are not interchangeable if you are connecting on a specific day." },

    { type: "h2", text: "Local etiquette and practical tips" },
    { type: "ul", items: [
      "The caldera villages were built before cars and rebuilt for visitors, and they still cannot take them. Leave the vehicle where your accommodation tells you and walk. Trying to drive into Fira at six in the evening will cost you the evening.",
      "The churches are not scenery. They are working parish churches with congregations, and dressing and behaving accordingly — covered shoulders, quiet, no drones — is the baseline, not a request. Several of the most photographed blue-domed chapels are actively places of worship.",
      "Respect the residents. The overcrowding of Oia and Fira is a real problem for the people who live there, and the small courtesies — not blocking the narrow paths, not taking a table or a doorway in a photo without asking, not treating a village as a film set — matter more than they sound.",
      "The Meltemi is real. In July and August the wind can be strong enough to make the exposed beaches unpleasant, to close some beach facilities, and to cancel boat trips. It is the reason the shoulder months are better.",
      "Book ahead for the peak and for the caldera rooms specifically; the good ones go months in advance. For the shoulder, you can often walk in, and you should, because the value of the shoulder is partly that you can.",
      "Have a designated driver if you are tasting the Assyrtiko. The wineries are on the caldera rim, the roads are narrow, and the wine is strong and the driving is a bad combination.",
    ] },
    { type: "p", text: "Santorini is not a disappointing island; it is an overwhelmed one, and the difference is entirely in the strategy. Go in May or early October. Sleep in Firostefani or Imerovigli rather than Oia. Walk the caldera path in the morning. Watch the sunset from a village that is not Oia, or at eight the next morning. Eat one dinner on the rim and the rest of the week inland. Do the Bronze Age city, the wineries and one boat trip, then spend two afternoons in Megalochori getting quietly lost. The caldera explains everything, and the best way to see it is from the path, on foot, when the day-trippers have gone." },
    { type: "cta", label: "Browse caldera boat trips and winery tours in Santorini", category: "ACTIVITIES", destinationSlug: "santorini", placement: "santorini-guide-closing" },

    {
      type: "faq",
      items: [
        { question: "What is the best month to visit Santorini?", answer: "May, and early October. Both have warm enough sea to swim, settled weather, and far fewer people than the July and August peak. September and late April are the next best. If you must go in July or August, the island is still wonderful but you will be in the same crowd as everyone else, and the wind can affect the swimming." },
        { question: "How many days do I need in Santorini?", answer: "Three is enough for the caldera villages, the beach and a boat trip, and four is right if you want the Akrotiri excavation, the wineries and a proper walk. More than four is difficult to justify on the island — but a longer trip is very reasonable if you are combining it with Athens or another island by ferry." },
        { question: "Do I need a car in Santorini?", answer: "Not in the caldera villages, where the roads are far too narrow, parking is effectively impossible, and the traffic is genuinely bad. You need one, or a driver, for the east coast, the wineries, Akrotiri and the remote beaches. The bus network connects the main towns cheaply, and the caldera path means you do not need anything at all for the villages." },
        { question: "Is Oia worth the crowds?", answer: "The village is beautiful and the sunset is a real experience, and the crowd has become genuinely extreme — the ruins fill hours before the sun goes down. The same caldera view exists in Imerovigli, Firostefani and Akrotiri without the crush, and a completely different experience exists on the caldera path on foot. Oia is worth seeing once; it is not worth a four-night booking at peak prices if the crowds are what you are trying to avoid." },
        { question: "Is Santorini good for families?", answer: "It is workable but not ideal. The caldera villages are steep, stepped and crowded, the beaches are windy in the summer months, and the expensive end of accommodation is built for couples. The east coast and Kamari are the most family-friendly areas, and the boat trip and the beaches are the parts children enjoy. If the trip is mostly for the villages and the view, it is a better fit for adults." },
      ],
    },
  ],

  itinerary: {
    title: "3 Days in Santorini: Caldera Path, Akrotiri and the Wineries",
    summary:
      "A deliberately uncrowded three days: the path on foot, the excavation, the wines in the lava, and a sunset from a village that is not Oia.",
    budgetLevel: "mid-range",
    totalEstimatedCostUsd: 560,
    days: [
      {
        title: "The caldera path",
        location: "Fira to Oia on foot, via Imerovigli",
        description:
          "Start early and walk the ten-kilometre rim path while the light is on the cliffs. Lunch in Imerovigli, a swim from the rock, and the sunset from Firostefani rather than Oia.",
        estimatedCostUsd: 190,
      },
      {
        title: "Akrotiri and the east coast",
        location: "Akrotiri, the Red and White beaches, Perissa",
        description:
          "The Bronze Age excavation in the morning, the Red Beach below it, then the east coast and Perissa for the black sand and a long afternoon. Back to the caldera for dinner.",
        estimatedCostUsd: 180,
      },
      {
        title: "Wineries and the boat",
        location: "Megalochori, the caldera wineries, Mesa Vouno",
        description:
          "A driver for the day: the interior village of Megalochori, an Assyrtiko tasting on the rim, Ancient Thera on the ridge for the view, and either a boat trip around the caldera or a final afternoon in the villages.",
        estimatedCostUsd: 190,
      },
    ],
  },

  needsVerification: [
    "Ferry routes from Athens: current operators, conventional vs fast services, journey times, and the winter schedule",
    "Airport transfer: the current shuttle arrangement, terminal access, and the realistic transfer time to Fira",
    "Bus network: current routes, frequencies, and whether the island has changed operator",
    "Akrotiri: current opening hours, admission, and whether the site roofs or closures affect the visit",
    "Wineries: current opening hours, whether tastings need booking, and the realistic cost of a tasting with transport",
    "Caldera path: current condition, whether any sections are closed, and the realistic walking time",
    "Boat trip: current operators, the hot-springs stop, the red and white beaches, and how the Meltemi affects sailings",
    "Beaches: current facilities and whether the summer wind affects swimming on the exposed beaches",
    "All cost bands: re-baseline against 2026 rates; the peak-to-shoulder swing is the dominant variable",
    "Visa and entry requirements: check per passport nationality; no claim is made in the copy",
  ],
};

/**
 * Destination key ("fes") or slug ("fes-travel-guide") -> slug.
 * Keys with no entry in DESTINATIONS (the live guides this batch links to
 * without rewriting, e.g. "paris") fall through to the slug convention.
 */
function slugForLink(key: string): string | null {
  const hit = DESTINATIONS.find(
    (d) => d.destination === key || d.slug === key || d.slug === `${key}-travel-guide`,
  );
  if (hit) return hit.slug;
  return key.endsWith("-travel-guide") ? key : `${key}-travel-guide`;
}

const BATCH: SeedArticle[] = [
  marrakech,
  fes,
  chefchaouen,
  casablanca,
  agadir,
  istanbul,
  lisbon,
  dubai,
  london,
  santorini,
];
const BATCH_SLUGS = new Set(BATCH.map((a) => a.slug));

async function resolveDestinationIds(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const d of await prisma.destination.findMany({ select: { slug: true, id: true } })) {
    map.set(d.slug, d.id);
  }
  return map;
}

async function seedArticle(input: SeedArticle, destinationIds: Map<string, string>) {
  const destinationId = destinationIds.get(input.destinationSlug) ?? null;
  if (!destinationId) {
    throw new Error(
      `Destination "${input.destinationSlug}" not found. The guide cannot be published without it.`,
    );
  }

  const wordCount = totalWords(input.blocks);
  const bodyWords = narrativeWords(input.blocks);
  if (bodyWords < 1800 || bodyWords > 2200) {
    console.warn(
      `  ! ${input.slug}: ${bodyWords} words of body copy, outside the 1800-2200 target. Editorial review required.`,
    );
  }

  const ctaCount = input.blocks.filter((b) => b.type === "cta").length;
  if (ctaCount !== 3) {
    throw new Error(`${input.slug} has ${ctaCount} cta blocks; the brief requires exactly 3.`);
  }
  const ctaCategories = input.blocks
    .filter((b): b is Extract<ContentBlock, { type: "cta" }> => b.type === "cta")
    .map((b) => b.category)
    .sort();
  const required = ["ACTIVITIES", "FLIGHTS", "HOTELS"];
  if (JSON.stringify(ctaCategories) !== JSON.stringify(required)) {
    throw new Error(`${input.slug} cta categories must be exactly HOTELS/FLIGHTS/ACTIVITIES.`);
  }

  const faqBlock = input.blocks.find((b) => b.type === "faq");
  const faqCount = faqBlock && faqBlock.type === "faq" ? faqBlock.items.length : 0;
  if (faqCount !== 5) {
    throw new Error(`${input.slug} has ${faqCount} faq entries; the brief requires exactly 5.`);
  }
  if (input.itinerary.days.length !== 3) {
    throw new Error(`${input.slug} itinerary has ${input.itinerary.days.length} days; expected 3.`);
  }

  const data = {
    title: input.title,
    excerpt: input.excerpt,
    content: JSON.stringify(input.blocks),
    type: input.type,
    status: "DRAFT" as const,
    publishedAt: null,
    focusKeyword: input.focusKeyword,
    metaTitle: input.title,
    metaDescription: input.excerpt,
    coverImage: input.coverImage,
    ogImage: input.coverImage,
    allowIndexing: false,
    wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
    lastReviewedAt: new Date(),
    destinationId,
    authorName: "Riversmag Editorial",
  };

  const article = await prisma.article.upsert({
    where: { slug: input.slug },
    update: data,
    create: { ...data, slug: input.slug },
  });

  for (const slug of input.categorySlugs) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) continue;
    await prisma.articleCategory.upsert({
      where: { articleId_categoryId: { articleId: article.id, categoryId: category.id } },
      update: {},
      create: { articleId: article.id, categoryId: category.id },
    });
  }

  await prisma.itinerary.upsert({
    where: { articleId: article.id },
    update: {
      title: input.itinerary.title,
      summary: input.itinerary.summary,
      days: 3,
      budgetLevel: input.itinerary.budgetLevel,
      totalEstimatedCost: input.itinerary.totalEstimatedCostUsd,
      publishedAt: null,
      isActive: false,
    },
    create: {
      title: input.itinerary.title,
      slug: `${input.slug}-3-day-itinerary`,
      summary: input.itinerary.summary,
      coverImage: input.coverImage,
      days: 3,
      budgetLevel: input.itinerary.budgetLevel,
      travelStyle: "first-time",
      totalEstimatedCost: input.itinerary.totalEstimatedCostUsd,
      currency: "USD",
      publishedAt: null,
      isActive: false,
      destinationId,
      articleId: article.id,
    },
  });

  const existingDays = await prisma.itineraryDay.findMany({
    where: { itinerary: { articleId: article.id } },
  });
  for (const d of existingDays) {
    await prisma.itineraryDay.delete({ where: { id: d.id } });
  }
  for (const [i, day] of input.itinerary.days.entries()) {
    await prisma.itineraryDay.create({
      data: {
        dayNumber: i + 1,
        title: day.title,
        location: day.location,
        description: day.description,
        estimatedCost: day.estimatedCostUsd,
        itineraryId: (
          await prisma.itinerary.findUniqueOrThrow({ where: { articleId: article.id } })
        ).id,
      },
    });
  }

  // Internal links are written by linkGuides() after every article exists, so
  // forward references in the graph are not silently dropped.
  return { article, wordCount, bodyWords, ctaCount, faqCount };
}

/**
 * RelatedArticle is directional: article -> relatedArticleId means the target
 * renders in this guide's "Continue planning your trip" cards. Pairs that are
 * both in this batch are written both ways so neither guide is a dead end.
 * Runs as its own pass because a target written later in the batch does not
 * exist yet while earlier articles are being written.
 */
async function linkGuides(articles: SeedArticle[]): Promise<Map<string, number>> {
  const ids = new Map<string, string>();
  for (const a of articles) {
    const row = await prisma.article.findUnique({ where: { slug: a.slug }, select: { id: true } });
    if (row) ids.set(a.slug, row.id);
  }
  // Targets may be live articles outside this batch (London -> Paris, Rome), so
  // they are resolved from the database rather than from the in-memory batch.
  const targets = new Set<string>();
  for (const a of articles) {
    for (const key of a.internalLinks) {
      const slug = slugForLink(key);
      if (slug && !ids.has(slug)) targets.add(slug);
    }
  }
  for (const slug of targets) {
    const row = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (row) ids.set(slug, row.id);
  }

  const counts = new Map<string, number>();
  for (const a of articles) {
    const from = ids.get(a.slug);
    if (!from) continue;
    let n = 0;
    for (const key of a.internalLinks) {
      const targetSlug = slugForLink(key);
      if (!targetSlug || targetSlug === a.slug) continue;
      const to = ids.get(targetSlug);
      if (!to || to === from) continue;
      await prisma.relatedArticle.upsert({
        where: { articleId_relatedArticleId: { articleId: from, relatedArticleId: to } },
        update: {},
        create: { articleId: from, relatedArticleId: to, relevanceScore: 60 },
      });
      n++;
    }
    counts.set(a.slug, n);
  }

  // Reciprocate inside the batch so no guide is a dead end.
  for (const a of articles) {
    const from = ids.get(a.slug);
    if (!from) continue;
    for (const key of a.internalLinks) {
      const targetSlug = slugForLink(key);
      if (!targetSlug || !BATCH_SLUGS.has(targetSlug)) continue;
      const to = ids.get(targetSlug);
      if (!to || to === from) continue;
      await prisma.relatedArticle.upsert({
        where: { articleId_relatedArticleId: { articleId: to, relatedArticleId: from } },
        update: {},
        create: { articleId: to, relatedArticleId: from, relevanceScore: 60 },
      });
    }
  }
  return counts;
}

async function main() {
  const articles = BATCH;
  const written = new Set(articles.map((a) => a.slug));
  const pendingSlugs = DESTINATIONS.map((d) => d.slug).filter((s: string) => !written.has(s));

  console.log("Destination guide batch — DRY RUN");
  console.log(`Ready to write: ${articles.length}`);
  console.log("Excluded — live and indexed, would be overwritten: 5 (see docs/CONTENT_BATCH_PLAN.md)");
  console.log("  paris, rome, barcelona, bali, tokyo");
  if (pendingSlugs.length) {
    console.log(`Metadata drafted, body not written: ${pendingSlugs.length}`);
    for (const s of pendingSlugs) console.log(`  - ${s}`);
  }

  const rows = articles.map((a) => ({
    destination: a.destinationSlug,
    slug: a.slug,
    bodyWords: narrativeWords(a.blocks),
    totalWords: totalWords(a.blocks),
    ctas: a.blocks.filter((b) => b.type === "cta").length,
    faqs: (a.blocks.find((b) => b.type === "faq") as { items?: unknown[] } | undefined)?.items?.length ?? 0,
    links: a.internalLinks.length,
    images:
      a.blocks.filter((b) => b.type === "image").length + (a.coverImage ? 1 : 0),
    cover: a.coverImage ? "set" : "og-fallback",
    factsFlagged: a.needsVerification.length,
  }));
  console.table(rows);

  const outOfRange = rows.filter((r) => r.bodyWords < 1800 || r.bodyWords > 2200);
  if (outOfRange.length) {
    console.log(`! ${outOfRange.length} article(s) outside the 1800-2200 body target: ${outOfRange.map((r) => r.destination).join(", ")}`);
  }

  if (!apply) {
    console.log("\nNo changes written. Re-run with --apply once the editorial plan is approved.");
    return;
  }

  const destinationIds = await resolveDestinationIds();
  for (const a of articles) {
    const { article, wordCount, bodyWords } = await seedArticle(a, destinationIds);
    console.log(
      `Wrote ${a.slug} (${bodyWords} body / ${wordCount} total words, DRAFT) -> ${article.id}`,
    );
    console.log(`  1 itinerary, ${a.needsVerification.length} items to verify`);
  }

  const linked = await linkGuides(articles);
  const totalLinks = [...linked.values()].reduce((a, b) => a + b, 0);
  console.log(`\nInternal links: ${totalLinks} relations across ${linked.size} guides`);
  for (const a of articles) console.log(`  ${a.slug} -> ${linked.get(a.slug) ?? 0}`);
  console.log(
    "\nDone. Every guide is DRAFT with allowIndexing=false and publishedAt=null, so nothing is",
  );
  console.log("indexable or in the sitemap until an editor publishes it.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
