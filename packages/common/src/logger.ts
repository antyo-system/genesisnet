type Level = 'debug' | 'info' | 'warn' | 'error';

function stamp(level: Level) {
  const ts = new Date().toISOString();
  const svc = process.env.SERVICE_NAME ?? 'unknown';
  return `[${ts}] [${svc}] [${level.toUpperCase()}]`;
}

export const logger = {
  debug: (...a: unknown[]) => console.debug(stamp('debug'), ...a),
  info: (...a: unknown[]) => console.info(stamp('info'), ...a),
  warn: (...a: unknown[]) => console.warn(stamp('warn'), ...a),
  error: (...a: unknown[]) => console.error(stamp('error'), ...a),
};
