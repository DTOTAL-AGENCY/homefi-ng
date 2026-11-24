import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { EngineOutput } from '@homefi/engine';
import { EstimateView } from '@/components/estimate-view';
import { loadApplication } from '@/server/applications';
import { supabaseAdmin, currentUser } from '@/lib/supabase/server';
import { ReportPrompt } from './report-prompt';

export const metadata: Metadata = { title: 'Your estimate', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser().catch(() => null);
  const sb = supabaseAdmin();
  const app = await loadApplication(sb, id, { userId: user?.id ?? null }).catch(() => null);
  if (!app) notFound();
  if (!app.estimate) {
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <h1 className="h-display text-3xl text-navy">Your estimate isn&apos;t finished yet.</h1>
        <Link href="/prequalify" className="btn-primary mt-6">Continue my answers</Link>
      </div>
    );
  }
  const { data: primary } = await sb
    .from('applicants')
    .select('first_name,last_name,phone_e164')
    .eq('application_id', app.id)
    .eq('role', 'primary')
    .single();
  const estimate = app.estimate as unknown as EngineOutput;
  const claimed = !!app.user_id;
  const { data: report } = claimed
    ? await sb.from('reports').select('id,status').eq('application_id', app.id).eq('report_number', 1).maybeSingle()
    : { data: null };

  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      <EstimateView firstName={primary?.first_name ?? 'You'} estimate={estimate} />
      <ReportPrompt
        applicationId={app.id}
        signedIn={!!user}
        claimed={claimed}
        reportId={report?.id ?? null}
        headlineBand={estimate.headline?.displayKobo ?? 0}
        variant={estimate.variants[0]?.key ?? 'none'}
        productsEligible={estimate.results.filter((r) => r.eligible).length}
        prefill={{ firstName: primary?.first_name ?? '', lastName: primary?.last_name ?? '', phone: primary?.phone_e164 ?? '' }}
      />
      <p className="mt-10 text-center text-sm">
        <Link href="/prequalify/new" className="font-semibold text-navy underline underline-offset-4">
          Circumstances changed? Start a new estimate
        </Link>
      </p>
    </div>
  );
}
