import { describe, expect, it } from 'vitest';
import { runEngine, DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '@homefi/engine';
import { step1Schema, toEngineInput, toRows, validateComplete, type Draft } from './prequal';

const draftA: Draft = {
  1: {
    firstName: 'David', lastName: 'Oloruntobi', age: 35, nationality: 'NG', residence: 'nigeria',
    residenceState: 'Lagos', phone: '0801 234 5678', maritalStatus: 'married', isJoint: false,
  },
  2: { incomeSource: 'salaried_private', incomeCurrency: 'NGN', monthlyIncome: 1_000_000, existingObligations: 0, nhfContributor: 'yes', hasRsa: 'yes', equityAvailable: 0 },
  3: { propertyType: 'terrace', propertyFeatures: ['fence'], intendedUse: 'live', preferredStates: ['Lagos'], targetBand: '30to50m', propertyStatus: 'searching', timeline: '6to12m' },
  4: { costsAcknowledged: 'understood', rsaEquityUse: 'explore', financialReadiness: 'ready', proceedIntent: 'prepare_and_contact', nonInterestPreference: 'no', consentProcessing: true },
};

describe('prequal form', () => {
  it('a complete Applicant A draft produces fixture A', () => {
    const v = validateComplete(draftA);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const out = runEngine(toEngineInput(v.data), DEFAULT_SETTINGS, DEFAULT_PRODUCTS);
    expect(out.headline?.display).toBe('₦34,610,000');
    const rows = toRows(v.data);
    expect(rows.applicants[0]!.phone_e164).toBe('+2348012345678');
    expect(rows.application.target_value_min_kobo).toBe(3_000_000_000);
  });

  it('uses the brief error copy', () => {
    const r = step1Schema.safeParse({ ...draftA[1], age: 70 });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.message).toBe('You need to be between 18 and 65 to apply.');
    const p = step1Schema.safeParse({ ...draftA[1], phone: '123' });
    expect(p.error!.issues.some((i) => i.message.startsWith('Please check your phone number'))).toBe(true);
  });

  it('joint requires co-applicant income', () => {
    const v = validateComplete({ ...draftA, 1: { ...draftA[1], isJoint: true } });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.step).toBe(2);
  });

  it('RSA holders must answer the equity question', () => {
    const v = validateComplete({ ...draftA, 4: { ...draftA[4], rsaEquityUse: undefined } });
    expect(v.ok).toBe(false);
  });

  it('diaspora needs a country, not a state', () => {
    const r = step1Schema.safeParse({ ...draftA[1], residence: 'diaspora', residenceState: undefined, phone: '+44 7700 900123' });
    expect(r.success).toBe(false);
    const ok = step1Schema.safeParse({ ...draftA[1], residence: 'diaspora', residenceCountry: 'GB', phone: '+44 7400 123456' });
    expect(ok.success).toBe(true);
  });
});
