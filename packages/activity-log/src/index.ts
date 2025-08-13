import { Pool } from 'pg';
import { env } from '@genesisnet/env';
import { Request, Response, NextFunction } from 'express';

const pool = new Pool({ connectionString: env.DB_URL });

type ActivityEvent = 'api_access' | 'error' | 'data_change';

async function logActivity(event: ActivityEvent, details: unknown) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (event_type, details) VALUES ($1, $2::jsonb)`,
      [event, JSON.stringify(details)]
    );
  } catch {
    // ignore logging errors
  }
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    logActivity('api_access', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
}

export function errorLogger(err: Error, req: Request, _res: Response, next: NextFunction) {
  logActivity('error', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack,
  });
  next(err);
}

export function logDataChange(action: string, entity: string, before: unknown, after: unknown) {
  return logActivity('data_change', { action, entity, before, after });
}

export { logActivity };
