import pg from "pg";
const url = process.env.DATABASE_URL ?? "";
const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 15000 });
try {
  const c = await pool.connect();
  const a = await c.query('SELECT count(*)::int AS n FROM "Article"');
  const d = await c.query('SELECT count(*)::int AS n FROM "Destination"');
  const h = await c.query('SELECT count(*)::int AS n FROM "Hotel"');
  const ac = await c.query('SELECT count(*)::int AS n FROM "Activity"');
  console.log("OK articles=" + a.rows[0].n + " dest=" + d.rows[0].n + " hotels=" + h.rows[0].n + " activities=" + ac.rows[0].n);
  c.release();
} catch (e) { console.log("KO " + e.message); }
finally { await pool.end(); }
