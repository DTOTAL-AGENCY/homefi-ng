import type { Metadata } from 'next';
import { AdvisorDirectory } from '@/components/advisor-directory';
import { PageHero } from '@/components/page-hero';
import { currentUser } from '@/lib/supabase/server';
import { listAdvisors, type AdvisorFilters } from '@/server/advisors';

export const metadata: Metadata = { title: 'Find your Mortgage Advisor', description: 'Vetted HomeFi Mortgage Advisors with verified reviews and live availability.' };
export const dynamic = 'force-dynamic';

export default async function AdvisorsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const user = await currentUser().catch(() => null);
  const advisors = await listAdvisors(
    {
      specialism: params.specialism || undefined,
      state: params.state || undefined,
      language: params.language || undefined,
      availableWithinDays: params.availableWithinDays ? Number(params.availableWithinDays) : undefined,
      sort: (params.sort as AdvisorFilters['sort']) || undefined,
    },
    user?.id,
  );
  return (
    <>
      <PageHero
        title="Find your Mortgage Advisor"
        intro="Every advisor on HomeFi is vetted by our team. Choose the one who fits your situation and book a 30 minute 1-on-1 session."
      />
      <section className="container-page py-10">
        <AdvisorDirectory advisors={advisors} params={params} basePath="/advisors" signedIn={!!user} />
      </section>
    </>
  );
}
