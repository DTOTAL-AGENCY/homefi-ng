import Link from 'next/link';
import { notFound } from 'next/navigation';
import { paystackLive } from '@/server/paystack';

export const dynamic = 'force-dynamic';

/** Local development only: stands in for Paystack checkout when no Paystack key is set. */
export default async function MockCheckout({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  if (paystackLive() || process.env.NODE_ENV === 'production') notFound();
  const { reference } = await searchParams;
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="eyebrow">Test checkout (no Paystack key set)</p>
      <h1 className="mt-2 text-2xl font-bold text-navy">Simulate the payment</h1>
      <p className="num mt-2 text-sm text-muted">{reference}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link className="btn-primary" href={`/app/book/callback?reference=${reference}`}>Pay (success)</Link>
        <Link className="btn-secondary" href={`/app/book/callback?reference=${reference}&failed=1`}>Fail</Link>
      </div>
    </div>
  );
}
