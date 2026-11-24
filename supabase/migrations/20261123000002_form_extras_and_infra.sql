-- Legacy Google Form questions kept on the site, draft support, and platform plumbing
-- (queues, reference codes, rate limits, contact messages, profile trigger).

create extension if not exists pgmq;

-- ---------------------------------------------------------------------------
-- Income source: the legacy form also offered "Investment income"
alter type income_source_type add value if not exists 'investment';

-- ---------------------------------------------------------------------------
-- Applicants: names split as the brief's form asks, plus gender (legacy form)
alter table applicants
  add column first_name  text,
  add column last_name   text,
  add column other_names text,
  add column title       text check (title in ('mr','mrs','ms','dr','none')),
  add column gender      text check (gender in ('male','female','prefer_not_to_say')),
  add column phone_e164  text;

-- ---------------------------------------------------------------------------
-- Applications: drafts are saved after every step, so step 2-4 columns are
-- nullable until submit. A check keeps submitted rows complete.
alter table applications
  alter column nationality             drop not null,
  alter column residence               drop not null,
  alter column residence_country       drop not null,
  alter column property_type           drop not null,
  alter column intended_use            drop not null,
  alter column preferred_states        drop not null,
  alter column property_status         drop not null,
  alter column timeline                drop not null,
  alter column non_interest_preference drop not null;

alter table applications
  add column draft                 jsonb not null default '{}',   -- raw answers by step
  add column last_step             smallint not null default 0,
  add column anon_token_expires_at timestamptz,
  add column target_exact_kobo     bigint,
  -- legacy form extras
  add column property_features     text[] not null default '{}',
  add column bedrooms              text check (bedrooms in ('1','2','3','4','5+')),
  add column rsa_equity_use        text check (rsa_equity_use in ('explore','other_sources','advise')),
  add column costs_acknowledged    text check (costs_acknowledged in ('understood','have_questions')),
  add column financial_readiness   text check (financial_readiness in ('ready','1to3m','6m','not_yet')),
  add column proceed_intent        text check (proceed_intent in ('prepare_and_contact','advisor_first','email_list')),
  add column report_prompt_answer  text check (report_prompt_answer in ('yes','not_now'));

alter table applications add constraint submitted_is_complete check (
  status in ('draft','abandoned') or (
    nationality is not null and residence is not null and residence_country is not null
    and property_type is not null and intended_use is not null and preferred_states is not null
    and property_status is not null and timeline is not null and non_interest_preference is not null
  )
);
create index on applications (anon_token_hash) where anon_token_hash is not null;

-- ---------------------------------------------------------------------------
-- Each change to a rate or a setting creates a new engine version. The rates
-- in force are frozen into the version so any old result can be reproduced.
alter table engine_settings
  add column rates_snapshot jsonb not null default '[]',
  add column min_display_rounding_kobo bigint not null default 1000000; -- N10,000

-- ---------------------------------------------------------------------------
-- Reference codes: HF-PQ-YYYY-MMDD-INITIALS-NNNN with a per-day counter
create table reference_counters (
  day   date primary key,
  last  int not null default 0
);

create or replace function next_reference_code(p_initials text)
returns text language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Africa/Lagos')::date;
  n int;
begin
  insert into reference_counters(day, last) values (d, 1)
  on conflict (day) do update set last = reference_counters.last + 1
  returning last into n;
  return format('HF-PQ-%s-%s-%s-%s', to_char(d,'YYYY'), to_char(d,'MMDD'),
                upper(coalesce(nullif(p_initials,''),'XX')), lpad(n::text, 4, '0'));
end $$;

-- ---------------------------------------------------------------------------
-- Fixed-window rate limiter used by anonymous endpoints
create table rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         int not null default 0,
  primary key (key, window_start)
);

create or replace function hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c int;
begin
  insert into rate_limits(key, window_start, count) values (p_key, w, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into c;
  return c <= p_limit;   -- true = allowed
end $$;

-- ---------------------------------------------------------------------------
-- Contact form
create table contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  topic       text not null check (topic in ('estimate','report','session','fees','partnerships','other')),
  message     text not null check (char_length(message) <= 2000),
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Booking: one live hold or booking per advisor slot
create unique index one_booking_per_slot on advisory_sessions (advisor_id, start_at)
  where status in ('pending_payment','confirmed','rescheduled');
alter table advisory_sessions
  add column reminder_24h_sent_at  timestamptz,
  add column reminder_1h_sent_at   timestamptz,
  add column abandoned_email_at    timestamptz,
  add column review_requested_at   timestamptz,
  add column ended_at              timestamptz;

alter table reports
  add column opened_at       timestamptz,
  add column downloaded_at   timestamptz,
  add column nudge_sent_at   timestamptz,
  add column attempts        smallint not null default 0,
  add column last_error      text;

alter table profiles add column email text;

-- ---------------------------------------------------------------------------
-- Job queues (pgmq). The web app enqueues through enqueue_job; the worker
-- reads with pgmq.read over a direct Postgres connection.
select pgmq.create('generate_report');
select pgmq.create('send_email');

create or replace function enqueue_job(p_queue text, p_payload jsonb, p_delay int default 0)
returns bigint language sql security definer set search_path = public, pgmq as $$
  select pgmq.send(p_queue, p_payload, p_delay);
$$;
revoke all on function enqueue_job(text, jsonb, int) from public, anon, authenticated;
revoke all on function next_reference_code(text) from public, anon, authenticated;
revoke all on function hit_rate_limit(text, int, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- A profile row for every new auth user, from sign-up metadata
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, first_name, last_name, phone_e164, email, marketing_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name',''),' ',1), ''),
    coalesce(new.raw_user_meta_data->>'last_name', nullif(split_part(coalesce(new.raw_user_meta_data->>'full_name',''),' ',2),''), ''),
    new.raw_user_meta_data->>'phone',
    new.email,
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

create or replace function touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger t_profiles_updated before update on profiles for each row execute function touch_updated_at();
create trigger t_applications_updated before update on applications for each row execute function touch_updated_at();
create trigger t_cases_updated before update on mortgage_cases for each row execute function touch_updated_at();
