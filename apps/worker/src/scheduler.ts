import { formatNaira, type EngineOutput } from '@homefi/engine';
import { enqueue, sql } from './db';
import { env } from './env';
import { signToken } from './sign';

const fmt = (iso: Date, tz: string, opts: Intl.DateTimeFormatOptions) => iso.toLocaleString('en-GB', { ...opts, timeZone: tz });

async function sessionEmail(template: string, column: string, where: ReturnType<typeof sql>) {
  const rows = await sql`
    select s.id, s.start_at, s.timezone, s.meeting_url, s.user_id, s.application_id,
           p.first_name, p.email, a.display_name
    from advisory_sessions s join profiles p on p.id = s.user_id join advisors a on a.id = s.advisor_id
    where ${where} and ${sql(column)} is null`;
  for (const r of rows) {
    if (!r.email) continue;
    const start = new Date(r.start_at);
    await enqueue('send_email', {
      template,
      to: r.email,
      userId: r.user_id,
      applicationId: r.application_id,
      data: {
        firstName: r.first_name,
        advisorFirstName: String(r.display_name).split(' ')[0],
        time: fmt(start, r.timezone, { hour: '2-digit', minute: '2-digit' }),
        timezone: r.timezone,
        meetingUrl: r.meeting_url,
        bookingUrl: `${env.siteUrl}/app/advisors`,
        reviewUrl: `${env.siteUrl}/app/sessions/${r.id}/review?t=${signToken({ sid: r.id }, 30 * 24 * 3600)}`,
      },
    });
    await sql`update advisory_sessions set ${sql(column)} = now() where id = ${r.id}`;
  }
  return rows.length;
}

/** Runs every minute. Each step is idempotent thanks to its *_at marker column. */
export async function tick() {
  const done: Record<string, number> = {};
  // Release slots held for more than 10 minutes without payment
  done.holdsExpired = (await sql`update advisory_sessions set status = 'cancelled'
    where status = 'pending_payment' and hold_expires_at < now() returning id`).length;

  done.reminder24h = await sessionEmail('reminder_24h', 'reminder_24h_sent_at',
    sql`s.status in ('confirmed','rescheduled') and s.start_at between now() + interval '23 hours' and now() + interval '24 hours'`);
  done.reminder1h = await sessionEmail('reminder_1h', 'reminder_1h_sent_at',
    sql`s.status in ('confirmed','rescheduled') and s.start_at between now() and now() + interval '1 hour'`);
  // Abandoned booking: started 2+ hours ago, never paid, and no other live booking since
  done.abandoned = await sessionEmail('abandoned_booking', 'abandoned_email_at',
    sql`s.status = 'cancelled' and s.payment_id is not null and s.created_at between now() - interval '24 hours' and now() - interval '2 hours'
        and not exists (select 1 from advisory_sessions o where o.user_id = s.user_id and o.status in ('confirmed','rescheduled','completed') and o.created_at > s.created_at)`);
  done.reviewRequest = await sessionEmail('review_request', 'review_requested_at',
    sql`s.status = 'completed' and coalesce(s.ended_at, s.end_at) < now() - interval '2 hours'`);

  // Report not opened 3 days after delivery
  const stale = await sql`
    select r.id, r.application_id, a.user_id, a.estimate, p.first_name, p.email
    from reports r join applications a on a.id = r.application_id join profiles p on p.id = a.user_id
    where r.status = 'emailed' and r.emailed_at < now() - interval '3 days'
      and r.opened_at is null and r.downloaded_at is null and r.nudge_sent_at is null`;
  for (const r of stale) {
    const e = r.estimate as EngineOutput | null;
    await enqueue('send_email', {
      template: 'report_not_opened',
      to: r.email,
      userId: r.user_id,
      applicationId: r.application_id,
      data: { firstName: r.first_name, headline: e?.headline ? formatNaira(e.headline.displayKobo) : null, dashboardUrl: `${env.siteUrl}/app/reports/${r.id}` },
    });
    await sql`update reports set nudge_sent_at = now() where id = ${r.id}`;
  }
  done.reportNudges = stale.length;

  // Drafts older than 30 days are abandoned; expired anonymous estimates lose their token
  done.abandonedDrafts = (await sql`update applications set status = 'abandoned'
    where status = 'draft' and created_at < now() - interval '30 days' returning id`).length;
  await sql`update applications set anon_token_hash = null where anon_token_hash is not null and anon_token_expires_at < now()`;
  await sql`delete from rate_limits where window_start < now() - interval '2 days'`;
  return done;
}
