/**
 * Advisor match score for "Recommended for you" (out of 100 with default weights):
 * specialism fit 40, state covered 20, language 10, availability within 3 days 15,
 * average rating 10, approval rate 5 (0 for new advisors). Ties break on soonest slot.
 */
export interface MatchWeights {
  specialism: number;
  state: number;
  language: number;
  availability: number;
  rating: number;
  approval: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  specialism: 40,
  state: 20,
  language: 10,
  availability: 15,
  rating: 10,
  approval: 5,
};

export interface MatchApplication {
  residence: 'nigeria' | 'diaspora';
  incomeSources: string[];
  isJoint: boolean;
  nonInterestPreference: 'yes' | 'no' | 'open';
  headlineProduct: string | null;
  preferredStates: string[];
  languages?: string[];
  firstTimeBuyer?: boolean;
}

export interface MatchAdvisor {
  id: string;
  specialisms: string[];
  statesCovered: string[];
  languages: string[];
  nextSlotAt: Date | null;
  avgRating: number | null;
  approvalRate: number | null;
}

/** The specialisms an application calls for */
export function wantedSpecialisms(app: MatchApplication): string[] {
  const want = new Set<string>();
  if (app.residence === 'diaspora') want.add('diaspora');
  if (app.incomeSources.some((s) => s === 'self_employed' || s === 'mixed')) want.add('self_employed');
  if (app.isJoint) want.add('joint');
  if (app.nonInterestPreference === 'yes') want.add('non_interest');
  if (app.headlineProduct === 'NHF' || app.headlineProduct === 'NHF_DIASPORA') want.add('nhf');
  if (app.headlineProduct === 'MREIF') want.add('mreif');
  if (app.firstTimeBuyer !== false) want.add('first_time');
  return [...want];
}

export function matchScore(
  app: MatchApplication,
  adv: MatchAdvisor,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
  now: Date = new Date(),
): number {
  const want = wantedSpecialisms(app);
  const hit = want.filter((s) => adv.specialisms.includes(s)).length;
  const specialism = want.length ? (hit / want.length) * weights.specialism : weights.specialism / 2;

  const state =
    app.preferredStates.length && app.preferredStates.some((s) => adv.statesCovered.includes(s))
      ? weights.state
      : 0;

  const langs = app.languages?.length ? app.languages : ['en'];
  const language = langs.some((l) => adv.languages.includes(l)) ? weights.language : 0;

  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const availability =
    adv.nextSlotAt && adv.nextSlotAt.getTime() - now.getTime() <= threeDays ? weights.availability : 0;

  const rating = adv.avgRating ? (adv.avgRating / 5) * weights.rating : 0;
  const approval = adv.approvalRate !== null ? (adv.approvalRate / 100) * weights.approval : 0;

  return Math.round((specialism + state + language + availability + rating + approval) * 10) / 10;
}

export function rankAdvisors<T extends MatchAdvisor>(
  app: MatchApplication,
  advisors: T[],
  weights?: MatchWeights,
  now?: Date,
): Array<T & { score: number }> {
  return advisors
    .map((a) => ({ ...a, score: matchScore(app, a, weights, now) }))
    .sort(
      (x, y) =>
        y.score - x.score ||
        (x.nextSlotAt?.getTime() ?? Infinity) - (y.nextSlotAt?.getTime() ?? Infinity),
    );
}
