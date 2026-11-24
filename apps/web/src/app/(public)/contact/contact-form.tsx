'use client';

import { useActionState } from 'react';
import { sendContact, type ContactState } from './actions';

const TOPICS = [
  ['estimate', 'My estimate'],
  ['report', 'My report'],
  ['session', 'Advisory session'],
  ['fees', 'Fees'],
  ['partnerships', 'Partnerships'],
  ['other', 'Other'],
] as const;

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: 'idle' });
  if (state.status === 'sent') {
    return (
      <div className="card" role="status">
        <h2 className="text-xl font-bold text-navy">Thank you. We&apos;ve got your message.</h2>
        <p className="mt-2 text-muted">We reply within 1 working day.</p>
      </div>
    );
  }
  const err = (k: string) => (state.status === 'error' ? state.fields?.[k] : undefined);
  return (
    <form action={action} className="card space-y-5" noValidate>
      {[
        ['name', 'Name', 'text', 'name'],
        ['email', 'Email', 'email', 'email'],
        ['phone', 'Phone', 'tel', 'tel'],
      ].map(([id, label, type, ac]) => (
        <div key={id}>
          <label htmlFor={id} className="field-label">{label}{id === 'phone' && <span className="font-normal text-muted"> (optional)</span>}</label>
          <input id={id} name={id} type={type} autoComplete={ac} className="input" aria-invalid={!!err(id!)} aria-describedby={err(id!) ? `${id}-err` : undefined} />
          {err(id!) && <p id={`${id}-err`} className="field-error">{err(id!)}</p>}
        </div>
      ))}
      <div>
        <label htmlFor="topic" className="field-label">Topic</label>
        <select id="topic" name="topic" className="input" defaultValue="estimate">
          {TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="field-label">Message</label>
        <textarea id="message" name="message" rows={5} maxLength={2000} className="input" aria-invalid={!!err('message')} />
        {err('message') && <p className="field-error">{err('message')}</p>}
      </div>
      {state.status === 'error' && state.message && <p className="field-error" role="alert">{state.message}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
