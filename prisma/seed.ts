import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { blocksToText } from "@/lib/content";
import type { ContentBlock } from "@/lib/content";
import { AffiliateCategory as Cat } from "@prisma/client";

async function main() {
  console.log("Seeding Riversmag…");

  // ---------- Admin user ----------
  const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "admin@riversmag.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "riversmag-admin";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash, name: "Riversmag Admin" },
    create: { email: adminEmail, role: "ADMIN", passwordHash, name: "Riversmag Admin", isActive: true },
  });
  console.log(`Admin user ready: ${adminEmail}`);

  // ---------- Categories ----------
  const categories = [
    { name: "Destination Guides", slug: "destination-guides", type: "content", sortOrder: 1 },
    { name: "Things to Do", slug: "things-to-do", type: "content", sortOrder: 2 },
    { name: "Travel Tips", slug: "travel-tips", type: "content", sortOrder: 3 },
    { name: "Budget Travel", slug: "budget-travel", type: "travel_style", sortOrder: 4 },
    { name: "Luxury Travel", slug: "luxury-travel", type: "travel_style", sortOrder: 5 },
    { name: "Family Travel", slug: "family-travel", type: "travel_style", sortOrder: 6 },
    { name: "Solo Travel", slug: "solo-travel", type: "travel_style", sortOrder: 7 },
    { name: "Hotels", slug: "hotels", type: "planning", sortOrder: 8 },
    { name: "Flights", slug: "flights", type: "planning", sortOrder: 9 },
    { name: "Travel Gear", slug: "travel-gear", type: "planning", sortOrder: 10 },
  ];
  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, type: c.type, sortOrder: c.sortOrder },
      create: { ...c, description: null },
    });
    categoryIds[c.slug] = row.id;
  }
  console.log(`Categories: ${Object.keys(categoryIds).length}`);

  // ---------- Author ----------
  const author = await prisma.author.upsert({
    where: { slug: "maya-chen" },
    update: {},
    create: {
      name: "Maya Chen",
      slug: "maya-chen",
      role: "Senior Travel Editor",
      bio: "Maya writes practical, information-first travel guides with a focus on real planning details — logistics, budgets and the questions most guides skip.",
      expertise: "Europe, Japan, planning & budgets",
      location: "Lisbon, Portugal",
    },
  });
  console.log(`Author: ${author.name}`);

  // ---------- Destinations ----------
  const regions = [
    { name: "Europe", slug: "europe", overview: "Compact, connected and endlessly varied — a first-timer favourite and a returner's playground." },
    { name: "Asia", slug: "asia", overview: "From megacities to island escapes, Asia spans every budget and travel style." },
    { name: "Africa", slug: "africa", overview: "Cities, deserts, coastlines and wildlife — Africa rewards slow, thoughtful itineraries." },
    { name: "Americas", slug: "americas", overview: "Two continents of road trips, cities and natural wonders." },
    { name: "Middle East", slug: "middle-east", overview: "Ancient cities, dramatic desert and a fast-growing hospitality scene." },
  ];
  const regionIds: Record<string, string> = {};
  for (const r of regions) {
    const row = await prisma.destination.upsert({
      where: { slug: r.slug },
      update: { name: r.name, overview: r.overview, isActive: true },
      create: { ...r, type: "REGION", isActive: true },
    });
    regionIds[r.slug] = row.id;
  }

  const countries = [
    { name: "France", slug: "france", region: "europe", capital: "Paris", language: "French", currency: "Euro (EUR)", timezone: "CET (UTC+1)", safety: "Generally safe; pickpockets common in tourist areas and on the metro." },
    { name: "Japan", slug: "japan", region: "asia", capital: "Tokyo", language: "Japanese", currency: "Japanese Yen (JPY)", timezone: "JST (UTC+9)", safety: "Very safe; cash is still widely used, so carry some." },
    { name: "Morocco", slug: "morocco", region: "africa", capital: "Rabat", language: "Arabic, Berber, French", currency: "Dirham (MAD)", timezone: "WEST (UTC+1)", safety: "Generally safe; expect haggling and persistent street vendors in medinas." },
    { name: "Italy", slug: "italy", region: "europe", capital: "Rome", language: "Italian", currency: "Euro (EUR)", timezone: "CET (UTC+1)", safety: "Safe overall; watch belongings in crowded train stations and squares." },
    { name: "Indonesia", slug: "indonesia", region: "asia", capital: "Jakarta", language: "Indonesian", currency: "Rupiah (IDR)", timezone: "WITA (UTC+8)", safety: "Safe; arrange island transfers and activities through reputable operators." },
    { name: "Spain", slug: "spain", region: "europe", capital: "Madrid", language: "Spanish", currency: "Euro (EUR)", timezone: "CET (UTC+1)", safety: "Safe; late dinners mean most attractions open later too." },
  ];
  const countryIds: Record<string, string> = {};
  for (const c of countries) {
    const { region, ...rest } = c;
    const row = await prisma.destination.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isActive: true },
      create: { ...rest, type: "COUNTRY", parentId: regionIds[region], tagline: `${c.name} made simple: what to know before you go.`, isActive: true },
    });
    countryIds[c.slug] = row.id;
  }

  const cities = [
    { name: "Paris", slug: "paris", country: "france", tagline: "Museums, food and long walks along the Seine." },
    { name: "Tokyo", slug: "tokyo", country: "japan", tagline: "Neighbourhoods, trains and the best first meal of your trip." },
    { name: "Marrakech", slug: "marrakech", country: "morocco", tagline: "A walled city of souks, courtyards and rooftop terraces." },
    { name: "Rome", slug: "rome", country: "italy", tagline: "Three thousand years of history on a walkable scale." },
    { name: "Bali", slug: "bali", country: "indonesia", tagline: "Temples, terraced rice and island time." },
    { name: "Barcelona", slug: "barcelona", country: "spain", tagline: "Gaudí, tapas and a city built around the sea." },
    { name: "Osaka", slug: "osaka", country: "japan", tagline: "Japan's street-food capital." },
    { name: "Kyoto", slug: "kyoto", country: "japan", tagline: "Temples, gardens and traditional teahouses." },
  ];
  const cityIds: Record<string, string> = {};
  for (const c of cities) {
    const { country, ...rest } = c;
    const row = await prisma.destination.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isActive: true },
      create: { ...rest, type: "CITY", parentId: countryIds[country], isActive: true },
    });
    cityIds[c.slug] = row.id;
  }
  console.log(`Destinations: ${regions.length + countries.length + cities.length}`);

  // ---------- Hotels ----------
  const hotels = [
    { name: "Hôtel du Petit Moulin", slug: "hotel-du-petit-moulin", city: "Paris", country: "France", destinationId: cityIds.paris, starRating: 4, priceRange: "$$$", bestFor: "Boutique stays in Le Marais", image: "" },
    { name: "Le Meurice", slug: "le-meurice", city: "Paris", country: "France", destinationId: cityIds.paris, starRating: 5, priceRange: "$$$$", bestFor: "Statement luxury near the Tuileries", image: "" },
    { name: "Hôtel Joke Astotel", slug: "hotel-joke-astotel", city: "Paris", country: "France", destinationId: cityIds.paris, starRating: 4, priceRange: "$$", bestFor: "Design-forward value in the 9th", image: "" },
    { name: "SHIBUYA HOTEL EN", slug: "shibuya-hotel-en", city: "Tokyo", country: "Japan", destinationId: cityIds.tokyo, starRating: 4, priceRange: "$$$", bestFor: "Mid-century design near Shibuya Station", image: "" },
    { name: "Ryokan Tsubaki", slug: "ryokan-tsubaki", city: "Tokyo", country: "Japan", destinationId: cityIds.tokyo, starRating: 4, priceRange: "$$$$", bestFor: "A classic ryokan stay in the city", image: "" },
    { name: "Riad Al Badia", slug: "riad-al-badia", city: "Marrakech", country: "Morocco", destinationId: cityIds.marrakech, starRating: 4, priceRange: "$$$", bestFor: "A courtyard escape in the medina", image: "" },
    { name: "La Sultana Marrakech", slug: "la-sultana-marrakech", city: "Marrakech", country: "Morocco", destinationId: cityIds.marrakech, starRating: 5, priceRange: "$$$$", bestFor: "Palace-style luxury steps from the Kasbah", image: "" },
    { name: "Hotel Artemide", slug: "hotel-artemide", city: "Rome", country: "Italy", destinationId: cityIds.rome, starRating: 4, priceRange: "$$$", bestFor: "Central rooftop stay near Via Nazionale", image: "" },
  ];
  for (const h of hotels) {
    const { city, country, ...rest } = h;
    await prisma.hotel.upsert({
      where: { slug: h.slug },
      update: { ...rest },
      create: { ...rest, city, country, description: `${h.name} — ${h.bestFor}. ${h.starRating}-star city hotel featured in our ${h.city} guides.`, isActive: true },
    });
  }
  console.log(`Hotels: ${hotels.length}`);

  // ---------- Activities ----------
  const activities = [
    { name: "Louvre Skip-the-Line Guided Tour", slug: "louvre-skip-the-line-guided-tour", city: "paris", category: "Museums", duration: "3 hours", bestFor: "First-time visitors covering the highlights" },
    { name: "Seine River Evening Cruise", slug: "seine-river-evening-cruise", city: "paris", category: "Boat Tours", duration: "1 hour", bestFor: "City views after sunset" },
    { name: "Mount Fuji Day Trip from Tokyo", slug: "mount-fuji-day-trip-from-tokyo", city: "tokyo", category: "Day Trips", duration: "Full day", bestFor: "Getting out of the city in one day" },
    { name: "Tea Ceremony in Kyoto", slug: "tea-ceremony-in-kyoto", city: "kyoto", category: "Culture", duration: "1.5 hours", bestFor: "A hands-on traditional experience" },
    { name: "Marrakech Food Tour", slug: "marrakech-food-tour", city: "marrakech", category: "Food", duration: "3 hours", bestFor: "Tasting the medina beyond the main squares" },
    { name: "Roman Forum and Colosseum Tour", slug: "roman-forum-and-colosseum-tour", city: "rome", category: "History", duration: "3 hours", bestFor: "Context for two of Rome's biggest sites" },
  ];
  for (const a of activities) {
    const { city, ...rest } = a;
    await prisma.activity.upsert({
      where: { slug: a.slug },
      update: { ...rest },
      create: { ...rest, destinationId: cityIds[city], isActive: true },
    });
  }
  console.log(`Activities: ${activities.length}`);

  // ---------- Products ----------
  const products = [
    { name: "Universal Travel Adapter", slug: "universal-travel-adapter", brand: "Nomad Essentials", category: "Adapters", priceRange: "$", bestFor: "Packing for multiple countries" },
    { name: "Packable Daypack", slug: "packable-daypack", brand: "TrailLight", category: "Bags", priceRange: "$", bestFor: "Day trips and metro days" },
    { name: "Travel eSIM Starter Guide", slug: "travel-esim-starter-guide", brand: "Riversmag", category: "Connectivity", priceRange: "Free", bestFor: "Understanding eSIMs before you buy" },
    { name: "Refillable Water Bottle with Filter", slug: "refillable-water-bottle-with-filter", brand: "PureFlow", category: "Travel Gear", priceRange: "$", bestFor: "Cutting costs and plastic waste" },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p, isActive: true },
    });
  }
  console.log(`Products: ${products.length}`);

  // ---------- Affiliate links ----------
  const affiliateLinks = [
    { partnerName: "Booking.com", category: Cat.HOTELS, productName: "Booking.com search", destinationText: "paris", targetUrl: "https://www.booking.com/searchresults.en.html?ss=Paris", dealTitle: "Up to 15% off member deals", promoCode: "ROAMORA15", featuredDeal: true, priority: 90 },
    { partnerName: "Booking.com", category: Cat.HOTELS, productName: "Booking.com search", destinationText: "tokyo", targetUrl: "https://www.booking.com/searchresults.en.html?ss=Tokyo", dealTitle: "Member prices on stays", featuredDeal: false },
    { partnerName: "Booking.com", category: Cat.HOTELS, productName: "Booking.com search", destinationText: "marrakech", targetUrl: "https://www.booking.com/searchresults.en.html?ss=Marrakech", dealTitle: "Member prices on stays", featuredDeal: false },
    { partnerName: "SkyScanner", category: Cat.FLIGHTS, productName: "Flight search", destinationText: "paris", targetUrl: "https://www.skyscanner.net/?AID=7707607&PID=8058953&associateid=roamora", dealTitle: "Compare 1,200+ airlines in one search", featuredDeal: true, priority: 80 },
    { partnerName: "GetYourGuide", category: Cat.ACTIVITIES, productName: "Tours & experiences", destinationText: "paris", targetUrl: "https://www.getyourguide.com/paris-l16/?partner_id=K0KEBIE", dealTitle: "Free cancellation on most tours", featuredDeal: true },
    { partnerName: "GetYourGuide", category: Cat.ACTIVITIES, productName: "Tours & experiences", destinationText: "kyoto", targetUrl: "https://www.getyourguide.com/kyoto-l204/?partner_id=K0KEBIE", dealTitle: "Book ahead, skip the queues", featuredDeal: false },
    { partnerName: "DiscoverCars", category: Cat.CAR_RENTAL, productName: "Car rentals", destinationText: null, targetUrl: "https://www.discovercars.com/?a_aid=med1996", dealTitle: "Free cancellation car hire", promoCode: "ROAMORA", featuredDeal: true },
    { partnerName: "SafetyWing", category: Cat.INSURANCE, productName: "Travel medical insurance", destinationText: null, targetUrl: "https://safetywing.com/nomad-insurance/?referenceID=26591197", dealTitle: "Pay-as-you-go travel insurance", featuredDeal: true, priority: 70 },
    { partnerName: "Airalo", category: Cat.ESIM, productName: "Global eSIM store", destinationText: null, targetUrl: "https://www.airalo.com/", dealTitle: "eSIMs for 200+ countries", promoCode: "ROAMORA10", featuredDeal: true },
    { partnerName: "Amazon", category: Cat.TRAVEL_GEAR, productName: "Travel gear storefront", destinationText: null, targetUrl: "https://www.amazon.com/?tag=medelbelghiti-20", dealTitle: "Packing essentials storefront", featuredDeal: false },
  ];
  for (const l of affiliateLinks) {
    const existingLink = await prisma.affiliateLink.findFirst({
      where: { category: l.category, partnerName: l.partnerName, productName: l.productName },
    });
    const { destinationText, ...linkData } = l;
    const row = existingLink
      ? await prisma.affiliateLink.update({ where: { id: existingLink.id }, data: { ...linkData, targetUrl: l.targetUrl, active: true } })
      : await prisma.affiliateLink.create({ data: { ...linkData, utmCampaign: "seed", utmContent: null } });
    if (destinationText) {
      const dest = await prisma.destination.findUnique({ where: { slug: destinationText } });
      if (dest) await prisma.affiliateLink.update({ where: { id: row.id }, data: { destinationId: dest.id } });
    }
  }
  console.log(`Affiliate links: ${affiliateLinks.length}`);

  // ---------- Articles ----------
  const parisBlocks: ContentBlock[] = [
    { type: "p", text: "Paris rewards a little homework. This guide covers the practical decisions that shape a first trip: which neighbourhood to stay in, how to use the metro, what to book ahead and how to avoid the biggest rookie mistakes." },
    { type: "h2", text: "Where to stay in Paris" },
    { type: "p", text: "Base your choice on the kind of trip you want. For a first visit, staying central between the Louvre and the Marais keeps almost everything within a 30-minute walk or a short metro ride." },
    { type: "ul", items: ["Le Marais — boutiques, cafés and historic streets, lively day and night", "Saint-Germain-des-Prés — classic Parisian elegance near the Seine", "The 9th — better value, with the Opéra and great brasseries nearby", "Latin Quarter — student energy, bookshops and affordable eats"] },
    { type: "hotels", title: "Hotels we feature in Paris", destinationId: cityIds.paris },
    { type: "h2", text: "Getting around" },
    { type: "p", text: "The metro is fast, frequent and covers everything you'll want to see. Buy a Navigo Easy card at any station and load tickets onto it — cheaper than single paper tickets and much faster at the gates." },
    { type: "ul", items: ["Metro & RER: single ticket â‚¬2.15; a carnet of 10 is cheaper", "Buses: scenic and slower, but excellent for the boulevards", "Walking: the real way to see Paris — bring comfortable shoes", "Bike share: the Vélib' network is great for flat routes along the Seine"] },
    { type: "h2", text: "What to book ahead" },
    { type: "ol", items: ["Must-see timed museums (Louvre, Orsay, Orangerie) — reserved slots sell out", "Popular restaurants — Paris still books well in advance for dinner", "Day trips (Versailles) — the train and skip-the-line tickets go quickly", "Shows and river cruises in the evenings"] },
    { type: "cta", label: "Browse hotels in Paris", category: Cat.HOTELS, destinationSlug: "paris", placement: "seed-article" },
    { type: "faq", items: [
      { question: "How many days do I need in Paris?", answer: "Four full days is a comfortable first-trip minimum — enough for the headline museums, a Marais afternoon and a day trip or a slow day along the Seine." },
      { question: "Is Paris expensive?", answer: "Compared with other European capitals it's mid-range. Accommodation is the biggest cost; food, transport and most museums are reasonably priced if you plan ahead." },
      { question: "Do I need to speak French?", answer: "No, but a handful of phrases go a long way. Most people in the city centre will meet you in English." },
    ] },
  ];
  const parisArticle = await upsertArticle({
    title: "Paris Travel Guide: What to Know Before You Go",
    slug: "paris-travel-guide",
    excerpt: "Neighbourhoods, transport, booking tips and the practical details that make a first trip to Paris go smoothly.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.paris,
    focusKeyword: "paris travel guide",
    categorySlugs: ["destination-guides", "budget-travel"],
    blocks: parisBlocks,
  }, categoryIds);

  const tokyoBlocks: ContentBlock[] = [
    { type: "p", text: "Tokyo is less overwhelming than it first appears — once you know how to use the trains and which neighbourhood fits your trip, the city opens up quickly." },
    { type: "h2", text: "Neighbourhoods at a glance" },
    { type: "ul", items: ["Shinjuku — the classic Tokyo: neon, izakayas and incredible logistics", "Shibuya — the crossing, fashion and young energy", "Asakusa — temples, crafts and old-Tokyo atmosphere", "Ginza — department stores, galleries and high-end dining"] },
    { type: "h2", text: "Moving around" },
    { type: "p", text: "The JR Yamanote loop line connects nearly everything you'll want. An IC card (Suica or Pasmo) is the easiest way to pay — tap on and off, reloadable at any station." },
    { type: "hotels", title: "Featured hotels in Tokyo", destinationId: cityIds.tokyo },
    { type: "cta", label: "Find tours around Tokyo", category: Cat.ACTIVITIES, destinationSlug: "tokyo", placement: "seed-article" },
    { type: "faq", items: [
      { question: "Is cash or card better in Tokyo?", answer: "Both. Cards are widely accepted now, but many small restaurants, market stalls and temples remain cash-only — keep ¥10,000 handy." },
      { question: "How do I get from Narita to the city?", answer: "The Narita Express takes about an hour to Tokyo Station. The cheaper Skyliner is convenient if you're staying in the east of the city." },
    ] },
  ];
  await upsertArticle({
    title: "Tokyo Travel Guide: First-Timer's Planning Guide",
    slug: "tokyo-travel-guide",
    excerpt: "How to plan a first trip to Tokyo: transport, neighbourhoods, cash and the details that trip people up.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.tokyo,
    focusKeyword: "tokyo travel guide",
    categorySlugs: ["destination-guides"],
    blocks: tokyoBlocks,
  }, categoryIds);

  const marrakechBlocks: ContentBlock[] = [
    { type: "p", text: "A few half-day experiences in Marrakech will shape your whole trip. Prioritise the medina in the morning, the gardens at midday and sunset from a rooftop." },
    { type: "ul", items: ["Jardin Majorelle and the YSL Museum — book an early slot", "The medina souks — start at Jemaa el-Fnaa and get lost on purpose", "Bahia Palace — a quiet gem with intricate courtyards", "Rooftop tea at sunset over the Koutoubia mosque"] },
    { type: "activities", title: "Experiences we feature in Marrakech", destinationId: cityIds.marrakech },
    { type: "cta", label: "Compare stays in Marrakech", category: Cat.HOTELS, destinationSlug: "marrakech", placement: "seed-article" },
    { type: "faq", items: [
      { question: "Should I hire a guide for the medina?", answer: "Not mandatory, but a local guide for the first afternoon helps you read the souks and the negotiating culture." },
      { question: "What do I wear in Marrakech?", answer: "Dress modestly — shoulders and knees covered — to avoid unwanted attention and to respect local norms. The heat makes breathable fabrics essential." },
    ] },
  ];
  const marrakechArticle = await upsertArticle({
    title: "Best Things to Do in Marrakech",
    slug: "best-things-to-do-in-marrakech",
    excerpt: "A shortlist of the Marrakech experiences worth your time — and the planning details that make them work.",
    type: "THINGS_TO_DO",
    destinationId: cityIds.marrakech,
    focusKeyword: "things to do in marrakech",
    categorySlugs: ["things-to-do"],
    blocks: marrakechBlocks,
  }, categoryIds);

  // ---------- Itinerary (linked to its article) ----------
  const itineraryBlocks: ContentBlock[] = [
    { type: "p", text: "A relaxed 4-day Paris itinerary that fits a first visit — the headline museums, a Marais afternoon, a day trip and lots of walks along the Seine." },
    { type: "h2", text: "Who this itinerary is for" },
    { type: "p", text: "First-time visitors who want a balanced trip: culture, food, a little shopping and time to wander. It assumes you're staying central and happy to use the metro." },
    { type: "ul", items: ["Day 1 — Arrival and the Latin Quarter", "Day 2 — The Louvre and the Marais", "Day 3 — Versailles day trip", "Day 4 — Montmartre and a river cruise"] },
  ];
  const itineraryArticle = await upsertArticle({
    title: "Paris in 4 Days: A Complete Itinerary",
    slug: "paris-in-4-days-itinerary",
    excerpt: "A relaxed four-day Paris plan covering the Louvre, the Marais, Versailles and Montmartre — with budget notes for first-timers.",
    type: "ITINERARY",
    destinationId: cityIds.paris,
    focusKeyword: "paris 4 day itinerary",
    categorySlugs: ["destination-guides", "family-travel"],
    blocks: itineraryBlocks,
  }, categoryIds);

  await prisma.itinerary.upsert({
    where: { slug: "paris-in-4-days" },
    update: {},
    create: {
      title: "Paris in 4 Days",
      slug: "paris-in-4-days",
      summary: "A balanced first-visit plan: museums, markets, Versailles and slow walks along the Seine.",
      days: 4,
      budgetLevel: "Mid-range",
      travelStyle: "Culture & food",
      totalEstimatedCost: 820,
      currency: "USD",
      publishedAt: new Date(),
      destinationId: cityIds.paris,
      authorId: author.id,
      articleId: itineraryArticle.id,
    },
  });
  // attach days
  const itineraryRow = await prisma.itinerary.findUnique({ where: { slug: "paris-in-4-days" } });
  if (itineraryRow) {
    const days: {
      dayNumber: number;
      description: string;
      activities: string[];
      restaurants: string[];
      hotel: string;
      transportation: string;
      estimatedCost: number;
    }[] = [
      { dayNumber: 1, description: "Land, drop bags, and ease in with a walk along the Seine and dinner in the Latin Quarter.", activities: ["Walk the Latin Quarter", "Dinner near the Panthéon"], restaurants: ["Bouillon Racine (classic), nearby brasseries"], hotel: "Hôtel Joke Astotel", transportation: "Metro from Gare du Nord", estimatedCost: 80 },
      { dayNumber: 2, description: "A timed morning at the Louvre, then a slow afternoon in the Marais with a picnic from a boulangerie.", activities: ["Louvre morning slot", "Marais walk", "Place des Vosges"], restaurants: ["Boulangerie breakfast", "Falafel in the Marais"], hotel: "Hôtel Joke Astotel", transportation: "Metro + walking", estimatedCost: 60 },
      { dayNumber: 3, description: "Early RER to Versailles, tour the palace and gardens, then dinner back in the city.", activities: ["Versailles palace & gardens"], restaurants: ["Lunch near Versailles", "Dinner in the 7th"], hotel: "Hôtel Joke Astotel", transportation: "RER C to Versailles", estimatedCost: 120 },
      { dayNumber: 4, description: "Morning on the hill, lunch in Pigalle, then a sunset cruise along the Seine before departure.", activities: ["Montmartre & Sacré-CÅ“ur", "Seine evening cruise"], restaurants: ["Lunch in Pigalle"], hotel: "Hôtel Joke Astotel", transportation: "Metro + cruise", estimatedCost: 90 },
    ];
    for (const d of days) {
      const existingDay = await prisma.itineraryDay.findFirst({ where: { itineraryId: itineraryRow.id, dayNumber: d.dayNumber } });
      if (existingDay) continue;
      await prisma.itineraryDay.create({
        data: {
          itineraryId: itineraryRow.id,
          dayNumber: d.dayNumber,
          title: `Day ${d.dayNumber}`,
          location: "Paris",
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
  console.log(`Itinerary: Paris in 4 Days`);

  // mark related (idempotent)
  const parisRelation = await prisma.relatedArticle.findUnique({
    where: { articleId_relatedArticleId: { articleId: parisArticle.id, relatedArticleId: marrakechArticle.id } },
  });
  if (!parisRelation) {
    await prisma.article.update({ where: { id: parisArticle.id }, data: { relatedArticlesA: { create: [{ relatedArticleId: marrakechArticle.id, relevanceScore: 40 }] } } });
  }

  // ---------- eSIM articles ----------
  const esimDestinations = [
    { slug: "paris", name: "Paris" },
    { slug: "tokyo", name: "Tokyo" },
    { slug: "new-york", name: "New York" },
    { slug: "bangkok", name: "Bangkok" },
    { slug: "barcelona", name: "Barcelona" },
    { slug: "rome", name: "Rome" },
    { slug: "marrakech", name: "Marrakech" },
    { slug: "lisbon", name: "Lisbon" },
    { slug: "cairo", name: "Cairo" },
    { slug: "rio-de-janeiro", name: "Rio de Janeiro" },
    { slug: "miami", name: "Miami" },
    { slug: "los-angeles", name: "Los Angeles" },
    { slug: "bali", name: "Bali" },
    { slug: "athens", name: "Athens" },
  ];
  let esimCount = 0;
  for (const d of esimDestinations) {
    const dest = await prisma.destination.findUnique({ where: { slug: d.slug } });
    if (!dest) { console.log(`  Skipping ${d.slug} — not found`); continue; }
    const existingEsim = await prisma.affiliateLink.findFirst({ where: { category: Cat.ESIM, destinationId: dest.id } });
    if (!existingEsim) {
      await prisma.affiliateLink.create({ data: { partnerName: "Airalo", category: Cat.ESIM, productName: `eSIM for ${d.name}`, destinationText: d.name, destinationId: dest.id, targetUrl: "https://www.airalo.com/?referenceID=26591197", dealTitle: "eSIM data plans for travel", promoCode: "ROAMORA10", active: true, priority: 85, utmCampaign: "destination-esim", featuredDeal: false } });
    }
    const blocks: ContentBlock[] = [
      { type: "p", text: `Stay connected in ${d.name} with an eSIM. Avoid roaming charges and keep your usual number while exploring the city.` },
      { type: "h2", text: `Why use an eSIM in ${d.name}` },
      { type: "ul", items: ["No physical SIM card needed — activate before you arrive", "Keep your home number while using local data", "Instant activation with QR code", "Usually cheaper than roaming plans"] },
      { type: "cta", label: `Get an eSIM for ${d.name}`, category: Cat.ESIM, destinationSlug: d.slug, placement: "seed-article" },
      { type: "faq", items: [{ question: `Does my phone support eSIM in ${d.name}?`, answer: "Most modern smartphones support eSIM. Check your device settings for 'Add cellular plan' or 'eSIM'." }, { question: `How to activate an eSIM in ${d.name}?`, answer: "Purchase before your trip, download the profile, and follow the activation instructions. The eSIM activates upon arrival." }] },
    ];
    await upsertArticle({ title: `eSIM in ${d.name}: Stay Connected Without Roaming`, slug: `${d.slug}-esim`, excerpt: `How to use an eSIM in ${d.name}: buy, activate, and stay connected without roaming charges.`, type: "DESTINATION_GUIDE", destinationId: dest.id, focusKeyword: `eSIM ${d.name}`, categorySlugs: ["destination-guides", "travel-tips"], blocks }, categoryIds);
    esimCount++;
  }
  console.log(`eSIM articles: ${esimCount}`);

  // ---------- Evergreen eSIM guides ----------
  const esimEvergreen: {
    title: string;
    slug: string;
    excerpt: string;
    focusKeyword: string;
    blocks: ContentBlock[];
  }[] = [
    {
      title: "How to Activate a Travel eSIM: Step-by-Step",
      slug: "how-to-activate-travel-esim",
      excerpt: "The exact steps to install and activate a travel eSIM, and what to do if it does not connect on arrival.",
      focusKeyword: "how to activate travel esim",
      blocks: [
        { type: "p", text: "Activation is the step most travellers overthink. In practice it is: check compatibility, buy a plan, install it, then tell your phone to use it for data. Here is the precise sequence." },
        { type: "h2", text: "Before you fly" },
        { type: "ol", items: [
          "Check your phone is unlocked and eSIM-capable (Settings > Cellular > Add eSIM on iPhone; Settings > Connections > SIM manager on Android)",
          "Buy a plan from your provider and receive the QR code or app profile",
          "Install the eSIM profile — you do not need to activate it yet",
        ] },
        { type: "h2", text: "Activating on arrival" },
        { type: "ol", items: [
          "Turn on the travel eSIM line (Settings > Cellular, choose the travel line)",
          "Set the travel line as the data source",
          "If calls still need your home number, keep the home eSIM as primary for voice",
          "Toggle airplane mode off/on once so the phone re-registers on the local network",
        ] },
        { type: "h2", text: "If it does not connect" },
        { type: "ul", items: [
          "Confirm your device is unlocked at the network level, not just carrier-settings unlocked",
          "Check the plan actually covers the country you are in",
          "Restart and re-select the travel line as the active data line",
          "Contact your provider — most plans activate within minutes once data is visible",
        ] },
        { type: "cta", label: "Compare travel eSIM plans", category: Cat.ESIM, placement: "esim-activate" },
        { type: "faq", items: [
          { question: "Can I install an eSIM before I travel?", answer: "Yes — install the profile (the QR scan) before you fly. Activation happens when the eSIM first finds its home network on arrival." },
          { question: "Do I need to remove my home SIM?", answer: "No. Most travellers keep both, setting the travel eSIM for data and the home line for calls." },
        ] },
      ],
    },
    {
      title: "eSIM vs Regular SIM Card for Travel",
      slug: "esim-vs-regular-sim-travel",
      excerpt: "eSIM or a local physical SIM? We compare activation speed, cost, coverage and the one case where a physical SIM still wins.",
      focusKeyword: "esim vs regular sim card",
      blocks: [
        { type: "p", text: "Both an eSIM and a local physical SIM get you cheap local data. The real differences are timing, convenience and how many countries you can cover in a single plan." },
        { type: "h2", text: "Comparison" },
        { type: "table", headers: ["Factor", "Local physical SIM", "Travel eSIM"], rows: [
          ["Setup time", "Queue at the airport counter", "Scan before you fly"],
          ["Keeps your home number", "Usually not", "Yes — run both lines"],
          ["Multiple countries", "One SIM per country", "One plan, many countries"],
          ["Requires", "A SIM tray and a passport copy", "An eSIM-capable phone"],
        ] },
        { type: "h2", text: "When a physical SIM still wins" },
        { type: "ul", items: [
          "Your phone is not eSIM-capable or is carrier-locked",
          "You are staying in one country for weeks and want the cheapest possible data",
          "You prefer paying cash at a local shop over online checkout",
        ] },
        { type: "h2", text: "Verdict" },
        { type: "p", text: "For most trips now, an eSIM is the simpler choice: no queues, no passport copies, and you keep your number. Pick a physical SIM mainly if your phone simply will not take an eSIM or you need long, single-country data at the very lowest price." },
        { type: "cta", label: "Compare eSIM plans", category: Cat.ESIM, placement: "esim-vs-sim" },
        { type: "faq", items: [
          { question: "Which is cheaper, eSIM or local SIM?", answer: "For a multi-country trip an eSIM is often cheaper because one plan covers everything. For a long single-country stay, a local physical SIM can edge it on price." },
        ] },
      ],
    },
    {
      title: "Travel eSIM Data Calculator: How Much Mobile Data You Need",
      slug: "travel-esim-data-calculator",
      excerpt: "Estimate your daily mobile usage and choose the right eSIM data allowance for maps, messaging, social and streaming.",
      focusKeyword: "travel esim data calculator",
      blocks: [
        { type: "p", text: "The biggest eSIM mistake is buying far too little data — or paying for far too much. This guide gives realistic daily ranges so you can pick the right allowance." },
        { type: "h2", text: "Rough daily usage" },
        { type: "table", headers: ["Usage", "Per day", "Notes"], rows: [
          ["Light (maps + messaging)", "~200-300 MB", "Offline maps help a lot"],
          ["Typical (maps, social, bites of video)", "~500 MB - 1 GB", "Most travellers land here"],
          ["Heavy (streaming, uploads)", "~2 GB+", "Streaming is the data killer"],
        ] },
        { type: "h2", text: "Your quick estimate" },
        { type: "ul", items: [
          "Estimate your daily usage from the table above",
          "Multiply by the number of days you need data",
          "Add 20-30% buffer for airport uploads, cab apps and emergencies",
          "Round up to the nearest plan size your provider offers",
        ] },
        { type: "h2", text: "Cutting your usage" },
        { type: "ul", items: [
          "Download offline maps (Google Maps / Google Translate) before you leave",
          "Set social apps to 'download only on Wi-Fi'",
          "Pre-download podcasts and playlists instead of streaming",
        ] },
        { type: "cta", label: "Find the right eSIM data plan", category: Cat.ESIM, placement: "esim-data-calculator" },
        { type: "faq", items: [
          { question: "Is 1 GB a day enough for a week?", answer: "For a typical traveller, yes — roughly 7 GB covers a week of maps, messaging and social. Streamers will want more." },
        ] },
      ],
    },
  ];
  for (const g of esimEvergreen) {
    await upsertArticle({
      title: g.title,
      slug: g.slug,
      excerpt: g.excerpt,
      type: "TRAVEL_TIPS",
      destinationId: null,
      focusKeyword: g.focusKeyword,
      categorySlugs: ["travel-tips"],
      blocks: g.blocks,
    }, categoryIds);
  }
  console.log(`Evergreen eSIM guides: ${esimEvergreen.length}`);

  console.log("Seed complete.");
}

async function upsertArticle(
  input: {
    title: string;
    slug: string;
    excerpt: string;
    type: string;
    destinationId: string | null;
    focusKeyword: string;
    categorySlugs: string[];
    blocks: ContentBlock[];
  },
  categoryIds: Record<string, string>,
) {
  const text = blocksToText(input.blocks);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const existing = await prisma.article.findUnique({ where: { slug: input.slug } });
  const data = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    content: JSON.stringify(input.blocks),
    type: input.type as "DESTINATION_GUIDE" | "TRAVEL_TIPS",
    status: "PUBLISHED" as const,
    publishedAt: new Date(),
    focusKeyword: input.focusKeyword,
    metaTitle: input.title,
    metaDescription: input.excerpt,
    allowIndexing: true,
    wordCount,
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 200)),
    destinationId: input.destinationId,
    authorId: existing?.authorId ?? undefined,
    authorName: existing?.authorName ?? "Maya Chen",
  };
  const article = await prisma.article.upsert({
    where: { slug: input.slug },
    update: { ...data, relatedArticlesA: undefined, relatedArticlesB: undefined },
    create: { ...data, authorName: "Maya Chen" },
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });