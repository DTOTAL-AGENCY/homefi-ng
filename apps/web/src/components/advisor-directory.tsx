import Link from 'next/link';
import { NIGERIAN_STATES } from '@homefi/engine';
import { AdvisorCardView } from '@/components/advisor-card';
import { LANGUAGE_LABELS, SPECIALISM_LABELS } from '@/content/site';
import type { AdvisorWithSlot } from '@/server/advisors';
import { NextSlotLabel } from './next-slot-label';

export function AdvisorDirectory({ advisors, params, basePath, signedIn }: { advisors: AdvisorWithSlot[]; params: Record<string, string | undefined>; basePath: string; signedIn: boolean }) {
  const sel = (name: string, label: string, options: Array<[string, string]>) => (
    <label className="block">
      <span className="field-label text-sm">{label}</span>
      <select name={name} defaultValue={params[name] ?? ''} className="input !min-h-10 !py-2 text-sm">
        <option value="">Any</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
  return (
    <>
      <form method="get" action={basePath} className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        {sel('specialism', 'Specialism', Object.entries(SPECIALISM_LABELS))}
        {sel('state', 'Location covered', NIGERIAN_STATES.map((s) => [s, s]))}
        {sel('language', 'Language', Object.entries(LANGUAGE_LABELS))}
        {sel('sort', 'Sort', [
          ...(signedIn ? ([['recommended', 'Recommended for you']] as Array<[string, string]>) : []),
          ['rating', 'Highest rated'],
          ['processed', 'Most mortgages processed'],
          ['soonest', 'Soonest available'],
        ])}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" name="availableWithinDays" value="7" defaultChecked={params.availableWithinDays === '7'} className="h-5 w-5 accent-[#0D2240]" />
            Available this week
          </label>
          <button className="btn-secondary !min-h-10 !py-2 text-sm">Apply</button>
        </div>
      </form>
      {advisors.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-navy">No advisor matches all your filters right now.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href={basePath} className="btn-secondary">Clear filters</Link>
            <Link href={basePath} className="btn-primary">See all advisors</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {advisors.map((a) => (
            <AdvisorCardView key={a.id} advisor={a} recommended={!!a.recommended} nextSlot={<NextSlotLabel iso={a.nextSlotAt} />} />
          ))}
        </div>
      )}
    </>
  );
}
