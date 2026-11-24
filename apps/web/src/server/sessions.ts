import 'server-only';
import { randomBytes } from 'node:crypto';
import { SESSION, SITE } from '@/lib/config';
import { supabaseAdmin } from '@/lib/supabase/server';
import { AppError } from './applications';
import { cancelBooking, createBooking, getSlots, rescheduleBooking } from './cal';
import { enqueueEmail } from './jobs';
import { initialise, refund, verify } from './paystack';

const sb = () => supabaseAdmin();

/** Slots already held or booked on HomeFi for an advisor (so two people can't pay for one slot). */
async function takenSlots(advisorId: string): Promise<string[]> {
  const { data } = await sb()
    .from('advisory_sessions')
    .select('start_at, status, hold_expires_at')
    .eq('advisor_id', advisorId)
    .in('status', ['pending_payment', 'confirmed', 'rescheduled'])
    .gte('start_at', new Date().toISOString());
  return (data ?? [])
    .filter((s) => s.status !== 'pending_payment' || (s.hold_expires_at && new Date(s.hold_expires_at) > new Date()))
    .map((s) => s.start_at);
}

export async function advisorSlots(advisor: { id: string; calEventTypeId: number | null }, days = 14) {
  const from = new Date();
  const to = new Date(Date.now() + days * 24 * 3600_000);
  return getSlots(advisor.calEventTypeId, from, to, await takenSlots(advisor.id));
}

export async function nextSlot(advisor: { id: string; calEventTypeId: number | null }) {
  const slots = await advisorSlots(advisor, 14).catch(() => []);
  return slots[0]?.start ?? null;
}

/** Creates a pending session that holds the slot for 10 minutes, and a Paystack transaction. */
export async function startBooking(opts: {
  userId: string;
  advisorId: string;
  start: string;
  applicationId: string | null;
  topic: string | null;
  meetingType: 'video' | 'phone';
  currency: 'USD' | 'NGN';
  timezone: string;
}) {
  const db = sb();
  const { data: advisor } = await db.from('advisors').select('*').eq('id', opts.advisorId).eq('status', 'approved').maybeSingle();
  if (!advisor) throw new AppError(404, 'not_found', 'This advisor is not available.');
  const { data: profile } = await db.from('profiles').select('*').eq('id', opts.userId).single();
  if (!profile?.email) throw new AppError(409, 'no_email', 'Please add an email address in Settings.');

  const start = new Date(opts.start);
  if (Number.isNaN(start.getTime())) throw new AppError(422, 'bad_slot', 'Please pick a time.');
  const slots = await getSlots(advisor.cal_event_type_id, new Date(start.getTime() - 60_000), new Date(start.getTime() + 60_000), await takenSlots(advisor.id));
  if (!slots.some((s) => s.start === start.toISOString())) {
    throw new AppError(409, 'slot_taken', 'Someone just booked that time. Please pick another.');
  }

  let application = opts.applicationId;
  let reportId: string | null = null;
  if (application) {
    const { data: a } = await db.from('applications').select('id, user_id').eq('id', application).maybeSingle();
    if (a?.user_id !== opts.userId) application = null;
  }
  if (!application) {
    const { data: a } = await db
      .from('applications')
      .select('id')
      .eq('user_id', opts.userId)
      .not('status', 'in', '(draft,abandoned)')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    application = a?.id ?? null;
  }
  if (application) {
    const { data: r } = await db.from('reports').select('id').eq('application_id', application).order('report_number', { ascending: false }).limit(1).maybeSingle();
    reportId = r?.id ?? null;
  }

  const useNgn = opts.currency === 'NGN' && advisor.price_ngn_kobo;
  const amountMinor = useNgn ? Number(advisor.price_ngn_kobo) : advisor.price_usd_cents;
  const currency = useNgn ? 'NGN' : 'USD';
  const reference = `HF-SES-${randomBytes(8).toString('hex')}`;

  // Release this user's earlier unpaid holds so they don't block their own retry
  await db.from('advisory_sessions').update({ status: 'cancelled' }).eq('user_id', opts.userId).eq('status', 'pending_payment');

  const { data: payment, error: pErr } = await db
    .from('payments')
    .insert({ user_id: opts.userId, provider: 'paystack', provider_reference: reference, purpose: 'advisory_session', amount_minor: amountMinor, currency })
    .select('id')
    .single();
  if (pErr || !payment) throw new AppError(500, 'server_error', pErr?.message ?? 'payment insert failed');

  const { data: session, error } = await db
    .from('advisory_sessions')
    .insert({
      user_id: opts.userId,
      advisor_id: advisor.id,
      application_id: application,
      report_id: reportId,
      start_at: start.toISOString(),
      end_at: new Date(start.getTime() + SESSION.minutes * 60_000).toISOString(),
      timezone: opts.timezone || 'Africa/Lagos',
      meeting_type: opts.meetingType,
      topic: opts.topic?.slice(0, 300) || null,
      status: 'pending_payment',
      hold_expires_at: new Date(Date.now() + SESSION.holdMinutes * 60_000).toISOString(),
      payment_id: payment.id,
    })
    .select('id')
    .single();
  if (error || !session) {
    // Unique index on (advisor_id, start_at) for live sessions
    throw new AppError(409, 'slot_taken', 'Someone just booked that time. Please pick another.');
  }

  const { authorizationUrl } = await initialise({
    email: profile.email,
    amountMinor,
    currency,
    reference,
    callbackUrl: `${SITE.url}/app/book/callback`,
    metadata: { sessionId: session.id, advisorId: advisor.id },
  });
  return { sessionId: session.id, authorizationUrl, reference };
}

