import { z, ZodRawShape } from 'zod';

/**
 * Helper generik untuk parse ENV lintas service.
 * Pakai:
 *   const env = loadEnv({ PORT: z.coerce.number().default(4002) })
 */
export function loadEnv<T extends ZodRawShape>(shape: T) {
  const schema = z.object(shape).passthrough();
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('[common/env] Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
  }
  return parsed.data as { [K in keyof T]: z.infer<T[K]> };
}

/** Bentuk dasar opsional yang sering dipakai */
export const BaseEnv = {
  NODE_ENV: z.string().default('development'),
  SERVICE_NAME: z.string().default('unknown'),
};
