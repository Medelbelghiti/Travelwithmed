import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveAuthorAction } from "@/lib/actions/entities";
import { EntityManager } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  await requireUser();
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } });

  return (
    <EntityManager
      entity="authors"
      title="Authors"
      description="Your editorial team — builds trust and E-E-A-T signals."
      rows={authors.map((a) => ({ id: a.id, name: a.name, slug: a.slug, sub: a.role }))}
      action={saveAuthorAction}
    />
  );
}