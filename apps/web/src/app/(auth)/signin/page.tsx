import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignInForm } from '../auth-forms';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
