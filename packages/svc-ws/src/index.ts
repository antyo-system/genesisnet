import express from 'express';
import http, { IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { env } from './env.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ws' });
});

wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
  const id = Math.random().toString(36).slice(2, 8);
  console.log(`[ws] client connected #${id} from ${req.socket.remoteAddress}`);

  socket.send(JSON.stringify({ type: 'welcome', id, msg: 'connected' }));

  const interval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) socket.ping();
  }, 15_000);

  socket.on('pong', () => {
    // heartbeat response
  });

  socket.on('message', (buf: RawData) => {
    const text = buf.toString();
    if (text.trim().toLowerCase() === 'ping') socket.send('pong');
    else socket.send(JSON.stringify({ type: 'echo', data: text }));
  });

  socket.on('close', () => {
    clearInterval(interval);
    console.log(`[ws] client disconnected #${id}`);
  });

  socket.on('error', (err: Error) => {
    console.error('[ws] error:', err);
  });
});

app.get('/', (_req, res) => {
  res.type('text').send('svc-ws running. HTTP: /health, WS: ws://localhost:3002');
});

const PORT = env.WS_PORT;
server.listen(PORT, () => {
  console.log(`[svc-ws] listening ws://localhost:${PORT} (health: /health)`);
});
