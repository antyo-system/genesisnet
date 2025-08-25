import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import { env } from './env.js'; // ⬅ ganti dari '@genesisnet/env' jadi './env'

// kumpulkan default node/process metrics
collectDefaultMetrics({ prefix: 'genesisnet_' });

const app = express();
const PORT = env.METRICS_PORT;

app.get('/health', (_req, res) => res.json({ ok: true, service: 'metrics' }));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => console.log(`[svc-metrics] listening on http://localhost:${PORT}`));
