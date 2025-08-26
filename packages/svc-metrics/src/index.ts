import express from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import knex from 'knex';
import { createClient } from 'redis';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';

collectDefaultMetrics({ prefix: 'genesisnet_' });

const app = express();
const log = logger.child({ service: 'metrics' });
const PORT = env.METRICS_PORT;

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

const redis = createClient({ url: env.REDIS_URL });

app.use(requestId(log));

app.get('/health', (req, res) => res.json({ ok: true, service: 'metrics' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

async function publishMetrics() {
  const [{ count: txCountRaw }] = await db('transactions')
    .where('created_at', '>=', db.raw("now() - interval '1 minute'"))
    .count<{ count: string }>("* as count");

  const [{ avg: avgPriceRaw }] = await db('transactions').avg<{ avg: string | null }>('amount as avg');

  const [{ count: nodesOnlineRaw }] = await db('network_nodes')
    .where({ is_online: true })
    .count<{ count: string }>("* as count");

  const [{ total: totalRaw }] = await db('transactions').count<{ total: string }>("* as total");
  const [{ paid: paidRaw }] = await db('transactions')
    .where({ status: 'paid' })
    .count<{ paid: string }>("* as paid");

  const metrics = {
    txPerMin: Number(txCountRaw ?? 0),
    avgPrice: Number(avgPriceRaw ?? 0),
    nodesOnline: Number(nodesOnlineRaw ?? 0),
    offerRate: totalRaw ? Number(paidRaw) / Number(totalRaw) : 0,
  };

  await redis.publish('metrics_update', JSON.stringify(metrics));
}

async function start() {
  await redis.connect();
  await publishMetrics().catch((err) => log.error({ err }, 'metrics publish failed'));
  setInterval(() => {
    publishMetrics().catch((err) => log.error({ err }, 'metrics publish failed'));
  }, 3000);
  app.listen(PORT, () => log.info(`listening on http://localhost:${PORT}`));
}

start().catch((err) => {
  log.error({ err }, 'failed to start metrics service');
  process.exit(1);
});
