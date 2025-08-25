import 'dotenv/config';
import { z } from 'zod';

const Schema = z.object({
  WS_PORT: z.coerce.number().default(3002),
});

export const env = Schema.parse(process.env);
