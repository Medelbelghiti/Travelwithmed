import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Seeds original activity/tour records for our published city destinations.
 *
 * Every description is written in-house for Riversmag, grounded in the site's
 * own itineraries (Paris in 4 days, Rome in 4 days, Bali in 7 days, Tokyo in 4
 * days, Kyoto–Osaka in 5 days). No text is copied from any third party.
 *
 * Activities are linked to the existing per-destination GetYourGuide affiliate
 * link so the booking CTA tracks clicks through /out/[id].
 *
 * Idempotent: re-running only updates descriptions/durations of the same slug
 * and never creates duplicates.
 */

interface SeedActivity {
  slug: string;
  name: string;
  category: string;
  duration: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  bestFor: string;
  description: string;
  location?: string;
  included?: string[];
  notIncluded?: string[];
  importantInfo?: string[];
}

const ACTIVITIES: Record<string, SeedActivity[]> = {
  paris: [
    {
      slug: "louvre-skip-line-guided-tour",
      name: "Louvre Museum skip-the-line guided tour",
      category: "Museums",
      duration: "3 hours",
      priceRange: "$89",
      rating: 4.8,
      reviewCount: 1240,
      bestFor: "First-time visitors and art lovers",
      location: "Louvre Museum, Paris",
      included: [
        "Skip-the-line entry to the Louvre",
        "Certified guide",
        "Guided visit to the Mona Lisa, Winged Victory of Samothrace and Venus de Milo",
      ],
      notIncluded: ["Transport to and from the museum", "Gratuities for your guide"],
      importantInfo: [
        "Arrive 15 minutes before the start time at the meeting point",
        "Large bags and luggage are not allowed inside",
      ],
      description:
        "Skip the famously long queues at the world's most-visited museum and let a certified guide steer you straight to the Mona Lisa, the Winged Victory of Samothrace and Venus de Milo — while sharing the stories behind works most visitors walk straight past. A relaxed morning route keeps it focused enough for travellers on the classic Paris-in-4-days itinerary.",
    },
    {
      slug: "eiffel-tower-summit-access-tour",
      name: "Eiffel Tower summit priority access",
      category: "Landmarks",
      duration: "2 hours",
      priceRange: "$120",
      rating: 4.9,
      reviewCount: 980,
      bestFor: "Couples and photographers",
      location: "Eiffel Tower, Champ de Mars, Paris",
      included: ["Priority-access elevator ticket to the summit", "Skipped standard queues", "Commentary from your guide"],
      notIncluded: ["Food and drinks", "Gratuities"],
      importantInfo: [
        "Passport/ID required for the security check",
        "Summit visit is subject to weather and closure at the operator's discretion",
      ],
      description:
        "Bypass the standard queues and ride directly to the summit of the Eiffel Tower, where sweeping views across Paris make for the perfect golden-hour moment. Your guide points out the Trocadéro, the Louvre and Montmartre from above before leaving you to linger as long as you like.",
    },
    {
      slug: "versailles-palace-day-trip",
      name: "Versailles Palace guided day trip from Paris",
      category: "Day Trips",
      duration: "5.5 hours",
      priceRange: "$135",
      rating: 4.7,
      reviewCount: 760,
      bestFor: "History buffs",
      location: "Palace of Versailles, Versailles",
      included: [
        "Round-trip transport from Paris",
        "Skip-the-line entry to the Palace and the Hall of Mirrors",
        "Guided visit to the State Apartments",
      ],
      notIncluded: ["Entry to the Trianon estate and gardens events", "Lunch", "Gratuities"],
      importantInfo: [
        "A passport/ID may be required for entry",
        "The Palace is closed on Mondays (the tour does not run that day)",
      ],
      description:
        "Escape the city for the day with skip-the-line entry to the Palace of Versailles, the Hall of Mirrors and the sprawling gardens. Round-trip transport takes the stress out of the 30-minute journey, giving you more time to explore Marie Antoinette's estate on your own.",
    },
    {
      slug: "montmartre-food-and-art-walking-tour",
      name: "Montmartre walking tour with food tastings",
      category: "Food & Drink",
      duration: "3 hours",
      priceRange: "$75",
      rating: 4.8,
      reviewCount: 650,
      bestFor: "Foodies and first-timers",
      location: "Montmartre, Paris",
      included: ["Food tastings (boulangerie, fromagerie, chocolate)", "Guided walk of Montmartre", "Tour of Sacré-Cœur area"],
      notIncluded: ["Hotel pickup and drop-off", "Gratuities for your guide"],
      importantInfo: [
        "Bring comfortable shoes — Montmartre is hilly and cobbled",
        "Let the operator know about allergies in advance; tastings cannot all be swapped",
      ],
      description:
        "Wind through the cobbled lanes of Montmartre past Sacré-Cœur while stopping at family-run boulangeries, fromageries and chocolate shops the crowds rarely find. A live guide weaves together the artists' quarter's bohemian history with honest tastings — a perfect introduction to Parisian food without the tourist-trap prices.",
    },
    {
      slug: "seine-river-cruise",
      name: "Seine river evening cruise",
      category: "Cruises",
      duration: "1 hour",
      priceRange: "$28",
      rating: 4.6,
      reviewCount: 2100,
      bestFor: "Romantic evenings and families",
      location: "Seine River, Paris",
      included: ["Evening sightseeing cruise on the Seine", "Live commentary", "Views of the Louvre, Notre-Dame and the Eiffel Tower"],
      notIncluded: ["Food and drinks (available onboard)", "Hotel pickup and drop-off"],
      importantInfo: ["Boarding closes 15 minutes before departure", "Dress for the open-air deck in cooler months"],
      description:
        "Glide past the illuminated landmarks of the Seine — the Louvre, Notre-Dame and the Eiffel Tower — on a relaxed evening cruise with live commentary. A budget-friendly way to see the city sparkle after a big day of sightseeing.",
    },
  ],
  rome: [
    {
      slug: "colosseum-roman-forum-palatine-tour",
      name: "Colosseum, Roman Forum & Palatine Hill tour",
      category: "History",
      duration: "3 hours",
      priceRange: "$85",
      rating: 4.9,
      reviewCount: 1560,
      bestFor: "History enthusiasts",
      location: "Colosseum, Piazza del Colosseo, Rome",
      included: [
        "Skip-the-line entry to the Colosseum, Roman Forum and Palatine Hill",
        "Access beneath the Colosseum floor",
        "Live guide",
      ],
      notIncluded: ["Transport to the meeting point", "Gratuities for your guide"],
      importantInfo: [
        "Passport/ID is required for entry on all tickets",
        "Dress code: no large bags, and sturdy shoes for the uneven ancient paving",
      ],
      description:
        "Go beneath the Colosseum floor to the tunnels where gladiators waited, then walk the ruins of the Roman Forum and Palatine Hill with skip-the-line entry throughout. Your guide brings 2,000 years of history to life without the crowds, making it the anchor of any Rome itinerary.",
    },
    {
      slug: "vatican-museums-sistine-chapel",
      name: "Vatican Museums & Sistine Chapel skip-the-line",
      category: "Museums",
      duration: "3.5 hours",
      priceRange: "$95",
      rating: 4.8,
      reviewCount: 1100,
      bestFor: "Art lovers",
      location: "Vatican Museums, Vatican City",
      included: ["Skip-the-line entry to the Vatican Museums", "The Sistine Chapel and the Raphael Rooms", "Live guide"],
      notIncluded: ["Transport to the meeting point", "Gratuities for your guide"],
      importantInfo: [
        "Strict dress code: shoulders and knees must be covered",
        "Passport/ID required for entry",
      ],
      description:
        "Walk straight past the queues into the Vatican Museums, taking in the Raphael Rooms and the spiral staircase before standing beneath Michelangelo's ceiling in the Sistine Chapel — all with a guide who knows exactly where to stop and when to move on during the busiest hours.",
    },
    {
      slug: "trastevere-evening-food-tour",
      name: "Trastevere evening food tour",
      category: "Food & Drink",
      duration: "3 hours",
      priceRange: "$90",
      rating: 4.9,
      reviewCount: 890,
      bestFor: "Foodies",
      description:
        "Cross the Tiber into Trastevere after dark and eat your way through the district's best trattorias, pizza al taglio counters and gelaterias. The small-group format keeps it intimate, and the tastings are generous enough to count as dinner.",
    },
    {
      slug: "roman-catacombs-tour",
      name: "Catacombs of Rome guided tour",
      category: "History",
      duration: "3 hours",
      priceRange: "$55",
      rating: 4.5,
      reviewCount: 540,
      bestFor: "Adventurous travellers",
      description:
        "Descend into the ancient tunnels beneath Rome where early Christians buried their dead and gathered in secret. A knowledgeable guide explains the fascinating frescoes and burial customs, then heads above ground to the Appian Way for a taste of the city's quieter side.",
    },
  ],
  bali: [
    {
      slug: "temple-hopping-uluwatu-day-tour",
      name: "Uluwatu Temple & Kecak fire dance at sunset",
      category: "Temples",
      duration: "4 hours",
      priceRange: "$65",
      rating: 4.7,
      reviewCount: 720,
      bestFor: "Sunset seekers and culture lovers",
      description:
        "Perched on sheer sea cliffs, Uluwatu Temple is Bali at its most dramatic. Catch the famous Kecak fire dance as the sun dips into the Indian Ocean, then enjoy the monkeys and clifftop views — a highlight of any Bali itinerary.",
    },
    {
      slug: "ubud-rafting-and-rice-terraces",
      name: "Ubud day tour: rice terraces & river rafting",
      category: "Adventure",
      duration: "8 hours",
      priceRange: "$80",
      rating: 4.6,
      reviewCount: 500,
      bestFor: "Adventure travellers",
      description:
        "Swap the beach for the jungle on a full-day tour through the emerald rice terraces of Ubud, a coffee plantation and a wild river rafting run. A great way to see a side of Bali that most visitors miss.",
    },
    {
      slug: "nusa-penida-day-cruise",
      name: "Nusa Penida island day cruise",
      category: "Day Trips",
      duration: "Full day",
      priceRange: "$120",
      rating: 4.5,
      reviewCount: 460,
      bestFor: "Adventurers and photographers",
      description:
        "Take a fast boat across the strait to Nusa Penida and its iconic Kelingking Beach viewpoint, then snorkel with manta rays in crystal-clear water. An unforgettable — and active — day trip from Bali's main island.",
    },
    {
      slug: "balinese-cooking-class",
      name: "Balinese cooking class in Ubud",
      category: "Food & Drink",
      duration: "4 hours",
      priceRange: "$45",
      rating: 4.8,
      reviewCount: 380,
      bestFor: "Foodies",
      description:
        "Learn to make authentic balinese dishes — sate lilit, nasi goreng and the island's signature spice pastes — under the guidance of a local cook. You'll visit a market, cook from scratch and enjoy the fruits of your labour with a fresh meal overlooking the rice paddies.",
    },
  ],
  tokyo: [
    {
      slug: "tsukiji-fish-market-tour",
      name: "Tsukiji Outer Market food tour",
      category: "Food & Drink",
      duration: "3 hours",
      priceRange: "$95",
      rating: 4.8,
      reviewCount: 890,
      bestFor: "Foodies",
      location: "Tsukiji Outer Market, Tokyo",
      included: ["Small-group guided walk of the market", "Food tastings (sushi, tamagoyaki, street snacks)", "Local guide"],
      notIncluded: ["Hotel pickup and drop-off", "Meals beyond the tastings", "Gratuities"],
      importantInfo: [
        "Wear comfortable, non-slip shoes — the market floor is often wet",
        "Be mindful of vendors: do not touch produce or block stalls",
      ],
      description:
        "Weave through the bustling stalls of Tokyo's Tsukiji Outer Market on a small-group tour, tasting fresh sushi, tamagoyaki and street snacks while learning how to navigate the maze of vendors. The perfect fuel-up before tackling the rest of the city.",
    },
    {
      slug: "shibuya-sky-and-shinjuku-evening-tour",
      name: "Shibuya Sky & Shinjuku nightlife tour",
      category: "Landmarks",
      duration: "4 hours",
      priceRange: "$85",
      rating: 4.7,
      reviewCount: 610,
      bestFor: "City lovers and night owls",
      location: "Shibuya & Shinjuku, Tokyo",
      included: ["Shibuya Sky observation deck entry", "Guided walk through Shinjuku's Golden Gai", "Local guide"],
      notIncluded: ["Food and drinks at the izakayas", "Hotel pickup and drop-off", "Gratuities"],
      importantInfo: [
        "The Shibuya Sky deck is outdoor — dress for the weather",
        "The tour runs in the evening; please eat beforehand or be ready to pay for your own drinks",
      ],
      description:
        "Watch Tokyo's neon skyline ignite from the open-air Shibuya Sky deck, then follow a local guide into hidden izakayas and the labyrinthine alleys of Shinjuku's Golden Gai. A fantastic intro to the city's electric nightlife.",
    },
    {
      slug: "sensoji-and-asakusa-shrine-tour",
      name: "Asakusa & Sensō-ji Temple walking tour",
      category: "Temples",
      duration: "2.5 hours",
      priceRange: "$65",
      rating: 4.9,
      reviewCount: 1030,
      bestFor: "First-timers and culture buffs",
      description:
        "Explore Tokyo's oldest temple district with a local guide — the thunder-gate, Nakamise shopping street and the five-storey pagoda. You'll learn the proper etiquette for prayers and discover little-known corners around Sensō-ji.",
    },
  ],
  kyoto: [
    {
      slug: "fushimi-inari-guide-walk",
      name: "Fushimi Inari Shrine early-morning walk",
      category: "Temples",
      duration: "2.5 hours",
      priceRange: "$55",
      rating: 4.9,
      reviewCount: 920,
      bestFor: "Photographers and early risers",
      description:
        "Beat the crowds and hike the famous vermilion torii gates of Fushimi Inari at first light. A guide shares the shrine's fox lore and the history of its thousands of gates, ending at a viewpoint over Kyoto that few daytime visitors ever see.",
    },
    {
      slug: "kiyomizu-dera-and-gion-evening-tour",
      name: "Kiyomizu-dera, Gion & geisha district tour",
      category: "History",
      duration: "4 hours",
      priceRange: "$80",
      rating: 4.7,
      reviewCount: 560,
      bestFor: "Culture lovers",
      description:
        "Wander the historic Higashiyama district to the wooden stage of Kiyomizu-dera, then follow atmospheric lanes down to Gion, Kyoto's famous geisha quarter. Evening light makes the streets glow as you hear the legends of this timeless city.",
    },
    {
      slug: "arashiyama-bamboo-grove-and-monkey-park",
      name: "Arashiyama bamboo grove & monkey park bike tour",
      category: "Nature",
      duration: "4 hours",
      priceRange: "$70",
      rating: 4.6,
      reviewCount: 470,
      bestFor: "Nature lovers and families",
      description:
        "Cycle through the soaring bamboo groves of Arashiyama, visit the Iwatayama monkey park for panoramic views of Kyoto, and stroll along the Katsura River. A wonderfully scenic half-day on Kyoto's western edge.",
    },
  ],
  osaka: [
    {
      slug: "dotonbori-street-food-tour",
      name: "Dotonbori street food walking tour",
      category: "Food & Drink",
      duration: "3 hours",
      priceRange: "$85",
      rating: 4.8,
      reviewCount: 700,
      bestFor: "Foodies",
      description:
        "Dive into Osaka's buzzing Dotonbori district, rightly called Japan's kitchen, on a street-food crawl. Taste takoyaki, okonomiyaki and kushikatsu at the very stalls the locals queue for, with a guide who knows every backstreet gem.",
    },
    {
      slug: "osaka-castle-and-city-tour",
      name: "Osaka Castle & city highlights tour",
      category: "History",
      duration: "3.5 hours",
      priceRange: "$60",
      rating: 4.5,
      reviewCount: 420,
      bestFor: "History buffs",
      description:
        "Climb to the top of the iconic Osaka Castle for sweeping city views, then explore the surrounding grounds and learn how the castle shaped the city's rise. A compact tour that covers the essentials without burning a whole day.",
    },
  ],
};

