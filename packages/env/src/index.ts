import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_GATEWAY_PORT: z.coerce.number().default(3000),
  METRICS_PORT: z.coerce.number().default(9100),
  SEARCH_PORT: z.coerce.number().default(3001),
});

export const env = schema.parse(process.env);