/**
 * Called by the Paystack webhook and the checkout callback. Idempotent: verifies the
 * charge with Paystack, then creates the Cal.com booking and confirms the session.
 */
export async function confirmPayment(reference: string): Promise<{ sessionId: string | null; status: string }> {
  const db = sb();
  const { data: payment } = await db.from('payments').select('*').eq('provider_reference', reference).maybeSingle();
  if (!payment) throw new AppError(404, 'not_found', 'Unknown payment.');
  const { data: session } = await db.from('advisory_sessions').select('*').eq('payment_id', payment.id).maybeSingle();
  if (!session) throw new AppError(404, 'not_found', 'Unknown session.');
  if (['confirmed', 'rescheduled', 'completed', 'refunded'].includes(session.status)) return { sessionId: session.id, status: session.status };

  const v = await verify(reference, { amount: Number(payment.amount_minor), currency: payment.currency });
  if (v.status !== 'success' || v.amount !== Number(payment.amount_minor) || v.currency !== payment.currency) {
    await db.from('payments').update({ status: 'failed', raw: v.raw as never }).eq('id', payment.id);
    return { sessionId: session.id, status: 'payment_failed' };
  }
  await db.from('payments').update({ status: 'success', paid_at: new Date().toISOString(), raw: v.raw as never }).eq('id', payment.id);

  const [{ data: profile }, { data: advisor }] = await Promise.all([
    db.from('profiles').select('*').eq('id', session.user_id).single(),
    db.from('advisors').select('*').eq('id', session.advisor_id).single(),
  ]);

  // The hold may have lapsed while the user was paying; re-check the slot is still free
  const { data: clash } = await db
    .from('advisory_sessions')
    .select('id')
    .eq('advisor_id', session.advisor_id)
    .eq('start_at', session.start_at)
    .in('status', ['confirmed', 'rescheduled'])
    .neq('id', session.id)
    .limit(1);

  let booking: Awaited<ReturnType<typeof createBooking>> | null = null;
  if (!clash?.length) {
    booking = await createBooking({
      eventTypeId: advisor?.cal_event_type_id ?? null,
      start: session.start_at,
      attendee: { name: `${profile?.first_name} ${profile?.last_name}`.trim(), email: profile?.email ?? '', timeZone: session.timezone, phone: profile?.phone_e164 },
      meetingType: session.meeting_type as 'video' | 'phone',
      metadata: { sessionId: session.id, reportId: session.report_id ?? '', reportUrl: session.report_id ? `${SITE.url}/advisor/sessions/${session.id}` : '' },
    }).catch(() => null);
  }

  if (!booking) {
    await refund(reference).catch(() => null);
    await db.from('payments').update({ status: 'refunded' }).eq('id', payment.id);
    await db.from('advisory_sessions').update({ status: 'refunded' }).eq('id', session.id);
    await enqueueEmail({
      template: 'ops_alert',
      to: process.env.OPS_ALERT_EMAIL ?? SITE.supportEmail,
      data: { subject: 'Paid session could not be booked; refunded', body: `Session ${session.id}, reference ${reference}` },
    });
    return { sessionId: session.id, status: 'slot_taken_refunded' };
  }

  const { error } = await db
    .from('advisory_sessions')
    .update({ status: 'confirmed', cal_booking_uid: booking.uid, meeting_url: booking.meetingUrl, hold_expires_at: null })
    .eq('id', session.id);
  if (error) throw new AppError(500, 'server_error', error.message);
  if (session.application_id) {
    await db.from('applications').update({ status: 'advisory_booked' }).eq('id', session.application_id).in('status', ['claimed', 'report_sent']);
  }

  const start = new Date(session.start_at);
  const f = (opts: Intl.DateTimeFormatOptions, tz = session.timezone) => start.toLocaleString('en-GB', { ...opts, timeZone: tz });
  if (profile?.email) {
    await enqueueEmail({
      template: 'booking_confirmed',
      to: profile.email,
      userId: session.user_id,
      applicationId: session.application_id,
      data: {
        firstName: profile.first_name,
        advisorName: advisor?.display_name,
        date: f({ weekday: 'long', day: 'numeric', month: 'long' }),
        time: f({ hour: '2-digit', minute: '2-digit' }),
        timezone: session.timezone,
        watTime: f({ hour: '2-digit', minute: '2-digit' }, 'Africa/Lagos'),
        meetingUrl: booking.meetingUrl,
        manageUrl: `${SITE.url}/app/sessions#${session.id}`,
      },
    });
  }
  return { sessionId: session.id, status: 'confirmed' };
}

