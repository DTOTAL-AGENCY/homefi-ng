import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function valid(raw: string, sig: string | null) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || !sig) return false;
  const expect = createHmac('sha256', secret).update(raw).digest('hex');
  return expect.length === sig.length && timingSafeEqual(Buffer.from(expect), Buffer.from(sig));
}

interface CalEvent {
  triggerEvent: string;
  payload: { uid?: string; rescheduleUid?: string; startTime?: string; endTime?: string; metadata?: { sessionId?: string } };
}

/** Keeps sessions in sync: booking rescheduled, cancelled, meeting ended. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!valid(raw, req.headers.get('x-cal-signature-256'))) return new NextResponse('invalid signature', { status: 401 });
  const ev = JSON.parse(raw) as CalEvent;
  const sb = supabaseAdmin();
  const p = ev.payload ?? {};
  const find = async () => {
    if (p.metadata?.sessionId) return (await sb.from('advisory_sessions').select('*').eq('id', p.metadata.sessionId).maybeSingle()).data;
    const uid = p.rescheduleUid ?? p.uid;
    return uid ? (await sb.from('advisory_sessions').select('*').eq('cal_booking_uid', uid).maybeSingle()).data : null;
  };
  const s = await find();
  if (!s) return NextResponse.json({ ok: true, ignored: true });

  switch (ev.triggerEvent) {
    case 'BOOKING_RESCHEDULED':
      await sb
        .from('advisory_sessions')
        .update({ status: 'rescheduled', start_at: p.startTime, end_at: p.endTime, cal_booking_uid: p.uid ?? s.cal_booking_uid, reminder_24h_sent_at: null, reminder_1h_sent_at: null })
        .eq('id', s.id);
      break;
    case 'BOOKING_CANCELLED':
      if (['confirmed', 'rescheduled'].includes(s.status)) await sb.from('advisory_sessions').update({ status: 'cancelled' }).eq('id', s.id);
      break;
    case 'MEETING_ENDED':
      // Schedules the review request (worker, 2 hours later) and opens the advisor's Report 2 task
      await sb.from('advisory_sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', s.id).in('status', ['confirmed', 'rescheduled']);
      break;
  }
  return NextResponse.json({ ok: true });
}
