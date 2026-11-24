import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';
import { ARTICLES } from '../articles';

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.summary } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  const next = ARTICLES.find((x) => x.part === a.part + 1);
  return (
    <>
      <PageHero eyebrow={`Mortgage na wetin? · Part ${a.part}`} title={a.title} intro={a.summary} />
      <section className="container-page prose-hf max-w-3xl py-14">
        <p>This article is being written. In the meantime, see what you could access in under 5 minutes.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/prequalify" className="btn-primary">Get Prequalified</Link>
          {next && <Link href={`/learn/${next.slug}`} className="btn-secondary">Next: {next.title}</Link>}
        </div>
      </section>
    </>
  );
}
