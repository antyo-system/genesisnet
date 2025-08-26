import http from 'node:http';
import { randomUUID } from 'node:crypto';
import knex from 'knex';
import { createClient } from 'redis';
import { env } from '@genesisnet/env';
import { logger, logActivity } from '@genesisnet/common';

const PORT = env.NETWORK_PORT;
const log = logger.child({ service: 'network' });

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

const redis = createClient({ url: env.REDIS_URL });

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url === '/scan') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const metadata = body ? JSON.parse(body) : {};

        let discovered: string[] = [];
        try {
          const resp = await fetch(env.NETWORK_DISCOVERY_URL);
          if (resp.ok) {
            const data = (await resp.json()) as { nodes?: unknown };
            if (Array.isArray(data.nodes)) {
              discovered = data.nodes.filter((n): n is string => typeof n === 'string');
            }
          }
        } catch (err) {
          log.error({ err }, 'discovery fetch failed');
        }

        const rows = await db('network_nodes').select('id', 'address');
        const existing = new Map(rows.map((r) => [r.address, r.id]));
        const addresses = new Set<string>([...discovered, ...existing.keys()]);

        const results: {
          id: string;
          address: string;
          latency_ms: number | null;
          is_online: boolean;
        }[] = [];
        const newNodes: string[] = [];

        for (const address of addresses) {
          const id = existing.get(address) ?? randomUUID();
          const url = address.replace(/\/$/, '') + '/health';
          const start = Date.now();
          let latency: number | null = null;
          let isOnline = false;
          try {
            const pingRes = await fetch(url);
            if (pingRes.ok) {
              latency = Date.now() - start;
              isOnline = true;
            }
          } catch {}

          if (existing.has(address)) {
            await db('network_nodes')
              .where({ id })
              .update({
                latency_ms: latency,
                is_online: isOnline,
                updated_at: db.fn.now(),
              });
          } else {
            await db('network_nodes').insert({
              id,
              address,
              latency_ms: latency,
              is_online: isOnline,
            });
            newNodes.push(address);
          }

          results.push({ id, address, latency_ms: latency, is_online: isOnline });
        }

        await redis.publish('network_update', JSON.stringify({ nodes: results }));

        await logActivity('SCAN', { ...metadata, discovered: newNodes.length }).catch(
          (err) => log.error({ err }, 'activity log failed'),
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, nodes: results }));
      } catch (err) {
        log.error({ err }, 'scan failed');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/topology') {
    db('network_nodes')
      .select('id', 'address', 'latency_ms', 'is_online')
      .then((nodes) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ nodes }));
      })
      .catch((err) => {
        log.error({ err }, 'topology fetch failed');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'failed to fetch topology' }));
      });
    return;
  }

  res.statusCode = 404;
  res.end();
});

async function start() {
  await redis.connect();
  server.listen(PORT, () => {
    log.info(`listening on port ${PORT}`);
  });
}

start().catch((err) => {
  log.error({ err }, 'failed to start network service');
  process.exit(1);
});
