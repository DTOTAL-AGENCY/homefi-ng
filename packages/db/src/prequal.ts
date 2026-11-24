/**
 * The prequalification form: the brief's 4 steps with its validation rules and
 * error copy, plus the legacy Google Form questions kept on the site.
 * Money is entered in whole major units (e.g. Naira, pounds) and stored in minor units.
 */
import { z } from 'zod';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';
import type { EngineInput } from '@homefi/engine';
import { BUDGET_BANDS } from '@homefi/engine/labels';

const nameRe = /^[\p{L}][\p{L}' .-]{1,49}$/u;
const name = (msg: string) =>
  z.string({ required_error: msg }).trim().regex(nameRe, msg);

const money = z.coerce.number().int('Please enter a whole number.').min(0);

export const INCOME_SOURCES = [
  ['salaried_public', 'Salaried (government)'],
  ['salaried_private', 'Salaried (private)'],
  ['self_employed', 'Self-employed or business owner'],
  ['mixed', 'Both salary and business'],
  ['part_time_contract', 'Part-time or contract'],
  ['pension', 'Pension'],
  ['investment', 'Investment income'],
  ['other', 'Other'],
] as const;
const incomeSource = z.enum(INCOME_SOURCES.map((x) => x[0]) as [string, ...string[]], {
  required_error: 'Please choose how you earn.',
});

export const PROPERTY_TYPES = [
  ['flat', 'Flat or apartment'],
  ['terrace', 'Terrace'],
  ['semi_detached', 'Semi-detached duplex'],
  ['detached', 'Detached duplex'],
  ['bungalow', 'Bungalow'],
  ['land', 'Land to build on'],
  ['not_sure', 'Not sure yet'],
] as const;

export const PROPERTY_FEATURES = [
  ['fence', 'Fenced property'],
  ['gated_estate', 'Gated estate with security'],
  ['near_schools', 'Close to schools'],
  ['near_work', 'Close to work or business'],
  ['good_roads', 'Good road access'],
  ['parking', 'Parking for 2 to 3 cars'],
  ['solar_only', 'Solar or inverter ready'],
  ['solar_grid', 'Solar plus grid electricity'],
  ['water', 'Water supply (borehole or public)'],
  ['garden', 'Open compound with a garden'],
  ['smart_home', 'Modern fittings or smart-home features'],
] as const;

export const SOURCE_CHANNELS = [
  ['instagram', 'Instagram'],
  ['x', 'X (Twitter)'],
  ['facebook_tiktok', 'Facebook or TikTok'],
  ['linkedin', 'LinkedIn'],
  ['whatsapp', 'WhatsApp'],
  ['friend_family', 'A friend or family member'],
  ['someone_i_follow', 'Someone I follow online'],
  ['google', 'Google'],
  ['news_blog', 'News article or blog'],
  ['event', 'Event or webinar'],
  ['other', 'Other'],
] as const;

const ynns = z.enum(['yes', 'no', 'not_sure']);

// ---------------------------------------------------------------- Step 1
export const step1Schema = z
  .object({
    firstName: name('Please enter your first name.'),
    lastName: name('Please enter your surname.'),
    otherNames: z.string().trim().max(50).optional().or(z.literal('')),
    age: z.coerce
      .number({ invalid_type_error: 'You need to be between 18 and 65 to apply.' })
      .int('You need to be between 18 and 65 to apply.')
      .min(18, 'You need to be between 18 and 65 to apply.')
      .max(65, 'You need to be between 18 and 65 to apply.'),
    gender: z.enum(['male', 'female', 'prefer_not_to_say']).optional(),
    nationality: z.enum(['NG', 'NG_DUAL', 'OTHER'], { required_error: 'Please choose your nationality.' }),
    nationalityCountry: z.string().length(2).optional(),
    residence: z.enum(['nigeria', 'diaspora'], { required_error: 'Please tell us where you live now.' }),
    residenceState: z.string().optional(),
    residenceCountry: z.string().length(2).optional(),
    residenceCity: z.string().trim().max(80).optional(),
    phone: z.string({ required_error: 'Please check your phone number, including the country code.' }),
    title: z.enum(['mr', 'mrs', 'ms', 'dr', 'none']).optional(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'separated', 'widowed'], {
      required_error: 'Please choose your marital status.',
    }),
    isJoint: z.boolean({ required_error: 'Please tell us if you are applying jointly.' }),
  })
  .superRefine((v, ctx) => {
    if (v.residence === 'nigeria' && !v.residenceState)
      ctx.addIssue({ code: 'custom', path: ['residenceState'], message: 'Please choose your state.' });
    if (v.residence === 'diaspora' && (!v.residenceCountry || v.residenceCountry === 'NG'))
      ctx.addIssue({ code: 'custom', path: ['residenceCountry'], message: 'Please choose your country.' });
    if (v.nationality === 'OTHER' && !v.nationalityCountry)
      ctx.addIssue({ code: 'custom', path: ['nationalityCountry'], message: 'Please choose your nationality.' });
    const defaultCountry = (v.residence === 'nigeria' ? 'NG' : v.residenceCountry ?? 'NG') as CountryCode;
    const p = parsePhoneNumberFromString(v.phone ?? '', defaultCountry);
    if (!p || !p.isValid())
      ctx.addIssue({
        code: 'custom',
        path: ['phone'],
        message: 'Please check your phone number, including the country code.',
      });
  });
