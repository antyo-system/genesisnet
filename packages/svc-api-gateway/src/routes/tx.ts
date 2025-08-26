import { Router } from 'express';
import type { PurchaseOrder } from '@genesisnet/common/src/schemas.js';
import axios from 'axios';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { env } from '@genesisnet/env';

const r = Router();

r.post('/initiate', async (req, res) => {
  const body = req.body as PurchaseOrder;

  const txId = crypto.randomUUID();
  await pool.query(
    "INSERT INTO transactions(tx_id, status, amount, provider_id, user_id, package_id, created_at) VALUES($1,'PENDING',NULL,NULL,$2,NULL,NOW())",
    [txId, body.requester_id],
  );

  await axios.post(`${env.REQUESTER_AGENT_URL}/purchase`, { ...body, tx_id: txId });

  res.json({ tx_id: txId, status: 'PENDING' });
});

r.get('/status', async (req, res) => {
  const { tx_id } = req.query as { tx_id?: string };
  if (!tx_id) {
    return res.status(400).json({ error: 'missing_tx_id' });
  }
  const { rows } = await pool.query('SELECT status FROM transactions WHERE tx_id=$1', [tx_id]);
  if (!rows.length) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json({ tx_id, status: rows[0].status });
});

export default r;
