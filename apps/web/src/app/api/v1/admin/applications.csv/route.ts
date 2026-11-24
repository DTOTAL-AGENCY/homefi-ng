/* eslint-disable @typescript-eslint/no-explicit-any -- loosely typed form state / query builder */
import type { EngineOutput } from '@homefi/engine';
import { supabaseAdmin, currentProfile } from '@/lib/supabase/server';
import { ERR } from '@/server/api';
import { audit } from '@/server/staff';

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // no formula injection in spreadsheets
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Admin-only export. Every export is written to audit_log. */
export async function GET() {
  const me = await currentProfile();
  if (!me || me.role !== 'admin') return ERR.forbidden();
  const { data } = await supabaseAdmin()
    .from('applications')
    .select('reference_code, status, residence, residence_state, residence_country, is_joint, property_type, preferred_states, timeline, proceed_intent, financial_readiness, source_channel, submitted_at, estimate, legacy_source, legacy_row_index, applicants(role, first_name, last_name, phone_e164, income_source, income_currency, monthly_net_income_minor), profiles:user_id(email)')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false });
  const head = ['reference_code', 'status', 'first_name', 'last_name', 'email', 'phone', 'residence', 'state_or_country', 'joint', 'income_source', 'currency', 'monthly_income', 'headline_naira', 'headline_product', 'property_type', 'preferred_states', 'timeline', 'proceed_intent', 'readiness', 'source', 'legacy_source', 'legacy_row', 'submitted_at'];
  const rows = (data ?? []).map((a) => {
    const p = (a.applicants as unknown as Array<Record<string, any>>).find((x) => x.role === 'primary') ?? {};
    const e = a.estimate as unknown as EngineOutput | null;
    return [a.reference_code, a.status, p.first_name, p.last_name, (a.profiles as unknown as { email: string } | null)?.email, p.phone_e164, a.residence, a.residence === 'nigeria' ? a.residence_state : a.residence_country, a.is_joint, p.income_source, p.income_currency, p.monthly_net_income_minor ? Number(p.monthly_net_income_minor) / 100 : '', e?.headline ? e.headline.displayKobo / 100 : '', e?.headline?.productCode, a.property_type, (a.preferred_states ?? []).join('; '), a.timeline, a.proceed_intent, a.financial_readiness, a.source_channel, a.legacy_source, a.legacy_row_index, a.submitted_at].map(cell).join(',');
  });
  await audit(me.id, 'applications_exported', 'applications', 'csv', { rows: rows.length });
  return new Response([head.join(','), ...rows].join('\n'), {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="homefi-applications-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
