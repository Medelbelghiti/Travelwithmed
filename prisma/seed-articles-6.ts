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
  console.log("Seeding Tokyo + evergreen cluster...");

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

  // ---------- Tokyo 4-day itinerary ----------
  const tokyoItineraryBlocks: ContentBlock[] = [
    { type: "p", text: "Four days in Tokyo is a perfect first dose: enough for the neon and the temples, the food and the markets, without the sensory overload that longer trips risk. The plan below groups the city by geography so you never cross Tokyo twice in a day." },
    { type: "h2", text: "The plan at a glance" },
    { type: "ul", items: [
      "Day 1 - East: Asakusa, Senso-ji, Sumida River, Tokyo Skytree",
      "Day 2 - The imperial core: Marunouchi, Imperial Palace, Ginza",
      "Day 3 - Shibuya and Harajuku: the energy districts and the views",
      "Day 4 - West and beyond: Shinjuku, a teamLab, or a day trip south",
    ] },
    { type: "h2", text: "Day 1: Asakusa and the Skytree" },
    { type: "p", text: "Senso-ji is Tokyo's best first sight: the thunder gate, the shopping street, the pagoda - all walking. Follow it with a Sumida River walk to the Skytree for the city-grid view from 350m, and let the evening end near Asakusa's lantern-lit streets." },
    { type: "h2", text: "Day 2: The Imperial Palisade" },
    { type: "p", text: "Start around Tokyo Station for its brick architecture, walk the Imperial Palace's East Gardens, and spend the afternoon in Ginza or the Marunouchi arcades. It is the calm, ceremonial Tokyo that balances day one's depth." },
    { type: "h2", text: "Day 3: Shibuya and Harajuku" },
    { type: "p", text: "This is the crossing, the scramble, the fashion: Shibuya Scramble at street level, the Hachiko statue, Meiji Shrine's forest, then Harajuku's Takeshita Street for pop energy and vintage shops. End with night views from Shibuya Sky." },
    { type: "h2", text: "Day 4: Shinjuku and your calling card" },
    { type: "p", text: "Shinjuku's golden hour starts at the Metropolitan Government Building's free observatory. Choose your finale: a teamLab digital art drop, Odaiba's waterfront, or the easy day trip to Kamakura for a giant Buddha and a seaside afternoon." },
    { type: "hotels", title: "Hotels we feature in Tokyo", destinationId: cityIds.tokyo },
    { type: "cta", label: "Compare Tokyo stays for your dates", category: "HOTELS", destinationSlug: "tokyo", placement: "tokyo-4-days" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse hotels in Tokyo" },
    { type: "h2", text: "Tokyo logistics that matter" },
    { type: "ul", items: [
      "The Yamanote Line circles the core - your shorthand for orientation",
      "Suica or Pasmo on your phone: tap and go on everything",
      "Breakfast at 7-Eleven-class stores is normal, good and cheap",
      "Carry a small daypack: Tokyo's stations do not lunch for backpacks",
    ] },
    { type: "cta", label: "Find Tokyo tours and tickets", category: "ACTIVITIES", destinationSlug: "tokyo", placement: "tokyo-4-days" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Tokyo experiences" },
    { type: "faq", items: [
      { question: "Is 4 days enough for Tokyo?", answer: "Yes for a first trip: it covers the classic districts at a human pace. Add days only if you want day trips like Kamakura or Mt Fuji built into the same week." },
      { question: "Where should I stay for a 4-day trip?", answer: "Shinjuku for transport and nightlife, or Ginza/Tokyo Station for calm and central. Both sit on the Yamanote Loop that your itinerary uses." },
      { question: "Do I need to book Tokyo activities ahead?", answer: "The bucket-list ones (teamLab, Shibuya Sky, popular restaurants) yes. Anything else, the city absorbs walk-ins better than most." },
    ] },
  ];
  const tokyoItineraryArticle = await upsertArticle({
    title: "Tokyo in 4 Days: A First-Timer Itinerary",
    slug: "tokyo-itinerary-4-days",
    excerpt: "Asakusa temples, the scramble crossing, Shinjuku heights and a bold finale - four days of Tokyo, grouped so you never cross the city twice.",
    type: "ITINERARY",
    destinationId: cityIds.tokyo,
    focusKeyword: "tokyo 4 day itinerary",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1540959733332-eab4deabeeaf"),
    blocks: tokyoItineraryBlocks,
    publishedAt: at(40),
  }, categoryIds, authorId);

  await prisma.itinerary.upsert({
    where: { slug: "tokyo-in-4-days" },
    update: {},
    create: {
      title: "Tokyo in 4 Days",
      slug: "tokyo-in-4-days",
      summary: "A first-timer week across Tokyo's best districts, balanced between temples, neon, food and one bold finale.",
      days: 4,
      budgetLevel: "Mid-range",
      travelStyle: "First-timer classic",
      totalEstimatedCost: 1100,
      currency: "USD",
      publishedAt: at(40),
      destinationId: cityIds.tokyo,
      authorId,
      articleId: tokyoItineraryArticle.id,
    },
  });
  const tokyoRow = await prisma.itinerary.findUnique({ where: { slug: "tokyo-in-4-days" } });
  if (tokyoRow) {
    const days: { dayNumber: number; description: string; activities: string[]; restaurants: string[]; hotel: string; transportation: string; estimatedCost: number }[] = [
      { dayNumber: 1, description: "Asakusa morning, Senso-ji, the shopping street, then the Sumida walk to the Skytree for the evening view.", activities: ["Senso-ji", "Nakamise-dori", "Tokyo Skytree"], restaurants: ["Eel or soba in Asakusa", "Lantern-street dinner"], hotel: "Shinjuku or Ginza base", transportation: "Yamanote + Asakusa lines", estimatedCost: 110 },
      { dayNumber: 2, description: "The ceremonial core: Tokyo Station brick front, Imperial Palace East Gardens, Ginza afternoon.", activities: ["Tokyo Station", "Imperial Palace gardens", "Ginza arcade"], restaurants: ["Department-store basement lunch", "Ginza casual dinner"], hotel: "Ginza or Tokyo Station", transportation: "Walking + Yamanote", estimatedCost: 120 },
      { dayNumber: 3, description: "Shibuya Scramble, Hachiko, Meiji Shrine forest and Harajuku street energy, capped by Shibuya Sky at dusk.", activities: ["Shibuya Scramble", "Meiji Shrine", "Harajuku Takeshita"], restaurants: ["Tasting-menu lunch in Shibuya", "Omino desserts"], hotel: "Shibuya or Shinjuku", transportation: "Walking + Yamanote", estimatedCost: 135 },
      { dayNumber: 4, description: "Shinjuku observatory morning, a last neighbourhood pick (Odaiba or teamLab), and an easy airport run or Kamakura day.", activities: ["Metro Gov. observatory", "Odaiba or teamLab", "Kamakura option"], restaurants: ["Shinjuku food hall"], hotel: "-", transportation: "Airport express or JR", estimatedCost: 130 },
    ];
    for (const d of days) {
      const existingDay = await prisma.itineraryDay.findFirst({ where: { itineraryId: tokyoRow.id, dayNumber: d.dayNumber } });
      if (existingDay) continue;
      await prisma.itineraryDay.create({
        data: {
          itineraryId: tokyoRow.id,
          dayNumber: d.dayNumber,
          title: `Day ${d.dayNumber}`,
          location: d.dayNumber === 1 ? "Asakusa" : d.dayNumber === 2 ? "Imperial core" : d.dayNumber === 3 ? "Shibuya / Harajuku" : "Shinjuku / west",
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

  // ---------- Best things to do in Tokyo ----------
  const tokyoThingsBlocks: ContentBlock[] = [
    { type: "p", text: "Tokyo is not a to-see city, it is a to-be city - but the thing-list still helps. The experiences below mix the views, the shrines, the food shows and the oddities that make Tokyo unlike anywhere else." },
    { type: "h2", text: "The views" },
    { type: "ul", items: [
      "Tokyo Skytree and Shibuya Sky for the two best viewpoints - book Shibuya Sky at sunset",
      "The free Metropolitan Government Building observatory in Shinjuku",
      "Rainbow Bridge and Odaiba at night for the skyscraper-on-water wide",
    ] },
    { type: "h2", text: "The shrines and temples" },
    { type: "ul", items: [
      "Senso-ji in Asakusa: Tokyo's most storied temple, best at first light",
      "Meiji Shrine: a forest in the middle of the city, quiet whatever the crowds",
      "The Yanesen area (Yanaka, Nezu, Sendagi): old Tokyo lanes and cat streets",
    ] },
    { type: "h2", text: "The food shows" },
    { type: "ul", items: [
      "A standing counter ramen for the 12-minute Japanese lunch",
      "Tsukiji's outer market in the morning for the freshest everything",
      "Izakaya-hopping in Golden Gai or Omoide Yokocho after dark",
      "Sushi at the counter over sushi at the counter: the quality gap is real and worth it",
    ] },
    { type: "h2", text: "The odd Tokyo" },
    { type: "ul", items: [
      "teamLab Planets or Borderless for the digital-art bath",
      "A maid cafe or themed cafe for pure Tokyo strangeness",
      "Mega-donquijote at midnight for the true neon retail",
      "The fish auction tour at Toyosu for the 3am variety",
    ] },
    { type: "activities", title: "Experiences we feature in Tokyo", destinationId: cityIds.tokyo },
    { type: "cta", label: "Browse Tokyo tours and tickets", category: "ACTIVITIES", destinationSlug: "tokyo", placement: "tokyo-things" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "See Tokyo experiences" },
    { type: "cta", label: "Base yourself near the district you love", category: "HOTELS", destinationSlug: "tokyo", placement: "tokyo-things" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Tokyo" },
    { type: "faq", items: [
      { question: "What should I not miss in Tokyo?", answer: "Senso-ji, Meiji Shrine, the Shibuya crossing and at least one viewpoint. Add one market and one odd Tokyo thing and the trip has its full shape." },
      { question: "Do I need to book Tokyo attractions ahead?", answer: "For teamLab, Shibuya Sky and top restaurants - yes. Tokyo's ordinary sights absorb walk-ins with ease." },
      { question: "Is Tokyo walkable?", answer: "The districts are; the distances between them are not. Base yourself near the Yamanote Line and treat the metro as the city's elevator." },
    ] },
  ];
  await upsertArticle({
    title: "Best Things to Do in Tokyo: Views, Food & Oddness",
    slug: "best-things-to-do-in-tokyo",
    excerpt: "Skytree heights, shrine forests, standing-counter ramen and the midnight retail - the Tokyo experiences that make the trip.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.tokyo,
    focusKeyword: "best things to do in tokyo",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1490806843957-31f4c9a91c65"),
    blocks: tokyoThingsBlocks,
    publishedAt: at(36),
  }, categoryIds, authorId);

  // ---------- Best travel insurance ----------
  const insuranceBlocks: ContentBlock[] = [
    { type: "p", text: "Travel insurance is the only purchase you hope to waste money on - and the right policy is worth radically more than anything you will read here. This guide covers what to require of any policy, and how to compare without drowning in fine print." },
    { type: "h2", text: "The four clauses that matter" },
    { type: "ul", items: [
      "Medical cover: 50k+ USD for most of the world, and read the exclusion list twice",
      "Cancel-for-any-reason or at least trip cancellation: the clause that actually pays",
      "Baggage and delay limits: aim for useful, not maximal - they matter less than medical",
      "Emergency evacuation: rare but the single most expensive thing insurance can cover",
    ] },
    { type: "h2", text: "How to compare policies properly" },
    { type: "ol", items: [
      "Fix your trip dates, destination and traveller ages before you compare",
      "Read the medical exclusions: pre-existing conditions and adventure sports top the list",
      "Check the 'events wind' rule for your destination - storms matter for islands and coasts",
      "Price the total trip, not just the flights - cancellation covers the whole spend",
    ] },
    { type: "h2", text: "Short trips vs annual multi-trip" },
    { type: "p", text: "If you travel two or three times a year, an annual multi-trip policy almost always undercuts separate trips. Buy it before the first departure and remember cover starts from the purchase or the date you choose, not your flight." },
    { type: "h2", text: "What most people get wrong" },
    { type: "ul", items: [
      "Buying at the airport desk or app last-minute: same product, worse price",
      "Assuming the cheapest policy covers your hobby sports",
      "Not keeping the 24/7 assistance number saved before you go",
      "Insurance first, flights second: dates should be covered before you commit money",
    ] },
    { type: "cta", label: "Compare travel insurance for your trip", category: "INSURANCE", placement: "insurance" },
    { type: "affiliate_link", linkId: linkId("SafetyWing", "INSURANCE") ?? "cmthy4nu4001fdsvj6hjol4ac", label: "Check travel insurance options" },
    { type: "cta", label: "Once insured, lock your flights", category: "FLIGHTS", placement: "insurance" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search your flights" },
    { type: "faq", items: [
      { question: "How much travel insurance should I buy?", answer: "Prioritise medical cover of at least 50k USD and real trip-cancellation protection. That combination beats an exotic luggage allowance every time." },
      { question: "Do I need insurance for a domestic trip?", answer: "Usually not mandatory, but check your existing policies - card or home insurance sometimes already covers domestic trips." },
      { question: "Can I buy insurance after booking flights?", answer: "Yes, but before your first departure and before any non-refundable payments you care about - cancellation cover only protects spend date-from purchase." },
    ] },
  ];
  await upsertArticle({
    title: "Best Travel Insurance: How to Compare Like a Pro",
    slug: "best-travel-insurance-companies",
    excerpt: "The four clauses that matter, how to compare policies fairly and the mistakes that cost travellers most - travel insurance made simple.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "best travel insurance",
    categorySlugs: ["travel-tips", "budget-travel"],
    coverImage: u("photo-1503220317375-aaad61436b1b"),
    blocks: insuranceBlocks,
    publishedAt: at(32),
  }, categoryIds, authorId);

  // ---------- Best eSIM for travel ----------
  const esimBlocks: ContentBlock[] = [
    { type: "p", text: "An eSIM is the modern travel essential: one scan before you fly, data live the moment you land. At 20-40 USD for most regions, it beats roaming meters, store queues and the buyer 'what network?' debate entirely." },
    { type: "h2", text: "Why eSIM beats the alternatives" },
    { type: "table", headers: ["Option", "Cost for a week", "Pain points"], rows: [
      ["Roaming on your home plan", "Often 10x-20x", "Slow, absurd limits, bill shock"],
      ["Local SIM in the airport", "Low, in theory", "Queue, passport copy, paperwork"],
      ["Portable wifi device", "8-12 USD/day", "Rental beach, extra battery"],
      ["eSIM", "From about 3-5 USD/day", "Needs a compatible phone"],
    ] },
    { type: "h2", text: "Which eSIM plan to buy" },
    { type: "ul", items: [
      "Regional plans cover multiple countries in one package - ideal for two-country trips",
      "See the data allowance honestly: a week of maps, messages and feed is modest",
      "Check the network: a plan on the bigger local network beats a cheaper obscure one",
      "Install the eSIM before you fly; activation status matters more than the download",
    ] },
    { type: "h2", text: "The setup in three steps" },
    { type: "ol", items: [
      "Check your phone unlocks and is eSIM-capable",
      "Buy and scan the QR code from your provider (most give an eSIM QR or app install)",
      "Keep your home eSIM as primary for calls while the travel line takes data",
    ] },
    { type: "h2", text: "The common mistakes" },
    { type: "ul", items: [
      "Buying after you land and sitting in the terminal downloading at airport wifi",
      "Forgetting to set the travel eSIM as the data source before switching",
      "Assuming every country in your itinerary is on the regional plan",
    ] },
    { type: "products", title: "Connectivity gear we recommend", category: "Connectivity" },
    { type: "cta", label: "Get travel data with an eSIM", category: "ESIM", placement: "esim" },
    { type: "affiliate_link", linkId: linkId("Airalo", "ESIM") ?? "cmthgttvg001ih8vjexw1w5z2", label: "Browse travel eSIM plans" },
    { type: "cta", label: "Pack the rest of your tech", category: "TRAVEL_GEAR", placement: "esim" },
    { type: "affiliate_link", linkId: linkId("Amazon", "TRAVEL_GEAR") ?? "cmthy4ods001gdsvjyrtvbwfr", label: "Shop travel tech and gear" },
    { type: "faq", items: [
      { question: "Is an eSIM worth it for travel?", answer: "Yes for almost everyone now: instant data at airport prices, no queues and no roaming bills. Just check phone compatibility first." },
      { question: "How much does a travel eSIM cost?", answer: "Regional plans run from about 3-5 USD per day or as little as 10-15 USD for a light week. Compare data and network before buying." },
      { question: "Will my eSIM work in every country I visit?", answer: "Only if your plan includes each country. Choose regional or global plans for multi-country trips, or the plan dies at the border." },
    ] },
  ];
  await upsertArticle({
    title: "Best eSIM for Travel: The Guide to Staying Connected",
    slug: "best-esim-for-travel-guide",
    excerpt: "Why eSIM beats roaming, how to pick the right plan and the three-step setup - travel data made painless.",
    type: "PRODUCT_GUIDE",
    destinationId: null,
    focusKeyword: "best esim for travel",
    categorySlugs: ["travel-tips", "travel-gear"],
    coverImage: u("photo-1512941937669-90a1b58e7e9c"),
    blocks: esimBlocks,
    publishedAt: at(28),
  }, categoryIds, authorId);

  // ---------- Best carry-on luggage ----------
  const carryonBlocks: ContentBlock[] = [
    { type: "p", text: "Carry-on luggage is a years-long relationship, which is exactly why 'best' means 'best for your travel style' more than 'most expensive'. The shortlist below spans the four real categories, with the sizing rules that decide everything for budget airlines." },
    { type: "h2", text: "The four categories" },
    { type: "ul", items: [
      "Hard-shell spinner: the default for most trips - easy rolling, weatherproof",
      "Soft-side duffel: flexible, under-seat-friendly, casual travel's quiet genius",
      "Backpack hybrid: the carry-on that also shoulders a weekend",
      "Business / tech bag: compartments, laptop sleeves and one-bag travel",
    ] },
    { type: "h2", text: "Sizing: the rule that actually runs things" },
    { type: "p", text: "Budget airlines enforce strict dimensions, often 55x40x20cm for carry-on and smaller for personal items. Measure each bag against your expected airlines before buying - the nicest bag that does not fit your cheapest flight is a trap." },
    { type: "ul", items: [
      "56cm worldwide is the common carry-on ceiling (air excl. wheels)",
      "Personal-item passengers: a 20-25L bag generally clears most low-cost rules",
      "Wheels count: some carriers measure with wheels, some without",
    ] },
    { type: "h2", text: "What to look for" },
    { type: "ul", items: [
      "4 spinner wheels beat 2-wheel rollers on airport marble",
      "A good warranty (10 years) costs nothing at purchase and pays later",
      "Weight sub-3kg leaves more room in your allowance",
      "Waterproof zips matter for air travel; rainproof is marketing noise",
    ] },
    { type: "products", title: "Bags we recommend", category: "Bags" },
    { type: "cta", label: "Shop carry-on bags and travel gear", category: "TRAVEL_GEAR", placement: "carryon" },
    { type: "affiliate_link", linkId: linkId("Amazon", "TRAVEL_GEAR") ?? "cmthy4ods001gdsvjyrtvbwfr", label: "See recommended travel gear" },
    { type: "cta", label: "Then pack it right", category: "OTHER", placement: "carryon" },
    { type: "affiliate_link", linkId: linkId("Amazon", "TRAVEL_GEAR") ?? "cmthy4ods001gdsvjyrtvbwfr", label: "Check packing essentials" },
    { type: "faq", items: [
      { question: "What is the best size for carry-on luggage?", answer: "55x40x20cm (about 22x16x8in) is the international carry-on ceiling; most hard spinners clear it. Check your actual airline before buying." },
      { question: "Are hard or soft bags better for carry-on?", answer: "Hard shells roll best and protect contents; soft bags flex into tight bins and pack edges. The answer is your travel style, not the bag's." },
      { question: "Do I need a personal item bag too?", answer: "For budget flights, yes - a 20-25L personal item increases your allowance massively and saves the fee gamble." },
    ] },
  ];
  await upsertArticle({
    title: "Best Carry-On Luggage for 2026: The Only Guide You Need",
    slug: "best-carry-on-baggage-review",
    excerpt: "Hard-shell, duffel, backpack-hybrid and tech bags - the four categories, the sizing rules budget airlines enforce, and what to look for.",
    type: "PRODUCT_GUIDE",
    destinationId: null,
    focusKeyword: "best carry on luggage",
    categorySlugs: ["travel-gear"],
    coverImage: u("photo-1553062407-98eeb64c6a62"),
    blocks: carryonBlocks,
    publishedAt: at(24),
  }, categoryIds, authorId);

  // ---------- How to book cheap hotels ----------
  const cheapHotelsBlocks: ContentBlock[] = [
    { type: "p", text: "Cheap hotels are not about coupons - they are about patterns. Move the dates, move the neighbourhood, book at the right moment, and a modest hotel habit saves real money without sacrificing a good night's sleep." },
    { type: "h2", text: "The date moves that save the most" },
    { type: "ul", items: [
      "Midweek beats the weekend in city centres; the reverse in beach towns",
      "Three nights on a passport day: organic Monday-Tuesday rates are a discount by default",
      "The gold window: booking 30-90 days out nearly always undercuts the last-minute desk",
    ] },
    { type: "h2", text: "The neighbourhood move" },
    { type: "p", text: "One metro stop away from the tourist strip often halves the price for the same room. Use the city's best transit line as your compass - a 10-minute ride to the sights is a discount you can set a watch by." },
    { type: "h2", text: "How to compare honestly" },
    { type: "ol", items: [
      "Fix the room type and dates before comparing - bait pricing hides in the defaults",
      "Check the same hotel across two or three sites; prices genuinely diverge",
      "Watch the add-ons: breakfast, parking, city tax and the resort fee in the fine small",
      "Add a loyalty-program or member rate to the comparison - it often just wins",
    ] },
    { type: "h2", text: "The bargain hacks that still work" },
    { type: "ul", items: [
      "Refundable rates keep the door open if a better price appears",
      "Newer hotels price under 'launch' marketing before their reputation catches up",
      "Micro-hotel and capsule rooms in Japan and Europe are a real genre, not a gimmick",
      "The lobby insight is underrated: book with breakfast included only if you will eat it",
    ] },
    { type: "cta", label: "Search hotels for your dates", category: "HOTELS", placement: "cheap-hotels" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels now" },
    { type: "cta", label: "Pair the hotel with cheap flights", category: "FLIGHTS", placement: "cheap-hotels" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights too" },
    { type: "faq", items: [
      { question: "When is the best time to book a hotel?", answer: "Usually 30-90 days before check-in. With refundable rates you can book earlier and re-check the price closer to the date without risk." },
      { question: "How do I find genuinely cheap hotels in a city?", answer: "Move one metro stop outside the main tourist strip and re-run the same search - the same room category often falls by a third." },
      { question: "Are refundable rates worth it?", answer: "Yes when the itinerary can flex. You pay a small premium for the option to re-book at whatever price the market does later." },
    ] },
  ];
  await upsertArticle({
    title: "How to Book Cheap Hotels: The Strategies That Actually Work",
    slug: "how-to-book-cheap-hotels",
    excerpt: "Date moves, neighbourhood moves, honest comparison and the refundable-rate hack - cheap hotels without the bad night.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "how to book cheap hotels",
    categorySlugs: ["hotels", "budget-travel"],
    coverImage: u("photo-1551882547-ff40c63fe5fa"),
    blocks: cheapHotelsBlocks,
    publishedAt: at(20),
  }, categoryIds, authorId);

  // ---------- Traveling with kids ----------
  const kidsBlocks: ContentBlock[] = [
    { type: "p", text: "Families travel differently and the good news is that most destinations are built for it. The rules that keep kids thriving on the road are mostly about pace: one anchor activity a day, a hotel with a pool corner, and snacks that never run out." },
    { type: "h2", text: "Pacing the day" },
    { type: "ul", items: [
      "One big activity before lunch, free time after - the universal family rhythm",
      "Book the morning slots: queues, heat and hunger all arrive together mid-afternoon",
      "Let the kids veto one plan and pick one plan per day - ownership buys cooperation",
      "A pool or playground hour after lunch resets everyone's energy",
    ] },
    { type: "h2", text: "Hotels that work" },
    { type: "ul", items: [
      "Family rooms: ask for the actual room type, not the 'best available'",
      "A pool, a mini-fridge and laundry within walking distance beat the fancy lobby",
      "Self-catering options quietly win for breakfasts and snagged lunches",
      "Check the free-breakfast policy for under-12s - it is the family-discount on the menu",
    ] },
    { type: "h2", text: "Transport and the airport" },
    { type: "ul", items: [
      "Priority boarding and the stroller-gate trick make the gate sprint a no-op",
      "Meals and meds live in the backpack - never in the hold",
      "Car-seats: many airlines check a travel seat free; rental car seats cost more per day than the car",
      "The kids meal is the reference price at every airport shop; plan around the upcharge",
    ] },
    { type: "h2", text: "The checklist before you fly" },
    { type: "ol", items: [
      "Passport photo for the kids - it will be looked at twice, not once",
      "A back-of-phone note with the hotel address and the local emergency number",
      "Snacks in every compartment and a change of clothes in the carry-on",
      "Flying safe: compare car seats and seats you pay for, not the airline's cheapest row",
    ] },
    { type: "cta", label: "Find family hotels for your dates", category: "HOTELS", placement: "kids" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare family hotels" },
    { type: "cta", label: "Book family-friendly experiences", category: "ACTIVITIES", placement: "kids" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse family tours" },
    { type: "faq", items: [
      { question: "What is the best age to travel with kids?", answer: "Every age works differently: babies fly quietly but carry gear, toddlers find everything funny, school-age kids remember everything. The destination should match their age, not the reverse." },
      { question: "Should I book family rooms ahead?", answer: "Yes - true family rooms sell out first at family-friendly hotels and rarely appear at the desk. Book the actual room type, not 'best available'." },
      { question: "How do I keep kids calm on long flights?", answer: "Snacks, screens and novelty in rotation, a walk every hour, and sleep scheduled toward the destination's timezone before boarding." },
    ] },
  ];
  await upsertArticle({
    title: "Best Tips for Traveling with Kids: The Family Playbook",
    slug: "best-tips-traveling-with-kids",
    excerpt: "Pacing, hotel picks, airport tricks and the checklist that protects the trip - family travel that stays calm.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "tips for traveling with kids",
    categorySlugs: ["family-travel", "travel-tips"],
    coverImage: u("photo-1473968512647-3e447244af8f"),
    blocks: kidsBlocks,
    publishedAt: at(16),
  }, categoryIds, authorId);

  // ---------- How to travel on a budget ----------
  const budgetBlocks: ContentBlock[] = [
    { type: "p", text: "Budget travel is about decisions, not deprivation. The biggest line item (transport), the second (accommodation) and the third (food) each follow simple rules that together fund the memorable chunk of any trip." },
    { type: "h2", text: "Transport: the big lever" },
    { type: "ul", items: [
      "Flights price on pattern, not loyalty: compare date grids, not single dates",
      "One stop of flexibility weekdays beats weekend flights on every corridor",
      "Trains beat planes on many European and Asian legs at half the airport drama",
      "Book in one basket where the math is obvious and the time is fixed",
    ] },
    { type: "h2", text: "Accommodation: the second lever" },
    { type: "ul", items: [
      "One neighbourhood over the tourist strip halves the room rate",
      "A kitchen corner (even a fridge plus kettle) cuts two meals a day off the budget",
      "Refundable rates keep price-drop options open at no real risk",
      "Hostels with private rooms are the quiet 21st-century deal",
    ] },
    { type: "h2", text: "Food: the daily win" },
    { type: "ul", items: [
      "Eat where the workers eat: the lunch menu and the neighbourhood counter",
      "Supermarket breakfasts and picnic lunches beat the cafe of the same name every time",
      "Local markets are the flavour and the discount in one building",
      "One splurge dinner planned beats five mediocre tourist dinners",
    ] },
    { type: "h2", text: "The last 20% that changes everything" },
    { type: "ul", items: [
      "Travel insurance protects the budget you built - a medical bill destroys it faster than any flight",
      "Free walking tours set your orientation, then you pay for the ones you loved",
      "Water and the reusable bottle: the smallest saving that reoccurs all day",
      "Watch the airport-add-ons weeks before takeoff, not at the gate",
    ] },
    { type: "cta", label: "Compare flights for your dates", category: "FLIGHTS", placement: "budget" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search cheap flights" },
    { type: "cta", label: "Insure the trip you planned", category: "INSURANCE", placement: "budget" },
    { type: "affiliate_link", linkId: linkId("SafetyWing", "INSURANCE") ?? "cmthy4nu4001fdsvj6hjol4ac", label: "Compare travel insurance" },
    { type: "faq", items: [
      { question: "What is the cheapest way to travel?", answer: "The decisions flow from the biggest line: choose affordable flights first, move one metro stop off the tourist strip, and eat local. That trio does nine-tenths of the work." },
      { question: "How can I save money on food while travelling?", answer: "Supermarket breakfasts, market lunches and one planned splurge dinner. Eat where the workers eat and the price follows the quality." },
      { question: "Is travel insurance worth it on a budget trip?", answer: "Especially on a budget trip. One medical or cancellation event can erase the entire vacation fund - a decent policy is the cheapest line item of all." },
    ] },
  ];
  await upsertArticle({
    title: "How to Travel on a Budget Without Hating It",
    slug: "how-to-travel-on-a-budget",
    excerpt: "The transport lever, the accommodation move and the daily food win - budget travel that feels like travel, not sacrifice.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "how to travel on a budget",
    categorySlugs: ["budget-travel", "travel-tips"],
    coverImage: u("photo-1488646953014-85cb44e25828"),
    blocks: budgetBlocks,
    publishedAt: at(12),
  }, categoryIds, authorId);

  // ---------- Internal linking ----------
  const pairs: [string, string, number][] = [
    ["tokyo-travel-guide", "tokyo-itinerary-4-days", 60],
    ["tokyo-travel-guide", "best-things-to-do-in-tokyo", 55],
    ["tokyo-itinerary-4-days", "best-things-to-do-in-tokyo", 50],
    ["how-to-choose-travel-insurance", "best-travel-insurance-companies", 60],
    ["best-travel-insurance-companies", "how-to-travel-on-a-budget", 40],
    ["best-travel-insurance-companies", "solo-female-travel-safety-tips", 30],
    ["best-esim-for-travel-guide", "ultimate-carry-on-packing-guide", 40],
    ["best-esim-for-travel-guide", "best-carry-on-baggage-review", 40],
    ["best-carry-on-baggage-review", "ultimate-carry-on-packing-guide", 55],
    ["how-to-book-cheap-hotels", "how-to-plan-a-trip", 40],
    ["how-to-book-cheap-hotels", "best-hotels-in-rome", 40],
    ["best-tips-traveling-with-kids", "osaka-with-kids", 40],
    ["best-tips-traveling-with-kids", "paris-in-4-days-itinerary", 30],
    ["how-to-travel-on-a-budget", "how-to-find-cheap-flights", 45],
    ["how-to-travel-on-a-budget", "bali-on-a-budget", 40],
  ];
  for (const [a, b] of pairs) await ensureRelated(a, b);

  console.log("Tokyo + evergreen seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});