import 'server-only';
import { unstable_cache } from 'next/cache';

/**
 * Cal.com API v2. Each advisor has a Cal.com user and a 30 minute event type
 * (advisors.cal_event_type_id). Bookings are created only after payment succeeds.
 * Without CAL_API_KEY (local dev) a mock calendar is used: weekdays 09:00-17:00 WAT.
 */
const BASE = 'https://api.cal.com/v2';
const live = () => !!process.env.CAL_API_KEY;
const headers = (version: string) => ({
  authorization: `Bearer ${process.env.CAL_API_KEY}`,
  'cal-api-version': version,
  'content-type': 'application/json',
});

export interface Slot {
  start: string; // ISO UTC
}

function mockSlots(from: Date, to: Date, taken: Set<string>): Slot[] {
  const out: Slot[] = [];
  const d = new Date(from);
  d.setUTCMinutes(0, 0, 0);
  while (d < to) {
    const watHour = (d.getUTCHours() + 1) % 24;
    const day = new Date(d.getTime() + 3600_000).getUTCDay();
    if (day >= 1 && day <= 5 && watHour >= 9 && watHour < 17 && d.getTime() > Date.now() + 3 * 3600_000) {
      const iso = d.toISOString();
      if (!taken.has(iso)) out.push({ start: iso });
    }
    d.setUTCMinutes(d.getUTCMinutes() + 30);
  }
  return out;
}

async function fetchSlots(eventTypeId: number, fromIso: string, toIso: string): Promise<Slot[]> {
  const url = new URL(`${BASE}/slots`);
  url.searchParams.set('eventTypeId', String(eventTypeId));
  url.searchParams.set('start', fromIso);
  url.searchParams.set('end', toIso);
  url.searchParams.set('timeZone', 'UTC');
  const res = await fetch(url, { headers: headers('2024-09-04') });
  if (!res.ok) throw new Error(`cal slots ${res.status}`);
  const body = (await res.json()) as { data: Record<string, Array<{ start: string }>> };
  return Object.values(body.data ?? {})
    .flat()
    .map((s) => ({ start: new Date(s.start).toISOString() }));
}

const cachedSlots = unstable_cache(fetchSlots, ['cal-slots'], { revalidate: 60 });

/** Open slots, minus anything held or booked on HomeFi. Cached 60 seconds. */
export async function getSlots(eventTypeId: number | null, from: Date, to: Date, takenIso: string[]): Promise<Slot[]> {
  const taken = new Set(takenIso.map((t) => new Date(t).toISOString()));
  if (!live() || !eventTypeId) return mockSlots(from, to, taken);
  // Round the window so the cache key is shared between viewers
  const f = new Date(Math.floor(from.getTime() / 3600_000) * 3600_000).toISOString();
  const t = new Date(Math.ceil(to.getTime() / 3600_000) * 3600_000).toISOString();
  const slots = await cachedSlots(eventTypeId, f, t);
  return slots.filter((s) => !taken.has(s.start) && new Date(s.start) >= from);
}

export interface CalBooking {
  uid: string;
  meetingUrl: string | null;
}

export async function createBooking(opts: {
  eventTypeId: number | null;
  start: string;
  attendee: { name: string; email: string; timeZone: string; phone?: string | null };
  meetingType: 'video' | 'phone';
  metadata: Record<string, string>;
}): Promise<CalBooking> {
  if (!live() || !opts.eventTypeId) {
    return { uid: `mock_${opts.metadata.sessionId}`, meetingUrl: opts.meetingType === 'video' ? `https://meet.google.com/mock-${opts.metadata.sessionId.slice(0, 8)}` : null };
  }
  const res = await fetch(`${BASE}/bookings`, {
    method: 'POST',
    headers: headers('2024-08-13'),
    body: JSON.stringify({
      start: opts.start,
      eventTypeId: opts.eventTypeId,
      attendee: { name: opts.attendee.name, email: opts.attendee.email, timeZone: opts.attendee.timeZone, ...(opts.attendee.phone ? { phoneNumber: opts.attendee.phone } : {}) },
      ...(opts.meetingType === 'phone' && opts.attendee.phone ? { location: { type: 'attendeePhone', phone: opts.attendee.phone } } : {}),
      metadata: opts.metadata,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: { uid: string; meetingUrl?: string; location?: string } };
  if (!res.ok || !body.data) throw new Error(`cal booking ${res.status}`);
  const loc = body.data.meetingUrl ?? body.data.location ?? null;
  return { uid: body.data.uid, meetingUrl: loc && loc.startsWith('http') ? loc : null };
}

export async function cancelBooking(uid: string, reason: string) {
  if (!live() || uid.startsWith('mock_')) return;
  await fetch(`${BASE}/bookings/${uid}/cancel`, { method: 'POST', headers: headers('2024-08-13'), body: JSON.stringify({ cancellationReason: reason }) });
}

export async function rescheduleBooking(uid: string, start: string): Promise<CalBooking> {
  if (!live() || uid.startsWith('mock_')) return { uid, meetingUrl: null };
  const res = await fetch(`${BASE}/bookings/${uid}/reschedule`, { method: 'POST', headers: headers('2024-08-13'), body: JSON.stringify({ start }) });
  const body = (await res.json().catch(() => ({}))) as { data?: { uid: string; meetingUrl?: string } };
  if (!res.ok || !body.data) throw new Error(`cal reschedule ${res.status}`);
  return { uid: body.data.uid, meetingUrl: body.data.meetingUrl ?? null };
}
