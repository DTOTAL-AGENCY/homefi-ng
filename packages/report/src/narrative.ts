import { z } from 'zod';
import { PRODUCT_LABELS, type EngineOutput } from '@homefi/engine';

/** What Claude writes. Words only: every figure in the report comes from the engine. */
export const NarrativeSchema = z.object({
  profile_summary: z.string().min(20).max(700),
  insight: z.string().min(20).max(600),
  recommended_path: z.string().min(20).max(900),
  next_steps: z.array(z.string().min(5).max(240)).min(3).max(6),
  notes: z.array(z.string().min(5).max(300)).max(5),
});
export type Narrative = z.infer<typeof NarrativeSchema>;

export const PROMPT_VERSION = 'narrative-2026-11-v1';

/** Facts sent to the model. No names, phone numbers or emails (brief: never send them). */
export interface NarrativeFacts {
  residence: string;
  incomeSources: string[];
  isJoint: boolean;
  ageBand: string;
  propertyType: string | null;
  intendedUse: string | null;
  preferredStates: string[];
  timeline: string | null;
  propertyStatus: string | null;
  nonInterestPreference: string | null;
  nhfContributor: string | null;
  hasRsa: string | null;
  rsaEquityUse: string | null;
  financialReadiness: string | null;
  proceedIntent: string | null;
  propertyFeatures: string[];
  headlineProduct: string | null;
  eligibleProducts: string[];
  variants: string[];
  insightRule: string;
  feeWording: string;
  rateWord: string;
}

export const SYSTEM_PROMPT = `You write the narrative sections of HomeFi's Mortgage Prequalification Report for applicants in Nigeria and the diaspora.

Voice: a knowledgeable friend who works in mortgages. Warm, direct, specific. Second person for the applicant ("you"), first person plural for HomeFi ("we"). Plain words: say "deposit (equity)" and "monthly repayment"; never use LTV, DTI or amortisation.

Hard rules:
- Do not write any amounts, rates, percentages, ages or years. The report template inserts every figure next to your text, and a number you write may contradict it. Name products instead (NHF, NHF Diaspora, MREIF, commercial mortgages, non-interest finance).
- It is an estimate, not an approval. Never say "approved", "guaranteed", "instant approval" or "100%".
- Only recommend products listed as eligible.
- If you mention HomeFi's processing fee, copy the fee wording you are given exactly and never convert it to Naira.
- No Pidgin or jokes; this is about money.
- next_steps: 3 to 6 short imperative steps, the first being to book the 1-on-1 Mortgage Advisory Session.
- notes: up to 5 short caveats specific to this applicant (for example NHF registration, residency, self-employed statements, exchange-rate movement).`;

export function userPrompt(f: NarrativeFacts): string {
  return `Applicant facts (JSON):\n${JSON.stringify(f, null, 2)}\n\nWrite profile_summary (2 to 3 sentences describing the applicant's situation and goal), insight (1 to 3 sentences on what the options mean for them, consistent with insightRule), recommended_path (a short paragraph), next_steps and notes.`;
}

/** Reject narrative that introduces figures or forbidden claims. */
export function narrativeProblems(n: Narrative, eligible: string[]): string[] {
  const all = [n.profile_summary, n.insight, n.recommended_path, ...n.next_steps, ...n.notes].join(' ');
  const problems: string[] = [];
  if (/₦|NGN|\bN\d|%|\d/.test(all.replace(/1-on-1/gi, ''))) problems.push('contains figures');
  if (/\b(approved|guaranteed|instant approval)\b/i.test(all)) problems.push('forbidden claim');
  const named = ['NHF Diaspora', 'NHF', 'MREIF', 'non-interest', 'commercial'];
  const map: Record<string, string> = { NHF: 'NHF', 'NHF Diaspora': 'NHF_DIASPORA', MREIF: 'MREIF', commercial: 'COMMERCIAL', 'non-interest': 'NON_INTEREST' };
  for (const name of named) {
    const code = map[name]!;
    const mentioned = new RegExp(`\\b${name}\\b`, 'i').test(name === 'NHF' ? all.replace(/NHF Diaspora/gi, '') : all);
    if (mentioned && !eligible.includes(code) && !(name === 'NHF' && eligible.includes('NHF_DIASPORA'))) {
      problems.push(`mentions ineligible ${name}`);
    }
  }
  return problems;
}

const SOURCE_WORDS: Record<string, string> = {
  salaried_public: 'a government salary',
  salaried_private: 'a private-sector salary',
  self_employed: 'business income',
  mixed: 'salary and business income',
  part_time_contract: 'part-time or contract income',
  pension: 'a pension',
  investment: 'investment income',
  other: 'your income',
};

/** Rule-based wording used when the AI call fails or its output is rejected. */
export function fallbackNarrative(f: NarrativeFacts, e: EngineOutput): Narrative {
  const head = f.headlineProduct ? PRODUCT_LABELS[f.headlineProduct] : null;
  const who = f.isJoint ? 'You are applying jointly with your spouse or partner' : 'You are applying on your own';
  const income = f.incomeSources.map((s) => SOURCE_WORDS[s] ?? 'your income').join(' and ');
  const where = f.preferredStates.length ? ` in ${f.preferredStates.join(', ')}` : '';
  const steps = [
    'Book your 1-on-1 Mortgage Advisory Session to walk through this report with an advisor.',
    'Gather your ID, your latest payslips or business statements, and six months of bank statements.',
    'Decide how you will fund your deposit (equity), including whether to use part of your RSA.',
  ];
  if (f.propertyStatus !== 'found') steps.push('Tell your advisor your budget and preferred area so we can search for and verify suitable properties.');
  const notes: string[] = [];
  if (f.variants.includes('nhf_not_contributor')) notes.push('You will need to register and contribute to the NHF before applying for it.');
  if (f.residence !== 'Nigeria' && !f.residence.endsWith(', Nigeria')) notes.push('Your foreign income was converted at a weaker exchange rate than today’s, so the estimate allows for movement in the Naira.');
  if (f.incomeSources.some((s) => s === 'self_employed' || s === 'mixed')) notes.push('Lenders will look at your business statements instead of payslips. Your advisor will tell you which to prepare.');
  if (f.variants.includes('non_nigerian')) notes.push('Eligibility depends on your residency status. Your advisor will confirm.');
  return {
    profile_summary: `${who}, with ${income}, and would like a ${f.propertyType ? f.propertyType.replace('_', '-') : 'home'}${where}. We assessed what you could access across concessionary and commercial mortgage options.`,
    insight: e.insight,
    recommended_path: head
      ? `Based on what you told us, ${head} gives you the most for your money. Your advisor will confirm your eligibility, refine these figures with your exact income, and tell you which lender to approach first.`
      : 'Based on what you told us, a mortgage on your income alone would be small. Your advisor can show you how a joint application, a bigger deposit or a rent-to-own plan could change that.',
    next_steps: steps,
    notes,
  };
}
