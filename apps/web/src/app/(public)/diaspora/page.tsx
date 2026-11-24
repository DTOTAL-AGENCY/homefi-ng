import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { StickyStartBar } from '@/components/sticky-start-bar';

export const metadata: Metadata = {
  title: 'For Nigerians abroad',
  description: 'Own a home in Nigeria while you live abroad. Income in your currency, stress-tested exchange rates and video advice.',
};

const POINTS = [
  ['Your income, your currency.', 'Tell us what you earn in your currency. We do the conversion.'],
  ['Numbers that survive the exchange rate.', "We test your estimate at a weaker rate than today's, so you don't plan around a figure that disappears next month."],
  ['Advice on your schedule.', 'Video sessions at times that work in your time zone.'],
  ['Eyes on the ground.', "We can search for and verify the property for you, so you don't buy blind."],
] as const;

export default function DiasporaPage() {
  return (
    <>
      <PageHero
        eyebrow="For Nigerians abroad"
        title="Own a home in Nigeria while you live abroad"
        intro="Thousands of Nigerians in the UK, USA, Canada, Europe and the Gulf have asked us the same question: can I buy at home without the stress? Yes. Here's how."
      />
      <section className="container-page py-14">
        <ul className="grid gap-6 sm:grid-cols-2">
          {POINTS.map(([t, b], i) => (
            <li key={t} className="card">
              <span className="num text-sm font-bold text-gold-700">0{i + 1}</span>
              <h2 className="mt-2 text-xl font-bold text-navy">{t}</h2>
              <p className="mt-2 text-muted">{b}</p>
            </li>
          ))}
        </ul>
        <Link href="/prequalify" className="btn-primary mt-10">
          Get Prequalified from abroad
        </Link>
      </section>
      <StickyStartBar />
    </>
  );
}
