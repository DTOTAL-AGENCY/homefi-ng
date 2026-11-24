import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { HOW_IT_WORKS } from '@/content/site';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'From your free estimate to your keys: the 4 stages of getting a mortgage with HomeFi.',
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="How HomeFi works"
        intro="Getting a mortgage in Nigeria usually means visiting bank after bank and filling the same forms. With HomeFi, you apply once, get expert guidance and let us handle the lender."
      />
      <section className="container-page py-14">
        <ol className="space-y-6">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="card md:flex md:gap-8">
              <span className="num inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-lg font-bold text-gold">
                {i + 1}
              </span>
              <div className="mt-4 md:mt-0">
                <h2 className="text-xl font-bold text-navy">Step {i + 1}: {s.title}</h2>
                <p className="mt-2 text-muted">{s.body}</p>
                <p className="mt-3 text-sm text-navy">
                  <strong>What you&apos;ll need:</strong> {s.need}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 rounded-xl bg-white p-5 text-muted">
          Concessionary schemes like NHF can take longer than commercial loans. Your advisor will tell you what to expect for
          your option.
        </p>
        <Link href="/prequalify" className="btn-primary mt-8">
          Get Prequalified
        </Link>
      </section>
    </>
  );
}
