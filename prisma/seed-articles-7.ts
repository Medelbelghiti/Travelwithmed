import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { blocksToText, type ContentBlock } from "../src/lib/content";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const u = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

async function upsertArticle(
  input: {
    title: string;
    slug: string;
    excerpt: string;
    type: string;
    destinationId: string | null;
    focusKeyword: string;
    categorySlugs: string[];
    coverImage: string;
    blocks: ContentBlock[];
    publishedAt: Date;
  },
  categoryIds: Record<string, string>,
  authorId: string | null,
) {
  const text = blocksToText(input.blocks);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const article = await prisma.article.upsert({
    where: { slug: input.slug },
    update: {
      title: input.title,
      excerpt: input.excerpt,
      content: JSON.stringify(input.blocks),
      type: input.type as "DESTINATION_GUIDE",
      status: "PUBLISHED",
      publishedAt: input.publishedAt,
      focusKeyword: input.focusKeyword,
      metaTitle: input.title,
      metaDescription: input.excerpt,
      coverImage: input.coverImage,
      ogImage: input.coverImage,
      allowIndexing: true,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
      destinationId: input.destinationId ?? null,
      authorId,
      authorName: "Maya Chen",
      canonicalUrl: `https://riversmag.com/articles/${input.slug}`,
    },
    create: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: JSON.stringify(input.blocks),
      type: input.type as "DESTINATION_GUIDE",
      status: "PUBLISHED",
      publishedAt: input.publishedAt,
      focusKeyword: input.focusKeyword,
      metaTitle: input.title,
      metaDescription: input.excerpt,
      coverImage: input.coverImage,
      ogImage: input.coverImage,
      allowIndexing: true,
      wordCount,
      readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
      destinationId: input.destinationId ?? null,
      authorId,
      authorName: "Maya Chen",
      canonicalUrl: `https://riversmag.com/articles/${input.slug}`,
    },
  });
  for (const slug of input.categorySlugs) {
    const catId = categoryIds[slug];
    if (!catId) continue;
    await prisma.articleCategory.upsert({
      where: { articleId_categoryId: { articleId: article.id, categoryId: catId } },
      update: {},
      create: { articleId: article.id, categoryId: catId },
    });
  }
  return article;
}

async function ensureRelated(aSlug: string, bSlug: string, relevance = 50) {
  const a = await prisma.article.findUnique({ where: { slug: aSlug } });
  const b = await prisma.article.findUnique({ where: { slug: bSlug } });
  if (!a || !b || a.id === b.id) return;
  const existing = await prisma.relatedArticle.findUnique({
    where: { articleId_relatedArticleId: { articleId: a.id, relatedArticleId: b.id } },
  });
  if (!existing) {
    await prisma.relatedArticle.create({
      data: { articleId: a.id, relatedArticleId: b.id, relevanceScore: relevance },
    });
  }
}

