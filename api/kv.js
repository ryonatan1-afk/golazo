import { neon } from '@neondatabase/serverless';

async function getDb() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  return sql;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const sql = await getDb();

    if (req.method === 'GET') {
      const { key, prefix } = req.query;

      if (prefix) {
        const rows = await sql`SELECT key FROM kv WHERE key LIKE ${prefix + '%'}`;
        return res.json({ keys: rows.map(r => r.key) });
      }

      if (key) {
        const rows = await sql`SELECT value FROM kv WHERE key = ${key}`;
        if (!rows.length) return res.status(404).json(null);
        return res.json({ value: rows[0].value });
      }

      return res.status(400).json({ error: 'key or prefix required' });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'key required' });
      await sql`
        INSERT INTO kv (key, value) VALUES (${key}, ${value})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
