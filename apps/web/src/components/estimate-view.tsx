import {
  DISCLAIMER,
  PRODUCT_LABELS,
  formatNaira,
  formatRate,
  variantCopy,
  type EngineOutput,
  type ProductResult,
} from '@homefi/engine';

const floor10k = (kobo: number) => Math.floor(kobo / 1_000_000) * 1_000_000;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="num text-right font-bold text-navy">{value}</dd>
    </div>
  );
}

function ProductBlock({ r, rateWord }: { r: ProductResult; rateWord: string }) {
  return (
    <div className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h4 className="num font-bold text-navy">
        {PRODUCT_LABELS[r.productCode]} · {formatRate(r.interestRate)} a year{rateWord === 'profit rate' ? ' (profit rate)' : ''} · up to{' '}
        {r.tenorMonths / 12} years
      </h4>
      <dl className="mt-2">
        <Row label="You could borrow" value={formatNaira(floor10k(r.maxLoanKobo))} />
        <Row label="Monthly repayment from" value={formatNaira(r.firstMonthlyRepaymentKobo)} />
        <Row label="Property value you can target" value={`up to ${formatNaira(floor10k(r.maxPropertyValueKobo))}`} />
        <Row label="Deposit (10% equity)" value={formatNaira(r.equityRequiredKobo)} />
      </dl>
      {r.capped && <p className="mt-1 text-sm text-muted">Capped at the scheme limit.</p>}
      {r.notes.includes('nhf_register_first') && (
        <p className="mt-2 rounded-lg bg-cream p-3 text-sm text-navy">
          You&apos;ll need to register and contribute to the NHF before applying. Your advisor will guide you.
        </p>
      )}
    </div>
  );
}

function RangeBlock({ low, high, title, rateWord }: { low: ProductResult; high: ProductResult; title?: string; rateWord: string }) {
  return (
    <div>
      {title && <h4 className="font-bold text-navy">{title}</h4>}
      <dl className="mt-2">
        <Row
          label={`Typical ${rateWord === 'profit rate' ? 'profit rates' : 'rates'}`}
          value={`${formatRate(low.interestRate)} to ${formatRate(high.interestRate)} a year · up to ${low.tenorMonths / 12} years`}
        />
        <Row label="You could borrow" value={`${formatNaira(floor10k(high.maxLoanKobo))} to ${formatNaira(floor10k(low.maxLoanKobo))}`} />
        <Row label="Monthly repayment from" value={formatNaira(Math.min(low.firstMonthlyRepaymentKobo, high.firstMonthlyRepaymentKobo))} />
      </dl>
    </div>
  );
}

export function EstimateView({ firstName, estimate }: { firstName: string; estimate: EngineOutput }) {
  const e = estimate;
  const keys = new Set(e.variants.map((v) => v.key));
  const lowIncome = keys.has('low_income');
  const concessionary = e.results
    .filter((r) => r.category === 'concessionary' && r.eligible)
    .sort((x, y) => y.maxLoanKobo - x.maxLoanKobo);
  const comLow = e.results.find((r) => r.productCode === 'COMMERCIAL' && r.rateBasis === 'low' && r.eligible);
  const comHigh = e.results.find((r) => r.productCode === 'COMMERCIAL' && r.rateBasis === 'high' && r.eligible);
  const niLow = e.results.find((r) => r.productCode === 'NON_INTEREST' && r.rateBasis === 'low' && r.eligible);
  const niHigh = e.results.find((r) => r.productCode === 'NON_INTEREST' && r.rateBasis === 'high' && r.eligible);
  const shownVariants = e.variants.filter((v) => !['low_income', 'non_interest', 'nhf_not_contributor', 'non_nigerian'].includes(v.key));

  return (
    <div>
      <section className="rounded-3xl bg-navy p-6 text-cream sm:p-10">
        {lowIncome ? (
          <>
            <h1 className="h-display text-4xl sm:text-5xl">Let&apos;s find your way in.</h1>
            <p className="mt-4 max-w-2xl text-lg text-cream/85">{variantCopy({ key: 'low_income', params: {} }).body}</p>
          </>
        ) : (
          <>
            <h1 className="h-display text-3xl sm:text-5xl">
              {firstName}, you could access up to <span className="num font-sans font-extrabold text-gold">{e.headline?.display}</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-cream/85">
              Based on a monthly take-home income of <span className="num font-semibold">{formatNaira(e.assessed.monthlyIncomeKobo)}</span> and
              repayments of no more than a third of it (<span className="num font-semibold">{formatNaira(e.assessed.affordableMonthlyKobo)}</span> a month).
            </p>
          </>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {concessionary.length > 0 && (
          <section className="card" aria-labelledby="c1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="c1" className="text-xl font-bold text-navy">FG concessionary mortgages</h3>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-navy">Lowest rates · Longer to process</span>
            </div>
            <div className="mt-4 space-y-4">
              {concessionary.map((r) => (
                <ProductBlock key={r.productCode} r={r} rateWord={e.rateLabel} />
              ))}
            </div>
          </section>
        )}
        {comLow && comHigh && (
          <section className="card" aria-labelledby="c2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="c2" className="text-xl font-bold text-navy">Commercial mortgages (PMBs and banks)</h3>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-navy">Higher rates · Often faster</span>
            </div>
            <div className="mt-4">
              <RangeBlock low={comLow} high={comHigh} rateWord={e.rateLabel} />
            </div>
            {keys.has('non_nigerian') && <p className="mt-3 text-sm text-muted">Eligibility depends on residency status. Your advisor will confirm.</p>}
          </section>
        )}
        {keys.has('non_interest') && (
          <section className="card" aria-labelledby="c3">
            <h3 id="c3" className="text-xl font-bold text-navy">Non-interest home finance (Ijarah)</h3>
            <p className="mt-2 text-muted">Your advisor will match you with non-interest banks.</p>
            {niLow && niHigh && (
              <div className="mt-4">
                <RangeBlock low={niLow} high={niHigh} rateWord="profit rate" />
              </div>
            )}
          </section>
        )}
      </div>

      {!lowIncome && (
        <section className="mt-6 rounded-2xl border-l-4 border-gold bg-white p-6" aria-labelledby="insight">
          <h3 id="insight" className="text-lg font-bold text-navy">What this means for you</h3>
          <p className="mt-2 text-muted">{e.insight}</p>
          {shownVariants.map((v) => (
            <p key={v.key} className="mt-2 text-muted">
              {variantCopy(v).body}
            </p>
          ))}
        </section>
      )}

      <p className="mt-6 text-sm text-muted">{DISCLAIMER}</p>
    </div>
  );
}
