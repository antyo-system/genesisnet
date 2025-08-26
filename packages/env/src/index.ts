import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_GATEWAY_PORT: z.coerce.number().default(3000),
  SEARCH_PORT: z.coerce.number().default(3001),
  METRICS_PORT: z.coerce.number().default(9100),
  TX_PORT: z.coerce.number().default(4002),
  BLOCKCHAIN_PORT: z.coerce.number().default(4003),
  WS_PORT: z.coerce.number().default(3002),
  NETWORK_PORT: z.coerce.number().default(4004),
  REPUTATION_PORT: z.coerce.number().default(4005),
  SCHEDULER_SCAN_INTERVAL_MS: z.coerce.number().default(30000),
  SCHEDULER_METRICS_INTERVAL_MS: z.coerce.number().default(60000),
  NETWORK_DISCOVERY_URL: z
    .string()
    .url()
    .default('http://localhost:4943/nodes'),
  TX_PREFIX: z.string().default('TX'),
  DATABASE_URL: z.string().url().default('postgres://postgres:postgres@postgres:5432/genesisnet'),
  REDIS_URL: z.string().url().default('redis://redis:6379/0'),
  JWT_SECRET: z.string().default('change-me'),
  ICP_LEDGER_CANISTER_ID: z.string().optional(),
  ICP_REPUTATION_CANISTER_ID: z.string().optional(),
});

export const env = schema.parse(process.env);
