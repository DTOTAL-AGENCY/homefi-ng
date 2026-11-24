export type ProductCode = 'NHF' | 'NHF_DIASPORA' | 'MREIF' | 'COMMERCIAL' | 'NON_INTEREST';
export type Category = 'concessionary' | 'commercial' | 'non_interest';
export type Residence = 'nigeria' | 'diaspora';
export type Scenario = 'base' | 'stressed' | 'lower' | 'upper';
export type RateBasis = 'fixed' | 'low' | 'high';
export type YesNoNotSure = 'yes' | 'no' | 'not_sure';

export interface RateProduct {
  code: ProductCode;
  name: string;
  category: Category;
  /** Annual rate as a decimal string or number, e.g. "0.06" */
  rateMin: string | number;
  rateMax: string | number;
  maxTenorYears: number;
  /** Loan cap in kobo, null for no cap */
  loanCapKobo: number | null;
  equityPct: string | number;
  eligibility: { nationality?: string[]; residence?: Residence; preference?: 'yes' };
  active: boolean;
}

export interface EngineSettings {
  version: string;
  affordabilityNum: number;
  affordabilityDen: number;
  deductObligations: boolean;
  repaymentMethod: 'equal_principal' | 'annuity';
  maxAgeAtMaturity: number;
  /** Default haircut below the live rate when no stressed override exists, e.g. 0.13 */
  fxHaircut: string | number;
  minUsefulLoanKobo: number;
  /** Headline display rounds down to this, in kobo (default N10,000) */
  displayRoundingKobo: number;
}

export interface FxRate {
  /** Naira per 1 unit of the currency */
  live: string | number;
  /** Admin override; when null the engine applies fxHaircut to live */
  stressed: string | number | null;
}

export interface IncomeLine {
  /** Monthly take-home in minor units of `currency` */
  amountMinor: number;
  currency: string;
  /** Existing monthly loan repayments in minor units of `currency` */
  obligationsMinor?: number;
}

export interface EngineInput {
  age: number;
  /** 'NG', 'NG_DUAL' or ISO 3166 alpha-2 */
  nationality: string;
  residence: Residence;
  nhfContributor?: YesNoNotSure | null;
  nonInterestPreference: 'yes' | 'no' | 'open';
  propertyStatus: 'found' | 'searching' | 'need_help';
  targetValueMinKobo?: number | null;
  targetValueMaxKobo?: number | null;
  /** Primary first, co-applicant second when joint */
  incomes: IncomeLine[];
  /**
   * Legacy Google Form range answers: sums of lower and upper bounds in kobo.
   * When present, incomes are ignored and the lower/upper scenarios are run.
   */
  legacyIncomeRangeKobo?: { lower: number; upper: number } | null;
}

export interface ProductResult {
  productCode: ProductCode;
  category: Category;
  scenario: Scenario;
  rateBasis: RateBasis;
  interestRate: number;
  tenorMonths: number;
  assessedMonthlyIncomeKobo: number;
  affordableMonthlyKobo: number;
  maxLoanKobo: number;
  firstMonthlyRepaymentKobo: number;
  maxPropertyValueKobo: number;
  equityRequiredKobo: number;
  capped: boolean;
  eligible: boolean;
  /** Years were shortened by the maximum age rule */
  ageLimited: boolean;
  notes: string[];
}

export type VariantKey =
  | 'low_income'
  | 'nhf_cap'
  | 'target_above'
  | 'age_term'
  | 'diaspora'
  | 'nhf_not_contributor'
  | 'non_interest'
  | 'non_nigerian';

export interface Variant {
  key: VariantKey;
  params: Record<string, string | number | null>;
}

export interface EngineOutput {
  engineVersion: string;
  headlineScenario: Scenario;
  assessed: {
    monthlyIncomeKobo: number;
    affordableMonthlyKobo: number;
    currency: 'NGN';
    scenario: Scenario;
  };
  headline: { productCode: ProductCode; maxLoanKobo: number; displayKobo: number; display: string } | null;
  /** Results for the headline scenario (what the result screen shows) */
  results: ProductResult[];
  /** Every scenario, for storage in prequal_results */
  allResults: ProductResult[];
  variants: Variant[];
  insightKey: string;
  insight: string;
  feeWording: '3% of the Mortgage approved' | '4% of the Mortgage approved';
  fx: { currency: string; liveRate: number; stressedRate: number } | null;
  /** Wording switches from "interest" to "profit rate" */
  rateLabel: 'interest' | 'profit rate';
}
