import Decimal from 'decimal.js';
import { formatNaira } from './format';
import type {
  EngineInput,
  EngineOutput,
  EngineSettings,
  FxRate,
  ProductResult,
  RateProduct,
  Scenario,
  Variant,
} from './types';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_DOWN });

const D = (v: string | number) => new Decimal(v);
const NIGERIAN = new Set(['NG', 'NG_DUAL']);
const MIN_TERM_YEARS = 5;

export class EngineError extends Error {}

/** Naira (whole) to kobo */
const toKobo = (naira: Decimal) => naira.mul(100).toNumber();

/** Stressed rate: admin override, else live × (1 − haircut) */
export function stressedRate(fx: FxRate, haircut: string | number): Decimal {
  if (fx.stressed !== null && fx.stressed !== undefined) return D(fx.stressed);
  return D(fx.live).mul(D(1).minus(D(haircut)));
}

interface Assessed {
  scenario: Scenario;
  incomeNaira: Decimal;
  obligationsNaira: Decimal;
}

/** Work out the assessed monthly income (and obligations) for each scenario to run. */
function assessIncome(
  input: EngineInput,
  settings: EngineSettings,
  fxRates: Record<string, FxRate>,
): { scenarios: Assessed[]; headline: Scenario; fx: EngineOutput['fx'] } {
  if (input.legacyIncomeRangeKobo) {
    const { lower, upper } = input.legacyIncomeRangeKobo;
    const obligations = sumIncome(input, fxRates, settings, 'live', 'obligationsMinor');
    return {
      scenarios: [
        { scenario: 'lower', incomeNaira: D(lower).div(100), obligationsNaira: obligations },
        { scenario: 'upper', incomeNaira: D(upper).div(100), obligationsNaira: obligations },
      ],
      headline: 'lower',
      fx: null,
    };
  }

  if (input.incomes.length === 0) throw new EngineError('At least one income is required');
  const foreign = input.incomes.find((l) => l.currency !== 'NGN');
  if (!foreign) {
    return {
      scenarios: [
        {
          scenario: 'base',
          incomeNaira: sumIncome(input, fxRates, settings, 'live', 'amountMinor'),
          obligationsNaira: sumIncome(input, fxRates, settings, 'live', 'obligationsMinor'),
        },
      ],
      headline: 'base',
      fx: null,
    };
  }

  const rate = fxRates[foreign.currency];
  if (!rate) throw new EngineError(`No FX rate for ${foreign.currency}`);
  return {
    scenarios: [
      {
        scenario: 'stressed',
        incomeNaira: sumIncome(input, fxRates, settings, 'stressed', 'amountMinor'),
        obligationsNaira: sumIncome(input, fxRates, settings, 'stressed', 'obligationsMinor'),
      },
      {
        scenario: 'base',
        incomeNaira: sumIncome(input, fxRates, settings, 'live', 'amountMinor'),
        obligationsNaira: sumIncome(input, fxRates, settings, 'live', 'obligationsMinor'),
      },
    ],
    headline: 'stressed',
    fx: {
      currency: foreign.currency,
      liveRate: D(rate.live).toNumber(),
      stressedRate: stressedRate(rate, settings.fxHaircut).toNumber(),
    },
  };
}

function sumIncome(
  input: EngineInput,
  fxRates: Record<string, FxRate>,
  settings: EngineSettings,
  basis: 'live' | 'stressed',
  field: 'amountMinor' | 'obligationsMinor',
): Decimal {
  return input.incomes.reduce((acc, line) => {
    const minor = D(line[field] ?? 0);
    if (line.currency === 'NGN') return acc.plus(minor.div(100));
    const fx = fxRates[line.currency];
    if (!fx) throw new EngineError(`No FX rate for ${line.currency}`);
    const rate = basis === 'live' ? D(fx.live) : stressedRate(fx, settings.fxHaircut);
    return acc.plus(minor.div(100).mul(rate));
  }, D(0));
}

