import Link from 'next/link';
import { LANGUAGE_LABELS, SPECIALISM_LABELS } from '@/content/site';
import type { AdvisorCard } from '@/server/data';

/** A track record is shown only after 5 decided cases; never 0% or 100% on small numbers. */
export const NEW_ADVISOR_THRESHOLD = 5;

export function AdvisorAvatar({ advisor, size = 64 }: { advisor: Pick<AdvisorCard, 'photoUrl' | 'displayName'>; size?: number }) {
  const initials = advisor.displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return advisor.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={advisor.photoUrl} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="inline-flex items-center justify-center rounded-full bg-sapphire font-bold text-cream"
      style={{ width: size, height: size, fontSize: size / 2.6 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function TrackRecordLine({ advisor }: { advisor: AdvisorCard }) {
  const s = advisor.stats;
  if (s.mortgagesDecided < NEW_ADVISOR_THRESHOLD) return <span>New to HomeFi</span>;
  return (
    <span className="num">
      {s.mortgagesDecided} mortgages processed · {s.approvalRate}% approval rate
    </span>
  );
}

export function AdvisorCardView({
  advisor,
  compact = false,
  recommended = false,
  nextSlot,
}: {
  advisor: AdvisorCard;
  compact?: boolean;
  recommended?: boolean;
  nextSlot?: React.ReactNode;
}) {
  const s = advisor.stats;
  return (
    <article className="card flex h-full flex-col">
      {recommended && (
        <p className="mb-3 self-start rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold-700">Recommended for you</p>
      )}
      <div className="flex items-center gap-4">
        <AdvisorAvatar advisor={advisor} />
        <div>
          <h3 className="text-lg font-bold text-navy">{advisor.displayName}</h3>
          <p className="text-sm text-muted">{advisor.headline}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Specialisms">
        {advisor.specialisms.map((sp) => (
          <li key={sp} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-navy">
            {SPECIALISM_LABELS[sp] ?? sp}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-navy">
        <TrackRecordLine advisor={advisor} />
      </p>
      <p className="num mt-1 text-sm text-navy">
        {s.reviewCount > 0 ? (
          <>
            <span className="text-gold-700">★</span> {s.avgRating?.toFixed(1)} ({s.reviewCount} verified reviews)
          </>
        ) : (
          <span className="text-muted">No reviews yet</span>
        )}
      </p>
      {!compact && (
        <>
          <p className="mt-1 text-sm text-muted">Speaks: {advisor.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(', ')}</p>
          {nextSlot !== undefined && (
            <p className="mt-1 text-sm text-navy">Next available: {nextSlot}</p>
          )}
          <p className="num mt-1 text-sm font-semibold text-navy">Session: USD {advisor.priceUsdCents / 100} · 30 minutes</p>
        </>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={`/app/book/${advisor.slug}`} className="btn-primary !min-h-11 !px-5 text-sm">
          Book session
        </Link>
        <Link href={`/advisors/${advisor.slug}`} className="btn-secondary !min-h-11 !px-5 text-sm">
          View profile
        </Link>
      </div>
    </article>
  );
}