export type Step1 = z.infer<typeof step1Schema>;

// ---------------------------------------------------------------- Step 2
const coApplicant = z.object({
  firstName: name("Please enter your spouse or partner's first name."),
  lastName: name("Please enter your spouse or partner's surname."),
  incomeSource,
  currency: z.string().length(3),
  monthlyIncome: money.min(1, 'Please enter their monthly take-home income.'),
});

export const step2Schema = z
  .object({
    incomeSource,
    incomeCurrency: z.string().length(3, 'Please choose a currency.'),
    monthlyIncome: money.min(1, 'Please enter your monthly take-home income.'),
    existingObligations: money.default(0),
    co: coApplicant.optional(),
    nhfContributor: ynns.optional(),
    hasRsa: z.enum(['yes', 'no', 'not_sure'], { required_error: 'Please choose an answer.' }),
    equityAvailable: money.default(0),
  })
  .passthrough();
export type Step2 = z.infer<typeof step2Schema>;

// ---------------------------------------------------------------- Step 3
export const step3Schema = z
  .object({
    propertyType: z.enum(PROPERTY_TYPES.map((x) => x[0]) as [string, ...string[]], {
      required_error: 'Please choose a property type.',
    }),
    propertyFeatures: z.array(z.enum(PROPERTY_FEATURES.map((x) => x[0]) as [string, ...string[]])).default([]),
    bedrooms: z.enum(['1', '2', '3', '4', '5+']).optional(),
    intendedUse: z.enum(['live', 'rent', 'family', 'other'], { required_error: 'Please choose what it is for.' }),
    preferredStates: z
      .array(z.string())
      .min(1, 'Please choose at least one state.')
      .max(3, 'Choose up to 3 states.'),
    preferredCity: z.string().trim().max(80).optional(),
    targetBand: z.enum(BUDGET_BANDS.map((b) => b.key) as [string, ...string[]], {
      required_error: 'Please choose your budget.',
    }),
    targetExact: money.optional(),
    propertyStatus: z.enum(['found', 'searching', 'need_help'], { required_error: 'Please choose an answer.' }),
    timeline: z.enum(['lt3m', '3to6m', '6to12m', 'gt12m', 'exploring'], {
      required_error: 'Please choose when you would like to buy.',
    }),
  })
  .superRefine((v, ctx) => {
    if (v.targetBand === 'exact' && !v.targetExact)
      ctx.addIssue({ code: 'custom', path: ['targetExact'], message: 'Please enter the price.' });
  });
export type Step3 = z.infer<typeof step3Schema>;

