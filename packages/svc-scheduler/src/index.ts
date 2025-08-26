import knex from 'knex';
import { createClient } from 'redis';
import { env } from '@genesisnet/env';
import { logger } from '@genesisnet/common';

const log = logger.child({ service: 'scheduler' });

const SCAN_INTERVAL = env.SCHEDULER_SCAN_INTERVAL_MS;
const METRICS_INTERVAL = env.SCHEDULER_METRICS_INTERVAL_MS;

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

const redis = createClient({ url: env.REDIS_URL });

async function runScan() {
  try {
    await fetch(`http://localhost:${env.NETWORK_PORT}/scan`, { method: 'POST' });
    log.info('network scan triggered');
  } catch (err) {
    log.error({ err }, 'network scan trigger failed');
  }
}

async function getMetrics() {
  const [{ count: txCountRaw }] = await db('transactions')
    .where('created_at', '>=', db.raw("now() - interval '1 minute'"))
    .count<{ count: string }>("* as count");

  const [{ avg: avgPriceRaw }] = await db('transactions').avg<{ avg: string | null }>(
    'amount as avg',
  );

  const [{ count: nodesOnlineRaw }] = await db('network_nodes')
    .where({ is_online: true })
    .count<{ count: string }>("* as count");

  const [{ total: totalRaw }] = await db('transactions').count<{ total: string }>("* as total");
  const [{ paid: paidRaw }] = await db('transactions')
    .where({ status: 'paid' })
    .count<{ paid: string }>("* as paid");

  return {
    txPerMin: Number(txCountRaw ?? 0),
    avgPrice: Number(avgPriceRaw ?? 0),
    nodesOnline: Number(nodesOnlineRaw ?? 0),
    offerRate: totalRaw ? Number(paidRaw) / Number(totalRaw) : 0,
  };
}

async function recomputeMetrics() {
  try {
    const metrics = await getMetrics();
    await redis.publish('metrics_update', JSON.stringify(metrics));
    log.info('metrics recomputed');
  } catch (err) {
    log.error({ err }, 'metrics recompute failed');
  }
}

async function start() {
  await redis.connect();
  await runScan();
  await recomputeMetrics();
  setInterval(runScan, SCAN_INTERVAL);
  setInterval(recomputeMetrics, METRICS_INTERVAL);
}

start().catch((err) => {
  log.error({ err }, 'failed to start scheduler');
  process.exit(1);
});
