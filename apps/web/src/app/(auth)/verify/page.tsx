import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/server';
import { readToken } from '@/server/verify';

export const metadata: Metadata = { title: 'Confirm your email', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Target of the "Confirm your email" button in the report email. */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const data = t ? readToken<{ uid: string; email: string }>(t) : null;
  let ok = false;
  if (data) {
    const sb = supabaseAdmin();
    const { data: p } = await sb.from('profiles').select('email').eq('id', data.uid).single();
    if (p && p.email?.toLowerCase() === String(data.email).toLowerCase()) {
      await sb.from('profiles').update({ email_verified_at: new Date().toISOString() }).eq('id', data.uid);
      ok = true;
    }
  }
  return (
    <div className="text-center">
      <h1 className="h-display text-4xl text-navy">{ok ? 'Thank you. Your email is confirmed.' : 'This link has expired.'}</h1>
      <p className="mt-3 text-muted">
        {ok ? 'Lenders can now reach you at this address.' : 'Sign in and use "Resend email" on your dashboard to get a new link.'}
      </p>
      <Link href="/app" className="btn-primary mt-8">Go to dashboard</Link>
    </div>
  );
}
