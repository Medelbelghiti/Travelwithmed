import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { EntityCreateForm } from "./entity-create-form";
import type { Destination } from "@prisma/client";

export interface EntityRow {
  id: string;
  name: string;
  slug: string;
  sub?: string | null;
}

export interface EntityManagerProps {
  entity: "categories" | "authors" | "hotels" | "activities" | "products";
  title: string;
  description: string;
  rows: EntityRow[];
  destinations?: Destination[];
  newHref?: string;
  action: (prev: { error?: string } | void, formData: FormData) => Promise<{ error?: string } | void>;
}

const FIELDS: Record<EntityManagerProps["entity"], { name: string; label: string; type?: string }[]> = {
  categories: [
    { name: "name", label: "Name" },
    { name: "slug", label: "Slug" },
    { name: "type", label: "Type" },
  ],
  authors: [
    { name: "name", label: "Name" },
    { name: "slug", label: "Slug" },
    { name: "role", label: "Role" },
  ],
  hotels: [
    { name: "name", label: "Name" },
    { name: "slug", label: "Slug" },
    { name: "city", label: "City" },
  ],
  activities: [
    { name: "name", label: "Name" },
    { name: "slug", label: "Slug" },
    { name: "category", label: "Category" },
  ],
  products: [
    { name: "name", label: "Name" },
    { name: "brand", label: "Brand" },
    { name: "category", label: "Category" },
  ],
};

export async function EntityManager({
  entity,
  title,
  description,
  rows,
  destinations = [],
  newHref,
  action,
}: EntityManagerProps) {
  const fields = FIELDS[entity];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        {newHref && (
          <Link href={newHref} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* List */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">Nothing here yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-sand">
                  <th className="px-4 py-3 font-semibold text-ink">Name</th>
                  <th className="px-4 py-3 font-semibold text-ink">Slug</th>
                  <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">{fields[2]?.label ?? "Detail"}</th>
                  <th className="px-4 py-3 text-right font-semibold text-ink">Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{row.slug}</td>
                    <td className="hidden px-4 py-3 text-ink-muted md:table-cell">{row.sub ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/${entity}/${row.id}`} className="inline-flex rounded-lg p-2 text-ink-muted hover:bg-sand hover:text-ink" aria-label={`Edit ${row.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Inline create form */}
        <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:self-start lg:sticky lg:top-8">
          <h2 className="font-serif text-lg font-semibold text-ink">Add {entity === "categories" ? "a category" : `a ${entity.slice(0, -1)}`}</h2>
          <EntityCreateForm
            entity={entity}
            action={action}
            fields={fields}
            destinations={
              entity === "categories" || entity === "authors"
                ? []
                : destinations.map((d) => ({ id: d.id, name: d.name }))
            }
          />
        </aside>
      </div>
    </div>
  );
}