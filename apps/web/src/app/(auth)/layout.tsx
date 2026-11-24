import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="bg-navy">
        <div className="container-page flex h-16 items-center">
          <Link href="/" aria-label="HomeFi home"><Logo onNavy /></Link>
        </div>
      </header>
      <main id="main" className="container-page max-w-md py-10">{children}</main>
    </div>
  );
}
