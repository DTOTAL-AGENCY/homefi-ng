import { supabaseAdmin } from '@/lib/supabase/server';
import { moderateReview } from '../actions';

export const dynamic = 'force-dynamic';

/** Moderate for abuse and personal data, not for being negative. */
export default async function Reviews() {
  const { data } = await supabaseAdmin().from('reviews').select('*, advisors(display_name)').eq('status', 'pending').order('created_at');
  return (
    <div>
      <h1 className="h-display text-4xl text-navy">Reviews to moderate</h1>
      <p className="mt-1 text-muted">Reject only for abuse or personal data. Negative reviews are published.</p>
      {!data?.length ? <p className="mt-6 text-muted">Nothing waiting.</p> : (
        <ul className="mt-6 space-y-3">
          {data.map((r) => (
            <li key={r.id} className="card">
              <p className="font-semibold text-navy">{'★'.repeat(r.rating)} · for {(r.advisors as unknown as { display_name: string })?.display_name}</p>
              {r.title && <p className="mt-1 font-bold">{r.title}</p>}
              <p className="mt-1 text-muted">{r.body}</p>
              <form action={moderateReview} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <button name="decision" value="publish" className="btn-primary !min-h-9 !py-1 text-sm">Publish</button>
                <button name="decision" value="reject" className="btn-secondary !min-h-9 !py-1 text-sm">Reject</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
