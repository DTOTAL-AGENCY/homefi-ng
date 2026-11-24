import Link from 'next/link';
import type { Metadata } from 'next';
import { SessionTime } from '@/components/session-time';
import { currentProfile } from '@/lib/supabase/server';
import { loadDashboard } from '@/server/dashboard';
import { SessionActions } from './session-actions';

export const metadata: Metadata = { title: 'My sessions', robots: { index: false } };
export const dynamic = 'force-dynamic';

const LABEL: Record<string, string> = {
  confirmed: 'Booked', rescheduled: 'Rescheduled', completed: 'Completed', cancelled: 'Cancelled', refunded: 'Cancelled and refunded', no_show: 'Missed',
};

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ booked?: string }> }) {
  const { booked } = await searchParams;
  const me = (await currentProfile())!;
  const d = await loadDashboard(me.id);
  const sessions = d.sessions.filter((s) => s.status !== 'pending_payment' && !(s.status === 'cancelled' && !s.cal_booking_uid));
  const just = booked ? sessions.find((s) => s.id === booked) : null;
  return (
    <div className="space-y-6">
      {just && (
        <section className="rounded-2xl bg-navy p-6 text-cream" role="status">
          <h1 className="h-display text-4xl">You&apos;re booked!</h1>
          <p className="mt-2 text-cream/90">
            {just.advisor?.display_name} will see you on <SessionTime iso={just.start_at} />. We&apos;ve sent the invite and meeting link to {me.email}.{' '}
            {just.advisor?.display_name.split(' ')[0]} already has your report, so you can get straight to your questions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn-primary" href={`/api/v1/sessions/${just.id}/ics`}>Add to calendar</a>
            <Link className="btn-on-navy" href="/app">Go to dashboard</Link>
          </div>
        </section>
      )}
      <h2 className="h-display text-3xl text-navy">My sessions</h2>
      {sessions.length === 0 ? (
        <div className="card">
          <p className="text-navy">No sessions booked yet. A 30 minute session is the fastest way to know your next step.</p>
          <Link href="/app/advisors" className="btn-primary mt-4">Choose my advisor</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id} id={s.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">Session with {s.advisor?.display_name}</p>
                  <p className="text-sm text-muted"><SessionTime iso={s.start_at} /></p>
                </div>
                <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-navy">{LABEL[s.status] ?? s.status}</span>
              </div>
              <SessionActions id={s.id} status={s.status} meetingUrl={s.meeting_url} advisorSlug={s.advisor?.slug ?? ''} startAt={s.start_at} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
