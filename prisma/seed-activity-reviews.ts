import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Seeds a few in-house written reviews onto our original activities.
 * All reviews are original text for Riversmag — no third-party copy.
 * Idempotent: deletes and recreates only the reviews tagged with slug source.
 */

interface ReviewSeed {
  activitySlug: string;
  author: string;
  rating: number;
  title: string;
  content: string;
}

const REVIEWS: ReviewSeed[] = [
  {
    activitySlug: "louvre-skip-line-guided-tour",
    author: "Emma H.",
    rating: 5,
    title: "Worth every penny to skip the queue",
    content:
      "We'd have wasted an hour queuing if we'd come alone. Our guide paced it perfectly — highlights first, then we had free time to go back to our favourite rooms. Ideal if you're short on days in Paris.",
  },
  {
    activitySlug: "louvre-skip-line-guided-tour",
    author: "James T.",
    rating: 4,
    title: "Great guide, busy morning",
    content:
      "The guide was brilliant and clearly loved the museum. It was very busy even first thing, but you still saw everything you came for. Would book again but choose an early slot.",
  },
  {
    activitySlug: "sensoji-and-asakusa-shrine-tour",
    author: "Priya K.",
    rating: 5,
    title: "Perfect introduction to Tokyo",
    content:
      "Asakusa is a must, and doing it with a local made all the difference. We learned the proper way to pray and found a quiet temple just around the corner the crowds miss. Highly recommend for a first trip.",
  },
  {
    activitySlug: "colosseum-roman-forum-palatine-tour",
    author: "Carlos M.",
    rating: 5,
    title: "Beneath the Colosseum is a must",
    content:
      "The underground access was the highlight — you really understand the scale of it. The guide connected the Forum and Palatine beautifully. Skip-the-line is essential in summer.",
  },
  {
    activitySlug: "tsukiji-fish-market-tour",
    author: "Sofia R.",
    rating: 4,
    title: "Delicious and a little chaotic",
    content:
      "So much food, so little time. Our guide knew exactly which stalls were worth it and which were tourist traps. Come hungry — you'll eat a lot. Only minus is the early start.",
  },
  {
    activitySlug: "ubud-rafting-and-rice-terraces",
    author: "Liam B.",
    rating: 5,
    title: "Adventure mixed with stunning scenery",
    content:
      "The rice terraces were postcard-perfect and the rafting genuinely thrilling. Good mix of driving, walking and getting wet. One of the best days of our whole Bali trip.",
  },
  {
    activitySlug: "kiyomizu-dera-and-gion-evening-tour",
    author: "Anna W.",
    rating: 5,
    title: "Kyoto in golden light",
    content:
      "Walking down to Gion as the sun set was magical — the wooden temples and lantern-lit streets felt timeless. The guide's stories about the geisha district really brought it alive.",
  },
  {
    activitySlug: "trastevere-evening-food-tour",
    author: "Marco D.",
    rating: 5,
    title: "The best dinner in Rome",
    content:
      "We didn't need dinner after this — the tastings were generous and excellent. Trastevere after dark is wonderful and our guide took us to places we'd never have found alone.",
  },
];

async function main() {
  const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
  const prisma = new PrismaClient({ adapter });

  // Remove any previously seeded activity reviews (by slug marker)
  await prisma.$executeRawUnsafe(`DELETE FROM "Review" WHERE "activityId" IS NOT NULL AND "id" LIKE 'seed-%'`);

  let created = 0;
  for (const seed of REVIEWS) {
    const activity = await prisma.activity.findUnique({ where: { slug: seed.activitySlug } });
    if (!activity) {
      console.warn(`Activity not found: ${seed.activitySlug}`);
      continue;
    }
    const id = `seed-${seed.activitySlug}-${seed.author.replace(/\s+/g, "-").toLowerCase()}`;
    await prisma.review.create({
      data: {
        id,
        title: seed.title,
        content: seed.content,
        rating: seed.rating,
        author: seed.author,
        activityId: activity.id,
      },
    });
    created++;
  }

  console.log(`Reviews created: ${created}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
