import 'server-only';
import type { EngineOutput } from '@homefi/engine';
import { supabaseAdmin } from '@/lib/supabase/server';

export const TRACKER = [
  'Prequalified',
  'Advisory session',
  'Documents',
  'Submitted to lender',
  'Offer letter',
  'Keys',
] as const;

const NEXT_HINT: Record<number, string> = {
  0: 'Book your 1-on-1 Mortgage Advisory Session.',
  1: 'Your advisor will send your document checklist.',
  2: 'We prepare and submit your application to the lender.',
  3: 'The lender reviews your application and the property.',
  4: 'Disbursement, then you collect your keys.',
  5: 'Congratulations on your new home.',
};

const CASE_STAGE_INDEX: Record<string, number> = {
  documents: 2,
  submitted_to_lender: 3,
  property_appraisal: 3,
  underwriting: 3,
  offer_received: 4,
  approved: 4,
  disbursed: 5,
};

export interface ReportSummary {
  id: string;
  report_number: number;
  status: string;
  reference_code: string;
  file_name: string;
  generated_at: string | null;
  emailed_at: string | null;
  created_at: string;
}

export async function loadDashboard(userId: string) {
  const sb = supabaseAdmin();
  const [{ data: profile }, { data: apps }, { data: sessions }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', userId).single(),
    sb
      .from('applications')
      .select('id, reference_code, status, estimate, submitted_at, created_at, reports(id, report_number, status, reference_code, file_name, generated_at, emailed_at, created_at), mortgage_cases(stage)')
      .eq('user_id', userId)
      .neq('status', 'draft')
      .order('submitted_at', { ascending: false, nullsFirst: false }),
    sb
      .from('advisory_sessions')
      .select('id, start_at, end_at, timezone, meeting_url, meeting_type, status, topic, application_id, report_id, cal_booking_uid, advisors(display_name, slug, photo_url)')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'rescheduled', 'completed', 'pending_payment', 'no_show', 'cancelled', 'refunded'])
      .order('start_at', { ascending: false }),
  ]);

  const applications = (apps ?? []).map((a) => ({
    id: a.id,
    referenceCode: a.reference_code,
    status: a.status,
    estimate: a.estimate as unknown as EngineOutput | null,
    submittedAt: a.submitted_at,
    reports: ((a.reports as unknown as ReportSummary[]) ?? []).sort((x, y) => y.report_number - x.report_number),
    caseStage: ((a.mortgage_cases as unknown as Array<{ stage: string }>) ?? [])[0]?.stage ?? null,
  }));
  const latest = applications[0] ?? null;
  const allSessions = (sessions ?? []).map((s) => ({
    ...s,
    advisor: s.advisors as unknown as { display_name: string; slug: string; photo_url: string | null } | null,
  }));
  const now = Date.now();
  const upcoming = allSessions
    .filter((s) => ['confirmed', 'rescheduled'].includes(s.status) && new Date(s.end_at).getTime() > now)
    .sort((x, y) => x.start_at.localeCompare(y.start_at))[0] ?? null;

  let stage = 0;
  if (latest) {
    if (allSessions.some((s) => s.application_id === latest.id && ['confirmed', 'rescheduled', 'completed'].includes(s.status))) stage = 1;
    if (latest.caseStage) stage = Math.max(stage, CASE_STAGE_INDEX[latest.caseStage] ?? stage);
  }

  return {
    profile,
    applications,
    latest,
    sessions: allSessions,
    upcoming,
    tracker: { stage, label: TRACKER[stage], next: NEXT_HINT[stage] },
  };
}

export type Dashboard = Awaited<ReturnType<typeof loadDashboard>>;
