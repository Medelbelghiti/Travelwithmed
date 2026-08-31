"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  requireRole,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.isActive) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  redirect("/admin");
}

export async function logoutAction() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("roamora_session")?.value;
  if (token) await destroySession(token);
  cookieStore.delete("roamora_session");
  redirect("/admin/login");
}

export async function requireAdminRedirect() {
  try {
    await requireRole("ADMIN");
    return true;
  } catch {
    redirect("/admin/login");
  }
}

export async function setPasswordForUser(userId: string, newPassword: string) {
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}