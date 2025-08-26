import 'dotenv/config'; // load .env
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '@genesisnet/env';

const app = express();
const PORT = env.API_GATEWAY_PORT;

// basic middlewares
app.use(cors());
app.use(express.json());

// health & ready checks
app.get('/health', (_req, res) => res.json({ ok: true, service: 'api-gateway' }));
app.get('/ready', (_req, res) => res.json({ ready: true }));

// proxy routes
app.use(
  '/api/dashboard',
  createProxyMiddleware({
    target: env.DASHBOARD_SVC_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/dashboard': '' },
  }),
);

app.use(
  '/api/data',
  createProxyMiddleware({
    target: env.DATA_SVC_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/data': '' },
  }),
);

app.use(
  '/api/network',
  createProxyMiddleware({
    target: env.NETWORK_SVC_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/network': '' },
  }),
);

app.use(
  '/api/tx',
  createProxyMiddleware({
    target: env.TX_SVC_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/tx': '' },
  }),
);

app.use(
  '/api/reputation',
  createProxyMiddleware({
    target: env.REPUTATION_SVC_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/reputation': '' },
  }),
);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// error middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// start
app.listen(PORT, () => {
  console.log(`[api-gateway] listening on http://localhost:${PORT}`);
});
