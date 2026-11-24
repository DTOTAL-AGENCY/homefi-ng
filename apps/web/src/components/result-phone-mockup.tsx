/** Hero visual: a phone showing a result card. Swap in real photography of Nigerian homes when available. */
export function ResultPhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xs" aria-hidden="true">
      <div className="rounded-[2.5rem] border-8 border-navy-700 bg-cream p-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-navy/20" />
        <p className="text-xs font-semibold text-muted">Your estimate</p>
        <p className="mt-1 font-display text-2xl font-bold text-navy">Tolu, you could access up to</p>
        <p className="num mt-1 text-3xl font-extrabold text-navy">₦34.6m</p>
        <div className="mt-4 rounded-xl border border-line bg-white p-3">
          <p className="text-xs font-bold text-navy">FG concessionary mortgages</p>
          <p className="text-[11px] text-muted">Lowest rates · Longer to process</p>
          <div className="num mt-2 flex justify-between text-xs">
            <span>NHF · 6% a year</span>
            <span className="font-bold">₦34.6m</span>
          </div>
          <div className="num mt-1 flex justify-between text-xs">
            <span>MREIF · 9.75% a year</span>
            <span className="font-bold">₦26.1m</span>
          </div>
        </div>
        <div className="mt-2 rounded-xl border border-line bg-white p-3">
          <p className="text-xs font-bold text-navy">Commercial mortgages</p>
          <p className="num mt-1 text-xs">₦10.9m to ₦13.9m</p>
        </div>
        <div className="mt-4 rounded-full bg-gold py-2 text-center text-xs font-bold text-navy">Yes, send my report</div>
      </div>
    </div>
  );
}
