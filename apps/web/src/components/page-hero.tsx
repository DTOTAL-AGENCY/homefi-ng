export function PageHero({ title, intro, eyebrow }: { title: string; intro?: string; eyebrow?: string }) {
  return (
    <section className="bg-navy text-cream">
      <div className="container-page py-12 md:py-16">
        {eyebrow && <p className="text-sm font-semibold tracking-wide text-gold uppercase">{eyebrow}</p>}
        <h1 className="h-display mt-2 max-w-3xl text-4xl sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-cream/85">{intro}</p>}
      </div>
    </section>
  );
}
