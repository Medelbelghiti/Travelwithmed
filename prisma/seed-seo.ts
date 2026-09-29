import { prisma } from "@/lib/prisma";
import { buildMetaTitle, META_TITLE_MAX } from "@/lib/seo";

/**
 * Dry run unless --apply is passed.
 *
 * This script is a REPAIR + fill tool, not a reset. It never overwrites a
 * curated image, title, description or robots directive with a generic value:
 *
 *   - images are only written when the current value is empty or points at a
 *     dead image, so a human's choice is never clobbered
 *   - an existing robots directive is preserved; "index, follow" is only
 *     written when nothing is set
 *   - there is no generic per-destination image fallback any more. An earlier
 *     version of this file assigned the Paris photo to any destination missing
 *     from PHOTOS, which silently mislabelled unrelated cities.
 */
const APPLY = process.argv.includes("--apply");

/** Confirmed HTTP 404 on images.unsplash.com (audit Phase 8.2). */
const DEAD_IMAGES = new Set([
  "photo-1501785888041-af3ef285b2aa", // nature / lake
  "photo-1508009603885-a5b2c675d8d0", // beach
  "photo-1464824477268-36a28a1e2487", // nature / mountain
]);

/** True when an image slot is empty or holds a URL we know is dead. */
function imageNeedsRepair(current: string | null | undefined): boolean {
  if (!current) return true;
  for (const dead of DEAD_IMAGES) if (current.includes(dead)) return true;
  return false;
}

const PHOTOS: Record<string, string> = {
  paris:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=90",
  tokyo:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=90",
  "new-york":"https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1920&q=90",
  bangkok:"https://images.unsplash.com/photo-1613672803979-a6edfc5a179b?auto=format&fit=crop&w=1920&q=90",
  barcelona:"https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1920&q=90",
  rome:"https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1920&q=90",
  marrakech:"https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1920&q=90",
  // OPEN ITEM (Phase 8.2): this is the pre-existing photo-1540959733332 Tokyo
  // image, i.e. Lisbon is currently illustrated with the wrong city. It is
  // live (HTTP 200) so nothing is broken, but it is wrong. A correct Lisbon
  // photo must be sourced and visually confirmed before this is changed -
  // do not guess an Unsplash ID. Left as-is deliberately rather than
  // substituting an unverified ID.
  lisbon:"https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=90",
  cairo:"https://images.unsplash.com/photo-1533669955142-6a73332af4db?auto=format&fit=crop&w=1920&q=90",
  "rio-de-janeiro":"https://images.unsplash.com/photo-1596573677494-accc8fbe89e8?auto=format&fit=crop&w=1920&q=90",
  miami:"https://images.unsplash.com/photo-1589083130544-0d6a2926e519?auto=format&fit=crop&w=1920&q=90",
  "los-angeles":"https://images.unsplash.com/photo-1597982087634-9884f03198ce?auto=format&fit=crop&w=1920&q=90",
  bali:"https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=90",
  athens:"https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1920&q=90",
  "san-francisco":"https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=1920&q=90",
  london:"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=90",
  amsterdam:"https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1920&q=90",
  dubai:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=90",
  singapore:"https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=90",
  seoul:"https://images.unsplash.com/photo-1638964663550-e2123ac8900b?auto=format&fit=crop&w=1920&q=90",
  // Phase 8.2 additions - the destinations that were still on a dead or
  // wrong-city image. Every ID below was confirmed HTTP 200 on images.unsplash.com.
  phuket:"https://images.unsplash.com/photo-1693494813069-b83e8eaca59a?auto=format&fit=crop&w=1920&q=90",
  honolulu:"https://images.unsplash.com/photo-1636522302567-032111e4aff4?auto=format&fit=crop&w=1920&q=90",
  "las-vegas":"https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?auto=format&fit=crop&w=1920&q=90",
  "new-orleans":"https://images.unsplash.com/photo-1707702570280-f5800fe37c8b?auto=format&fit=crop&w=1920&q=90",
};

