import pg from "pg";
const url = process.env.DATABASE_URL_TEST;
const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 15000 });
try {
  const c = await pool.connect();
  const a = await c.query('SELECT count(*)::int AS n FROM "Article"');
  console.log("DIRECT OK articles=" + a.rows[0].n);
  c.release();
} catch (e) { console.log("DIRECT KO " + e.message); }
finally { await pool.end(); }
