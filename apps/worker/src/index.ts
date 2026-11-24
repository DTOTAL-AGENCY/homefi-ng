import { ack, archive, backoff, readQueue, sb, sql, enqueue } from './db';
import { sendEmail, type EmailJob } from './email-job';
import { closeBrowser } from './pdf';
import { generateReport, PermanentError } from './report-job';
import { tick } from './scheduler';
import { env } from './env';

const MAX_ATTEMPTS = 3;
const once = process.argv.includes('--once');
let stopping = false;

async function drain<T>(queue: string, vt: number, handler: (m: T) => Promise<void>, onGiveUp: (m: T, err: Error) => Promise<void>) {
  const msgs = await readQueue<T>(queue, vt, 5);
  for (const m of msgs) {
    try {
      await handler(m.message);
      await ack(queue, m.msg_id);
    } catch (e) {
      const err = e as Error;
      console.error(`[${queue}] msg ${m.msg_id} attempt ${m.read_ct} failed: ${err.message}`);
      if (e instanceof PermanentError || m.read_ct >= MAX_ATTEMPTS) {
        await archive(queue, m.msg_id);
        await onGiveUp(m.message, err).catch(() => {});
      } else {
        await backoff(queue, m.msg_id, 30 * 2 ** (m.read_ct - 1)); // 30s, 60s
      }
    }
  }
  return msgs.length;
}

async function reportGaveUp(m: { reportId: string }, err: Error) {
  const { data: r } = await sb.from('reports').update({ status: 'checks_failed', last_error: err.message }).eq('id', m.reportId).select('reference_code').single();
  await enqueue('send_email', { template: 'ops_alert', to: env.opsEmail, data: { subject: `Report ${r?.reference_code ?? m.reportId} failed to generate`, body: err.message } });
}

async function emailGaveUp(m: EmailJob, err: Error) {
  if (m.attachReportId) await sb.from('reports').update({ status: 'email_failed', last_error: err.message }).eq('id', m.attachReportId);
  if (m.template !== 'ops_alert') {
    await enqueue('send_email', { template: 'ops_alert', to: env.opsEmail, data: { subject: `Email ${m.template} failed`, body: `${m.to}: ${err.message}` } });
  }
}

async function loop() {
  let lastTick = 0;
  console.log(`[worker] started (email: ${env.emailTransport}, ai: ${env.aiEnabled ? env.anthropicModel : 'off, rule-based wording'})`);
  while (!stopping) {
    const n =
      (await drain<{ reportId: string }>('generate_report', 120, (m) => generateReport(m.reportId), reportGaveUp)) +
      (await drain<EmailJob>('send_email', 60, sendEmail, emailGaveUp));
    if (Date.now() - lastTick > 60_000) {
      lastTick = Date.now();
      const done = await tick().catch((e) => console.error('[scheduler]', e));
      if (done && Object.values(done).some((v) => v > 0)) console.log('[scheduler]', done);
    }
    if (once && n === 0) break;
    if (n === 0) await new Promise((r) => setTimeout(r, 1500));
  }
}

const shutdown = async () => {
  stopping = true;
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

loop()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeBrowser();
    await sql.end();
  });