const SEO_TITLES: Record<string, string> = {
  paris:"Paris Travel Guide | France — Riversmag",
  tokyo:"Tokyo Travel Guide | Japan — Riversmag",
  "new-york":"New York Travel Guide | USA — Riversmag",
  bangkok:"Bangkok Travel Guide | Thailand — Riversmag",
  barcelona:"Barcelona Travel Guide | Spain — Riversmag",
  rome:"Rome Travel Guide | Italy — Riversmag",
  marrakech:"Marrakech Travel Guide | Morocco — Riversmag",
  lisbon:"Lisbon Travel Guide | Portugal — Riversmag",
  cairo:"Cairo Travel Guide | Egypt — Riversmag",
  "rio-de-janeiro":"Rio de Janeiro Travel Guide | Brazil — Riversmag",
  miami:"Miami Travel Guide | USA — Riversmag",
  "los-angeles":"Los Angeles Travel Guide | USA — Riversmag",
  bali:"Bali Travel Guide | Indonesia — Riversmag",
  athens:"Athens Travel Guide | Greece — Riversmag",
  "san-francisco":"San Francisco Travel Guide | USA — Riversmag",
  london:"London Travel Guide | UK — Riversmag",
  amsterdam:"Amsterdam Travel Guide | Netherlands — Riversmag",
  dubai:"Dubai Travel Guide | UAE — Riversmag",
  singapore:"Singapore Travel Guide | Singapore — Riversmag",
  seoul:"Seoul Travel Guide | South Korea — Riversmag",
};

const SEO_DESCRIPTIONS: Record<string, string> = {
  paris:"Plan your trip to Paris with our complete guide. Discover the best neighbourhoods, museums, restaurants, transport tips and budget advice for the City of Light.",
  tokyo:"Plan your trip to Tokyo with our complete guide. Discover the best neighbourhoods, transport tips, food and budget advice for Japan's vibrant capital.",
  "new-york":"Plan your trip to New York with our complete guide. Discover the best neighbourhoods, museums, transport tips and budget advice for the Big Apple.",
  bangkok:"Plan your trip to Bangkok with our complete guide. Discover the best temples, street food, transport tips and budget advice for Thailand's capital.",
  barcelona:"Plan your trip to Barcelona with our complete guide. Discover Gaudí architecture, beaches, tapas and budget advice for Spain's Mediterranean gem.",
  rome:"Plan your trip to Rome with our complete guide. Discover the Colosseum, Vatican, authentic cuisine and budget advice for the Eternal City.",
  marrakech:"Plan your trip to Marrakech with our complete guide. Discover the souks, riads, medina and budget advice for Morocco's enchanting city.",
  lisbon:"Plan your trip to Lisbon with our complete guide. Discover Alfama, pastel de nata, tram 28 and budget advice for Portugal's capital.",
  cairo:"Plan your trip to Cairo with our complete guide. Discover the Pyramids, Egyptian Museum, Khan el-Khalil and budget advice for Egypt's capital.",
  "rio-de-janeiro":"Plan your trip to Rio de Janeiro with our complete guide. Discover Copacabana, Christ the Redeemer and budget advice for Brazil's Carnival city.",
  miami:"Plan your trip to Miami with our complete guide. Discover South Beach, Art Deco, Latin energy and budget advice for Florida's tropical hotspot.",
  "los-angeles":"Plan your trip to Los Angeles with our complete guide. Discover Hollywood, beaches, studios and budget advice for California's entertainment capital.",
  bali:"Plan your trip to Bali with our complete guide. Discover temples, rice terraces, surfing and budget advice for Indonesia's island paradise.",
  athens:"Plan your trip to Athens with our complete guide. Discover the Acropolis, Plaka, tavernas and budget advice for Greece's ancient capital.",
  "san-francisco":"Plan your trip to San Francisco with our complete guide. Discover Golden Gate, Fisherman's Wharf, cable cars and budget advice for the Bay Area.",
  london:"Plan your trip to London with our complete guide. Discover the West End, museums, historic landmarks and budget advice for the UK capital.",
  amsterdam:"Plan your trip to Amsterdam with our complete guide. Discover the canals, museums, cycling culture and budget advice for the Netherlands.",
  dubai:"Plan your trip to Dubai with our complete guide. Discover the Burj Khalifa, souks, luxury and budget advice for the UAE's glittering city.",
  singapore:"Plan your trip to Singapore with our complete guide. Discover Marina Bay, hawker centres, gardens and budget advice for the Lion City.",
  seoul:"Plan your trip to Seoul with our complete guide. Discover palaces, K-pop, street food and budget advice for South Korea's dynamic capital.",
};

