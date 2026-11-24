import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { enqueueEmail } from '@/server/jobs';
import { callerFromSession, handle } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SITE } from '@/lib/config';

/** NDPA access/deletion request: logged for ops, who action it within the statutory window. */
export const POST = handle(async (req: Request) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const kind = new URL(req.url).searchParams.get('kind') === 'export' ? 'export' : 'delete';
  const sb = supabaseAdmin();
  await sb.from('audit_log').insert({ actor_id: userId, action: `data_${kind}_requested`, entity: 'profiles', entity_id: userId });
  await enqueueEmail({ template: 'ops_alert', to: process.env.OPS_ALERT_EMAIL ?? SITE.supportEmail, data: { subject: `Data ${kind} request`, body: `User ${userId} asked for data ${kind}.` } });
  return NextResponse.json({ ok: true });
});
