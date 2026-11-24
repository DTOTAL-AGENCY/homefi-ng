import type { Metadata } from 'next';
import { FaqList } from '@/components/faq-list';
import { PageHero } from '@/components/page-hero';
import { FAQ } from '@/content/site';

export const metadata: Metadata = { title: 'FAQ', description: 'Common questions about mortgage prequalification, fees and advisory sessions.' };

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <>
      <PageHero title="Frequently asked questions" />
      <section className="container-page max-w-3xl py-14">
        <FaqList items={FAQ} />
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
