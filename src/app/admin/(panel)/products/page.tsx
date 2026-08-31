import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveProductAction } from "@/lib/actions/entities";
import { EntityManager } from "@/components/admin/entity-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireUser();
  const products = await prisma.product.findMany({ orderBy: { category: "asc" }, take: 300 });

  return (
    <EntityManager
      entity="products"
      title="Travel products"
      description="Gear and essentials for your travel gear guides."
      rows={products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, sub: p.category ?? p.brand }))}
      action={saveProductAction}
    />
  );
}