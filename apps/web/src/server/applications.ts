import 'server-only';
import {
  CONSENT_VERSION,
  resultToRow,
  stepSchemas,
  toEngineInput,
  toRows,
  validateComplete,
  flatten,
  type Draft,
  type StepNumber,
} from '@homefi/db';
import { initials, reportFileName, runEngine, type EngineOutput } from '@homefi/engine';
import { supabaseAdmin } from '@/lib/supabase/server';
import { anonExpiry, anonToken, hashToken } from './anon';
import { engineContext } from './data';
import { enqueueReport } from './jobs';

type Sb = ReturnType<typeof supabaseAdmin>;

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
    public step?: number,
  ) {
    super(message);
  }
}

export interface Caller {
  userId: string | null;
  isStaff?: boolean;
}

/** Load an application the caller may see: by user, by anon token cookie, or as staff. */
export async function loadApplication(sb: Sb, id: string, caller: Caller) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError(404, 'not_found', 'Not found.');
  const { data: app } = await sb.from('applications').select('*').eq('id', id).maybeSingle();
  if (!app) throw new AppError(404, 'not_found', 'Not found.');
  if (caller.isStaff) return app;
  if (caller.userId && app.user_id === caller.userId) return app;
  const token = await anonToken(false);
  if (
    token &&
    app.anon_token_hash === hashToken(token) &&
    (!app.anon_token_expires_at || new Date(app.anon_token_expires_at) > new Date())
  ) {
    return app;
  }
  throw new AppError(404, 'not_found', 'Not found.');
}

