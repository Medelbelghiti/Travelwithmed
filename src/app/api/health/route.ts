import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 5_000;

export async function GET() {
  const startedAt = Date.now();

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("health check timed out")), CHECK_TIMEOUT_MS),
      ),
    ]);

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
