import { createHmac } from 'node:crypto';
import { env } from './env';

/** Same token format as apps/web/src/server/verify.ts */
export function signToken(payload: Record<string, string | number>, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url');
  const sig = createHmac('sha256', env.appSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
