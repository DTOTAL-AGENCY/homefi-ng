import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PrequalFlow } from './flow';

export const metadata: Metadata = {
  title: "Let's see what you can get",
  description: 'Answer a few quick questions and see your mortgage estimate in under 5 minutes. Free, no credit check.',
};

const UTM_TO_CHANNEL: Record<string, string> = {
  instagram: 'instagram', ig: 'instagram', x: 'x', twitter: 'x', whatsapp: 'whatsapp', google: 'google',
  facebook: 'facebook_tiktok', tiktok: 'facebook_tiktok', linkedin: 'linkedin',
};

export default async function PrequalifyPage() {
  let source: string | null = null;
  try {
    const utm = JSON.parse((await cookies()).get('hf_utm')?.value ?? 'null');
    source = UTM_TO_CHANNEL[String(utm?.utm_source ?? '').toLowerCase()] ?? null;
  } catch {}
  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <h1 className="sr-only">Let&apos;s see what you can get</h1>
      <p className="eyebrow">Let&apos;s see what you can get</p>
      <p className="mt-1 mb-6 text-sm text-muted">
        Answer a few quick questions. We only use your answers to prepare your mortgage estimate and report.
      </p>
      <PrequalFlow sourceFromUtm={source} />
    </div>
  );
}
