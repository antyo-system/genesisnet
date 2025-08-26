import { createClient } from 'redis';
import { env } from '@genesisnet/env';

const pub = createClient({ url: env.REDIS_URL });
await pub.connect();

export const io = {
  emit: (channel: string, payload?: unknown) =>
    pub.publish(channel, JSON.stringify(payload)),
};
