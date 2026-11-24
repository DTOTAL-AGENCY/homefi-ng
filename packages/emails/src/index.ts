/**
 * Transactional email templates from the brief. Navy header with the white and gold
 * logo, one gold button, company line footer; unsubscribe only on marketing mail.
 */

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

type Data = Record<string, unknown>;
const s = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const esc = (v: unknown) =>
  s(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const COMPANY = 'HomeFi Africa Technologies Ltd · RC 7494763 · Abuja, Nigeria · support.homefi@gmail.com';

function layout(opts: { preheader: string; body: string; button?: { label: string; url: string } }) {
  const btn = opts.button
    ? `<p style="margin:28px 0"><a href="${esc(opts.button.url)}" style="background:#E8A020;color:#0D2240;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;display:inline-block">${esc(opts.button.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#F7F4EE;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#0D2240">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0D2240;padding:22px 28px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#F7F4EE">Home<span style="color:#E8A020">Fi</span></td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6">${opts.body}${btn}</td></tr>
<tr><td style="padding:18px 28px;background:#F7F4EE;font-size:12px;color:#4A5A70">${COMPANY}</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`;
const toText = (html: string) =>
  html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, '$2 ($1)')
    .replace(/<br>/g, '\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function make(subject: string, preheader: string, body: string, button?: { label: string; url: string }): RenderedEmail {
  return {
    subject,
    preheader,
    html: layout({ preheader, body, button }),
    text: toText(body + (button ? `<p>${button.label}: ${button.url}</p>` : '')),
  };
}

/** "Book a 1-on-1 Advisory call Here", with the link on "Here". */
const bookHere = (url: string) =>
  `Next step: Book a 1-on-1 Advisory call <a href="${esc(url)}" style="color:#0D2240;font-weight:700">Here</a>.`;

export const TEMPLATES: Record<string, (d: Data) => RenderedEmail> = {
  report_delivery: (d) =>
    make(
      `Your Mortgage Prequalification Report is here, ${s(d.firstName)}`,
      d.headline ? `You could access up to ${s(d.headline)}. Your full breakdown is attached.` : 'Your full breakdown is attached.',
      p(`Hi ${esc(d.firstName)},`) +
        p(`Thank you for prequalifying with HomeFi. Your 1st Mortgage Prequalification Report (Ref ${esc(d.referenceCode)}) is attached and saved in your <a href="${esc(d.dashboardUrl)}" style="color:#0D2240">dashboard</a>.`) +
        (d.confirmUrl ? p(`Please <a href="${esc(d.confirmUrl)}" style="color:#0D2240;font-weight:700">confirm your email</a> so lenders can reach you.`) : '') +
        p(bookHere(s(d.bookingUrl))) +
        p('<span style="font-size:13px;color:#4A5A70">This is an estimate based on what you told us. It is not a loan offer or an approval.</span>'),
      d.confirmUrl ? { label: 'Confirm your email', url: s(d.confirmUrl) } : { label: 'Open my dashboard', url: s(d.dashboardUrl) },
    ),
  report2_ready: (d) =>
    make(
      'Your precise (2nd) Mortgage Prequalification Report',
      'Your updated figures and agreed next steps are attached.',
      p(`Hi ${esc(d.firstName)},`) + p(`Your 2nd Mortgage Prequalification Report (Ref ${esc(d.referenceCode)}) is attached, with the next steps you agreed with your advisor.`),
      { label: 'Open my dashboard', url: s(d.dashboardUrl) },
    ),
  email_confirmation: (d) =>
    make('Confirm your email for HomeFi', 'One click so lenders can reach you.', p(`Hi ${esc(d.firstName)},`) + p('Please confirm this is the right email for your mortgage application.'), {
      label: 'Confirm your email',
      url: s(d.confirmUrl),
    }),
  booking_confirmed: (d) =>
    make(
      `You're booked with ${s(d.advisorName)} on ${s(d.date)}`,
      `${s(d.time)} (${s(d.timezone)}) · ${s(d.watTime)} WAT`,
      p(`Hi ${esc(d.firstName)},`) +
        p(`Your 1-on-1 Mortgage Advisory Session with ${esc(d.advisorName)} is on <strong>${esc(d.date)} at ${esc(d.time)} (${esc(d.timezone)})</strong>, which is ${esc(d.watTime)} WAT.`) +
        (d.meetingUrl ? p(`Meeting link: <a href="${esc(d.meetingUrl)}" style="color:#0D2240">${esc(d.meetingUrl)}</a>`) : p('Your advisor will call you on the number in your profile.')) +
        p('What to prepare: your report, your latest payslip or bank statement, and your questions.') +
        p(`Need to change it? <a href="${esc(d.manageUrl)}" style="color:#0D2240">Reschedule</a>.`),
      d.meetingUrl ? { label: 'Join call', url: s(d.meetingUrl) } : undefined,
    ),
  reminder_24h: (d) =>
    make(
      `Tomorrow: your mortgage session with ${s(d.advisorFirstName)}`,
      `${s(d.time)} (${s(d.timezone)})`,
      p(`Hi ${esc(d.firstName)},`) + p(`A reminder that your session with ${esc(d.advisorFirstName)} is tomorrow at ${esc(d.time)} (${esc(d.timezone)}).`),
      d.meetingUrl ? { label: 'Join call', url: s(d.meetingUrl) } : undefined,
    ),
  reminder_1h: (d) =>
    make(
      'Starting in 1 hour',
      `Your session with ${s(d.advisorFirstName)}`,
      p(`Hi ${esc(d.firstName)},`) + p(`Your session with ${esc(d.advisorFirstName)} starts in 1 hour.`),
      d.meetingUrl ? { label: 'Join call', url: s(d.meetingUrl) } : undefined,
    ),
  abandoned_booking: (d) =>
    make(
      "Don't air me!",
      'Your advisory session is still waiting for you',
      p(`Hi ${esc(d.firstName)},`) +
        p('We noticed you started booking your 1-on-1 Mortgage Advisory Session today, but didn’t finish. Your advisor is ready to walk you through your options.') +
        p('If something stopped you, just reply to this email.'),
      { label: 'Finish booking', url: s(d.bookingUrl) },
    ),
  report_not_opened: (d) =>
    make(
      'Your mortgage numbers are waiting',
      d.headline ? `You could access up to ${s(d.headline)}.` : 'Your report is ready.',
      p(`Hi ${esc(d.firstName)},`) + p(d.headline ? `You could access up to ${esc(d.headline)}. Your full report is in your dashboard.` : 'Your full report is in your dashboard.'),
      { label: 'See my report', url: s(d.dashboardUrl) },
    ),
  review_request: (d) => {
    const stars = [1, 2, 3, 4, 5]
      .map((n) => `<a href="${esc(`${s(d.reviewUrl)}&rating=${n}`)}" style="font-size:30px;color:#E8A020;text-decoration:none">★</a>`)
      .join(' ');
    return make(
      `How was your session with ${s(d.advisorFirstName)}?`,
      'Your review helps other Nigerians choose an advisor.',
      p(`Hi ${esc(d.firstName)},`) + p(`How was your session with ${esc(d.advisorFirstName)}? Tap a star to leave a verified review.`) + p(stars),
    );
  },
  legacy_dashboard_ready: (d) =>
    make(
      'Your HomeFi dashboard is ready',
      'See your report and book an advisor in one place.',
      p(`Hi ${esc(d.firstName)},`) + p('You prequalified with HomeFi through our form. Your report and next steps now live in your own dashboard.'),
      { label: 'Open my dashboard', url: s(d.magicLink) },
    ),
  payment_failed: (d) =>
    make(
      "Your payment didn't go through",
      "You haven't been charged.",
      p(`Hi ${esc(d.firstName)},`) + p("Your payment didn't go through, and you haven't been charged. You can try again or use another card."),
      { label: 'Try again', url: s(d.bookingUrl) },
    ),
  contact_notification: (d) =>
    make(`[Contact] ${s(d.topic)} from ${s(d.name)}`, s(d.email), p(`From: ${esc(d.name)} &lt;${esc(d.email)}&gt; ${esc(d.phone)}`) + p(esc(d.message).replace(/\n/g, '<br>'))),
  ops_alert: (d) => make(`[HomeFi ops] ${s(d.subject)}`, s(d.subject), p(esc(d.body).replace(/\n/g, '<br>'))),
};

export function renderEmail(template: string, data: Data): RenderedEmail {
  const t = TEMPLATES[template];
  if (!t) throw new Error(`Unknown email template: ${template}`);
  return t(data);
}
