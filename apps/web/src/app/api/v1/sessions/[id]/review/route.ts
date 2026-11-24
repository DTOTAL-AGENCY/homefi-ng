import { NextResponse } from 'next/server';
import { z } from 'zod';
import { flatten } from '@homefi/db';
import { ERR, apiError, readJson } from '@/server/api';
import { callerFromSession, handle } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  body: z.string().trim().max(1000).optional(),
});

/** One verified review per completed session, by the applicant who attended. Moderated before publishing. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return apiError(422, 'validation_failed', 'Please check your review.', flatten(parsed.error));
  const sb = supabaseAdmin();
  const { data: s } = await sb.from('advisory_sessions').select('id, user_id, advisor_id, status').eq('id', (await ctx.params).id).maybeSingle();
  if (!s || s.user_id !== userId) return ERR.notFound();
  if (s.status !== 'completed') return apiError(409, 'not_completed', 'You can review a session once it has taken place.');
  const { error } = await sb.from('reviews').insert({ session_id: s.id, user_id: userId, advisor_id: s.advisor_id, ...parsed.data, status: 'pending' });
  if (error) return apiError(409, 'already_reviewed', "You've already reviewed this session. Thank you.");
  return NextResponse.json({ ok: true });
});
