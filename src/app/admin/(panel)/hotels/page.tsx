import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveHotelAction } from "@/lib/actions/entities";
import { EntityManager } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  await requireUser();
  const [hotels, destinations] = await Promise.all([
    prisma.hotel.findMany({ include: { destination: true }, orderBy: { name: "asc" }, take: 300 }),
    prisma.destination.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 300 }),
  ]);

  return (
    <EntityManager
      entity="hotels"
      title="Hotels"
      description="Build your hotel database for comparison cards and destination pages."
      rows={hotels.map((h) => ({ id: h.id, name: h.name, slug: h.slug, sub: h.destination?.name ?? h.city }))}
      destinations={destinations}
      action={saveHotelAction}
    />
  );
}