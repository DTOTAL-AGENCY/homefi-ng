/**
 * One-off import of the Google Form CSV (brief: "Moving the existing applicants across").
 *
 *   pnpm import:legacy -- --csv responses.csv                 # dry run: parse, run the engine, print a summary
 *   pnpm import:legacy -- --csv responses.csv --commit        # write applications, applicants, results
 *   ... --pdf-dir ./sent-reports                              # attach PDFs already sent, matched by name
 *   ... --invite                                              # create accounts + send "Your HomeFi dashboard is ready"
 *
 * Rules kept from the team's process:
 *  - legacy_source = "google_form_2026", legacy_row_index = CSV row index (1 = first response)
 *  - range income answers → lower and upper scenarios; exact income (from row 2366 on) → one scenario
 *  - email taken from the username field when the email field holds something else
 *  - malformed phone numbers kept as submitted; residence inferred from the phone code
 *  - names stored in the order the applicant typed them
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { runEngine, initials, reportFileName, type EngineInput } from '@homefi/engine';
import { fxFromRows, productsFromSnapshot, resultToRow, settingsFromRow, type EngineSettingsRow } from '@homefi/db';
import { enqueue, sb, sql } from '../db';
import { env } from '../env';

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const csvPath = opt('--csv');
const pdfDir = opt('--pdf-dir');
const commit = flag('--commit');
const invite = flag('--invite');
const EXACT_FROM_ROW = 2366;

if (!csvPath) {
  console.error('Usage: import-legacy --csv <file> [--commit] [--pdf-dir <dir>] [--invite]');
  process.exit(1);
}

/** RFC 4180 CSV parser (quoted fields, embedded commas and newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_WORDS: Record<string, string> = { UK: 'GB', USA: 'US', CANADA: 'CA', UAE: 'AE', GERMANY: 'DE', 'SOUTH AFRICA': 'ZA' };
const SOURCES: Array<[RegExp, string]> = [
  [/full-time/i, 'salaried_private'], [/part-time/i, 'part_time_contract'], [/business|self/i, 'self_employed'],
  [/pension/i, 'pension'], [/investment/i, 'investment'], [/mixed/i, 'mixed'],
];
const PROPERTY: Array<[RegExp, string]> = [
  [/semi-detached bungalow/i, 'bungalow'], [/detached bungalow/i, 'bungalow'], [/semi-detached duplex/i, 'semi_detached'],
  [/detached duplex/i, 'detached'], [/terrace/i, 'terrace'], [/land/i, 'land'],
];
const BUDGET: Array<[RegExp, number, number | null]> = [
  [/10\s*[–-]\s*20/, 10e6, 20e6], [/20 million\s*[–-]/, 20e6, 30e6], [/30 million/, 30e6, 50e6],
  [/50 million/, 50e6, 75e6], [/75 million/, 75e6, 100e6], [/above/i, 100e6, null],
];

/** "₦500k - ₦1m", "500,000", "£2,400", "$3500 USD" → amounts in minor units */
function parseIncome(raw: string): { exact?: { minor: number; currency: string }; range?: { lower: number; upper: number } } | null {
  const s = raw.replace(/,/g, '').trim();
  const currency = /£|gbp|pound/i.test(s) ? 'GBP' : /€|eur/i.test(s) ? 'EUR' : /cad/i.test(s) ? 'CAD' : /aed|dirham/i.test(s) ? 'AED' : /\$|usd|dollar/i.test(s) ? 'USD' : 'NGN';
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?/gi)].map((m) => {
    const mult = /^m/i.test(m[2] ?? '') ? 1e6 : /^(k|thousand)/i.test(m[2] ?? '') ? 1e3 : 1;
    return Number(m[1]) * mult;
  });
  if (!nums.length) return null;
  if (nums.length >= 2 && /-|–|to/i.test(s) && currency === 'NGN') return { range: { lower: nums[0]! * 100, upper: nums[1]! * 100 } };
  return { exact: { minor: Math.round(nums[0]! * 100), currency } };
}

