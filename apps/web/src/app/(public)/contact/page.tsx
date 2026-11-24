import type { Metadata } from 'next';
import { ContactForm } from './contact-form';
import { PageHero } from '@/components/page-hero';
import { SITE } from '@/lib/config';

export const metadata: Metadata = { title: 'Contact', description: 'Talk to the HomeFi team by email, phone or WhatsApp.' };

export default function ContactPage() {
  return (
    <>
      <PageHero title="Talk to us" />
      <section className="container-page grid gap-10 py-14 md:grid-cols-[1fr_1.3fr]">
        <div className="text-muted">
          <p>
            Email <a className="font-semibold text-navy underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          </p>
          <p className="mt-2">
            Call or WhatsApp <a className="font-semibold text-navy underline" href={SITE.whatsapp}>{SITE.phone}</a>
          </p>
          <p className="mt-2">{SITE.city}.</p>
          <p className="mt-4">We reply within 1 working day.</p>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
