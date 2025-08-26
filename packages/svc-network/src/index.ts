import http from 'node:http';
import { env } from '@genesisnet/env';
import { logger } from '@genesisnet/common';

const PORT = env.NETWORK_PORT;
const log = logger.child({ service: 'network' });

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.statusCode = 404;
  res.end();
});

server.listen(PORT, () => {
  log.info(`listening on port ${PORT}`);
});
