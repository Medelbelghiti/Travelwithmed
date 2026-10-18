import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const url = process.env.DATABASE_URL ?? "";
const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 12000 });
try {
  const c = await pool.connect();
  const r = await c.query("SELECT count(*)::int AS n FROM \"Article\"");
  const d = await c.query("SELECT count(*)::int AS n FROM \"Destination\"");
  const h = await c.query("SELECT count(*)::int AS n FROM \"Hotel\"");
  console.log("OK articles=" + r.rows[0].n + " destinations=" + d.rows[0].n + " hotels=" + h.rows[0].n);
  c.release();
} catch (e) {
  console.log("KO " + (e as Error).message);
} finally { await pool.end(); }
