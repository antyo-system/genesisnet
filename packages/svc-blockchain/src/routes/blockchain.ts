import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const router = Router();

// In-memory wallet store (mock)
const wallets = new Map<string, number>();
wallets.set('user_123', 100); // ICP
wallets.set('provider_456', 50);

// GET /blockchain/wallet/:id/balance
router.get('/wallet/:id/balance', (req, res) => {
  const balance = wallets.get(req.params.id) ?? 0;
  return res.json({
    ok: true,
    wallet: req.params.id,
    balance,
    currency: 'ICP',
  });
});

// POST /blockchain/tx/send
const sendSchema = z.object({
  from: z.string(),
  to: z.string(),
  amount: z.number().positive(),
});

router.post('/tx/send', (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { from, to, amount } = parsed.data;
  const senderBalance = wallets.get(from) ?? 0;
  if (senderBalance < amount) {
    return res.status(400).json({ ok: false, error: 'Insufficient balance' });
  }

  // Update balances
  wallets.set(from, senderBalance - amount);
  wallets.set(to, (wallets.get(to) ?? 0) + amount);

  const txHash = `0x${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  return res.json({
    ok: true,
    tx_hash: txHash,
    from,
    to,
    amount,
    currency: 'ICP',
    chain_id: process.env.CHAIN_ID ?? 'unknown',
  });
});

// GET /blockchain/tx/:hash/status
router.get('/tx/:hash/status', (req, res) => {
  return res.json({
    ok: true,
    tx_hash: req.params.hash,
    status: 'confirmed',
  });
});

export default router;
