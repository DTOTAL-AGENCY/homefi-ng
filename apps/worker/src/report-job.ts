import { formatNaira, residenceLabel, BUDGET_BANDS, type EngineOutput } from '@homefi/engine';
import { PROPERTY_TYPES, INCOME_SOURCES } from '@homefi/db';
import { PROMPT_VERSION, allPassed, documentsFor, renderReportHtml, runChecks, type NarrativeFacts, type ReportData } from '@homefi/report';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { enqueue, sb, sql } from './db';
import { env } from './env';
import { writeNarrative } from './narrative';
import { htmlToPdf } from './pdf';
import { signToken } from './sign';

const label = (list: ReadonlyArray<readonly [string, string]>, v: string | null | undefined) => list.find(([k]) => k === v)?.[1] ?? v ?? '';
const TIMELINES: Record<string, string> = { lt3m: 'Within 3 months', '3to6m': '3 to 6 months', '6to12m': '6 to 12 months', gt12m: 'Over 12 months', exploring: 'Just exploring' };
const STATUS: Record<string, string> = { found: 'Found', searching: 'Still looking', need_help: 'Wants HomeFi to find one' };

function ageBand(age: number | null) {
  if (!age) return 'unknown';
  const lo = Math.floor(age / 10) * 10;
  return `${lo}s`;
}

function targetLabel(min: number | null, max: number | null, exact: number | null) {
  if (exact) return formatNaira(exact);
  const band = BUDGET_BANDS.find((b) => b.minKobo === min && b.maxKobo === max);
  return band?.label ?? (min ? `From ${formatNaira(min)}` : 'Not set');
}

export class PermanentError extends Error {}

