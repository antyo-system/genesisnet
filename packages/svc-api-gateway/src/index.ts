import express from 'express';
import { env } from '@genesisnet/env';
import { logger, requestId } from '@genesisnet/common';

const app = express();
const log = logger.child({ service: 'api-gateway' });

app.use(requestId(log));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'api-gateway' }));
app.get('/ready', (req, res) => res.json({ ready: true }));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(env.API_GATEWAY_PORT, () => {
  log.info(`listening on http://localhost:${env.API_GATEWAY_PORT}`);
});
