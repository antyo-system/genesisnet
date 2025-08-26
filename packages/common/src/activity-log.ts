import knex from 'knex';
import { env } from '@genesisnet/env';
import { logger } from './logger.js';

const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
});

/**
 * Write an activity log record.
 * @param action - type of action, e.g. SEARCH, TX, SCAN
 * @param metadata - additional context to store in JSONB metadata column
 * @param userId - optional id of the acting user
 */
export async function logActivity(
  action: string,
  metadata: Record<string, unknown> = {},
  userId?: string,
): Promise<void> {
  try {
    await db('activity_logs').insert({
      user_id: userId ?? null,
      action,
      metadata,
    });
  } catch (err) {
    logger.error({ err, action }, 'failed to write activity log');
  }
}
