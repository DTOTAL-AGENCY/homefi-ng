/** Map database rows to engine inputs, shared by the web app, the worker and the admin. */
import type { EngineSettings, FxRate, ProductResult, RateProduct } from '@homefi/engine';

export interface EngineSettingsRow {
  version: string;
  affordability_num: number;
  affordability_den: number;
  deduct_obligations: boolean;
  repayment_method: string;
  max_age_at_maturity: number;
  fx_haircut: number | string;
  min_useful_loan_kobo: number;
  min_display_rounding_kobo: number;
  rates_snapshot: unknown;
  match_weights: unknown;
}

export interface RateProductRow {
  code: string;
  name: string;
  category: string;
  rate_min: number | string;
  rate_max: number | string;
  max_tenor_years: number;
  loan_cap_kobo: number | null;
  equity_pct: number | string;
  eligibility: unknown;
  active: boolean;
}

export function settingsFromRow(r: EngineSettingsRow): EngineSettings {
  return {
    version: r.version,
    affordabilityNum: r.affordability_num,
    affordabilityDen: r.affordability_den,
    deductObligations: r.deduct_obligations,
    repaymentMethod: r.repayment_method as EngineSettings['repaymentMethod'],
    maxAgeAtMaturity: r.max_age_at_maturity,
    fxHaircut: String(r.fx_haircut),
    minUsefulLoanKobo: Number(r.min_useful_loan_kobo),
    displayRoundingKobo: Number(r.min_display_rounding_kobo),
  };
}

export function productFromRow(r: RateProductRow): RateProduct {
  return {
    code: r.code as RateProduct['code'],
    name: r.name,
    category: r.category as RateProduct['category'],
    rateMin: String(r.rate_min),
    rateMax: String(r.rate_max),
    maxTenorYears: r.max_tenor_years,
    loanCapKobo: r.loan_cap_kobo === null ? null : Number(r.loan_cap_kobo),
    equityPct: String(r.equity_pct),
    eligibility: (r.eligibility ?? {}) as RateProduct['eligibility'],
    active: r.active,
  };
}

/** Products frozen into an engine version */
export function productsFromSnapshot(snapshot: unknown): RateProduct[] {
  return (Array.isArray(snapshot) ? snapshot : []).map((r) => productFromRow(r as RateProductRow));
}

export interface FxRow {
  currency: string;
  live_rate_to_ngn: number | string;
  stressed_rate_to_ngn: number | string | null;
  fetched_at: string;
}

/** Latest rate per currency */
export function fxFromRows(rows: FxRow[]): Record<string, FxRate> {
  const latest: Record<string, FxRow> = {};
  for (const r of rows) {
    const cur = latest[r.currency];
    if (!cur || cur.fetched_at < r.fetched_at) latest[r.currency] = r;
  }
  return Object.fromEntries(
    Object.values(latest).map((r) => [
      r.currency,
      { live: String(r.live_rate_to_ngn), stressed: r.stressed_rate_to_ngn === null ? null : String(r.stressed_rate_to_ngn) },
    ]),
  );
}

export function resultToRow(applicationId: string, version: string, r: ProductResult) {
  return {
    application_id: applicationId,
    product_code: r.productCode,
    scenario: r.scenario,
    rate_basis: r.rateBasis,
    interest_rate: r.interestRate,
    tenor_months: r.tenorMonths,
    assessed_monthly_income_kobo: r.assessedMonthlyIncomeKobo,
    affordable_monthly_kobo: r.affordableMonthlyKobo,
    max_loan_kobo: r.maxLoanKobo,
    first_monthly_repayment_kobo: r.firstMonthlyRepaymentKobo,
    max_property_value_kobo: r.maxPropertyValueKobo,
    equity_required_kobo: r.equityRequiredKobo,
    capped: r.capped,
    eligible: r.eligible,
    notes: r.notes,
    engine_version: version,
  };
}
