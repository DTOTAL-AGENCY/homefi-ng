import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/** Resend webhooks are signed with Svix: v1 HMAC-SHA256 of "id.timestamp.body". */
function valid(raw: string, h: Headers) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  const id = h.get('svix-id');
  const ts = h.get('svix-timestamp');
  const sigs = h.get('svix-signature');
  if (!secret || !id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expect = createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest('base64');
  return sigs.split(' ').some((s) => {
    const v = s.split(',')[1] ?? '';
    return v.length === expect.length && timingSafeEqual(Buffer.from(v), Buffer.from(expect));
  });
}

const STATUS: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

/** Delivered, opened, bounced, complained. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!valid(raw, req.headers)) return new NextResponse('invalid signature', { status: 401 });
  const ev = JSON.parse(raw) as { type: string; data: { email_id: string } };
  const status = STATUS[ev.type];
  if (!status) return NextResponse.json({ ok: true });
  const sb = supabaseAdmin();
  const { data: n } = await sb.from('notifications').update({ status }).eq('provider_message_id', ev.data.email_id).select('*').maybeSingle();
  if (n && ['report_delivery', 'report2_ready'].includes(n.template) && n.application_id) {
    if (status === 'opened') {
      await sb.from('reports').update({ opened_at: new Date().toISOString() }).eq('application_id', n.application_id).is('opened_at', null);
    }
    if (status === 'bounced') {
      await sb.from('reports').update({ status: 'email_failed' }).eq('application_id', n.application_id).eq('status', 'emailed');
      if (n.user_id) await sb.from('profiles').update({ email_bounced_at: new Date().toISOString() }).eq('id', n.user_id);
    }
  }
  return NextResponse.json({ ok: true });
}
