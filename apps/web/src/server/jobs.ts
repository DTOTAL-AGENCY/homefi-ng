import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface EmailJob {
  template: string;
  to: string;
  userId?: string | null;
  applicationId?: string | null;
  data: Record<string, unknown>;
  /** Report id whose PDF should be attached */
  attachReportId?: string;
}

export async function enqueue(queue: 'generate_report' | 'send_email', payload: object, delaySeconds = 0) {
  const { error } = await supabaseAdmin().rpc('enqueue_job', {
    p_queue: queue,
    p_payload: payload as never,
    p_delay: delaySeconds,
  });
  if (error) throw new Error(`enqueue ${queue}: ${error.message}`);
}

export const enqueueEmail = (job: EmailJob, delaySeconds = 0) => enqueue('send_email', job, delaySeconds);
export const enqueueReport = (reportId: string) => enqueue('generate_report', { reportId });