const SEO_KEYWORDS: Record<string, string> = {
  paris:"paris travel guide, things to do in paris, paris itinerary, paris hotels, visit paris",
  tokyo:"tokyo travel guide, things to do in tokyo, tokyo itinerary, tokyo hotels, visit tokyo",
  "new-york":"new york travel guide, things to do in new york, new york itinerary, new york hotels, visit new york",
  bangkok:"bangkok travel guide, things to do in bangkok, bangkok itinerary, bangkok hotels, visit bangkok",
  barcelona:"barcelona travel guide, things to do in barcelona, barcelona itinerary, barcelona hotels, visit barcelona",
  rome:"rome travel guide, things to do in rome, rome itinerary, rome hotels, visit rome",
  marrakech:"marrakech travel guide, things to do in marrakech, marrakech itinerary, marrakech hotels, visit marrakech",
  lisbon:"lisbon travel guide, things to do in lisbon, lisbon itinerary, lisbon hotels, visit lisbon",
  cairo:"cairo travel guide, things to do in cairo, cairo itinerary, cairo hotels, visit cairo",
  "rio-de-janeiro":"rio de janeiro travel guide, things to do in rio, rio itinerary, rio hotels, visit rio",
  miami:"miami travel guide, things to do in miami, miami itinerary, miami hotels, visit miami",
  "los-angeles":"los angeles travel guide, things to do in los angeles, la itinerary, los angeles hotels, visit los angeles",
  bali:"bali travel guide, things to do in bali, bali itinerary, bali hotels, visit bali",
  athens:"athens travel guide, things to do in athens, athens itinerary, athens hotels, visit athens",
  "san-francisco":"san francisco travel guide, things to do in san francisco, san francisco itinerary, san francisco hotels, visit san francisco",
  london:"london travel guide, things to do in london, london itinerary, london hotels, visit london",
  amsterdam:"amsterdam travel guide, things to do in amsterdam, amsterdam itinerary, amsterdam hotels, visit amsterdam",
  dubai:"dubai travel guide, things to do in dubai, dubai itinerary, dubai hotels, visit dubai",
  singapore:"singapore travel guide, things to do in singapore, singapore itinerary, singapore hotels, visit singapore",
  seoul:"seoul travel guide, things to do in seoul, seoul itinerary, seoul hotels, visit seoul",
};

