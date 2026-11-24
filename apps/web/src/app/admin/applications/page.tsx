import Link from 'next/link';
import type { EngineOutput } from '@homefi/engine';
import { supabaseAdmin } from '@/lib/supabase/server';
import { maskPhone } from '@/server/staff';

export const dynamic = 'force-dynamic';

export default async function Applications({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  let query = supabaseAdmin()
    .from('applications')
    .select('id, reference_code, status, residence, residence_state, residence_country, is_joint, submitted_at, estimate, source_channel, legacy_source, applicants(role, first_name, last_name, phone_e164)')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(200);
  if (q) query = query.ilike('reference_code', `%${q}%`);
  if (status) query = query.eq('status', status as never);
  const { data } = await query;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-display text-4xl text-navy">Applications</h1>
        <a href="/api/v1/admin/applications.csv" className="btn-secondary">Export CSV</a>
      </div>
      <form className="mt-4 flex flex-wrap gap-3">
        <input name="q" defaultValue={q} placeholder="Reference code" className="input max-w-xs" />
        <select name="status" defaultValue={status ?? ''} className="input max-w-xs">
          <option value="">Any status</option>
          {['estimated', 'claimed', 'report_sent', 'advisory_booked', 'in_processing', 'closed', 'abandoned'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-cream text-navy"><tr>{['Ref', 'Applicant', 'Phone', 'Residence', 'Headline', 'Status', 'Source', 'Submitted'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((a) => {
              const p = (a.applicants as unknown as Array<{ role: string; first_name: string; last_name: string; phone_e164: string }>).find((x) => x.role === 'primary');
              const e = a.estimate as unknown as EngineOutput | null;
              return (
                <tr key={a.id}>
                  <td className="num p-3"><Link className="underline" href={`/prequalify/result/${a.id}`}>{a.reference_code}</Link></td>
                  <td className="p-3">{p ? `${p.first_name} ${p.last_name}` : ''}{a.is_joint ? ' (joint)' : ''}</td>
                  <td className="num p-3">{maskPhone(p?.phone_e164)}</td>
                  <td className="p-3">{a.residence === 'nigeria' ? a.residence_state : a.residence_country}</td>
                  <td className="num p-3">{e?.headline?.display ?? '-'}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="p-3">{a.legacy_source ?? a.source_channel ?? ''}</td>
                  <td className="p-3">{a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-GB') : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
