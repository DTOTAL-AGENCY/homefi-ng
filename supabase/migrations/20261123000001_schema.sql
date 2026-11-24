-- HomeFi.ng schema v1 (Phase 1 + tables Phase 2 needs)
create extension if not exists pgcrypto;

create type residence_type     as enum ('nigeria','diaspora');
create type income_source_type as enum ('salaried_public','salaried_private','self_employed',
                                        'mixed','part_time_contract','pension','other');
create type application_status as enum ('draft','submitted','estimated','claimed','report_sent',
                                        'advisory_booked','in_processing','closed','abandoned');
create type report_status      as enum ('queued','generating','ready','emailed',
                                        'checks_failed','email_failed');
create type session_status     as enum ('pending_payment','confirmed','rescheduled','completed',
                                        'no_show','cancelled','refunded');
create type payment_status     as enum ('initialised','success','failed','refunded');
create type review_status      as enum ('pending','published','rejected');
create type advisor_status     as enum ('invited','pending_review','approved','suspended');
create type case_stage         as enum ('documents','submitted_to_lender','offer_received',
                                        'property_appraisal','underwriting','approved',
                                        'declined','disbursed','withdrawn');

create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  other_names      text,
  title            text check (title in ('mr','mrs','ms','dr','none')),
  phone_e164       text,
  role             text not null default 'applicant'
                   check (role in ('applicant','advisor','ops','admin')),
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table engine_settings (
  version               text primary key,            -- e.g. '2026.11.1'
  affordability_num     smallint not null default 1,
  affordability_den     smallint not null default 3,
  deduct_obligations    boolean  not null default true,
  repayment_method      text not null default 'equal_principal'
                        check (repayment_method in ('equal_principal','annuity')),
  max_age_at_maturity   smallint not null default 60,
  fx_haircut            numeric(5,4) not null default 0.1300,
  min_useful_loan_kobo  bigint not null default 500000000,   -- N5,000,000
  match_weights         jsonb not null default
    '{"specialism":40,"state":20,"language":10,"availability":15,"rating":10,"approval":5}',
  is_current            boolean not null default false,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now()
);
create unique index one_current_engine on engine_settings (is_current) where is_current;

create table rate_products (
  code             text primary key,  -- NHF, NHF_DIASPORA, MREIF, COMMERCIAL, NON_INTEREST
  name             text not null,
  category         text not null check (category in ('concessionary','commercial','non_interest')),
  rate_min         numeric(6,4) not null,     -- 0.0600
  rate_max         numeric(6,4) not null,     -- equals rate_min for fixed-rate schemes
  max_tenor_years  smallint not null,
  loan_cap_kobo    bigint,                    -- NHF: 5000000000 (N50,000,000)
  equity_pct       numeric(5,4) not null default 0.1000,
  eligibility      jsonb not null default '{}',  -- {"nationality":["NG","NG_DUAL"],"residence":"nigeria"}
  active           boolean not null default true,
  effective_from   date not null default current_date,
  updated_by       uuid references profiles(id),
  updated_at       timestamptz not null default now()
);

create table fx_rates (
  currency              char(3) not null,
  live_rate_to_ngn      numeric(14,4) not null,
  stressed_rate_to_ngn  numeric(14,4),          -- admin override; else live * (1 - fx_haircut)
  source                text not null,
  fetched_at            timestamptz not null default now(),
  primary key (currency, fetched_at)
);