async function main() {
  console.log("Seeding P3 round...");

  const cityIds: Record<string, string> = {};
  for (const c of await prisma.destination.findMany({ where: { type: "CITY" } })) {
    cityIds[c.slug] = c.id;
  }

  const categoryIds: Record<string, string> = {};
  for (const c of await prisma.category.findMany()) {
    categoryIds[c.slug] = c.id;
  }

  const author = await prisma.author.findUnique({ where: { slug: "maya-chen" } });
  const authorId = author ? author.id : null;

  const links: Record<string, string> = {};
  for (const l of await prisma.affiliateLink.findMany()) {
    links[`${l.partnerName}|${l.category}`] = l.id;
  }
  const linkId = (partner: string, category: string) =>
    links[`${partner}|${category}`] ?? undefined;

  const now = Date.now();
  const at = (hoursAgo: number) => new Date(now - hoursAgo * 3600 * 1000);

  // ---------- Rome with kids ----------
  const romeKidsBlocks: ContentBlock[] = [
    { type: "p", text: "Rome with kids is about lowering the daily dose: one big ruin, a mouthful of culture, then gelato as infrastructure. The city rewards families that treat every piazza as a playground and every fountain as a museum." },
    { type: "h2", text: "Build mornings, free afternoons" },
    { type: "ul", items: [
      "The Colosseum works best first thing; book the arena-floor tour for the story value",
      "Villa Borghese: the lake (rentable boats), the gardens and the cinema in the sky",
      "Bocca della Verita is a ten-minute ritual kids absolutely love",
      "Afternoons belong to the piazzas, the Trastevere trams and the park benches",
    ] },
    { type: "h2", text: "The kid-friendly shortlist" },
    { type: "ul", items: [
      "The Gladiator School Experience (Scuola Gladiatori) near the Appian Way",
      "A Vespa or vintage-car tour, which doubles as a moving seat",
      "Capuchin Crypt: macabre and unforgettable for the older kids",
      "Ostia Antica: a ruin you can actually climb on, unlike the Forum",
    ] },
    { type: "h2", text: "Food that just works" },
    { type: "p", text: "Pizza al taglio (by the slice, weighed), gelato three times a day, and pasta that every Italian nonna has already perfected. Rome's food is the friendliest family scene in Europe - just avoid the 9pm restaurant marathons and eat early." },
    { type: "cta", label: "Find family stays in Rome", category: "HOTELS", destinationSlug: "rome", placement: "rome-kids" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Rome" },
    { type: "faq", items: [
      { question: "Is Rome good for kids?", answer: "Yes - open spaces, food kids actually eat and ruins that allow running. The key is pace: one big site in the morning, free time after lunch." },
      { question: "What is the best age to bring kids to Rome?", answer: "School-age (7+) gets the most from the ruins; younger children thrive on the piazzas and food. Either works with this pacing." },
    ] },
  ];
  await upsertArticle({
    title: "Rome with Kids: How to Make the Eternal City Family-Sized",
    slug: "rome-with-kids",
    excerpt: "Morning ruins, afternoon piazzas and gelato infrastructure - Rome planned around the family's actual energy.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.rome,
    focusKeyword: "rome with kids",
    categorySlugs: ["family-travel"],
    coverImage: u("photo-1552832230-c0197dd311b5"),
    blocks: romeKidsBlocks,
    publishedAt: at(60),
  }, categoryIds, authorId);

  // ---------- Day trips from Rome ----------
  const romeDayTripsBlocks: ContentBlock[] = [
    { type: "p", text: "Rome's day trips are the reward for staying longer than three days. The best ones are under an hour by train, genuinely different from the city, and cheap enough that 'should we?' becomes 'when do we leave?'" },
    { type: "h2", text: "Ostia Antica: the best first choice" },
    { type: "p", text: "Thirty minutes from Rome's Porta San Paolo (Piramide station) lies an ancient port city you can walk through freely. No queues, no ropes - just streets, baths and mosaics at a fraction of Pompeii's bother." },
    { type: "h2", text: "Pompeii and Herculaneum: the pilgrimage" },
    { type: "p", text: "The Circumvesuviana from Naples takes you to Pompeii's gate; Herculaneum (one stop earlier) is smaller, better preserved and far less busy. Pair it with a visit to the archaeological museum in Naples for the best experience." },
    { type: "h2", text: "Tivoli: two villas in the hills" },
    { type: "p", text: "Villa d'Este's fountains and Villa Adriana's emperor-scale ruins sit on the same short journey east of Rome. The fountains need a morning ber, the villa an easy afternoon." },
    { type: "h2", text: "The coast and the lakes" },
    { type: "ul", items: [
      "Castel Gandolfo: the lake village the popes used as a summer house",
      "Bracciano: a castle-ringed lake town posted above the water",
      "Frascati: the wine-village lunch, 30 minutes by regional train",
    ] },
    { type: "cta", label: "Book a guided day trip from Rome", category: "ACTIVITIES", destinationSlug: "rome", placement: "rome-daytrips" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Rome day trips" },
    { type: "faq", items: [
      { question: "What is the best day trip from Rome?", answer: "Ostia Antica for ease (30 minutes, no queues), Herculaneum for the experience, Tivoli for gardens and ruins in one trip." },
      { question: "Can I do Pompeii from Rome in a day?", answer: "Yes - early regional train to Naples, the Circumvesuviana to Pompeii, then back. It is a long but famous day." },
    ] },
  ];
  await upsertArticle({
    title: "Best Day Trips from Rome: Ostia, Pompeii, Tivoli & More",
    slug: "day-trips-from-rome",
    excerpt: "Ancient ports, emperor-scale villas and lake villages - the best escapes from Rome, all under an hour by train.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.rome,
    focusKeyword: "day trips from rome",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1549144511-f099e773c147"),
    blocks: romeDayTripsBlocks,
    publishedAt: at(55),
  }, categoryIds, authorId);

  // ---------- Bali with kids ----------
  const baliKidsBlocks: ContentBlock[] = [
    { type: "p", text: "Bali is one of the friendliest family destinations on earth: pools in every villa, food kids recognise, and an island built around the slow morning. The plan is simple - pick one base, lean on the resorts, and let the afternoons do nothing." },
    { type: "h2", text: "Where to base the family" },
    { type: "ul", items: [
      "Nusa Dua: flat, calm waters, family resorts - the safest choice",
      "Ubud family villas: rice-field views and day activities in the green",
      "Seminyak: kid cafes and splash pools with an easy beach",
    ] },
    { type: "h2", text: "Activities that fit the age range" },
    { type: "ul", items: [
      "The Bali Safari or a dolphin morning in Lovina for the animal-magnet crowd",
      "A cooking class - kids love the market then the mixing",
      "The Sacred Monkey Forest as a walking game with rules",
      "Pool days are the perfect arrival-day answer for every age",
    ] },
    { type: "h2", text: "Family logistics" },
    { type: "p", text: "Private drivers are the family transport: car-seat arrangeable, flexible and comforting. Stay near the resort pharmacy for the standard kids mishaps, and plan meal times early - Bali's dinner starts late and children do not wait." },
    { type: "cta", label: "Find family villas and resorts", category: "HOTELS", destinationSlug: "bali", placement: "bali-kids" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare Bali family stays" },
    { type: "faq", items: [
      { question: "Is Bali good for kids?", answer: "Excellent - family resorts, pools everywhere, and food that children actually eat. The main choice is the base (Nusa Dua for calm, Ubud for green)." },
      { question: "How many days in Bali with kids?", answer: "Seven to ten days at one or two bases is the sweet spot - enough pool time and slower sightseeing without itinerary burnout." },
    ] },
  ];
  await upsertArticle({
    title: "Bali with Kids: The Family Guide",
    slug: "bali-with-kids",
    excerpt: "Family resorts, animal days, cooking classes and the logistics that keep a Bali family trip calm.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "bali with kids",
    categorySlugs: ["family-travel"],
    coverImage: u("photo-1537996194471-e657df975ab4"),
    blocks: baliKidsBlocks,
    publishedAt: at(50),
  }, categoryIds, authorId);

  // ---------- Luxury Bali resorts ----------
  const baliLuxuryBlocks: ContentBlock[] = [
    { type: "p", text: "Bali's luxury is a different animal from hotel luxury elsewhere: it is clifftop infinity pools, jungle spa pavilions and rice-field views that cost a slice of their European equivalent. The island is where the 'dream stay' budget goes furthest." },
    { type: "h2", text: "The three luxury styles" },
    { type: "table", headers: ["Style", "Where", "The stay"], rows: [
      ["Clifftop resort", "Uluwatu / the Bukit", "Infinity pools over the ocean"],
      ["Jungle villa", "Ubud's hills", "Private pools, spa pavilions"],
      ["Beachfront estate", "Seminyak / beach strip", "Steps from the sand"],
    ] },
    { type: "h2", text: "What the price really buys" },
    { type: "ul", items: [
      "A private pool room (family scale) - the reason most splurge once",
      "Breakfast anywhere, anytime - the quiet luxury of the villa style",
      "A spa treatment set among the rice paddies",
      "The transfer, the included extras and the service with the memories",
    ] },
    { type: "h2", text: "Splurging smart" },
    { type: "ul", items: [
      "Book one or two luxury nights instead of the whole trip at that rate",
      "Choose dates or shoulder seasons - the cliff resorts drop at the edges",
      "Ask about the villa package: transfers, breakfast and spa credits often bundle",
    ] },
    { type: "cta", label: "Find luxury Bali stays", category: "HOTELS", destinationSlug: "bali", placement: "bali-luxury" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse Bali luxury resorts" },
    { type: "faq", items: [
      { question: "Is Bali luxury worth it?", answer: "Bali's high-end stays are exceptional value by world standards - clifftop and jungle resorts deliver a fraction of what their European and Caribbean equivalents cost." },
      { question: "Where are the best luxury resorts in Bali?", answer: "Uluwatu and the Bukit peninsula for cliff views, Ubud for jungle villas, Seminyak for beachfront ease. Pick the landscape you want to wake up to." },
    ] },
  ];
  await upsertArticle({
    title: "Luxury Bali Resorts: Where the Dream Stay Goes Furthest",
    slug: "luxury-bali-resorts",
    excerpt: "Clifftop infinity pools, jungle villas and beachfront estates - the three luxury styles where Bali's value is unmatched.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "luxury resorts bali",
    categorySlugs: ["luxury-travel"],
    coverImage: u("photo-1582719478250-c89cae4dc85b"),
    blocks: baliLuxuryBlocks,
    publishedAt: at(45),
  }, categoryIds, authorId);

  // ---------- Best time to visit Japan ----------
  const japanTimeBlocks: ContentBlock[] = [
    { type: "p", text: "Japan runs on seasons like few other countries, and the 'best time' answer splits between sakura, autumn colour and the price-friendly shoulders. The plan below matches your priorities - crowds, cost or colour." },
    { type: "h2", text: "The two famous windows" },
    { type: "ul", items: [
      "Late March to mid April: sakura - peak beauty, peak crowds, peak prices",
      "Mid November to early December: koyo (autumn colour) - the quieter of the two greats",
    ] },
    { type: "h2", text: "The price-friendly sweet spots" },
    { type: "table", headers: ["Season", "Conditions", "Trade-off"], rows: [
      ["May", "Warm, comfortable", "Golden Week (early May) crowds"],
      ["Late September", "Still pleasant", "Typhoon season edges in"],
      ["October", "Mild, clear", "Rising prices before koyo"],
    ] },
    { type: "h2", text: "Skipping ahead: summer and winter" },
    { type: "p", text: "Summer (June-August) is hot and humid with a rainy June, but prices drop and festivals surge. Winter (December-February) is crisp, bright and wonderfully empty outside the ski towns - Kyoto in January is a different, calmer city." },
    { type: "h2", text: "The locals rule" },
    { type: "p", text: "Avoid Golden Week (late April-early May) and Obon (mid August) unless the festivals are the point - trains and temples both hit national-holiday levels." },
    { type: "cta", label: "Check flight prices for your dates", category: "FLIGHTS", destinationSlug: "tokyo", placement: "japan-time" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Japan" },
    { type: "faq", items: [
      { question: "When is the best time to visit Japan?", answer: "Sakura (late March-April) and autumn colour (November) for beauty at the cost of crowds. May and October for the best balance of weather and price." },
      { question: "When is Japan cheapest?", answer: "Outside the national holidays - January, February and the June rainy window typically price lowest on flights and hotels." },
    ] },
  ];
  await upsertArticle({
    title: "Best Time to Visit Japan: Season by Season",
    slug: "best-time-to-visit-japan",
    excerpt: "Sakura versus autumn colour, the price-friendly shoulders and the holidays to dodge - Japan's calendar, decoded.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.tokyo,
    focusKeyword: "best time to visit japan",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1493976040374-85c8e12f0c0e"),
    blocks: japanTimeBlocks,
    publishedAt: at(40),
  }, categoryIds, authorId);

  // ---------- Mt Fuji day trip from Tokyo ----------
  const fujiBlocks: ContentBlock[] = [
    { type: "p", text: "Mt Fuji from Tokyo is a day trip with a weather report, not a guarantee - clear mornings in winter and spring give the postcard views, while summer haze often hides the peak entirely. Plan around the forecast and you will see the mountain, not the myth." },
    { type: "h2", text: "The classic options" },
    { type: "table", headers: ["Option", "Time", "Best for"], rows: [
      ["Hakone loop", "Full day", "Lake views, ropeway, onsen"],
      ["Kawaguchiko", "4-5 hours", "The postcard lake and peak"],
      ["Fuji Five Lakes by bus", "Full day", "The classic line of sight"],
    ] },
    { type: "h2", text: "Kawaguchiko: the photo run" },
    { type: "p", text: "The bus from Shinjuku lands at Kawaguchiko Station in under two hours, and the northern shore lakeside line is where the peak reflections happen. Check the live cams before you go - clear-season mornings are the window." },
    { type: "h2", text: "Hakone: the full-day route" },
    { type: "p", text: "The Hakone loop - railway, ropeway, sightseeing cruise and the Open-Air Museum - is the richest single day from Tokyo and never feels like waiting for one photo. On clear days the ropeway shows the peak and the crater together." },
    { type: "h2", text: "When to book" },
    { type: "ul", items: [
      "Check the Fuji clear forecast the night before, not the week before",
      "Book the bus or Hakone pass the day before in busy weekends",
      "In winter pack warm - the lake breeze is real even when Tokyo is mild",
    ] },
    { type: "activities", title: "Fuji experiences we feature", destinationId: cityIds.tokyo },
    { type: "cta", label: "Book a Mt Fuji day trip", category: "ACTIVITIES", destinationSlug: "tokyo", placement: "fuji" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Mt Fuji tours" },
    { type: "faq", items: [
      { question: "Is the Mt Fuji day trip worth it?", answer: "Yes, if the forecast is clear - the lake-and-peak view from Kawaguchiko or the Hakone loop are two of Japan's best single days. Check the live cams first." },
      { question: "What is the best month to see Mt Fuji?", answer: "November to April offers the clearest air; summer haze hides the peak most days. Morning departures beat afternoon ones in every season." },
    ] },
  ];
  await upsertArticle({
    title: "Mt Fuji Day Trip from Tokyo: Kawaguchiko & Hakone",
    slug: "mt-fuji-day-trip-from-tokyo",
    excerpt: "The lake-and-peak line, the Hakone loop and the forecast-first planning that turns a Fuji gamble into a guaranteed day.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.tokyo,
    focusKeyword: "mt fuji day trip from tokyo",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1490806843957-31f4c9a91c65"),
    blocks: fujiBlocks,
    publishedAt: at(35),
  }, categoryIds, authorId);

  // ---------- Luxury travel on a budget ----------
  const luxuryBudgetBlocks: ContentBlock[] = [
    { type: "p", text: "Luxury on a budget is a strategy, not an oxymoron: the trick is concentrating splurges. One exceptional hotel night, one proper fine-dining dinner and one great seat outrank a whole trip of by-the-numbers 'nice'." },
    { type: "h2", text: "The concentration rule" },
    { type: "ul", items: [
      "Two luxury nights beat seven 'upper-mid' ones for the memory they leave",
      "Splurge on the room one night and the dinner another - never both in the same day",
      "The window seat, the spa session, the sunrise balloon: choose the single great experience",
    ] },
    { type: "h2", text: "Where the value hides" },
    { type: "ul", items: [
      "Off-peak at the great hotels: Europe's five-stars collapse in January",
      "The under-the-radar destination in its 'discovery' phase",
      "Bali-style campaigns where world-class costs a fraction of home prices",
      "The suite upgrade that appears at check-in for the cost of a dinner",
    ] },
    { type: "h2", text: "The budget behaviours that fund it" },
    { type: "ul", items: [
      "Flight-date flexibility on the big hop funds the whole splurge account",
      "Book the ordinary nights cheaply and the pinnacle night with intent",
      "Watch the currency and the shoulder season - the same view for half the rate",
    ] },
    { type: "cta", label: "Find the hotel worth splurging on", category: "HOTELS", placement: "luxury-budget" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Search hotels worldwide" },
    { type: "cta", label: "Fund it with a smart flight", category: "FLIGHTS", placement: "luxury-budget" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Compare flights" },
    { type: "faq", items: [
      { question: "How can I travel luxuriously on a budget?", answer: "Concentrate the splurges - one exceptional room, one fine dinner and one great experience - and fund them with flexible dates and shoulder-season timing." },
      { question: "When do luxury hotels drop in price?", answer: "Off-peak season and midweek. Europe's grand hotels restructure dramatically in January and the edges of high season." },
    ] },
  ];
  await upsertArticle({
    title: "Luxury Travel on a Budget: Splurge Smarter",
    slug: "luxury-travel-on-a-budget",
    excerpt: "Two great nights beat seven fine ones - the concentration rule that puts real luxury inside a normal travel budget.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "luxury travel on a budget",
    categorySlugs: ["luxury-travel", "budget-travel"],
    coverImage: u("photo-1582719478250-c89cae4dc85b"),
    blocks: luxuryBudgetBlocks,
    publishedAt: at(30),
  }, categoryIds, authorId);

  // ---------- Internal linking ----------
  const pairs: [string, string, number][] = [
    ["rome-in-4-days-itinerary", "rome-with-kids", 35],
    ["best-things-to-do-in-rome", "day-trips-from-rome", 40],
    ["rome-travel-guide", "day-trips-from-rome", 40],
    ["where-to-stay-in-bali", "luxury-bali-resorts", 40],
    ["7-days-in-bali-itinerary", "bali-with-kids", 35],
    ["osaka-with-kids", "bali-with-kids", 30],
    ["best-time-to-visit-bali", "best-time-to-visit-japan", 25],
    ["osaka-travel-guide", "best-time-to-visit-japan", 30],
    ["best-things-to-do-in-tokyo", "mt-fuji-day-trip-from-tokyo", 45],
    ["tokyo-travel-guide", "mt-fuji-day-trip-from-tokyo", 40],
    ["how-to-travel-on-a-budget", "luxury-travel-on-a-budget", 40],
    ["luxury-travel-on-a-budget", "luxury-bali-resorts", 40],
    ["luxury-bali-resorts", "bali-on-a-budget", 30],
  ];
  for (const [a, b] of pairs) await ensureRelated(a, b);

  console.log("P3 round complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});