export async function cancelSession(sessionId: string, userId: string) {
  const db = sb();
  const { data: s } = await db.from('advisory_sessions').select('*, payments(provider_reference)').eq('id', sessionId).maybeSingle();
  if (!s || s.user_id !== userId) throw new AppError(404, 'not_found', 'Not found.');
  if (!['confirmed', 'rescheduled'].includes(s.status)) throw new AppError(409, 'not_cancellable', 'This session can no longer be cancelled.');
  const hoursBefore = (new Date(s.start_at).getTime() - Date.now()) / 3600_000;
  const refundable = hoursBefore >= SESSION.refundWindowHours;
  if (s.cal_booking_uid) await cancelBooking(s.cal_booking_uid, 'Cancelled by applicant on HomeFi');
  const ref = (s.payments as unknown as { provider_reference: string } | null)?.provider_reference;
  if (refundable && ref) {
    await refund(ref);
    await db.from('payments').update({ status: 'refunded' }).eq('provider_reference', ref);
  }
  await db.from('advisory_sessions').update({ status: refundable ? 'refunded' : 'cancelled' }).eq('id', s.id);
  return { refunded: refundable };
}

export async function rescheduleSession(sessionId: string, userId: string, start: string) {
  const db = sb();
  const { data: s } = await db.from('advisory_sessions').select('*').eq('id', sessionId).maybeSingle();
  if (!s || s.user_id !== userId) throw new AppError(404, 'not_found', 'Not found.');
  if (!['confirmed', 'rescheduled'].includes(s.status)) throw new AppError(409, 'not_reschedulable', 'This session can no longer be moved.');
  const { data: advisor } = await db.from('advisors').select('id, cal_event_type_id').eq('id', s.advisor_id).single();
  const when = new Date(start);
  const slots = await getSlots(advisor?.cal_event_type_id ?? null, new Date(when.getTime() - 60_000), new Date(when.getTime() + 60_000), await takenSlots(s.advisor_id));
  if (!slots.some((x) => x.start === when.toISOString())) throw new AppError(409, 'slot_taken', 'Someone just booked that time. Please pick another.');
  const b = s.cal_booking_uid ? await rescheduleBooking(s.cal_booking_uid, when.toISOString()) : null;
  await db
    .from('advisory_sessions')
    .update({
      start_at: when.toISOString(),
      end_at: new Date(when.getTime() + SESSION.minutes * 60_000).toISOString(),
      status: 'rescheduled',
      cal_booking_uid: b?.uid ?? s.cal_booking_uid,
      meeting_url: b?.meetingUrl ?? s.meeting_url,
      reminder_24h_sent_at: null,
      reminder_1h_sent_at: null,
    })
    .eq('id', s.id);
  return { ok: true };
}
