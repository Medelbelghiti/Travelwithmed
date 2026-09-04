import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui/card";

interface RelatedItinerariesProps {
  destinationId?: string | null;
  limit?: number;
  excludeId?: string;
}

export async function RelatedItineraries({
  destinationId,
  limit = 3,
  excludeId,
}: RelatedItinerariesProps) {
  if (!destinationId) return null;

  const itineraries = await prisma.itinerary.findMany({
    where: {
      isActive: true,
      destinationId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  if (itineraries.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading eyebrow="Day by day" title="Suggested itineraries" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {itineraries.map((it) => (
          <Link
            key={it.id}
            href={`/itineraries/${it.slug}`}
            className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                <CalendarDays className="h-4 w-4" aria-hidden />
                {it.days} days
              </span>
              <h3 className="mt-2 font-serif text-xl font-semibold text-ink group-hover:text-brand">
                {it.title}
              </h3>
              {it.summary && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{it.summary}</p>}
            </div>
            <p className="mt-4 text-sm font-semibold text-brand">
              {it.budgetLevel ?? "View itinerary"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
