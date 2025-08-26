import { Router } from 'express';
import type { SearchRequest } from '@genesisnet/common/src/schemas.js';
import axios from 'axios';
import { pool } from '../db.js';
import { env } from '@genesisnet/env';

const r = Router();

// trigger Requester Agent
r.post('/', async (req, res) => {
  const body = req.body as SearchRequest;

  await pool.query(
    'INSERT INTO activity_logs(type,message,meta_json) VALUES($1,$2,$3)',
    ['SEARCH', `Search ${body.query}`, body],
  );

  await axios.post(`${env.REQUESTER_AGENT_URL}/search`, body);

  res.status(202).json({ status: 'searching' });
});

export default r;
