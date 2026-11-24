/**
 * The 6-page A4 Mortgage Prequalification Report. Every figure comes from the stored
 * engine output; Claude's narrative supplies words only.
 *   1 Cover · 2 Applicant Profile and Basis of Assessment · 3 FG concessionary scenarios
 *   4 Commercial scenarios · 5 Recommended Path and Next Steps · 6 Important Notes and Disclaimer
 */
import {
  DISCLAIMER,
  PRODUCT_LABELS,
  formatNaira,
  formatRate,
  variantCopy,
  type EngineOutput,
  type ProductResult,
} from '@homefi/engine';
import type { Narrative } from './narrative';

export interface ReportData {
  reportNumber: 1 | 2;
  referenceCode: string;
  fileName: string;
  date: Date;
  applicant: { title: string | null; firstName: string; lastName: string; otherNames: string | null };
  coApplicant: { firstName: string; lastName: string } | null;
  residenceLabel: string;
  incomeLines: Array<{ who: string; source: string; amountMinor: number; currency: string }>;
  estimate: EngineOutput;
  target: { minKobo: number | null; maxKobo: number | null; label: string };
  property: { type: string; states: string[]; city: string | null; status: string; timeline: string };
  documents: string[];
  narrative: Narrative;
  dashboardUrl: string;
  bookingUrl: string;
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const CUR: Record<string, string> = { NGN: '₦', GBP: '£', USD: '$', EUR: '€', CAD: 'C$', AED: 'AED ' };
const money = (minor: number, cur: string) =>
  cur === 'NGN' ? formatNaira(minor) : `${CUR[cur] ?? cur + ' '}${Math.floor(minor / 100).toLocaleString('en-GB')}`;

const TITLES: Record<string, string> = { mr: 'Mr', mrs: 'Mrs', ms: 'Ms', dr: 'Dr' };

function page(n: number, title: string | null, body: string, ref: string) {
  return `<section class="page${n === 1 ? ' cover' : ''}">
${title ? `<header><span class="brand">Home<b>Fi</b></span><span>${esc(title)}</span></header>` : ''}
<div class="content">${body}</div>
${n === 1 ? '' : `<footer><span>Ref ${esc(ref)}</span><span>Page ${n} of 6</span></footer>`}
</section>`;
}

function productCard(r: ProductResult, rateWord: string) {
  return `<div class="card">
<h3>${esc(PRODUCT_LABELS[r.productCode])}</h3>
<p class="meta">${formatRate(r.interestRate)} a year${rateWord === 'profit rate' ? ' (profit rate)' : ''} · up to ${r.tenorMonths / 12} years${r.capped ? ' · capped at the scheme limit' : ''}</p>
<table class="kv">
<tr><td>You could borrow</td><td>${formatNaira(r.maxLoanKobo)}</td></tr>
<tr><td>Monthly repayment from</td><td>${formatNaira(r.firstMonthlyRepaymentKobo)}</td></tr>
<tr><td>Property value you can target</td><td>up to ${formatNaira(r.maxPropertyValueKobo)}</td></tr>
<tr><td>Deposit (10% equity)</td><td>${formatNaira(r.equityRequiredKobo)}</td></tr>
</table></div>`;
}

function targetValues(t: ReportData['target']): number[] {
  const vals = [t.minKobo, t.maxKobo].filter((v): v is number => !!v && v > 0);
  if (vals.length === 2 && vals[0] !== vals[1]) vals.splice(1, 0, Math.round((vals[0]! + vals[1]!) / 2 / 100_000_000) * 100_000_000);
  return [...new Set(vals)];
}

function equityTable(results: ProductResult[], t: ReportData['target']) {
  const values = targetValues(t);
  if (!values.length || !results.length) return '';
  const rows = values
    .map((v) => {
      const cells = results
        .map((r) => {
          const equity = Math.round(v * 0.1);
          const loan = v - equity;
          const ok = loan <= r.maxLoanKobo;
          return `<td>${ok ? 'Within estimate' : `Short by ${formatNaira(loan - r.maxLoanKobo)}`}</td>`;
        })
        .join('');
      return `<tr><td>${formatNaira(v)}</td><td>${formatNaira(Math.round(v * 0.1))}</td><td>${formatNaira(v - Math.round(v * 0.1))}</td>${cells}</tr>`;
    })
    .join('');
  const heads = results.map((r) => `<th>${esc(PRODUCT_LABELS[r.productCode])}${r.rateBasis !== 'fixed' ? ` (${formatRate(r.interestRate)})` : ''}</th>`).join('');
  return `<h3>Against the home you want (${esc(t.label)})</h3>
<table class="grid"><thead><tr><th>Property value</th><th>Deposit (10%)</th><th>Loan needed</th>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function renderReportHtml(d: ReportData): string {
  const e = d.estimate;
  const fullName = [d.applicant.title && TITLES[d.applicant.title], d.applicant.firstName, d.applicant.otherNames, d.applicant.lastName]
    .filter(Boolean)
    .join(' ');
  const dateStr = d.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
  const ordinal = d.reportNumber === 1 ? '1st' : '2nd';
  const concessionary = e.results.filter((r) => r.category === 'concessionary' && r.eligible).sort((a, b) => b.maxLoanKobo - a.maxLoanKobo);
  const commercial = e.results.filter((r) => r.productCode === 'COMMERCIAL' && r.eligible);
  const nonInterest = e.results.filter((r) => r.productCode === 'NON_INTEREST' && r.eligible);
  const variants = e.variants.map(variantCopy);

  const cover = page(
    1,
    null,
    `<div class="cover-top"><span class="brand big">Home<b>Fi</b></span></div>
<div class="cover-mid">
<p class="eyebrow">${ordinal} Mortgage Prequalification Report</p>
<h1>${esc(fullName)}</h1>
${d.coApplicant ? `<p class="sub">Joint application with ${esc(d.coApplicant.firstName)} ${esc(d.coApplicant.lastName)}</p>` : ''}
${e.headline ? `<p class="headline">You could access up to <b>${esc(e.headline.display)}</b>.</p>` : ''}
</div>
<div class="cover-foot"><p>Ref ${esc(d.referenceCode)}</p><p>${esc(dateStr)}</p><p>Own your home. Financed simply.</p></div>`,
    d.referenceCode,
  );

  const incomeRows = d.incomeLines
    .map((l) => `<tr><td>${esc(l.who)} monthly take-home (${esc(l.source)})</td><td>${money(l.amountMinor, l.currency)}</td></tr>`)
    .join('');
  const profile = page(
    2,
    'Section 1 · Applicant Profile and Basis of Assessment',
    `<h2>Applicant profile</h2>
<p>${esc(d.narrative.profile_summary)}</p>
<table class="kv">
<tr><td>Applicant</td><td>${esc(fullName)}</td></tr>
${d.coApplicant ? `<tr><td>Co-applicant</td><td>${esc(d.coApplicant.firstName)} ${esc(d.coApplicant.lastName)}</td></tr>` : ''}
<tr><td>Residence</td><td>${esc(d.residenceLabel)}</td></tr>
${incomeRows}
<tr><td>Property</td><td>${esc(d.property.type)} in ${esc([d.property.city, ...d.property.states].filter(Boolean).join(', '))}</td></tr>
<tr><td>Budget</td><td>${esc(d.target.label)}</td></tr>
<tr><td>Timeline</td><td>${esc(d.property.timeline)}</td></tr>
</table>
<h2>Basis of assessment</h2>
<table class="kv">
<tr><td>Assessed monthly take-home income</td><td>${formatNaira(e.assessed.monthlyIncomeKobo)}</td></tr>
<tr><td>Affordable monthly repayment (a third of income)</td><td>${formatNaira(e.assessed.affordableMonthlyKobo)}</td></tr>
${e.fx ? `<tr><td>Exchange rate used (stressed)</td><td>₦${e.fx.stressedRate.toLocaleString('en-NG')} per ${esc(e.fx.currency)} (today: ₦${e.fx.liveRate.toLocaleString('en-NG')})</td></tr>` : ''}
<tr><td>Repayment method</td><td>Equal principal: repayments start highest and fall each month</td></tr>
<tr><td>Engine version</td><td>${esc(e.engineVersion)}</td></tr>
</table>`,
    d.referenceCode,
  );

  const sec2 = page(
    3,
    'Section 2 · FG concessionary mortgages',
    `<h2>FG concessionary mortgages</h2><p class="meta">Lowest rates · Longer to process</p>
${concessionary.length ? `<div class="cards">${concessionary.map((r) => productCard(r, e.rateLabel)).join('')}</div>${equityTable(concessionary, d.target)}` : '<p>Based on what you told us, no concessionary scheme fits you today. Your advisor will explain why and what could change it.</p>'}
${variants.filter((v) => ['nhf_cap', 'nhf_not_contributor', 'age_term'].includes(v.key)).map((v) => `<p class="note">${esc(v.body)}</p>`).join('')}`,
    d.referenceCode,
  );

  const range = (rs: ProductResult[]) => {
    const lo = rs.find((r) => r.rateBasis === 'low');
    const hi = rs.find((r) => r.rateBasis === 'high');
    if (!lo || !hi) return '';
    return `<table class="kv"><tr><td>Typical ${e.rateLabel === 'profit rate' ? 'profit rates' : 'rates'}</td><td>${formatRate(lo.interestRate)} to ${formatRate(hi.interestRate)} a year · up to ${lo.tenorMonths / 12} years</td></tr>
<tr><td>You could borrow</td><td>${formatNaira(hi.maxLoanKobo)} to ${formatNaira(lo.maxLoanKobo)}</td></tr>
<tr><td>Monthly repayment from</td><td>${formatNaira(Math.min(lo.firstMonthlyRepaymentKobo, hi.firstMonthlyRepaymentKobo))}</td></tr>
<tr><td>Property value you can target</td><td>${formatNaira(hi.maxPropertyValueKobo)} to ${formatNaira(lo.maxPropertyValueKobo)}</td></tr></table>`;
  };
  const sec3 = page(
    4,
    'Section 3 · Commercial mortgages',
    `<h2>Commercial mortgages (PMBs and banks)</h2><p class="meta">Higher rates · Often faster</p>
${commercial.length ? range(commercial) + equityTable(commercial, d.target) : '<p>Commercial options are not shown for your profile.</p>'}
${nonInterest.length ? `<h2>Non-interest home finance (Ijarah)</h2><p>Your advisor will match you with non-interest banks.</p>${range(nonInterest)}` : ''}
${variants.filter((v) => ['non_nigerian', 'target_above'].includes(v.key)).map((v) => `<p class="note">${esc(v.body)}</p>`).join('')}`,
    d.referenceCode,
  );

  const sec4 = page(
    5,
    'Section 4 · Recommended Path and Next Steps',
    `<h2>What this means for you</h2><p>${esc(d.narrative.insight)}</p>
<h2>Recommended path</h2><p>${esc(d.narrative.recommended_path)}</p>
<h2>Your next steps</h2><ol>${d.narrative.next_steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
<h2>Documents lenders will ask for</h2><ul>${d.documents.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h2>How we help, and our fee</h2>
<p>We prepare and submit your application, chase the lender and keep you updated until disbursement. Our processing fee is <b class="fee">${esc(e.feeWording)}</b>.</p>
<p class="cta">Book a 1-on-1 Advisory call <a href="${esc(d.bookingUrl)}">Here</a></p>`,
    d.referenceCode,
  );

  const sec5 = page(
    6,
    'Section 5 · Important Notes and Disclaimer',
    `<h2>Important notes</h2><ul>${[...d.narrative.notes, ...variants.filter((v) => v.key === 'diaspora').map((v) => v.body)].map((s) => `<li>${esc(s)}</li>`).join('') || '<li>Figures are based on the rates and rules in force on the date of this report.</li>'}</ul>
<h2>Disclaimer</h2><p>${esc(DISCLAIMER)}</p>
<p>Rates and limits are those in force on ${esc(dateStr)} and can change. Amounts are rounded down to the nearest Naira.</p>
<p>Your report is saved in your <a href="${esc(d.dashboardUrl)}">HomeFi dashboard</a>.</p>
<p class="small">HomeFi Africa Technologies Ltd · RC 7494763 · Abuja, Nigeria · support.homefi@gmail.com</p>`,
    d.referenceCode,
  );

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(d.fileName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0D2240; font-size: 10.5pt; line-height: 1.5 }
.page { width: 210mm; height: 297mm; overflow: hidden; position: relative; page-break-after: always; background: #fff; padding: 0 }
.page:last-child { page-break-after: auto }
header { background: #0D2240; color: #F7F4EE; display: flex; justify-content: space-between; align-items: center; padding: 10mm 16mm 6mm; font-size: 9pt }
footer { position: absolute; bottom: 8mm; left: 16mm; right: 16mm; display: flex; justify-content: space-between; font-size: 8pt; color: #4A5A70 }
.content { padding: 8mm 16mm 20mm }
.brand { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; font-size: 16pt; color: #F7F4EE } .brand b { color: #E8A020 }
.brand.big { font-size: 34pt }
.cover { background: #0D2240; color: #F7F4EE }
.cover .content { height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 22mm 18mm }
.cover h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 34pt; margin: 4mm 0 }
.cover .eyebrow { color: #E8A020; text-transform: uppercase; letter-spacing: .08em; font-weight: 700 }
.cover .headline { font-size: 16pt } .cover .headline b { color: #E8A020 }
.cover-foot p { margin: 1mm 0 }
h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18pt; margin: 6mm 0 2mm }
h3 { font-size: 11pt; margin: 4mm 0 1mm }
.meta { color: #4A5A70; font-size: 9pt; margin: 0 0 2mm }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm }
.card { border: 1px solid #E3DDD1; border-radius: 3mm; padding: 4mm }
table.kv { width: 100%; border-collapse: collapse } table.kv td { padding: 1.4mm 0; border-bottom: 1px solid #F0EBE1 } table.kv td:last-child { text-align: right; font-weight: 700 }
table.grid { width: 100%; border-collapse: collapse; font-size: 8.5pt } table.grid th, table.grid td { border: 1px solid #E3DDD1; padding: 1.5mm; text-align: left } table.grid th { background: #F7F4EE }
.note { background: #F7F4EE; border-left: 3px solid #E8A020; padding: 2mm 3mm; font-size: 9pt }
.cta { margin-top: 6mm; font-weight: 700; font-size: 12pt } .cta a { color: #0D2240; background: #E8A020; padding: 1mm 3mm; border-radius: 2mm; text-decoration: none }
.small { font-size: 8pt; color: #4A5A70; margin-top: 10mm }
a { color: #0D2240 }
</style></head><body>${cover}${profile}${sec2}${sec3}${sec4}${sec5}</body></html>`;
}

/** Document checklist by income type (brief: "document checklist in the report"). */
export function documentsFor(incomeSources: string[], residence: 'nigeria' | 'diaspora'): string[] {
  const docs = ['Valid ID (passport, national ID or driver’s licence)', 'Six months of bank statements'];
  if (incomeSources.some((s) => s.startsWith('salaried') || s === 'part_time_contract' || s === 'mixed')) {
    docs.push('Your latest payslips and an employment letter');
  }
  if (incomeSources.some((s) => s === 'self_employed' || s === 'mixed')) {
    docs.push('Business registration (CAC) documents and business bank statements', 'Tax clearance certificate');
  }
  if (incomeSources.includes('pension')) docs.push('Pension statement from your PFA');
  if (residence === 'diaspora') docs.push('Proof of residence abroad and your foreign employment or income documents');
  docs.push('Property documents once you have chosen a home (title, survey and offer letter)');
  return docs;
}
