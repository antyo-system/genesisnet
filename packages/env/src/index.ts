import { z } from "zod";

const envSchema = z.object({
  DB_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  API_GATEWAY_PORT: z.coerce.number().int().positive().default(3000),
  METRICS_PORT: z.coerce.number().int().positive().default(3001),
  SEARCH_PORT: z.coerce.number().int().positive().default(3002),
  NETWORK_PORT: z.coerce.number().int().positive().default(3003),
  TX_PORT: z.coerce.number().int().positive().default(3004),
  WS_PORT: z.coerce.number().int().positive().default(3005),
  BLOCKCHAIN_PORT: z.coerce.number().int().positive().default(3006),
});

export const env = envSchema.parse(process.env);
