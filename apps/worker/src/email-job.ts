import nodemailer from 'nodemailer';
import { renderEmail } from '@homefi/emails';
import { sb } from './db';
import { env } from './env';

export interface EmailJob {
  template: string;
  to: string;
  userId?: string | null;
  applicationId?: string | null;
  data: Record<string, unknown>;
  attachReportId?: string;
}

const smtp = env.emailTransport === 'smtp' ? nodemailer.createTransport(env.smtpUrl) : null;

interface Outgoing {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: Array<{ filename: string; content: Buffer }>;
}

async function deliver(m: Outgoing): Promise<string | null> {
  if (env.emailTransport === 'smtp') {
    const info = await smtp!.sendMail({ from: env.emailFrom, replyTo: env.emailReplyTo, ...m });
    return info.messageId ?? null;
  }
  if (env.emailTransport === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.resendKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.emailFrom,
        reply_to: env.emailReplyTo,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        text: m.text,
        attachments: m.attachments.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })),
      }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
    return ((await res.json()) as { id: string }).id;
  }
  console.log(`[email:log] to=${m.to} subject="${m.subject}" attachments=${m.attachments.length}`);
  return null;
}

export async function sendEmail(job: EmailJob): Promise<void> {
  const rendered = renderEmail(job.template, job.data);
  const attachments: Outgoing['attachments'] = [];
  let report: { id: string; storage_path: string | null; file_name: string; report_number: number } | null = null;
  if (job.attachReportId) {
    const { data } = await sb.from('reports').select('id, storage_path, file_name, report_number').eq('id', job.attachReportId).single();
    report = data;
    if (!report?.storage_path) throw new Error('report has no file yet');
    const file = await sb.storage.from('reports').download(report.storage_path);
    if (file.error) throw new Error(`download: ${file.error.message}`);
    const buf = Buffer.from(await file.data.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) throw new Error('attachment over 5 MB');
    attachments.push({ filename: `${report.file_name}.pdf`, content: buf });
  }
  const providerId = await deliver({ to: job.to, subject: rendered.subject, html: rendered.html, text: rendered.text, attachments });
  await sb.from('notifications').insert({
    user_id: job.userId ?? null,
    application_id: job.applicationId ?? null,
    channel: 'email',
    template: job.template,
    provider_message_id: providerId,
    status: 'sent',
  });
  if (report && ['report_delivery', 'report2_ready'].includes(job.template)) {
    await sb.from('reports').update({ status: 'emailed', emailed_at: new Date().toISOString() }).eq('id', report.id);
  }
}
