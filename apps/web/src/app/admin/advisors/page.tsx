import { supabaseAdmin } from '@/lib/supabase/server';
import { inviteAdvisor, saveAdvisor, setAdvisorStatus } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminAdvisors() {
  const { data } = await supabaseAdmin().from('advisors').select('*').order('created_at', { ascending: false });
  const f = (label: string, name: string, value: unknown, wide = false) => (
    <label className={wide ? 'sm:col-span-2' : ''}><span className="field-label text-sm">{label}</span><input className="input" name={name} defaultValue={value == null ? '' : String(value)} /></label>
  );
  return (
    <div className="space-y-6">
      <h1 className="h-display text-4xl text-navy">Advisors</h1>
      <form action={inviteAdvisor} className="card grid gap-3 sm:grid-cols-3 sm:items-end">
        <h2 className="text-lg font-bold text-navy sm:col-span-3">Invite an advisor</h2>
        {f('Full name', 'display_name', '')}
        <label><span className="field-label text-sm">Email</span><input className="input" type="email" name="email" required /></label>
        <button className="btn-primary">Send invite</button>
      </form>
      {(data ?? []).map((a) => (
        <details key={a.id} className="card">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
            <span className="font-bold text-navy">{a.display_name} <span className="text-sm font-normal text-muted">/{a.slug}</span></span>
            <span className="rounded-full bg-cream px-3 py-1 text-sm font-semibold">{a.status}</span>
          </summary>
          <form action={saveAdvisor} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={a.id} />
            {f('Display name', 'display_name', a.display_name)}
            {f('Headline (90)', 'headline', a.headline)}
            {f('Short bio (280)', 'bio_short', a.bio_short, true)}
            <label className="sm:col-span-2"><span className="field-label text-sm">Long bio (150 to 300 words)</span><textarea className="input" rows={4} name="bio_long" defaultValue={a.bio_long ?? ''} /></label>
            {f('Specialisms (comma separated: diaspora, self_employed, joint, nhf, mreif, non_interest, first_time)', 'specialisms', a.specialisms.join(', '), true)}
            {f('Languages (en, yo, ha, ig, pcm)', 'languages', a.languages.join(', '))}
            {f('States covered', 'states_covered', a.states_covered.join(', '))}
            {f('Years of experience (checked)', 'years_experience', a.years_experience)}
            {f('Cal.com event type id', 'cal_event_type_id', a.cal_event_type_id)}
            {f('Session price in ₦ (blank = USD only)', 'price_ngn', a.price_ngn_kobo ? Number(a.price_ngn_kobo) / 100 : '')}
            {f('Verified credentials (comma separated, adds with today’s date)', 'credentials', '', true)}
            <button className="btn-primary sm:col-span-2 sm:justify-self-start">Save profile</button>
          </form>
          <div className="mt-4 flex gap-2">
            {(['approved', 'suspended'] as const).filter((s) => s !== a.status).map((s) => (
              <form key={s} action={setAdvisorStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} /><button className="btn-secondary !min-h-9 !py-1 text-sm">{s === 'approved' ? 'Approve' : 'Suspend'}</button></form>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
