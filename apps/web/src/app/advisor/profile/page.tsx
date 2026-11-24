import { currentProfile, supabaseAdmin } from '@/lib/supabase/server';
import { saveOwnProfile } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdvisorProfileEdit() {
  const me = (await currentProfile())!;
  const { data: a } = await supabaseAdmin().from('advisors').select('*').eq('user_id', me.id).maybeSingle();
  if (!a) return <p className="text-muted">No advisor profile is linked to this account.</p>;
  return (
    <form action={saveOwnProfile} className="card max-w-2xl space-y-4">
      <h1 className="h-display text-3xl text-navy">Your public profile</h1>
      <p className="text-sm text-muted">HomeFi edits your bio before it goes live. Track record and credentials are verified by our team.</p>
      <label className="block"><span className="field-label">Headline (90 characters)</span><input className="input" name="headline" maxLength={90} defaultValue={a.headline} /></label>
      <label className="block"><span className="field-label">Short bio (280 characters)</span><textarea className="input" name="bio_short" rows={3} maxLength={280} defaultValue={a.bio_short} /></label>
      <label className="block"><span className="field-label">About you (150 to 300 words)</span><textarea className="input" name="bio_long" rows={8} defaultValue={a.bio_long ?? ''} /></label>
      <button className="btn-primary">Save</button>
    </form>
  );
}
