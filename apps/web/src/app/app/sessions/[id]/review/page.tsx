import { notFound } from 'next/navigation';
import { currentProfile, supabaseAdmin } from '@/lib/supabase/server';
import { ReviewForm } from './review-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Review your session', robots: { index: false } };

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ rating?: string }> }) {
  const { id } = await params;
  const { rating } = await searchParams;
  const me = (await currentProfile())!;
  const { data: s } = await supabaseAdmin().from('advisory_sessions').select('id, user_id, status, advisors(display_name)').eq('id', id).maybeSingle();
  if (!s || s.user_id !== me.id) notFound();
  const name = (s.advisors as unknown as { display_name: string } | null)?.display_name ?? 'your advisor';
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="h-display text-4xl text-navy">How was your session with {name.split(' ')[0]}?</h1>
      <ReviewForm id={s.id} initialRating={Math.min(5, Math.max(0, Number(rating) || 0))} />
    </div>
  );
}
