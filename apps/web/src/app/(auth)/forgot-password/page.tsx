import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ForgotForm } from '../auth-forms';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
