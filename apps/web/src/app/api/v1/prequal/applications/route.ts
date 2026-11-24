import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ERR, readJson } from '@/server/api';
import { saveDraft } from '@/server/applications';
import { callerFromSession, handle, requestMeta } from '@/server/route-helpers';
import { verifyTurnstile } from '@/server/turnstile';
import { supabaseAdmin } from '@/lib/supabase/server';
import { LIMITS } from '@/lib/config';
import { apiError } from '@/server/api';

/** Create or update a draft (step saves). Returns { applicationId, step }. */
export const POST = handle(async (req: Request) => {
  const body = await readJson<{ applicationId?: string; step: number; data: unknown; turnstileToken?: string }>(req);
  if (!body || typeof body.step !== 'number') return apiError(400, 'bad_request', 'Invalid request.');
  const { ip } = await requestMeta();
  const sb = supabaseAdmin();
  const { data: allowed } = await sb.rpc('hit_rate_limit', {
    p_key: `draft:${ip}`,
    p_limit: LIMITS.draftSavesPerIpPerHour,
    p_window_seconds: 3600,
  });
  if (!allowed) return ERR.rateLimited();
  if (!body.applicationId && !(await verifyTurnstile(body.turnstileToken, ip))) {
    return apiError(400, 'bot_check_failed', 'Please refresh the page and try again.');
  }
  const store = await cookies();
  let utm: Record<string, string> | null = null;
  try {
    utm = JSON.parse(store.get('hf_utm')?.value ?? 'null');
  } catch {}
  const out = await saveDraft({
    applicationId: body.applicationId,
    step: body.step,
    data: body.data,
    caller: await callerFromSession(),
    utm,
  });
  return NextResponse.json(out);
});
