import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { PrintButton } from "@/components/print-button";
import { PrintableItinerary } from "@/components/printable-itinerary";

export const dynamic = "force-dynamic";

const ITINERARY_SLUGS = [
  "paris-in-4-days",
  "kyoto-osaka-5-days",
  "rome-in-4-days",
  "bali-in-7-days",
  "tokyo-in-4-days",
];

const CHECKLIST_SLUG = "free-packing-checklist";

const CHECKLIST_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Documents & wallet",
    items: [
      "Passport (valid 6+ months; photocopy + phone photo)",
      "Visa / eVOA approval (printed or in a travel folder)",
      "Travel insurance policy number & 24/7 assistance line",
      "Boarding passes & transport reservations",
      "Hotel confirmations (booked via verified links)",
      "Driving licence / International Driving Permit",
      "Bank & emergency contact numbers",
      "Small local currency + a back-up card",
    ],
  },
  {
    title: "Carry-on essentials",
    items: [
      "Carry-on bag within airline size rules",
      "Travel wallet / passport holder",
      "Phone, charger, cable & charging bank",
      "Travel adapter (universal type)",
      "eSIM or activated travel data plan",
      "Prescription medications (in original packaging)",
      "Basic first-aid kit (plasters, painkillers, antiseptic)",
      "Reusable water bottle (empty through security)",
      "Eye mask, ear plugs & neck pillow",
      "Spare set of undies & socks",
      "Snacks for the flight",
    ],
  },
  {
    title: "Clothing, by climate",
    items: [
      "Base layers (1 per 2 days you travel)",
      "Tops & t-shirts (light, quick-dry)",
      "Pants / shorts that mix and match",
      "A warm mid-layer or light jacket",
      "Waterproof shell if rain is possible",
      "Comfortable walking shoes (broken in)",
      "Sandals / city shoes for evenings",
      "Socks & underwear for each day + one spare",
      "Swimwear if your trip includes water",
      "Light scarf / sarong (temple & layering duty)",
      "Sleepwear & a light hoodie for planes",
    ],
  },
  {
    title: "Toiletries & health",
    items: [
      "Travel toothbrush, paste, floss",
      "Deodorant, shampoo bar or travel bottles",
      "Sunscreen (high factor, travel size)",
      "Insect repellent for warm climates",
      "Personal medicines, inhaler, or epi-pen",
      "Contact lens kit or spare glasses",
      "Small razor / trimmer (checked hold)",
      "Lip balm & moisturiser",
      "Hand sanitiser & wet wipes",
      "Seasickness tablets if boats are on the plan",
    ],
  },
  {
    title: "Tech & accessories",
    items: [
      "Universal travel adapter",
      "Power bank (under airline limit)",
      "Headphones (over-ear for flights)",
      "Phone & cards in a slim travel wallet",
      "Camera or GoPro if photography is the point",
      "Book or Kindle",
      "Reusable shopping tote",
      "Luggage lock (TSA-friendly)",
      "Ziplock bags for liquids & muddy shoes",
    ],
  },
  {
    title: "Extras that save the trip",
    items: [
      "Printed hotel address + local emergency numbers",
      "Copies of key documents on paper & phone",
      "A second bank card kept separately",
      "Cash in small denominations",
      "Travel insurance card (save in wallet & phone)",
      "Wet wipes & hand sanitiser for transit",
      "Daypack / tote for daily carry",
    ],
  },
];

