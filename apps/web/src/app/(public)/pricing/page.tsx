import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = { title: 'Pricing and fees', description: 'Your estimate and first report are free. See our session and processing fees.' };

const ROWS = [
  ['Mortgage prequalification and 1st report', 'Free', 'Your estimate and your first detailed report cost nothing.'],
  ['1-on-1 Mortgage Advisory Session', 'USD 25 (30 minutes)', 'Includes a review of your report, your most suitable options, and a more precise 2nd report based on your exact income.'],
  ['Mortgage processing', '3% of the Mortgage approved', 'For processing your mortgage with the lender, from application to disbursement.'],
  ['Mortgage processing with property search', '4% of the Mortgage approved', 'If we also search for and verify the property on your behalf.'],
] as const;

export default function PricingPage() {
  return (
    <>
      <PageHero title="Pricing and fees" intro="Free to start. You only pay for advice and for processing when you choose to go ahead." />
      <section className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {ROWS.map(([service, price, copy]) => (
            <div key={service} className="card">
              <h2 className="text-lg font-bold text-navy">{service}</h2>
              <p className="num mt-2 text-2xl font-extrabold text-navy">{price}</p>
              <p className="mt-2 text-muted">{copy}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 rounded-xl bg-white p-5 text-muted">
          Processing fees are paid in 2 parts: 60% when we start processing your application and 40% when your mortgage is
          finally approved. Any fee you pay upfront is fully refundable if we cannot secure an appropriate mortgage for you
          within the agreed period.
        </p>
        <p className="mt-4 text-sm text-muted">
          Lenders also charge their own costs (legal search, valuation, title perfection, insurance and processing), usually
          8% to 10% of the property value, plus your deposit of 10% to 30%. These are standard across the Nigerian mortgage
          industry and are not HomeFi fees.
        </p>
        <Link href="/prequalify" className="btn-primary mt-8">Get Prequalified</Link>
      </section>
    </>
  );
}
