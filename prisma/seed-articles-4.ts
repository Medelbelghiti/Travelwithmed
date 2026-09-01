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
  console.log("Seeding Bali cluster...");

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

  // ---------- 7 days in Bali itinerary ----------
  const baliItineraryBlocks: ContentBlock[] = [
    { type: "p", text: "A week in Bali splits cleanly into three movements: the south's beaches and nightlife, Ubud's rice fields and temples, and one optional island escape. This seven-day plan keeps each region as a base rather than a day trip, so you never spend a whole day in a car." },
    { type: "h2", text: "The plan at a glance" },
    { type: "ul", items: [
      "Days 1-2: South Bali (Canggu or Seminyak) for beaches and sunset",
      "Days 3-5: Ubud for rice terraces, temples, waterfalls and cafes",
      "Days 6-7: Uluwatu cliffs, or a Nusa Penida day trip from Sanur",
    ] },
    { type: "h2", text: "Days 1-2: arrive and reset in the south" },
    { type: "p", text: "Ngurah Rai airport is close to Canggu and Seminyak, so the first night lands you at a beachfront cafe in under an hour. Keep the first day loose: temple visit, sunset at the beach, early dinner. Jet lag does the planning for you." },
    { type: "ul", items: [
      "Arrange a pickup or use a ride app straight from the arrivals door",
      "Temple etiquette starts day one: sarong at the door, covered shoulders",
      "The beach sunset is the daily event on the south coast - do not fight it",
    ] },
    { type: "h2", text: "Days 3-5: Ubud and the green centre" },
    { type: "p", text: "Ubud is the culture beat: Tegalalang rice terraces at first light, the Sacred Monkey Forest, waterfalls on the outskirts, and cooking classes that end in the best meal of your trip. Two full days here covers the icons without rushing." },
    { type: "ul", items: [
      "Tegalalang before 8am to beat both crowds and heat",
      "Waterfalls: Tegenungan is close and busy; Kanto Lampo and Tibumana are quieter",
      "A morning cooking class wraps rice fields, market and flavour into one morning",
      "Book a yoga or spa morning for the day your legs complain",
    ] },
    { type: "h2", text: "Days 6-7: cliffs or an island day" },
    { type: "p", text: "Uluwatu's temples on the cliffs hold the island's best sunset ceremony, and the beaches below (Padang Padang, Dreamland) are the classic finish. If you have energy left, the early boat to Nusa Penida is a ripping full-day trip for those who like their adventures raw." },
    { type: "hotels", title: "Stays we feature in Bali", destinationId: cityIds.bali },
    { type: "cta", label: "Search stays for your Bali dates", category: "HOTELS", destinationSlug: "bali", placement: "bali-7-days" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Bali" },
    { type: "h2", text: "Practical notes" },
    { type: "ul", items: [
      "Scooter vs driver: see our getting-around guide - the driver option often wins",
      "Visa: most nationalities use the 30-day Visa on Arrival; sort it online before flying",
      "Move between bases mid-day, not at rush hour - 9am-2pm is the sweet spot",
      "ATMs are everywhere in Canggu, Ubud and Seminyak; carry small notes for warungs",
    ] },
    { type: "cta", label: "Compare flights to Bali", category: "FLIGHTS", destinationSlug: "bali", placement: "bali-7-days" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Bali" },
    { type: "faq", items: [
      { question: "Is 7 days enough for Bali?", answer: "Yes, for the classic mix of beach, Ubud and a temple finale. You will not do North Bali or the Gili islands - save those for a two-week trip." },
      { question: "Should I stay in one place or move?", answer: "Move once. Two nights in the south, three in Ubud and two by the southern cliffs gives three completely different Balis with two short transfers." },
      { question: "Do I need to book Bali hotels in advance?", answer: "For Ubud and the south in July-August and Christmas, yes. Outside peak season you can wing it, but booking ahead locks better villas for less." },
    ] },
  ];
  const baliItineraryArticle = await upsertArticle({
    title: "7 Days in Bali: A Complete First-Timer Itinerary",
    slug: "7-days-in-bali-itinerary",
    excerpt: "South coast beaches, Ubud rice terraces and the Uluwatu cliffs - a seven-day Bali plan that never spends a whole day travelling.",
    type: "ITINERARY",
    destinationId: cityIds.bali,
    focusKeyword: "bali itinerary 7 days",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1537996194471-e657df975ab4"),
    blocks: baliItineraryBlocks,
    publishedAt: at(72),
  }, categoryIds, authorId);

  await prisma.itinerary.upsert({
    where: { slug: "bali-in-7-days" },
    update: {},
    create: {
      title: "7 Days in Bali",
      slug: "bali-in-7-days",
      summary: "South coast beaches, Ubud culture and the Uluwatu cliffs - a first-timer week across three Balis.",
      days: 7,
      budgetLevel: "Mid-range",
      travelStyle: "Beach & culture",
      totalEstimatedCost: 1200,
      currency: "USD",
      publishedAt: at(72),
      destinationId: cityIds.bali,
      authorId,
      articleId: baliItineraryArticle.id,
    },
  });
  const baliRow = await prisma.itinerary.findUnique({ where: { slug: "bali-in-7-days" } });
  if (baliRow) {
    const days: { dayNumber: number; description: string; activities: string[]; restaurants: string[]; hotel: string; transportation: string; estimatedCost: number }[] = [
      { dayNumber: 1, description: "Arrive at Ngurah Rai, transfer to Canggu or Seminyak and settle in with a sunset at the beach.", activities: ["Arrival transfer", "Beach sunset", "First nasi goreng"], restaurants: ["Beachfront cafe", "Local warung"], hotel: "Canggu or Seminyak base", transportation: "Airport pickup", estimatedCost: 130 },
      { dayNumber: 2, description: "South coast day: Tanah Lot temple, the beach clubs or quiet Melasti beach, then a relaxed evening.", activities: ["Tanah Lot", "Beach club or quiet beach", "Southern sunset"], restaurants: ["Cafes in Canggu", "Seafood by the beach"], hotel: "South base", transportation: "Ride app", estimatedCost: 120 },
      { dayNumber: 3, description: "Transfer to Ubud in the morning, Tegalalang rice terraces at first light, Monkey Forest afternoon.", activities: ["Tegalalang terraces", "Sacred Monkey Forest", "Ubud market"], restaurants: ["Healthy eatery", "Ubud street food night"], hotel: "Ubud base", transportation: "Mid-day car transfer", estimatedCost: 140 },
      { dayNumber: 4, description: "Waterfall morning (Kanto Lampo or Tibumana) and a rice-field walk, then a spa or yoga afternoon.", activities: ["Kanto Lampo waterfall", "Rice-field walk", "Yoga or spa"], restaurants: ["Warung near the fields", "Ubud dining"], hotel: "Ubud base", transportation: "Ride app", estimatedCost: 130 },
      { dayNumber: 5, description: "Cooking class morning: market, garden and dishes, leaving the evening free for Ubud nightlife.", activities: ["Bali cooking class", "Market tour", "Free evening"], restaurants: ["Your own cooking class", "Rooftop bar"], hotel: "Ubud base", transportation: "Ride app", estimatedCost: 150 },
      { dayNumber: 6, description: "Move to Uluwatu: cliff temples in the afternoon for the kecak sunset ceremony.", activities: ["Uluwatu temple", "Pura Luhur sunset ceremony", "Clifftop dinner"], restaurants: ["Cliff restaurant", "Local seafood"], hotel: "Uluwatu or Jimbaran base", transportation: "Mid-day car transfer", estimatedCost: 170 },
      { dayNumber: 7, description: "Slow last morning on Padang Padang beach, then transfer to the airport.", activities: ["Padang Padang", "Last beach time"], restaurants: ["Beach cafe"], hotel: "-", transportation: "Airport transfer", estimatedCost: 120 },
    ];
    for (const d of days) {
      const existingDay = await prisma.itineraryDay.findFirst({ where: { itineraryId: baliRow.id, dayNumber: d.dayNumber } });
      if (existingDay) continue;
      await prisma.itineraryDay.create({
        data: {
          itineraryId: baliRow.id,
          dayNumber: d.dayNumber,
          title: `Day ${d.dayNumber}`,
          location: d.dayNumber <= 2 ? "South Bali" : d.dayNumber <= 5 ? "Ubud" : "Uluwatu",
          description: d.description,
          activities: d.activities,
          restaurants: d.restaurants,
          hotel: d.hotel,
          transportation: d.transportation,
          estimatedCost: d.estimatedCost,
          affiliateLinks: [],
        },
      });
    }
  }

  // ---------- Where to stay in Bali ----------
  const baliHotelsBlocks: ContentBlock[] = [
    { type: "p", text: "Bali's genius is that the island is really four different stays inside one. Pick your base by what you want the morning to look like - and plan to move bases at least once, because nobody experiences Bali well from a single hotel room." },
    { type: "table", headers: ["Area", "Vibe", "Best for"], rows: [
      ["Canggu", "Surf, cafes, young energy", "Digital nomads, short stays"],
      ["Seminyak", "Design hotels, beach clubs", "Couples, comfortable mid-range"],
      ["Ubud", "Rice fields, temples, wellbeing", "Culture, yoga, food"],
      ["Uluwatu", "Clifftop temples, surf, quiet", "Scenic slow trips"],
      ["Nusa Dua / Jimbaran", "Resorts and beaches", "Families, luxury clients"],
    ] },
    { type: "h2", text: "Canggu: the young south" },
    { type: "p", text: "Villas and boutique stays sit between rice paddies and beach, with the island's best cafe scene on your street. It gets busy and sometimes muddy in wet season, but the energy is unmatched." },
    { type: "h2", text: "Ubud: the green centre" },
    { type: "p", text: "Rice-field resorts, infinity pools over jungle and a deep yoga-and-food scene. Ubud suits travellers who want culture and calm over parties - and it has the best-value hotels of the whole island." },
    { type: "h2", text: "Uluwatu: the cliff edge" },
    { type: "p", text: "Temples and wild coastline, with a handful of exceptional clifftop resorts. Fewer shops, more sweeping views, and the island's best sunsets. Rent a scooter or budget for a driver: the area is spread out." },
    { type: "h2", text: "Where to avoid staying" },
    { type: "ul", items: [
      "Kuta itself: crowded, dated and rarely the Bali you pictured",
      "Fully isolated villas inland: gorgeous, but every meal means a car ride",
      "Near the airport with no plan: you will just watch the departures go by",
    ] },
    { type: "hotels", title: "Stays we feature in Bali", destinationId: cityIds.bali },
    { type: "cta", label: "Find your Bali base", category: "HOTELS", destinationSlug: "bali", placement: "bali-stay" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Bali" },
    { type: "cta", label: "Check the price of flights", category: "FLIGHTS", destinationSlug: "bali", placement: "bali-stay" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Bali" },
    { type: "faq", items: [
      { question: "Where should I stay in Bali for the first time?", answer: "Two nights in Canggu or Seminyak for beaches, three in Ubud for culture, two by the southern cliffs. Moving bases shows you three different Balis." },
      { question: "Is it better to stay in Canggu or Seminyak?", answer: "Canggu for a younger, surf-and-cafe scene; Seminyak for design hotels, beach clubs and a more polished feel. Both are close enough to do both." },
      { question: "What is the cheapest area to stay in Bali?", answer: "Ubud has the best value-to-quality ratio on the island, especially a little outside the centre among the rice fields." },
    ] },
  ];
  await upsertArticle({
    title: "Where to Stay in Bali: Best Areas & Hotels for Every Trip",
    slug: "where-to-stay-in-bali",
    excerpt: "Canggu, Ubud, Uluwatu or a resort strip - which Bali base matches your trip, with hotel advice for each.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "where to stay in bali",
    categorySlugs: ["hotels"],
    coverImage: u("photo-1545324418-cc1a3fa10c00"),
    blocks: baliHotelsBlocks,
    publishedAt: at(66),
  }, categoryIds, authorId);

  // ---------- Best things to do in Bali ----------
  const baliThingsBlocks: ContentBlock[] = [
    { type: "p", text: "Bali rewards a short, deliberate list. The island can be anything - temple pilgrim, surf student, rice-field walker - so the trick is choosing one taste per day and letting the island's calm do the rest." },
    { type: "h2", text: "Temples worth the route" },
    { type: "ul", items: [
      "Tanah Lot: the sea temple at sunset, with the low tide walkway giving it scale",
      "Ulun Danu Beratan: the lakeside pagoda look everyone photographs",
      "Lempuyang: the gates-of-heaven shot - arrive at dawn to beat the queue",
      "Uluwatu: clifftop temple plus the kecak fire dance at dusk",
    ] },
    { type: "h2", text: "Landscapes and waterfalls" },
    { type: "ul", items: [
      "Tegalalang rice terraces before 8am, for the green in the soft light",
      "Kanto Lampo: a close, manageable waterfall with shallow water under it",
      "Tibumana: framed by jungle, one of the quieter falls",
      "A rice-field walk south of Ubud beats any guided plantation tour",
    ] },
    { type: "h2", text: "Beaches, by mood" },
    { type: "table", headers: ["Beach", "Mood", "Best for"], rows: [
      ["Padang Padang", "Rugged cove", "Swimming, low-key"],
      ["Melasti", "Dramatic cliffs", "Quiet afternoons"],
      ["Nusa Dua waters", "Flat and calm", "Families"],
      ["Uluwatu surf beaches", "Raw, powerful", "Watching real surf"],
    ] },
    { type: "h2", text: "Food as an activity" },
    { type: "ul", items: [
      "A Bali cooking class (market, garden, six dishes) - the best souvenir you will cook",
      "Babii guling at a local warung - the roast-pig lunch Ubud is famous for",
      "Night markets: Gianyar and Kerta for honest street food prices",
      "Eat where the mopeds park - Bali's crowd rating is rarely wrong",
    ] },
    { type: "h2", text: "Island days and outdoor things" },
    { type: "ul", items: [
      "Nusa Penida: raw coastline and the Kelingking cliff, a full-day commitment",
      "A Mount Agung sunrise trek for the fittest - book a guide",
      "River rafting on the Ayung: wet, easy and surprisingly family-friendly",
      "Surf school in Canggu for first-timers - whiteboard safety talk then wobbly success",
    ] },
    { type: "activities", title: "Experiences we feature in Bali", destinationId: cityIds.bali },
    { type: "cta", label: "Browse Bali tours and experiences", category: "ACTIVITIES", destinationSlug: "bali", placement: "bali-things" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "See Bali experiences" },
    { type: "cta", label: "Find a base near the action", category: "HOTELS", destinationSlug: "bali", placement: "bali-things" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare Bali hotels" },
    { type: "faq", items: [
      { question: "What are the must-do things in Bali?", answer: "Tegalalang at dawn, a Uluwatu sunset ceremony, a cooking class and one waterfall. That quartet carries a week-long first trip." },
      { question: "Is Nusa Penida worth it?", answer: "For confident road-trippers and raw-coastline lovers, yes - it is a demanding but unforgettable island day. Everyone else should prefer Bali's quieter beaches." },
      { question: "What is free to do in Bali?", answer: "Temples, rice fields, warungs and nearly every beach are free or donation-only. Bali is far cheaper to experience than to transport you around." },
    ] },
  ];
  await upsertArticle({
    title: "Best Things to Do in Bali: A Curated First-Timer List",
    slug: "best-things-to-do-in-bali",
    excerpt: "Temples, waterfalls, rice fields, beaches and cooking classes - the Bali experiences worth your week, in the right order.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "best things to do in bali",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1539020140153-e479b8c22e70"),
    blocks: baliThingsBlocks,
    publishedAt: at(60),
  }, categoryIds, authorId);

  // ---------- Bali visa guide ----------
  const baliVisaBlocks: ContentBlock[] = [
    { type: "p", text: "Bali's entry rules are simpler than most islands claim and easier than the rumour mill suggests. The core fact: most nationalities enter for 30 days on the Visa on Arrival (VOA), which you can now arrange online before flying." },
    { type: "h2", text: "The short version" },
    { type: "ul", items: [
      "Most passports: 30-day eVOA or VOA, roughly IDR 500,000",
      "Extensions: the 30-day visa extends by 30 once (through immigration, not just any vendor)",
      "Apply online before flying - the eVOA saves the arrival queue",
      "Passport validity: 6 months from arrival is the universal rule",
    ] },
    { type: "h2", text: "eVOA or airport Visa on Arrival?" },
    { type: "p", text: "The online eVOA lets you complete the fee in advance and skip one arrival counter, which is genuinely worth it on a busy landing. At the airport, the VOA desk accepts card - it is cash-and-card, quick, and fine if you forgot." },
    { type: "ul", items: [
      "Apply 1-7 days ahead, not at the last minute",
      "Fill the passenger details exactly as the passport reads",
      "Keep the approval PDF on your phone - it is checked at departure too",
    ] },
    { type: "h2", text: "Extending your stay" },
    { type: "p", text: "The 30-day VOA/eVOA can be extended once for another 30 days. Use the official immigration extension services and give it time - extensions are processed in days, not hours, and friends' 'help' scams are common near tourist hubs." },
    { type: "h2", text: "Avoiding the common mistakes" },
    { type: "ul", items: [
      "Do not overstay - fine plus trouble, and enforcement has tightened",
      "Bring a print of the eVOA if you can; screens work but paper is smoother",
      "Entry stamps get checked when you leave - keep the passport page clean",
      "Kids under nine: most nationalities are exempt from the fee entirely",
    ] },
    { type: "cta", label: "Compare flights to Bali", category: "FLIGHTS", destinationSlug: "bali", placement: "bali-visa" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Bali" },
    { type: "cta", label: "Sort your accommodation early", category: "HOTELS", destinationSlug: "bali", placement: "bali-visa" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare Bali hotels" },
    { type: "faq", items: [
      { question: "Do I need a visa for Bali?", answer: "Most nationalities enter visa-free for 30 days via the Visa on Arrival or online eVOA. Check your specific passport's rules before booking flights." },
      { question: "How much does the Bali visa cost?", answer: "Around IDR 500,000 (about 30-35 USD) for the 30-day visa on arrival, paid online for the eVOA or at the airport desk." },
      { question: "Can I extend my Bali visa?", answer: "Yes - the 30-day visa extends once by 30 days through official immigration services. Plan the extension before your first 30 days run out." },
    ] },
  ];
  await upsertArticle({
    title: "Bali Visa Guide: eVOA, Costs and Extensions Explained",
    slug: "bali-visa-guide",
    excerpt: "The eVOA online trick, the 30-day Visa on Arrival, extensions and the mistakes that cost travellers - Bali entry made simple.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "bali visa requirements",
    categorySlugs: ["travel-tips"],
    coverImage: u("photo-1547471080-7cc2caa01a7e"),
    blocks: baliVisaBlocks,
    publishedAt: at(55),
  }, categoryIds, authorId);

  // ---------- Bali on a budget ----------
  const baliBudgetBlocks: ContentBlock[] = [
    { type: "p", text: "Bali is one of the few trip-of-a-lifetime destinations where the budget VIP pass is simply not overpriced. The gap between backpacker and luxury is huge, and the mid-ground is absurd value - if you dodge the resort and transfer traps." },
    { type: "h2", text: "What actually eats the budget" },
    { type: "ul", items: [
      "Transport, not accommodation: driver days and airport rides add up fastest",
      "Tourist-conditioned pricing: the menu with English photos and wheat on the lamp",
      "Resort anti-pattern: a beachful of prices that reflect the view, not the bed",
    ] },
    { type: "h2", text: "Where the money goes right" },
    { type: "table", headers: ["Spend", "Budget", "Mid-range", "Better value pick"], rows: [
      ["Nights", "8-15 USD", "25-60 USD", "Ubud rice-field homestays"],
      ["Meals", "2-5 USD", "5-12 USD", "Local warungs, not hotel menus"],
      ["Transport/day", "5 USD (scooter)", "20-35 USD", "Shared driver, not private"],
      ["Activities", "2-10 USD", "15-40 USD", "Temples and cooking classes over tours"],
    ] },
    { type: "h2", text: "The budget rules that work" },
    { type: "ul", items: [
      "Eat where the locals queue, once you are out of the resort strip",
      "Book stays that include the practical costs: pool, breakfast, and a position",
      "Split a car-and-driver day with your hostel or villa neighbours",
      "Pre-book the eVOA and compare the flight - the airport never discounts",
    ] },
    { type: "h2", text: "The one splurge worth it" },
    { type: "p", text: "A single night in a Ubud rice-field villa with a pool. At mid-range prices it transforms the trip's memory, and it is a fraction of what the same room would charge in a European capital." },
    { type: "cta", label: "Find budget-friendly Bali stays", category: "HOTELS", destinationSlug: "bali", placement: "bali-budget" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare Bali hotels" },
    { type: "cta", label: "Watch flight prices", category: "FLIGHTS", destinationSlug: "bali", placement: "bali-budget" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Bali" },
    { type: "faq", items: [
      { question: "How much does a week in Bali cost?", answer: "A realistic mid-range week runs 700-1,100 USD including flights from Europe on a good fare. Backpackers do it for less than half with smart choices." },
      { question: "Is Bali cheap to eat in?", answer: "Yes - local warungs serve filling, excellent meals for a few dollars once you step off the resort strip." },
      { question: "What is the biggest budget trap in Bali?", answer: "Transport. Scooter days are cheap, driver days add up, and airport transfers quote resort-level rates. Plan the movement and the budget follows." },
    ] },
  ];
  await upsertArticle({
    title: "Bali on a Budget: How to See the Island Without Overspending",
    slug: "bali-on-a-budget",
    excerpt: "Where the money actually goes in Bali, the budget rules that work, and the one splurge worth making.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "bali on a budget",
    categorySlugs: ["budget-travel"],
    coverImage: u("photo-1622396481328-9b1b78cdd9fd"),
    blocks: baliBudgetBlocks,
    publishedAt: at(50),
  }, categoryIds, authorId);

  // ---------- Getting around Bali ----------
  const baliMoveBlocks: ContentBlock[] = [
    { type: "p", text: "The transport decision shapes a Bali trip more than the hotel does. Most visits come down to one choice: scooter or car-with-driver - and the answer is usually cheaper and safer than tourists assume." },
    { type: "h2", text: "Scooter vs car and driver" },
    { type: "table", headers: ["Option", "Daily cost", "Best for"], rows: [
      ["Scooter hire", "About 4-6 USD", "Short hops, confident riders"],
      ["Car and driver", "30-45 USD by territory", "Sugar loops, rice fields, families"],
      ["Ride apps", "Per trip, cheap", "Point-to-point, evenings"],
      ["Long-distance taxis", "Set price", "Airport, island hikes"],
    ] },
    { type: "h2", text: "The scooter reality check" },
    { type: "p", text: "Scooters are cheap, fun and everywhere - and Bali's roads, roundabouts and rental helmets make them a genuine risk for the newly confident. International licence, a proper helmet and a slow first day: the three non-negotiables." },
    { type: "h2", text: "The driver plan that wins" },
    { type: "ul", items: [
      "A car and driver by territory (not by trip) costs 30-45 USD a day",
      "Split between couples or small groups and it rivals the scooter price per head",
      "Agree the full route, the day length and the price before you set off",
      "Let the driver handle parking - the temples and warungs will thank you",
    ] },
    { type: "h2", text: "Ride apps and short hops" },
    { type: "p", text: "Gojek and Grab cover short point-to-point moves well and are the honest way to price a trip the driver has not staged. Use them for evenings and single legs; book the driver for full days." },
    { type: "h2", text: "Airports and islands" },
    { type: "ul", items: [
      "Arrange the arrival pickup before landing - it removes the airport-taxi scramble",
      "Boats to Nusa Penida and the Gilis leave from Sanur and Padangbai",
      "Inter-island: plan ferry bookings against wind and season, not just price",
    ] },
    { type: "cta", label: "Sort your accommodation around the route", category: "HOTELS", destinationSlug: "bali", placement: "bali-transport" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare Bali hotels" },
    { type: "faq", items: [
      { question: "Is it safe to rent a scooter in Bali?", answer: "It is common and affordable, but the roads take attention. Rent only with an international licence and a real helmet, and treat day one as a practice day." },
      { question: "How much is a private driver in Bali?", answer: "Around 30-45 USD per day by territory, usually including fuel and parking, if you agree the route and hours up front." },
      { question: "Can I use ride apps in Bali?", answer: "Yes - Gojek and Grab are widely available across the south and Ubud for short trips, and are a fair way to price local journeys." },
    ] },
  ];
  await upsertArticle({
    title: "Getting Around Bali: Scooter, Driver & Ride Apps",
    slug: "getting-around-bali",
    excerpt: "Scooter vs car-and-driver, ride apps, island boats and airport pickups - the honest Bali transport playbook.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "getting around bali",
    categorySlugs: ["budget-travel"],
    coverImage: u("photo-1522798514-97ceb8c4f1c8"),
    blocks: baliMoveBlocks,
    publishedAt: at(44),
  }, categoryIds, authorId);

  // ---------- Internal linking ----------
  const pairs: [string, string, number][] = [
    ["bali-travel-guide", "7-days-in-bali-itinerary", 60],
    ["bali-travel-guide", "where-to-stay-in-bali", 55],
    ["bali-travel-guide", "best-things-to-do-in-bali", 55],
    ["bali-travel-guide", "bali-visa-guide", 45],
    ["bali-travel-guide", "getting-around-bali", 45],
    ["best-time-to-visit-bali", "7-days-in-bali-itinerary", 50],
    ["best-time-to-visit-bali", "best-things-to-do-in-bali", 35],
    ["7-days-in-bali-itinerary", "where-to-stay-in-bali", 55],
    ["7-days-in-bali-itinerary", "best-things-to-do-in-bali", 55],
    ["7-days-in-bali-itinerary", "getting-around-bali", 40],
    ["where-to-stay-in-bali", "best-things-to-do-in-bali", 40],
    ["bali-on-a-budget", "where-to-stay-in-bali", 45],
    ["bali-on-a-budget", "getting-around-bali", 40],
    ["bali-visa-guide", "getting-around-bali", 35],
  ];
  for (const [a, b] of pairs) await ensureRelated(a, b);

  console.log("Bali cluster seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});