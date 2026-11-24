import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/logo';
import { currentProfile } from '@/lib/supabase/server';
import { AccountMenu } from './account-menu';

const NAV = [
  ['/app', 'Dashboard'],
  ['/app/reports', 'Reports'],
  ['/app/advisors', 'Advisors'],
  ['/app/sessions', 'Sessions'],
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await currentProfile();
  if (!profile) redirect('/signin?next=/app');
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 bg-navy text-cream">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/app" aria-label="HomeFi dashboard"><Logo onNavy /></Link>
          <nav aria-label="Account" className="hidden items-center gap-6 md:flex">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="text-sm font-medium hover:text-gold">{label}</Link>
            ))}
            {['advisor', 'admin', 'ops'].includes(profile.role) && (
              <Link href={profile.role === 'advisor' ? '/advisor' : '/admin'} className="text-sm font-medium text-gold">
                {profile.role === 'advisor' ? 'Advisor portal' : 'Admin'}
              </Link>
            )}
          </nav>
          <AccountMenu name={profile.first_name || 'Account'} />
        </div>
        <nav aria-label="Account sections" className="flex gap-1 overflow-x-auto border-t border-cream/10 px-2 md:hidden">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="shrink-0 px-3 py-3 text-sm font-medium">{label}</Link>
          ))}
        </nav>
      </header>
      <main id="main" className="container-page py-8">{children}</main>
    </div>
  );
}
