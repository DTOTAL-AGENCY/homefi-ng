'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/components/analytics';

export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

export function ReportActions({ reportId, applicationId }: { reportId: string; applicationId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<'dl' | 'mail' | null>(null);

  async function download() {
    setBusy('dl');
    setMsg(null);
    const res = await fetch(`/api/v1/reports/${reportId}/download`);
    const b = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setMsg(b?.error?.message ?? 'Something went wrong on our side. Please try again.');
    track('report_downloaded', { report_number: 1 });
    window.location.href = b.url;
  }
  async function resend() {
    setBusy('mail');
    setMsg(null);
    const res = await fetch(`/api/v1/prequal/applications/${applicationId}/report/resend`, { method: 'POST' });
    const b = await res.json().catch(() => null);
    setBusy(null);
    setMsg(res.ok ? "We've sent it again. Check your inbox in a few minutes." : b?.error?.message ?? 'Please try again.');
  }
  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={download} disabled={busy !== null}>
          {busy === 'dl' ? 'Preparing…' : 'Download PDF'}
        </button>
        <button className="btn-secondary" onClick={resend} disabled={busy !== null}>
          {busy === 'mail' ? 'Sending…' : 'Email it again'}
        </button>
        <Link href={`/prequalify/result/${applicationId}`} className="btn-secondary">View estimate</Link>
      </div>
      {msg && <p className="mt-3 text-sm text-navy" role="status">{msg}</p>}
    </>
  );
}

export function EmailBanner() {
  const [sent, setSent] = useState(false);
  return (
    <p className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-navy">
      Please confirm your email so lenders can reach you.
      <button
        className="font-semibold underline"
        disabled={sent}
        onClick={async () => {
          await fetch('/api/v1/me/verify-email', { method: 'POST' });
          setSent(true);
        }}
      >
        {sent ? 'Sent. Check your inbox.' : 'Resend email'}
      </button>
    </p>
  );
}