/**
 * Maximum loan for an affordable first-month payment A over n months at annual rate r.
 * Equal principal: first payment = P/n + P·r/12  ⇒  P = A·12n / (12 + n·r).
 * Annuity: P = A · (1 − (1 + i)^−n) / i.
 */
export function maxLoan(
  affordableNaira: Decimal,
  months: number,
  annualRate: Decimal,
  method: EngineSettings['repaymentMethod'],
): Decimal {
  if (method === 'equal_principal') {
    return affordableNaira.mul(12 * months).div(D(12).plus(annualRate.mul(months))).floor();
  }
  const i = annualRate.div(12);
  if (i.isZero()) return affordableNaira.mul(months).floor();
  const factor = D(1).minus(D(1).plus(i).pow(-months)).div(i);
  return affordableNaira.mul(factor).floor();
}

/** First (largest) monthly repayment for a loan P. */
export function firstRepayment(
  loan: Decimal,
  months: number,
  annualRate: Decimal,
  method: EngineSettings['repaymentMethod'],
): Decimal {
  const i = annualRate.div(12);
  if (method === 'equal_principal') return loan.div(months).plus(loan.mul(i)).floor();
  if (i.isZero()) return loan.div(months).floor();
  return loan.mul(i).div(D(1).minus(D(1).plus(i).pow(-months))).floor();
}

function isEligible(p: RateProduct, input: EngineInput): boolean {
  const e = p.eligibility ?? {};
  if (e.nationality && !e.nationality.includes(input.nationality)) return false;
  if (e.residence && e.residence !== input.residence) return false;
  if (e.preference === 'yes' && input.nonInterestPreference !== 'yes') return false;
  return true;
}

function sizeProduct(
  p: RateProduct,
  rate: Decimal,
  rateBasis: ProductResult['rateBasis'],
  a: Assessed,
  affordable: Decimal,
  input: EngineInput,
  settings: EngineSettings,
): ProductResult {
  const ageYears = settings.maxAgeAtMaturity - input.age;
  const years = Math.min(p.maxTenorYears, ageYears);
  const months = Math.max(years, 0) * 12;
  const notes: string[] = [];

  let eligible = isEligible(p, input) && affordable.gt(0);
  if (years < MIN_TERM_YEARS) {
    eligible = false;
    notes.push('term_too_short');
  }

  let loan = D(0);
  let capped = false;
  let first = D(0);
  if (eligible) {
    loan = maxLoan(affordable, months, rate, settings.repaymentMethod);
    if (p.loanCapKobo !== null && loan.gt(D(p.loanCapKobo).div(100))) {
      loan = D(p.loanCapKobo).div(100);
      capped = true;
    }
    first = capped ? firstRepayment(loan, months, rate, settings.repaymentMethod) : affordable;
  }
  const equityPct = D(p.equityPct);
  const value = eligible ? loan.div(D(1).minus(equityPct)).floor() : D(0);

  if (p.code === 'NHF' && input.nhfContributor && input.nhfContributor !== 'yes') {
    notes.push('nhf_register_first');
  }

  return {
    productCode: p.code,
    category: p.category,
    scenario: a.scenario,
    rateBasis,
    interestRate: rate.toNumber(),
    tenorMonths: months,
    assessedMonthlyIncomeKobo: toKobo(a.incomeNaira.floor()),
    affordableMonthlyKobo: toKobo(affordable.gt(0) ? affordable : D(0)),
    maxLoanKobo: toKobo(loan),
    firstMonthlyRepaymentKobo: toKobo(first),
    maxPropertyValueKobo: toKobo(value),
    equityRequiredKobo: toKobo(value.minus(loan)),
    capped,
    eligible,
    ageLimited: ageYears < p.maxTenorYears,
    notes,
  };
}

