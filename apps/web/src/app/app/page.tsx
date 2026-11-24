import Link from 'next/link';
import type { Metadata } from 'next';
import { formatNaira } from '@homefi/engine';
import { currentProfile } from '@/lib/supabase/server';
import { loadDashboard, TRACKER } from '@/server/dashboard';
import { AutoRefresh, EmailBanner, ReportActions } from './client-bits';
import { SessionTime } from '@/components/session-time';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };
export const dynamic = 'force-dynamic';

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default async function DashboardPage() {
  const me = (await currentProfile())!;
  const d = await loadDashboard(me.id);
  const latest = d.latest;
  const report = latest?.reports.find((r) => r.report_number === 1) ?? null;
  const pending = report && ['queued', 'generating', 'ready'].includes(report.status) && report.status !== 'ready';

  return (
    <div className="space-y-6">
      <h1 className="h-display text-4xl text-navy">Welcome, {me.first_name || 'there'}.</h1>

      {!d.profile?.email_verified_at && latest && <EmailBanner />}
      {d.profile?.email_bounced_at && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
          We couldn&apos;t deliver your report to {me.email}. Please check it in <Link href="/app/settings" className="underline">Settings</Link>, and we&apos;ll resend.
        </p>
      )}

      {!latest && (
        <section className="card">
          <p className="text-lg text-navy">You haven&apos;t been prequalified yet. It takes under 5 minutes.</p>
          <Link href="/prequalify" className="btn-primary mt-5">Get Prequalified</Link>
        </section>
      )}

      {latest && report && (
        <section className="card" aria-live="polite">
          {pending ? (
            <>
              <AutoRefresh seconds={8} />
              <h2 className="text-xl font-bold text-navy">Your report is on its way.</h2>
              <p className="mt-2 text-muted">
                We&apos;re preparing your Mortgage Prequalification Report. It usually takes 2 to 3 minutes and we&apos;ll email it to {me.email}.
              </p>
            </>
          ) : report.status === 'checks_failed' ? (
            <>
              <h2 className="text-xl font-bold text-navy">Your report is being reviewed.</h2>
              <p className="mt-2 text-muted">
                Your report is being reviewed by our team to make sure every figure is right. You&apos;ll have it within 24 hours.
              </p>
            </>
          ) : (
            <>
              <p className="num text-sm font-semibold text-muted">
                1st Mortgage Prequalification Report · Ref {report.reference_code} · {fmtDate(report.generated_at ?? report.created_at)}
              </p>
              {latest.estimate?.headline && (
                <p className="mt-2 text-2xl font-bold text-navy">
                  You could access up to <span className="num">{formatNaira(latest.estimate.headline.displayKobo)}</span>.
                </p>
              )}
              <ReportActions reportId={report.id} applicationId={latest.id} />
            </>
          )}
        </section>
      )}

      {latest && !latest.reports.length && (
        <section className="card">
          <h2 className="text-xl font-bold text-navy">Your estimate is saved.</h2>
          <p className="mt-2 text-muted">Ref {latest.referenceCode}</p>
          <Link href={`/prequalify/result/${latest.id}`} className="btn-secondary mt-4">View estimate</Link>
        </section>
      )}

      {d.upcoming && (
        <section className="card">
          <h2 className="text-lg font-bold text-navy">
            Your session with {d.upcoming.advisor?.display_name} · <SessionTime iso={d.upcoming.start_at} />
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {d.upcoming.meeting_url && <a href={d.upcoming.meeting_url} className="btn-primary" target="_blank" rel="noopener">Join call</a>}
            <Link href={`/app/sessions#${d.upcoming.id}`} className="btn-secondary">Reschedule</Link>
          </div>
        </section>
      )}

      {latest && !d.upcoming && d.tracker.stage === 0 && (
        <section className="rounded-2xl bg-navy p-6 text-cream">
          <h2 className="text-xl font-bold">Book your 1-on-1 Mortgage Advisory Session.</h2>
          <p className="mt-2 text-cream/85">30 minutes with a HomeFi Mortgage Advisor. You&apos;ll get:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-cream/90">
            <li>A walk through your report and the options that suit you best</li>
            <li>A more precise 2nd report based on your exact income</li>
            <li>Advice on the right property in your preferred location</li>
            <li>Your exact next steps to get approved faster</li>
          </ul>
          <Link href="/app/advisors" className="btn-primary mt-5">Choose my advisor</Link>
        </section>
      )}

      {latest && (
        <section className="card" aria-labelledby="tracker-h">
          <h2 id="tracker-h" className="text-lg font-bold text-navy">Your progress</h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-6">
            {TRACKER.map((t, i) => (
              <li
                key={t}
                aria-current={i === d.tracker.stage ? 'step' : undefined}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  i < d.tracker.stage ? 'bg-success/10 text-success' : i === d.tracker.stage ? 'bg-gold text-navy' : 'bg-cream text-muted'
                }`}
              >
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted">
            You are here: {d.tracker.label}. Next: {d.tracker.next}
          </p>
        </section>
      )}

      {latest && (
        <p className="text-sm">
          <Link href="/prequalify/new" className="font-semibold text-navy underline underline-offset-4">
            Circumstances changed? Start a new estimate
          </Link>
        </p>
      )}
    </div>
  );
}
