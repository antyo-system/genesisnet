import express from 'express';
import knex from 'knex';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';
import {
  providers,
  dataPackages,
  users,
  nextProviderId,
  nextDataPackageId,
  nextUserId,
} from './data.js';

const app = express();
const log = logger.child({ service: 'search' });
const PORT = env.SEARCH_PORT;

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

app.use(requestId(log));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'search' });
});

function searchItems(q: string) {
  const haystack = [
    ...providers.map((p) => ({ type: 'provider', ...p })),
    ...dataPackages.map((d) => ({ type: 'data_package', ...d })),
    ...users.map((u) => ({ type: 'user', ...u })),
  ];
  return haystack.filter((item) => Object.values(item).join(' ').toLowerCase().includes(q));
}

app.get('/search', (req, res) => {
  const q = String(req.query.q ?? '')
    .trim()
    .toLowerCase();
  if (!q) {
    return res.json({ query: q, count: 0, results: [] });
  }
  const results = searchItems(q);
  res.json({ query: q, count: results.length, results });
});

app.post('/search', async (req, res) => {
  try {
    const { q, tags, max_price, provider_id } = req.body as {
      q?: string;
      tags?: string[];
      max_price?: number;
      provider_id?: string;
    };

    let query = db('data_packages').select('*');

    if (q && q.trim()) {
      query = query.whereRaw(
        "to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery(?)",
        [q.trim()],
      );
    }

    if (Array.isArray(tags) && tags.length) {
      query = query.whereRaw('tags @> ?', [JSON.stringify(tags)]);
    }

    if (typeof max_price === 'number') {
      query = query.where('price', '<=', max_price);
    }

    if (provider_id) {
      query = query.where('provider_id', provider_id);
    }

    const results = await query;
    res.json({ count: results.length, results });
  } catch (err) {
    log.error({ err }, 'search failed');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Provider CRUD
app.get('/providers', (req, res) => {
  res.json(providers);
});

app.post('/providers', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name required' });
  }
  const provider = { id: nextProviderId(), name };
  providers.push(provider);
  res.status(201).json(provider);
});

app.get('/providers/:id', (req, res) => {
  const provider = providers.find((p) => p.id === req.params.id);
  if (!provider) {
    return res.sendStatus(404);
  }
  res.json(provider);
});

app.put('/providers/:id', (req, res) => {
  const provider = providers.find((p) => p.id === req.params.id);
  if (!provider) {
    return res.sendStatus(404);
  }
  if (req.body.name) {
    provider.name = req.body.name;
  }
  res.json(provider);
});

app.delete('/providers/:id', (req, res) => {
  const idx = providers.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.sendStatus(404);
  }
  const [provider] = providers.splice(idx, 1);
  res.json(provider);
});

// Data package CRUD
app.get('/data-packages', (req, res) => {
  res.json(dataPackages);
});

app.post('/data-packages', (req, res) => {
  const { providerId, name, description } = req.body;
  if (!providerId || !name) {
    return res.status(400).json({ error: 'providerId and name required' });
  }
  const dataPackage = {
    id: nextDataPackageId(),
    providerId,
    name,
    description: description ?? '',
  };
  dataPackages.push(dataPackage);
  res.status(201).json(dataPackage);
});

app.get('/data-packages/:id', (req, res) => {
  const dataPackage = dataPackages.find((d) => d.id === req.params.id);
  if (!dataPackage) {
    return res.sendStatus(404);
  }
  res.json(dataPackage);
});

app.put('/data-packages/:id', (req, res) => {
  const dataPackage = dataPackages.find((d) => d.id === req.params.id);
  if (!dataPackage) {
    return res.sendStatus(404);
  }
  if (req.body.name) {
    dataPackage.name = req.body.name;
  }
  if (req.body.description !== undefined) {
    dataPackage.description = req.body.description;
  }
  if (req.body.providerId) {
    dataPackage.providerId = req.body.providerId;
  }
  res.json(dataPackage);
});

app.delete('/data-packages/:id', (req, res) => {
  const idx = dataPackages.findIndex((d) => d.id === req.params.id);
  if (idx === -1) {
    return res.sendStatus(404);
  }
  const [dataPackage] = dataPackages.splice(idx, 1);
  res.json(dataPackage);
});

// User CRUD
app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/users', (req, res) => {
  const { username, email } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'username required' });
  }
  const user = { id: nextUserId(), username, email: email ?? '' };
  users.push(user);
  res.status(201).json(user);
});

app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.sendStatus(404);
  }
  res.json(user);
});

app.put('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.sendStatus(404);
  }
  if (req.body.username) {
    user.username = req.body.username;
  }
  if (req.body.email !== undefined) {
    user.email = req.body.email;
  }
  res.json(user);
});

app.delete('/users/:id', (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    return res.sendStatus(404);
  }
  const [user] = users.splice(idx, 1);
  res.json(user);
});

app.get('/', (req, res) => {
  res.type('text').send('svc-search is running. Try /health or /search?q=agent');
});

app.listen(PORT, () => {
  log.info(`listening on http://localhost:${PORT}`);
});
