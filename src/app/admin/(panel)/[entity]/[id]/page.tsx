import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { EntityEditForm, type EntityEditField } from "@/components/admin/entity-edit-form";
import {
  saveCategoryAction,
  saveAuthorAction,
  saveHotelAction,
  saveActivityAction,
  saveProductAction,
} from "@/lib/actions/entities";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type EntityTypes = {
  categories: "category";
  authors: "author";
  hotels: "hotel";
  activities: "activity";
  products: "product";
};

const ENTITY_MODELS = {
  categories: "category",
  authors: "author",
  hotels: "hotel",
  activities: "activity",
  products: "product",
} as const;

const ACTIONS: Record<keyof EntityTypes, typeof saveCategoryAction> = {
  categories: saveCategoryAction,
  authors: saveAuthorAction,
  hotels: saveHotelAction,
  activities: saveActivityAction,
  products: saveProductAction,
};

const FIELD_GROUPS: Record<keyof EntityTypes, EntityEditField[][]> = {
  categories: [
    [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "type", label: "Type" },
    ],
    [
      { name: "parentId", label: "Parent ID" },
      { name: "sortOrder", label: "Sort order", type: "number" },
    ],
    [{ name: "description", label: "Description", textarea: true }],
  ],
  authors: [
    [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "role", label: "Role / title" },
    ],
    [
      { name: "expertise", label: "Expertise" },
      { name: "location", label: "Location" },
      { name: "avatar", label: "Avatar URL" },
    ],
    [{ name: "bio", label: "Bio", textarea: true }],
  ],
  hotels: [
    [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "starRating", label: "Star rating (0–5)", type: "number" },
      { name: "guestRating", label: "Guest rating (e.g. 4.6)", type: "number", step: "0.1" },
    ],
    [
      { name: "city", label: "City" },
      { name: "country", label: "Country" },
      { name: "address", label: "Address" },
      { name: "priceRange", label: "Price range" },
    ],
    [
      { name: "bestFor", label: "Best for" },
      { name: "image", label: "Image URL" },
      { name: "bookingUrl", label: "Booking URL" },
      { name: "destinationId", label: "Destination ID" },
    ],
    [{ name: "description", label: "Description", textarea: true }],
  ],
  activities: [
    [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "category", label: "Category" },
      { name: "duration", label: "Duration" },
    ],
    [
      { name: "priceRange", label: "Price range" },
      { name: "rating", label: "Rating", type: "number", step: "0.1" },
      { name: "bestFor", label: "Best for" },
      { name: "image", label: "Image URL" },
    ],
    [
      { name: "bookingUrl", label: "Booking URL" },
      { name: "destinationId", label: "Destination ID" },
    ],
    [{ name: "description", label: "Description", textarea: true }],
  ],
  products: [
    [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "brand", label: "Brand" },
      { name: "category", label: "Category" },
    ],
    [
      { name: "priceRange", label: "Price range" },
      { name: "rating", label: "Rating", type: "number", step: "0.1" },
      { name: "bestFor", label: "Best for" },
      { name: "image", label: "Image URL" },
    ],
    [
      { name: "buyUrl", label: "Buy URL" },
    ],
    [{ name: "description", label: "Description", textarea: true }],
  ],
};

export default async function AdminEntityEditPage({
  params,
}: {
  params: Promise<{ entity: keyof EntityTypes; id: string }>;
}) {
  await requireUser();
  const { entity, id } = await params;
  if (!(entity in ENTITY_MODELS)) notFound();

  // Pranala manual tanpa ORM generic — resolve per entity type.
  const row = await findEntity(entity, id);
  if (!row) notFound();

  const action = ACTIONS[entity];
  const groups = FIELD_GROUPS[entity];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/${entity}`} className="rounded-xl p-2 text-ink-muted hover:bg-sand" aria-label="Back">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-ink">Edit {row.name}</h1>
      </div>

      <EntityEditForm entity={entity} action={action} id={id} groups={groups} row={row as Record<string, unknown>} />
    </div>
  );
}

type EntityModel = Prisma.CategoryGetPayload<Record<string, never>> &
  Prisma.AuthorGetPayload<Record<string, never>> &
  Prisma.HotelGetPayload<Record<string, never>> &
  Prisma.ActivityGetPayload<Record<string, never>> &
  Prisma.ProductGetPayload<Record<string, never>>;

async function findEntity(entity: keyof EntityTypes, id: string): Promise<EntityModel | null> {
  switch (entity) {
    case "categories":
      return (await prisma.category.findUnique({ where: { id } })) as EntityModel | null;
    case "authors":
      return (await prisma.author.findUnique({ where: { id } })) as EntityModel | null;
    case "hotels":
      return (await prisma.hotel.findUnique({ where: { id } })) as EntityModel | null;
    case "activities":
      return (await prisma.activity.findUnique({ where: { id } })) as EntityModel | null;
    case "products":
      return (await prisma.product.findUnique({ where: { id } })) as EntityModel | null;
  }
}