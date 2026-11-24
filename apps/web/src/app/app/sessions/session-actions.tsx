'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlotPicker } from '@/components/slot-picker';

export function SessionActions({ id, status, meetingUrl, advisorSlug, startAt }: { id: string; status: string; meetingUrl: string | null; advisorSlug: string; startAt: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'reschedule' | 'cancel'>('idle');
  const [start, setStart] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const live = ['confirmed', 'rescheduled'].includes(status);
  const refundable = (new Date(startAt).getTime() - Date.now()) / 3600_000 >= 24;

  async function call(path: string, body?: object) {
    const res = await fetch(`/api/v1/sessions/${id}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    const b = await res.json().catch(() => null);
    if (!res.ok) return setMsg(b?.error?.message ?? 'Please try again.');
    setMode('idle');
    router.refresh();
  }

  if (status === 'completed') {
    return <Link href={`/app/sessions/${id}/review`} className="btn-secondary mt-4">Leave a review</Link>;
  }
  if (!live) return null;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        {meetingUrl && <a href={meetingUrl} target="_blank" rel="noopener" className="btn-primary">Join call</a>}
        <button className="btn-secondary" onClick={() => setMode(mode === 'reschedule' ? 'idle' : 'reschedule')}>Reschedule</button>
        <button className="btn-secondary" onClick={() => setMode(mode === 'cancel' ? 'idle' : 'cancel')}>Cancel</button>
      </div>
      {mode === 'reschedule' && (
        <div className="mt-4">
          <SlotPicker slug={advisorSlug} value={start} onChange={setStart} />
          <button className="btn-primary mt-4" disabled={!start} onClick={() => call('reschedule', { start })}>Move my session</button>
        </div>
      )}
      {mode === 'cancel' && (
        <div className="mt-4 rounded-xl bg-cream p-4 text-navy">
          <p>{refundable ? "You'll get a full refund because it's more than 24 hours away." : 'This session is less than 24 hours away, so it is not refundable.'}</p>
          <button className="btn-secondary mt-3 !border-danger !text-danger" onClick={() => call('cancel')}>Cancel session</button>
        </div>
      )}
      {msg && <p className="field-error" role="alert">{msg}</p>}
    </div>
  );
}
