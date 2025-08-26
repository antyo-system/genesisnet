import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';
import agentsRouter from './routes/agents.js';
import searchRouter from './routes/search.js';
import txRouter from './routes/tx.js';

const app = express();
const log = logger.child({ service: 'api-gateway' });

app.use(requestId(log));
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'api-gateway' }));
app.get('/ready', (req, res) => res.json({ ready: true }));

app.use('/agents', agentsRouter);
app.use('/search', searchRouter);
app.use('/tx', txRouter);

// proxy routes to internal services
const proxies = [
  { path: '/api/dashboard', target: `http://localhost:${env.METRICS_PORT}`, rewrite: '/dashboard' },
  { path: '/api/data', target: `http://localhost:${env.SEARCH_PORT}` },
  { path: '/api/network', target: `http://localhost:${env.NETWORK_PORT}` },
  { path: '/api/tx', target: `http://localhost:${env.TX_PORT}` },
  { path: '/api/reputation', target: `http://localhost:${env.REPUTATION_PORT}` },
];

proxies.forEach(({ path, target, rewrite }) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: rewrite ?? '' },
      logLevel: 'warn',
    }),
  );
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// generic error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  log.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(env.API_GATEWAY_PORT, () => {
  log.info(`listening on http://localhost:${env.API_GATEWAY_PORT}`);
});
