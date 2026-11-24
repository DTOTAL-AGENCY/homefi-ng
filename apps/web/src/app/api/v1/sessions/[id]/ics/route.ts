import { ERR } from '@/server/api';
import { callerFromSession } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** "Add to calendar" file for a booked session. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const { data: s } = await supabaseAdmin().from('advisory_sessions').select('*, advisors(display_name)').eq('id', (await ctx.params).id).maybeSingle();
  if (!s || s.user_id !== userId) return ERR.notFound();
  const name = (s.advisors as unknown as { display_name: string } | null)?.display_name ?? 'your advisor';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HomeFi//Sessions//EN', 'BEGIN:VEVENT',
    `UID:${s.id}@homefi.ng`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(s.start_at)}`, `DTEND:${stamp(s.end_at)}`,
    `SUMMARY:HomeFi Mortgage Advisory Session with ${name}`,
    s.meeting_url ? `LOCATION:${s.meeting_url}` : 'LOCATION:Phone or WhatsApp call',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return new Response(ics, { headers: { 'content-type': 'text/calendar', 'content-disposition': 'attachment; filename="homefi-session.ics"' } });
}
