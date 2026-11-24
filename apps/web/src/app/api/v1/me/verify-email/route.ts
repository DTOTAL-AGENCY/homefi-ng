import { NextResponse } from 'next/server';
import { ERR, apiError } from '@/server/api';
import { enqueueEmail } from '@/server/jobs';
import { callerFromSession, handle } from '@/server/route-helpers';
import { signToken } from '@/server/verify';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SITE } from '@/lib/config';

export const POST = handle(async () => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const sb = supabaseAdmin();
  const { data: allowed } = await sb.rpc('hit_rate_limit', { p_key: `verify:${userId}`, p_limit: 3, p_window_seconds: 3600 });
  if (!allowed) return ERR.rateLimited();
  const { data: p } = await sb.from('profiles').select('first_name,email').eq('id', userId).single();
  if (!p?.email) return apiError(409, 'no_email', 'Please add an email address in Settings.');
  const token = signToken({ uid: userId, email: p.email }, 7 * 24 * 3600);
  await enqueueEmail({
    template: 'email_confirmation',
    to: p.email,
    userId,
    data: { firstName: p.first_name, confirmUrl: `${SITE.url}/verify?t=${token}` },
  });
  return NextResponse.json({ ok: true });
});
