import Link from 'next/link';
import { AdvisorCardView } from '@/components/advisor-card';
import { FaqList } from '@/components/faq-list';
import { ResultPhoneMockup } from '@/components/result-phone-mockup';
import { StickyStartBar } from '@/components/sticky-start-bar';
import { FAQ, HOW_IT_WORKS, OPTIONS } from '@/content/site';
import { formatRate } from '@homefi/engine';
import { approvedAdvisors, prequalifiedCount, publishedReviews, rateProducts } from '@/server/data';

export const revalidate = 300;

const WHY = [
  ['One application, many lenders.', 'No more visiting mortgage banks one by one. Apply once and we match you to the options that fit.'],
  ['A real advisor, not just a calculator.', 'Your advisor explains your options, refines your numbers and tells you exactly what to do next.'],
  ['We do the heavy lifting.', 'We prepare and submit your application, chase the lender and keep you updated until disbursement.'],
  ['Help finding the right home.', "Tell us your budget and preferred location. We'll find and verify suitable properties so you get real value for your money."],
] as const;

export default async function HomePage() {
  const [count, advisors, reviews, products] = await Promise.all([
    prequalifiedCount().catch(() => 0),
    approvedAdvisors().catch(() => []),
    publishedReviews().catch(() => []),
    rateProducts().catch(() => []),
  ]);
  const rate = (code: string) => {
    const p = products.find((x) => x.code === code);
    return p ? formatRate(Number(p.rateMin)) : null;
  };
  const nhf = products.find((p) => p.code === 'NHF');
  const optionFacts: Record<string, string> = {
    NHF: nhf
      ? `${rate('NHF')} a year, up to ₦${Math.floor((nhf.loanCapKobo ?? 0) / 100 / 1_000_000)}m.`
      : '',
    MREIF: rate('MREIF') ? `${rate('MREIF')} a year through partner banks.` : '',
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-cream">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="text-sm font-semibold tracking-wide text-gold uppercase">
              For Nigerians at home and in the diaspora
            </p>
            <h1 className="h-display mt-3 text-4xl text-cream sm:text-5xl lg:text-6xl">
              Find out how much mortgage you can get, in under 5 minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-cream/85">
              Tell us about your income and the home you want. We&apos;ll show you what you could access through FG
              concessionary schemes like NHF and MREIF, and what commercial mortgage banks may offer, side by side. Free.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link href="/prequalify" className="btn-primary w-full text-lg sm:w-auto">
                Get Prequalified
              </Link>
              <Link href="/how-it-works" className="px-2 py-3 font-semibold text-cream underline-offset-4 hover:underline">
                See how it works
              </Link>
            </div>
            <p className="mt-3 text-sm text-cream/75">Free · About 4 minutes · No documents needed</p>
          </div>
          <ResultPhoneMockup />
        </div>
      </section>

      {/* Trust strip: only numbers we can prove */}
      <section aria-label="Why people trust HomeFi" className="border-b border-line bg-white">
        <ul className="container-page grid gap-4 py-6 text-center text-sm font-semibold text-navy sm:grid-cols-3">
          {count >= 100 && <li>{(Math.floor(count / 100) * 100).toLocaleString('en-NG')}+ Nigerians prequalified</li>}
          <li>Options from FMBN (NHF), MREIF partner banks and Primary Mortgage Banks</li>
          <li>Applicants in Nigeria, the UK, USA, Canada, Europe and the UAE</li>
        </ul>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <h2 className="h-display text-center text-3xl text-navy sm:text-4xl">From &ldquo;how much can I get?&rdquo; to your keys</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="card">
              <span className="num inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy font-bold text-gold">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy">{s.title}.</h3>
              <p className="mt-2 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link href="/prequalify" className="btn-secondary">
            Start step 1
          </Link>
        </div>
      </section>

      {/* Mortgage options */}
      <section className="bg-white py-16">
        <div className="container-page">
          <h2 className="h-display text-3xl text-navy sm:text-4xl">Every serious mortgage option in Nigeria, in one place</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Most people only hear about one or two banks. We compare across the schemes and lenders that matter, and tell you
            which ones fit you.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {OPTIONS.map((o) => (
              <li key={o.slug}>
                <Link href={`/mortgage-options/${o.slug}`} className="card block h-full hover:border-navy">
                  <h3 className="font-bold text-navy">{o.name}</h3>
                  {optionFacts[o.code] && <p className="num mt-1 text-sm font-semibold text-gold-700">{optionFacts[o.code]}</p>}
                  <p className="mt-2 text-sm text-muted">{o.card}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/mortgage-options" className="mt-6 inline-block font-semibold text-navy underline underline-offset-4">
            Compare all options
          </Link>
        </div>
      </section>

      {/* Why HomeFi */}
      <section className="container-page py-16">
        <h2 className="h-display text-3xl text-navy sm:text-4xl">You focus on choosing your home. We handle the rest.</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {WHY.map(([t, b]) => (
            <li key={t} className="flex gap-4">
              <span aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 rounded-full bg-gold" />
              <p className="text-muted">
                <strong className="text-navy">{t}</strong> {b}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Advisors teaser */}
      {advisors.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-page">
            <h2 className="h-display text-3xl text-navy sm:text-4xl">Meet the people who&apos;ll walk with you</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Every HomeFi Mortgage Advisor is vetted by our team. See their track record and verified reviews, then pick the
              one who fits you.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {advisors.slice(0, 3).map((a) => (
                <AdvisorCardView key={a.id} advisor={a} compact />
              ))}
            </div>
            <Link href="/advisors" className="btn-secondary mt-8">
              Browse advisors
            </Link>
          </div>
        </section>
      )}

      {/* Testimonials: real, verified reviews only; hidden below 3 */}
      {reviews.length >= 3 && (
        <section className="container-page py-16">
          <h2 className="h-display text-3xl text-navy sm:text-4xl">What applicants say</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 3).map((r) => (
              <li key={r.id} className="card">
                <p className="text-gold" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}</p>
                {r.title && <p className="mt-2 font-bold text-navy">{r.title}</p>}
                <p className="mt-2 text-muted">{r.body}</p>
                <p className="mt-3 text-sm font-semibold text-navy">
                  {r.reviewer}
                  {r.location ? `, ${r.location}` : ''} · <span className="text-success">Verified session</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Diaspora band */}
      <section className="bg-sapphire text-cream">
        <div className="container-page grid gap-6 py-14 md:grid-cols-[2fr_1fr] md:items-center">
          <div>
            <h2 className="h-display text-3xl sm:text-4xl">Living abroad? Buy at home without flying home.</h2>
            <p className="mt-3 max-w-2xl text-cream/85">
              Tell us what you earn in pounds, dollars, euros or any currency. We convert at today&apos;s rate and test your
              numbers against a weaker rate, so your estimate still holds if the Naira moves. Your advisor meets you on video,
              in your time zone.
            </p>
          </div>
          <Link href="/diaspora" className="btn-on-navy justify-self-start md:justify-self-end">
            See the diaspora path
          </Link>
        </div>
      </section>

      {/* Education band */}
      <section className="container-page py-16">
        <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="h-display text-3xl text-navy">Mortgage na wetin?</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Our 7-part series explains mortgages in Nigeria in plain language: NHF, MREIF, equity, what lenders look for, and
              how to avoid the common mistakes.
            </p>
          </div>
          <Link href="/learn" className="btn-secondary shrink-0">
            Start learning
          </Link>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="bg-white py-16">
        <div className="container-page max-w-3xl">
          <h2 className="h-display text-3xl text-navy">Questions people ask</h2>
          <FaqList items={FAQ.slice(0, 4)} />
          <Link href="/faq" className="mt-6 inline-block font-semibold text-navy underline underline-offset-4">
            See all questions
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-navy text-cream">
        <div className="container-page py-16 text-center">
          <h2 className="h-display text-4xl">Your home is closer than you think.</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/85">
            Find out what you can afford in under 5 minutes. It&apos;s free, and there&apos;s no obligation.
          </p>
          <Link href="/prequalify" className="btn-primary mt-8 text-lg">
            Get Prequalified
          </Link>
        </div>
      </section>
      <StickyStartBar />
    </>
  );
}