create table applications (
  id                       uuid primary key default gen_random_uuid(),
  reference_code           text unique,         -- HF-PQ-2026-1122-DO-0042
  user_id                  uuid references profiles(id),
  anon_token_hash          text,                -- sha256(token); cleared on claim
  status                   application_status not null default 'draft',
  is_joint                 boolean not null default false,
  nationality              text not null,       -- 'NG', 'NG_DUAL' or ISO 3166 alpha-2
  residence                residence_type not null,
  residence_country        char(2) not null,
  residence_state          text,
  residence_city           text,
  property_type            text not null check (property_type in ('flat','terrace','semi_detached',
                             'detached','bungalow','land','not_sure')),
  intended_use             text not null check (intended_use in ('live','rent','family','other')),
  preferred_states         text[] not null,
  preferred_city           text,
  target_value_min_kobo    bigint,
  target_value_max_kobo    bigint,
  property_status          text not null check (property_status in ('found','searching','need_help')),
  timeline                 text not null check (timeline in ('lt3m','3to6m','6to12m','gt12m','exploring')),
  equity_available_kobo    bigint not null default 0,
  has_rsa                  text check (has_rsa in ('yes','no','not_sure')),
  nhf_contributor          text check (nhf_contributor in ('yes','no','not_sure')),
  non_interest_preference  text not null check (non_interest_preference in ('yes','no','open')),
  notes                    text check (char_length(notes) <= 500),
  source_channel           text,
  utm                      jsonb,
  engine_version           text references engine_settings(version),
  legacy_source            text,                -- 'google_form_2026'
  legacy_row_index         int,
  submitted_at             timestamptz,
  claimed_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on applications (user_id);
create index on applications (status, created_at);

create table applicants (
  id                                 uuid primary key default gen_random_uuid(),
  application_id                     uuid not null references applications(id) on delete cascade,
  role                               text not null check (role in ('primary','co_applicant')),
  full_name                          text not null,
  age                                smallint check (age between 18 and 70),
  marital_status                     text,
  income_source                      income_source_type not null,
  monthly_net_income_minor           bigint not null check (monthly_net_income_minor > 0),
  income_currency                    char(3) not null default 'NGN',
  existing_monthly_obligations_minor bigint not null default 0,
  legacy_income_band                 text,      -- e.g. '2m_5m' for imported range answers
  unique (application_id, role)
);

create table prequal_results (
  id                            uuid primary key default gen_random_uuid(),
  application_id                uuid not null references applications(id) on delete cascade,
  product_code                  text not null references rate_products(code),
  scenario                      text not null check (scenario in ('base','stressed','lower','upper')),
  rate_basis                    text not null check (rate_basis in ('fixed','low','high')),
  interest_rate                 numeric(6,4) not null,
  tenor_months                  smallint not null,
  assessed_monthly_income_kobo  bigint not null,
  affordable_monthly_kobo       bigint not null,
  max_loan_kobo                 bigint not null,
  first_monthly_repayment_kobo  bigint not null,
  max_property_value_kobo       bigint not null,
  equity_required_kobo          bigint not null,
  capped                        boolean not null default false,
  eligible                      boolean not null,
  notes                         text[] not null default '{}',
  engine_version                text not null references engine_settings(version),
  created_at                    timestamptz not null default now()
);
create index on prequal_results (application_id);

create table reports (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  report_number   smallint not null check (report_number in (1,2)),
  reference_code  text not null,
  file_name       text not null,  -- MortgagePrequalification Report1 [22.Nov.26]_HomeFi-[Surname First-name]
  storage_path    text,
  page_count      smallint,
  status          report_status not null default 'queued',
  checks          jsonb,
  ai_model        text,
  prompt_version  text,
  created_by      uuid references profiles(id),   -- null = system; advisor for Report 2
  generated_at    timestamptz,
  emailed_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (application_id, report_number)
);

create table advisors (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references profiles(id),
  slug              text not null unique,
  display_name      text not null,
  headline          text not null check (char_length(headline) <= 90),
  bio_short         text not null check (char_length(bio_short) <= 280),
  bio_long          text,
  photo_url         text,
  specialisms       text[] not null default '{}',  -- diaspora, self_employed, joint, nhf, mreif, non_interest, first_time
  languages         text[] not null default '{en}',
  states_covered    text[] not null default '{}',
  years_experience  smallint,
  credentials       jsonb not null default '[]',   -- [{"name":"...","verified_at":"..."}]
  cal_username      text,
  cal_event_type_id bigint,
  price_usd_cents   int not null default 2500,
  price_ngn_kobo    bigint,
  status            advisor_status not null default 'invited',
  verified_at       timestamptz,
  created_at        timestamptz not null default now()
);

create table lenders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('pmb','commercial_bank','fmbn','non_interest_bank','other')),
  licence_no  text,
  active      boolean not null default true
);

