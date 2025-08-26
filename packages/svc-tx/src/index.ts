// svc-tx/src/index.ts

import dotenv from 'dotenv';
dotenv.config(); // fallback kalau kamu tidak pakai --env-file=.env

import express from 'express';
import { z } from 'zod';
import { logger, loadEnv } from '@genesisnet/common';
import txRouter from './routes/tx.js';

// set dulu supaya logger kasih label service
process.env.SERVICE_NAME = 'svc-tx';

// parse & validasi ENV via common
const env = loadEnv({
  PORT: z.coerce.number().default(4002),
  TX_PREFIX: z.string().default('TX'),
});

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tx' });
});

app.use('/tx', txRouter);

app.listen(env.PORT, () => {
  logger.info(`listening on http://localhost:${env.PORT}`);
});