// ---------------------------------------------------------------- Step 4
export const step4Schema = z.object({
  costsAcknowledged: z.enum(['understood', 'have_questions'], { required_error: 'Please choose an answer.' }),
  rsaEquityUse: z.enum(['explore', 'other_sources', 'advise']).optional(),
  financialReadiness: z.enum(['ready', '1to3m', '6m', 'not_yet'], { required_error: 'Please choose an answer.' }),
  proceedIntent: z.enum(['prepare_and_contact', 'advisor_first', 'email_list'], {
    required_error: 'Please choose an answer.',
  }),
  nonInterestPreference: z.enum(['yes', 'no', 'open'], { required_error: 'Please choose an answer.' }),
  sourceChannel: z.string().optional(),
  notes: z.string().max(500, 'Please keep this under 500 characters.').optional(),
  consentProcessing: z.literal(true, {
    errorMap: () => ({ message: 'Please tick the box to agree before we prepare your estimate.' }),
  }),
});
export type Step4 = z.infer<typeof step4Schema>;

export const CONSENT_VERSION = 'processing-2026-11-v1';
export const CONSENT_TEXT =
  'I confirm the information I have given is accurate to the best of my knowledge, and I agree that HomeFi can use these details to prepare my mortgage estimate and contact me about it, in line with the Privacy Notice.';

export const stepSchemas = { 1: step1Schema, 2: step2Schema, 3: step3Schema, 4: step4Schema } as const;
export type StepNumber = keyof typeof stepSchemas;

export interface Draft {
  1?: Partial<Step1>;
  2?: Partial<Step2>;
  3?: Partial<Step3>;
  4?: Partial<Step4>;
}

/** Cross-step checks that need answers from more than one step. */
export function validateComplete(draft: Draft):
  | { ok: true; data: { 1: Step1; 2: Step2; 3: Step3; 4: Step4 } }
  | { ok: false; step: StepNumber; fields: Record<string, string> } {
  const out: Record<number, unknown> = {};
  for (const n of [1, 2, 3, 4] as const) {
    const r = stepSchemas[n].safeParse(draft[n] ?? {});
    if (!r.success) return { ok: false, step: n, fields: flatten(r.error) };
    out[n] = r.data;
  }
  const d = out as { 1: Step1; 2: Step2; 3: Step3; 4: Step4 };
  if (d[1].isJoint && !d[2].co)
    return { ok: false, step: 2, fields: { co: "Please add your spouse or partner's income." } };
  if (d[1].residence === 'nigeria' && !d[2].nhfContributor)
    return { ok: false, step: 2, fields: { nhfContributor: 'Please choose an answer.' } };
  if (d[2].hasRsa !== 'no' && !d[4].rsaEquityUse)
    return { ok: false, step: 4, fields: { rsaEquityUse: 'Please choose an answer.' } };
  return { ok: true, data: d };
}

export function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = i.path.join('.') || '_';
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

const toMinor = (major: number) => Math.round(major * 100);

export function phoneE164(step1: Step1): { e164: string; country: string | null } {
  const def = (step1.residence === 'nigeria' ? 'NG' : step1.residenceCountry ?? 'NG') as CountryCode;
  const p = parsePhoneNumberFromString(step1.phone, def);
  return { e164: p?.number ?? step1.phone, country: p?.country ?? null };
}

export function nationalityCode(step1: Step1): string {
  return step1.nationality === 'OTHER' ? (step1.nationalityCountry ?? 'XX').toUpperCase() : step1.nationality;
}

export function targetRange(step3: Step3): { minKobo: number | null; maxKobo: number | null; exactKobo: number | null } {
  if (step3.targetBand === 'exact') {
    const k = toMinor(step3.targetExact ?? 0);
    return { minKobo: k, maxKobo: k, exactKobo: k };
  }
  const b = BUDGET_BANDS.find((x) => x.key === step3.targetBand)!;
  return { minKobo: b.minKobo, maxKobo: b.maxKobo, exactKobo: null };
}

export function toEngineInput(d: { 1: Step1; 2: Step2; 3: Step3; 4: Step4 }): EngineInput {
  const incomes: EngineInput['incomes'] = [
    {
      amountMinor: toMinor(d[2].monthlyIncome),
      currency: d[2].incomeCurrency,
      obligationsMinor: toMinor(d[2].existingObligations ?? 0),
    },
  ];
  if (d[1].isJoint && d[2].co) {
    incomes.push({ amountMinor: toMinor(d[2].co.monthlyIncome), currency: d[2].co.currency });
  }
  const t = targetRange(d[3]);
  return {
    age: d[1].age,
    nationality: nationalityCode(d[1]),
    residence: d[1].residence,
    nhfContributor: d[1].residence === 'nigeria' ? (d[2].nhfContributor ?? null) : null,
    nonInterestPreference: d[4].nonInterestPreference,
    propertyStatus: d[3].propertyStatus,
    targetValueMinKobo: t.minKobo || null,
    targetValueMaxKobo: t.maxKobo,
    incomes,
  };
}

