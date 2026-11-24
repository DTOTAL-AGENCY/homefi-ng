/* eslint-disable @typescript-eslint/no-explicit-any -- loosely typed form state / query builder */
import { supabaseAdmin } from '@/lib/supabase/server';
import { markContactHandled } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false } };

async function count(table: string, f?: (q: any) => any) {
  let q: any = supabaseAdmin().from(table as never).select('id', { count: 'exact', head: true });
  if (f) q = f(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminHome() {
  const day = new Date(Date.now() - 86400_000).toISOString();
  const week = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [estimates24, estimates7, accounts, failed, queued, sessions, pendingReviews, pendingAdvisors] = await Promise.all([
    count('applications', (q) => q.gte('submitted_at', day)),
    count('applications', (q) => q.gte('submitted_at', week)),
    count('applications', (q) => q.not('user_id', 'is', null)),
    count('reports', (q) => q.in('status', ['checks_failed', 'email_failed'])),
    count('reports', (q) => q.in('status', ['queued', 'generating'])),
    count('advisory_sessions', (q) => q.in('status', ['confirmed', 'rescheduled']).gte('start_at', new Date().toISOString())),
    count('reviews', (q) => q.eq('status', 'pending')),
    count('advisors', (q) => q.in('status', ['invited', 'pending_review'])),
  ]);
  const { data: contacts } = await supabaseAdmin().from('contact_messages').select('*').is('handled_at', null).order('created_at', { ascending: false }).limit(20);
  const tiles: Array<[string, number, boolean?]> = [
    ['Estimates, last 24 hours', estimates24],
    ['Estimates, last 7 days', estimates7],
    ['Claimed by an account', accounts],
    ['Reports in the queue', queued],
    ['Reports needing ops', failed, failed > 0],
    ['Upcoming sessions', sessions],
    ['Reviews to moderate', pendingReviews, pendingReviews > 0],
    ['Advisors to approve', pendingAdvisors, pendingAdvisors > 0],
  ];
  return (
    <div className="space-y-8">
      <h1 className="h-display text-4xl text-navy">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([l, v, warn]) => (
          <div key={l} className={`card ${warn ? 'border-danger/40' : ''}`}>
            <p className="num text-3xl font-extrabold text-navy">{v.toLocaleString('en-NG')}</p>
            <p className="text-sm text-muted">{l}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="text-xl font-bold text-navy">Contact messages</h2>
        {!contacts?.length ? <p className="mt-2 text-muted">Nothing waiting.</p> : (
          <ul className="mt-3 space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className="card">
                <p className="font-semibold text-navy">{c.name} · {c.email} · {c.topic}</p>
                <p className="mt-1 whitespace-pre-line text-muted">{c.message}</p>
                <form action={markContactHandled} className="mt-3"><input type="hidden" name="id" value={c.id} /><button className="btn-secondary !min-h-9 !py-1 text-sm">Mark handled</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
