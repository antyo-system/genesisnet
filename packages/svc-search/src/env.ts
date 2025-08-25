import 'dotenv/config';
import { z } from 'zod';

const Schema = z.object({
  SEARCH_PORT: z.coerce.number().default(3001),
});

export const env = Schema.parse(process.env);
