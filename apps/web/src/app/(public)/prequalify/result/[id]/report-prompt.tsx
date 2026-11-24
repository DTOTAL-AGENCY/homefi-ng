'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/components/analytics';

interface Props {
  applicationId: string;
  signedIn: boolean;
  claimed: boolean;
  reportId: string | null;
  headlineBand: number;
  variant: string;
  productsEligible: number;
  prefill: { firstName: string; lastName: string; phone: string };
}

const band = (kobo: number) => {
  const m = kobo / 100 / 1_000_000;
  return m < 10 ? 'lt10m' : m < 20 ? '10to20m' : m < 30 ? '20to30m' : m < 50 ? '30to50m' : m < 75 ? '50to75m' : m < 100 ? '75to100m' : 'gt100m';
};

export function ReportPrompt(p: Props) {
  const router = useRouter();
  const [state, setState] = useState<'ask' | 'not_now' | 'claiming' | 'done'>(p.claimed ? 'done' : 'ask');
  const [exitIntent, setExitIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownExit = useRef(false);

  useEffect(() => {
    track('estimate_viewed', { headline_band: band(p.headlineBand), products_eligible: p.productsEligible, variant: p.variant });
    try {
      localStorage.removeItem('hf_prequal_v1');
    } catch {}
  }, [p.headlineBand, p.productsEligible, p.variant]);

  // Exit intent on desktop: once, when the pointer leaves through the top
  useEffect(() => {
    if (p.claimed) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !shownExit.current && window.innerWidth >= 1024) {
        shownExit.current = true;
        setExitIntent(true);
      }
    };
    document.addEventListener('mouseout', onLeave);
    return () => document.removeEventListener('mouseout', onLeave);
  }, [p.claimed]);

  async function answer(a: 'yes' | 'not_now') {
    track('report_prompt_answered', { answer: a });
    void fetch(`/api/v1/prequal/applications/${p.applicationId}/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answer: a }),
    });
    if (a === 'not_now') return setState('not_now');
    if (p.signedIn) return claimNow();
    const qs = new URLSearchParams({
      application: p.applicationId,
      first: p.prefill.firstName,
      last: p.prefill.lastName,
      phone: p.prefill.phone,
    });
    router.push(`/signup?${qs}`);
  }

  async function claimNow() {
    setState('claiming');
    setError(null);
    const res = await fetch(`/api/v1/prequal/applications/${p.applicationId}/claim`, { method: 'POST' });
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setError(b?.error?.message ?? 'Something went wrong on our side. Please try again.');
      setState('ask');
      return;
    }
    router.push('/app');
  }

  if (state === 'done') {
    return (
      <section className="card mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy">This estimate is saved to your account.</h2>
          <p className="mt-1 text-muted">Your full report is in your dashboard.</p>
        </div>
        <Link href="/app" className="btn-primary">Go to dashboard</Link>
      </section>
    );
  }

  return (
    <>
      <section className="card mt-8 border-2 border-gold" aria-labelledby="pdf-h">
        {state === 'not_now' ? (
          <>
            <h2 id="pdf-h" className="text-xl font-bold text-navy">No problem.</h2>
            <p className="mt-2 text-muted">
              Your estimate is saved on this device for 30 days. When you&apos;re ready, you can get the full report or talk to an advisor.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => answer('yes')}>Get my report</button>
              <Link href="/advisors" className="btn-secondary">Talk to an advisor</Link>
            </div>
          </>
        ) : (
          <>
            <h2 id="pdf-h" className="text-xl font-bold text-navy">Want your full report as a PDF?</h2>
            <p className="mt-2 text-muted">
              Your free Mortgage Prequalification Report breaks down each option, the deposit you&apos;ll need, the documents lenders will ask
              for and your next steps. Create a free account and we&apos;ll email it to you in a few minutes.
            </p>
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-primary" disabled={state === 'claiming'} onClick={() => answer('yes')}>
                {state === 'claiming' ? 'Sending…' : 'Yes, send my report'}
              </button>
              <button className="btn-secondary" onClick={() => answer('not_now')}>Not now</button>
            </div>
          </>
        )}
      </section>

      {exitIntent && state !== 'claiming' && (
        <div role="dialog" aria-modal="true" aria-labelledby="exit-h" className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
          <div className="card max-w-md">
            <h2 id="exit-h" className="text-xl font-bold text-navy">Before you go</h2>
            <p className="mt-2 text-muted">Get your full report free, so you have your numbers when you speak to a bank.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => { setExitIntent(false); void answer('yes'); }}>Send my report</button>
              <button className="btn-secondary" onClick={() => setExitIntent(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
