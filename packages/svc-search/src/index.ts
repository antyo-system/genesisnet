import express from 'express';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';
import { DATA } from './data.js';

const app = express();
const log = logger.child({ service: 'search' });
const PORT = env.SEARCH_PORT;

app.use(requestId(log));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'search' });
});

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
  res.json({ query: q, count: results.length, results });
});

app.get('/', (req, res) => {
  res.type('text').send('svc-search is running. Try /health or /search?q=agent');
});

app.listen(PORT, () => {
  log.info(`listening on http://localhost:${PORT}`);
});
