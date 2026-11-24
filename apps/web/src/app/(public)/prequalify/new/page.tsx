'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** "Start a new estimate": clears this device's draft and opens step 1. */
export default function NewEstimate() {
  const router = useRouter();
  useEffect(() => {
    try {
      localStorage.removeItem('hf_prequal_v1');
    } catch {}
    router.replace('/prequalify');
  }, [router]);
  return <p className="container-page py-16 text-center text-muted">Starting a new estimate…</p>;
}
