import 'server-only';
import { formatNaira, type EngineOutput } from '@homefi/engine';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SITE } from '@/lib/config';
import { AppError } from './applications';
import { enqueueEmail } from './jobs';

/** Re-send the latest ready or emailed report for an application the user owns. */
export async function resendReport(applicationId: string, userId: string) {
  const sb = supabaseAdmin();
  const { data: report } = await sb
    .from('reports')
    .select('*, applications!inner(user_id, estimate)')
    .eq('application_id', applicationId)
    .in('status', ['ready', 'emailed', 'email_failed'])
    .order('report_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!report) throw new AppError(409, 'not_ready', 'Your report is still being prepared.');
  const app = report.applications as unknown as { user_id: string; estimate: EngineOutput | null };
  if (app.user_id !== userId) throw new AppError(404, 'not_found', 'Not found.');
  const { data: profile } = await sb.from('profiles').select('first_name,email').eq('id', userId).single();
  if (!profile?.email) throw new AppError(409, 'no_email', 'Please add an email address in Settings.');
  await enqueueEmail({
    template: report.report_number === 2 ? 'report2_ready' : 'report_delivery',
    to: profile.email,
    userId,
    applicationId,
    attachReportId: report.id,
    data: {
      firstName: profile.first_name,
      referenceCode: report.reference_code,
      headline: app.estimate?.headline?.display ?? null,
      dashboardUrl: `${SITE.url}/app/reports/${report.id}`,
    },
  });
  return { ok: true };
}

/** Signed URL valid 15 minutes, for the owner, the assigned advisor, or staff. */
export async function reportDownloadUrl(reportId: string, userId: string) {
  const sb = supabaseAdmin();
  const { data: r } = await sb
    .from('reports')
    .select('id, storage_path, file_name, application_id, applications!inner(user_id)')
    .eq('id', reportId)
    .maybeSingle();
  if (!r || !r.storage_path) throw new AppError(404, 'not_found', 'Not found.');
  const owner = (r.applications as unknown as { user_id: string | null }).user_id;
  let allowed = owner === userId;
  if (!allowed) {
    const { data: p } = await sb.from('profiles').select('role').eq('id', userId).single();
    allowed = p?.role === 'admin' || p?.role === 'ops';
    if (!allowed) {
      const { data: s } = await sb
        .from('advisory_sessions')
        .select('id, advisors!inner(user_id)')
        .eq('application_id', r.application_id)
        .eq('advisors.user_id', userId)
        .in('status', ['confirmed', 'rescheduled', 'completed'])
        .limit(1);
      allowed = !!s?.length;
    }
  }
  if (!allowed) throw new AppError(404, 'not_found', 'Not found.');
  const { data, error } = await sb.storage
    .from('reports')
    .createSignedUrl(r.storage_path, 15 * 60, { download: `${r.file_name}.pdf` });
  if (error || !data) throw new AppError(500, 'server_error', error?.message ?? 'sign failed');
  if (owner === userId) {
    await sb.from('reports').update({ downloaded_at: new Date().toISOString() }).eq('id', r.id).is('downloaded_at', null);
  }
  return data.signedUrl;
}

export const headlineText = (e: EngineOutput | null | undefined) =>
  e?.headline ? formatNaira(e.headline.displayKobo) : null;
