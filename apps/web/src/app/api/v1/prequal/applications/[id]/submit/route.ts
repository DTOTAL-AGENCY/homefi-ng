import { NextResponse } from 'next/server';
import { ERR, readJson, apiError } from '@/server/api';
import { submitApplication } from '@/server/applications';
import { callerFromSession, handle, requestMeta } from '@/server/route-helpers';
import { verifyTurnstile } from '@/server/turnstile';
import { supabaseAdmin } from '@/lib/supabase/server';
import { LIMITS } from '@/lib/config';

/** Validate everything, run the engine, return results (Appendix B shape). */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = (await readJson<{ turnstileToken?: string }>(req)) ?? {};
  const meta = await requestMeta();
  const { data: allowed } = await supabaseAdmin().rpc('hit_rate_limit', {
    p_key: `submit:${meta.ip}`,
    p_limit: LIMITS.submitsPerIpPerHour,
    p_window_seconds: 3600,
  });
  if (!allowed) return ERR.rateLimited();
  if (!(await verifyTurnstile(body.turnstileToken, meta.ip))) {
    return apiError(400, 'bot_check_failed', 'Please refresh the page and try again.');
  }
  const out = await submitApplication({ applicationId: id, caller: await callerFromSession(), ...meta });
  const e = out.estimate;
  return NextResponse.json({
    applicationId: out.applicationId,
    status: out.status,
    engineVersion: e.engineVersion,
    assessed: e.assessed,
    headline: e.headline,
    results: e.results,
    variants: e.variants,
    insightKey: e.insightKey,
    reportPrompt: true,
  });
});