export async function generateReport(reportId: string): Promise<void> {
  const { data: report } = await sb.from('reports').select('*').eq('id', reportId).single();
  if (!report) throw new PermanentError(`report ${reportId} not found`);
  if (report.status === 'emailed') return; // idempotent
  if (report.status === 'ready') return queueDelivery(report.id);

  await sb.from('reports').update({ status: 'generating', attempts: report.attempts + 1 }).eq('id', reportId);

  const { data: app } = await sb.from('applications').select('*').eq('id', report.application_id).single();
  if (!app?.estimate || !app.user_id) throw new PermanentError('application not estimated or not claimed');
  const { data: people } = await sb.from('applicants').select('*').eq('application_id', app.id);
  const primary = people?.find((p) => p.role === 'primary');
  const co = people?.find((p) => p.role === 'co_applicant') ?? null;
  if (!primary) throw new PermanentError('no primary applicant');
  const { data: profile } = await sb.from('profiles').select('*').eq('id', app.user_id).single();
  const estimate = app.estimate as unknown as EngineOutput;

  const phoneCountry = primary.phone_e164 ? parsePhoneNumberFromString(primary.phone_e164)?.country ?? null : null;
  const resLabel = residenceLabel(app.residence as 'nigeria' | 'diaspora', app.residence_country, phoneCountry, app.residence_state);
  const eligible = [...new Set(estimate.results.filter((r) => r.eligible).map((r) => r.productCode))];

  const facts: NarrativeFacts = {
    residence: resLabel,
    incomeSources: [primary.income_source, co?.income_source].filter(Boolean) as string[],
    isJoint: app.is_joint,
    ageBand: ageBand(primary.age),
    propertyType: label(PROPERTY_TYPES, app.property_type),
    intendedUse: app.intended_use,
    preferredStates: app.preferred_states ?? [],
    timeline: app.timeline ? TIMELINES[app.timeline] ?? app.timeline : null,
    propertyStatus: app.property_status,
    nonInterestPreference: app.non_interest_preference,
    nhfContributor: app.nhf_contributor,
    hasRsa: app.has_rsa,
    rsaEquityUse: app.rsa_equity_use,
    financialReadiness: app.financial_readiness,
    proceedIntent: app.proceed_intent,
    propertyFeatures: app.property_features ?? [],
    headlineProduct: estimate.headline?.productCode ?? null,
    eligibleProducts: eligible,
    variants: estimate.variants.map((v) => v.key),
    insightRule: estimate.insight,
    feeWording: estimate.feeWording,
    rateWord: estimate.rateLabel,
  };
  const n = await writeNarrative(facts, estimate);

  const dashboardUrl = `${env.siteUrl}/app/reports/${report.id}`;
  const bookingUrl = `${env.siteUrl}/app/advisors?report=${report.id}`;
  const data: ReportData = {
    reportNumber: report.report_number as 1 | 2,
    referenceCode: report.reference_code,
    fileName: report.file_name,
    date: new Date(),
    applicant: { title: primary.title, firstName: primary.first_name ?? '', lastName: primary.last_name ?? '', otherNames: primary.other_names },
    coApplicant: co ? { firstName: co.first_name ?? '', lastName: co.last_name ?? '' } : null,
    residenceLabel: resLabel,
    incomeLines: [primary, co].filter((x): x is NonNullable<typeof x> => !!x).map((p) => ({
      who: p.role === 'primary' ? 'Your' : 'Co-applicant',
      source: label(INCOME_SOURCES, p.income_source),
      amountMinor: Number(p.monthly_net_income_minor),
      currency: p.income_currency,
    })),
    estimate,
    target: { minKobo: app.target_value_min_kobo, maxKobo: app.target_value_max_kobo, label: targetLabel(app.target_value_min_kobo, app.target_value_max_kobo, app.target_exact_kobo) },
    property: {
      type: label(PROPERTY_TYPES, app.property_type),
      states: app.preferred_states ?? [],
      city: app.preferred_city,
      status: STATUS[app.property_status ?? ''] ?? '',
      timeline: TIMELINES[app.timeline ?? ''] ?? '',
    },
    documents: documentsFor([primary.income_source, co?.income_source].filter(Boolean) as string[], app.residence as 'nigeria' | 'diaspora'),
    narrative: n.narrative,
    dashboardUrl,
    bookingUrl,
  };

  const html = renderReportHtml(data);
  const { pdf, pageCount } = await htmlToPdf(html);
  const ngn = (p: typeof primary | null) => (p && p.income_currency === 'NGN' ? Number(p.monthly_net_income_minor) : null);
  const checks = runChecks({
    html,
    pageCount,
    data,
    stored: estimate,
    primaryIncomeKobo: co ? ngn(primary) : null,
    coIncomeKobo: co ? ngn(co) : null,
    expectedResidenceLabel: resLabel,
  });

  const path = `${app.user_id}/${report.reference_code}${report.report_number === 2 ? '-2' : ''}.pdf`;
  const up = await sb.storage.from('reports').upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (up.error) throw new Error(`upload: ${up.error.message}`);

  const passed = allPassed(checks);
  await sb
    .from('reports')
    .update({
      status: passed ? 'ready' : 'checks_failed',
      storage_path: path,
      page_count: pageCount,
      checks: { results: checks, narrative: { source: n.source, reason: n.reason ?? null } } as never,
      ai_model: n.model,
      prompt_version: PROMPT_VERSION,
      generated_at: new Date().toISOString(),
      last_error: passed ? null : checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail ?? ''}`).join('; '),
    })
    .eq('id', reportId);

  if (!passed) {
    await enqueue('send_email', {
      template: 'ops_alert',
      to: env.opsEmail,
      data: { subject: `Report ${report.reference_code} failed checks`, body: checks.filter((c) => !c.ok).map((c) => `${c.name}: ${c.detail ?? ''}`).join('\n') },
    });
    return;
  }

  await queueDelivery(report.id);
}

/** Queue the delivery email for a ready report (also used when a retry finds it already rendered). */
async function queueDelivery(reportId: string) {
  const { data: report } = await sb.from('reports').select('*').eq('id', reportId).single();
  if (!report) return;
  const { data: app } = await sb.from('applications').select('id, user_id, estimate').eq('id', report.application_id).single();
  if (!app?.user_id) return;
  const { data: profile } = await sb.from('profiles').select('first_name, email, email_verified_at').eq('id', app.user_id).single();
  const estimate = app.estimate as unknown as EngineOutput;
  const dashboardUrl = `${env.siteUrl}/app/reports/${report.id}`;
  const bookingUrl = `${env.siteUrl}/app/advisors?report=${report.id}`;
  const email = profile?.email;
  if (!email) return;
  const confirmUrl = profile?.email_verified_at ? null : `${env.siteUrl}/verify?t=${signToken({ uid: app.user_id, email }, 7 * 24 * 3600)}`;
  await enqueue('send_email', {
    template: report.report_number === 2 ? 'report2_ready' : 'report_delivery',
    to: email,
    userId: app.user_id,
    applicationId: app.id,
    attachReportId: report.id,
    data: {
      firstName: profile?.first_name,
      referenceCode: report.reference_code,
      headline: estimate.headline?.display ?? null,
      dashboardUrl,
      bookingUrl,
      confirmUrl,
    },
  });
  await sql`update applications set status = 'report_sent' where id = ${app.id} and status = 'claimed'`;
}
