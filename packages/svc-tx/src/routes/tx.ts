import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { env } from '@genesisnet/env';
import { store, TxRecord } from '../lib/store.js';
import { logActivity, logger } from '@genesisnet/common';
import { logTransaction } from '../lib/icp.js';

const log = logger.child({ route: 'tx' });

const router = Router();

const initiateSchema = z.object({
  buyer_id: z.string().min(1),
  seller_id: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('ICP'),
  memo: z.string().optional(),
});

router.post('/initiate', async (req, res) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const id = `${env.TX_PREFIX}_${randomUUID()}`;
  const now = new Date().toISOString();

  const rec: TxRecord = {
    id,
    ...parsed.data,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  store.create(rec);
  await logActivity('TX_INITIATE', { tx: rec }).catch((err) => {
    log.error({ err }, 'activity log failed');
  });
  return res.json({ ok: true, tx: rec });
});

router.get('/:id/status', async (req, res) => {
  const tx = store.get(req.params.id);
  if (!tx) return res.status(404).json({ ok: false, error: 'TX not found' });
  const resp = {
    ok: true,
    tx: {
      id: tx.id,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      buyer_id: tx.buyer_id,
      seller_id: tx.seller_id,
    },
  };
  await logActivity('TX_STATUS', { id: tx.id, status: tx.status }).catch((err) =>
    log.error({ err }, 'activity log failed'),
  );
  return res.json(resp);
});

router.post('/:id/mark-paid', async (req, res) => {
  const tx = store.update(req.params.id, { status: 'paid' });
  if (!tx) return res.status(404).json({ ok: false, error: 'TX not found' });
  await logActivity('TX_MARK_PAID', { id: tx.id }).catch((err) =>
    log.error({ err }, 'activity log failed'),
  );
  try {
    await logTransaction(
      tx.id,
      tx.seller_id,
      BigInt(tx.amount),
      BigInt(Date.now()),
      tx.memo || '',
    );
  } catch (err) {
    log.error({ err }, 'icp log_transaction failed');
  }
  return res.json({ ok: true, tx });
});

router.post('/:id/mark-failed', async (req, res) => {
  const tx = store.update(req.params.id, { status: 'failed' });
  if (!tx) return res.status(404).json({ ok: false, error: 'TX not found' });
  await logActivity('TX_MARK_FAILED', { id: tx.id }).catch((err) =>
    log.error({ err }, 'activity log failed'),
  );
  return res.json({ ok: true, tx });
});

export default router;
