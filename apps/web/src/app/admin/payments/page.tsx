import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Payments() {
  const { data } = await supabaseAdmin().from('payments').select('id, provider_reference, purpose, amount_minor, currency, status, paid_at, created_at').order('created_at', { ascending: false }).limit(200);
  return (
    <div>
      <h1 className="h-display text-4xl text-navy">Payments</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-cream"><tr>{['Reference', 'Purpose', 'Amount', 'Status', 'Paid'].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody className="num divide-y divide-line">
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td className="p-3">{p.provider_reference}</td><td className="p-3">{p.purpose}</td>
                <td className="p-3">{p.currency} {(Number(p.amount_minor) / 100).toLocaleString('en-NG')}</td>
                <td className="p-3">{p.status}</td><td className="p-3">{p.paid_at ? new Date(p.paid_at).toLocaleString('en-GB') : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
