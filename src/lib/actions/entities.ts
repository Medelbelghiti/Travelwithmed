"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function s(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/* ---------- Categories ---------- */

export async function saveCategoryAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const name = s(formData.get("name"));
    if (!name) return { error: "Name is required." };
    const slug = s(formData.get("slug")) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const type = s(formData.get("type")) || "content";
    const parentId = s(formData.get("parentId")) || null;

    const data = { name, slug, type, parentId, description: s(formData.get("description")) || null, sortOrder: Number(s(formData.get("sortOrder")) || 0), isActive: true };

    if (id) {
      await prisma.category.update({ where: { id }, data });
    } else {
      await prisma.category.create({ data });
    }
    redirect("/admin/categories");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save category." };
  }
}

/* ---------- Authors ---------- */

export async function saveAuthorAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const name = s(formData.get("name"));
    if (!name) return { error: "Name is required." };
    const slug = s(formData.get("slug")) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const data = {
      name,
      slug,
      bio: s(formData.get("bio")) || null,
      avatar: s(formData.get("avatar")) || null,
      role: s(formData.get("role")) || "Travel writer",
      expertise: s(formData.get("expertise")) || null,
      location: s(formData.get("location")) || null,
      isActive: true,
    };
    if (id) {
      await prisma.author.update({ where: { id }, data });
    } else {
      await prisma.author.create({ data });
    }
    redirect("/admin/authors");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save author." };
  }
}

/* ---------- Hotels ---------- */

export async function saveHotelAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const name = s(formData.get("name"));
    if (!name) return { error: "Name is required." };
    const slug = s(formData.get("slug")) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const data = {
      name,
      slug,
      description: s(formData.get("description")) || null,
      address: s(formData.get("address")) || null,
      city: s(formData.get("city")) || null,
      country: s(formData.get("country")) || null,
      starRating: Number(s(formData.get("starRating")) || 0) || null,
      guestRating: Number(s(formData.get("guestRating"))) || null,
      priceRange: s(formData.get("priceRange")) || null,
      image: s(formData.get("image")) || null,
      bestFor: s(formData.get("bestFor")) || null,
      destinationId: s(formData.get("destinationId")) || null,
      bookingUrl: s(formData.get("bookingUrl")) || null,
      isActive: true,
    };
    if (id) {
      await prisma.hotel.update({ where: { id }, data });
    } else {
      await prisma.hotel.create({ data });
    }
    redirect("/admin/hotels");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save hotel." };
  }
}

/* ---------- Activities ---------- */

export async function saveActivityAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const name = s(formData.get("name"));
    if (!name) return { error: "Name is required." };
    const slug = s(formData.get("slug")) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const data = {
      name,
      slug,
      description: s(formData.get("description")) || null,
      duration: s(formData.get("duration")) || null,
      priceRange: s(formData.get("priceRange")) || null,
      rating: Number(s(formData.get("rating"))) || null,
      category: s(formData.get("category")) || null,
      bestFor: s(formData.get("bestFor")) || null,
      image: s(formData.get("image")) || null,
      bookingUrl: s(formData.get("bookingUrl")) || null,
      destinationId: s(formData.get("destinationId")) || null,
      isActive: true,
    };
    if (id) {
      await prisma.activity.update({ where: { id }, data });
    } else {
      await prisma.activity.create({ data });
    }
    redirect("/admin/activities");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save activity." };
  }
}

/* ---------- Products ---------- */

export async function saveProductAction(prev: { error?: string } | void, formData: FormData) {
  try {
    await requireRole("ADMIN", "EDITOR");
    const id = s(formData.get("id"));
    const name = s(formData.get("name"));
    if (!name) return { error: "Name is required." };
    const slug = s(formData.get("slug")) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const data = {
      name,
      slug,
      description: s(formData.get("description")) || null,
      brand: s(formData.get("brand")) || null,
      category: s(formData.get("category")) || null,
      priceRange: s(formData.get("priceRange")) || null,
      rating: Number(s(formData.get("rating"))) || null,
      bestFor: s(formData.get("bestFor")) || null,
      image: s(formData.get("image")) || null,
      buyUrl: s(formData.get("buyUrl")) || null,
      isActive: true,
    };
    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      await prisma.product.create({ data });
    }
    redirect("/admin/products");
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest || (error as Error)?.message?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Failed to save product." };
  }
}