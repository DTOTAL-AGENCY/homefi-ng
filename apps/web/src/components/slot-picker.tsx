'use client';

import { useEffect, useMemo, useState } from 'react';

interface Slot {
  start: string;
}

function useSlots(slug: string) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch(`/api/v1/advisors/${slug}/slots`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((b) => setSlots(b.slots))
      .catch(() => setError(true));
  }, [slug]);
  return { slots, error };
}

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const dayKey = (iso: string, zone: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: zone });
const dayLabel = (iso: string, zone: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: zone });
const time = (iso: string, zone: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: zone });

/** Next 14 days of open slots in the viewer's time zone, with WAT alongside. */
export function SlotPicker({ slug, value, onChange, firstName }: { slug: string; value: string | null; onChange: (iso: string) => void; firstName?: string }) {
  const { slots, error } = useSlots(slug);
  const zone = useMemo(tz, []);
  const days = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const k = dayKey(s.start, zone);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()];
  }, [slots, zone]);
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    if (!day && days[0]) setDay(days[0][0]);
  }, [days, day]);

  if (error) return <p className="text-danger">We couldn&apos;t load times. Please refresh the page.</p>;
  if (!slots) return <p className="text-muted" role="status">Loading times…</p>;
  if (!slots.length) return <p className="text-navy">{firstName ?? 'This advisor'} is fully booked for the next 14 days.</p>;
  const current = days.find(([k]) => k === day)?.[1] ?? [];
  return (
    <div>
      <p className="text-sm text-muted">Times are shown in your time zone ({zone}).{zone !== 'Africa/Lagos' && ' WAT is shown alongside.'}</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Days">
        {days.map(([k, list]) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === day}
            onClick={() => setDay(k)}
            className={`shrink-0 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${k === day ? 'border-navy bg-navy text-cream' : 'border-line bg-white text-navy'}`}
          >
            {dayLabel(list[0]!.start, zone)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Times">
        {current.map((s) => (
          <button
            key={s.start}
            role="radio"
            aria-checked={value === s.start}
            onClick={() => onChange(s.start)}
            className={`num min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-semibold ${value === s.start ? 'border-navy bg-gold text-navy' : 'border-line bg-white text-navy hover:border-navy/50'}`}
          >
            {time(s.start, zone)}
            {zone !== 'Africa/Lagos' && <span className="block text-xs font-normal text-muted">{time(s.start, 'Africa/Lagos')} WAT</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SlotPreview({ slug }: { slug: string }) {
  const { slots, error } = useSlots(slug);
  const zone = useMemo(tz, []);
  if (error) return null;
  if (!slots) return <p className="mt-2 text-sm text-muted">Loading times…</p>;
  if (!slots.length) return <p className="mt-2 text-sm text-navy">Fully booked for the next 14 days.</p>;
  return (
    <ul className="num mt-2 space-y-1 text-sm text-navy">
      {slots.slice(0, 5).map((s) => (
        <li key={s.start}>
          {dayLabel(s.start, zone)}, {time(s.start, zone)}
          {zone !== 'Africa/Lagos' && <span className="text-muted"> · {time(s.start, 'Africa/Lagos')} WAT</span>}
        </li>
      ))}
    </ul>
  );
}