/** Create or update a draft after each step. */
export async function saveDraft(opts: {
  applicationId?: string | null;
  step: number;
  data: unknown;
  caller: Caller;
  utm?: Record<string, string> | null;
}) {
  const sb = supabaseAdmin();
  const step = opts.step as StepNumber;
  const schema = stepSchemas[step];
  if (!schema) throw new AppError(400, 'invalid_step', 'Unknown step.');
  const parsed = schema.safeParse(opts.data);
  if (!parsed.success) {
    throw new AppError(422, 'validation_failed', 'Please check the highlighted answers.', flatten(parsed.error), step);
  }

  if (opts.applicationId) {
    const app = await loadApplication(sb, opts.applicationId, opts.caller);
    if (app.status !== 'draft' && app.status !== 'estimated') {
      throw new AppError(409, 'locked', 'This estimate has already been saved to an account. Start a new estimate to change it.');
    }
    const draft = { ...((app.draft as Draft) ?? {}), [step]: parsed.data };
    const { error } = await sb
      .from('applications')
      .update({ draft: draft as never, last_step: Math.max(app.last_step, step), status: 'draft' })
      .eq('id', app.id);
    if (error) throw new AppError(500, 'server_error', error.message);
    return { applicationId: app.id, step };
  }

  const token = opts.caller.userId ? null : await anonToken(true);
  const { data, error } = await sb
    .from('applications')
    .insert({
      user_id: opts.caller.userId,
      anon_token_hash: token ? hashToken(token) : null,
      anon_token_expires_at: token ? anonExpiry() : null,
      draft: { [step]: parsed.data } as never,
      last_step: step,
      utm: opts.utm ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw new AppError(500, 'server_error', error?.message ?? 'insert failed');
  return { applicationId: data.id, step };
}

/** Validate everything, run the engine, store the results. */
export async function submitApplication(opts: { applicationId: string; caller: Caller; ip: string; userAgent: string }) {
  const sb = supabaseAdmin();
  const app = await loadApplication(sb, opts.applicationId, opts.caller);
  if (!['draft', 'estimated'].includes(app.status)) {
    // Already submitted and claimed: return what we have (idempotent)
    if (app.estimate) return { applicationId: app.id, status: app.status, estimate: app.estimate as unknown as EngineOutput };
    throw new AppError(409, 'locked', 'This estimate is already saved.');
  }
  const v = validateComplete((app.draft as Draft) ?? {});
  if (!v.ok) throw new AppError(422, 'validation_failed', 'Please check the highlighted answers.', v.fields, v.step);

  const { settings, products, fx } = await engineContext();
  let estimate: EngineOutput;
  try {
    estimate = runEngine(toEngineInput(v.data), settings, products, fx);
  } catch (e) {
    throw new AppError(422, 'engine_error', (e as Error).message);
  }
  const rows = toRows(v.data);

  const reference =
    app.reference_code ??
    (await sb.rpc('next_reference_code', { p_initials: initials(v.data[1].firstName, v.data[1].lastName) })).data;

  await sb.from('applicants').delete().eq('application_id', app.id);
  const { error: aErr } = await sb
    .from('applicants')
    .insert(rows.applicants.map((a) => ({ ...a, application_id: app.id })) as never);
  if (aErr) throw new AppError(500, 'server_error', aErr.message);

  await sb.from('prequal_results').delete().eq('application_id', app.id);
  const { error: rErr } = await sb
    .from('prequal_results')
    .insert(estimate.allResults.map((r) => resultToRow(app.id, settings.version, r)) as never);
  if (rErr) throw new AppError(500, 'server_error', rErr.message);

  const { error: uErr } = await sb
    .from('applications')
    .update({
      ...rows.application,
      reference_code: reference,
      status: 'estimated',
      engine_version: settings.version,
      estimate: estimate as never,
      submitted_at: new Date().toISOString(),
    } as never)
    .eq('id', app.id);
  if (uErr) throw new AppError(500, 'server_error', uErr.message);

  await sb.from('consents').insert({
    application_id: app.id,
    user_id: opts.caller.userId,
    consent_type: 'data_processing',
    version: CONSENT_VERSION,
    granted: true,
    ip: opts.ip === 'unknown' ? null : opts.ip,
    user_agent: opts.userAgent.slice(0, 500),
  });

  return { applicationId: app.id, status: 'estimated', estimate, referenceCode: reference as string };
}

/** Link an anonymous application to the signed-in user and queue Report 1. Idempotent. */
export async function claimApplication(opts: { applicationId: string; userId: string; ip: string; userAgent: string }) {
  const sb = supabaseAdmin();
  const app = await loadApplication(sb, opts.applicationId, { userId: opts.userId });
  if (app.user_id && app.user_id !== opts.userId) throw new AppError(404, 'not_found', 'Not found.');
  if (app.status === 'draft') throw new AppError(409, 'not_submitted', 'Please finish your estimate first.');

  if (!app.user_id || app.status === 'estimated') {
    await sb
      .from('applications')
      .update({
        user_id: opts.userId,
        anon_token_hash: null,
        anon_token_expires_at: null,
        status: app.status === 'estimated' ? 'claimed' : app.status,
        claimed_at: app.claimed_at ?? new Date().toISOString(),
      })
      .eq('id', app.id);

    // Fill an empty profile from the application (names and phone are prefilled at sign-up anyway)
    const { data: primary } = await sb
      .from('applicants')
      .select('first_name,last_name,other_names,title,phone_e164')
      .eq('application_id', app.id)
      .eq('role', 'primary')
      .maybeSingle();
    const { data: profile } = await sb.from('profiles').select('*').eq('id', opts.userId).single();
    if (primary && profile) {
      await sb
        .from('profiles')
        .update({
          first_name: profile.first_name || primary.first_name || '',
          last_name: profile.last_name || primary.last_name || '',
          other_names: profile.other_names ?? primary.other_names,
          title: profile.title ?? primary.title,
          phone_e164: profile.phone_e164 ?? primary.phone_e164,
        })
        .eq('id', opts.userId);
    }
    await sb.from('consents').update({ user_id: opts.userId }).eq('application_id', app.id).is('user_id', null);
  }

  // Report 1
  const { data: existing } = await sb
    .from('reports')
    .select('id,status')
    .eq('application_id', app.id)
    .eq('report_number', 1)
    .maybeSingle();
  if (existing) return { applicationId: app.id, reportId: existing.id, reportStatus: existing.status };

  const { data: primary } = await sb
    .from('applicants')
    .select('first_name,last_name')
    .eq('application_id', app.id)
    .eq('role', 'primary')
    .single();
  const { data: report, error } = await sb
    .from('reports')
    .insert({
      application_id: app.id,
      report_number: 1,
      reference_code: app.reference_code!,
      file_name: reportFileName(1, new Date(), primary?.last_name ?? '', primary?.first_name ?? ''),
      status: 'queued',
    })
    .select('id,status')
    .single();
  if (error || !report) {
    // A concurrent claim created it first
    const { data: again } = await sb
      .from('reports')
      .select('id,status')
      .eq('application_id', app.id)
      .eq('report_number', 1)
      .single();
    if (again) return { applicationId: app.id, reportId: again.id, reportStatus: again.status };
    throw new AppError(500, 'server_error', error?.message ?? 'report insert failed');
  }
  await enqueueReport(report.id);
  return { applicationId: app.id, reportId: report.id, reportStatus: report.status };
}

/** Claim every unclaimed estimate on this device (anon cookie) for a user who just signed in. */
export async function autoClaim(userId: string, ip: string, userAgent: string) {
  const token = await anonToken(false);
  if (!token) return [];
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('applications')
    .select('id,status')
    .eq('anon_token_hash', hashToken(token))
    .gt('anon_token_expires_at', new Date().toISOString())
    .eq('status', 'estimated');
  const out = [];
  for (const a of data ?? []) {
    out.push(await claimApplication({ applicationId: a.id, userId, ip, userAgent }).catch(() => null));
  }
  return out.filter(Boolean);
}
