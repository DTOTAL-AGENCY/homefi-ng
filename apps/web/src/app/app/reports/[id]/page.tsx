import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { EngineOutput } from '@homefi/engine';
import { EstimateView } from '@/components/estimate-view';
import { currentProfile, supabaseAdmin } from '@/lib/supabase/server';
import { ReportActions } from '../../client-bits';

export const metadata: Metadata = { title: 'Report', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = (await currentProfile())!;
  const { data: r } = await supabaseAdmin()
    .from('reports')
    .select('id, report_number, reference_code, status, application_id, applications!inner(user_id, estimate)')
    .eq('id', id)
    .maybeSingle();
  const app = r?.applications as unknown as { user_id: string; estimate: EngineOutput } | undefined;
  if (!r || app?.user_id !== me.id) notFound();
  return (
    <div>
      <p className="num text-sm font-semibold text-muted">
        {r.report_number === 1 ? '1st' : '2nd'} Mortgage Prequalification Report · Ref {r.reference_code}
      </p>
      {['ready', 'emailed', 'email_failed'].includes(r.status) && <ReportActions reportId={r.id} applicationId={r.application_id} />}
      <div className="mt-6">
        <EstimateView firstName={me.first_name} estimate={app.estimate} />
      </div>
    </div>
  );
}
