import { Pool } from 'pg';
import retry from 'async-retry';

const connectionString = process.env.DB_URL ?? 'postgres://postgres:postgres@localhost:5432/genesisnet';

export const pool = new Pool({ connectionString });

export async function connectWithRetry(): Promise<void> {
  await retry(async () => {
    await pool.query('SELECT 1');
  }, {
    retries: 5,
    factor: 2,
    minTimeout: 1000
  });
}

export default pool;
