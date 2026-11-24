'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/** Mobile bottom bar on Home, Mortgage options and Diaspora, shown after the first scroll. */
export function StickyStartBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-navy">See how much you can get in 5 minutes</p>
        <Link href="/prequalify" className="btn-primary !min-h-11 shrink-0 !px-5">
          Start
        </Link>
      </div>
    </div>
  );
}
