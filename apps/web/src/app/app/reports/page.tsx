import Link from 'next/link';
import type { Metadata } from 'next';
import { currentProfile } from '@/lib/supabase/server';
import { loadDashboard } from '@/server/dashboard';

export const metadata: Metadata = { title: 'My reports', robots: { index: false } };
export const dynamic = 'force-dynamic';

const STATUS: Record<string, string> = {
  queued: 'On its way',
  generating: 'On its way',
  ready: 'Ready',
  emailed: 'Emailed',
  checks_failed: 'Being reviewed',
  email_failed: 'Email not delivered',
};

export default async function ReportsPage() {
  const me = (await currentProfile())!;
  const d = await loadDashboard(me.id);
  const reports = d.applications.flatMap((a) => a.reports.map((r) => ({ ...r, applicationId: a.id })));
  return (
    <div>
      <h1 className="h-display text-4xl text-navy">My reports</h1>
      {reports.length === 0 ? (
        <div className="card mt-6">
          <p className="text-navy">You don&apos;t have a report yet. Get prequalified and we&apos;ll email you one.</p>
          <Link href="/prequalify" className="btn-primary mt-4">Get Prequalified</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/app/reports/${r.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-navy">
                <span>
                  <span className="block font-bold text-navy">{r.report_number === 1 ? '1st' : '2nd'} Mortgage Prequalification Report</span>
                  <span className="num text-sm text-muted">Ref {r.reference_code}</span>
                </span>
                <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold text-navy">{STATUS[r.status] ?? r.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