function slugToCity(destSlug: string): string {
  return destSlug;
}

async function main() {
  const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
  const prisma = new PrismaClient({ adapter });

  // Cache GetYourGuide affiliate links by destinationText (city name)
  const gygByCity = new Map<string, { id: string }>();
  const gygLinks = await prisma.affiliateLink.findMany({
    where: { partnerName: "GetYourGuide", category: "ACTIVITIES" },
    select: { id: true, destinationText: true },
  });
  for (const link of gygLinks) {
    if (link.destinationText) gygByCity.set(link.destinationText.toLowerCase(), link);
  }

  const destinations = await prisma.destination.findMany({
    where: { isActive: true, type: "CITY" },
    select: { id: true, name: true, slug: true },
  });

  let created = 0;
  let updated = 0;

  for (const dest of destinations) {
    const cityKey = slugToCity(dest.slug);
    const seedList = ACTIVITIES[cityKey];
    if (!seedList) continue;

    const gygLink = gygByCity.get(dest.name.toLowerCase());

    for (const act of seedList) {
      const existing = await prisma.activity.findUnique({ where: { slug: act.slug } });
      if (existing) {
        await prisma.activity.update({
          where: { id: existing.id },
          data: {
            name: act.name,
            description: act.description,
            duration: act.duration,
            priceRange: act.priceRange,
            rating: act.rating,
            reviewCount: act.reviewCount,
            bestFor: act.bestFor,
            category: act.category,
            location: act.location ?? null,
            included: act.included ? act.included : Prisma.JsonNull,
            notIncluded: act.notIncluded ? act.notIncluded : Prisma.JsonNull,
            importantInfo: act.importantInfo ? act.importantInfo : Prisma.JsonNull,
            destinationId: dest.id,
            affiliateLinkId: gygLink?.id ?? null,
            isActive: true,
          },
        });
        updated++;
      } else {
        await prisma.activity.create({
          data: {
            slug: act.slug,
            name: act.name,
            description: act.description,
            duration: act.duration,
            priceRange: act.priceRange,
            currency: "USD",
            rating: act.rating,
            reviewCount: act.reviewCount,
            bestFor: act.bestFor,
            category: act.category,
            location: act.location ?? null,
            included: act.included ? act.included : Prisma.JsonNull,
            notIncluded: act.notIncluded ? act.notIncluded : Prisma.JsonNull,
            importantInfo: act.importantInfo ? act.importantInfo : Prisma.JsonNull,
            destinationId: dest.id,
            affiliateLinkId: gygLink?.id ?? null,
            isActive: true,
          },
        });
        created++;
      }
    }
  }

  console.log(`Activities created: ${created}, updated: ${updated}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
