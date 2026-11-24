import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  feeWording,
  formatNaira,
  initials,
  matchScore,
  REFERENCE_CODE,
  reportFileName,
  residenceLabel,
  runEngine,
  type EngineInput,
  type ProductResult,
} from './index';

const N = (naira: number) => naira * 100; // naira → kobo

/** Appendix C row: [product, basis, affordable, maxLoan, first, value, equity] */
type Row = [string, string, number, number, number, number, number];

function expectRows(results: ProductResult[], rows: Row[]) {
  for (const [code, basis, afford, loan, first, value, equity] of rows) {
    const r = results.find((x) => x.productCode === code && x.rateBasis === basis);
    expect(r, `${code}/${basis}`).toBeDefined();
    expect(r!.eligible, `${code}/${basis} eligible`).toBe(true);
    expect(r!.affordableMonthlyKobo, `${code} affordable`).toBe(N(afford));
    expect(r!.maxLoanKobo, `${code}/${basis} max loan`).toBe(N(loan));
    expect(r!.firstMonthlyRepaymentKobo, `${code}/${basis} first`).toBe(N(first));
    expect(r!.maxPropertyValueKobo, `${code}/${basis} value`).toBe(N(value));
    expect(r!.equityRequiredKobo, `${code}/${basis} equity`).toBe(N(equity));
  }
}

const base: Omit<EngineInput, 'age' | 'incomes'> = {
  nationality: 'NG',
  residence: 'nigeria',
  nhfContributor: 'yes',
  nonInterestPreference: 'no',
  propertyStatus: 'searching',
};

describe('Appendix C fixtures (to the Naira)', () => {
  it('A. Salaried, Lagos, ₦1,000,000 a month, age 35', () => {
    const out = runEngine(
      { ...base, age: 35, incomes: [{ amountMinor: N(1_000_000), currency: 'NGN' }] },
      DEFAULT_SETTINGS,
      DEFAULT_PRODUCTS,
    );
    expectRows(out.results, [
      ['NHF', 'fixed', 333_333, 34_615_350, 333_333, 38_461_500, 3_846_150],
      ['MREIF', 'fixed', 333_333, 26_134_275, 333_333, 29_038_083, 2_903_808],
      ['COMMERCIAL', 'low', 333_333, 13_953_474, 333_333, 15_503_860, 1_550_386],
      ['COMMERCIAL', 'high', 333_333, 10_909_080, 333_333, 12_121_200, 1_212_120],
    ]);
    expect(out.results.find((r) => r.productCode === 'NHF')!.tenorMonths).toBe(216);
    expect(out.headline?.productCode).toBe('NHF');
    expect(out.headline?.display).toBe('₦34,610,000');
    expect(out.headlineScenario).toBe('base');
    expect(out.insightKey).toBe('nhf_best_value');
    expect(out.variants).toEqual([]);
  });

  it('B. Joint, Abuja, ₦600,000 + ₦450,000 a month, age 45', () => {
    const out = runEngine(
      {
        ...base,
        age: 45,
        incomes: [
          { amountMinor: N(600_000), currency: 'NGN' },
          { amountMinor: N(450_000), currency: 'NGN' },
        ],
      },
      DEFAULT_SETTINGS,
      DEFAULT_PRODUCTS,
    );
    expectRows(out.results, [
      ['NHF', 'fixed', 350_000, 33_157_894, 350_000, 36_842_104, 3_684_210],
      ['MREIF', 'fixed', 350_000, 25_583_756, 350_000, 28_426_395, 2_842_639],
      ['COMMERCIAL', 'low', 350_000, 14_651_162, 350_000, 16_279_068, 1_627_906],
      ['COMMERCIAL', 'high', 350_000, 11_454_545, 350_000, 12_727_272, 1_272_727],
    ]);
    expect(out.results.find((r) => r.productCode === 'NHF')!.tenorMonths).toBe(180);
    expect(out.variants.map((v) => v.key)).toContain('age_term');
  });

  it('C. Diaspora, UK, £2,400 at stressed ₦1,600/£ (live ₦1,836/£), age 40', () => {
    const out = runEngine(
      {
        ...base,
        residence: 'diaspora',
        nhfContributor: null,
        age: 40,
        incomes: [{ amountMinor: 240_000, currency: 'GBP' }],
      },
      DEFAULT_SETTINGS,
      DEFAULT_PRODUCTS,
      { GBP: { live: 1836, stressed: 1600 } },
    );
    expect(out.headlineScenario).toBe('stressed');
    expectRows(out.results, [
      ['NHF_DIASPORA', 'fixed', 1_280_000, 50_000_000, 481_481, 55_555_555, 5_555_555],
      ['MREIF', 'fixed', 1_280_000, 100_355_716, 1_280_000, 111_506_351, 11_150_635],
      ['COMMERCIAL', 'low', 1_280_000, 53_581_395, 1_280_000, 59_534_883, 5_953_488],
      ['COMMERCIAL', 'high', 1_280_000, 41_890_909, 1_280_000, 46_545_454, 4_654_545],
    ]);
    expect(out.results.find((r) => r.productCode === 'NHF_DIASPORA')!.capped).toBe(true);
    expect(out.results.find((r) => r.productCode === 'NHF')!.eligible).toBe(false);
    expect(out.headline?.productCode).toBe('MREIF');
    expect(out.fx).toEqual({ currency: 'GBP', liveRate: 1836, stressedRate: 1600 });
    expect(out.variants.map((v) => v.key)).toEqual(expect.arrayContaining(['nhf_cap', 'diaspora']));
    // The base (live-rate) scenario is stored alongside
    expect(out.allResults.some((r) => r.scenario === 'base')).toBe(true);
  });
});

