import type { NextRequest } from "next/server";

/**
 * Minimal in-memory sliding-window rate limiter.
 * NB: state lives per process instance — adequate for a single-replica
 * deployment; for multi-replica/serverless, move to a shared store (e.g. Redis).
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}