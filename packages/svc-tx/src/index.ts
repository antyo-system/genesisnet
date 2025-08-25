import express from 'express';
import dotenv from 'dotenv';

dotenv.config(); // fallback jika --env-file tidak dipakai

// Validasi env (opsional ringan)
const PORT = Number(process.env.PORT ?? '4002');
if (Number.isNaN(PORT)) {
  console.error('[svc-tx] Invalid PORT in .env');
  process.exit(1);
}

import txRouter from './routes/tx.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tx' });
});

app.use('/tx', txRouter);

app.listen(PORT, () => {
  console.log(`[svc-tx] listening on http://localhost:${PORT}`);
});
