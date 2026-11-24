import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignUpForm } from '../auth-forms';

export const metadata: Metadata = { title: 'Create your account', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
