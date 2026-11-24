import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center py-16 text-center">
      <Logo />
      <h1 className="h-display mt-8 text-4xl text-navy">This page has moved or doesn&apos;t exist.</h1>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-secondary">Go home</Link>
        <Link href="/prequalify" className="btn-primary">Get Prequalified</Link>
      </div>
    </main>
  );
}
