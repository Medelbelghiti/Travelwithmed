import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 5_000;

/**
 * Race the query against a timeout, and always clear the timer.
 *
 * A bare setTimeout left pending keeps the Node event loop alive: the query
 * usually wins in ~50ms, but the 5s timer would still be queued afterwards,
 * which matters for short-lived processes and for hosts that watch for a
 * clean exit during build.
 */
async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("health check timed out")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  const startedAt = Date.now();

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, CHECK_TIMEOUT_MS);

    return NextResponse.json(
      { status: "ok", database: "up", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error("[health] database unreachable:", message);

    return NextResponse.json(
      {
        status: "degraded",
        database: "down",
        latencyMs: Date.now() - startedAt,
        error: message,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
