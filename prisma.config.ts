import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Neon runs PgBouncer in transaction mode, which returns the backend connection
 * to the pool after every transaction. `prisma migrate` needs a session-level
 * advisory lock (pg_advisory_lock) to serialise concurrent runs, and a lock held
 * on a connection that is already back in the pool is invisible, so the command
 * always times out:
 *
 *   P1002 - The database server was reached but timed out.
 *   Timed out trying to acquire a postgres advisory lock.
 *
 * Note the "was reached": the credentials are fine, the pooler is the problem.
 * Stripping the -pooler suffix gives the direct endpoint, which supports
 * session-level locks.
 *
 * This only affects the CLI. The runtime client builds its own connection from
 * DATABASE_URL (see src/lib/prisma.ts) and keeps using the pooled endpoint,
 * which is what serverless needs to avoid exhausting connections.
 */
function directDatabaseUrl(url: string): string {
  return url.replace("-pooler.", ".");
}

const databaseUrl = process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node --env-file=.env --import tsx prisma/seed.ts",
  },
  datasource: {
    url: directDatabaseUrl(databaseUrl),
  },
});