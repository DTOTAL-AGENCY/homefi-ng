import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { listAdvisors } from '@/server/advisors';
import { callerFromSession, handle } from '@/server/route-helpers';

/** Advisors ranked by match score for the user's application. */
export const GET = handle(async () => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const list = await listAdvisors({ sort: 'recommended' }, userId);
  return NextResponse.json({ advisors: list.map(({ calEventTypeId: _c, calUsername: _u, ...a }) => a) });
});
