import { describe, expect, it } from 'vitest';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, runEngine } from '@homefi/engine';
import { allPassed, documentsFor, fallbackNarrative, narrativeProblems, renderReportHtml, runChecks, type NarrativeFacts, type ReportData } from './index';

const estimate = runEngine(
  { age: 35, nationality: 'NG', residence: 'nigeria', nhfContributor: 'yes', nonInterestPreference: 'no', propertyStatus: 'found', targetValueMinKobo: 3_000_000_000, targetValueMaxKobo: 5_000_000_000, incomes: [{ amountMinor: 100_000_000, currency: 'NGN' }] },
  DEFAULT_SETTINGS,
  DEFAULT_PRODUCTS,
);
const facts: NarrativeFacts = {
  residence: 'Lagos, Nigeria', incomeSources: ['salaried_private'], isJoint: false, ageBand: '30s', propertyType: 'Terrace', intendedUse: 'live',
  preferredStates: ['Lagos'], timeline: '6 to 12 months', propertyStatus: 'found', nonInterestPreference: 'no', nhfContributor: 'yes', hasRsa: 'yes',
  rsaEquityUse: 'explore', financialReadiness: 'ready', proceedIntent: 'prepare_and_contact', propertyFeatures: [], headlineProduct: 'NHF',
  eligibleProducts: ['NHF', 'MREIF', 'COMMERCIAL'], variants: [], insightRule: estimate.insight, feeWording: estimate.feeWording, rateWord: 'interest',
};
const data: ReportData = {
  reportNumber: 1, referenceCode: 'HF-PQ-2026-1122-DO-0042', fileName: 'MortgagePrequalification Report1 [22.Nov.26]_HomeFi-[Oloruntobi David]',
  date: new Date(Date.UTC(2026, 10, 22)), applicant: { title: 'mr', firstName: 'David', lastName: 'Oloruntobi', otherNames: null }, coApplicant: null,
  residenceLabel: 'Lagos, Nigeria', incomeLines: [{ who: 'Your', source: 'Salaried (private)', amountMinor: 100_000_000, currency: 'NGN' }], estimate,
  target: { minKobo: 3_000_000_000, maxKobo: 5_000_000_000, label: '₦30m to ₦50m' },
  property: { type: 'Terrace', states: ['Lagos'], city: 'Lekki', status: 'Found', timeline: '6 to 12 months' },
  documents: documentsFor(['salaried_private'], 'nigeria'), narrative: fallbackNarrative(facts, estimate),
  dashboardUrl: 'https://homefi.ng/app/reports/x', bookingUrl: 'https://homefi.ng/app/advisors?report=x',
};

describe('report', () => {
  const html = renderReportHtml(data);
  it('has 6 pages and the brief rules', () => {
    expect(html.match(/class="page/g)).toHaveLength(6);
    expect(html).toContain('3% of the Mortgage approved');
    expect(html).toContain('Book a 1-on-1 Advisory call <a href="https://homefi.ng/app/advisors?report=x">Here</a>');
  });
  it('passes every automated check', () => {
    const checks = runChecks({ html, pageCount: 6, data, stored: estimate, primaryIncomeKobo: null, coIncomeKobo: null, expectedResidenceLabel: 'Lagos, Nigeria' });
    expect(checks.filter((c) => !c.ok)).toEqual([]);
    expect(allPassed(checks)).toBe(true);
  });
  it('fails when the page count or fee wording is wrong', () => {
    const bad = runChecks({ html: html.replace('3% of the Mortgage approved', '₦1,000,000 processing fee'), pageCount: 7, data, stored: estimate, primaryIncomeKobo: null, coIncomeKobo: null, expectedResidenceLabel: 'Lagos, Nigeria' });
    expect(bad.find((c) => c.name === 'page_count')?.ok).toBe(false);
    expect(bad.find((c) => c.name === 'fee_wording')?.ok).toBe(false);
  });
  it('rejects AI narrative with figures or ineligible products', () => {
    const n = fallbackNarrative(facts, estimate);
    expect(narrativeProblems(n, facts.eligibleProducts)).toEqual([]);
    expect(narrativeProblems({ ...n, insight: 'You can borrow ₦40m with NHF Diaspora.' }, facts.eligibleProducts).length).toBeGreaterThan(0);
  });
});
