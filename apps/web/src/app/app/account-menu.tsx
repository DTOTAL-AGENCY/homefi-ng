'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="relative">
      <button
        className="flex h-11 items-center gap-2 rounded-full px-2"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold font-bold text-navy">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-white text-navy shadow-lg">
          <Link role="menuitem" href="/app/settings" className="block px-4 py-3 hover:bg-cream" onClick={() => setOpen(false)}>Settings</Link>
          <button
            role="menuitem"
            className="block w-full px-4 py-3 text-left hover:bg-cream"
            onClick={async () => {
              await supabaseBrowser().auth.signOut();
              router.push('/');
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
