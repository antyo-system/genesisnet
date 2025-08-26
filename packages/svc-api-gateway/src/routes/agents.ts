import { Router } from 'express';
import type { AgentEvent } from '@genesisnet/common/src/schemas.js';
import { io } from '../ws.js';
import { pool } from '../db.js';
import { bumpReputation } from '@genesisnet/blockchain-service/src/icp.js';

const r = Router();

// webhook dari semua Agent
r.post('/events', async (req, res) => {
  const event = req.body as AgentEvent;

  try {
    if (event.type === 'OFFER_NEW') {
      await pool.query(
        'INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)',
        ['OFFER', `Offer from provider ${event.payload.provider_id}`, event.payload],
      );
      io.emit('activity_log', { type: 'OFFER', payload: event.payload });
      io.emit('search_results', [event.payload]);
    }

    if (event.type === 'TX_SUCCESS') {
      const { tx_id, offer_id, provider_id, amount, tx_hash } = event.payload;
      await pool.query(
        "UPDATE transactions SET status='CONFIRMED', tx_hash=$1 WHERE tx_id=$2",
        [tx_hash, tx_id],
      );
      await bumpReputation(provider_id, 1);
      // await logTx({ tx_id, provider_id, amount, data_hash: '...', ts: BigInt(Date.now()) });
      await pool.query(
        'INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)',
        ['TX', `Transaction ${tx_id} confirmed`, event.payload],
      );
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
      await pool.query(
        'INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)',
        ['PROVIDER', `Provider ${provider_id} online`, event.payload],
      );
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
