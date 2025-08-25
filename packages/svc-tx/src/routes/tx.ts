import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { store, TxRecord } from '../lib/store.js';

const router = Router();

const initiateSchema = z.object({
  buyer_id: z.string().min(1),
  seller_id: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('ICP'),
  memo: z.string().optional(),
});

// POST /tx/initiate
router.post('/initiate', (req, res) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const id = `${process.env.TX_PREFIX ?? 'TX'}_${randomUUID()}`;
  const now = new Date().toISOString();

  const rec: TxRecord = {
    id,
    ...parsed.data,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  store.create(rec);
  return res.json({ ok: true, tx: rec });
});

// GET /tx/:id/status
router.get('/:id/status', (req, res) => {
  const tx = store.get(req.params.id);
  if (!tx) return res.status(404).json({ ok: false, error: 'TX not found' });
  return res.json({
    ok: true,
    tx: {
      id: tx.id,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      buyer_id: tx.buyer_id,
      seller_id: tx.seller_id,
    },
  });
});

// POST /tx/:id/mark-paid (simulasi konfirmasi pembayaran)
router.post('/:id/mark-paid', (req, res) => {
  const tx = store.update(req.params.id, { status: 'paid' });
  if (!tx) return res.status(404).json({ ok: false, error: 'TX not found' });
  return res.json({ ok: true, tx });
});

// POST /tx/:id/mark-failed (simulasi gagal)
router.post('/:id/mark-failed', (req, res) => {
  const tx = store.update(req.params.id, { status: 'failed' });
  if (!tx) return res.status(404).json({ ok: false, error: 'TX not found' });
  return res.json({ ok: true, tx });
});

export default router;
