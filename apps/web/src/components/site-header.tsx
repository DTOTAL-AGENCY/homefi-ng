'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';

const LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/mortgage-options', label: 'Mortgage options' },
  { href: '/advisors', label: 'Advisors' },
  { href: '/diaspora', label: 'Diaspora' },
  { href: '/learn', label: 'Learn' },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-navy text-cream">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="HomeFi home">
          <Logo onNavy />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium hover:text-gold">
              {l.label}
            </Link>
          ))}
          <Link href={signedIn ? '/app' : '/signin'} className="text-sm font-medium hover:text-gold">
            {signedIn ? 'Dashboard' : 'Sign in'}
          </Link>
          <Link href="/prequalify" className="btn-primary !min-h-10 !py-2 text-sm">
            Get Prequalified
          </Link>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/prequalify" className="btn-primary !min-h-10 !px-4 !py-2 text-sm">
            Get Prequalified
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="fixed inset-x-0 top-16 bottom-0 z-50 bg-navy px-4 pt-6 lg:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-xl px-3 py-4 text-xl font-semibold hover:bg-navy-700">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={signedIn ? '/app' : '/signin'} className="block rounded-xl px-3 py-4 text-xl font-semibold hover:bg-navy-700">
                {signedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </li>
          </ul>
          <Link href="/prequalify" className="btn-primary mt-6 w-full">
            Get Prequalified
          </Link>
        </nav>
      )}
    </header>
  );
}
