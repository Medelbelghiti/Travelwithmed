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
  const existing = await prisma.article.findUnique({ where: { slug: input.slug } });
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

async function main() {
  console.log("Seeding destination articles…");

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

  // ---------- Rome ----------
  const romeBlocks: ContentBlock[] = [
    { type: "p", text: "Rome is three thousand years of history stacked on a walkable scale, but it rewards planning before you go. The two decisions that shape most first trips are where to stay and how you book the Colosseum — both are easier than people think once you know how the system works." },
    { type: "h2", text: "Rome in brief" },
    { type: "ul", items: ["Airport arrival: Fiumicino (FCO) via the non-stop Leonardo Express (about 32 minutes to Termini, around â‚¬14) or the slower FL1 regional train", "Currency: Euro; cards are accepted almost everywhere, carry a little cash for markets", "Walking is the real transport system — most highlights sit inside a 45-minute stroll", "Public transit: single metro/bus ticket â‚¬1.50, valid 100 minutes, including one metro ride"] },
    { type: "h2", text: "Where to stay" },
    { type: "p", text: "For a first visit, staying inside the old centre — near Piazza Navona, Campo de' Fiori or Trevi — means you can walk most of the itinerary. Trastevere, just across the Tiber, costs a little less and hands you the city's best restaurant street as a doorstep." },
    { type: "ul", items: ["Centro Storico — maximum charm, maximum walking", "Trastevere — evening energy, great food, slightly outside the crowds", "Near Termini — cheaper and convenient for early trains, quieter at night", "Monti — a tiny, stylish neighbourhood short walk from the Colosseum"] },
    { type: "hotels", title: "Hotels we feature in Rome", destinationId: cityIds.rome },
    { type: "h2", text: "Book the Colosseum the right way" },
    { type: "p", text: "The Colosseum, Roman Forum and Palatine Hill sell one combined ticket, and it's the single thing you should book in advance. Reservations normally open 30 days ahead on the official portal, and mid-morning slots vanish first. Aim for the day's first entry if you want the least crowded, best-lit photos." },
    { type: "ol", items: ["Standard combined ticket (Colosseum, Forum, Palatine): around â‚¬18, valid two days", "Full experience with arena floor and underground: around â‚¬24, book weeks ahead", "Skip-the-line guided options bundle the queue for you — worth it at peak hours", "The first Sunday of the month is free entry everywhere, and packed accordingly"] },
    { type: "cta", label: "See Colosseum tours and skip-the-line options", category: "ACTIVITIES", destinationSlug: "rome", placement: "rome-guide" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse guided tours in Rome" },
    { type: "h2", text: "Getting around without the stress" },
    { type: "p", text: "The metro has three lines and only touches some of the highlights, so expect to combine short rides with walking. Tickets work on bus, tram and metro; buy them at metro stations, tobacconists or the official app before boarding — inspectors don't accept excuses." },
    { type: "ul", items: ["Metro/bus single: â‚¬1.50 for 100 minutes", "24-hour pass: about â‚¬7; 48-hour pass: about â‚¬12.50", "Hop a taxi only for luggage hauls — otherwise traffic beats walking", "Fiumicinoâ†”city trains beat taxis by a wide margin in both price and time"] },
    { type: "cta", label: "Compare flight options to Rome", category: "FLIGHTS", destinationSlug: "rome", placement: "rome-guide" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Rome" },
    { type: "h2", text: "What costs money and what doesn't" },
    { type: "ul", items: ["Free: Trevi Fountain, the Pantheon exterior, St Peter's Basilica, most piazzas", "Pantheon interior: now requires a â‚¬5 ticket — reserve a timed slot online", "St Peter's dome climb: about â‚¬8-10, worth it for the view over the city", "Vatican Museums & Sistine Chapel: book timed entry well ahead"] },
    { type: "faq", items: [
      { question: "How many days do I need in Rome?", answer: "Three full days covers the ancient sites, the Vatican and a relaxed neighbourhood pass. Add a fourth if you want Ostia Antica or a day at the coast." },
      { question: "Should I book the Colosseum in advance?", answer: "Yes — same-day walk-up tickets sell out, especially in high season. Reserve 30 days ahead on the official portal for the standard ticket, or book a skip-the-line tour for the arena and underground." },
      { question: "Is Rome safe for first-time travellers?", answer: "Yes, but it's a busy tourist city. Keep wallets out of back pockets in crowded stations and squares, and ignore the uniformed strangers offering to check your documents." },
    ] },
  ];
  await upsertArticle({
    title: "Rome Travel Guide: What to Know Before You Go",
    slug: "rome-travel-guide",
    excerpt: "The Colosseum booking system, metro basics, neighbourhood picks and the free-versus-paid highlights that shape a first trip to Rome.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.rome,
    focusKeyword: "rome travel guide",
    categorySlugs: ["destination-guides", "budget-travel"],
    coverImage: u("photo-1552832230-c0197dd311b5"),
    blocks: romeBlocks,
    publishedAt: at(140),
  }, categoryIds, authorId);

  const romeArticle = await prisma.article.findUnique({ where: { slug: "rome-travel-guide" } });

  // ---------- Barcelona ----------
  const bcnBlocks: ContentBlock[] = [
    { type: "p", text: "Barcelona packs a beach, world-class architecture and a serious food scene into one compact city. The planning that matters most happens before arrival: booking the two Gaudí showpieces and choosing a neighbourhood that matches your rhythm — this is a city that starts late and ends late." },
    { type: "h2", text: "The two bookings to make early" },
    { type: "p", text: "Sagrada Família and Park Güell both sell timed entry and both sell out in high season. Sagrada Família releases tickets in batches and morning slots go first — book directly on the official site rather than paying third-party markups. For Park Güell, the Monumental Zone (the part with the famous mosaicked terrace) needs its own reserved entrance." },
    { type: "ul", items: ["Sagrada Família basic entry: around â‚¬26, plus â‚¬4-6 for the tower visit and lift", "Park Güell monument zone: around â‚¬10, separate timed tickets", "Book the earliest Sagrada slot for soft light and smaller crowds", "Set reminders — both sites open reservations several weeks ahead"] },
    { type: "cta", label: "Find skip-the-line tours and tickets", category: "ACTIVITIES", destinationSlug: "barcelona", placement: "bcn-guide" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Barcelona experiences" },
    { type: "h2", text: "Where to stay in Barcelona" },
    { type: "ul", items: ["El Born / Gothic Quarter — the historic core, boutique stays, great tapas streets", "Eixample — grand boulevards and Gaudí's buildings, quieter and wider pavements", "Gràcia — village-in-the-city feel, local cafés, less tourist traffic", "Barceloneta — beachfront, louder but steps from the sand"] },
    { type: "hotels", title: "Hotels we feature in Barcelona", destinationId: cityIds.barcelona },
    { type: "h2", text: "Getting around" },
    { type: "p", text: "The metro is fast, cheap and covers the sights. A single ride costs around â‚¬2.40; the T-casual 10-ride card is the practical choice for a few days. Walking beats transit in the old town — the distance between the Gothic Quarter, the Rambla and the waterfront is an easy stroll." },
    { type: "ul", items: ["Metro: fast and the best option for crossing town", "Walking: the old city is compact and rewarding", "Bike: flat coastal routes and Ciutadella park make it pleasant", "Airport: the R2 Snord train is cheapest; the Aerobús is direct to Plaça de Catalunya"] },
    { type: "h2", text: "Eating like a local" },
    { type: "p", text: "Dinner doesn't start until 9pm and lunch is the big meal. Skip the pre-made paella on the tourist strips near the port and look for counter-service bars serving tapas and pintxos at standing prices — some of Barcelona's best meals are one-bite collaborations with a house vermouth." },
    { type: "ul", items: ["Head to Gràcia or the streets off La Rambla for honest local prices", "La Boqueria market is gorgeous but touristy — shop for fruit, avoid the back-wall overpriced stalls", "Ask for 'conta corrupción' etiquette: pay-as-you-go by plate at old-school tapas bars", "Check the 'menu del día' at lunch for a fixed-price three-course meal"] },
    { type: "cta", label: "Compare stays across Barcelona", category: "HOTELS", destinationSlug: "barcelona", placement: "bcn-guide" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse hotels in Barcelona" },
    { type: "faq", items: [
      { question: "How many days do I need in Barcelona?", answer: "Three to four days covers the two Gaudí sites, the old town and a beach afternoon with room for a day trip like Montserrat." },
      { question: "Is Barcelona safe?", answer: "Yes, with a caveat: it's one of Europe's pickpocket hot spots. Keep bags zipped and in front in crowds on the metro and La Rambla, and ignore the classic distraction games." },
      { question: "Do I need to book Sagrada Família in advance?", answer: "Almost always yes. Walk-up slots exist on quiet days but vanish in high season; booking online removes the risk and the queue." },
    ] },
  ];
  await upsertArticle({
    title: "Barcelona Travel Guide: Plan a Great First Trip",
    slug: "barcelona-travel-guide",
    excerpt: "How to book Sagrada Família and Park Güell, pick a neighbourhood, ride the metro and eat well — the practical core of a Barcelona trip.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.barcelona,
    focusKeyword: "barcelona travel guide",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1583422409516-2895a77efded"),
    blocks: bcnBlocks,
    publishedAt: at(128),
  }, categoryIds, authorId);

  // ---------- Bali ----------
  const baliBlocks: ContentBlock[] = [
    { type: "p", text: "Bali is small enough to change regions in an afternoon and varied enough to feel like several islands. The big-ticket planning questions are entry requirements, which area matches your trip, and how you'll move around — skip those and a lovely trip turns stressful fast." },
    { type: "h2", text: "Arrival and entry basics" },
    { type: "ul", items: ["Visas: most nationalities can use the Visa on Arrival / eVOA (30 days, roughly IDR 500,000) — arrange it online before flying", "Currency: Indonesian rupiah (IDR); carry cash for warungs, hotels and drivers are happy with cards", "Airport: Ngurah Rai (DPS) near Kuta; arrange a driver or use a ride app for sane airport fares", "Language: Indonesian and Balinese; English works well in tourist areas"] },
    { type: "h2", text: "Which Bali are you looking for?" },
    { type: "table", headers: ["Area", "Vibe", "Best for"], rows: [
      ["Ubud", "Rivers, rice terraces, temples, yoga", "Culture, cafes, wellbeing retreats"],
      ["Canggu", "Surf beaches, trendy cafes, sunset crowds", "Young energy, digital nomads"],
      ["Seminyak", "Design hotels, beach clubs, boutiques", "Comfortable mid-range, couples"],
      ["Uluwatu", "Clifftop temples, world-class surf", "Slow coasts, dramatic scenery"],
      ["Nusa Penida", "Raw coastlines, day-trip boats", "Adventurous day out from the main island"],
    ] },
    { type: "h2", text: "Getting around" },
    { type: "p", text: "Most visitors pick between a scooter and a car with driver. Scooters are cheap and free, but southern traffic and unfamiliar roads make them a real hazard for first-timers — an international licence is required and local enforcement is relaxed until it isn't. A car and driver for the day, shared between a few people, is often the saner and barely more expensive option." },
    { type: "ul", items: ["Scooter hire: about IDR 50,000-70,000 per day plus fuel", "Car with driver: negotiate by the day or trip; settle the price before departing", "Ride apps (Gojek/Grab) for short, point-to-point moves", "Ferries to Nusa Penida island: frequent boats from Sanur"] },
    { type: "h2", text: "Temples, dress codes and quiet days" },
    { type: "p", text: "Bali's temples are living, working places. Cover shoulders and knees, wear a sash if offered, and step around rather than over offerings in the street. Remember the island's min 'quiet days' — Nyepi, the Balinese New Year — when everything closes for 24 hours, so flights and activities shut down too." },
    { type: "cta", label: "Find stays that match your Bali", category: "HOTELS", destinationSlug: "bali", placement: "bali-guide" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse hotels in Bali" },
    { type: "cta", label: "Compare flights to Bali", category: "FLIGHTS", destinationSlug: "bali", placement: "bali-guide" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Bali" },
    { type: "faq", items: [
      { question: "When should I visit Bali?", answer: "April to October is dry-season peak and costs most; May-June and September-June balance dry weather with lighter crowds and prices." },
      { question: "Do I need a visa for Bali?", answer: "Many nationalities can use the 30-day Visa on Arrival or the online eVOA. Check your passport's visa rules before booking." },
      { question: "Is it safe to rent a scooter in Bali?", answer: "Rental is easy, but Nusa coastal roads and heavy southern traffic see frequent accidents. If you're not a confident rider, a driver or ride apps are the safer call." },
    ] },
  ];
  await upsertArticle({
    title: "Bali Travel Guide: First-Timer's Planning Essentials",
    slug: "bali-travel-guide",
    excerpt: "Visas, the right region for your trip, scooter-versus-driver transport and temple etiquette — everything to sort before a first Bali trip.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.bali,
    focusKeyword: "bali travel guide",
    categorySlugs: ["destination-guides", "budget-travel"],
    coverImage: u("photo-1537996194471-e657df975ab4"),
    blocks: baliBlocks,
    publishedAt: at(116),
  }, categoryIds, authorId);

  // ---------- Osaka ----------
  const osakaBlocks: ContentBlock[] = [
    { type: "p", text: "Osaka is Japan's street-food capital and the country's most relaxed big city. It's also the smartest base in the region — Kyoto, Nara and Kobe all sit within a 30-45 minute train ride, so many travellers end up using Osaka's cheaper hotels as a home base for a week of day trips." },
    { type: "h2", text: "What makes Osaka different from Tokyo" },
    { type: "ul", items: ["Dotonbori: an artery of neon signs, takoyaki stalls and riverside crowds — best seen at night", "The Kansai food culture: takoyaki, okonomiyaki and kushikatsu, made to order in front of you", "A genuinely friendly localism — Osaka's banter culture is famous across Japan", "Fewer temples than Kyoto, more eating, drinking and people-watching"] },
    { type: "h2", text: "Two districts, one Osaka" },
    { type: "p", text: "The city splits into Minami (the Namba, Dotonbori and Shinsaibashi area — where the action is) and Kita (Umeda, the business and shopping heart). Most first trips orbit Minami, but a night in Umeda's rooftop garden or below-floor food arcades shows a calmer side." },
    { type: "hotels", title: "Hotels we feature in Osaka", destinationId: cityIds.osaka },
    { type: "h2", text: "Food: the Osaka shortlist" },
    { type: "ul", items: ["Takoyaki: octopus-filled batter balls, get them hot from a street stall in Dotonbori", "Okonomiyaki: the savoury pancake Osaka claims as its own", "Kushikatsu: deep-fried skewers — dip in sauce once, it's communal", "Kuromon Ichiba Market: the market corridor best visited in the morning"] },
    { type: "h2", text: "Moving around and day trips" },
    { type: "p", text: "An ICOCA card (tap-to-pay, reloadable at station machines) smooths all local rail and bus travel, and the JR network puts the region's biggest draws an easy ride away: Kyoto (about 30 minutes by special rapid), Nara (about 45 minutes), Kobe and Himeji Castle all work as day trips." },
    { type: "table", headers: ["Destination", "Transport from Osaka", "Typical travel time"], rows: [
      ["Kyoto", "JR Special Rapid Service", "About 30 minutes"],
      ["Nara (Nara Park)", "JR Yamatoji Line", "About 45 minutes"],
      ["Kobe (waterfront)", "JR rapid service", "About 25 minutes"],
      ["Himeji Castle", "JR Shinkansen or rapid", "60-90 minutes"],
    ] },
    { type: "cta", label: "Compare stays in Osaka", category: "HOTELS", destinationSlug: "osaka", placement: "osaka-guide" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse hotels in Osaka" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Osaka" },
    { type: "faq", items: [
      { question: "Is Osaka a good base for visiting Kyoto?", answer: "Yes — the direct rail link takes about 30 minutes, and Osaka hotels are often cheaper than Kyoto's. Base yourself in one city and day-trip the other." },
      { question: "Do I need a rail pass for Osaka?", answer: "For single-city stays, an ICOCA card usually beats a nationwide JR Pass. A pass pays off mainly if you'll take long-distance shinkansen legs like Tokyo-Osaka." },
      { question: "When should I visit Osaka?", answer: "Spring (March-May) and autumn (October-November) are the most pleasant; summer is hot and humid, winter is crisp but fairly mild." },
    ] },
  ];
  await upsertArticle({
    title: "Osaka Travel Guide: Japan's Food & Day-Trip Capital",
    slug: "osaka-travel-guide",
    excerpt: "Dotonbori food, Namba versus Umeda, the ICOCA card and the day trips that make Osaka the region's smartest base.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.osaka,
    focusKeyword: "osaka travel guide",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1553413077-190dd305871c"),
    blocks: osakaBlocks,
    publishedAt: at(104),
  }, categoryIds, authorId);

  // ---------- Kyoto ----------
  const kyotoBlocks: ContentBlock[] = [
    { type: "p", text: "Kyoto's temples are at their magic hour before the tour groups arrive — and that's the entire strategy of a well-planned visit. The single biggest mistake first-timers make is trying to see five famous sites by midday, then hitting traffic jams of people at each one." },
    { type: "h2", text: "The 6am rule" },
    { type: "p", text: "Kyoto rewards the earliest start of any city in Japan. Two or three headline shrines done before 8am gives you the rest of the day to move at leisure. Reserve your big sights for the morning and your afternoons for shopping streets, gardens and teahouses in Gion." },
    { type: "ul", items: ["Fushimi Inari Taisha: open 24 hours — the torii gates work best at sunrise", "Kiyomizu-dera: opens at 6am in season, before the hill fills", "Arashiyama bamboo grove: walk it before 8am or after sunset to keep the magic", "Sacred pacing: one megasite in the morning, one neighbourhood in the afternoon"] },
    { type: "h2", text: "Transport: buses beat trains here" },
    { type: "p", text: "Unlike Tokyo, Kyoto's metro is light and the sites spread out, so the 200-yen flat bus fare is the workhorse. Buy a one-day bus card or just tap with an ICOCA. Uphill sites like Kiyomizu and the bamboo grove love a taxi for the first stretch — cheap across a group and saves real energy." },
    { type: "hotels", title: "Hotels we feature in Kyoto", destinationId: cityIds.kyoto },
    { type: "h2", text: "Staying in one: the ryokan experience" },
    { type: "p", text: "A single night in a traditional ryokan is worth the premium — futons, yukata robes and a shared bath (usually onsen-style) deliver an evening no hotel can. Book early; the handful of city-centre ryokan sell out months ahead, and the etiquette (shoes off, baths before dinner) is easier than it looks." },
    { type: "h2", text: "Gion etiquette" },
    { type: "ul", items: ["Never chase, grab or block geisha in the streets — photographing performers without permission is poor form and often illegal to publish", "Respect wooden machiya buildings: many are private homes", "The flag-lined alleys are for residents first; walk softly after dark", "Book a teahouse experience ahead rather than hoping to stumble into one"] },
    { type: "activities", title: "Experiences we feature in Kyoto", destinationId: cityIds.kyoto },
    { type: "cta", label: "Find Kyoto tours and tea ceremonies", category: "ACTIVITIES", destinationSlug: "kyoto", placement: "kyoto-guide" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Kyoto experiences" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Kyoto" },
    { type: "faq", items: [
      { question: "How many days should I spend in Kyoto?", answer: "Three days is the typical comfortable minimum; five if you add day trips to Nara or farther afield. Try to do one temple area per morning rather than a marathon of them." },
      { question: "When is the best time to visit Kyoto?", answer: "Sakura season (late March-mid April) and autumn colours (mid November-early December) are stunning and crowded; quieter shoulders in May and late September are the sweet spot." },
      { question: "Is Kyoto walkable?", answer: "The individual areas are, but the city itself sprawls. Mix buses for flat distances with short taxis on hills and you'll cover a lot without burnout." },
    ] },
  ];
  await upsertArticle({
    title: "Kyoto Travel Guide: Master the Early-Morning Temples",
    slug: "kyoto-travel-guide",
    excerpt: "Beat the crowds with the 6am rule, ride the bus network, understand Gion etiquette and plan a ryokan night — the essentials of a Kyoto trip.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.kyoto,
    focusKeyword: "kyoto travel guide",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1493976040374-85c8e12f0c0e"),
    blocks: kyotoBlocks,
    publishedAt: at(92),
  }, categoryIds, authorId);

  const kyotoArticle = await prisma.article.findUnique({ where: { slug: "kyoto-travel-guide" } });

  // ---------- Kyoto & Osaka itinerary ----------
  const kixItineraryBlocks: ContentBlock[] = [
    { type: "p", text: "A relaxed five-day plan that uses Osaka as a cheap base and Kyoto as the cultural heart. The itinerary spreads famous sights across mornings — because in Kyoto, the early-riser wins — and leaves afternoons for food, gardens and wandering." },
    { type: "h2", text: "Who this itinerary is for" },
    { type: "p", text: "First-timers to the Kansai region who want Japan's classic culture experiences without an exhausting schedule. It assumes daytime rail travel between the two cities (about 30 minutes each way) and a reasonable tolerance for early starts." },
    { type: "ul", items: ["Day 1 — Arrive in Osaka: Dotonbori at night, takoyaki and neon", "Day 2 — Kyoto morning: Fushimi Inari at sunrise, then Kiyomizu-dera", "Day 3 — Arashiyama before 8am, bamboo grove, then a tea ceremony", "Day 4 — Nara day trip, then back to Osaka for Kuromon and street food", "Day 5 — Osaka Castle park and the Umeda food arcades before departure"] },
    { type: "h2", text: "Practical notes" },
    { type: "p", text: "An ICOCA card covers every train and bus in the plan, and a compact hotel in Namba or Umeda keeps things simple. Golden Week (late April to early May) is the one stretch to avoid — trains and temples hit peak crowd levels." },
    { type: "cta", label: "Compare hotels in Osaka", category: "HOTELS", destinationSlug: "osaka", placement: "kix-itinerary" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse Osaka hotels" },
    { type: "cta", label: "Find tours in Kyoto", category: "ACTIVITIES", destinationSlug: "kyoto", placement: "kix-itinerary" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Kyoto experiences" },
    { type: "faq", items: [
      { question: "Should I stay in Osaka or Kyoto?", answer: "Osaka is usually cheaper and livelier at night; Kyoto holds more atmosphere. Either works as a base — the two cities are 30 minutes apart, so pick by hotel price and nightlife taste." },
      { question: "Can I do Kyoto and Osaka in 5 days?", answer: "Yes, comfortably, if you day-trip between them rather than moving hotels. Add 2-3 days if you want both cities at a truly relaxed pace plus Nara or Kobe." },
    ] },
  ];
  const kixArticle = await upsertArticle({
    title: "Kyoto & Osaka in 5 Days: A Balanced Itinerary",
    slug: "kyoto-osaka-5-day-itinerary",
    excerpt: "Sunrise shrines, bamboo groves, street food and a Nara day trip — a five-day plan that balances Kyoto culture with Osaka's night energy.",
    type: "ITINERARY",
    destinationId: cityIds.kyoto,
    focusKeyword: "kyoto osaka itinerary",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1565967511849-76a60a516170"),
    blocks: kixItineraryBlocks,
    publishedAt: at(80),
  }, categoryIds, authorId);

  await prisma.itinerary.upsert({
    where: { slug: "kyoto-osaka-5-days" },
    update: {},
    create: {
      title: "Kyoto & Osaka in 5 Days",
      slug: "kyoto-osaka-5-days",
      summary: "A balanced Kansai plan: sunrise shrines in Kyoto, Arashiyama, a Nara day trip and Osaka's street-food nights.",
      days: 5,
      budgetLevel: "Mid-range",
      travelStyle: "Culture & food",
      totalEstimatedCost: 1150,
      currency: "USD",
      publishedAt: at(80),
      destinationId: cityIds.kyoto,
      authorId,
      articleId: kixArticle.id,
    },
  });
  const kixRow = await prisma.itinerary.findUnique({ where: { slug: "kyoto-osaka-5-days" } });
  if (kixRow) {
    const days: { dayNumber: number; description: string; activities: string[]; restaurants: string[]; hotel: string; transportation: string; estimatedCost: number }[] = [
      { dayNumber: 1, description: "Fly into KIX or ITM, take the train to Namba, drop bags and spend the evening in the Dotonbori neon canyon.", activities: ["Arrival train to Namba", "Dotonbori after dark", "First takoyaki of the trip"], restaurants: ["Street stalls on Dotonbori", "Okonomiyaki near Namba"], hotel: "Namba or Umeda base", transportation: "Airport express + subway", estimatedCost: 90 },
      { dayNumber: 2, description: "Early train to Kyoto, Fushimi Inari at first light, then Kiyomizu-dera and a slow afternoon around Gion.", activities: ["Fushimi Inari sunrise", "Kiyomizu-dera", "Gion and Hanamikoji lane"], restaurants: ["Kaiseki lunch near Gion", "Teahouse matcha sweets"], hotel: "Osaka base (return by rail)", transportation: "JR special rapid + buses", estimatedCost: 130 },
      { dayNumber: 3, description: "Arashiyama before the crowds, the bamboo grove and riverside, then a booked tea ceremony in the afternoon.", activities: ["Bamboo grove before 8am", "TenryÅ«-ji garden", "Tea ceremony experience"], restaurants: ["Soba lunch in Arashiyama"], hotel: "Osaka base", transportation: "JR + local buses", estimatedCost: 145 },
      { dayNumber: 4, description: "Day trip to Nara for the deer park and TÅdai-ji, back to Osaka for Kuromon market and a kushikatsu night.", activities: ["Nara Park and TÅdai-ji", "Kuromon Ichiba Market", "Shinsekai food street"], restaurants: ["Grilled mochi in Nara", "Kushikatsu in Shinsekai"], hotel: "Osaka base", transportation: "JR Yamatoji Line", estimatedCost: 100 },
      { dayNumber: 5, description: "Last morning in Osaka Castle park and the Umeda underground food arcades, then to the airport.", activities: ["Osaka Castle park", "Umeda chika centres"], restaurants: ["Breakfast in the Umeda arcades"], hotel: "—", transportation: "Airport express", estimatedCost: 80 },
    ];
    for (const d of days) {
      const existingDay = await prisma.itineraryDay.findFirst({ where: { itineraryId: kixRow.id, dayNumber: d.dayNumber } });
      if (existingDay) continue;
      await prisma.itineraryDay.create({
        data: {
          itineraryId: kixRow.id,
          dayNumber: d.dayNumber,
          title: `Day ${d.dayNumber}`,
          location: d.dayNumber <= 3 ? "Kyoto / Osaka" : "Osaka region",
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

  // mark related (idempotent)
  if (romeArticle && kyotoArticle) {
    const rel = await prisma.relatedArticle.findUnique({
      where: { articleId_relatedArticleId: { articleId: romeArticle.id, relatedArticleId: kyotoArticle.id } },
    });
    if (!rel) {
      await prisma.article.update({
        where: { id: romeArticle.id },
        data: { relatedArticlesA: { create: [{ relatedArticleId: kyotoArticle.id, relevanceScore: 20 }] } },
      });
    }
  }

  console.log("Destination articles seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});