const CHECKLIST_META: Record<string, { title: string; description: string }> = {
  [CHECKLIST_SLUG]: {
    title: "The Ultimate Carry-On Packing Checklist",
    description:
      "Print the complete Riversmag packing checklist: documents, carry-on essentials, clothing, toiletries, tech and the extras that save trips.",
  },
  "paris-in-4-days": {
    title: "Paris in 4 Days — Free Printable Itinerary",
    description:
      "Download and print the free Riversmag Paris itinerary: 4 days, day-by-day plans, metro-friendly routing, and a budget quick-reference.",
  },
  "rome-in-4-days": {
    title: "Rome in 4 Days — Free Printable Itinerary",
    description:
      "Download and print the free Riversmag Rome itinerary: 4 days covering the ancient city, the Vatican and baroque Rome.",
  },
  "bali-in-7-days": {
    title: "7 Days in Bali — Free Printable Itinerary",
    description:
      "Download and print the free Riversmag Bali itinerary: beaches, Ubud, and the Uluwatu cliffs over seven days.",
  },
  "tokyo-in-4-days": {
    title: "Tokyo in 4 Days — Free Printable Itinerary",
    description:
      "Download and print the free Riversmag Tokyo itinerary: Asakusa, Shibuya, Shinjuku and one bold finale over four days.",
  },
  "kyoto-osaka-5-days": {
    title: "Kyoto & Osaka in 5 Days — Free Printable Itinerary",
    description:
      "Download and print the free Riversmag Kyoto & Osaka itinerary: sunrise shrines, bamboo groves and street-food nights.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = CHECKLIST_META[slug];
  return buildMetadata({
    title: meta ? meta.title : "Free Travel Printables & Guides",
    description: meta
      ? meta.description
      : "Free printable Riversmag itineraries and checklists — print-ready, built to travel.",
    canonicalPath: "/free-guides",
    noindex: true,
  });
}

export default async function PrintablePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug !== CHECKLIST_SLUG && !ITINERARY_SLUGS.includes(slug)) notFound();

  if (slug === CHECKLIST_SLUG) {
    return (
      <main className="container-x section-pad">
        <div className="mx-auto max-w-3xl">
          <div className="no-print mb-8 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Riversmag free printable
            </p>
            <PrintButton />
          </div>

          <article className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-12">
            <header className="border-b border-line pb-6">
              <h1 className="text-4xl font-semibold">The Ultimate Carry-On Packing Checklist</h1>
              <p className="mt-3 text-lg text-ink-soft">
                Check it once before you leave, tick it as you pack, and trust it at the airport. Print a copy,
                keep one in your phone bag.
              </p>
              <p className="mt-4 text-sm text-ink-muted">
                Tip: pack from the list in order — documents first, carry-on next — so the last box you tick is
                the door closing behind you.
              </p>
            </header>

            <div className="mt-8 space-y-8">
              {CHECKLIST_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className="flex items-center gap-3 text-xl font-semibold">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
                      {section.items.length}
                    </span>
                    {section.title}
                  </h2>
                  <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                        <span className="check-box mt-0.5 block h-4 w-4 shrink-0 rounded border-2 border-ink-muted" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <footer className="mt-10 border-t border-line pt-6 text-xs text-ink-muted">
              <p>
                © {new Date().getFullYear()} Riversmag. Free to print and share for personal use. For fully
                supported luggage debates, our carry-on guide has the sizing rules budget airlines enforce.
              </p>
            </footer>
          </article>

          <p className="no-print mt-6 text-center text-sm text-ink-muted">
            Found this useful?{" "}
            <a href="/free-guides" className="font-semibold text-brand hover:text-brand-dark">
              Discover more free printables
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  const itinerary = await prisma.itinerary.findUnique({
    where: { slug },
    include: {
      destination: true,
      author: true,
      daysList: { orderBy: { dayNumber: "asc" } },
    },
  });

  if (!itinerary) notFound();

  return (
    <main className="container-x section-pad">
      <div className="mx-auto max-w-3xl">
        <PrintableItinerary itinerary={itinerary} />

        <p className="no-print mt-6 text-center text-sm text-ink-muted">
          Found this useful?{" "}
          <a href="/free-guides" className="font-semibold text-brand hover:text-brand-dark">
            Discover more free printables
          </a>
          .
        </p>
      </div>
    </main>
  );
}