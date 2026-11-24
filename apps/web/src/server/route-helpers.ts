import 'server-only';
import { headers } from 'next/headers';
import { apiError, ERR } from './api';
import { AppError } from './applications';
import { clientIp } from './request';
import { currentProfile, currentUser } from '@/lib/supabase/server';

export async function requestMeta() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: h.get('user-agent') ?? '' };
}

export async function callerFromSession() {
  const user = await currentUser().catch(() => null);
  return { userId: user?.id ?? null };
}

export async function requireRole(roles: Array<'applicant' | 'advisor' | 'ops' | 'admin'>) {
  const p = await currentProfile();
  if (!p) return null;
  return roles.includes(p.role as never) ? p : null;
}

/** Turn thrown AppErrors into the API error shape. */
export function handle<T extends unknown[]>(fn: (...args: T) => Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof AppError) {
        const res = apiError(e.status, e.code, e.message, e.fields);
        if (e.step) {
          const body = await res.json();
          body.error.step = e.step;
          return Response.json(body, { status: e.status });
        }
        return res;
      }
      console.error('[api]', (e as Error).message);
      return ERR.server();
    }
  };
}
