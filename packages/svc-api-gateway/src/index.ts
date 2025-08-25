import express from 'express';

const app = express();
const PORT = Number(process.env.API_GATEWAY_PORT || 3000);

// basic middlewares
app.use(express.json());

// health & ready checks
app.get('/health', (_req, res) => res.json({ ok: true, service: 'api-gateway' }));
app.get('/ready', (_req, res) => res.json({ ready: true }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// start
app.listen(PORT, () => {
  console.log(`[api-gateway] listening on http://localhost:${PORT}`);
});
