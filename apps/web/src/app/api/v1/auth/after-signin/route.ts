import { NextResponse } from 'next/server';
import { CONSENT_TERMS_VERSION } from '@/lib/config';
import { ERR, readJson } from '@/server/api';
import { autoClaim, claimApplication } from '@/server/applications';
import { callerFromSession, handle, requestMeta } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Called by the browser right after sign-up or sign-in. Records terms (and marketing)
 * consent for new accounts, then claims the estimate the user came from and any other
 * unclaimed estimate on this device.
 */
export const POST = handle(async (req: Request) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const body = (await readJson<{ applicationId?: string; isNew?: boolean; marketing?: boolean }>(req)) ?? {};
  const meta = await requestMeta();
  const sb = supabaseAdmin();
  if (body.isNew) {
    const base = { user_id: userId, version: CONSENT_TERMS_VERSION, ip: meta.ip === 'unknown' ? null : meta.ip, user_agent: meta.userAgent.slice(0, 500) };
    await sb.from('consents').insert([
      { ...base, consent_type: 'terms', granted: true },
      { ...base, consent_type: 'marketing', granted: !!body.marketing },
    ]);
  }
  let claimed: unknown = null;
  if (body.applicationId) {
    claimed = await claimApplication({ applicationId: body.applicationId, userId, ...meta }).catch((e) => ({ error: (e as Error).message }));
  }
  await autoClaim(userId, meta.ip, meta.userAgent);
  return NextResponse.json({ ok: true, claimed });
});