function runScenario(
  a: Assessed,
  input: EngineInput,
  settings: EngineSettings,
  products: RateProduct[],
): ProductResult[] {
  const share = a.incomeNaira.mul(settings.affordabilityNum).div(settings.affordabilityDen).floor();
  const affordable = settings.deductObligations ? share.minus(a.obligationsNaira.floor()) : share;

  const out: ProductResult[] = [];
  for (const p of products.filter((x) => x.active)) {
    const min = D(p.rateMin);
    const max = D(p.rateMax);
    if (min.eq(max)) {
      out.push(sizeProduct(p, min, 'fixed', a, affordable, input, settings));
    } else {
      out.push(sizeProduct(p, min, 'low', a, affordable, input, settings));
      out.push(sizeProduct(p, max, 'high', a, affordable, input, settings));
    }
  }
  return out;
}

export function feeWording(status: EngineInput['propertyStatus']): EngineOutput['feeWording'] {
  return status === 'found' ? '3% of the Mortgage approved' : '4% of the Mortgage approved';
}

/** Round a kobo amount down to the display step (default N10,000). */
export function roundDisplay(kobo: number, stepKobo: number): number {
  return Math.floor(kobo / stepKobo) * stepKobo;
}

export function runEngine(
  input: EngineInput,
  settings: EngineSettings,
  products: RateProduct[],
  fxRates: Record<string, FxRate> = {},
): EngineOutput {
  if (!Number.isInteger(input.age) || input.age < 18 || input.age > 70) {
    throw new EngineError('Age must be a whole number from 18 to 70');
  }
  const { scenarios, headline: headlineScenario, fx } = assessIncome(input, settings, fxRates);
  const allResults = scenarios.flatMap((s) => runScenario(s, input, settings, products));
  const results = allResults.filter((r) => r.scenario === headlineScenario);
  const head = scenarios.find((s) => s.scenario === headlineScenario)!;

  // Headline: largest eligible concessionary loan; otherwise commercial at rate_min
  const concessionary = results
    .filter((r) => r.category === 'concessionary' && r.eligible)
    .sort((x, y) => y.maxLoanKobo - x.maxLoanKobo);
  const commercialLow = results.find(
    (r) => r.productCode === 'COMMERCIAL' && r.eligible && r.rateBasis !== 'high',
  );
  const best = concessionary[0] ?? commercialLow ?? null;
  const headline = best
    ? {
        productCode: best.productCode,
        maxLoanKobo: best.maxLoanKobo,
        displayKobo: roundDisplay(best.maxLoanKobo, settings.displayRoundingKobo),
        display: formatNaira(roundDisplay(best.maxLoanKobo, settings.displayRoundingKobo)),
      }
    : null;

  const affordableKobo = results[0]?.affordableMonthlyKobo ?? 0;
  const variants = buildVariants(input, settings, results, best, fx, affordableKobo);
  const { key: insightKey, text: insight } = buildInsight(input, results, best, variants);

  return {
    engineVersion: settings.version,
    headlineScenario,
    assessed: {
      monthlyIncomeKobo: toKobo(head.incomeNaira.floor()),
      affordableMonthlyKobo: affordableKobo,
      currency: 'NGN',
      scenario: headlineScenario,
    },
    headline,
    results,
    allResults,
    variants,
    insightKey,
    insight,
    feeWording: feeWording(input.propertyStatus),
    fx,
    rateLabel: input.nonInterestPreference === 'yes' ? 'profit rate' : 'interest',
  };
}

