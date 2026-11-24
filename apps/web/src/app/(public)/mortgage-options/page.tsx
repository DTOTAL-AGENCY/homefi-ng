import Link from 'next/link';
import type { Metadata } from 'next';
import { formatNairaShort, formatRate } from '@homefi/engine';
import { PageHero } from '@/components/page-hero';
import { StickyStartBar } from '@/components/sticky-start-bar';
import { OPTIONS } from '@/content/site';
import { rateProducts } from '@/server/data';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'Mortgage options in Nigeria',
  description: 'Compare NHF, NHF Diaspora, MREIF, commercial and non-interest mortgages side by side.',
};

export default async function OptionsPage() {
  const products = await rateProducts();
  return (
    <>
      <PageHero
        title="Every serious mortgage option in Nigeria, in one place"
        intro="Most people only hear about one or two banks. We compare across the schemes and lenders that matter, and tell you which ones fit you."
      />
      <section className="container-page py-14">
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Mortgage options compared</caption>
            <thead className="bg-cream text-navy">
              <tr>
                <th scope="col" className="p-4">Option</th>
                <th scope="col" className="p-4">Rate a year</th>
                <th scope="col" className="p-4">Term in our estimates</th>
                <th scope="col" className="p-4">Loan limit</th>
                <th scope="col" className="p-4"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {OPTIONS.map((o) => {
                const p = products.find((x) => x.code === o.code);
                const rate = !p
                  ? '-'
                  : o.code === 'NON_INTEREST'
                    ? 'Profit rate set by the bank'
                    : p.rateMin === p.rateMax
                      ? formatRate(Number(p.rateMin))
                      : `Indicative ${formatRate(Number(p.rateMin))} to ${formatRate(Number(p.rateMax))}`;
                return (
                  <tr key={o.slug}>
                    <th scope="row" className="p-4 font-bold text-navy">{o.name}</th>
                    <td className="num p-4">{rate}</td>
                    <td className="num p-4">{p ? `Up to ${p.maxTenorYears} years` : '-'}</td>
                    <td className="num p-4">{p?.loanCapKobo ? `Up to ${formatNairaShort(p.loanCapKobo)}` : 'Set by lender'}</td>
                    <td className="p-4">
                      <Link href={`/mortgage-options/${o.slug}`} className="font-semibold text-navy underline underline-offset-4">
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Link href="/prequalify" className="btn-primary mt-8">
          Check if you qualify
        </Link>
      </section>
      <StickyStartBar />
    </>
  );
}
