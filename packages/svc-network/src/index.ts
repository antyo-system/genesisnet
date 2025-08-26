import http from 'node:http';
import knex from 'knex';
import { env } from '@genesisnet/env';
import { logger, logActivity } from '@genesisnet/common';

const PORT = env.NETWORK_PORT;
const log = logger.child({ service: 'network' });

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

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
        await logActivity('SCAN', metadata).catch((err) =>
          log.error({ err }, 'activity log failed'),
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
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

server.listen(PORT, () => {
  log.info(`listening on port ${PORT}`);
});
