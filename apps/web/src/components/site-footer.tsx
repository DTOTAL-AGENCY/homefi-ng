import Link from 'next/link';
import { SITE } from '@/lib/config';
import { Logo } from './logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      ['/prequalify', 'Prequalify'],
      ['/mortgage-options', 'Mortgage options'],
      ['/advisors', 'Advisors'],
      ['/pricing', 'Pricing'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['/about', 'About'],
      ['/contact', 'Contact'],
      ['/careers', 'Careers'],
    ],
  },
  {
    title: 'Learn',
    links: [
      ['/learn', 'Mortgage na wetin?'],
      ['/faq', 'FAQ'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['/legal/privacy', 'Privacy'],
      ['/legal/terms', 'Terms'],
      ['/legal/disclaimer', 'Disclaimer'],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-navy pb-24 text-cream lg:pb-0">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div>
          <Logo onNavy />
          <p className="mt-3 max-w-xs text-sm text-cream/80">Own your home. Financed simply.</p>
          <div className="mt-4 flex gap-4 text-sm">
            <a href={SITE.instagram} className="hover:text-gold" rel="noopener">Instagram @homefi_ng</a>
            <a href={SITE.x} className="hover:text-gold" rel="noopener">X @HomeFi_Ng</a>
          </div>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h2 className="text-sm font-semibold tracking-wide text-gold uppercase">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-cream/90 hover:text-gold">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-cream/15">
        <p className="container-page py-5 text-xs text-cream/75">
          {SITE.company} · {SITE.rc} · {SITE.city} · {SITE.supportEmail}
        </p>
      </div>
    </footer>
  );
}
