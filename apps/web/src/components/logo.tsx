/**
 * "The Roofspan" mark: placeholder drawing until the brand SVG is dropped into
 * /public/brand. White and gold on navy; navy on cream elsewhere.
 */
export function RoofspanMark({ onNavy = false, className = 'h-8 w-8' }: { onNavy?: boolean; className?: string }) {
  const roof = onNavy ? '#F7F4EE' : '#0D2240';
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M4 24 L24 7 L44 24" fill="none" stroke={roof} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22 V40 H36 V22" fill="none" stroke={roof} strokeWidth="4" strokeLinejoin="round" />
      <path d="M20 40 V30 a4 4 0 0 1 8 0 V40" fill="#E8A020" />
    </svg>
  );
}

export function Logo({ onNavy = false }: { onNavy?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <RoofspanMark onNavy={onNavy} />
      <span className={`font-display text-2xl font-bold ${onNavy ? 'text-cream' : 'text-navy'}`}>
        Home<span className="text-gold">Fi</span>
      </span>
    </span>
  );
}
