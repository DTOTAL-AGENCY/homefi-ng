import 'server-only';
import { NextResponse } from 'next/server';

/** Errors return { error: { code, message, fields } } with the right HTTP status. */
export function apiError(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export const ERR = {
  rateLimited: () => apiError(429, 'rate_limited', "You've tried a few times in a row. Please wait a minute and try again."),
  server: () => apiError(500, 'server_error', 'Something went wrong on our side. Your answers are safe. Please try again.'),
  notFound: () => apiError(404, 'not_found', 'Not found.'),
  unauthorised: () => apiError(401, 'unauthorised', 'For your security, please sign in again. Your estimate is still here.'),
  forbidden: () => apiError(403, 'forbidden', 'You do not have access to this.'),
};

export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
