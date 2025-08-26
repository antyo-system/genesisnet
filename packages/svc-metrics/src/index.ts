import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';

collectDefaultMetrics({ prefix: 'genesisnet_' });

const app = express();
const log = logger.child({ service: 'metrics' });
const PORT = env.METRICS_PORT;

app.use(requestId(log));

app.get('/health', (req, res) => res.json({ ok: true, service: 'metrics' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => log.info(`listening on http://localhost:${PORT}`));
