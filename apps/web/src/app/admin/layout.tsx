import Link from 'next/link';
import { Logo } from '@/components/logo';
import { requireStaff } from '@/server/staff';

const NAV = [
  ['/admin', 'Overview'],
  ['/admin/applications', 'Applications'],
  ['/admin/reports', 'Reports'],
  ['/admin/advisors', 'Advisors'],
  ['/admin/reviews', 'Reviews'],
  ['/admin/rates', 'Rates and engine'],
  ['/admin/fx', 'FX rates'],
  ['/admin/payments', 'Payments'],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff(['ops', 'admin'], '/admin');
  return (
    <div className="min-h-dvh">
      <header className="bg-navy text-cream">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3"><Logo onNavy /><span className="rounded bg-gold px-2 py-0.5 text-xs font-bold text-navy uppercase">{me.role}</span></Link>
          <Link href="/app" className="text-sm hover:text-gold">Back to app</Link>
        </div>
        <nav aria-label="Admin" className="container-page flex gap-1 overflow-x-auto pb-2">
          {NAV.map(([h, l]) => <Link key={h} href={h} className="shrink-0 rounded-lg px-3 py-2 text-sm hover:bg-navy-700">{l}</Link>)}
        </nav>
      </header>
      <main id="main" className="container-page py-8">{children}</main>
    </div>
  );
}
