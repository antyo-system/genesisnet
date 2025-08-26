import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_GATEWAY_PORT: z.coerce.number().default(3000),
  METRICS_PORT: z.coerce.number().default(9100),
  SEARCH_PORT: z.coerce.number().default(3001),
  DASHBOARD_SVC_URL: z.string().url().default('http://localhost:4001'),
  DATA_SVC_URL: z.string().url().default('http://localhost:4002'),
  NETWORK_SVC_URL: z.string().url().default('http://localhost:4003'),
  TX_SVC_URL: z.string().url().default('http://localhost:4004'),
  REPUTATION_SVC_URL: z.string().url().default('http://localhost:4005'),
});

export const env = schema.parse(process.env);
