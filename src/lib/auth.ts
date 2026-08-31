import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "roamora_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      userAgent: null,
      ip: null,
    },
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getSessionUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await destroySession(token);
    return null;
  }
  if (!session.user.isActive) return null;
  return session.user;
});

export const requireUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
});

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export function canManageContent(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR" || role === "AUTHOR";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const allowed = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];
  return allowed.includes(email.toLowerCase());
}