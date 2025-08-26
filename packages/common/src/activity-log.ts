import knex from 'knex';
import { env } from '@genesisnet/env';
import { logger } from './logger.js';

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

/**
 * Write an activity log record.
 * @param type - log type, e.g. SEARCH, TX, SCAN
 * @param meta - additional context to store in JSONB `meta_json` column
 * @param message - optional human readable message
 */
export async function logActivity(
  type: string,
  meta: Record<string, unknown> = {},
  message = '',
): Promise<void> {
  try {
    await db('activity_logs').insert({
      type,
      message,
      meta_json: meta,
    });
  } catch (err) {
    logger.error({ err, type }, 'failed to write activity log');
  }
}
