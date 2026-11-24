-- LOCAL DEVELOPMENT ONLY. supabase db reset runs this; production never does.
-- Demo users (password for all: "homefi-local-1") and demo advisors so the
-- directory and booking flow can be exercised. No reviews are seeded: the
-- brief forbids writing or seeding testimonials.

do $$
declare
  u record;
begin
  for u in select * from (values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'admin@homefi.test',   'Ada',    'Admin',   'admin'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'tolu@homefi.test',    'Tolu',   'Adebayo', 'advisor'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'chinedu@homefi.test', 'Chinedu','Okafor',  'advisor'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'amina@homefi.test',   'Amina',  'Bello',   'advisor'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'applicant@homefi.test','Bisi',  'Johnson', 'applicant')
  ) as t(id, email, first_name, last_name, role)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      crypt('homefi-local-1', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('first_name', u.first_name, 'last_name', u.last_name),
      now(), now(), '', '', '', '')
    on conflict (id) do nothing;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text,
      jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now())
    on conflict do nothing;

    update profiles set role = u.role where id = u.id;
  end loop;
end $$;

insert into advisors (user_id, slug, display_name, headline, bio_short, bio_long, specialisms, languages,
  states_covered, years_experience, cal_username, cal_event_type_id, status, verified_at) values
 ('00000000-0000-4000-8000-000000000002', 'tolu-adebayo', 'Tolu Adebayo',
  'Diaspora and NHF specialist [DEMO]',
  'Helps Nigerians in the UK and North America buy at home. Demo profile for local development.',
  'Demo profile for local development only. Replace with real, vetted advisors before launch.',
  '{diaspora,nhf,first_time}', '{en,yo}', '{Lagos,Ogun,FCT}', 9, 'demo-tolu', 1001, 'approved', now()),
 ('00000000-0000-4000-8000-000000000003', 'chinedu-okafor', 'Chinedu Okafor',
  'Self-employed and business owner mortgages [DEMO]',
  'Works with business owners whose income does not come on a payslip. Demo profile.',
  'Demo profile for local development only.',
  '{self_employed,mreif,joint}', '{en,ig,pcm}', '{Lagos,Anambra,Rivers}', 7, 'demo-chinedu', 1002, 'approved', now()),
 ('00000000-0000-4000-8000-000000000004', 'amina-bello', 'Amina Bello',
  'Non-interest (Ijarah) and joint applications [DEMO]',
  'Guides couples and non-interest seekers through Ijarah-based home finance. Demo profile.',
  'Demo profile for local development only.',
  '{non_interest,joint,first_time}', '{en,ha}', '{FCT,Kano,Kaduna}', 5, 'demo-amina', 1003, 'approved', now())
on conflict (slug) do nothing;

insert into lenders (name, type) values
 ('Federal Mortgage Bank of Nigeria', 'fmbn'),
 ('Demo Primary Mortgage Bank', 'pmb'),
 ('Demo Non-Interest Bank', 'non_interest_bank');
