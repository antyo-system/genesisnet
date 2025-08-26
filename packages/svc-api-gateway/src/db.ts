import { Pool } from 'pg';
import { env } from '@genesisnet/env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });
