import type { NextRequest } from "next/server";

/**
 * Minimal in-memory sliding-window rate limiter.
 * NB: state lives per process instance — adequate for a single-replica
 * deployment; for multi-replica/serverless, move to a shared store (e.g. Redis).
 * Expired buckets are pruned to prevent unbounded growth.
 */
const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

function pruneStaleBuckets(now: number) {
  for (const [key, timestamps] of buckets) {
    // Keep only timestamps that could still be inside any active window (max 15min)
    const recent = timestamps.filter((t) => now - t < 15 * 60 * 1000);
    if (recent.length === 0) buckets.delete(key);
    else if (recent.length !== timestamps.length) buckets.set(key, recent);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) pruneStaleBuckets(now);
  const windowStart = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= limit) {
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
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