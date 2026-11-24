import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { currentProfile, supabaseAdmin } from '@/lib/supabase/server';
import { advisorBySlug } from '@/server/data';
import { BookingFlow } from './booking-flow';

export const metadata: Metadata = { title: 'Book a session', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function BookPage({ params }: { params: Promise<{ advisorSlug: string }> }) {
  const a = await advisorBySlug((await params).advisorSlug);
  if (!a) notFound();
  const me = (await currentProfile())!;
  const { data: reports } = await supabaseAdmin()
    .from('reports')
    .select('id, reference_code, application_id, applications!inner(user_id)')
    .eq('applications.user_id', me.id)
    .order('created_at', { ascending: false });
  return (
    <BookingFlow
      advisor={{ id: a.id, slug: a.slug, name: a.displayName, firstName: a.displayName.split(' ')[0]!, priceUsdCents: a.priceUsdCents, priceNgnKobo: a.priceNgnKobo }}
      reports={(reports ?? []).map((r) => ({ id: r.id, referenceCode: r.reference_code, applicationId: r.application_id }))}
      email={me.email ?? ''}
    />
  );
}
