import { NextResponse } from 'next/server';
import { apiError, readJson } from '@/server/api';
import { loadApplication } from '@/server/applications';
import { callerFromSession, handle } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

/** Logs the answer to "Want your full report as a PDF?" */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const body = await readJson<{ answer: 'yes' | 'not_now' }>(req);
  if (!body || !['yes', 'not_now'].includes(body.answer)) return apiError(400, 'bad_request', 'Invalid answer.');
  const sb = supabaseAdmin();
  const app = await loadApplication(sb, id, await callerFromSession());
  await sb
    .from('applications')
    .update({ report_prompt_answer: body.answer, report_prompt_at: new Date().toISOString() })
    .eq('id', app.id);
  return NextResponse.json({ ok: true });
});
