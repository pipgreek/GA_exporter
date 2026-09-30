import { ConnectionOptions } from 'bullmq';

export function parseRedisConnection(redisUrl: string): ConnectionOptions {
  const parsedUrl = new URL(redisUrl);
  const database = parsedUrl.pathname.length > 1 ? Number(parsedUrl.pathname.slice(1)) : undefined;

  return {
    host: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : parsedUrl.protocol === 'rediss:' ? 6380 : 6379,
    username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
    password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
    db: Number.isInteger(database) ? database : undefined,
    tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}