async function main() {
  const rows = parseCsv(readFileSync(csvPath!, 'utf8'));
  const [header, ...data] = rows;
  const col = (...needles: string[]) => header!.findIndex((h) => needles.every((n) => h.toLowerCase().includes(n.toLowerCase())));
  const C = {
    name: col('full name'),
    spouseName: col('full name of your spouse'),
    email: col('email address'),
    phone: col('phone number'),
    gender: col('gender'),
    nationality: col('nationality'),
    residence: col('current country of residence'),
    state: col('state of residence'),
    marital: col('marital status'),
    source: col('primary source of income'),
    income: col('average monthly income'),
    spouseSource: col('spouse primary source'),
    spouseIncome: col('spouse average monthly income'),
    rsa: col('retirement saving account'),
    joint: col('alone, or jointly'),
    propertyType: col('type of property'),
    location: col('preferred location'),
    use: col('for rent, or as place'),
    found: col('found the particular property'),
    timeline: col('how soon'),
    budget: col('budget range'),
    heard: col('how did you hear'),
  };
  // The legacy form has two "Current Country of Residence" questions: the dropdown and the diaspora list
  const countryCols = header!.map((h, i) => (h.toLowerCase().includes('current country of residence') ? i : -1)).filter((i) => i >= 0);
  const usernameCol = header!.findIndex((h) => /^email\s*$/i.test(h.trim()) || /^username$/i.test(h.trim()));

  const { data: s } = await sb.from('engine_settings').select('*').eq('is_current', true).single();
  const { data: fxRows } = await sb.from('fx_rates').select('*');
  const settings = settingsFromRow(s as unknown as EngineSettingsRow);
  const products = productsFromSnapshot((s as unknown as EngineSettingsRow).rates_snapshot);
  const fx = fxFromRows(fxRows ?? []);
  const pdfs = pdfDir ? readdirSync(pdfDir).filter((f) => f.toLowerCase().endsWith('.pdf')) : [];

  const stats = { rows: data.length, ok: 0, skipped: 0, ranges: 0, exact: 0, emailFixed: 0, phoneKept: 0, pdfMatched: 0, invited: 0 };
  const problems: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const r = data[i]!;
    const rowIndex = i + 1;
    const get = (c: number) => (c >= 0 ? (r[c] ?? '').trim() : '');
    try {
      const typedName = get(C.name).replace(/\s+/g, ' ');
      const parts = typedName.split(' ');
      const lastName = parts[0] ?? '';
      const firstName = parts[1] ?? parts[0] ?? '';
      let email = get(C.email);
      const username = get(usernameCol);
      if (!EMAIL.test(email) && EMAIL.test(username)) { email = username; stats.emailFixed++; }

      const rawPhone = get(C.phone);
      const parsed = parsePhoneNumberFromString(rawPhone, 'NG');
      const phone = parsed?.isValid() ? parsed.number : rawPhone;
      if (!parsed?.isValid()) stats.phoneKept++;

      const outside = /outside/i.test(get(countryCols[0] ?? -1)) || /diaspora/i.test(get(C.nationality));
      const listed = countryCols.slice(1).map(get).find(Boolean) ?? '';
      let country = COUNTRY_WORDS[listed.toUpperCase().replace(/[^A-Z ]/g, '').trim()] ?? null;
      if (outside && !country && parsed?.country && parsed.country !== 'NG') country = parsed.country;

      const joint = /joint/i.test(get(C.joint));
      const inc = parseIncome(get(C.income));
      const coInc = joint ? parseIncome(get(C.spouseIncome)) : null;
      if (!inc) throw new Error('income not readable');
      const useRange = rowIndex < EXACT_FROM_ROW && (inc.range || coInc?.range);
      const toNgnMinor = (x: { minor: number; currency: string }) => x.currency === 'NGN' ? x.minor : Math.round((x.minor / 100) * Number(fx[x.currency]?.live ?? 0) * 100);
      const incomes: EngineInput['incomes'] = [];
      let legacyRange: { lower: number; upper: number } | null = null;
      if (useRange) {
        const lo = (inc.range?.lower ?? (inc.exact ? toNgnMinor(inc.exact) : 0)) + (coInc ? (coInc.range?.lower ?? (coInc.exact ? toNgnMinor(coInc.exact) : 0)) : 0);
        const hi = (inc.range?.upper ?? (inc.exact ? toNgnMinor(inc.exact) : 0)) + (coInc ? (coInc.range?.upper ?? (coInc.exact ? toNgnMinor(coInc.exact) : 0)) : 0);
        legacyRange = { lower: lo, upper: hi };
        stats.ranges++;
      } else {
        const e = inc.exact ?? { minor: inc.range!.lower, currency: 'NGN' };
        incomes.push({ amountMinor: e.minor, currency: e.currency });
        if (coInc) incomes.push(coInc.exact ? { amountMinor: coInc.exact.minor, currency: coInc.exact.currency } : { amountMinor: coInc.range!.lower, currency: 'NGN' });
        stats.exact++;
      }
      if (!legacyRange && incomes.length === 0) throw new Error('no income');

      const budget = BUDGET.find(([re]) => re.test(get(C.budget)));
      const propertyStatus = /yes/i.test(get(C.found)) ? 'found' : /help/i.test(get(C.found)) ? 'need_help' : 'searching';
      const input: EngineInput = {
        age: 35, // the legacy form did not ask for age; the advisor confirms it
        nationality: /other/i.test(get(C.nationality)) ? 'XX' : 'NG',
        residence: outside ? 'diaspora' : 'nigeria',
        nhfContributor: null,
        nonInterestPreference: 'no',
        propertyStatus,
        targetValueMinKobo: budget ? budget[1] * 100 : null,
        targetValueMaxKobo: budget?.[2] ? budget[2] * 100 : null,
        incomes: incomes.length ? incomes : [{ amountMinor: legacyRange!.lower, currency: 'NGN' }],
        legacyIncomeRangeKobo: legacyRange,
      };
      const estimate = runEngine(input, settings, products, fx);
      stats.ok++;
      if (!commit) continue;

      const { data: existing } = await sb.from('applications').select('id').eq('legacy_source', 'google_form_2026').eq('legacy_row_index', rowIndex).maybeSingle();
      if (existing) { stats.skipped++; continue; }
      const { data: ref } = await sb.rpc('next_reference_code', { p_initials: initials(firstName, lastName) });
      const [state] = get(C.location).split(/[\/,]/).map((x) => x.trim());
      const { data: app, error } = await sb.from('applications').insert({
        reference_code: ref as string,
        status: 'estimated',
        is_joint: joint,
        nationality: input.nationality,
        residence: input.residence,
        residence_country: outside ? (country ?? 'XX') : 'NG',
        residence_state: outside ? null : get(C.state) || null,
        property_type: PROPERTY.find(([re]) => re.test(get(C.propertyType)))?.[1] ?? 'not_sure',
        intended_use: /rental/i.test(get(C.use)) ? 'rent' : /primary/i.test(get(C.use)) ? 'live' : 'other',
        preferred_states: state ? [state] : [],
        preferred_city: get(C.location) || null,
        target_value_min_kobo: input.targetValueMinKobo ?? null,
        target_value_max_kobo: input.targetValueMaxKobo ?? null,
        property_status: propertyStatus,
        timeline: /1\s*[–-]\s*3/.test(get(C.timeline)) ? 'lt3m' : /3\s*[–-]\s*6/.test(get(C.timeline)) ? '3to6m' : /6\s*[–-]\s*12/.test(get(C.timeline)) ? '6to12m' : 'exploring',
        has_rsa: /yes/i.test(get(C.rsa)) ? 'yes' : /no/i.test(get(C.rsa)) ? 'no' : 'not_sure',
        non_interest_preference: 'no',
        source_channel: get(C.heard) || null,
        engine_version: settings.version,
        estimate: estimate as never,
        legacy_source: 'google_form_2026',
        legacy_row_index: rowIndex,
        submitted_at: new Date().toISOString(),
        draft: { legacy: { email, phone: rawPhone } } as never,
      }).select('id').single();
      if (error || !app) throw new Error(error?.message);
      await sb.from('applicants').insert([
        {
          application_id: app.id, role: 'primary', full_name: typedName, first_name: firstName, last_name: lastName,
          gender: /female/i.test(get(C.gender)) ? 'female' : /male/i.test(get(C.gender)) ? 'male' : null,
          phone_e164: phone, marital_status: get(C.marital).toLowerCase() || null,
          income_source: (SOURCES.find(([re]) => re.test(get(C.source)))?.[1] ?? 'other') as never,
          monthly_net_income_minor: inc.exact?.minor ?? inc.range!.lower, income_currency: inc.exact?.currency ?? 'NGN',
          legacy_income_band: inc.range ? get(C.income) : null,
        },
        ...(joint ? [{
          application_id: app.id, role: 'co_applicant', full_name: get(C.spouseName) || 'Spouse', first_name: (get(C.spouseName).split(' ')[1] ?? ''), last_name: (get(C.spouseName).split(' ')[0] ?? ''),
          income_source: (SOURCES.find(([re]) => re.test(get(C.spouseSource)))?.[1] ?? 'other') as never,
          monthly_net_income_minor: coInc?.exact?.minor ?? coInc?.range?.lower ?? 1, income_currency: coInc?.exact?.currency ?? 'NGN',
          legacy_income_band: coInc?.range ? get(C.spouseIncome) : null,
        }] : []),
      ] as never);
      await sb.from('prequal_results').insert(estimate.allResults.map((x) => resultToRow(app.id, settings.version, x)) as never);

      // Reports already sent: "MortgagePrequalification Report1 [DD.Mon.YY]_HomeFi-[Surname First-name]"
      const pdf = pdfs.find((f) => f.toLowerCase().includes(`[${lastName} ${firstName}]`.toLowerCase()));
      let userId: string | null = null;
      if (invite && EMAIL.test(email)) {
        const { data: link } = await sb.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { data: { first_name: firstName, last_name: lastName, phone }, redirectTo: `${env.siteUrl}/auth/callback?next=/app` },
        });
        userId = link?.user?.id ?? null;
        if (userId && link?.properties?.action_link) {
          await sb.from('applications').update({ user_id: userId, status: pdf ? 'report_sent' : 'claimed', claimed_at: new Date().toISOString() }).eq('id', app.id);
          await enqueue('send_email', { template: 'legacy_dashboard_ready', to: email, userId, applicationId: app.id, data: { firstName, magicLink: link.properties.action_link } });
          stats.invited++;
        }
      }
      if (pdf && userId) {
        const path = `${userId}/${ref}.pdf`;
        await sb.storage.from('reports').upload(path, readFileSync(join(pdfDir!, pdf)), { contentType: 'application/pdf', upsert: true });
        await sb.from('reports').insert({
          application_id: app.id, report_number: 1, reference_code: ref as string,
          file_name: pdf.replace(/\.pdf$/i, '') || reportFileName(1, new Date(), lastName, firstName),
          storage_path: path, status: 'emailed', emailed_at: new Date().toISOString(), prompt_version: 'legacy',
        });
        stats.pdfMatched++;
      }
    } catch (e) {
      stats.skipped++;
      problems.push(`row ${rowIndex}: ${(e as Error).message}`);
    }
  }
  console.log(commit ? 'Imported.' : 'Dry run (no changes). Add --commit to write.');
  console.table(stats);
  if (problems.length) console.log(problems.slice(0, 50).join('\n'));
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
