'use client';

import { useState } from 'react';
import { SlotPicker } from '@/components/slot-picker';
import { track } from '@/components/analytics';
import { formatNaira } from '@homefi/engine';

interface Props {
  advisor: { id: string; slug: string; name: string; firstName: string; priceUsdCents: number; priceNgnKobo: number | null };
  reports: Array<{ id: string; referenceCode: string; applicationId: string }>;
  email: string;
}

export function BookingFlow({ advisor, reports }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [start, setStart] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState(reports[0]?.applicationId ?? null);
  const [topic, setTopic] = useState('');
  const [meetingType, setMeetingType] = useState<'video' | 'phone'>('video');
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const zone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Africa/Lagos';

  async function pay() {
    if (!start) return;
    setBusy(true);
    setError(null);
    track('booking_started', { advisor_id: advisor.id, currency });
    const res = await fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ advisorId: advisor.id, start, applicationId, topic: topic || undefined, meetingType, currency, timezone: zone }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setBusy(false);
      if (body?.error?.code === 'slot_taken') {
        setStart(null);
        setStep(1);
      }
      return setError(body?.error?.message ?? 'Something went wrong on our side. Please try again.');
    }
    window.location.href = body.authorizationUrl;
  }

  const when = start
    ? new Date(start).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: zone })
    : '';

  return (
    <div className="mx-auto max-w-2xl">
      {step === 1 ? (
        <>
          <h1 className="h-display text-4xl text-navy">Pick a time with {advisor.firstName}</h1>
          {error && <p className="field-error mt-3" role="alert">{error}</p>}
          <div className="card mt-6">
            <SlotPicker slug={advisor.slug} value={start} onChange={setStart} firstName={advisor.firstName} />
          </div>
          <button className="btn-primary mt-6" disabled={!start} onClick={() => setStep(2)}>Continue</button>
        </>
      ) : (
        <>
          <h1 className="h-display text-4xl text-navy">Confirm your session</h1>
          <div className="card mt-6 space-y-6">
            {reports.length > 0 && (
              <label className="block">
                <span className="field-label">Which report should {advisor.firstName} review?</span>
                <select className="input" value={applicationId ?? ''} onChange={(e) => setApplicationId(e.target.value)}>
                  {reports.map((r) => <option key={r.id} value={r.applicationId}>{r.referenceCode}</option>)}
                </select>
              </label>
            )}
            <label className="block">
              <span className="field-label">What would you most like to discuss? <span className="font-normal text-muted">(optional)</span></span>
              <textarea className="input" rows={3} maxLength={300} value={topic} onChange={(e) => setTopic(e.target.value)} />
              <span className="field-help">{topic.length}/300</span>
            </label>
            <fieldset>
              <legend className="field-label">How would you like to meet?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {([['video', 'Google Meet'], ['phone', 'Phone or WhatsApp call']] as const).map(([v, l]) => (
                  <label key={v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 ${meetingType === v ? 'border-navy bg-navy/5 font-semibold' : 'border-line bg-white'}`}>
                    <input type="radio" name="meet" checked={meetingType === v} onChange={() => setMeetingType(v)} className="h-5 w-5 accent-[#0D2240]" />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            {advisor.priceNgnKobo && (
              <fieldset>
                <legend className="field-label">Pay in</legend>
                <div className="flex gap-2">
                  {(['USD', 'NGN'] as const).map((c) => (
                    <label key={c} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 ${currency === c ? 'border-navy bg-navy/5 font-semibold' : 'border-line bg-white'}`}>
                      <input type="radio" name="cur" checked={currency === c} onChange={() => setCurrency(c)} className="h-5 w-5 accent-[#0D2240]" />
                      {c === 'USD' ? 'USD (any card)' : 'Naira (Nigerian cards)'}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="rounded-xl bg-cream p-4">
              <p className="font-semibold text-navy">1-on-1 Mortgage Advisory Session · 30 minutes · {when}</p>
              <p className="num mt-1 text-navy">
                Total: {currency === 'NGN' && advisor.priceNgnKobo ? formatNaira(advisor.priceNgnKobo) : `USD ${advisor.priceUsdCents / 100}`}
              </p>
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={pay} disabled={busy}>{busy ? 'Holding your time…' : 'Pay and book'}</button>
            </div>
            <p className="text-sm text-muted">We&apos;re holding this time for you for 10 minutes.</p>
          </div>
        </>
      )}
    </div>
  );
}
