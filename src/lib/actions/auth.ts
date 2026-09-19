"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  createSession,
  destroySession,
  hashPassword,
  requireRole,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

const LOGIN_ATTEMPTS_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 30;
const PASSWORD_MIN_LENGTH = 12;

async function getActionClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const ip = forwarded.split(",")[0]?.trim();
      if (ip) return ip;
    }
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // not in a request scope
  }
  return "unknown";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const ip = await getActionClientIp();

  // Enforce the limit before touching the database so both user enumeration
  // and password guessing are throttled; every attempt consumes one slot.
  if (
    !rateLimit(`login:${email}|${ip}`, LOGIN_ATTEMPTS_LIMIT, LOGIN_WINDOW_MS) ||
    !rateLimit(`login-ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS)
  ) {
    return { error: "Too many attempts. Please try again later." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !user.isActive) {
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
  const token =
    cookieStore.get("riversmag_session")?.value ?? cookieStore.get("roamora_session")?.value;
  if (token) await destroySession(token);
  cookieStore.delete("riversmag_session");
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
  try {
    await requireRole("ADMIN");
  } catch {
    return { error: "You do not have permission to change passwords." };
  }
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` };
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}