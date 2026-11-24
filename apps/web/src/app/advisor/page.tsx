import { currentProfile, supabaseAdmin } from '@/lib/supabase/server';
import { SessionTime } from '@/components/session-time';
import { markNoShow, saveNotes } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Advisor portal', robots: { index: false } };

export default async function AdvisorHome() {
  const me = (await currentProfile())!;
  const db = supabaseAdmin();
  const { data: adv } = await db.from('advisors').select('id, display_name').eq('user_id', me.id).maybeSingle();
  if (!adv) return <p className="text-muted">No advisor profile is linked to this account.</p>;
  const { data: sessions } = await db
    .from('advisory_sessions')
    .select('id, start_at, status, topic, meeting_url, meeting_type, advisor_notes, report_id, profiles:user_id(first_name, last_name, phone_e164), applications(reference_code, is_joint, residence, estimate)')
    .eq('advisor_id', adv.id)
    .in('status', ['confirmed', 'rescheduled', 'completed', 'no_show'])
    .order('start_at', { ascending: true });
  const now = Date.now();
  const upcoming = (sessions ?? []).filter((s) => new Date(s.start_at).getTime() > now - 3600_000 && s.status !== 'completed');
  const past = (sessions ?? []).filter((s) => !upcoming.includes(s)).reverse();
  const Item = ({ s }: { s: NonNullable<typeof sessions>[number] }) => {
    const p = s.profiles as unknown as { first_name: string; last_name: string; phone_e164: string | null } | null;
    const a = s.applications as unknown as { reference_code: string; is_joint: boolean; residence: string; estimate: { headline?: { display: string } } | null } | null;
    return (
      <li className="card">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="font-bold text-navy">{p?.first_name} {p?.last_name}{a?.is_joint ? ' (joint)' : ''} · <SessionTime iso={s.start_at} /></p>
          <span className="rounded-full bg-cream px-3 py-1 text-sm">{s.status}</span>
        </div>
        <p className="text-sm text-muted">{a?.reference_code} · {a?.residence} · estimate {a?.estimate?.headline?.display ?? '-'} · {s.meeting_type === 'phone' ? `Phone: ${p?.phone_e164 ?? ''}` : 'Google Meet'}</p>
        {s.topic && <p className="mt-2 text-navy">&ldquo;{s.topic}&rdquo;</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {s.meeting_url && <a className="btn-primary !min-h-9 !py-1 text-sm" href={s.meeting_url} target="_blank" rel="noopener">Join call</a>}
          {s.report_id && <a className="btn-secondary !min-h-9 !py-1 text-sm" href={`/api/v1/reports/${s.report_id}/download?redirect=1`}>Open report</a>}
          {['confirmed', 'rescheduled'].includes(s.status) && new Date(s.start_at).getTime() < now && (
            <form action={markNoShow}><input type="hidden" name="id" value={s.id} /><button className="btn-secondary !min-h-9 !py-1 text-sm">Mark no-show</button></form>
          )}
        </div>
        <form action={saveNotes} className="mt-3">
          <input type="hidden" name="id" value={s.id} />
          <textarea name="notes" rows={3} className="input" placeholder="Session notes (private to HomeFi)" defaultValue={s.advisor_notes ?? ''} />
          <button className="btn-secondary mt-2 !min-h-9 !py-1 text-sm">Save notes</button>
        </form>
      </li>
    );
  };
  return (
    <div className="space-y-8">
      <h1 className="h-display text-4xl text-navy">Hello, {adv.display_name.split(' ')[0]}</h1>
      <section><h2 className="text-xl font-bold text-navy">Upcoming</h2>{upcoming.length ? <ul className="mt-3 space-y-3">{upcoming.map((s) => <Item key={s.id} s={s} />)}</ul> : <p className="mt-2 text-muted">No upcoming sessions.</p>}</section>
      <section><h2 className="text-xl font-bold text-navy">Past</h2>{past.length ? <ul className="mt-3 space-y-3">{past.map((s) => <Item key={s.id} s={s} />)}</ul> : <p className="mt-2 text-muted">None yet.</p>}</section>
      <p className="text-sm text-muted">The 2nd (precise) report and document checklists arrive in Phase 2.</p>
    </div>
  );
}