export interface ApplicantRow {
  role: 'primary' | 'co_applicant';
  first_name: string;
  last_name: string;
  other_names?: string | null;
  full_name: string;
  title?: string | null;
  gender?: string | null;
  phone_e164?: string | null;
  age?: number | null;
  marital_status?: string | null;
  income_source: string;
  monthly_net_income_minor: number;
  income_currency: string;
  existing_monthly_obligations_minor: number;
}

/** Column values for applications + applicants once the form is complete. */
export function toRows(d: { 1: Step1; 2: Step2; 3: Step3; 4: Step4 }) {
  const t = targetRange(d[3]);
  const phone = phoneE164(d[1]);
  const application = {
    is_joint: d[1].isJoint,
    nationality: nationalityCode(d[1]),
    residence: d[1].residence,
    residence_country: d[1].residence === 'nigeria' ? 'NG' : (d[1].residenceCountry ?? 'XX'),
    residence_state: d[1].residence === 'nigeria' ? (d[1].residenceState ?? null) : null,
    residence_city: d[1].residence === 'diaspora' ? (d[1].residenceCity ?? null) : null,
    property_type: d[3].propertyType,
    property_features: d[3].propertyFeatures ?? [],
    bedrooms: d[3].bedrooms ?? null,
    intended_use: d[3].intendedUse,
    preferred_states: d[3].preferredStates,
    preferred_city: d[3].preferredCity ?? null,
    target_value_min_kobo: t.minKobo,
    target_value_max_kobo: t.maxKobo,
    target_exact_kobo: t.exactKobo,
    property_status: d[3].propertyStatus,
    timeline: d[3].timeline,
    equity_available_kobo: d[2].incomeCurrency === 'NGN' ? toMinor(d[2].equityAvailable ?? 0) : 0,
    has_rsa: d[2].hasRsa,
    nhf_contributor: d[1].residence === 'nigeria' ? (d[2].nhfContributor ?? null) : null,
    non_interest_preference: d[4].nonInterestPreference,
    rsa_equity_use: d[2].hasRsa === 'no' ? null : (d[4].rsaEquityUse ?? null),
    costs_acknowledged: d[4].costsAcknowledged,
    financial_readiness: d[4].financialReadiness,
    proceed_intent: d[4].proceedIntent,
    notes: d[4].notes || null,
    source_channel: d[4].sourceChannel ?? null,
  };
  const primary: ApplicantRow = {
    role: 'primary',
    first_name: d[1].firstName,
    last_name: d[1].lastName,
    other_names: d[1].otherNames || null,
    full_name: [d[1].lastName, d[1].firstName, d[1].otherNames].filter(Boolean).join(' '),
    title: d[1].title ?? null,
    gender: d[1].gender ?? null,
    phone_e164: phone.e164,
    age: d[1].age,
    marital_status: d[1].maritalStatus,
    income_source: d[2].incomeSource,
    monthly_net_income_minor: toMinor(d[2].monthlyIncome),
    income_currency: d[2].incomeCurrency,
    existing_monthly_obligations_minor: toMinor(d[2].existingObligations ?? 0),
  };
  const co: ApplicantRow | null =
    d[1].isJoint && d[2].co
      ? {
          role: 'co_applicant',
          first_name: d[2].co.firstName,
          last_name: d[2].co.lastName,
          full_name: `${d[2].co.lastName} ${d[2].co.firstName}`,
          income_source: d[2].co.incomeSource,
          monthly_net_income_minor: toMinor(d[2].co.monthlyIncome),
          income_currency: d[2].co.currency,
          existing_monthly_obligations_minor: 0,
        }
      : null;
  return { application, applicants: co ? [primary, co] : [primary], phoneCountry: phone.country };
}
