import express from 'express';
import { env } from './env.js';
import { DATA } from './data.js';

const app = express();
const PORT = env.SEARCH_PORT;

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'search' });
});

// GET /search?q=...
app.get('/search', (req, res) => {
  const q = String(req.query.q ?? '')
    .trim()
    .toLowerCase();

  if (!q) {
    return res.json({ query: q, count: 0, results: [] });
  }

  const results = DATA.filter((item) => {
    const hay = (item.title + ' ' + item.content + ' ' + item.tags.join(' ')).toLowerCase();
    return hay.includes(q);
  });

  res.json({
    query: q,
    count: results.length,
    results,
  });
});

// Optional: root
app.get('/', (_req, res) => {
  res.type('text').send('svc-search is running. Try /health or /search?q=agent');
});

app.listen(PORT, () => {
  console.log(`[svc-search] listening on http://localhost:${PORT}`);
});
