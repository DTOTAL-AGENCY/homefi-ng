import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { SITE } from '@/lib/config';

/** Drafts for review by counsel before launch (NDPA 2023). */
const DOCS = {
  privacy: {
    title: 'Privacy Notice',
    body: (
      <>
        <p><strong>Draft for legal review.</strong> {SITE.company} ({SITE.rc}), {SITE.city}, is the data controller for homefi.ng. This notice follows the Nigeria Data Protection Act 2023.</p>
        <h2>What we collect</h2>
        <p>Only what your estimate, your report and your advisor need: your name, age, contact details, nationality and residence, income and existing repayments (and your spouse or partner&apos;s, if you apply jointly), the home you want, and your answers about pension, deposit and timing.</p>
        <h2>Why we use it</h2>
        <ul>
          <li>To prepare your mortgage estimate and your Mortgage Prequalification Report.</li>
          <li>To arrange and hold your advisory session.</li>
          <li>To process your mortgage with a lender, only when you ask us to.</li>
          <li>To send you mortgage tips, only if you opt in.</li>
        </ul>
        <h2>Who processes it for us</h2>
        <p>Hosting and database (Supabase, Vercel), email delivery, payments (Paystack), scheduling (Cal.com) and AI wording for your report (Anthropic). We never send your name, phone number or email address to the AI service, and we never sell your data.</p>
        <h2>How long we keep it</h2>
        <p>Unfinished estimates are deleted after 30 days. Account data is kept while your account is open and as long as the law requires afterwards.</p>
        <h2>Your rights</h2>
        <p>You can ask to see, correct, export or delete your data, or withdraw consent, from Settings or by writing to {SITE.supportEmail}. You can also complain to the Nigeria Data Protection Commission.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms of use',
    body: (
      <>
        <p><strong>Draft for legal review.</strong> These terms apply to homefi.ng, operated by {SITE.company} ({SITE.rc}).</p>
        <h2>Our service</h2>
        <p>We give you a free mortgage estimate and report, paid advisory sessions with vetted advisors, and, if you choose, mortgage processing for a fee of 3% of the Mortgage approved, or 4% if we also search for and verify the property.</p>
        <h2>Fees and refunds</h2>
        <p>Processing fees are paid in 2 parts: 60% when we start processing your application and 40% when your mortgage is finally approved. Any fee you pay upfront is fully refundable if we cannot secure an appropriate mortgage for you within the agreed period. Advisory sessions cancelled at least 24 hours before the start time are refunded in full.</p>
        <h2>Your account</h2>
        <p>Keep your details accurate and your password private. We may suspend accounts that misuse the service.</p>
      </>
    ),
  },
  disclaimer: {
    title: 'Estimate disclaimer',
    body: (
      <>
        <p>This is an estimate based on what you told us. It is not a loan offer or an approval. Final terms depend on each lender&apos;s checks, your documents and the property.</p>
        <p>Rates and limits shown are those in force when your estimate was made and can change. Foreign-currency income is converted at a stressed exchange rate so the estimate allows for movement in the Naira; it is not a forecast.</p>
      </>
    ),
  },
} as const;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}
export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = DOCS[(await params).doc as keyof typeof DOCS];
  return d ? { title: d.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const d = DOCS[(await params).doc as keyof typeof DOCS];
  if (!d) notFound();
  return (
    <>
      <PageHero title={d.title} />
      <section className="container-page prose-hf max-w-3xl py-14">{d.body}</section>
    </>
  );
}
