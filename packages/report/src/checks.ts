/**
 * Automated checks before a report is emailed (brief, Report pipeline stage 4).
 * Any failure → status checks_failed, no email, ops alert.
 */
import { REFERENCE_CODE, formatNaira, formatRate, type EngineOutput } from '@homefi/engine';
import type { ReportData } from './template';

export interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

const FILE_NAME = /^MortgagePrequalification Report[12] \[\d{2}\.[A-Z][a-z]{2}\.\d{2}\]_HomeFi-\[.+ .+\]$/;

export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}

export function runChecks(opts: {
  html: string;
  pageCount: number;
  data: ReportData;
  stored: EngineOutput;
  primaryIncomeKobo: number | null;
  coIncomeKobo: number | null;
  expectedResidenceLabel: string;
}): CheckResult[] {
  const { html, data, stored } = opts;
  const text = htmlToText(html);
  const out: CheckResult[] = [];
  const add = (name: string, ok: boolean, detail?: string) => out.push({ name, ok, ...(detail && !ok ? { detail } : {}) });

  // Joint incomes summed correctly (NGN only; FX applications are checked through stored results)
  if (opts.primaryIncomeKobo !== null && opts.coIncomeKobo !== null && !stored.fx) {
    add('joint_income_sum', stored.assessed.monthlyIncomeKobo === opts.primaryIncomeKobo + opts.coIncomeKobo, `${stored.assessed.monthlyIncomeKobo} != ${opts.primaryIncomeKobo}+${opts.coIncomeKobo}`);
  }

  // The report uses exactly the stored engine output
  add('figures_from_store', JSON.stringify(data.estimate.results) === JSON.stringify(stored.results), 'report estimate differs from stored results');

  // Every eligible product's figures appear in the PDF text
  const missing: string[] = [];
  for (const r of stored.results.filter((x) => x.eligible)) {
    for (const v of [r.maxLoanKobo, r.maxPropertyValueKobo]) if (!text.includes(formatNaira(v))) missing.push(`${r.productCode}:${formatNaira(v)}`);
    if (!text.includes(formatRate(r.interestRate))) missing.push(`${r.productCode}:${formatRate(r.interestRate)}`);
  }
  if (stored.headline && !text.includes(stored.headline.display)) missing.push(`headline:${stored.headline.display}`);
  add('figures_present', missing.length === 0, missing.join(', '));

  // Narrative introduced no figures of its own
  const narrative = [data.narrative.profile_summary, data.narrative.insight, data.narrative.recommended_path, ...data.narrative.next_steps, ...data.narrative.notes].join(' ');
  add('narrative_has_no_figures', !/₦|%|\d{2,}/.test(narrative), 'narrative contains a figure');

  // Insight names a product that is shown
  const shown = stored.results.filter((r) => r.eligible).map((r) => r.productCode);
  const insightNames = [
    ['NHF Diaspora', 'NHF_DIASPORA'],
    ['NHF', 'NHF'],
    ['MREIF', 'MREIF'],
    ['commercial', 'COMMERCIAL'],
    ['non-interest', 'NON_INTEREST'],
  ] as const;
  const insight = data.narrative.insight;
  const named = insightNames.filter(([w]) => new RegExp(`\\b${w}\\b`, 'i').test(w === 'NHF' ? insight.replace(/NHF Diaspora/gi, '') : insight)).map(([, c]) => c);
  add(
    'insight_names_shown_product',
    named.every((c) => shown.includes(c) || (c === 'NHF' && shown.includes('NHF_DIASPORA'))) && (named.length > 0 || !stored.headline),
    `insight names ${named.join(',') || 'nothing'}`,
  );

  // Fee wording: 3% or 4% of the Mortgage approved, never a Naira figure
  const feeOk = /(3|4)% of the Mortgage approved/.test(text) && text.includes(stored.feeWording);
  const feeNaira = /processing fee[^.]{0,80}₦/i.test(text);
  add('fee_wording', feeOk && !feeNaira, feeNaira ? 'fee converted to Naira' : 'fee wording missing');

  // Residence label follows the rule
  add('residence_label', data.residenceLabel === opts.expectedResidenceLabel && text.includes(data.residenceLabel), `${data.residenceLabel} vs ${opts.expectedResidenceLabel}`);

  add('page_count', opts.pageCount === 6, `${opts.pageCount} pages`);

  // Both links present: dashboard, and the booking link on the word "Here"
  const hereLink = new RegExp(`Book a 1-on-1 Advisory call <a href="${data.bookingUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;')}">Here</a>`);
  add('booking_link_on_here', hereLink.test(html), 'booking link missing');
  add('dashboard_link', html.includes(`href="${data.dashboardUrl.replace(/&/g, '&amp;')}"`), 'dashboard link missing');

  add('reference_code', REFERENCE_CODE.test(data.referenceCode) && text.includes(data.referenceCode), data.referenceCode);
  add('file_name', FILE_NAME.test(data.fileName), data.fileName);
  add('disclaimer', text.includes('It is not a loan offer or an approval'), 'disclaimer missing');
  return out;
}

export const allPassed = (c: CheckResult[]) => c.every((x) => x.ok);
