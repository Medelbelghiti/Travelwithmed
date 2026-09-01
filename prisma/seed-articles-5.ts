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
  console.log("Seeding Kansai cluster...");

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

  // ---------- Best things to do in Kyoto ----------
  const kyotoThingsBlocks: ContentBlock[] = [
    { type: "p", text: "Kyoto's list is deep, but its best experiences share one skill: timing. Every headline site on this list rewards the earliest hour of the day, and the ones you skip at 10am would be marvellous at 7am." },
    { type: "h2", text: "The sunrise headline acts" },
    { type: "ul", items: [
      "Fushimi Inari Taisha: open around the clock - the torii tunnel is empty and spiritual at dawn",
      "Kiyomizu-dera: the cliffside stage with the city view, best in the first open hour",
      "Arashiyama bamboo grove: walk the path before 8am and you have it to yourself",
      "Kinkaku-ji (the Golden Pavilion): tiny site, enormous crowds - be the second group in",
    ] },
    { type: "h2", text: "Gardens and stillness" },
    { type: "ul", items: [
      "Ryoan-ji rock garden: fifteen stones and almost no words needed",
      "Ginkaku-ji gardens: the silver pavilion's moss and swept sand are the quiet climax",
      "A morning in the Philosopher's Path with cherry blossom (late March-April)",
      "Nijo-jo: the nightingale floors and audience halls - history with a sound check",
    ] },
    { type: "h2", text: "Culture with your hands" },
    { type: "ul", items: [
      "A booked tea ceremony - the matcha ritual is short, formal and memorable",
      "Kimono rental for the morning: tourists everywhere, but the photos justify it",
      "Pottery or calligraphy classes hand you a souvenir that fits in a bag",
    ] },
    { type: "h2", text: "Food worth planning" },
    { type: "ul", items: [
      "Kaiseki lunch near Gion - Kyoto's tasting-grid cuisine, booked ahead",
      "Nishiki Market in the morning for small plates and sweets",
      "Matcha everything in the Uji day-trip case; tea is the local industry",
      "Izakaya dinner in Pontocho alley after dusk",
    ] },
    { type: "h2", text: "The practical rule" },
    { type: "p", text: "One big site before 9am, one neighbourhood after. Kyoto beats you with volume, not distance - pace the day and you will see more than the marathon crowd." },
    { type: "activities", title: "Experiences we feature in Kyoto", destinationId: cityIds.kyoto },
    { type: "cta", label: "Browse Kyoto tours and tea ceremonies", category: "ACTIVITIES", destinationSlug: "kyoto", placement: "kyoto-things" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "See Kyoto experiences" },
    { type: "cta", label: "Find a hotel near your route", category: "HOTELS", destinationSlug: "kyoto", placement: "kyoto-things" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Kyoto" },
    { type: "faq", items: [
      { question: "What is the best time to visit Kyoto's temples?", answer: "First opening hour. Fushimi Inari works any time, but Kiyomizu and the bamboo grove are transformed before the tour groups arrive." },
      { question: "Do I need to book Kyoto attractions ahead?", answer: "For the attractions themselves, rarely. For tea ceremonies, kaiseki restaurants and kimono rental - yes, especially in peak seasons." },
      { question: "Is one day enough for Kyoto?", answer: "One day covers a morning temple and an afternoon area with realism. Two to three days is the comfortable minimum for the highlights." },
    ] },
  ];
  await upsertArticle({
    title: "Best Things to Do in Kyoto: A Time-Proofed Shortlist",
    slug: "best-things-to-do-in-kyoto",
    excerpt: "Sunrise torii gates, empty gardens and matcha rituals - the Kyoto experiences worth your days, timed to actually enjoy them.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.kyoto,
    focusKeyword: "best things to do in kyoto",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1493976040374-85c8e12f0c0e"),
    blocks: kyotoThingsBlocks,
    publishedAt: at(80),
  }, categoryIds, authorId);

  // ---------- Best things to do in Osaka ----------
  const osakaThingsBlocks: ContentBlock[] = [
    { type: "p", text: "Osaka is Japan with the volume up and the calendar cleared. The city's experiences are food, light, shopping and day trips - and the best of them happen after dinner, which is exactly the point." },
    { type: "h2", text: "The food experiences" },
    { type: "ul", items: [
      "Dotonbori street food at night: takoyaki, kushikatsu and sweet-smelling grills",
      "Kuromon Ichiba Market before noon, before the deep-fried queues",
      "Okonomiyaki cooked at your table - the Osaka signature you build yourself",
      "A standing bar in Shinsekai for the city's most honest prices",
    ] },
    { type: "h2", text: "Views and light" },
    { type: "ul", items: [
      "The Umeda Sky Building's floating garden observatory at dusk",
      "Dotonbori's neon canyon after 8pm - the canal reflection is the photo",
      "TeamLab Botanical Garden: the light-art garden north of the city",
    ] },
    { type: "h2", text: "City soft spots" },
    { type: "ul", items: [
      "Osaka Castle park in the morning, with the kaida maze on the ground floor",
      "Shinsaibashi shopping arcade for Japan's widest covered shopping",
      "Shinsekai's retro streets and the Tsutenkaku tower for a preserved 1950s district",
    ] },
    { type: "h2", text: "Day trips that count" },
    { type: "table", headers: ["Destination", "From Osaka", "Highlights"], rows: [
      ["Kyoto", "About 30 min", "Temples, gardens, Gion"],
      ["Nara", "About 45 min", "Great Buddha, deer park"],
      ["Kobe", "About 25 min", "Waterfront, beef, mountain views"],
      ["Himeji", "60-90 min", "Japan's finest samurai castle"],
    ] },
    { type: "h2", text: "The Osaka rule" },
    { type: "p", text: "Go slow in the heat of noon and fast in the cool of the evening. Osaka's daylight attractions are pleasant, but its night is the destination." },
    { type: "activities", title: "Experiences we feature in Osaka", destinationId: cityIds.osaka },
    { type: "cta", label: "Browse Osaka food walks and tours", category: "ACTIVITIES", destinationSlug: "osaka", placement: "osaka-things" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "See Osaka experiences" },
    { type: "cta", label: "Base yourself well", category: "HOTELS", destinationSlug: "osaka", placement: "osaka-things" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Osaka" },
    { type: "faq", items: [
      { question: "What is Osaka famous for?", answer: "Street food, neon, comedy and Japan's most relaxed big-city energy. Dotonbori at night is the single postcard of the city." },
      { question: "How many days should I spend in Osaka?", answer: "Two days covers the food, lights and a day trip. Three if you add Himeji or Kobe with a relaxed pace." },
      { question: "Is Osaka better at night?", answer: "Yes - and that is a feature. Save the evening for Dotonbori and Shinsekai and keep daylight for markets and day trips." },
    ] },
  ];
  await upsertArticle({
    title: "Best Things to Do in Osaka: Food, Lights & Day Trips",
    slug: "best-things-to-do-in-osaka",
    excerpt: "Dotonbori after dark, Kuromon before noon and the day trips that make Osaka the Kansai hub.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.osaka,
    focusKeyword: "best things to do in osaka",
    categorySlugs: ["things-to-do"],
    coverImage: u("photo-1553413077-190dd305871c"),
    blocks: osakaThingsBlocks,
    publishedAt: at(74),
  }, categoryIds, authorId);

  // ---------- Where to stay in Kyoto ----------
  const kyotoHotelsBlocks: ContentBlock[] = [
    { type: "p", text: "Kyoto's geography decides your hotel. The city's sights fan out from the centre, so the golden rule is simple: stay within the city core near a main station or bus line, or pay the price in daily bus transfers." },
    { type: "h2", text: "The three real bases" },
    { type: "ul", items: [
      "Kyoto Station: the transport hub - trains, buses and the bullet trains south",
      "The city core (Gion/Higashiyama): atmosphere, temples and old streets at your doorstep",
      "Karasuma/Kawaramachi: shopping, eating and nightlife with fast buses everywhere",
    ] },
    { type: "table", headers: ["Base", "Best for", "Watch out for"], rows: [
      ["Kyoto Station", "Early trains, first-timers", "Nelder, less atmosphere"],
      ["Gion / Higashiyama", "Atmosphere, photos", "Higher prices"],
      ["Kawaramachi", "Food and shopping", "Front-route noise"],
    ] },
    { type: "h2", text: "The ryokan question" },
    { type: "p", text: "One ryokan night is Kyoto's signature memory: futons, yukata, a shared bath and kaiseki dinner served in your room. Book the handful of central ryokan months ahead, and know the etiquette - shoes off, baths before dinner - is simpler than the fear." },
    { type: "h2", text: "How to book smart" },
    { type: "ul", items: [
      "Book 3-4 months ahead for sakura and autumn - Kyoto simply fills",
      "Cross-reference the same ryokan across two sites; the printed price varies",
      "Choose the refundable rate if your itinerary might flex",
      "Small family-run machiya stays can beat the hotel chains on both price and charm",
    ] },
    { type: "hotels", title: "Stays we feature in Kyoto", destinationId: cityIds.kyoto },
    { type: "cta", label: "Search Kyoto for your dates", category: "HOTELS", destinationSlug: "kyoto", placement: "kyoto-stay" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Kyoto" },
    { type: "cta", label: "Compare flights to Kyoto", category: "FLIGHTS", destinationSlug: "kyoto", placement: "kyoto-stay" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Kyoto" },
    { type: "faq", items: [
      { question: "What is the best area to stay in Kyoto?", answer: "Near a major station or bus line inside the core - Kyoto Station for convenience, Gion for atmosphere, Kawaramachi for food. All three beat a remote ryokan for logistics." },
      { question: "Is a ryokan worth it in Kyoto?", answer: "One night is worth the premium for the experience. It is Japan's most memorable stay, and central ryokan are the rare kind that justify booking ahead." },
      { question: "Should I stay in Osaka or Kyoto?", answer: "If temples dominate your plan, stay in Kyoto. If you want cheaper rooms and better night-food, base in Osaka and day-trip - the cities are 30 minutes apart." },
    ] },
  ];
  await upsertArticle({
    title: "Where to Stay in Kyoto: Best Areas & Hotels",
    slug: "where-to-stay-in-kyoto",
    excerpt: "Kyoto Station, Gion or Kawaramachi - which base suits your trip, plus the ryokan night worth booking early.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.kyoto,
    focusKeyword: "where to stay in kyoto",
    categorySlugs: ["hotels"],
    coverImage: u("photo-1545569341-9eb8b30979d9"),
    blocks: kyotoHotelsBlocks,
    publishedAt: at(68),
  }, categoryIds, authorId);

  // ---------- Osaka with kids ----------
  const osakaKidsBlocks: ContentBlock[] = [
    { type: "p", text: "Osaka is quietly Japan's best family stop. It has the region's biggest theme park, a friendly food culture kids actually eat (breaded, fried, portable), and day trips that tire children out in the best way." },
    { type: "h2", text: "The headline: Universal Studios Japan" },
    { type: "p", text: "Universal Studios Japan in Osaka is the family anchor of Kansai. Timing drives everything: buy dated tickets online, add Express Passes for the marquee rides, and enter at gate opening. Target weekday dates and avoid Japanese school-holiday windows." },
    { type: "ul", items: [
      "Book dated tickets ahead - gate prices jump and daily slots cap",
      "Express Pass beats queue nerves on Super Nintendo World and Harry Potter",
      "Comfortable shoes beat strollers on several queues; lockers exist at big rides",
      "Midweek, term-time visits drop wait times dramatically",
    ] },
    { type: "h2", text: "Kid-proof Osaka beyond the park" },
    { type: "ul", items: [
      "Osaka Aquarium Kaiyukan: the whale shark tank is a guaranteed 90-minute win",
      "Osaka Castle park for running around - the museum inside is short enough",
      "Dotonbori street food as a walking dinner: kids pick takoyaki and move on",
      "Kids Plaza Osaka: an indoor museum built for ages 3-12 with a water floor",
    ] },
    { type: "h2", text: "Day trips that level the energy" },
    { type: "ul", items: [
      "Nara Park: deer, giant Buddha and acres to run - the classic family afternoon",
      "Kyoto Arashiyama: the bamboo path is stroller-friendly and short",
      "Kobe: the harbour, the moving walkway under the Akashi bridge",
      "Himeji: the castle exterior for the photo, ice cream for the motivation",
    ] },
    { type: "h2", text: "Family logistics" },
    { type: "ul", items: [
      "Stay near Namba or Umeda so the evening eats and trains never feel far",
      "ICOCA cards for every rider speed everyone through the gates",
      "Convenience stores save every trip: milk, snacks, wet wipes",
      "Recharge mid-afternoon - Japanese families do too",
    ] },
    { type: "activities", title: "Family experiences in Osaka", destinationId: cityIds.osaka },
    { type: "cta", label: "Book Universal Studios and family tours", category: "ACTIVITIES", destinationSlug: "osaka", placement: "osaka-kids" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "See Osaka family experiences" },
    { type: "cta", label: "Find family-friendly Osaka stays", category: "HOTELS", destinationSlug: "osaka", placement: "osaka-kids" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Osaka" },
    { type: "faq", items: [
      { question: "Is Osaka good for kids?", answer: "One of Japan's best - Universal Studios, an acclaimed aquarium, kid-scale museums and day trips built for running off energy." },
      { question: "How many days for Osaka with kids?", answer: "Three to four: one theme-park day, one city-plus-aquarium day, and one day trip to Nara or Kyoto." },
      { question: "Do kids need their own rail card in Japan?", answer: "Kids 6-11 ride at half fare with their own ICOCA ticket. Under 6 travel free on most rail when seated on laps." },
    ] },
  ];
  await upsertArticle({
    title: "Osaka with Kids: The Family Playbook",
    slug: "osaka-with-kids",
    excerpt: "Universal Studios timing, the aquarium, Nara day trips and the family logistics that keep Osaka calm and fun.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.osaka,
    focusKeyword: "osaka with kids",
    categorySlugs: ["family-travel"],
    coverImage: u("photo-1516541196182-6bdb0516ed27"),
    blocks: osakaKidsBlocks,
    publishedAt: at(62),
  }, categoryIds, authorId);

  // ---------- Kyoto to Nara day trip ----------
  const naraBlocks: ContentBlock[] = [
    { type: "p", text: "Nara is the greatest half-day in Kansai and an easy train ride from either Kyoto or Osaka. The deer park, the Great Buddha Hall and Nara's backstreets combine into a single relaxed afternoon that rewards a clear plan." },
    { type: "h2", text: "The one-two-three of Nara" },
    { type: "ol", items: [
      "JR Nara station to the park and the Great Buddha at Todai-ji: the building ranks with any in Japan",
      "Kasuga Taisha and the lantern path: quieter, atmospheric, a real second act",
      "The old town lanes around the station for tea, souvenirs and a feed",
    ] },
    { type: "h2", text: "Getting there from Kyoto" },
    { type: "p", text: "The JR Nara Line from Kyoto runs to JR Nara in about 45 minutes; from Osaka, the Yamatoji Line takes similar time. Both are covered by an ICOCA and by most rail passes worth buying." },
    { type: "h2", text: "The deer etiquette" },
    { type: "ul", items: [
      "Buy or skip the deer crackers - either choice is fine",
      "The deer bow politely, then insist: keep crackers in your bag once done",
      "Don't feed them anything but the crackers; don't chase for the perfect photo",
      "Small deer can be bolshy - keep an eye on anything held low",
    ] },
    { type: "h2", text: "Pacing the day" },
    { type: "ul", items: [
      "Leave Kyoto by 9am for a crowd-free Todai-ji and a relaxed afternoon",
      "Lunch in Nara before the afternoon heat: the old-town okonomiyaki and tea houses are short walks",
      "A second temple (Horyu-ji, a little further) only if the first visit feels thin",
      "The 4pm deer park light is the photo hour - linger if you are not on a train",
    ] },
    { type: "cta", label: "Find Nara tours and guides", category: "ACTIVITIES", destinationSlug: "kyoto", placement: "nara-daytrip" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse Nara day-trip options" },
    { type: "cta", label: "Sort your Kyoto base first", category: "HOTELS", destinationSlug: "kyoto", placement: "nara-daytrip" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Kyoto" },
    { type: "faq", items: [
      { question: "How do I get from Kyoto to Nara?", answer: "The JR Nara Line from Kyoto Station reaches JR Nara in about 45 minutes, covered by ICOCA and most rail passes." },
      { question: "Is Nara a half or full day?", answer: "Half a day covers the deer park, the Great Buddha and the old town comfortably. Pair it with an Osaka or Kyoto morning for a full day out." },
      { question: "Can I visit the deer park for free?", answer: "The park is free; Todai-ji's Great Buddha Hall has a modest admission. Children tend to spend the whole time on the deer alone." },
    ] },
  ];
  await upsertArticle({
    title: "Kyoto to Nara: The Perfect Day Trip Guide",
    slug: "kyoto-to-nara-day-trip",
    excerpt: "Todai-ji's Great Buddha, the lantern path and deer-park etiquette - how to spend the best half-day in Kansai.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.kyoto,
    focusKeyword: "kyoto to nara day trip",
    categorySlugs: ["destination-guides"],
    coverImage: u("photo-1528360983277-13d401cdc186"),
    blocks: naraBlocks,
    publishedAt: at(56),
  }, categoryIds, authorId);

  // ---------- Kyoto to Tokyo Shinkansen ----------
  const shinkansenBlocks: ContentBlock[] = [
    { type: "p", text: "The Tokyo-Kyoto shinkansen leg is the strategic decision of many Japan trips. At about two hours and 15 minutes between the two cities, it is fast, reliable and - with the right booking move - reasonably priced." },
    { type: "h2", text: "The ticket options" },
    { type: "table", headers: ["Option", "Cost guide", "Best for"], rows: [
      ["Reserved seat, Hikari/Kodama", "Around 135-140 USD", "The default"],
      ["Nozomi (fastest, non-Pass)", "Slightly more", "Peak convenience"],
      ["JR Pass", "150-250+ USD", "Big multi-city loops"],
      ["Green car", "About +110 USD", "Wider seats, softer ride"],
    ] },
    { type: "h2", text: "Reserved or non-reserved?" },
    { type: "p", text: "Reserved seats cost little more and remove the standing gamble on popular departures - weekends and sakura the non-reserved cars fill fast. Reserve ahead for the morning peak and long weekends." },
    { type: "h2", text: "Which train to pick" },
    { type: "ul", items: [
      "Nozomi: fastest (about 2h15m Tokyo-Kyoto, and 2h25m Tokyo-Osaka), not covered by the standard JR Pass",
      "Hikari: barely slower and Pass-friendly, perfect for travellers planning three-plus long legs",
      "Kodama: stops at everything - only choose it with a patient heart and deep discounts in mind",
    ] },
    { type: "h2", text: "The Pass maths" },
    { type: "ul", items: [
      "A 7-day pass pays off if you add an Osaka/Kyoto loop plus one long extra leg",
      "Against a single one-way trip, buy the point-to-point ticket instead",
      "Both Cheap: check the exchange-rate comparison the week you book",
    ] },
    { type: "h2", text: "Practical notes" },
    { type: "ul", items: [
      "Ride on the right side for Mt Fuji views on the Tokyo-Kyoto run - the H-side seats",
      "Eki-Bento: the station boxed lunches are the accepted travelling dinner",
      "Bags have a modest size rule on reserved seats; oversize goes in the luggage space",
      "Book seats online, print or scan at the machine, and arrive 20 minutes early",
    ] },
    { type: "cta", label: "Compare flights Tokyo-Kyoto", category: "FLIGHTS", destinationSlug: "tokyo", placement: "shinkansen" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Check flight alternatives" },
    { type: "cta", label: "Book your Kyoto stay", category: "HOTELS", destinationSlug: "kyoto", placement: "shinkansen" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Kyoto" },
    { type: "faq", items: [
      { question: "How long is the shinkansen from Tokyo to Kyoto?", answer: "The Nozomi makes it in about 2 hours 15 minutes; the Hikari roughly 2 hours 35. It is the fastest and easiest way between the cities." },
      { question: "Is the JR Pass worth it for Tokyo-Kyoto?", answer: "Not for the single leg alone - book a point-to-point reserved ticket. The Pass only wins with three-plus long legs and a return loop." },
      { question: "Which side of the shinkansen shows Mt Fuji?", answer: "Between Tokyo and Kyoto, pick the right-hand (H-side) seats facing forward for the best Mt Fuji views on clear days." },
    ] },
  ];
  await upsertArticle({
    title: "Kyoto to Tokyo Shinkansen: Tickets, Timings & Tips",
    slug: "kyoto-tokyo-shinkansen-guide",
    excerpt: "Nozomi vs Hikari, reserved vs non-reserved, the JR Pass maths and the Mt Fuji seat - the bullet-train leg done right.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.kyoto,
    focusKeyword: "kyoto to tokyo shinkansen",
    categorySlugs: ["flights", "budget-travel"],
    coverImage: u("photo-1565967511849-76a60a516170"),
    blocks: shinkansenBlocks,
    publishedAt: at(50),
  }, categoryIds, authorId);

  // ---------- Osaka KIX airport transfer ----------
  const kixBlocks: ContentBlock[] = [
    { type: "p", text: "Kansai International Airport (KIX) sits on an island, and the honest answer is that every transfer route works - the question is which one matches your baggage count and hotel address." },
    { type: "table", headers: ["Option", "Cost", "Time to Namba/Osaka", "Best for"], rows: [
      ["Nankai Rapi:t", "About 1450 yen", "35-45 min Namba", "The Namba default"],
      ["JR Haruka", "About 1800-yen range", "45-50 min", "Kyoto-bound, Pass users"],
      ["Airport bus", "About 1600 yen", "50-70 min", "Door-to-door hotels, bags"],
      ["Taxi", "From about 16-20k yen", "50-70 min", "Groups, heavy luggage"],
    ] },
    { type: "h2", text: "The Namba plan (Rapi:t)" },
    { type: "p", text: "The Nankai Rapi:t express lands you at Namba, the heart of Osaka, in about 40 minutes. It is the default for anyone staying in Minami, and online deals beat the machine price by a useful margin." },
    { type: "h2", text: "The Kyoto plan (Haruka)" },
    { type: "p", text: "The JR Haruka runs directly from KIX to Kyoto Station in about 75-80 minutes, saving you the Osaka transfer if Kyoto is your first base. Train tickets bundle with the JR Pass for most holders." },
    { type: "h2", text: "Bus and door-to-door comfort" },
    { type: "p", text: "Airport limousine buses stop at a spread of Osaka hotels and end at points like Namba and the station areas - best when the hotel door is the real destination. Book seat reservations ahead for peak arrivals." },
    { type: "h2", text: "Taxis and late flights" },
    { type: "ul", items: [
      "After the last trains (roughly midnight), taxis and fixed-price airport cars take over",
      "For three-plus passengers with bags, the car beats the train on time and money",
      "Pre-book the fixed-price option; meter taxis from the taxi rank are official but pricier",
      "The SkyGate and 9-hour areas near the airport exist for genuinely ungodly arrivals",
    ] },
    { type: "cta", label: "Compare flights to Osaka", category: "FLIGHTS", destinationSlug: "osaka", placement: "kix" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights to Osaka" },
    { type: "cta", label: "Find a hotel near your line", category: "HOTELS", destinationSlug: "osaka", placement: "kix" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Compare hotels in Osaka" },
    { type: "faq", items: [
      { question: "Which train is best from KIX to central Osaka?", answer: "The Nankai Rapi:t for Namba (about 40 minutes) is the default; the JR Haruka takes you to Kyoto directly. Choose by your first hotel." },
      { question: "How much is a taxi from Kansai airport?", answer: "Metered taxis into central Osaka start around 16-20k yen. For small groups, a pre-booked airport car is often the smarter fixed price." },
      { question: "Do I need a rail card to use KIX trains?", answer: "No - you can buy single tickets or IC pass cards at the airport after landing, or use your online rail pass where relevant." },
    ] },
  ];
  await upsertArticle({
    title: "Osaka KIX Airport Transfer Guide: Every Route Compared",
    slug: "osaka-kix-airport-transfer",
    excerpt: "Nankai Rapi:t, JR Haruka, the airport bus and fixed-price cars - the fastest, cheapest and easiest ways from Kansai airport.",
    type: "DESTINATION_GUIDE",
    destinationId: cityIds.osaka,
    focusKeyword: "kansai international airport transfer",
    categorySlugs: ["flights"],
    coverImage: u("photo-1490806843957-31f4c9a91c65"),
    blocks: kixBlocks,
    publishedAt: at(44),
  }, categoryIds, authorId);

  // ---------- Internal linking ----------
  const pairs: [string, string, number][] = [
    ["kyoto-travel-guide", "best-things-to-do-in-kyoto", 55],
    ["kyoto-travel-guide", "where-to-stay-in-kyoto", 55],
    ["kyoto-travel-guide", "kyoto-to-nara-day-trip", 45],
    ["kyoto-travel-guide", "kyoto-tokyo-shinkansen-guide", 35],
    ["osaka-travel-guide", "best-things-to-do-in-osaka", 55],
    ["osaka-travel-guide", "osaka-with-kids", 50],
    ["osaka-travel-guide", "osaka-kix-airport-transfer", 45],
    ["kyoto-osaka-5-day-itinerary", "best-things-to-do-in-kyoto", 45],
    ["kyoto-osaka-5-day-itinerary", "best-things-to-do-in-osaka", 45],
    ["kyoto-osaka-5-day-itinerary", "where-to-stay-in-kyoto", 35],
    ["kyoto-osaka-5-day-itinerary", "osaka-kix-airport-transfer", 35],
    ["best-things-to-do-in-kyoto", "where-to-stay-in-kyoto", 40],
    ["best-things-to-do-in-kyoto", "kyoto-to-nara-day-trip", 40],
    ["best-things-to-do-in-osaka", "osaka-with-kids", 40],
  ];
  for (const [a, b] of pairs) await ensureRelated(a, b);

  console.log("Kansai cluster seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});