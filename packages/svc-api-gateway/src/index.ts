import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';
import agentsRouter from './routes/agents.js';
import searchRouter from './routes/search.js';
import txRouter from './routes/tx.js';
import { startMetricsJob } from './metrics.js';
import crypto from 'node:crypto';

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

function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token' });
  }
  const token = auth.substring(7);
  const parts = token.split('.');
  if (parts.length !== 3) {
    return res.status(401).json({ error: 'invalid_token' });
  }
  const [header, payload, signature] = parts;
  try {
    const data = `${header}.${payload}`;
    const expected = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(data)
      .digest('base64url');
    if (expected !== signature) {
      return res.status(401).json({ error: 'invalid_token' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

app.use('/api/tx', verifyJWT);
app.use('/api/data/search', verifyJWT);

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

startMetricsJob();
