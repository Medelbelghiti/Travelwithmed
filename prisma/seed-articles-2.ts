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
      type: input.type as "TRAVEL_TIPS",
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
      type: input.type as "TRAVEL_TIPS",
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
  console.log("Seeding tips articles…");

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
  const linkId = (partner: string, category: string) => links[`${partner}|${category}`] ?? undefined;

  const now = Date.now();
  const at = (hoursAgo: number) => new Date(now - hoursAgo * 3600 * 1000);

  // ---------- Cheap flights ----------
  const flightsBlocks: ContentBlock[] = [
    { type: "p", text: "Finding cheap flights has less to do with magic dates and more with a repeatable process. This guide walks through the tactics that actually move prices: when to book, how to search, which airports to include and why the 'Tuesday trick' is mostly a myth." },
    { type: "h2", text: "Start with a realistic budget" },
    { type: "p", text: "Decide the most you'll pay for the round trip before you open a single search tab. When a fare dips under that number, you book it — indecision costs more money than any timing trick saves." },
    { type: "h2", text: "Use flexible search across dates and airports" },
    { type: "ul", items: ["Search whole months, not fixed dates — the fare calendar shows cheap days at a glance", "Include nearby airports; an extra hour of train ride often halves the fare", "Compare one-way and round-trip prices separately, then combine the cheaper pair", "Use the 'explore everywhere' map when the destination itself is flexible"] },
    { type: "cta", label: "Start a flexible flight search", category: "FLIGHTS", destinationSlug: undefined, placement: "cheap-flights" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search all airlines in one place" },
    { type: "h2", text: "When to book" },
    { type: "p", text: "The old rule-of-thumb holds up broadly: book international trips two to six months out, shorter-haul flights one to three months out, and avoid the 14-day window where prices climb. Booking earlier than six months rarely helps — airlines price high at launch." },
    { type: "ul", items: ["International: book 2-6 months ahead for the sweet spot", "Short-haul: 1-3 months ahead", "Peak travel windows (summer, Christmas): shave time against the calendar and book earliest", "Flexible-dates alerts will out-perform constant checking"] },
    { type: "h2", text: "Set alerts instead of checking sites" },
    { type: "p", text: "Price tracking alerts do the surveillance work you'd otherwise do manually. Enter a route, set a target price, and you'll get notified when a fare dips — this is how routine savings of 10-30% happen, because most cheap windows last only hours." },
    { type: "h2", text: "What works and what doesn't" },
    { type: "table", headers: ["Tactic", "Verdict"], rows: [
      ["Booking on 'the cheapest day of the week'", "Myth — day-of-week savings are tiny and inconsistent"],
      ["Clearing your browser cookies", "Myth — prices have never been tied to cookies"],
      ["Flexible date searches", "Wins — weekdays and shoulder dates regularly cost less"],
      ["Nearby airports", "Wins — secondary airports often cut fares dramatically"],
      ["Setting price alerts", "Wins — automation beats manual checking"],
      ["Travel in shoulder season", "Wins — the cheapest month is usually the off-peak one"],
    ] },
    { type: "faq", items: [
      { question: "How far in advance should I book international flights?", answer: "Two to six months is the practical window for most routes. Within two weeks, prices climb sharply." },
      { question: "Is booking on Tuesday actually cheaper?", answer: "No — that's a persistent myth. Date-of-week effects are small; flexible dates within a month matter far more than the day you shop." },
      { question: "Should I use points or cash?", answer: "If a fare is under about $350 round trip, cash usually wins. Points shine for last-minute premium cabins where cash prices are punishing." },
    ] },
  ];
  await upsertArticle({
    title: "How to Find Cheap Flights in 2026",
    slug: "how-to-find-cheap-flights",
    excerpt: "The process that actually lowers airfares: flexible searches, timing windows, price alerts and the myths to stop believing.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "how to find cheap flights",
    categorySlugs: ["flights", "budget-travel"],
    coverImage: u("photo-1473968512647-3e447244af8f"),
    blocks: flightsBlocks,
    publishedAt: at(70),
  }, categoryIds, authorId);

  // ---------- Packing guide ----------
  const packingBlocks: ContentBlock[] = [
    { type: "p", text: "Most travellers pack twice what they need and stress once for the privilege. This guide builds a carry-on-only system that works for a week or a year — the trick is choosing items that coordinate, compress and multi-task." },
    { type: "h2", text: "The carry-on-first mindset" },
    { type: "p", text: "A standard cabin bag (roughly 55x40x20cm, 7-10kg depending on airline) removes the bag-fee gamble, the lost-bag lottery and the porter money pit in one move. If it doesn't fit in the cabin bag, it doesn't travel." },
    { type: "h2", text: "The core wardrobe system" },
    { type: "ul", items: ["Four to five tops that mix with every bottom — solid colours, quick-dry fabric", "Two or three bottoms: one jean, one travel trouser, one shorts or skirt", "One mid-layer (packable down or fleece) and one packable rain shell", "Underwear and socks: one pair per day, in super-light travel merino", "Two pairs of shoes max: go-everywhere trainers plus one sandal or liner"] },
    { type: "h2", text: "The gear that earns its space" },
    { type: "ul", items: ["Packing cubes: roll clothes, cube them, and you'll double the usable volume", "Universal travel adapter: one outlet-friendly plug covering most countries", "A packable daypack for tours, markets and airport wandering", "Refillable water bottle with a filter for airports and tap-variable cities", "A small power bank — flights, maps and navigation outlast any phone battery"] },
    { type: "products", title: "Gear we feature", category: "Travel Gear" },
    { type: "affiliate_link", linkId: linkId("Amazon", "TRAVEL_GEAR") ?? "cmthy4ods001gdsvjyrtvbwfr", label: "Shop the packing essentials storefront" },
    { type: "h2", text: "Connectivity: leave the roaming stress at home" },
    { type: "p", text: "An eSIM (a digital SIM you install before departure) means instant, cheap data on landing — no hunting for a local SIM shop or wincing at roaming bills. Install it before you leave home while you still have Wi-Fi." },
    { type: "cta", label: "Compare global eSIM coverage", category: "ESIM", destinationSlug: undefined, placement: "packing" },
    { type: "affiliate_link", linkId: linkId("Airalo", "ESIM") ?? "cmthgttvg001ih8vjexw1w5z2", label: "Get an eSIM for 200+ countries" },
    { type: "h2", text: "The medicine and money layer" },
    { type: "ul", items: ["A compact first-aid mini kit: plasters, painkillers, stomach tablets, antiseptic wipes", "Prescriptions in original packaging, with a copy of the prescription", "Two payment cards kept in separate places, plus some local cash for markets", "Photocopies of passport, visa and insurance documents in cloud storage and a physical backup"] },
    { type: "faq", items: [
      { question: "How do I fit a week into a carry-on?", answer: "Plan to do one sink laundry on day 3 or 4 — with quick-dry fabrics a small bag covers a week comfortably. Most discrepancies between packed and needed items appear in the first 24 hours." },
      { question: "What should I never put in a checked bag?", answer: "Medication, travel documents, your only card, camera gear, chargers and anything you need within the first hours of arrival." },
      { question: "Is it worth buying packing cubes?", answer: "For most airline bag allowances, yes — they protect clothes from airport handling and compress bulk by 20-40%." },
    ] },
  ];
  await upsertArticle({
    title: "The Ultimate Carry-On Packing Guide",
    slug: "ultimate-carry-on-packing-guide",
    excerpt: "A reproducible carry-on-only system: a coordinating wardrobe, the gear that earns its space, eSIM connectivity and the money-and-meds layer.",
    type: "RESOURCE_GUIDE",
    destinationId: null,
    focusKeyword: "packing guide",
    categorySlugs: ["travel-gear", "travel-tips"],
    coverImage: u("photo-1553062407-98eeb64c6a62"),
    blocks: packingBlocks,
    publishedAt: at(58),
  }, categoryIds, authorId);

  // ---------- Travel insurance ----------
  const insuranceBlocks: ContentBlock[] = [
    { type: "p", text: "Travel insurance is the easiest money to resent and the easiest to be grateful for — until you need it. This guide covers what policies actually do, the coverage numbers that matter, and the exclusions that quietly invalidate claims." },
    { type: "h2", text: "The coverage that matters most" },
    { type: "ol", items: ["Emergency medical treatment abroad — the reason insurance exists; a hospital stay without it can cost five to six figures", "Emergency medical evacuation and repatriation — the single most expensive risk to insure", "Trip cancellation and interruption — covers prepaid flights, hotels and tours when plans break", "Lost, delayed or stolen baggage and personal belongings", "24/7 assistance line — the human contact you don't value until the crisis"] },
    { type: "h2", text: "Numbers to look for" },
    { type: "table", headers: ["Coverage", "What to expect"], rows: [
      ["Medical expenses", "Generally $100k-250k for non-US citizens; more if you are one"],
      ["Medical evacuation", "$500k is a common generous ceiling"],
      ["Trip cancellation", "100% of prepaid, non-refundable costs up to the limit"],
      ["Personal effects", "Limits per item — keep the big-tech receipts"],
    ] },
    { type: "h2", text: "The exclusions that catch people out" },
    { type: "ul", items: ["Pre-existing conditions: usually excluded unless you declare them at signup", "Adventure sports: skiing, scuba and hiking over altitude are often add-on riders", "'Reckless' behaviour as defined by the policy — read the small print on motorbikes", "Travel to high-risk regions earns exclusions or cancellation — check your destination", "Alcohol-and-injury claims get scrutinised; no policy covers bars' mishaps well"] },
    { type: "h2", text: "Buy before you leave" },
    { type: "p", text: "Insurers are refundable-cooling-off-friendly before departure, but once you've left your home country, almost nothing about the policy can be changed. Buy the policy the same day you book the flights — then an injury before the trip is covered by the cancellation part too." },
    { type: "cta", label: "Get flexible travel medical insurance", category: "INSURANCE", destinationSlug: undefined, placement: "insurance" },
    { type: "affiliate_link", linkId: linkId("SafetyWing", "INSURANCE") ?? "cmthy4nu4001fdsvj6hjol4ac", label: "Compare pay-as-you-go insurance" },
    { type: "faq", items: [
      { question: "Do I really need travel insurance for a short trip?", answer: "If the direct cost of an emergency hospital visit or an evacuation exceeds what you can self-insure, yes — and for most travellers it does by a wide margin." },
      { question: "How much does travel insurance cost?", answer: "Roughly 4-8% of the trip's prepaid cost, or a flat weekly/monthly subscription for frequent travellers — the cheapest four to six weeks of precaution you'll buy." },
      { question: "My card includes insurance. Is that enough?", answer: "Card cover varies wildly — check medical limits, evac ceilings and exclusions for your exact product before relying on it, especially for long-haul or adventure trips." },
    ] },
  ];
  await upsertArticle({
    title: "How to Choose Travel Insurance (And Read the Fine Print)",
    slug: "how-to-choose-travel-insurance",
    excerpt: "The coverage numbers that matter, the exclusions that void claims and when to buy — a no-nonsense guide to travel insurance.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "travel insurance guide",
    categorySlugs: ["budget-travel", "travel-tips"],
    coverImage: u("photo-1503220317375-aaad61436b1b"),
    blocks: insuranceBlocks,
    publishedAt: at(46),
  }, categoryIds, authorId);

  // ---------- Travel scams ----------
  const scamsBlocks: ContentBlock[] = [
    { type: "p", text: "Scam artists run on split-second scripts, and they mostly target tourists who don't know the script. Forewarned is forearmed: here are the fourteen most common travel scams across Europe, Morocco and Asia, what they look like, and the one-line defence for each." },
    { type: "h2", text: "The classics you'll meet in European cities" },
    { type: "h3", text: "1. The fixed-price airport taxi" },
    { type: "p", text: "A driver quotes a 'special price' or switches off the meter for a 3-4x fare. Defence: agree the flat rate before boarding, or use the official airport transit and licensed ranks only." },
    { type: "h3", text: "2. The friendship bracelet or 'free' rose" },
    { type: "p", text: "A stranger presses a bracelet, flower or keyring into your hand 'for free', then demands payment once you're holding it. Defence: don't take anything handed to you — keep hands in pockets and keep moving." },
    { type: "h3", text: "3. The fake police check" },
    { type: "p", text: "Someone shows a badge on the street, claims a counterfeiting check and asks to see your wallet and cards — a distraction for pickpocketing or card skimming. Defence: real police don't do random street wallet checks; walk away into shops or crowds." },
    { type: "h3", text: "4. The spill-on-your-shoulder distraction" },
    { type: "p", text: "Someone 'accidentally' spills liquid or throws a decoy on you while a partner lifts your wallet. Defence: the moment a stranger touches you or your bag, cross your arms over your valuables and move away." },
    { type: "h3", text: "5. The 'attraction is closed today' reroute" },
    { type: "p", text: "A helpful stranger says a sight is closed and offers a 'better tour' to an overpriced shop or boat. Defence: verify opening hours on the official site; official sites don't send touts." },
    { type: "h3", text: "6. The block-and-grab" },
    { type: "p", text: "In metro corridors or street shows, someone shakes your hand or 'accidentally' collides while a partner reaches into your pocket. Defence: keep bags zipped in front and wallet in a buttoned or front pocket in crowds." },
    { type: "h3", text: "7. The padded restaurant bill" },
    { type: "p", text: "Restaurants near tourist sights add 'service', 'bread' or a second dessert you never ordered. Defence: check the receipt against the menu, and refuse to pay items you didn't order." },
    { type: "h2", text: "Money, machines and the digital era" },
    { type: "h3", text: "8. Dynamic currency conversion" },
    { type: "p", text: "ATMs and card terminals offer to charge you in your home currency at a terrible rate. Defence: always choose the local currency at the terminal — the conversion happens at your bank's far better rate." },
    { type: "h3", text: "9. The airport money kiosk trap" },
    { type: "p", text: "Currency counters advertise zero commission but bury the cost in a terrible exchange rate. Defence: change only a small emergency amount at airports; get the bulk from local ATMs." },
    { type: "h3", text: "10. The card-skimming 'assistance'" },
    { type: "p", text: "A stranger leans in 'to help' you use an ATM that's been rigged to read your card. Defence: use machines inside banks or well-lit centres, cover the keypad, and turn away helpers." },
    { type: "h3", text: "11. Fake booking confirmations" },
    { type: "p", text: "Phishing emails or WhatsApp 'assistants' ask you to 'verify' payment details for a flight or hotel. Defence: only trust payment links inside the authentic app or site you booked on — call the number you originally used." },
    { type: "h2", text: "Market and street scenes across Asia" },
    { type: "h3", text: "12. The 'free sample' hard sell" },
    { type: "p", text: "A saffron, tea or spice stall hands you a 'complimentary' spoonful, then demands an outrageous price once you've eaten it. Defence: smile, decline, and step away — don't touch anything you won't buy." },
    { type: "h3", text: "13. The posed-animal photo" },
    { type: "p", text: "Someone thrusts a caged bird, monkey or mini-beast at you for a photo, then charges a fee per shot. Defence: ask the price before the photo, or simply take candids and walk on." },
    { type: "h3", text: "14. The rental damage claim" },
    { type: "p", text: "A scooter or bike rental takes a deposit, then claims pre-existing damage and keeps it. Defence: photograph the vehicle from every angle (and any pre-existing scratches) at pickup, in front of the owner, and keep the chat trail." },
    { type: "quote", text: "The common thread: every scam needs you to stop, engage and feel pressured. Your most reliable defence is speed of movement and a refusal to be rushed." },
    { type: "affiliate_link", linkId: linkId("SafetyWing", "INSURANCE") ?? "cmthy4nu4001fdsvj6hjol4ac", label: "Travel covered — get insurance before you leave" },
    { type: "faq", items: [
      { question: "Are pickpockets really that common in Europe?", answer: "Not in general life, yes in the hot spots — metro doors, major squares and attraction queues in cities like Barcelona, Rome and Paris. Awareness at those choke points prevents 95% of incidents." },
      { question: "What should I do if I'm scammed?", answer: "Move to a safe, public place, cancel cards via your banking app immediately, and report to local police — the report helps your insurance claim for any loss." },
      { question: "How do I tell a real police officer from a fake one?", answer: "Real officers rarely solicit checks on the street. If approached, keep your documents inside your hand and agree to be escorted to a station — genuine police accept this instantly." },
    ] },
  ];
  await upsertArticle({
    title: "14 Travel Scams to Avoid in 2026 (And How to Spot Each One)",
    slug: "travel-scams-to-avoid",
    excerpt: "The fourteen most common travel scams across Europe, Morocco and Asia — what they look like and the one-line defence for each.",
    type: "LISTICLE",
    destinationId: null,
    focusKeyword: "travel scams to avoid",
    categorySlugs: ["travel-tips"],
    coverImage: u("photo-1488646953014-85cb44e25828"),
    blocks: scamsBlocks,
    publishedAt: at(34),
  }, categoryIds, authorId);

  // ---------- Trip planning checklist ----------
  const planningBlocks: ContentBlock[] = [
    { type: "p", text: "Planned trips beat spontaneous dreams, and the planning itself has a reliable order. This checklist turns 'I want to travel somewhere' into a booked, insured, packed reality — in the sequence that avoids the classic expensive mistakes." },
    { type: "h2", text: "The sixteen-step planning order" },
    { type: "ol", items: ["Lock the dates and the trip duration — everything else follows", "Set the overall budget and a per-day rate you won't silently blow", "Shortlist 3-4 destinations and rank them by visa, season and cost", "Check passport validity (6 months is the common rule) and visa needs now", "Confirm the seasonal weather and any big events or closures", "Book the flights that lock your dates — everything else is elastic around them", "Buy travel insurance the same week as the flights, not the night before", "Book accommodation with free cancellation so plans can flex", "Sketch a loose day-by-day skeleton, one dose of realism at a time", "Reserve the must-have timed tickets — museums, shuttles, iconic sites", "Sort money: two cards in separate places, some local cash, banking alerts on", "Arrange connectivity: an eSIM installed at home beats a roaming surprise", "Pack from a carry-on list, not the contents of a wardrobe", "Confirm ground transport from the airport or station before landing", "Digitise documents — passport, visa, insurance, itinerary — into the cloud", "Share your plan with someone at home and note the local emergency number"] },
    { type: "h2", text: "The two decisions that unbalance everything" },
    { type: "p", text: "Flights and accommodation dominate the budget, so fix their cost ceilings first. If the flight is flexible and the hotel refundable, then the middle of the trip can change with confidence." },
    { type: "cta", label: "Compare fares across destinations", category: "FLIGHTS", destinationSlug: undefined, placement: "planning" },
    { type: "affiliate_link", linkId: linkId("SkyScanner", "FLIGHTS") ?? "cmthy4m85001cdsvj2ujrbg0j", label: "Search flights while your plans are flexible" },
    { type: "cta", label: "Find refundable places to stay", category: "HOTELS", destinationSlug: undefined, placement: "planning" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse free-cancellation hotels" },
    { type: "faq", items: [
      { question: "How far ahead should I start planning?", answer: "Three to six months for international trips, one to two months for short-haul. Start earlier for major peak periods and for slow-granting visas." },
      { question: "What order should I book things?", answer: "Dates, visa, then flights, insurance, accommodation, transport, and finally timed tickets. Booking insurance right after flights closes the least-insured gap in the trip." },
      { question: "What's the biggest trip-planning mistake?", answer: "Booking the return before checking whether an onward visa exists, and over-scheduling — leave at least one unbooked afternoon per three days." },
    ] },
  ];
  await upsertArticle({
    title: "How to Plan a Trip: The Complete 16-Step Checklist",
    slug: "how-to-plan-a-trip",
    excerpt: "A repeatable trip-planning sequence from dates and budget to documents and airport transfers — the order that avoids the expensive mistakes.",
    type: "RESOURCE_GUIDE",
    destinationId: null,
    focusKeyword: "how to plan a trip",
    categorySlugs: ["budget-travel", "travel-tips"],
    coverImage: u("photo-1467269204594-9661b134dd2b"),
    blocks: planningBlocks,
    publishedAt: at(22),
  }, categoryIds, authorId);

  // ---------- Best time to visit Bali ----------
  const baliTimeBlocks: ContentBlock[] = [
    { type: "p", text: "Bali's climate splits into two simple seasons, but the 'best' time depends on what you value: dry-weather certainty, light crowds, or the lowest prices. This guide maps the trade-offs month by month." },
    { type: "h2", text: "The two seasons in plain terms" },
    { type: "ul", items: ["Dry season (April-October): blue skies, calm sea, peak prices", "Wet season (November-March): afternoon showers, lush green, cheaper stays", "The trade: rain usually arrives as short afternoon bursts, not week-long soaks", "Surfing: the big swells run in the wet-season west, calm conditions in the dry east"] },
    { type: "h2", text: "Month by month" },
    { type: "table", headers: ["Period", "Weather", "Notes"], rows: [
      ["January-March", "Wet but warm", "Quieter beaches, lowest prices, Nyepi silent day falls around March"],
      ["April-May", "Transition to dry", "Green season crowds thin; shoulder pricing"],
      ["June-September", "Dry peak", "Best weather, busiest beaches, premium hotel rates"],
      ["October", "Dry linger", "Good balance of sun and lighter crowds"],
      ["November-December", "Wet onset", "Green and cheap; some west-coast surf swell"],
    ] },
    { type: "h2", text: "The Nyepi factor" },
    { type: "p", text: "Nyepi, the Balinese New Year, is a day of complete silence — no flights, no traffic, no activities, with airport closures. It's fascinating culture and a genuine logistics event: plan around the exact date if you land or leave in late February to March." },
    { type: "h2", text: "Crowds, festivals and what to book" },
    { type: "ul", items: ["August is the heaviest rush — book flights and hotels months ahead", "Christmas and New Year spike prices across the board", "Rainy-season Bali is greener, emptier and cheaper — ideal for culture, temples and spas", "Ubud's temple festivals and Galungan days are a reason to visit in either season"] },
    { type: "cta", label: "Compare Bali stays for your dates", category: "HOTELS", destinationSlug: "bali", placement: "bali-time" },
    { type: "affiliate_link", linkId: linkId("Booking.com", "HOTELS") ?? "cmthgtpsd001dh8vjcmq4inac", label: "Browse Bali hotels" },
    { type: "faq", items: [
      { question: "What's the cheapest time to visit Bali?", answer: "The wet-season months of January to March and November generally carry the lowest hotel prices and lightest crowds — the main cost is a greater chance of afternoon rain." },
      { question: "Is the wet season a bad time to go?", answer: "No — it's still warm (around 27-30°C), and rain usually falls in short daily bursts. The island turns a deeper green and temple sights stay fully open." },
      { question: "Are flights cheaper to Bali in the wet season?", answer: "Often, yes — shoulder demand around November and February-March regularly produces under-$500 return fares from major European hubs." },
    ] },
  ];
  await upsertArticle({
    title: "Best Time to Visit Bali: A Month-by-Month Guide",
    slug: "best-time-to-visit-bali",
    excerpt: "Dry versus wet season, the Nyepi silent day and the months that balance weather, crowds and price — a month-by-month Bali guide.",
    type: "THINGS_TO_DO",
    destinationId: cityIds.bali,
    focusKeyword: "best time to visit bali",
    categorySlugs: ["destination-guides", "budget-travel"],
    coverImage: u("photo-1537996194471-e657df975ab4"),
    blocks: baliTimeBlocks,
    publishedAt: at(10),
  }, categoryIds, authorId);

  // ---------- Solo female travel ----------
  const soloBlocks: ContentBlock[] = [
    { type: "p", text: "Solo travel rewards preparation: the prep is what converts worry into confidence. These are the habits experienced solo travellers repeat — around safety, money, navigation and meeting people — that read as universal rather than gendered." },
    { type: "h2", text: "Before you go" },
    { type: "ul", items: ["Book your first two nights at a well-reviewed central property — removing the arrival panic solves the riskiest stretch", "Share your live location with one trusted person for the whole trip, not just day one", "Photograph your documents into cloud storage and keep a paper backup separate", "Download offline maps for the whole city — navigation without data is a superpower", "Note the local emergency number and your embassy's contact in your phone"] },
    { type: "h2", text: "Arrival habits" },
    { type: "ul", items: ["Land in daylight whenever the schedule allows — most avoidable stress happens on the first airport dash", "Arrange the first transfer in advance; the tired-you crowd is a different negotiator", "Don't advertise solo status in check-in queues or bar conversations — every room number is a potential detail", "Keep the phone charged with a backup power bank; a dead phone is a small emergency"] },
    { type: "h2", text: "Everyday patterns" },
    { type: "ul", items: ["The 'night rule': first nights belong to group activities — cooking classes, food tours, day trips — not late bars", "Meet people through daytime activities where one beds in a whole group of companions", "Choose the side of the street with light and people, and trust the instinct that says the detour is worth it", "Split cash and cards so a single loss isn't a trip-ender"] },
    { type: "cta", label: "Find day tours with group energy", category: "ACTIVITIES", destinationSlug: undefined, placement: "solo" },
    { type: "affiliate_link", linkId: linkId("GetYourGuide", "ACTIVITIES") ?? "cmthy4mmf001ddsvjqgh8lluh", label: "Browse group tours and activities" },
    { type: "affiliate_link", linkId: linkId("SafetyWing", "INSURANCE") ?? "cmthy4nu4001fdsvj6hjol4ac", label: "Insure the solo trip properly" },
    { type: "faq", items: [
      { question: "Is solo travel safe for women?", answer: "Yes, with the same caveats as any travel: research, sensible night habits, and accommodation chosen for review volume rather than just price. Preparedness, not fear, is the operating language." },
      { question: "How do I meet people while travelling alone?", answer: "Daytime group activities — food tours, cooking classes, day trips — attract exactly the travellers trying to meet people. They beat bar-scene spontaneity for most solos." },
      { question: "What should I carry daily?", answer: "A messenger or backpack in front position in crowds, one card, modest cash, a power bank, phone with offline maps, and a copy of your passport page." },
    ] },
  ];
  await upsertArticle({
    title: "Solo Female Travel: Safety Tips That Actually Work",
    slug: "solo-female-travel-safety-tips",
    excerpt: "The arrival habits, night rules and everyday patterns seasoned solo travellers use — practical safety that doesn't replace curiosity.",
    type: "TRAVEL_TIPS",
    destinationId: null,
    focusKeyword: "solo female travel tips",
    categorySlugs: ["solo-travel", "travel-tips"],
    coverImage: u("photo-1488646953014-85cb44e25828"),
    blocks: soloBlocks,
    publishedAt: at(6),
  }, categoryIds, authorId);

  console.log("Tips articles seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});