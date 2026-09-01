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
  console.log("Seeding Rome cluster...");

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

  // ---------- Rome in 4 days itinerary ----------
  const itineraryBlocks: ContentBlock[] = [
    { type: "p", text: "Four days is the sweet spot for a first Rome trip: enough to cover the ancient city, the Vatican and the evening neighbourhoods without turning sightseeing into a relay race. The trick is booking the two big timed entries early and pacing mornings hard, afternoons easy." },
    { type: "h2", text: "The itinerary at a glance" },
    { type: "ul", items: [
      "Day 1 - The ancient city: Colosseum, Roman Forum, Palatine Hill",
      "Day 2 - The Vatican: St Peter's Basilica, the dome climb, Vatican Museums",
      "Day 3 - Baroque Rome: Pantheon, Piazza Navona, Trevi Fountain, Spanish Steps",
      "Day 4 - Trastevere, markets, or a day trip to Ostia Antica",
    ] },
    { type: "h2", text: "Day 1: The ancient city" },
    { type: "p", text: "Morning belongs to the Colosseum. Book the earliest entry you can get - the combined ticket covers the Colosseum, the Roman Forum and Palatine Hill for two days, which is more walking than you think. Save the Forum and Palatine for the late afternoon when the sun drops behind the hill and the crowds thin." },
    { type: "ul", items: [
      "Book the Colosseum 30 days ahead on the official portal; morning slots vanish first",
      "Arena floor and underground access changes the experience - worth the skip-the-line tour",
      "Enter the Forum from the Via dei Fori Imperiali side to walk downhill into history",
      "Palatine Hill at golden hour is the best photo spot in the complex",
    ] },
    { type: "h2", text: "Day 2: The Vatican" },
    { type: "p", text: "Two buildings, one morning: climb St Peter's dome first for the view over the piazza, then take the elevator down route through the basilica to the Pieta, and loop back via the Vatican Museums for the Sistine Chapel. A timed Museums slot is essential in high season." },
    { type: "ul", items: [
      "Dome climb: about 551 steps for the full climb, or take the lift for the first half",
      "Vatican Museums: book timed entry; the Sistine Chapel is at the end, pace yourself",
      "The dress code means covered shoulders and knees - a quick scarf fixes both",
      "Wednesday morning audiences close parts of St Peter's - plan around it",
    ] },
    { type: "h2", text: "Day 3: Baroque Rome" },
    { type: "p", text: "This is the walking day. Start at the Pantheon (now with a timed ticket of its own), drift to Piazza Navona, toss a coin at Trevi before 10am, and finish at the Spanish Steps. The distances between them are short and the route carries coffee shops, gelato and statues at every turn." },
    { type: "ul", items: [
      "Pantheon interior: reserve a timed slot online; the 5 EUR charge is recent",
      "Trevi Fountain before breakfast is nearly empty - after lunch it is a wall of people",
      "Piazza Navona fountains are free, and the evening light is the best of the day",
      "The Jewish Ghetto lies five minutes away - lunch there beats the tourist strips",
    ] },
    { type: "h2", text: "Day 4: Trastevere, markets or a day trip" },
    { type: "p", text: "Turn the last day into a slow day. Cross the river to Trastevere for coffee and vintage-shop browsing, hit Campo de' Fiori or the Testaccio market for lunch shopping, and spend the afternoon however the weather invites - including an easy train to Ostia Antica, the old port city, if you have energy left." },
    { type: "hotels", title: "Hotels we feature in Rome", destinationId: cityIds.rome },
    { type: "cta", label: "Compare stays for your Rome dates", category: "HOTELS", destinationSlug: "rome", placement: "rome-4-days" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse hotels in Rome" },
    { type: "h2", text: "Pacing notes for families" },
    { type: "ul", items: [
      "Split the marathon days: one big site in the morning, pool or playground in the afternoon",
      "The shorter Villa Borghese lakeside is a gentler dose of Rome for younger kids",
      "Trains and metro pass the Colosseum area easily - avoid the longest walks",
      "Gelato breaks are non-negotiable infrastructure, not treats",
    ] },
    { type: "cta", label: "Find family-friendly tours and skip-the-line tickets", category: "ACTIVITIES", destinationSlug: "rome", placement: "rome-4-days" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Rome tours and tickets" },
    { type: "faq", items: [
      { question: "Is 4 days enough for Rome?", answer: "Yes for the essentials - the ancient city, the Vatican and the baroque highlights. Add a fifth day if you want Ostia Antica, villa day trips or a slower final morning." },
      { question: "How do I book the Colosseum?", answer: "Book the combined ticket 30 days ahead on the official portal, or book a skip-the-line tour for the arena floor and underground. Morning slots go first." },
      { question: "Where should I stay for this itinerary?", answer: "Centro Storico keeps everything walkable, Trastevere adds evening charm and near-Termini saves money. See our guide to the best hotels in Rome." },
    ] },
  ];
  const itineraryArticle = await upsertArticle({
    title: "Rome in 4 Days: A Complete Itinerary for First-Timers",
    slug: "rome-in-4-days-itinerary",
    excerpt: "Colosseum mornings, Vatican strategy, baroque walks and Trastevere evenings - a four-day Rome plan that dodges the worst queues.",
    type: "ITINERARY",
    destinationId: cityIds.rome,
    focusKeyword: "rome 4 day itinerary",
    categorySlugs: ["destination-guides", "family-travel"],
    coverImage: u("photo-1552832230-c0197dd311b5"),
    blocks: itineraryBlocks,
    publishedAt: at(60),
  }, categoryIds, authorId);

  await prisma.itinerary.upsert({
    where: { slug: "rome-in-4-days" },
    update: {},
    create: {
      title: "Rome in 4 Days",
      slug: "rome-in-4-days",
      summary: "A balanced first-timer plan: the ancient city, the Vatican, baroque Rome and a slow Trastevere finale.",
      days: 4,
      budgetLevel: "Mid-range",
      travelStyle: "First-timer classic",
      totalEstimatedCost: 950,
      currency: "USD",
      publishedAt: at(60),
      destinationId: cityIds.rome,
      authorId,
      articleId: itineraryArticle.id,
    },
  });
  const romeItineraryRow = await prisma.itinerary.findUnique({ where: { slug: "rome-in-4-days" } });
  if (romeItineraryRow) {
    const days: { dayNumber: number; description: string; activities: string[]; restaurants: string[]; hotel: string; transportation: string; estimatedCost: number }[] = [
      { dayNumber: 1, description: "Arrival into Fiumicino, train to Termini, drop bags and head straight to the Colosseum for the earliest available slot, then end the day on Palatine Hill.", activities: ["Colosseum", "Roman Forum", "Palatine Hill"], restaurants: ["Pizza near Monti", "Gelato on the walk back"], hotel: "Centro Storico or near Termini", transportation: "Airport rail + metro", estimatedCost: 110 },
      { dayNumber: 2, description: "Morning at the Vatican: dome climb first, then the basilica and the Museums for the Sistine Chapel.", activities: ["St Peter's dome", "St Peter's Basilica", "Vatican Museums"], restaurants: ["Pasta at lunch near the Vatican", "Roman-style pizzeria"], hotel: "Centro Storico", transportation: "Metro line A", estimatedCost: 130 },
      { dayNumber: 3, description: "The baroque walking day: Pantheon, Piazza Navona, early Trevi and the Spanish Steps before a late Ghetto lunch.", activities: ["Pantheon", "Piazza Navona", "Trevi Fountain", "Spanish Steps"], restaurants: ["Jewish Ghetto lunch", "Campo de' Fiori market snacks"], hotel: "Centro Storico", transportation: "Walking", estimatedCost: 120 },
      { dayNumber: 4, description: "Slow goodbye: Trastevere morning, Testaccio or Campo market, then train back to the airport in the afternoon.", activities: ["Trastevere wander", "Testaccio market"], restaurants: ["Trattoria in Trastevere"], hotel: "-", transportation: "Metro + airport rail", estimatedCost: 95 },
    ];
    for (const d of days) {
      const existingDay = await prisma.itineraryDay.findFirst({ where: { itineraryId: romeItineraryRow.id, dayNumber: d.dayNumber } });
      if (existingDay) continue;
      await prisma.itineraryDay.create({
        data: {
          itineraryId: romeItineraryRow.id,
          dayNumber: d.dayNumber,
          title: `Day ${d.dayNumber}`,
          location: d.dayNumber === 2 ? "Vatican / Prati" : "Rome city",
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

  // ---------- Best hotels in Rome ----------
  const hotelsBlocks: ContentBlock[] = [
    { type: "p", text: "Rome is a walking city, so the hotel question is less about luxury and more about which neighbourhood you want under your feet. The four choices below cover the classic first-trip positions - and booking them several months out makes a real difference to price." },
    { type: "h2", text: "The three questions that decide where you stay" },
    { type: "ul", items: [
      "How much do you want to walk? Centro Storico pays for itself in saved taxi rides",
      "Do you want nightlife or quiet? Trastevere is loud and wonderful, Monti is small and calm",
      "What is your daily budget? Hotels inside the walls cost more; near Termini and Testaccio undercut them",
    ] },
    { type: "h2", text: "Centro Storico: walk everywhere" },
    { type: "p", text: "The old core around Piazza Navona, Campo de' Fiori and Trevi puts you within a 40-minute stroll of almost everything you came to see. You pay for the position - rooms here run higher - but you barely touch the metro." },
    { type: "ul", items: ["Best for: first-timers and anniversary trips", "Expect: boutique hotels over big chains", "Watch: rooms above bars get late-night noise"] },
    { type: "h2", text: "Trastevere: the evening neighbourhood" },
    { type: "p", text: "Across the Tiber, Trastevere trades a few minutes of walking for Rome's best restaurant streets and a genuine village feel after dark. It is the smart choice for food-led travellers." },
    { type: "h2", text: "Near Termini: budget and convenience" },
    { type: "p", text: "The station district is no one's dream street, but the price gap is real, the metro is at the door and the first train out in the morning (including early airport sprints) starts here. Choose it for savings, not for charm." },
    { type: "h2", text: "Monti: boutique and stylish" },
    { type: "p", text: "The tiny neighbourhood between the Colosseum and the Forum packs vintage shops, wine bars and a local crowd into a few streets. It is the pick if you want a stylish small base with the ancient sites as your doorstep." },
    { type: "table", headers: ["Neighbourhood", "Vibe", "Best for"], rows: [
      ["Centro Storico", "Grand, walkable, touristed", "First-timers, couples"],
      ["Trastevere", "Evening life, trattorias", "Food lovers"],
      ["Near Termini", "Practical, cheaper", "Budget travellers, early trains"],
      ["Monti", "Boutique and calm", "Style-led visitors"],
    ] },
    { type: "hotels", title: "Hotels we feature in Rome", destinationId: cityIds.rome },
    { type: "cta", label: "Search hotels in Rome for your dates", category: "HOTELS", destinationSlug: "rome", placement: "rome-hotels" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Rome" },
    { type: "h2", text: "How to book a great Rome hotel for less" },
    { type: "ul", items: [
      "Book 3-6 months out for high season; Rome's best-value rooms sell first",
      "Choose refundable rates when hotel hop - prices drop, policy changes happen",
      "Compare the same hotel on two sites; the difference is often real",
      "July and August prices dip - the trade-off is the Roman heat",
    ] },
    { type: "cta", label: "Compare flights to Rome", category: "FLIGHTS", destinationSlug: "rome", placement: "rome-hotels" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Rome" },
    { type: "faq", items: [
      { question: "What is the best area to stay in Rome for a first visit?", answer: "Centro Storico for walkability, Trastevere for evening atmosphere, near-Termini for value. All three keep the main sights within a short metro or walking trip." },
      { question: "Where are the cheapest hotels in Rome?", answer: "Around Termini station and in Testaccio you will find the lowest prices on decent rooms - in exchange for less charm and a busier street scene." },
      { question: "Should I stay near the airport?", answer: "Only for a very late arrival or very early departure. For anything else, central Rome wins: the airport train reaches Termini in around 30 minutes." },
    ] },
  ];
  await upsertArticle({
    title: "Best Hotels in Rome: Where to Stay for Every Budget",
    slug: "best-hotels-in-rome",
    excerpt: "Centro Storico, Trastevere, near-Termini and Monti - the best Rome neighbourhoods and hotels, tested for a first trip.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.rome,
    focusKeyword: "best hotels in rome",
    categorySlugs: ["hotels"],
    coverImage: u("photo-1512918728675-ed5a9ecdebfd"),
    blocks: hotelsBlocks,
    publishedAt: at(52),
  }, categoryIds, authorId);

  // ---------- Best things to do in Rome ----------
  const thingsBlocks: ContentBlock[] = [
    { type: "p", text: "The shortlist of Rome experiences is long, but the list worth paying for is short. Booking strategy matters more than budget: two or three timed-entry bookings done early beat a dozen half-planned visits." },
    { type: "h2", text: "The big three: book these first" },
    { type: "ol", items: [
      "Colosseum arena and underground - the skip-the-line tour that turns a queue into an experience",
      "Vatican Museums with a timed slot - the Sistine Chapel ends the route, save your legs",
      "Pantheon interior - now a 5 EUR timed ticket rather than a walk-through",
    ] },
    { type: "h2", text: "Ancient and monumental" },
    { type: "ul", items: [
      "Roman Forum and Palatine Hill - the combined ticket with the Colosseum spans two days",
      "Ostia Antica - an easy train and an often-empty ancient port city",
      "Capuchin Crypt - bone-decorated chapels, strange and unforgettable",
      "Baths of Caracalla - vast Roman ruins with far fewer crowds than the Forum",
    ] },
    { type: "h2", text: "Baroque and cinematic" },
    { type: "ul", items: [
      "Trevi Fountain at breakfast time, when it is still possible to stand at the rail",
      "Piazza Navona at dusk - fountains, street artists and the late Roman light",
      "The Spanish Steps, watched from the rooftop cafés on the left at golden hour",
      "The Pantheon's oculus beam on a clear morning is the show the building designs itself",
    ] },
    { type: "h2", text: "Food and neighbourhood life" },
    { type: "ul", items: [
      "Trastevere for the city's best trattoria street, after 8pm for the real energy",
      "The Jewish Ghetto for carciofi alla giudia - the fried artichoke that is pure Rome",
      "Campo de' Fiori market in the morning, when the stalls take over the piazza",
      "A proper Roman carbonara - the no-cream version, from one of the famous two or three addresses",
    ] },
    { type: "h2", text: "Value for money choices" },
    { type: "ul", items: [
      "First Sunday of the month: free entry to state museums, including the Colosseum - arrive early",
      "Evening tours of the Colosseum and catacombs cost a little more and skip the heat",
      "The view from St Peter's dome costs about 10 EUR and beats every paid viewpoint in the city",
    ] },
    { type: "activities", title: "Experiences we feature in Rome", destinationId: cityIds.rome },
    { type: "cta", label: "See Rome tours, tickets and skip-the-line options", category: "ACTIVITIES", destinationSlug: "rome", placement: "rome-things" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Rome experiences" },
    { type: "cta", label: "Find a hotel near the sights", category: "HOTELS", destinationSlug: "rome", placement: "rome-things" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Rome" },
    { type: "faq", items: [
      { question: "How many days do I need to see the main Rome sights?", answer: "Two to three days covers the Colosseum, Vatican and baroque highlights comfortably if you book the timed entries ahead." },
      { question: "Are skip-the-line tours worth it in Rome?", answer: "For the Colosseum arena and underground and the Vatican Museums in high season - yes. They bundle the queue away and add context you would otherwise miss." },
      { question: "What is free in Rome?", answer: "Trevi, the Pantheon exterior, Piazza Navona, St Peter's Basilica and most piazzas. The dome climb is the best cheap viewpoint in the city." },
    ] },
  ];
  await upsertArticle({
    title: "Best Things to Do in Rome: 15 Experiences Worth Booking",
    slug: "best-things-to-do-in-rome",
    excerpt: "The Colosseum arena, Vatican strategy, baroque walks and Roman food rituals - the Rome experiences worth your time and money.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.rome,
    focusKeyword: "best things to do in rome",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1549144511-f099e773c147"),
    blocks: thingsBlocks,
    publishedAt: at(48),
  }, categoryIds, authorId);

  // ---------- Rome airport transfer guide ----------
  const airportBlocks: ContentBlock[] = [
    { type: "p", text: "Fiumicino (FCO) is the airport you will probably land at, and the transfer choice is a genuinely straight decision once you see the numbers. One train is the default, one is the budget smart-move, and taxis only win in specific situations." },
    { type: "table", headers: ["Option", "Cost", "Time to centre", "Best for"], rows: [
      ["Leonardo Express train", "About 14 EUR", "32 minutes to Termini", "The simple default"],
      ["FL1 regional train", "About 8 EUR", "50-60 minutes", "Budget trips, Trastevere/Testaccio"],
      ["Airport shuttle buses", "About 7 EUR", "55-70 minutes", "Cheapest, traffic-dependent"],
      ["Taxi (flat Fiumicino rate)", "About 50 EUR", "45-60 minutes", "Groups and heavy luggage"],
      ["Private transfer", "From about 60 EUR", "45-60 minutes", "Door-to-door comfort, families"],
    ] },
    { type: "h2", text: "The Leonardo Express: the simple default" },
    { type: "p", text: "The non-stop train to Termini leaves every 15 minutes or so, takes 32 minutes and costs around 14 EUR online or 15 on the day. It is the fastest, most reliable option, and Termini puts you on the metro to anywhere in the city." },
    { type: "ul", items: [
      "Buy tickets in the app or at machines before the platform (tap the blue readers to validate)",
      "Seat numbers exist but rarely matter - light crowds outside peak festival weekends",
      "Last train is late enough for most arrivals; very late flights should check the timetable",
    ] },
    { type: "h2", text: "The FL1: the budget smart move" },
    { type: "p", text: "The regional FL1 line costs about 8 EUR and heads to Roma Trastevere, Roma Ostiense and Roma Tiburtina instead of Termini. If your hotel is south of the river, it is cheaper and often faster than the Express - just check your stop first." },
    { type: "h2", text: "Taxis and the flat rate" },
    { type: "p", text: "Official white taxis from Fiumicino charge a fixed rate to the historic centre (around 50 EUR), set by the city. The rate applies only to journeys inside the walls, so confirm before you get in, and never accept touts - the official queue is at the terminal exit." },
    { type: "h2", text: "Private transfers: when they are worth it" },
    { type: "ul", items: [
      "Four or more people: the per-head cost crushes the taxi and beats the train comfortably",
      "Taxi and heavy luggage: door-to-door beats the walk from FCO station",
      "Very early departures: a booked driver removes the 4am stress entirely",
      "Kids: the car seat request is easier to arrange with a private company than a taxi queue",
    ] },
    { type: "h2", text: "What about Ciampino?" },
    { type: "p", text: "Ciampino (CIA), where many budget airlines fly, has no train into the city. The shuttle buses to the metro and Termini run regularly at around 6 EUR, and taxis use a similar flat-rate system. Leave a bigger buffer - the airport is small and queues build fast." },
    { type: "cta", label: "Compare flights to Rome", category: "FLIGHTS", destinationSlug: "rome", placement: "rome-airport" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search Rome flight options" },
    { type: "cta", label: "Find a hotel near Termini", category: "HOTELS", destinationSlug: "rome", placement: "rome-airport" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in central Rome" },
    { type: "faq", items: [
      { question: "How much is a taxi from Fiumicino to central Rome?", answer: "The fixed official rate is around 50 EUR to anywhere inside the historic walls, set by the city. Always take the official queue, not touts in the arrivals hall." },
      { question: "Which train from Fiumicino is best?", answer: "The Leonardo Express to Termini for speed and simplicity (32 minutes, about 14 EUR). The FL1 regional (about 8 EUR) is better if your stop is Trastevere, Ostiense or Tiburtina." },
      { question: "Is a private transfer from FCO worth it?", answer: "For groups of four or more, families with car seats, or very early departures - yes. For solo travellers and couples it is rarely better than the train." },
    ] },
  ];
  await upsertArticle({
    title: "Rome Airport Transfer Guide: Getting from FCO to the City",
    slug: "rome-airport-transfer-guide",
    excerpt: "Leonardo Express, FL1, the flat-rate taxi and private transfers - prices, times and the smartest way from Fiumicino into Rome.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.rome,
    focusKeyword: "rome airport transfer",
    categorySlugs: ["flights", "budget-travel"],
    coverImage: u("photo-1565967511849-76a60a516170"),
    blocks: airportBlocks,
    publishedAt: at(44),
  }, categoryIds, authorId);

  // ---------- Internal linking (RelatedArticle) ----------
  const pairs: [string, string, number][] = [
    ["rome-travel-guide", "rome-in-4-days-itinerary", 60],
    ["rome-travel-guide", "best-hotels-in-rome", 55],
    ["rome-travel-guide", "best-things-to-do-in-rome", 55],
    ["rome-travel-guide", "rome-airport-transfer-guide", 45],
    ["rome-in-4-days-itinerary", "best-hotels-in-rome", 55],
    ["rome-in-4-days-itinerary", "best-things-to-do-in-rome", 55],
    ["best-hotels-in-rome", "rome-airport-transfer-guide", 40],
    ["best-things-to-do-in-rome", "rome-airport-transfer-guide", 35],
  ];
  for (const [a, b] of pairs) await ensureRelated(a, b);

  console.log("Rome cluster seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});