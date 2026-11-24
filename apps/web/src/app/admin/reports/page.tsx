import { supabaseAdmin } from '@/lib/supabase/server';
import { overrideReport, retryReport } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Reports({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams;
  let q = supabaseAdmin().from('reports').select('*').order('created_at', { ascending: false }).limit(100);
  if (!all) q = q.in('status', ['checks_failed', 'email_failed', 'queued', 'generating']);
  const { data } = await q;
  return (
    <div>
      <h1 className="h-display text-4xl text-navy">Reports</h1>
      <p className="mt-1 text-sm text-muted">{all ? 'All recent reports.' : 'Reports that need attention or are in progress.'} <a className="underline" href={all ? '/admin/reports' : '/admin/reports?all=1'}>{all ? 'Show attention only' : 'Show all'}</a></p>
      <ul className="mt-6 space-y-3">
        {(data ?? []).map((r) => {
          const checks = ((r.checks as { results?: Array<{ name: string; ok: boolean; detail?: string }> } | null)?.results ?? []).filter((c) => !c.ok);
          return (
            <li key={r.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="num font-bold text-navy">{r.reference_code} · Report {r.report_number}</p>
                <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold">{r.status}</span>
              </div>
              <p className="text-sm text-muted">Attempts {r.attempts} · {r.page_count ?? '-'} pages · AI: {r.ai_model ?? 'rule-based'} · {r.prompt_version ?? ''}</p>
              {r.last_error && <p className="mt-2 text-sm text-danger">{r.last_error}</p>}
              {checks.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-danger">{checks.map((c) => <li key={c.name}>{c.name}: {c.detail}</li>)}</ul>}
              <div className="mt-3 flex gap-2">
                <form action={retryReport}><input type="hidden" name="id" value={r.id} /><button className="btn-secondary !min-h-9 !py-1 text-sm">Regenerate</button></form>
                {r.status === 'checks_failed' && r.storage_path && (
                  <form action={overrideReport}><input type="hidden" name="id" value={r.id} /><button className="btn-secondary !min-h-9 !py-1 text-sm">Checked by hand: send</button></form>
                )}
                {r.storage_path && <a className="btn-secondary !min-h-9 !py-1 text-sm" href={`/api/v1/reports/${r.id}/download?redirect=1`}>Open PDF</a>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
