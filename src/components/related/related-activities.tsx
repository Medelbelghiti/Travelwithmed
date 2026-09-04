import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui/card";
import { ActivityCard } from "@/components/affiliate/activity-card";

interface RelatedActivitiesProps {
  destinationId?: string | null;
  destinationName?: string | null;
  excludeId?: string;
  limit?: number;
}

export async function RelatedActivities({
  destinationId,
  destinationName,
  excludeId,
  limit = 6,
}: RelatedActivitiesProps) {
  if (!destinationId) return null;

  const activities = await prisma.activity.findMany({
    where: {
      isActive: true,
      destinationId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { affiliateLinks: { where: { active: true }, take: 1 } },
    orderBy: [{ rating: "desc" }],
    take: limit,
  });

  if (activities.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading
        eyebrow="Things to do"
        title={`Best experiences in ${destinationName ?? "the area"}`}
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            linked
            activity={{
              id: activity.id,
              slug: activity.slug,
              name: activity.name,
              image: activity.image,
              description: activity.description,
              duration: activity.duration,
              priceRange: activity.priceRange,
              rating: activity.rating,
              reviewCount: activity.reviewCount,
              category: activity.category,
              destinationName: destinationName ?? undefined,
              location: activity.location,
              affiliateLinkId: activity.affiliateLinks[0]?.id ?? null,
            }}
          />
        ))}
      </div>
    </section>
  );
}