function buildVariants(
  input: EngineInput,
  settings: EngineSettings,
  results: ProductResult[],
  best: ProductResult | null,
  fx: EngineOutput['fx'],
  affordableKobo: number,
): Variant[] {
  const v: Variant[] = [];
  if (affordableKobo <= 0 || !best || best.maxLoanKobo < settings.minUsefulLoanKobo) {
    v.push({ key: 'low_income', params: { minUsefulLoanKobo: settings.minUsefulLoanKobo } });
  }
  if (results.some((r) => (r.productCode === 'NHF' || r.productCode === 'NHF_DIASPORA') && r.capped)) {
    v.push({ key: 'nhf_cap', params: {} });
  }
  const target = input.targetValueMinKobo ?? input.targetValueMaxKobo ?? null;
  if (best && target && target > best.maxPropertyValueKobo) {
    v.push({ key: 'target_above', params: { gapKobo: target - best.maxPropertyValueKobo } });
  }
  if (best && best.eligible && best.ageLimited) {
    v.push({
      key: 'age_term',
      params: { maxAge: settings.maxAgeAtMaturity, years: best.tenorMonths / 12 },
    });
  }
  if (input.residence === 'diaspora') {
    v.push({
      key: 'diaspora',
      params: { liveRate: fx?.liveRate ?? null, stressedRate: fx?.stressedRate ?? null, currency: fx?.currency ?? null },
    });
  }
  const nhf = results.find((r) => r.productCode === 'NHF' && r.eligible);
  if (nhf && input.nhfContributor && input.nhfContributor !== 'yes') {
    v.push({ key: 'nhf_not_contributor', params: {} });
  }
  if (input.nonInterestPreference === 'yes') v.push({ key: 'non_interest', params: {} });
  if (!NIGERIAN.has(input.nationality)) v.push({ key: 'non_nigerian', params: {} });
  return v;
}

const PRODUCT_SHORT: Record<string, string> = {
  NHF: 'NHF',
  NHF_DIASPORA: 'NHF Diaspora',
  MREIF: 'MREIF',
  COMMERCIAL: 'A commercial mortgage',
  NON_INTEREST: 'Non-interest finance',
};

/** One to three sentences chosen by rules. Never introduces a figure the result does not show. */
function buildInsight(
  input: EngineInput,
  results: ProductResult[],
  best: ProductResult | null,
  variants: Variant[],
): { key: string; text: string } {
  const has = (k: string) => variants.some((x) => x.key === k);
  const joint = input.incomes.length > 1;
  const closer = joint ? 'a bigger deposit' : 'MREIF or a joint application';

  if (has('low_income') || !best) {
    return {
      key: 'low_income',
      text: 'On your current income alone, a mortgage would be small. Applying jointly, saving a bigger deposit, or a rent-to-own plan can change that.',
    };
  }
  const nhfCapped = results.find(
    (r) => (r.productCode === 'NHF' || r.productCode === 'NHF_DIASPORA') && r.capped,
  );
  if (nhfCapped && best.productCode === 'MREIF') {
    return {
      key: 'nhf_capped_mreif_best',
      text: 'NHF loans are capped, so MREIF gives you the most for a bigger home. Your advisor can show you how to combine options.',
    };
  }
  if (best.productCode === 'NHF' || best.productCode === 'NHF_DIASPORA') {
    if (has('target_above')) {
      return {
        key: 'nhf_best_target_gap',
        text: `${PRODUCT_SHORT[best.productCode]} gives you the most for your money, but the home you want costs more than this estimate covers. ${capitalise(closer)} gets you closer.`,
      };
    }
    return {
      key: 'nhf_best_value',
      text: `${PRODUCT_SHORT[best.productCode]} gives you the most for your money at the lowest rate. It takes longer to process, so MREIF is a strong alternative if you need to move faster.`,
    };
  }
  if (best.productCode === 'MREIF') {
    return {
      key: 'mreif_best',
      text: has('target_above')
        ? 'MREIF gives you the most for your money, but the home you want costs more than this estimate covers. A bigger deposit or a joint application can close the gap.'
        : 'MREIF gives you the most for your money through our partner banks, at a single-digit rate.',
    };
  }
  return {
    key: 'commercial_only',
    text: 'Commercial lenders are your route today. They are often faster, and a bigger deposit can lower what you pay each month.',
  };
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
