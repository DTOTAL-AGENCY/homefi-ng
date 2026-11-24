import Link from 'next/link';
import { Logo } from '@/components/logo';
import { requireStaff } from '@/server/staff';

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  await requireStaff(['advisor', 'admin'], '/advisor');
  return (
    <div className="min-h-dvh">
      <header className="bg-navy text-cream">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/advisor"><Logo onNavy /></Link>
          <nav className="flex gap-4 text-sm"><Link href="/advisor">Schedule</Link><Link href="/advisor/profile">Profile</Link><Link href="/app">App</Link></nav>
        </div>
      </header>
      <main id="main" className="container-page py-8">{children}</main>
    </div>
  );
}