describe('Appendix B response shape', () => {
  it('matches the sample amounts in kobo', () => {
    const out = runEngine(
      { ...base, age: 35, incomes: [{ amountMinor: N(1_000_000), currency: 'NGN' }] },
      DEFAULT_SETTINGS,
      DEFAULT_PRODUCTS,
    );
    expect(out.engineVersion).toBe('2026.11.1');
    expect(out.assessed).toEqual({
      monthlyIncomeKobo: 100_000_000,
      affordableMonthlyKobo: 33_333_300,
      currency: 'NGN',
      scenario: 'base',
    });
    expect(out.headline).toMatchObject({ productCode: 'NHF', maxLoanKobo: 3_461_535_000 });
  });
});

describe('rules', () => {
  const run = (over: Partial<EngineInput>) =>
    runEngine(
      { ...base, age: 35, incomes: [{ amountMinor: N(1_000_000), currency: 'NGN' }], ...over },
      DEFAULT_SETTINGS,
      DEFAULT_PRODUCTS,
      { USD: { live: 1450, stressed: null } },
    );

  it('low income variant below ₦5m', () => {
    const out = run({ incomes: [{ amountMinor: N(80_000), currency: 'NGN' }] });
    expect(out.variants.map((v) => v.key)).toContain('low_income');
  });

  it('obligations wipe out affordability → every product ineligible', () => {
    const out = run({ incomes: [{ amountMinor: N(300_000), currency: 'NGN', obligationsMinor: N(150_000) }] });
    expect(out.results.every((r) => !r.eligible)).toBe(true);
    expect(out.headline).toBeNull();
    expect(out.insightKey).toBe('low_income');
  });

  it('obligations are deducted from the affordable repayment', () => {
    const out = run({ incomes: [{ amountMinor: N(1_000_000), currency: 'NGN', obligationsMinor: N(33_333) }] });
    expect(out.assessed.affordableMonthlyKobo).toBe(N(300_000));
  });

  it('term under 5 years is ineligible', () => {
    const out = run({ age: 57 });
    expect(out.results.every((r) => !r.eligible)).toBe(true);
  });

  it('non-Nigerians do not see NHF', () => {
    const out = run({ nationality: 'GH' });
    expect(out.results.find((r) => r.productCode === 'NHF')!.eligible).toBe(false);
    expect(out.variants.map((v) => v.key)).toContain('non_nigerian');
    expect(out.headline?.productCode).toBe('MREIF');
  });

  it('non-interest preference adds the Ijarah card and profit-rate wording', () => {
    const out = run({ nonInterestPreference: 'yes' });
    expect(out.results.some((r) => r.productCode === 'NON_INTEREST' && r.eligible)).toBe(true);
    expect(out.rateLabel).toBe('profit rate');
  });

  it('not an NHF contributor keeps the card with a note', () => {
    const out = run({ nhfContributor: 'not_sure' });
    const nhf = out.results.find((r) => r.productCode === 'NHF')!;
    expect(nhf.eligible).toBe(true);
    expect(nhf.notes).toContain('nhf_register_first');
  });

  it('target above estimate reports the gap', () => {
    const out = run({ targetValueMinKobo: N(75_000_000), targetValueMaxKobo: N(100_000_000) });
    const v = out.variants.find((x) => x.key === 'target_above');
    expect(v?.params.gapKobo).toBe(N(75_000_000 - 38_461_500));
  });

  it('USD with no override uses the 13% haircut', () => {
    const out = run({ residence: 'diaspora', incomes: [{ amountMinor: 300_000, currency: 'USD' }] });
    expect(out.fx?.stressedRate).toBeCloseTo(1261.5, 6);
  });

  it('legacy range answers run lower and upper scenarios', () => {
    const out = run({ legacyIncomeRangeKobo: { lower: N(500_000), upper: N(1_000_000) } });
    expect(out.headlineScenario).toBe('lower');
    expect(new Set(out.allResults.map((r) => r.scenario))).toEqual(new Set(['lower', 'upper']));
  });

  it('annuity sizing gives a higher loan than equal principal', () => {
    const out = runEngine(
      { ...base, age: 35, incomes: [{ amountMinor: N(1_000_000), currency: 'NGN' }] },
      { ...DEFAULT_SETTINGS, repaymentMethod: 'annuity' },
      DEFAULT_PRODUCTS,
    );
    expect(out.headline!.maxLoanKobo).toBeGreaterThan(N(34_615_350));
  });

  it('is deterministic', () => {
    expect(run({})).toEqual(run({}));
  });
});

