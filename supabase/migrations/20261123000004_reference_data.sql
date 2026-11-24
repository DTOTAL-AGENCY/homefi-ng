-- Products and engine version 2026.11.1 (values from the brief; [Confirm] items
-- are editable in /admin, which creates a new engine version).

insert into rate_products (code,name,category,rate_min,rate_max,max_tenor_years,loan_cap_kobo,eligibility) values
 ('NHF','National Housing Fund (FMBN)','concessionary',0.06,0.06,18,5000000000,
   '{"nationality":["NG","NG_DUAL"],"residence":"nigeria"}'),
 ('NHF_DIASPORA','NHF Diaspora (FMBN)','concessionary',0.06,0.06,18,5000000000,
   '{"nationality":["NG","NG_DUAL"],"residence":"diaspora"}'),
 ('MREIF','MREIF via partner banks','concessionary',0.0975,0.0975,18,null,'{}'),
 ('COMMERCIAL','Commercial (PMBs and banks)','commercial',0.22,0.30,15,null,'{}'),
 ('NON_INTEREST','Non-interest (Ijarah)','non_interest',0.22,0.30,15,null,'{"preference":"yes"}')
on conflict (code) do nothing;

insert into engine_settings (version, is_current, rates_snapshot)
select '2026.11.1', true, coalesce(jsonb_agg(to_jsonb(r) order by r.code), '[]')
from rate_products r
on conflict (version) do nothing;

-- Starting FX rates (replace with the daily feed; admin can override stressed)
insert into fx_rates (currency, live_rate_to_ngn, stressed_rate_to_ngn, source) values
 ('GBP', 1836, 1600, 'seed'),
 ('USD', 1450, null, 'seed'),
 ('EUR', 1560, null, 'seed'),
 ('CAD', 1040, null, 'seed'),
 ('AED',  395, null, 'seed');

-- Private bucket for reports, public bucket for advisor photos
insert into storage.buckets (id, name, public) values
  ('reports', 'reports', false),
  ('advisor-photos', 'advisor-photos', true)
on conflict (id) do nothing;
