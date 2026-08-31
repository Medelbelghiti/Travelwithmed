import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveCategoryAction } from "@/lib/actions/entities";
import { EntityManager } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireUser();
  const categories = await prisma.category.findMany({ include: { parent: true }, orderBy: { type: "asc" }, take: 300 });

  return (
    <EntityManager
      entity="categories"
      title="Categories"
      description="Organize content by topic and travel style."
      rows={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, sub: `${c.type}${c.parent ? ` · in ${c.parent.name}` : ""}` }))}
      action={saveCategoryAction}
    />
  );
}