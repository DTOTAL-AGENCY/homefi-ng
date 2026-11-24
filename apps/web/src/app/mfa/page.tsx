import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { MfaForm } from './mfa-form';

export const metadata = { title: 'Two-factor authentication', robots: { index: false } };

export default function MfaPage() {
  return (
    <main className="container-page max-w-md py-12">
      <Logo />
      <h1 className="h-display mt-8 text-3xl text-navy">Two-factor authentication</h1>
      <p className="mt-2 text-muted">Advisor, ops and admin accounts need an authenticator app code.</p>
      <Suspense><MfaForm /></Suspense>
    </main>
  );
}
