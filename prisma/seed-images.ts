import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const u = (id: string, w = 1200, q = 80) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

const DEST_IMAGES: Record<string, string> = {
  paris: u("photo-1502602898657-3e91760cbb34"), // Eiffel Tower
  tokyo: u("photo-1540959733332-eab4deabeeaf"), // Tokyo street
  marrakech: u("photo-1597212618440-806262de4f6b"), // Marrakech
  rome: u("photo-1552832230-c0197dd311b5"), // Colosseum
  bali: u("photo-1537996194471-e657df975ab4"), // Bali temple
  barcelona: u("photo-1583422409516-2895a77efded"), // Sagrada Familia
  osaka: u("photo-1553413077-190dd305871c"), // Osaka
  kyoto: u("photo-1493976040374-85c8e12f0c0e"), // Kyoto temple
  france: u("photo-1502602898657-3e91760cbb34"),
  spain: u("photo-1583422409516-2895a77efded"),
  japan: u("photo-1493976040374-85c8e12f0c0e"),
  morocco: u("photo-1597212618440-806262de4f6b"),
  italy: u("photo-1552832230-c0197dd311b5"),
  indonesia: u("photo-1537996194471-e657df975ab4"),
  europe: u("photo-1467269204594-9661b134dd2b"), // Europe skyline
  asia: u("photo-1528360983277-13d401cdc186"), // Asian temple
  africa: u("photo-1547471080-7cc2caa01a7e"), // Sahara camels
  "middle-east": u("photo-1533669955142-6a73332af4db"), // Desert
  americas: u("photo-1488646953014-85cb44e25828"), // World travel
};

const HOTEL_IMAGES: Record<string, string> = {
  "hotel-du-petit-moulin": u("photo-1566073771259-6a8506099945"), // hotel room
  "le-meurice": u("photo-1582719478250-c89cae4dc85b"), // luxury hotel
  "hotel-joke-astotel": u("photo-1551882547-ff40c63fe5fa"), // hotel lobby
  "shibuya-hotel-en": u("photo-1522798514-97ceb8c4f1c8"), // hotel bed
  "ryokan-tsubaki": u("photo-1545569341-9eb8b30979d9"), // japan interior
  "riad-al-badia": u("photo-1545324418-cc1a3fa10c00"), // riad courtyard
  "la-sultana-marrakech": u("photo-1564085352725-08da0272627d"), // pool
  "hotel-artemide": u("photo-1512918728675-ed5a9ecdebfd"), // hotel exterior
};

const ACTIVITY_IMAGES: Record<string, string> = {
  "louvre-skip-the-line-guided-tour": u("photo-1549144511-f099e773c147"), // museum
  "seine-river-evening-cruise": u("photo-1512756290469-ec264b7fbf87"), // Seine
  "mount-fuji-day-trip-from-tokyo": u("photo-1490806843957-31f4c9a91c65"), // Mt Fuji
  "tea-ceremony-in-kyoto": u("photo-1528360983277-13d401cdc186"), // green tea
  "marrakech-food-tour": u("photo-1539020140153-e479b8c22e70"), // market food
  "roman-forum-and-colosseum-tour": u("photo-1552832230-c0197dd311b5"), // Colosseum
};

const PRODUCT_IMAGES: Record<string, string> = {
  "universal-travel-adapter": u("photo-1523293182086-7651a899d37f"),
  "packable-daypack": u("photo-1553062407-98eeb64c6a62"),
  "travel-esim-starter-guide": u("photo-1512941937669-90a1b58e7e9c"),
  "refillable-water-bottle-with-filter": u("photo-1602143407151-7111542de6e8"),
};

const ARTICLE_IMAGES: Record<string, string> = {
  "paris-travel-guide": u("photo-1502602898657-3e91760cbb34"),
  "tokyo-travel-guide": u("photo-1540959733332-eab4deabeeaf"),
  "best-things-to-do-in-marrakech": u("photo-1597212618440-806262de4f6b"),
  "paris-in-4-days-itinerary": u("photo-1499856871958-5b9627545d1a"), // Paris cafe
};

async function main() {
  let n = 0;

  for (const [slug, url] of Object.entries(DEST_IMAGES)) {
    const r = await prisma.destination.updateMany({
      where: { slug, OR: [{ coverImage: null }, { coverImage: "" }] },
      data: { coverImage: url, heroImage: url },
    });
    n += r.count;
  }

  for (const [slug, url] of Object.entries(HOTEL_IMAGES)) {
    const r = await prisma.hotel.updateMany({ where: { slug }, data: { image: url } });
    n += r.count;
  }

  for (const [slug, url] of Object.entries(ACTIVITY_IMAGES)) {
    const r = await prisma.activity.updateMany({ where: { slug }, data: { image: url } });
    n += r.count;
  }

  for (const [slug, url] of Object.entries(PRODUCT_IMAGES)) {
    const r = await prisma.product.updateMany({ where: { slug }, data: { image: url } });
    n += r.count;
  }

  for (const [slug, url] of Object.entries(ARTICLE_IMAGES)) {
    const r = await prisma.article.updateMany({ where: { slug }, data: { coverImage: url, ogImage: url } });
    n += r.count;
  }

  console.log(`Images assigned to ${n} records.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
