import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { loadDashboard } from '@/server/dashboard';
import { callerFromSession, handle } from '@/server/route-helpers';

/** Profile, applications, reports, sessions, tracker stage. */
export const GET = handle(async () => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const d = await loadDashboard(userId);
  return NextResponse.json({
    profile: d.profile,
    applications: d.applications.map((a) => ({ ...a, estimate: a.estimate ? { headline: a.estimate.headline } : null })),
    sessions: d.sessions,
    tracker: d.tracker,
  });
});
