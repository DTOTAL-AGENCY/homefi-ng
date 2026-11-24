'use client';

import { useState } from 'react';
import { track } from '@/components/analytics';

export function ReviewForm({ id, initialRating }: { id: string; initialRating: number }) {
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sent' | string>('idle');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setState('Please choose a star rating.');
    const res = await fetch(`/api/v1/sessions/${id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rating, title: title || undefined, body: body || undefined }) });
    const b = await res.json().catch(() => null);
    if (!res.ok) return setState(b?.error?.message ?? 'Please try again.');
    track('review_submitted', { rating });
    setState('sent');
  }
  if (state === 'sent') return <p className="card mt-6 text-navy" role="status">Thank you. Your review will appear once our team has checked it.</p>;
  return (
    <form onSubmit={submit} className="card mt-6 space-y-5">
      <fieldset>
        <legend className="field-label">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={rating >= n} onClick={() => setRating(n)} className={`text-4xl ${rating >= n ? 'text-gold' : 'text-line'}`}>★</button>
          ))}
        </div>
      </fieldset>
      <label className="block"><span className="field-label">Title <span className="font-normal text-muted">(optional)</span></span><input className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="block"><span className="field-label">Your review <span className="font-normal text-muted">(optional)</span></span><textarea className="input" rows={4} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
      <p className="text-sm text-muted">We show your first name, last initial, location and month. Please don&apos;t include phone numbers or other personal details.</p>
      {state !== 'idle' && <p className="field-error" role="alert">{state}</p>}
      <button className="btn-primary">Submit review</button>
    </form>
  );
}
