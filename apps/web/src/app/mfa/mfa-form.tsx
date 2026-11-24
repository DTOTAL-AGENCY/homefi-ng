'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export function MfaForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/admin';
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.mfa.listFactors();
      const verified = data?.totp.find((f) => f.status === 'verified');
      if (verified) return setFactorId(verified.id);
      const { data: en, error } = await sb.auth.mfa.enroll({ factorType: 'totp' });
      if (error || !en) return setError(error?.message ?? 'Could not start enrolment.');
      setFactorId(en.id);
      setQr(en.totp.qr_code);
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) return setError('That code did not work. Check your authenticator app and try again.');
    router.push(next.startsWith('/') ? next : '/admin');
    router.refresh();
  }

  return (
    <form onSubmit={verify} className="card mt-6 space-y-4">
      {qr && (
        <>
          <p className="text-navy">Scan this code with Google Authenticator, 1Password or a similar app.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Authenticator QR code" width={180} height={180} />
        </>
      )}
      <label className="block">
        <span className="field-label">6-digit code</span>
        <input className="input num" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn-primary w-full">Verify</button>
    </form>
  );
}
