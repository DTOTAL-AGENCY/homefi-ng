import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { formatNaira, formatRate } from '@homefi/engine';
import { PageHero } from '@/components/page-hero';
import { StickyStartBar } from '@/components/sticky-start-bar';
import { OPTIONS } from '@/content/site';
import { rateProducts } from '@/server/data';

export const revalidate = 300;
export function generateStaticParams() {
  return OPTIONS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = OPTIONS.find((x) => x.slug === slug);
  return o ? { title: o.name, description: o.headline } : {};
}

export default async function OptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = OPTIONS.find((x) => x.slug === slug);
  if (!o) notFound();
  const p = (await rateProducts()).find((x) => x.code === o.code);
  const facts: string[] = [];
  if (p) {
    if (o.code === 'NON_INTEREST') facts.push('Ijarah Muntahia Bittamleek', 'Profit rate set by the bank');
    else if (p.rateMin === p.rateMax) facts.push(`${formatRate(Number(p.rateMin))} a year`);
    else facts.push(`Indicative ${formatRate(Number(p.rateMin))} to ${formatRate(Number(p.rateMax))} a year`);
    if (p.loanCapKobo) facts.push(`Up to ${formatNaira(p.loanCapKobo)}`);
    facts.push(`Up to ${p.maxTenorYears} years in our estimates`);
    facts.push(`Deposit from ${Math.round(Number(p.equityPct) * 100)}% of the property price`);
  }
  const section = (title: string, items: string[]) => (
    <div className="card">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
  return (
    <>
      <PageHero eyebrow="Mortgage options" title={o.name} intro={o.headline} />
      <section className="container-page grid gap-6 py-14 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-navy">What it is</h2>
            <p className="mt-3 text-muted">{o.what}</p>
          </div>
          {section('Who qualifies', o.qualifies)}
          <div className="grid gap-6 sm:grid-cols-2">
            {section('Pros', o.pros)}
            {section('Trade-offs', o.tradeoffs)}
          </div>
          {section('Documents', o.documents)}
          <div className="card">
            <h2 className="text-xl font-bold text-navy">How HomeFi helps</h2>
            <p className="mt-3 text-muted">{o.help}</p>
          </div>
        </div>
        <aside className="h-fit rounded-2xl bg-navy p-6 text-cream lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold tracking-wide text-gold uppercase">Rate and limits</h2>
          <ul className="num mt-3 space-y-2">
            {facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <Link href="/prequalify" className="btn-primary mt-6 w-full">
            Check if you qualify
          </Link>
        </aside>
      </section>
      <StickyStartBar />
    </>
  );
}
