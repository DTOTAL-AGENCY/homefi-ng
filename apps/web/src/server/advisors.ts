import 'server-only';
import { rankAdvisors, type EngineOutput, type MatchApplication } from '@homefi/engine';
import { supabaseAdmin } from '@/lib/supabase/server';
import { approvedAdvisors, engineContext, type AdvisorCard } from './data';
import { nextSlot } from './sessions';

export interface AdvisorFilters {
  specialism?: string;
  state?: string;
  language?: string;
  availableWithinDays?: number;
  sort?: 'recommended' | 'rating' | 'processed' | 'soonest';
}

export type AdvisorWithSlot = AdvisorCard & { nextSlotAt: string | null; score?: number; recommended?: boolean };

export async function listAdvisors(filters: AdvisorFilters, userId?: string | null): Promise<AdvisorWithSlot[]> {
  const all = await approvedAdvisors();
  const withSlots: AdvisorWithSlot[] = await Promise.all(
    all.map(async (a) => ({ ...a, nextSlotAt: await nextSlot({ id: a.id, calEventTypeId: a.calEventTypeId }) })),
  );
  let list = withSlots.filter(
    (a) =>
      (!filters.specialism || a.specialisms.includes(filters.specialism)) &&
      (!filters.state || a.statesCovered.includes(filters.state)) &&
      (!filters.language || a.languages.includes(filters.language)) &&
      (!filters.availableWithinDays ||
        (a.nextSlotAt && new Date(a.nextSlotAt).getTime() - Date.now() <= filters.availableWithinDays * 86400_000)),
  );

  const app = userId ? await matchApplication(userId) : null;
  if (app) {
    const { matchWeights } = await engineContext();
    const ranked = rankAdvisors(
      app,
      list.map((a) => ({
        ...a,
        nextSlotAt: a.nextSlotAt ? new Date(a.nextSlotAt) : null,
        avgRating: a.stats.avgRating,
        approvalRate: a.stats.approvalRate,
      })),
      matchWeights,
    );
    const scores = new Map(ranked.map((r, i) => [r.id, { score: r.score, rank: i }]));
    list = list.map((a) => ({ ...a, score: scores.get(a.id)?.score, recommended: scores.get(a.id)?.rank === 0 }));
  }

  const sort = filters.sort ?? (app ? 'recommended' : 'rating');
  const soon = (a: AdvisorWithSlot) => (a.nextSlotAt ? new Date(a.nextSlotAt).getTime() : Infinity);
  list.sort((x, y) => {
    switch (sort) {
      case 'recommended':
        return (y.score ?? 0) - (x.score ?? 0) || soon(x) - soon(y);
      case 'processed':
        return y.stats.mortgagesDecided - x.stats.mortgagesDecided;
      case 'soonest':
        return soon(x) - soon(y);
      default:
        return (y.stats.avgRating ?? 0) - (x.stats.avgRating ?? 0) || y.stats.reviewCount - x.stats.reviewCount;
    }
  });
  return list;
}

/** The signed-in user's latest application, shaped for the match score. */
export async function matchApplication(userId: string, applicationId?: string | null): Promise<MatchApplication | null> {
  const sb = supabaseAdmin();
  let q = sb
    .from('applications')
    .select('id, residence, is_joint, non_interest_preference, preferred_states, estimate, applicants(income_source)')
    .eq('user_id', userId)
    .not('status', 'in', '(draft,abandoned)')
    .order('submitted_at', { ascending: false })
    .limit(1);
  if (applicationId) q = q.eq('id', applicationId);
  const { data } = await q.maybeSingle();
  if (!data) return null;
  const e = data.estimate as unknown as EngineOutput | null;
  return {
    residence: (data.residence ?? 'nigeria') as 'nigeria' | 'diaspora',
    incomeSources: ((data.applicants as unknown as Array<{ income_source: string }>) ?? []).map((a) => a.income_source),
    isJoint: data.is_joint,
    nonInterestPreference: (data.non_interest_preference ?? 'no') as 'yes' | 'no' | 'open',
    headlineProduct: e?.headline?.productCode ?? null,
    preferredStates: data.preferred_states ?? [],
  };
}
