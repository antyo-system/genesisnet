/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto';
import type { Logger } from 'pino';

export function requestId(base: Logger) {
  return (req: any, res: any, next: any) => {
    const id = req.headers['x-request-id']?.toString() || randomUUID();
    res.setHeader('x-request-id', id);
    req.log = base.child({ requestId: id });
    next();
  };
}
