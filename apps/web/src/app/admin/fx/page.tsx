import { supabaseAdmin } from '@/lib/supabase/server';
import { addFxRate } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Fx() {
  const { data } = await supabaseAdmin().from('fx_rates').select('*').order('fetched_at', { ascending: false }).limit(50);
  return (
    <div className="space-y-6">
      <h1 className="h-display text-4xl text-navy">FX rates</h1>
      <p className="text-muted">The latest row per currency is used. Leave the stressed rate blank to apply the engine&apos;s default haircut to the live rate.</p>
      <form action={addFxRate} className="card grid gap-3 sm:grid-cols-4 sm:items-end">
        <label><span className="field-label text-sm">Currency</span><input className="input" name="currency" maxLength={3} placeholder="GBP" required /></label>
        <label><span className="field-label text-sm">Live ₦ per unit</span><input className="input num" name="live" type="number" step="0.0001" required /></label>
        <label><span className="field-label text-sm">Stressed ₦ (override)</span><input className="input num" name="stressed" type="number" step="0.0001" /></label>
        <button className="btn-primary">Add rate</button>
      </form>
      <table className="w-full rounded-2xl bg-white text-left text-sm">
        <thead className="bg-cream"><tr>{['Currency', 'Live', 'Stressed', 'Source', 'When'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody className="num divide-y divide-line">{(data ?? []).map((r) => <tr key={r.currency + r.fetched_at}><td className="p-3">{r.currency}</td><td className="p-3">{r.live_rate_to_ngn}</td><td className="p-3">{r.stressed_rate_to_ngn ?? 'haircut'}</td><td className="p-3">{r.source}</td><td className="p-3">{new Date(r.fetched_at).toLocaleString('en-GB')}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
