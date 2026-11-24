import { NextResponse } from 'next/server';
import { z } from 'zod';
import { flatten } from '@homefi/db';
import { ERR, apiError, readJson } from '@/server/api';
import { callerFromSession, handle } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

const schema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  phone: z.string().trim().max(30).optional(),
  marketingOptIn: z.boolean(),
});

export const PUT = handle(async (req: Request) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return apiError(422, 'validation_failed', 'Please check the highlighted fields.', flatten(parsed.error));
  const sb = supabaseAdmin();
  const { data: before } = await sb.from('profiles').select('marketing_opt_in').eq('id', userId).single();
  await sb
    .from('profiles')
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone_e164: parsed.data.phone || null,
      marketing_opt_in: parsed.data.marketingOptIn,
    })
    .eq('id', userId);
  if (before && before.marketing_opt_in !== parsed.data.marketingOptIn) {
    await sb.from('consents').insert({ user_id: userId, consent_type: 'marketing', version: 'settings', granted: parsed.data.marketingOptIn });
  }
  return NextResponse.json({ ok: true });
});
