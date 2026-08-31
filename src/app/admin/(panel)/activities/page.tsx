import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveActivityAction } from "@/lib/actions/entities";
import { EntityManager } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  await requireUser();
  const [activities, destinations] = await Promise.all([
    prisma.activity.findMany({ include: { destination: true }, orderBy: { name: "asc" }, take: 300 }),
    prisma.destination.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 300 }),
  ]);

  return (
    <EntityManager
      entity="activities"
      title="Activities"
      description="Tours and experiences to feature on destination pages."
      rows={activities.map((a) => ({ id: a.id, name: a.name, slug: a.slug, sub: a.category ?? a.destination?.name }))}
      destinations={destinations}
      action={saveActivityAction}
    />
  );
}