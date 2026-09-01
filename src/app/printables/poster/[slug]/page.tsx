import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { PrintButton } from "@/components/print-button";

export const metadata = buildMetadata({
  title: "Free Travel Poster",
  description: "A print-ready travel poster from Riversmag. Free to download and print.",
  canonicalPath: "/free-guides",
  noindex: true,
});

const PLACES: Record<string, { name: string; subtitle: string }> = {
  paris: { name: "Paris", subtitle: "City of light & long lunches" },
  rome: { name: "Rome", subtitle: "Where every street is a museum" },
  bali: { name: "Bali", subtitle: "Island of temples & tide pools" },
  tokyo: { name: "Tokyo", subtitle: "Neon nights, quiet shrines" },
  kyoto: { name: "Kyoto", subtitle: "Bamboo, zen & perfect mornings" },
  osaka: { name: "Osaka", subtitle: "The kitchen of Japan" },
};

export default async function PosterPrintablePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = PLACES[slug.toLowerCase()] ?? PLACES[slug.toLowerCase().split("-")[0]];
  if (!place && !(["paris", "rome", "bali", "tokyo", "kyoto", "osaka"].includes(slug.toLowerCase()))) {
    notFound();
  }

  const name = place?.name ?? slug;

  return (
    <main className="section-pad">
      <div className="flex min-h-[80vh] flex-col items-center">
        <div className="no-print mb-6 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Riversmag free poster — {name}
          </p>
          <PrintButton />
        </div>

        <article className="flex aspect-[3/4] w-full max-w-md flex-col justify-between rounded-none border border-line bg-white p-10 text-center shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-dark">Riversmag travel series</p>
            <h1 className="mt-24 font-serif text-6xl font-semibold leading-none text-ink">{name}</h1>
            <p className="mt-4 text-lg text-ink-soft">{place?.subtitle ?? "A Riversmag favourite"}</p>
          </div>
          <div className="mt-16">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">Plan smarter · Travel better</p>
            <p className="mt-3 text-[10px] text-ink-muted/70">riversmag.com</p>
          </div>
        </article>

        <p className="no-print mt-6 max-w-md text-center text-sm text-ink-soft">
          Print this poster (or save it as a PDF) and hang a little {name} on your wall — free for subscribers.
        </p>
      </div>
    </main>
  );
}