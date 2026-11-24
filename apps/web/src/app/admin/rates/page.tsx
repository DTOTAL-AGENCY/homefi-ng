import { supabaseAdmin } from '@/lib/supabase/server';
import { saveEngineSettings, saveRateProduct } from '../actions';

export const dynamic = 'force-dynamic';

const pct = (v: number | string) => Number((Number(v) * 100).toFixed(4));

export default async function Rates() {
  const db = supabaseAdmin();
  const [{ data: products }, { data: current }, { data: versions }] = await Promise.all([
    db.from('rate_products').select('*').order('code'),
    db.from('engine_settings').select('*').eq('is_current', true).single(),
    db.from('engine_settings').select('version, created_at, is_current').order('created_at', { ascending: false }).limit(10),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-4xl text-navy">Rates and engine settings</h1>
        <p className="mt-1 text-muted">Saving creates a new engine version. New estimates use it straight away; earlier results keep the version they were made with. Current: <b className="num">{current?.version}</b></p>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-navy">Products</h2>
        {(products ?? []).map((p) => (
          <form key={p.code} action={saveRateProduct} className="card grid gap-3 sm:grid-cols-3 lg:grid-cols-7 lg:items-end">
            <input type="hidden" name="code" value={p.code} />
            <p className="font-bold text-navy lg:col-span-7">{p.name} <span className="text-sm text-muted">({p.code})</span></p>
            <label><span className="field-label text-sm">Rate min %</span><input className="input num" name="rate_min" type="number" step="0.01" defaultValue={pct(p.rate_min)} /></label>
            <label><span className="field-label text-sm">Rate max %</span><input className="input num" name="rate_max" type="number" step="0.01" defaultValue={pct(p.rate_max)} /></label>
            <label><span className="field-label text-sm">Max tenor (years)</span><input className="input num" name="max_tenor_years" type="number" defaultValue={p.max_tenor_years} /></label>
            <label><span className="field-label text-sm">Loan cap ₦ (blank = none)</span><input className="input num" name="loan_cap_naira" type="number" defaultValue={p.loan_cap_kobo ? Number(p.loan_cap_kobo) / 100 : ''} /></label>
            <label><span className="field-label text-sm">Equity %</span><input className="input num" name="equity_pct" type="number" step="0.5" defaultValue={pct(p.equity_pct)} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} className="h-5 w-5" /> Active</label>
            <button className="btn-primary !min-h-10 !py-2 text-sm">Save</button>
          </form>
        ))}
      </section>
      {current && (
        <form action={saveEngineSettings} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="text-xl font-bold text-navy sm:col-span-2 lg:col-span-4">Engine settings</h2>
          <label><span className="field-label text-sm">Affordability numerator</span><input className="input num" name="affordability_num" type="number" defaultValue={current.affordability_num} /></label>
          <label><span className="field-label text-sm">Affordability denominator</span><input className="input num" name="affordability_den" type="number" defaultValue={current.affordability_den} /></label>
          <label><span className="field-label text-sm">Max age at end of term</span><input className="input num" name="max_age_at_maturity" type="number" defaultValue={current.max_age_at_maturity} /></label>
          <label><span className="field-label text-sm">FX haircut %</span><input className="input num" name="fx_haircut_pct" type="number" step="0.5" defaultValue={pct(current.fx_haircut)} /></label>
          <label><span className="field-label text-sm">Minimum useful loan ₦</span><input className="input num" name="min_useful_loan_naira" type="number" defaultValue={Number(current.min_useful_loan_kobo) / 100} /></label>
          <label><span className="field-label text-sm">Repayment method</span>
            <select className="input" name="repayment_method" defaultValue={current.repayment_method}><option value="equal_principal">Equal principal</option><option value="annuity">Level annuity</option></select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="deduct_obligations" defaultChecked={current.deduct_obligations} className="h-5 w-5" /> Deduct existing repayments</label>
          <button className="btn-primary self-end">Publish new version</button>
        </form>
      )}
      <section>
        <h2 className="text-xl font-bold text-navy">Versions</h2>
        <ul className="num mt-2 text-sm text-muted">{(versions ?? []).map((v) => <li key={v.version}>{v.version} · {new Date(v.created_at).toLocaleString('en-GB')}{v.is_current ? ' · current' : ''}</li>)}</ul>
      </section>
    </div>
  );
}
