import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AdvisorAvatar, NEW_ADVISOR_THRESHOLD } from '@/components/advisor-card';
import { SlotPreview } from '@/components/slot-picker';
import { LANGUAGE_LABELS, SPECIALISM_LABELS } from '@/content/site';
import { advisorBySlug, publishedReviews } from '@/server/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await advisorBySlug((await params).slug);
  return a ? { title: `${a.displayName}, Mortgage Advisor`, description: a.bioShort } : {};
}

function Info({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <div className="rounded-xl bg-cream p-4">
      <p className="num text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-sm font-semibold text-navy">
        {label}{' '}
        <span className="cursor-help text-muted" title={help} aria-label={help}>ⓘ</span>
      </p>
    </div>
  );
}

export default async function AdvisorProfile({ params }: { params: Promise<{ slug: string }> }) {
  const a = await advisorBySlug((await params).slug);
  if (!a) notFound();
  const reviews = await publishedReviews(a.id);
  const s = a.stats;
  return (
    <div className="pb-24 lg:pb-0">
      <section className="bg-navy text-cream">
        <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center">
          <AdvisorAvatar advisor={a} size={96} />
          <div className="flex-1">
            <h1 className="h-display text-4xl">{a.displayName}</h1>
            <p className="mt-1 text-cream/85">{a.headline}</p>
            <p className="num mt-2 text-sm">
              {s.reviewCount > 0 ? <>★ {s.avgRating?.toFixed(1)} ({s.reviewCount})</> : 'No reviews yet'}
            </p>
          </div>
          <Link href={`/app/book/${a.slug}`} className="btn-primary hidden lg:inline-flex">Book a session</Link>
        </div>
      </section>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-navy">About</h2>
            <p className="mt-2 whitespace-pre-line text-muted">{a.bioLong ?? a.bioShort}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {a.specialisms.map((x) => <li key={x} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-navy">{SPECIALISM_LABELS[x] ?? x}</li>)}
            </ul>
            <p className="mt-3 text-sm text-muted">Covers: {a.statesCovered.join(', ') || 'All states'}</p>
            <p className="text-sm text-muted">Speaks: {a.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-navy">Track record</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {s.mortgagesDecided < NEW_ADVISOR_THRESHOLD ? (
                <div className="rounded-xl bg-cream p-4 sm:col-span-2"><p className="font-bold text-navy">New to HomeFi</p><p className="text-sm text-muted">Track record shows after 5 lender decisions.</p></div>
              ) : (
                <>
                  <Info label="Mortgages processed" value={String(s.mortgagesDecided)} help="Applications this advisor took to a lender decision through HomeFi." />
                  <Info label="Approval rate" value={`${s.approvalRate}%`} help="Approved ÷ decided. Shown after 5 decisions." />
                </>
              )}
              <Info label="Sessions held" value={String(s.sessionsCompleted)} help="Completed advisory sessions on HomeFi." />
              {a.yearsExperience != null && <Info label="Years of experience" value={String(a.yearsExperience)} help="Stated by the advisor and checked by HomeFi." />}
            </div>
            {a.credentials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {a.credentials.filter((c) => c.verified_at).map((c) => (
                  <li key={c.name} title={`Checked by HomeFi on ${new Date(c.verified_at!).toLocaleDateString('en-GB')}.`} className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-sm font-semibold text-success">✓ {c.name}</li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-xl font-bold text-navy">Verified reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-muted">No reviews yet. Reviews come only from applicants who completed a session.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="card">
                    <p className="text-gold-700" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}</p>
                    {r.title && <p className="mt-1 font-bold text-navy">{r.title}</p>}
                    {r.body && <p className="mt-1 text-muted">{r.body}</p>}
                    <p className="mt-2 text-sm text-navy">
                      {r.reviewer}{r.location ? `, ${r.location}` : ''} · {r.publishedAt && new Date(r.publishedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · <span className="font-semibold text-success">Verified session</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="card">
            <h2 className="text-lg font-bold text-navy">Availability</h2>
            <SlotPreview slug={a.slug} />
            <p className="num mt-4 font-semibold text-navy">Session: USD {a.priceUsdCents / 100} · 30 minutes</p>
            <Link href={`/app/book/${a.slug}`} className="btn-primary mt-4 w-full">Book a session</Link>
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-line bg-white px-4 py-3 lg:hidden">
        <span className="num font-semibold text-navy">USD {a.priceUsdCents / 100} · 30 min</span>
        <Link href={`/app/book/${a.slug}`} className="btn-primary !min-h-11">Book session</Link>
      </div>
    </div>
  );
}
