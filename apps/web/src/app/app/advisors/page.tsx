import type { Metadata } from 'next';
import { AdvisorDirectory } from '@/components/advisor-directory';
import { currentProfile } from '@/lib/supabase/server';
import { listAdvisors, type AdvisorFilters } from '@/server/advisors';

export const metadata: Metadata = { title: 'Choose your advisor', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AppAdvisors({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const me = (await currentProfile())!;
  const advisors = await listAdvisors(
    {
      specialism: params.specialism || undefined,
      state: params.state || undefined,
      language: params.language || undefined,
      availableWithinDays: params.availableWithinDays ? Number(params.availableWithinDays) : undefined,
      sort: (params.sort as AdvisorFilters['sort']) || 'recommended',
    },
    me.id,
  );
  return (
    <div>
      <h1 className="h-display text-4xl text-navy">Find your Mortgage Advisor</h1>
      <p className="mt-2 mb-6 text-muted">Every advisor on HomeFi is vetted by our team. Choose the one who fits your situation and book a 30 minute 1-on-1 session.</p>
      <AdvisorDirectory advisors={advisors} params={params} basePath="/app/advisors" signedIn />
    </div>
  );
}