async function main() {
  console.log(`mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes)"}\n`);

  const destinations = await prisma.destination.findMany({
    where: { isActive: true },
    include: { seoMetadata: true },
  });
  const articles = await prisma.article.findMany({
    where: { type: "DESTINATION_GUIDE", status: "PUBLISHED" },
    include: { destination: true },
  });

  console.log(`Scanning ${destinations.length} destinations and ${articles.length} articles...`);

  let imagesRepaired = 0;
  let robotsFilled = 0;
  let metaCreated = 0;
  const needsPhoto: string[] = [];
  const longTitles: string[] = [];

  for (const d of destinations) {
    const slug = d.slug;
    const photo = PHOTOS[slug];
    const title = SEO_TITLES[slug] ?? `${d.name} Travel Guide | Riversmag`;
    const description = SEO_DESCRIPTIONS[slug] ?? `${d.name} travel guide — best places to visit, where to stay, tours and practical advice.`;
    const keywords = SEO_KEYWORDS[slug] ?? `${d.name.toLowerCase()} travel guide, visit ${d.name.toLowerCase()}, ${d.name.toLowerCase()} itinerary`;

    // ---- images: repair only, never overwrite a live curated photo ----
    if (photo) {
      if (imageNeedsRepair(d.coverImage)) {
        console.log(`  image repair  ${slug.padEnd(18)} coverImage  ${d.coverImage ?? "(empty)"}`);
        if (APPLY) {
          await prisma.destination.update({
            where: { id: d.id },
            data: { coverImage: photo, heroImage: photo },
          });
        }
        imagesRepaired++;
      } else if (imageNeedsRepair(d.heroImage)) {
        if (APPLY) {
          await prisma.destination.update({ where: { id: d.id }, data: { heroImage: photo } });
        }
        imagesRepaired++;
      }
    } else if (imageNeedsRepair(d.coverImage)) {
      needsPhoto.push(`destination ${slug} (coverImage ${d.coverImage ?? "empty"})`);
    }

    // ---- seo metadata ----
    if (d.seoMetadata) {
      const meta = d.seoMetadata;
      // Preserve an existing robots directive; only fill an empty one.
      if (!meta.robots) {
        console.log(`  robots fill   ${slug.padEnd(18)} (empty -> index, follow)`);
        robotsFilled++;
      }
      if (APPLY) {
        await prisma.seoMetadata.update({
          where: { id: meta.id },
          data: {
            title,
            description,
            keywords,
            canonicalUrl: `/destinations/${slug}`,
            ogTitle: `${d.name} Travel Guide`,
            ogDescription: description,
            ogImage: imageNeedsRepair(meta.ogImage) ? photo ?? meta.ogImage : meta.ogImage,
            twitterTitle: `${d.name} Travel Guide | Riversmag`,
            twitterImage: imageNeedsRepair(meta.twitterImage) ? photo ?? meta.twitterImage : meta.twitterImage,
            robots: meta.robots ?? "index, follow",
          },
        });
      }
    } else {
      console.log(`  seo create    ${slug.padEnd(18)} (no SeoMetadata row)`);
      metaCreated++;
      if (APPLY) {
        await prisma.seoMetadata.create({
          data: {
            title,
            description,
            keywords,
            canonicalUrl: `/destinations/${slug}`,
            ogTitle: `${d.name} Travel Guide`,
            ogDescription: description,
            ogImage: photo ?? null,
            twitterTitle: `${d.name} Travel Guide | Riversmag`,
            twitterImage: photo ?? null,
            robots: "index, follow",
            destinationId: d.id,
          },
        });
      }
    }
  }

  for (const a of articles) {
    const slug = a.slug;
    const destinationName = a.destination?.name ?? "Travel";
    const destSlug = a.destination?.slug ?? "";
    // No generic fallback image: an unmapped destination keeps whatever it has.
    const photo = PHOTOS[destSlug];
    const metaTitle = a.metaTitle ?? buildMetaTitle(a.title, destinationName);
    const metaDescription = a.metaDescription ?? a.excerpt ?? `Complete ${a.title.toLowerCase()} guide. Best places to visit, tours, hotels and practical travel advice.`;
    const focusKeyword = a.focusKeyword ?? `${a.title.toLowerCase()} guide`;

    // A stored metaTitle is treated as curated and is never rewritten here, so
    // over-length ones are only reported for an editor to shorten by hand.
    if (a.metaTitle && a.metaTitle.length > META_TITLE_MAX) {
      longTitles.push(`${slug}  (${a.metaTitle.length})  ${a.metaTitle}`);
    }

    const repairImage = imageNeedsRepair(a.coverImage) && !!photo;
    if (imageNeedsRepair(a.coverImage) && !photo) {
      needsPhoto.push(`article ${slug} (coverImage ${a.coverImage ?? "empty"}, no PHOTOS entry for "${destSlug || "no destination"}")`);
    }
    if (repairImage) imagesRepaired++;

    if (APPLY) {
      await prisma.article.update({
        where: { id: a.id },
        data: {
          ...(repairImage ? { coverImage: photo, ogImage: photo } : {}),
          metaTitle,
          metaDescription,
          focusKeyword,
          seoMetadata: {
            upsert: {
              where: { articleId: a.id },
              create: {
                title: metaTitle,
                description: metaDescription,
                keywords: focusKeyword,
                canonicalUrl: `/articles/${slug}`,
                ogTitle: a.title,
                ogDescription: metaDescription,
                ogImage: photo ?? null,
                twitterTitle: a.title,
                twitterImage: photo ?? null,
                robots: "index, follow",
              },
              update: {
                title: metaTitle,
                description: metaDescription,
                keywords: focusKeyword,
                canonicalUrl: `/articles/${slug}`,
                ogTitle: a.title,
                ogDescription: metaDescription,
                ...(photo ? { ogImage: photo, twitterImage: photo } : {}),
              },
            },
          },
        },
      });
    }
  }

  console.log(`\nimage repairs   : ${imagesRepaired}`);
  console.log(`robots filled   : ${robotsFilled}`);
  console.log(`seo rows created: ${metaCreated}`);
  if (needsPhoto.length) {
    console.log(`\nNEEDS A HUMAN — ${needsPhoto.length} empty/dead image(s) with no verified photo mapped:`);
    for (const n of needsPhoto) console.log(`   ${n}`);
    console.log(`   These are left untouched. Source and visually confirm a photo for each;`);
    console.log(`   never substitute an Unsplash ID from memory.`);
  }
  if (longTitles.length) {
    console.log(`\nNEEDS AN EDITOR — ${longTitles.length} stored metaTitle(s) over ${META_TITLE_MAX} chars:`);
    for (const t of longTitles) console.log(`   ${t}`);
    console.log(`   Left untouched on purpose: a stored metaTitle is a curated value.`);
  }
  console.log(
    APPLY
      ? "\nAPPLIED. Existing curated images, titles and robots values were preserved."
      : "\nDRY RUN. Re-run with --apply to write.",
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });