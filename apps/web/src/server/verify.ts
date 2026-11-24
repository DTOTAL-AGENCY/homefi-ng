import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = () => process.env.APP_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-secret';

/** Signed, expiring token for links in emails (email confirmation, dashboard links). */
export function signToken(payload: Record<string, string | number>, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readToken<T = Record<string, string | number>>(token: string): (T & { exp: number }) | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expect = createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as T & { exp: number };
  return data.exp > Date.now() / 1000 ? data : null;
}
