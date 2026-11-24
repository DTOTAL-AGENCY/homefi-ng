import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { ARTICLES } from './articles';

export const metadata: Metadata = { title: 'Learn: Mortgage na wetin?', description: 'A 7-part series explaining mortgages in Nigeria in plain language.' };

export default function LearnPage() {
  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Mortgage na wetin?"
        intro="Our 7-part series explains mortgages in Nigeria in plain language: NHF, MREIF, equity, what lenders look for, and how to avoid the common mistakes."
      />
      <section className="container-page py-14">
        <ol className="grid gap-4 md:grid-cols-2">
          {ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link href={`/learn/${a.slug}`} className="card block h-full hover:border-navy">
                <p className="num text-sm font-bold text-gold-700">Part {a.part}</p>
                <h2 className="mt-1 text-xl font-bold text-navy">{a.title}</h2>
                <p className="mt-2 text-muted">{a.summary}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
