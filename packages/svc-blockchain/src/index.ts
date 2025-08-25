import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT ?? '4003');
if (Number.isNaN(PORT)) {
  console.error('[svc-blockchain] Invalid PORT in .env');
  process.exit(1);
}

import blockchainRouter from './routes/blockchain.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'blockchain' });
});

app.use('/blockchain', blockchainRouter);

app.listen(PORT, () => {
  console.log(`[svc-blockchain] listening on http://localhost:${PORT}`);
});
