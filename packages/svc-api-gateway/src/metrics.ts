import { logger } from '@genesisnet/common';
import { pool } from './db.js';
import { io } from './ws.js';

const log = logger.child({ service: 'api-gateway', module: 'metrics' });

async function getMetrics() {
  const {
    rows: [{ count: txCountRaw }],
  } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM transactions WHERE created_at >= now() - interval '1 minute'",
  );

  const {
    rows: [{ avg: avgPriceRaw }],
  } = await pool.query("SELECT AVG(amount)::float AS avg FROM transactions");

  const {
    rows: [{ count: nodesOnlineRaw }],
  } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM network_nodes WHERE is_online=true",
  );

  const {
    rows: [{ total: totalRaw, paid: paidRaw }],
  } = await pool.query(
    "SELECT COUNT(*)::int AS total, SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)::int AS paid FROM transactions",
  );

  return {
    txPerMin: Number(txCountRaw ?? 0),
    avgPrice: Number(avgPriceRaw ?? 0),
    nodesOnline: Number(nodesOnlineRaw ?? 0),
    offerRate: totalRaw ? Number(paidRaw) / Number(totalRaw) : 0,
  };
}

async function publishMetrics() {
  const metrics = await getMetrics();
  await io.emit('metrics_update', metrics);
}

export function startMetricsJob() {
  const run = () =>
    publishMetrics().catch((err) =>
      log.error({ err }, 'metrics publish failed'),
    );
  run();
  setInterval(run, 3000);
}

