import 'server-only';
import { cache } from 'react';
import {
  fxFromRows,
  productFromRow,
  productsFromSnapshot,
  settingsFromRow,
  type EngineSettingsRow,
} from '@homefi/db';
import { DEFAULT_MATCH_WEIGHTS, type MatchWeights } from '@homefi/engine';
import { supabaseAdmin } from '@/lib/supabase/server';

/** The engine version in force, with the rates frozen into it, and the latest FX. */
export const engineContext = cache(async () => {
  const sb = supabaseAdmin();
  const [{ data: s, error }, { data: fx }] = await Promise.all([
    sb.from('engine_settings').select('*').eq('is_current', true).single(),
    sb.from('fx_rates').select('*').order('fetched_at', { ascending: false }).limit(200),
  ]);
  if (error || !s) throw new Error('No current engine version');
  const row = s as unknown as EngineSettingsRow;
  return {
    settings: settingsFromRow(row),
    products: productsFromSnapshot(row.rates_snapshot),
    fx: fxFromRows(fx ?? []),
    matchWeights: { ...DEFAULT_MATCH_WEIGHTS, ...((row.match_weights as Partial<MatchWeights>) ?? {}) },
  };
});

export const rateProducts = cache(async () => {
  const { data } = await supabaseAdmin().from('rate_products').select('*').order('code');
  return (data ?? []).map(productFromRow);
});

/** Only verifiable claims: counted from the database. */
export const prequalifiedCount = cache(async () => {
  const { count } = await supabaseAdmin()
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .not('status', 'in', '(draft,abandoned)');
  return count ?? 0;
});

export interface AdvisorCard {
  id: string;
  slug: string;
  displayName: string;
  headline: string;
  bioShort: string;
  bioLong: string | null;
  photoUrl: string | null;
  specialisms: string[];
  languages: string[];
  statesCovered: string[];
  yearsExperience: number | null;
  credentials: Array<{ name: string; verified_at?: string }>;
  priceUsdCents: number;
  priceNgnKobo: number | null;
  calEventTypeId: number | null;
  calUsername: string | null;
  stats: {
    sessionsCompleted: number;
    mortgagesDecided: number;
    mortgagesApproved: number;
    approvalRate: number | null;
    avgRating: number | null;
    reviewCount: number;
  };
}

type AdvisorRow = {
  id: string; slug: string; display_name: string; headline: string; bio_short: string; bio_long: string | null;
  photo_url: string | null; specialisms: string[]; languages: string[]; states_covered: string[];
  years_experience: number | null; credentials: unknown; price_usd_cents: number; price_ngn_kobo: number | null;
  cal_event_type_id: number | null; cal_username: string | null;
};

function toCard(a: AdvisorRow, s?: Record<string, unknown>): AdvisorCard {
  return {
    id: a.id,
    slug: a.slug,
    displayName: a.display_name,
    headline: a.headline,
    bioShort: a.bio_short,
    bioLong: a.bio_long,
    photoUrl: a.photo_url,
    specialisms: a.specialisms,
    languages: a.languages,
    statesCovered: a.states_covered,
    yearsExperience: a.years_experience,
    credentials: (a.credentials as AdvisorCard['credentials']) ?? [],
    priceUsdCents: a.price_usd_cents,
    priceNgnKobo: a.price_ngn_kobo,
    calEventTypeId: a.cal_event_type_id,
    calUsername: a.cal_username,
    stats: {
      sessionsCompleted: Number(s?.sessions_completed ?? 0),
      mortgagesDecided: Number(s?.mortgages_decided ?? 0),
      mortgagesApproved: Number(s?.mortgages_approved ?? 0),
      approvalRate: s?.approval_rate == null ? null : Number(s.approval_rate),
      avgRating: s?.avg_rating == null ? null : Number(s.avg_rating),
      reviewCount: Number(s?.review_count ?? 0),
    },
  };
}

export const approvedAdvisors = cache(async (): Promise<AdvisorCard[]> => {
  const sb = supabaseAdmin();
  const [{ data: rows }, { data: stats }] = await Promise.all([
    sb.from('advisors').select('*').eq('status', 'approved').order('display_name'),
    sb.from('advisor_stats').select('*'),
  ]);
  const byId = new Map((stats ?? []).map((s) => [s.advisor_id as string, s as Record<string, unknown>]));
  return (rows ?? []).map((a) => toCard(a as AdvisorRow, byId.get(a.id)));
});

export const advisorBySlug = cache(async (slug: string) => {
  const all = await approvedAdvisors();
  return all.find((a) => a.slug === slug) ?? null;
});

export const publishedReviews = cache(async (advisorId?: string) => {
  let q = supabaseAdmin()
    .from('reviews')
    .select('id, rating, title, body, published_at, advisor_id, user_id, profiles(first_name, last_name), advisory_sessions(application_id, applications(residence_state, residence_country))')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);
  if (advisorId) q = q.eq('advisor_id', advisorId);
  const { data } = await q;
  return (data ?? []).map((r) => {
    const p = r.profiles as unknown as { first_name: string; last_name: string } | null;
    const app = (r.advisory_sessions as unknown as { applications: { residence_state: string | null; residence_country: string | null } | null } | null)?.applications;
    return {
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      publishedAt: r.published_at,
      advisorId: r.advisor_id,
      reviewer: p ? `${p.first_name} ${p.last_name.charAt(0)}.` : 'Verified applicant',
      location: app?.residence_state ?? app?.residence_country ?? null,
    };
  });
});
