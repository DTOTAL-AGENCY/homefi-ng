import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { SITE } from '@/lib/config';

export const metadata: Metadata = { title: 'Careers' };

export default function CareersPage() {
  return (
    <>
      <PageHero title="Careers" intro="We're a small team helping Nigerians own homes. No open roles are listed right now." />
      <section className="container-page prose-hf max-w-3xl py-14">
        <p>
          If you work in mortgages, property or technology and want to help, write to us at{' '}
          <a className="font-semibold text-navy underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </p>
      </section>
    </>
  );
}
