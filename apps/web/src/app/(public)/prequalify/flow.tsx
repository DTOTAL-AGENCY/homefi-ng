'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- loosely typed form state / query builder */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INCOME_SOURCES,
  PROPERTY_FEATURES,
  PROPERTY_TYPES,
  SOURCE_CHANNELS,
  flatten,
  stepSchemas,
  type Draft,
} from '@homefi/db/prequal';
import {
  ALL_COUNTRY_CODES,
  BUDGET_BANDS,
  CURRENCIES,
  NIGERIAN_STATES,
  PRIORITY_COUNTRIES,
  countryName,
  defaultCurrency,
} from '@homefi/engine/labels';
import { CheckboxGroup, ChoiceGroup, CURRENCY_SYMBOL, Field, MoneyInput } from '@/components/form-fields';
import { RoofspanMark } from '@/components/logo';
import { track } from '@/components/analytics';
import { useTurnstile } from '@/components/turnstile';

const STORE_KEY = 'hf_prequal_v1';
const MINUTES_LEFT = { 1: 4, 2: 3, 3: 2, 4: 1 } as const;
const LOADING_LINES = [
  'Checking your income against lender rules…',
  'Comparing NHF, MREIF and commercial options…',
  'Preparing your estimate…',
];

const HEADINGS = {
  1: ['First, a little about you', 'This helps us check which schemes you qualify for.'],
  2: ['Now, your income', 'Use your take-home pay after tax. An exact figure gives you a more accurate estimate.'],
  3: ['Tell us about the home you want', "Not sure yet? That's fine. Pick the closest option."],
  4: ['Almost done', 'A few last questions, then your estimate.'],
} as const;

type Answers ={ 1: Record<string, any>; 2: Record<string, any>; 3: Record<string, any>; 4: Record<string, any> };
type Step = 1 | 2 | 3 | 4;

const COUNTRY_OPTIONS = [
  ...PRIORITY_COUNTRIES,
  ...ALL_COUNTRY_CODES.filter((c) => !PRIORITY_COUNTRIES.includes(c) && c !== 'NG').sort((a, b) =>
    (countryName(a) ?? a).localeCompare(countryName(b) ?? b),
  ),
].map((c) => [c, countryName(c) ?? c] as const);

const emptyAnswers = (): Answers => ({
  1: { nationality: 'NG', residence: undefined },
  2: { existingObligations: undefined, equityAvailable: undefined },
  3: { propertyFeatures: [], preferredStates: [] },
  4: {},
});

