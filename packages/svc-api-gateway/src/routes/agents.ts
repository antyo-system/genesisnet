import { Router } from 'express';
import { io } from '../ws.js';
import { pool } from '../db.js';
import { bumpReputation } from '@genesisnet/blockchain-service/src/icp.js';
import { env } from '@genesisnet/env';
import { z } from 'zod';

const offerSchema = z.object({
  offer_id: z.string(),
  provider_id: z.string(),
  package_id: z.string(),
  name: z.string(),
  price: z.number(),
  reputation: z.number(),
  data_hash: z.string(),
  latency_ms: z.number().optional(),
});

const agentEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('OFFER_NEW'), payload: offerSchema }),
  z.object({
    type: z.literal('TX_PROCESSING'),
    payload: z.object({
      tx_id: z.string(),
      offer_id: z.string(),
      provider_id: z.string(),
      package_id: z.string(),
      amount: z.number(),
    }),
  }),
  z.object({
    type: z.literal('TX_SUCCESS'),
    payload: z.object({
      tx_id: z.string(),
      offer_id: z.string(),
      provider_id: z.string(),
      amount: z.number(),
      tx_hash: z.string(),
    }),
  }),
  z.object({
    type: z.literal('TX_FAILED'),
    payload: z.object({ offer_id: z.string(), reason: z.string() }),
  }),
  z.object({
    type: z.literal('PROVIDER_ONLINE'),
    payload: z.object({
      provider_id: z.string(),
      node_addr: z.string(),
      latency_ms: z.number().optional(),
    }),
  }),
]);

type AgentEvent = z.infer<typeof agentEventSchema>;

const r = Router();

// webhook dari semua Agent
r.post('/events', async (req, res) => {
  const bySecret =
    env.AGENT_SHARED_SECRET && req.headers['x-agent-secret'] === env.AGENT_SHARED_SECRET;
  const byIp = env.AGENT_IP && req.ip === env.AGENT_IP;
  if (!(bySecret || byIp)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const parsed = agentEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' });
  }
  const event = parsed.data;

  try {
    if (event.type === 'OFFER_NEW') {
      await pool.query('INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)', [
        'OFFER',
        `Offer from provider ${event.payload.provider_id}`,
        event.payload,
      ]);
      io.emit('activity_log', { type: 'OFFER', payload: event.payload });
      io.emit('search_results', [event.payload]);
    }

    if (event.type === 'TX_PROCESSING') {
      const { tx_id, provider_id, package_id, amount } = event.payload;
      await pool.query(
        "UPDATE transactions SET status='PROCESSING', provider_id=$1, package_id=$2, amount=$3 WHERE tx_id=$4",
        [provider_id, package_id, amount, tx_id],
      );
      await pool.query('INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)', [
        'TX',
        `Transaction ${tx_id} processing`,
        event.payload,
      ]);
      io.emit('activity_log', { type: 'TX', payload: event.payload });
    }

    if (event.type === 'TX_SUCCESS') {
      const { tx_id, offer_id, provider_id, amount, tx_hash } = event.payload;
      await pool.query("UPDATE transactions SET status='CONFIRMED', tx_hash=$1 WHERE tx_id=$2", [
        tx_hash,
        tx_id,
      ]);
      await bumpReputation(provider_id, 1);
      // await logTx({ tx_id, provider_id, amount, data_hash: '...', ts: BigInt(Date.now()) });
      await pool.query('INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)', [
        'TX',
        `Transaction ${tx_id} confirmed`,
        event.payload,
      ]);
      io.emit('activity_log', { type: 'TX', payload: event.payload });
      io.emit('metrics_update');
    }

    if (event.type === 'TX_FAILED') {
      await pool.query(
        "UPDATE transactions SET status='FAILED' WHERE id=(SELECT id FROM transactions WHERE offer_id=$1 ORDER BY created_at DESC LIMIT 1)",
        [event.payload.offer_id],
      );
      io.emit('activity_log', { type: 'TX_FAILED', payload: event.payload });
      io.emit('metrics_update');
    }

    if (event.type === 'PROVIDER_ONLINE') {
      const { provider_id, node_addr, latency_ms } = event.payload;
      await pool.query(
        `INSERT INTO network_nodes(addr, is_online, latency_ms, updated_at)
         VALUES($1,true,$2,NOW())
         ON CONFLICT (addr) DO UPDATE SET is_online=true, latency_ms=$2, updated_at=NOW()`,
        [node_addr, latency_ms ?? null],
      );
      await pool.query('INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)', [
        'PROVIDER',
        `Provider ${provider_id} online`,
        event.payload,
      ]);
      io.emit('network_update', event.payload);
      io.emit('activity_log', { type: 'PROVIDER', payload: event.payload });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'event_handling_failed' });
  }
});

export default r;
