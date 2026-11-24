import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentProfile, supabaseAdmin } from '@/lib/supabase/server';
import { confirmPayment } from '@/server/sessions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Booking', robots: { index: false } };

/** Paystack returns here after checkout. The webhook confirms too; both paths are idempotent. */
export default async function Callback({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string; failed?: string }> }) {
  const q = await searchParams;
  const reference = q.reference ?? q.trxref;
  const me = (await currentProfile())!;
  if (!reference) redirect('/app/sessions');
  const { data: p } = await supabaseAdmin().from('payments').select('user_id').eq('provider_reference', reference).maybeSingle();
  if (!p || p.user_id !== me.id) redirect('/app/sessions');

  const out = q.failed ? { status: 'payment_failed', sessionId: null } : await confirmPayment(reference).catch(() => ({ status: 'error', sessionId: null }));
  if (out.status === 'confirmed' || out.status === 'rescheduled') redirect(`/app/sessions?booked=${out.sessionId}`);
  return (
    <div className="card mx-auto max-w-xl">
      {out.status === 'slot_taken_refunded' ? (
        <>
          <h1 className="text-2xl font-bold text-navy">Someone just booked that time.</h1>
          <p className="mt-2 text-muted">We&apos;ve refunded your payment in full. Please pick another time.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-navy">Your payment didn&apos;t go through, and you haven&apos;t been charged.</h1>
          <p className="mt-2 text-muted">You can try again or use another card.</p>
        </>
      )}
      <Link href="/app/advisors" className="btn-primary mt-6">Try again</Link>
    </div>
  );
}
