'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { track } from '@/components/analytics';

function GoogleButton({ application, next }: { application: string | null; next: string }) {
  const go = async () => {
    const cb = new URL('/auth/callback', window.location.origin);
    cb.searchParams.set('next', next);
    if (application) cb.searchParams.set('application', application);
    await supabaseBrowser().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cb.toString() } });
  };
  return (
    <button type="button" onClick={go} className="btn-secondary w-full">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10l3.7-2.9z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
      </svg>
      Continue with Google
    </button>
  );
}

const Divider = () => (
  <div className="my-6 flex items-center gap-3 text-sm text-muted">
    <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
  </div>
);

async function afterSignin(body: { applicationId?: string | null; isNew?: boolean; marketing?: boolean }) {
  await fetch('/api/v1/auth/after-signin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
}

export function SignUpForm() {
  const router = useRouter();
  const q = useSearchParams();
  const application = q.get('application');
  const [f, setF] = useState({
    firstName: q.get('first') ?? '',
    lastName: q.get('last') ?? '',
    email: '',
    password: '',
    phone: q.get('phone') ?? '',
    marketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [exists, setExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.firstName.trim().length < 2) errs.firstName = 'Please enter your first name.';
    if (f.lastName.trim().length < 2) errs.lastName = 'Please enter your surname.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = 'Please enter a valid email address.';
    if (f.password.length < 8 || !/\d/.test(f.password)) errs.password = 'At least 8 characters, with a number.';
    setErrors(errs);
    setExists(false);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        data: { first_name: f.firstName.trim(), last_name: f.lastName.trim(), phone: f.phone.trim(), marketing_opt_in: f.marketing },
      },
    });
    if (error || !data.user || data.user.identities?.length === 0) {
      setBusy(false);
      if (!error || /registered|exists/i.test(error.message)) return setExists(true);
      return setErrors({ form: error.message });
    }
    track('account_created', { method: 'email', from: application ? 'result' : 'direct' });
    await afterSignin({ applicationId: application, isNew: true, marketing: f.marketing });
    router.push('/app');
    router.refresh();
  }

  const signinHref = `/signin${application ? `?application=${application}` : ''}`;
  return (
    <>
      <h1 className="h-display text-4xl text-navy">Create your free HomeFi account</h1>
      {application && (
        <p className="mt-2 text-muted">Your report is ready to send. We&apos;ll email it to you and keep it safe in your dashboard.</p>
      )}
      <div className="mt-8">
        <GoogleButton application={application} next="/app" />
      </div>
      <Divider />
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" id="first" value={f.firstName} onChange={(v) => set('firstName', v)} error={errors.firstName} autoComplete="given-name" />
          <Input label="Surname" id="last" value={f.lastName} onChange={(v) => set('lastName', v)} error={errors.lastName} autoComplete="family-name" />
        </div>
        <Input label="Email address" id="email" type="email" value={f.email} onChange={(v) => set('email', v)} error={errors.email} autoComplete="email" help="Use an email you check often. Lenders will use it during your application." />
        <Input label="Password" id="password" type="password" value={f.password} onChange={(v) => set('password', v)} error={errors.password} autoComplete="new-password" help="At least 8 characters, with a number." />
        <Input label="Phone" id="phone" type="tel" value={f.phone} onChange={(v) => set('phone', v)} autoComplete="tel" />
        <p className="text-sm text-muted">
          By creating an account you agree to our <Link className="underline" href="/legal/terms">Terms</Link> and{' '}
          <Link className="underline" href="/legal/privacy">Privacy Notice</Link>.
        </p>
        <label className="flex items-start gap-3 text-sm text-navy">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#0D2240]" checked={f.marketing} onChange={(e) => set('marketing', e.target.checked)} />
          Send me mortgage tips and updates.
        </label>
        {exists && (
          <p className="field-error" role="alert">
            There&apos;s already an account with this email. <Link href={signinHref} className="underline">Sign in instead</Link>
          </p>
        )}
        {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating your account…' : application ? 'Create account and send my report' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href={signinHref} className="font-semibold text-navy underline">Sign in</Link>
      </p>
    </>
  );
}

export function SignInForm() {
  const router = useRouter();
  const q = useSearchParams();
  const application = q.get('application');
  const next = q.get('next') ?? '/app';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      return setError(/rate/i.test(error.message) ? "You've tried a few times in a row. Please wait a minute and try again." : 'That email and password do not match. Please try again.');
    }
    track('signed_in', { method: 'email', from: application ? 'result' : 'direct' });
    await afterSignin({ applicationId: application });
    router.push(safeNext);
    router.refresh();
  }

  return (
    <>
      <h1 className="h-display text-4xl text-navy">Welcome back</h1>
      {application && <p className="mt-2 text-muted">Sign in and we&apos;ll add this estimate to your account and send your report.</p>}
      <div className="mt-8">
        <GoogleButton application={application} next={safeNext} />
      </div>
      <Divider />
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Email address" id="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Input label="Password" id="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted">
        <Link href="/forgot-password" className="underline">Forgot your password?</Link>
        <span>
          New to HomeFi?{' '}
          <Link href={`/signup${application ? `?application=${application}` : ''}`} className="font-semibold text-navy underline">Create an account</Link>
        </span>
      </div>
    </>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cb = new URL('/auth/callback', window.location.origin);
    cb.searchParams.set('next', '/reset-password');
    await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), { redirectTo: cb.toString() });
    setSent(true);
  }
  return (
    <>
      <h1 className="h-display text-4xl text-navy">Forgot your password?</h1>
      {sent ? (
        <p className="mt-4 text-muted" role="status">If there&apos;s an account for {email}, we&apos;ve sent a reset link. Check your inbox.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-5">
          <p className="text-muted">Enter your email and we&apos;ll send you a reset link.</p>
          <Input label="Email address" id="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <button className="btn-primary w-full">Send reset link</button>
        </form>
      )}
    </>
  );
}

export function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !/\d/.test(password)) return setError('At least 8 characters, with a number.');
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) return setError('For your security, please request a new reset link.');
    router.push('/app');
  }
  return (
    <>
      <h1 className="h-display text-4xl text-navy">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <Input label="New password" id="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" help="At least 8 characters, with a number." error={error ?? undefined} />
        <button className="btn-primary w-full">Save password</button>
      </form>
    </>
  );
}

function Input({
  label, id, value, onChange, type = 'text', error, help, autoComplete,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void; type?: string; error?: string; help?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {help && !error && <p id={`${id}-help`} className="field-help">{help}</p>}
      {error && <p id={`${id}-err`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}
