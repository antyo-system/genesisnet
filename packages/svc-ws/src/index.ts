import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';

const log = logger.child({ service: 'ws' });
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.AGENTVERSE_ORIGIN ?? '*',
  },
});

app.use(requestId(log));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'ws' });
});

io.on('connection', (socket) => {
  log.info({ id: socket.id }, 'client connected');
  socket.on('disconnect', () => {
    log.info({ id: socket.id }, 'client disconnected');
  });
});

function forward(channel: string) {
  return (message: string) => {
    let data: unknown = message;
    try {
      data = JSON.parse(message);
    } catch {}
    io.emit(channel, data);
  };
}

const pub = createClient({ url: env.REDIS_URL });
const sub = pub.duplicate();

async function start() {
  await Promise.all([pub.connect(), sub.connect()]);
  io.adapter(createAdapter(pub, sub));

  await Promise.all([
    sub.subscribe('metrics_update', forward('metrics_update')),
    sub.subscribe('activity_log', forward('activity_log')),
    sub.subscribe('network_update', forward('network_update')),
    sub.subscribe('search_results', forward('search_results')),
  ]);

  const PORT = env.WS_PORT;
  server.listen(PORT, () => {
    log.info(`listening ws://localhost:${PORT} (health: /health)`);
  });
}

start().catch((err) => {
  log.error({ err }, 'failed to start ws service');
  process.exit(1);
});

