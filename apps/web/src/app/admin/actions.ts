'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { enqueueReport, enqueueEmail } from '@/server/jobs';
import { audit, requireStaff } from '@/server/staff';
import { SITE } from '@/lib/config';

const sb = () => supabaseAdmin();
const num = (v: FormDataEntryValue | null) => (v === null || v === '' ? null : Number(v));
const list = (v: FormDataEntryValue | null) =>
  String(v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Next engine version for today: YYYY.MM.N */
async function nextVersion() {
  const now = new Date();
  const prefix = `${now.getUTCFullYear()}.${now.getUTCMonth() + 1}.`;
  const { data } = await sb().from('engine_settings').select('version').like('version', `${prefix}%`);
  const n = Math.max(0, ...(data ?? []).map((r) => Number(r.version.split('.')[2]) || 0)) + 1;
  return `${prefix}${n}`;
}

/**
 * Engine versions are immutable: any change to a rate or a setting creates a new version
 * with the rates frozen into it, so old results can always be reproduced.
 */
async function publishVersion(actorId: string, overrides: Record<string, unknown>) {
  const db = sb();
  const { data: cur } = await db.from('engine_settings').select('*').eq('is_current', true).single();
  const { data: products } = await db.from('rate_products').select('*').order('code');
  const version = await nextVersion();
  const row = {
    ...(cur ?? {}),
    ...overrides,
    version,
    is_current: false,
    rates_snapshot: (products ?? []) as never,
    created_by: actorId,
    created_at: new Date().toISOString(),
  };
  const { error } = await db.from('engine_settings').insert(row as never);
  if (error) throw new Error(error.message);
  await db.from('engine_settings').update({ is_current: false }).eq('is_current', true);
  await db.from('engine_settings').update({ is_current: true }).eq('version', version);
  await audit(actorId, 'engine_version_published', 'engine_settings', version, overrides);
  return version;
}

export async function saveRateProduct(form: FormData) {
  const me = await requireStaff(['admin'], '/admin/rates');
  const code = String(form.get('code'));
  const pct = (k: string) => (num(form.get(k)) ?? 0) / 100;
  const capNaira = num(form.get('loan_cap_naira'));
  const update = {
    rate_min: pct('rate_min'),
    rate_max: pct('rate_max'),
    max_tenor_years: num(form.get('max_tenor_years')) ?? 15,
    loan_cap_kobo: capNaira ? capNaira * 100 : null,
    equity_pct: pct('equity_pct'),
    active: form.get('active') === 'on',
    updated_by: me.id,
    updated_at: new Date().toISOString(),
  };
  const { data: before } = await sb().from('rate_products').select('*').eq('code', code).single();
  await sb().from('rate_products').update(update).eq('code', code);
  await audit(me.id, 'rate_product_updated', 'rate_products', code, { before, after: update });
  await publishVersion(me.id, {});
  revalidatePath('/', 'layout');
}

export async function saveEngineSettings(form: FormData) {
  const me = await requireStaff(['admin'], '/admin/rates');
  await publishVersion(me.id, {
    affordability_num: num(form.get('affordability_num')) ?? 1,
    affordability_den: num(form.get('affordability_den')) ?? 3,
    deduct_obligations: form.get('deduct_obligations') === 'on',
    repayment_method: String(form.get('repayment_method')) === 'annuity' ? 'annuity' : 'equal_principal',
    max_age_at_maturity: num(form.get('max_age_at_maturity')) ?? 60,
    fx_haircut: (num(form.get('fx_haircut_pct')) ?? 13) / 100,
    min_useful_loan_kobo: (num(form.get('min_useful_loan_naira')) ?? 5_000_000) * 100,
  });
  revalidatePath('/', 'layout');
}

export async function addFxRate(form: FormData) {
  const me = await requireStaff(['admin'], '/admin/fx');
  const row = {
    currency: String(form.get('currency')).toUpperCase().slice(0, 3),
    live_rate_to_ngn: num(form.get('live')) ?? 0,
    stressed_rate_to_ngn: num(form.get('stressed')),
    source: 'admin',
  };
  if (!row.live_rate_to_ngn) return;
  await sb().from('fx_rates').insert(row);
  await audit(me.id, 'fx_rate_added', 'fx_rates', row.currency, row);
  revalidatePath('/admin/fx');
}

export async function setAdvisorStatus(form: FormData) {
  const me = await requireStaff(['admin', 'ops'], '/admin/advisors');
  const id = String(form.get('id'));
  const status = String(form.get('status')) as 'approved' | 'suspended' | 'pending_review';
  await sb()
    .from('advisors')
    .update({ status, ...(status === 'approved' ? { verified_at: new Date().toISOString() } : {}) })
    .eq('id', id);
  await audit(me.id, `advisor_${status}`, 'advisors', id);
  revalidatePath('/admin/advisors');
}

export async function saveAdvisor(form: FormData) {
  const me = await requireStaff(['admin', 'ops'], '/admin/advisors');
  const id = String(form.get('id'));
  const credentials = list(form.get('credentials')).map((name) => ({ name, verified_at: new Date().toISOString() }));
  const update = {
    display_name: String(form.get('display_name')),
    headline: String(form.get('headline')).slice(0, 90),
    bio_short: String(form.get('bio_short')).slice(0, 280),
    bio_long: String(form.get('bio_long') || '') || null,
    specialisms: list(form.get('specialisms')),
    languages: list(form.get('languages')),
    states_covered: list(form.get('states_covered')),
    years_experience: num(form.get('years_experience')),
    cal_event_type_id: num(form.get('cal_event_type_id')),
    price_ngn_kobo: num(form.get('price_ngn')) ? num(form.get('price_ngn'))! * 100 : null,
    ...(credentials.length ? { credentials } : {}),
  };
  await sb().from('advisors').update(update).eq('id', id);
  await audit(me.id, 'advisor_updated', 'advisors', id, update);
  revalidatePath('/admin/advisors');
}

export async function inviteAdvisor(form: FormData) {
  const me = await requireStaff(['admin'], '/admin/advisors');
  const email = String(form.get('email')).trim().toLowerCase();
  const name = String(form.get('display_name')).trim();
  const db = sb();
  const { data: invited, error } = await db.auth.admin.inviteUserByEmail(email, {
    data: { first_name: name.split(' ')[0], last_name: name.split(' ').slice(1).join(' ') },
    redirectTo: `${SITE.url}/auth/callback?next=/advisor`,
  });
  if (error || !invited.user) throw new Error(error?.message ?? 'invite failed');
  await db.from('profiles').update({ role: 'advisor' }).eq('id', invited.user.id);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  await db.from('advisors').insert({
    user_id: invited.user.id,
    slug,
    display_name: name,
    headline: 'Mortgage Advisor',
    bio_short: 'Profile coming soon.',
    status: 'invited',
  });
  await audit(me.id, 'advisor_invited', 'advisors', slug, { email });
  revalidatePath('/admin/advisors');
}

export async function moderateReview(form: FormData) {
  const me = await requireStaff(['admin', 'ops'], '/admin/reviews');
  const id = String(form.get('id'));
  const publish = form.get('decision') === 'publish';
  await sb()
    .from('reviews')
    .update({ status: publish ? 'published' : 'rejected', published_at: publish ? new Date().toISOString() : null })
    .eq('id', id);
  await audit(me.id, publish ? 'review_published' : 'review_rejected', 'reviews', id);
  revalidatePath('/admin/reviews');
}

export async function retryReport(form: FormData) {
  const me = await requireStaff(['admin', 'ops'], '/admin/reports');
  const id = String(form.get('id'));
  await sb().from('reports').update({ status: 'queued', last_error: null }).eq('id', id);
  await enqueueReport(id);
  await audit(me.id, 'report_retried', 'reports', id);
  revalidatePath('/admin/reports');
}

/** Ops has checked a report that failed an automated check and releases it. */
export async function overrideReport(form: FormData) {
  const me = await requireStaff(['admin', 'ops'], '/admin/reports');
  const id = String(form.get('id'));
  const { data: r } = await sb().from('reports').select('*, applications(user_id, estimate)').eq('id', id).single();
  if (!r?.storage_path) return;
  await sb().from('reports').update({ status: 'ready' }).eq('id', id);
  const app = r.applications as unknown as { user_id: string; estimate: { headline?: { display: string } } | null };
  const { data: p } = await sb().from('profiles').select('first_name,email').eq('id', app.user_id).single();
  if (p?.email) {
    await enqueueEmail({
      template: 'report_delivery',
      to: p.email,
      userId: app.user_id,
      applicationId: r.application_id,
      attachReportId: r.id,
      data: {
        firstName: p.first_name,
        referenceCode: r.reference_code,
        headline: app.estimate?.headline?.display ?? null,
        dashboardUrl: `${SITE.url}/app/reports/${r.id}`,
        bookingUrl: `${SITE.url}/app/advisors?report=${r.id}`,
      },
    });
  }
  await audit(me.id, 'report_override_sent', 'reports', id);
  revalidatePath('/admin/reports');
}

export async function markContactHandled(form: FormData) {
  const me = await requireStaff(['admin', 'ops'], '/admin');
  const id = String(form.get('id'));
  await sb().from('contact_messages').update({ handled_at: new Date().toISOString() }).eq('id', id);
  await audit(me.id, 'contact_handled', 'contact_messages', id);
  revalidatePath('/admin');
}
