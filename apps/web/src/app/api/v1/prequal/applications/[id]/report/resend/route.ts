import { NextResponse } from 'next/server';
import { ERR, apiError } from '@/server/api';
import { loadApplication } from '@/server/applications';
import { callerFromSession, handle } from '@/server/route-helpers';
import { resendReport } from '@/server/reports';
import { supabaseAdmin } from '@/lib/supabase/server';

/** Re-sends the latest ready report. Limit 3 per day. */
export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const caller = await callerFromSession();
  if (!caller.userId) return ERR.unauthorised();
  const sb = supabaseAdmin();
  const app = await loadApplication(sb, id, caller);
  const { data: allowed } = await sb.rpc('hit_rate_limit', { p_key: `resend:${app.id}`, p_limit: 3, p_window_seconds: 86400 });
  if (!allowed) return apiError(429, 'rate_limited', "You've asked for this report 3 times today. Please try again tomorrow.");
  const out = await resendReport(app.id, caller.userId);
  return NextResponse.json(out);
});