function loadLocal(): { applicationId: string | null; step: Step; answers: Answers } | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function PrequalFlow({ sourceFromUtm }: { sourceFromUtm?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingLine, setLoadingLine] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [restored, setRestored] = useState(false);
  const stepStarted = useRef(Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const turnstile = useTurnstile();

  // Restore from this device, then from the server draft
  useEffect(() => {
    const local = loadLocal();
    if (local) {
      setAnswers({ ...emptyAnswers(), ...local.answers });
      setStep(local.step);
      setApplicationId(local.applicationId);
      if (local.applicationId) {
        fetch(`/api/v1/prequal/applications/${local.applicationId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (!d) {
              setApplicationId(null);
              return;
            }
            if (d.status !== 'draft' && d.status !== 'estimated') {
              localStorage.removeItem(STORE_KEY);
              setApplicationId(null);
              setAnswers(emptyAnswers());
              setStep(1);
            }
          })
          .catch(() => {});
      }
    } else {
      track('prequal_started', { source: sourceFromUtm ?? null, device: window.innerWidth < 768 ? 'mobile' : 'desktop' });
    }
    if (sourceFromUtm) setAnswers((a) => ({ ...a, 4: { sourceChannel: sourceFromUtm, ...a[4] } }));
    setRestored(true);
  }, [sourceFromUtm]);

  // Local backup between steps
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ applicationId, step, answers }));
    } catch {}
  }, [restored, applicationId, step, answers]);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    stepStarted.current = Date.now();
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  const set = useCallback(
    (s: Step, key: string, value: unknown) => {
      setAnswers((a) => ({ ...a, [s]: { ...a[s], [key]: value } }));
      setErrors((e) => {
        if (!e[key]) return e;
        const { [key]: _, ...rest } = e;
        return rest;
      });
    },
    [],
  );

  const a1 = answers[1];
  const a2 = answers[2];
  const a3 = answers[3];
  const a4 = answers[4];
  const resident = a1.residence === 'nigeria';
  const diaspora = a1.residence === 'diaspora';

  // Currency defaults from the residence country
  useEffect(() => {
    if (!a1.residence) return;
    const cur = resident ? 'NGN' : defaultCurrency(a1.residenceCountry);
    setAnswers((a) => (a[2].incomeCurrency ? a : { ...a, 2: { ...a[2], incomeCurrency: cur } }));
  }, [a1.residence, a1.residenceCountry, resident]);

  /** The step's data as sent to the server, with conditional fields cleaned up. */
  const payloadFor = useCallback(
    (s: Step) => {
      const d = { ...answers[s] };
      if (s === 1) {
        if (d.residence === 'nigeria') {
          delete d.residenceCountry;
          delete d.residenceCity;
        } else delete d.residenceState;
        if (d.nationality !== 'OTHER') delete d.nationalityCountry;
      }
      if (s === 2) {
        if (!answers[1].isJoint) delete d.co;
        else d.co = { currency: d.incomeCurrency, ...(d.co ?? {}) };
        if (answers[1].residence !== 'nigeria') delete d.nhfContributor;
        d.existingObligations ??= 0;
        d.equityAvailable ??= 0;
      }
      if (s === 3 && d.targetBand !== 'exact') delete d.targetExact;
      if (s === 4 && answers[2].hasRsa === 'no') delete d.rsaEquityUse;
      return d;
    },
    [answers],
  );

  function validate(s: Step): Record<string, string> {
    const data = payloadFor(s);
    const r = stepSchemas[s].safeParse(data);
    const errs = r.success ? {} : flatten(r.error);
    if (s === 2) {
      if (a1.residence === 'nigeria' && !data.nhfContributor) errs.nhfContributor = 'Please choose an answer.';
      if (a1.isJoint) {
        const co = data.co ?? {};
        if (!co.firstName) errs['co.firstName'] = "Please enter your spouse or partner's first name.";
        if (!co.lastName) errs['co.lastName'] = "Please enter your spouse or partner's surname.";
        if (!co.incomeSource) errs['co.incomeSource'] = 'Please choose how they earn.';
        if (!co.monthlyIncome) errs['co.monthlyIncome'] = 'Please enter their monthly take-home income.';
      }
    }
    if (s === 4 && a2.hasRsa && a2.hasRsa !== 'no' && !data.rsaEquityUse) errs.rsaEquityUse = 'Please choose an answer.';
    return errs;
  }

  async function saveStep(s: Step): Promise<string | null> {
    const res = await fetch('/api/v1/prequal/applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        applicationId,
        step: s,
        data: payloadFor(s),
        turnstileToken: applicationId ? undefined : await turnstile.token(),
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (body?.error?.fields) setErrors(body.error.fields);
      if (res.status === 404 && applicationId) {
        // Draft expired or belongs to another device: start a fresh draft with the same answers
        setApplicationId(null);
      }
      throw new Error(body?.error?.message ?? 'Something went wrong on our side. Your answers are safe.');
    }
    setApplicationId(body.applicationId);
    return body.applicationId as string;
  }

  async function next() {
    setBanner(null);
    const errs = validate(step);
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ block: 'center' }));
      return;
    }
    if (offline) {
      setBanner("You seem to be offline. Your answers are saved; we'll continue when you're back.");
      return;
    }
    setSaving(true);
    try {
      const id = await saveStep(step);
      track('prequal_step_completed', { step, seconds_on_step: Math.round((Date.now() - stepStarted.current) / 1000) });
      if (step < 4) {
        setStep((step + 1) as Step);
      } else {
        await submit(id!);
      }
    } catch (e) {
      setBanner((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function submit(id: string) {
    setLoadingLine(0);
    const started = Date.now();
    const timer = setInterval(() => setLoadingLine((l) => (l === null ? l : Math.min(l + 1, 2))), 1100);
    try {
      const res = await fetch(`/api/v1/prequal/applications/${id}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ turnstileToken: await turnstile.token() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        if (body?.error?.step) {
          setStep(body.error.step);
          setErrors(body.error.fields ?? {});
        }
        throw new Error(body?.error?.message ?? 'Something went wrong on our side. Your answers are safe.');
      }
      track('prequal_submitted', {
        is_joint: !!a1.isJoint,
        residence: a1.residence,
        income_currency: a2.incomeCurrency,
        property_type: a3.propertyType,
        target_band: a3.targetBand,
      });
      const wait = Math.max(0, 2000 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      router.push(`/prequalify/result/${id}`);
    } catch (e) {
      setLoadingLine(null);
      setBanner((e as Error).message);
    } finally {
      clearInterval(timer);
    }
  }

  const back = () => {
    setErrors({});
    setBanner(null);
    if (step > 1) setStep((step - 1) as Step);
  };

  const sym = CURRENCY_SYMBOL[a2.incomeCurrency ?? 'NGN'] ?? a2.incomeCurrency ?? '₦';
  const err = (k: string) => errors[k];

  if (loadingLine !== null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center" role="status" aria-live="polite">
        <RoofspanMark className="h-16 w-16 animate-pulse" />
        <p className="mt-6 text-lg font-semibold text-navy">{LOADING_LINES[loadingLine]}</p>
      </div>
    );
  }

  const heading = HEADINGS[step];

  return (
    <div className="pb-28 sm:pb-10">
      {/* Progress */}
      <div className="mb-6">
        <p className="num text-sm font-semibold text-muted">
          Step {step} of 4 · About {MINUTES_LEFT[step]} minute{MINUTES_LEFT[step] > 1 ? 's' : ''} left
        </p>
        <div className="mt-2 h-2 rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} aria-label="Progress">
          <div className="h-2 rounded-full bg-gold transition-all" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="h-display text-3xl text-navy outline-none">
        {heading[0]}
      </h2>
      <p className="mt-1 text-muted">{heading[1]}</p>

      {(offline || banner) && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm font-medium text-danger" role="alert">
          {offline ? "You seem to be offline. Your answers are saved; we'll continue when you're back." : banner}
        </p>
      )}

      <form
        className="mt-8 space-y-7"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void next();
        }}
      >
        {step === 1 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" help="As it appears on your ID" error={err('firstName')}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} className="input" autoComplete="given-name" value={a1.firstName ?? ''} aria-describedby={describedBy} aria-invalid={invalid} onChange={(e) => set(1, 'firstName', e.target.value)} />
                )}
              </Field>
              <Field label="Surname" error={err('lastName')}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} className="input" autoComplete="family-name" value={a1.lastName ?? ''} aria-describedby={describedBy} aria-invalid={invalid} onChange={(e) => set(1, 'lastName', e.target.value)} />
                )}
              </Field>
            </div>
            <Field label="Other names" optional error={err('otherNames')}>
              {({ id }) => <input id={id} className="input" autoComplete="additional-name" value={a1.otherNames ?? ''} onChange={(e) => set(1, 'otherNames', e.target.value)} />}
            </Field>
            <Field
              label="How old are you?"
              error={err('age')}
              help={Number(a1.age) > 55 && Number(a1.age) <= 65 ? 'Lenders limit how long you can repay, so your estimate will reflect a shorter term.' : undefined}
            >
              {({ id, describedBy, invalid }) => (
                <input id={id} className="input num max-w-40" inputMode="numeric" placeholder="e.g. 34" value={a1.age ?? ''} aria-describedby={describedBy} aria-invalid={invalid} onChange={(e) => set(1, 'age', e.target.value.replace(/\D/g, '').slice(0, 2) ? Number(e.target.value.replace(/\D/g, '').slice(0, 2)) : undefined)} />
              )}
            </Field>
            <ChoiceGroup legend="Gender" optional name="gender" columns={3} value={a1.gender} onChange={(v) => set(1, 'gender', v)} options={[['male', 'Male'], ['female', 'Female'], ['prefer_not_to_say', 'Prefer not to say']] as const} />
            <ChoiceGroup
              legend="Nationality"
              name="nationality"
              value={a1.nationality}
              onChange={(v) => set(1, 'nationality', v)}
              error={err('nationality')}
              options={[['NG', 'Nigerian'], ['NG_DUAL', 'Dual citizen (Nigerian and another)'], ['OTHER', 'Other']] as const}
              help={a1.nationality === 'OTHER' ? "Some schemes like NHF are only for Nigerians. We'll show you the options that fit." : undefined}
            />
            {a1.nationality === 'OTHER' && (
              <Field label="Which country?" error={err('nationalityCountry')}>
                {({ id, invalid }) => (
                  <select id={id} className="input" aria-invalid={invalid} value={a1.nationalityCountry ?? ''} onChange={(e) => set(1, 'nationalityCountry', e.target.value)}>
                    <option value="">Choose your country</option>
                    {COUNTRY_OPTIONS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                  </select>
                )}
              </Field>
            )}
            <ChoiceGroup legend="Where do you live now?" name="residence" columns={2} value={a1.residence} onChange={(v) => set(1, 'residence', v)} error={err('residence')} options={[['nigeria', 'In Nigeria'], ['diaspora', 'Outside Nigeria (diaspora)']] as const} />
            {resident && (
              <Field label="State of residence" error={err('residenceState')}>
                {({ id, invalid }) => (
                  <select id={id} className="input" aria-invalid={invalid} value={a1.residenceState ?? ''} onChange={(e) => set(1, 'residenceState', e.target.value)}>
                    <option value="">Choose your state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s === 'FCT' ? 'FCT (Abuja)' : s}</option>)}
                  </select>
                )}
              </Field>
            )}
            {diaspora && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Country" error={err('residenceCountry')}>
                  {({ id, invalid }) => (
                    <select id={id} className="input" aria-invalid={invalid} value={a1.residenceCountry ?? ''} onChange={(e) => set(1, 'residenceCountry', e.target.value)}>
                      <option value="">Choose your country</option>
                      {COUNTRY_OPTIONS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="City" optional>
                  {({ id }) => <input id={id} className="input" placeholder="e.g. Manchester" value={a1.residenceCity ?? ''} onChange={(e) => set(1, 'residenceCity', e.target.value)} />}
                </Field>
              </div>
            )}
            <Field label="Phone number (WhatsApp preferred)" help={diaspora ? 'Include your country code, e.g. +44 7400 123456' : 'e.g. +234 801 234 5678'} error={err('phone')}>
              {({ id, describedBy, invalid }) => (
                <input id={id} className="input num" type="tel" autoComplete="tel" inputMode="tel" placeholder={diaspora ? '+44 7400 123456' : '+234 801 234 5678'} value={a1.phone ?? ''} aria-describedby={describedBy} aria-invalid={invalid} onChange={(e) => set(1, 'phone', e.target.value)} />
              )}
            </Field>
            <ChoiceGroup legend="Title" optional name="title" columns={3} value={a1.title} onChange={(v) => set(1, 'title', v)} help="We use this to address you in your report" options={[['mr', 'Mr'], ['mrs', 'Mrs'], ['ms', 'Ms'], ['dr', 'Dr'], ['none', 'Prefer not to say']] as const} />
            <ChoiceGroup legend="Marital status" name="maritalStatus" columns={3} value={a1.maritalStatus} onChange={(v) => set(1, 'maritalStatus', v)} error={err('maritalStatus')} options={[['single', 'Single'], ['married', 'Married'], ['divorced', 'Divorced'], ['separated', 'Separated'], ['widowed', 'Widowed']] as const} />
            <ChoiceGroup
              legend="Are you applying with your spouse or partner?"
              name="isJoint"
              columns={2}
              value={a1.isJoint === undefined ? undefined : a1.isJoint ? 'yes' : 'no'}
              onChange={(v) => set(1, 'isJoint', v === 'yes')}
              error={err('isJoint')}
              help="Applying together can increase what you can access. Both names will appear on the title document and the mortgage agreement."
              options={[['yes', 'Yes, jointly'], ['no', 'No, just me']] as const}
            />
          </>
        )}

        {step === 2 && (
          <>
            <ChoiceGroup
              legend="How do you earn?"
              name="incomeSource"
              columns={2}
              value={a2.incomeSource}
              onChange={(v) => set(2, 'incomeSource', v)}
              error={err('incomeSource')}
              options={INCOME_SOURCES}
              help={['self_employed', 'mixed'].includes(a2.incomeSource) ? 'Lenders accept business income. Your advisor will tell you which statements to prepare.' : undefined}
            />
            <Field label="Currency" error={err('incomeCurrency')}>
              {({ id }) => (
                <select id={id} className="input max-w-48" value={a2.incomeCurrency ?? 'NGN'} onChange={(e) => set(2, 'incomeCurrency', e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </Field>
            <Field
              label="Average monthly take-home income"
              error={err('monthlyIncome')}
              help={a2.incomeCurrency === 'NGN' && a2.monthlyIncome && a2.monthlyIncome < 70_000 ? 'Please check this figure. It should be your monthly, not weekly, income.' : 'After tax'}
            >
              {({ id, describedBy, invalid }) => <MoneyInput id={id} symbol={sym} value={a2.monthlyIncome} describedBy={describedBy} invalid={invalid} onChange={(v) => set(2, 'monthlyIncome', v)} />}
            </Field>
            <Field label="Monthly loan repayments you already make (if any)" optional help="Car loans, salary advances, other mortgages.">
              {({ id, describedBy }) => <MoneyInput id={id} symbol={sym} value={a2.existingObligations} describedBy={describedBy} onChange={(v) => set(2, 'existingObligations', v)} />}
            </Field>

            {a1.isJoint && (
              <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
                <h3 className="text-lg font-bold text-navy">Your spouse or partner</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First name" error={err('co.firstName')}>
                    {({ id, invalid }) => <input id={id} className="input" aria-invalid={invalid} value={a2.co?.firstName ?? ''} onChange={(e) => set(2, 'co', { ...a2.co, firstName: e.target.value })} />}
                  </Field>
                  <Field label="Surname" error={err('co.lastName')}>
                    {({ id, invalid }) => <input id={id} className="input" aria-invalid={invalid} value={a2.co?.lastName ?? ''} onChange={(e) => set(2, 'co', { ...a2.co, lastName: e.target.value })} />}
                  </Field>
                </div>
                <ChoiceGroup legend="How do they earn?" name="coIncomeSource" columns={2} value={a2.co?.incomeSource} onChange={(v) => set(2, 'co', { ...a2.co, incomeSource: v })} error={err('co.incomeSource')} options={INCOME_SOURCES} />
                <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
                  <Field label="Currency">
                    {({ id }) => (
                      <select id={id} className="input" value={a2.co?.currency ?? a2.incomeCurrency ?? 'NGN'} onChange={(e) => set(2, 'co', { ...a2.co, currency: e.target.value })}>
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field label="Their monthly take-home income" error={err('co.monthlyIncome')}>
                    {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} symbol={CURRENCY_SYMBOL[a2.co?.currency ?? a2.incomeCurrency ?? 'NGN'] ?? ''} value={a2.co?.monthlyIncome} onChange={(v) => set(2, 'co', { ...a2.co, monthlyIncome: v })} />}
                  </Field>
                </div>
              </div>
            )}

            {resident && (
              <ChoiceGroup legend="Do you contribute to the National Housing Fund (NHF)?" name="nhf" columns={3} value={a2.nhfContributor} onChange={(v) => set(2, 'nhfContributor', v)} error={err('nhfContributor')} help="Usually 2.5% of your salary, deducted by your employer" options={[['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']] as const} />
            )}
            <ChoiceGroup legend="Do you have a pension (RSA) account with a PFA?" name="rsa" columns={3} value={a2.hasRsa} onChange={(v) => set(2, 'hasRsa', v)} error={err('hasRsa')} help="You may be able to use up to 25% of it towards your deposit" options={[['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure']] as const} />
            <Field label="How much could you put down as a deposit today?" optional help="Most lenders ask for at least 10% of the property price.">
              {({ id, describedBy }) => <MoneyInput id={id} symbol="₦" value={a2.equityAvailable} describedBy={describedBy} onChange={(v) => set(2, 'equityAvailable', v)} />}
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <ChoiceGroup legend="What type of property?" name="propertyType" columns={2} value={a3.propertyType} onChange={(v) => set(3, 'propertyType', v)} error={err('propertyType')} options={PROPERTY_TYPES} />
            <ChoiceGroup legend="How many bedrooms?" optional name="bedrooms" columns={3} value={a3.bedrooms} onChange={(v) => set(3, 'bedrooms', v)} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5+', '5 or more']] as const} />
            <CheckboxGroup legend="Which features matter most to you?" optional help="Select all that apply. Your advisor uses this to narrow down properties." options={PROPERTY_FEATURES} value={a3.propertyFeatures ?? []} onChange={(v) => set(3, 'propertyFeatures', v)} />
            <ChoiceGroup legend="What is it for?" name="intendedUse" columns={2} value={a3.intendedUse} onChange={(v) => set(3, 'intendedUse', v)} error={err('intendedUse')} options={[['live', 'To live in'], ['rent', 'To rent out'], ['family', 'For family'], ['other', 'Other']] as const} />
            <CheckboxGroup legend="Where do you want to buy?" help="Choose up to 3 states." max={3} options={NIGERIAN_STATES.map((s) => [s, s === 'FCT' ? 'FCT (Abuja)' : s] as const)} value={a3.preferredStates ?? []} onChange={(v) => set(3, 'preferredStates', v)} error={err('preferredStates')} />
            <Field label="City or area" optional>
              {({ id }) => <input id={id} className="input" placeholder="e.g. Lugbe" value={a3.preferredCity ?? ''} onChange={(e) => set(3, 'preferredCity', e.target.value)} />}
            </Field>
            <ChoiceGroup legend="What is your budget for the property?" name="targetBand" columns={2} value={a3.targetBand} onChange={(v) => set(3, 'targetBand', v)} error={err('targetBand')} options={BUDGET_BANDS.map((b) => [b.key, b.label] as const)} />
            {a3.targetBand === 'exact' && (
              <Field label="Property price" error={err('targetExact')}>
                {({ id, invalid }) => <MoneyInput id={id} invalid={invalid} symbol="₦" value={a3.targetExact} onChange={(v) => set(3, 'targetExact', v)} />}
              </Field>
            )}
            <ChoiceGroup legend="Have you found the property?" name="propertyStatus" value={a3.propertyStatus} onChange={(v) => set(3, 'propertyStatus', v)} error={err('propertyStatus')} options={[['found', "Yes, I've found it"], ['searching', 'Still looking'], ['need_help', "I'd like HomeFi to find one for me"]] as const} />
            <ChoiceGroup legend="When would you like to move or buy?" name="timeline" columns={2} value={a3.timeline} onChange={(v) => set(3, 'timeline', v)} error={err('timeline')} options={[['lt3m', 'Within 3 months'], ['3to6m', '3 to 6 months'], ['6to12m', '6 to 12 months'], ['gt12m', 'Over 12 months'], ['exploring', 'Just exploring']] as const} />
          </>
        )}

        {step === 4 && (
          <>
            <section aria-labelledby="costs-h" className="rounded-2xl border border-line bg-white p-5">
              <h3 id="costs-h" className="text-lg font-bold text-navy">The upfront costs of a mortgage</h3>
              <p className="mt-2 text-sm text-muted">These are standard across the Nigerian mortgage industry, not HomeFi fees.</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                <li><strong className="text-navy">Deposit (equity):</strong> 10% to 30% of the property value, paid while your mortgage offer is processed.</li>
                <li><strong className="text-navy">Lender processing costs:</strong> 8% to 10% of the property value, covering legal search, valuation, title perfection, insurance and the bank&apos;s fee.</li>
              </ul>
              <p className="num mt-3 text-sm text-muted">
                Example: a ₦30,000,000 home through MREIF needs at least ₦3,000,000 as a 10% deposit, plus ₦2,100,000 to ₦2,700,000 in processing costs, so about ₦5,000,000 to ₦5,700,000 in total.
              </p>
            </section>
            <ChoiceGroup legend="Have you read the deposit and processing cost information above?" name="costs" columns={2} value={a4.costsAcknowledged} onChange={(v) => set(4, 'costsAcknowledged', v)} error={err('costsAcknowledged')} options={[['understood', "Yes, I've read and understood"], ['have_questions', 'I have questions']] as const} />
            {a2.hasRsa && a2.hasRsa !== 'no' && (
              <ChoiceGroup
                legend="Would you like to use part of your RSA (up to 25%) towards your deposit?"
                name="rsaUse"
                value={a4.rsaEquityUse}
                onChange={(v) => set(4, 'rsaEquityUse', v)}
                error={err('rsaEquityUse')}
                help="PenCom guidelines let eligible RSA holders use up to 25% of their balance towards the deposit on a home. Your advisor will walk you through it."
                options={[['explore', "Yes, I'd like to explore this"], ['other_sources', "No, I'll use other savings"], ['advise', "I'd like advice on what works best"]] as const}
              />
            )}
            <ChoiceGroup legend="Are you ready to pay the deposit and processing costs when due?" name="ready" columns={2} value={a4.financialReadiness} onChange={(v) => set(4, 'financialReadiness', v)} error={err('financialReadiness')} options={[['ready', "Yes, I'm ready"], ['1to3m', 'Within 1 to 3 months'], ['6m', 'In about 6 months'], ['not_yet', 'Not yet']] as const} />
            <ChoiceGroup legend="Would you prefer a non-interest (Sharia-compliant) option?" name="nonInterest" columns={3} value={a4.nonInterestPreference} onChange={(v) => set(4, 'nonInterestPreference', v)} error={err('nonInterestPreference')} options={[['yes', 'Yes'], ['no', 'No'], ['open', 'Open to it']] as const} />
            <ChoiceGroup legend="What would you like to happen next?" name="intent" value={a4.proceedIntent} onChange={(v) => set(4, 'proceedIntent', v)} error={err('proceedIntent')} options={[['prepare_and_contact', 'Prepare my assessment and contact me'], ['advisor_first', "I'd like to speak with an advisor first"], ['email_list', 'Not yet, just keep me updated by email']] as const} />
            <Field label="How did you hear about HomeFi?" optional>
              {({ id }) => (
                <select id={id} className="input" value={a4.sourceChannel ?? ''} onChange={(e) => set(4, 'sourceChannel', e.target.value || undefined)}>
                  <option value="">Choose one</option>
                  {SOURCE_CHANNELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Anything else your advisor should know?" optional error={err('notes')} help={`${(a4.notes ?? '').length}/500`}>
              {({ id, describedBy }) => <textarea id={id} rows={3} maxLength={500} className="input" placeholder="e.g. I already have an offer letter from a developer" aria-describedby={describedBy} value={a4.notes ?? ''} onChange={(e) => set(4, 'notes', e.target.value)} />}
            </Field>
            <div>
              <label className="flex cursor-pointer gap-3 text-navy">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#0D2240]" checked={a4.consentProcessing === true} onChange={(e) => set(4, 'consentProcessing', e.target.checked ? true : undefined)} aria-invalid={!!err('consentProcessing')} />
                <span>
                  I confirm the information I have given is accurate to the best of my knowledge, and I agree that HomeFi can use these details to prepare my mortgage estimate and contact me about it, in line with the{' '}
                  <a href="/legal/privacy" target="_blank" className="font-semibold underline">Privacy Notice</a>.
                </span>
              </label>
              {err('consentProcessing') && <p className="field-error" role="alert">{err('consentProcessing')}</p>}
            </div>
          </>
        )}

        <div ref={turnstile.ref} />

        {/* Button pinned to the bottom on mobile */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {step > 1 && (
              <button type="button" onClick={back} className="btn-secondary !px-5">
                Back
              </button>
            )}
            <button type="submit" disabled={saving} className="btn-primary flex-1 sm:flex-none">
              {saving ? 'Saving…' : step === 4 ? 'Get Prequalified' : 'Continue'}
            </button>
          </div>
          {step === 4 && <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted sm:text-left">Free. No credit check. This does not affect your chances with any lender.</p>}
        </div>
        <p className="text-sm text-muted">Your answers are saved on this device as you go.</p>
      </form>
    </div>
  );
}

export type { Draft };
