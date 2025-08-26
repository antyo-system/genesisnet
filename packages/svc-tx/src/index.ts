import express from 'express';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';
import txRouter from './routes/tx.js';

const app = express();
const log = logger.child({ service: 'tx' });

app.use(requestId(log));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'tx' });
});

app.use('/tx', txRouter);

app.listen(env.TX_PORT, () => {
  log.info(`listening on http://localhost:${env.TX_PORT}`);
});