describe('house rules', () => {
  it('fee wording', () => {
    expect(feeWording('found')).toBe('3% of the Mortgage approved');
    expect(feeWording('searching')).toBe('4% of the Mortgage approved');
    expect(feeWording('need_help')).toBe('4% of the Mortgage approved');
  });
  it('formats Naira', () => expect(formatNaira(N(50_000_000))).toBe('₦50,000,000'));
  it('reference code format', () => {
    expect(REFERENCE_CODE.test('HF-PQ-2026-1122-DO-0042')).toBe(true);
    expect(initials('David', 'Oloruntobi')).toBe('DO');
  });
  it('report file name', () => {
    expect(reportFileName(1, new Date(Date.UTC(2026, 10, 22)), 'Oloruntobi', 'David')).toBe(
      'MortgagePrequalification Report1 [22.Nov.26]_HomeFi-[Oloruntobi David]',
    );
  });
  it('residence label', () => {
    expect(residenceLabel('diaspora', 'GB', null)).toBe('United Kingdom');
    expect(residenceLabel('diaspora', 'XX', 'AU')).toBe('Australia');
    expect(residenceLabel('diaspora', null, 'NG')).toBe('Outside of Nigeria');
    expect(residenceLabel('nigeria', 'NG', null, 'Lagos')).toBe('Lagos, Nigeria');
  });
  it('match score rewards specialism and state', () => {
    const app = {
      residence: 'diaspora' as const,
      incomeSources: ['salaried_private'],
      isJoint: false,
      nonInterestPreference: 'no' as const,
      headlineProduct: 'MREIF',
      preferredStates: ['Lagos'],
    };
    const strong = matchScore(app, {
      id: 'a', specialisms: ['diaspora', 'mreif', 'first_time'], statesCovered: ['Lagos'],
      languages: ['en'], nextSlotAt: null, avgRating: null, approvalRate: null,
    });
    const weak = matchScore(app, {
      id: 'b', specialisms: ['non_interest'], statesCovered: ['Kano'],
      languages: ['ha'], nextSlotAt: null, avgRating: null, approvalRate: null,
    });
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBe(70);
  });
});
