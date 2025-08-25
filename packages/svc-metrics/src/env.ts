// src/env.ts
import 'dotenv/config';
import { z } from 'zod';

const Schema = z.object({
  METRICS_PORT: z.coerce.number().default(9100),
});

export const env = Schema.parse(process.env);
