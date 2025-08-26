import express from 'express';
import http, { IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const log = logger.child({ service: 'ws' });

app.use(requestId(log));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'ws' });
});

wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
  const id = Math.random().toString(36).slice(2, 8);
  log.info(`client connected #${id} from ${req.socket.remoteAddress}`);
  socket.send(JSON.stringify({ type: 'welcome', id, msg: 'connected' }));

  const interval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) socket.ping();
  }, 15_000);

  socket.on('pong', () => {});

  socket.on('message', (buf: RawData) => {
    const text = buf.toString();
    if (text.trim().toLowerCase() === 'ping') socket.send('pong');
    else socket.send(JSON.stringify({ type: 'echo', data: text }));
  });

  socket.on('close', () => {
    clearInterval(interval);
    log.info(`client disconnected #${id}`);
  });

  socket.on('error', (err: Error) => {
    log.error({ err }, 'ws error');
  });
});

app.get('/', (req, res) => {
  res.type('text').send('svc-ws running. HTTP: /health, WS: ws://localhost:3002');
});

const PORT = env.WS_PORT;
server.listen(PORT, () => {
  log.info(`listening ws://localhost:${PORT} (health: /health)`);
});