create table mortgage_cases (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references applications(id),
  advisor_id        uuid references advisors(id),
  lender_id         uuid references lenders(id),
  product_code      text references rate_products(code),
  stage             case_stage not null default 'documents',
  loan_amount_kobo  bigint,
  decided_at        timestamptz,
  disbursed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id),
  provider            text not null check (provider in ('paystack','stripe')),
  provider_reference  text not null unique,
  purpose             text not null check (purpose in ('advisory_session','processing_fee_t1','processing_fee_t2')),
  amount_minor        bigint not null,
  currency            char(3) not null,
  status              payment_status not null default 'initialised',
  raw                 jsonb,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

create table advisory_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id),
  advisor_id       uuid not null references advisors(id),
  application_id   uuid references applications(id),
  report_id        uuid references reports(id),
  cal_booking_uid  text unique,
  start_at         timestamptz not null,
  end_at           timestamptz not null,
  timezone         text not null default 'Africa/Lagos',
  meeting_type     text not null default 'video' check (meeting_type in ('video','phone')),
  meeting_url      text,
  topic            text check (char_length(topic) <= 300),
  advisor_notes    text,
  status           session_status not null default 'pending_payment',
  hold_expires_at  timestamptz,
  payment_id       uuid references payments(id),
  created_at       timestamptz not null default now()
);
create index on advisory_sessions (advisor_id, start_at);

create table reviews (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null unique references advisory_sessions(id),
  user_id       uuid not null references profiles(id),
  advisor_id    uuid not null references advisors(id),
  rating        smallint not null check (rating between 1 and 5),
  title         text check (char_length(title) <= 80),
  body          text check (char_length(body) <= 1000),
  status        review_status not null default 'pending',
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id),
  application_id  uuid references applications(id),
  consent_type    text not null check (consent_type in ('data_processing','terms','marketing')),
  version         text not null,
  granted         boolean not null,
  ip              inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

create table notifications (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references profiles(id),
  application_id       uuid references applications(id),
  channel              text not null check (channel in ('email','whatsapp','sms')),
  template             text not null,
  provider_message_id  text,
  status               text not null default 'queued',
  created_at           timestamptz not null default now()
);

create table audit_log (
  id          bigserial primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  entity      text not null,
  entity_id   text not null,
  diff        jsonb,
  created_at  timestamptz not null default now()
);

-- Track record, computed (never typed in)
create view advisor_stats as
select a.id as advisor_id,
  (select count(*) from advisory_sessions s
     where s.advisor_id = a.id and s.status = 'completed')                      as sessions_completed,
  (select count(*) from mortgage_cases c
     where c.advisor_id = a.id and c.stage in ('approved','disbursed','declined')) as mortgages_decided,
  (select count(*) from mortgage_cases c
     where c.advisor_id = a.id and c.stage in ('approved','disbursed'))           as mortgages_approved,
  (select case when count(*) >= 5 then round(100.0 * count(*) filter
            (where c.stage in ('approved','disbursed')) / count(*)) end
     from mortgage_cases c
     where c.advisor_id = a.id and c.stage in ('approved','disbursed','declined')) as approval_rate,
  (select round(avg(r.rating)::numeric, 1) from reviews r
     where r.advisor_id = a.id and r.status = 'published')                       as avg_rating,
  (select count(*) from reviews r
     where r.advisor_id = a.id and r.status = 'published')                       as review_count
from advisors a;

