import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { autoClaim, claimApplication } from '@/server/applications';
import { requestMeta } from '@/server/route-helpers';

/** OAuth (Google) and password-recovery return here with a code. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/app';
  const application = url.searchParams.get('application');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/app';
  if (code) {
    const sb = await supabaseServer();
    const { data } = await sb.auth.exchangeCodeForSession(code);
    if (data.user) {
      const meta = await requestMeta();
      if (application) await claimApplication({ applicationId: application, userId: data.user.id, ...meta }).catch(() => null);
      await autoClaim(data.user.id, meta.ip, meta.userAgent);
    }
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
