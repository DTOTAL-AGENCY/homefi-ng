import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { ANON } from '@/lib/config';

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** The anonymous session token (httpOnly cookie). Created on first use. */
export async function anonToken(create = false): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(ANON.cookie)?.value;
  if (existing && /^[A-Za-z0-9_-]{32,}$/.test(existing)) return existing;
  if (!create) return null;
  const token = randomBytes(32).toString('base64url');
  store.set(ANON.cookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ANON.days * 24 * 60 * 60,
  });
  return token;
}

export const anonExpiry = () => new Date(Date.now() + ANON.days * 24 * 60 * 60 * 1000).toISOString();
