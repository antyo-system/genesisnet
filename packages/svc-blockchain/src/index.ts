import express from 'express';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';
import blockchainRouter from './routes/blockchain.js';

const app = express();
const log = logger.child({ service: 'blockchain' });

app.use(requestId(log));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'blockchain' });
});

app.use('/blockchain', blockchainRouter);

app.listen(env.BLOCKCHAIN_PORT, () => {
  log.info(`listening on http://localhost:${env.BLOCKCHAIN_PORT}`);
});
