-- Row Level Security on every table.
-- Applicants see their own rows; advisors see applications and reports only for
-- their own sessions; ops and admin see everything. Writes from the browser go
-- through the API (service role), so most tables expose select only.
-- Anonymous draft access goes through the API keyed by anon_token_hash.

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('ops','admin'));
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_advisor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from advisors where user_id = auth.uid();
$$;

-- True when the signed-in advisor has a live or completed session on the application
create or replace function advisor_can_see_application(p_application uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from advisory_sessions s
    where s.application_id = p_application
      and s.advisor_id = my_advisor_id()
      and s.status in ('confirmed','rescheduled','completed'));
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','engine_settings','rate_products','fx_rates','applications',
    'applicants','prequal_results','reports','advisors','lenders','mortgage_cases','payments',
    'advisory_sessions','reviews','consents','notifications','audit_log','reference_counters',
    'rate_limits','contact_messages']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- profiles: own row; users may edit only their personal fields, never role
create policy profiles_self_select on profiles for select using (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff on profiles for all using (is_staff()) with check (is_admin());
revoke update on profiles from authenticated;
grant update (first_name, last_name, other_names, title, phone_e164, marketing_opt_in) on profiles to authenticated;

-- reference data: readable by everyone
create policy rate_products_read on rate_products for select using (true);
create policy rate_products_admin on rate_products for all using (is_admin()) with check (is_admin());
create policy engine_settings_read on engine_settings for select using (true);
create policy engine_settings_admin on engine_settings for all using (is_admin()) with check (is_admin());
create policy fx_rates_read on fx_rates for select using (true);
create policy fx_rates_admin on fx_rates for all using (is_admin()) with check (is_admin());
create policy lenders_read on lenders for select using (true);
create policy lenders_staff on lenders for all using (is_staff()) with check (is_staff());

-- applications and their children
create policy own_applications on applications for select using (user_id = auth.uid());
create policy advisor_applications on applications for select using (advisor_can_see_application(id));
create policy staff_applications on applications for all using (is_staff()) with check (is_staff());

create policy own_applicants on applicants for select using (
  exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()));
create policy advisor_applicants on applicants for select using (advisor_can_see_application(application_id));
create policy staff_applicants on applicants for all using (is_staff()) with check (is_staff());

create policy own_results on prequal_results for select using (
  exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()));
create policy advisor_results on prequal_results for select using (advisor_can_see_application(application_id));
create policy staff_results on prequal_results for all using (is_staff()) with check (is_staff());

create policy own_reports on reports for select using (
  exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()));
create policy advisor_reports on reports for select using (advisor_can_see_application(application_id));
create policy staff_reports on reports for all using (is_staff()) with check (is_staff());

-- advisors: approved profiles are public; an advisor sees and edits their own
create policy advisors_public on advisors for select using (status = 'approved');
create policy advisors_self on advisors for select using (user_id = auth.uid());
create policy advisors_staff on advisors for all using (is_staff()) with check (is_staff());

-- cases, sessions, payments
create policy own_cases on mortgage_cases for select using (
  exists (select 1 from applications a where a.id = application_id and a.user_id = auth.uid()));
create policy advisor_cases on mortgage_cases for select using (advisor_id = my_advisor_id());
create policy staff_cases on mortgage_cases for all using (is_staff()) with check (is_staff());

create policy own_sessions on advisory_sessions for select using (user_id = auth.uid());
create policy advisor_sessions on advisory_sessions for select using (advisor_id = my_advisor_id());
create policy staff_sessions on advisory_sessions for all using (is_staff()) with check (is_staff());

create policy own_payments on payments for select using (user_id = auth.uid());
create policy staff_payments on payments for all using (is_staff()) with check (is_staff());

-- reviews: published ones are public
create policy reviews_public on reviews for select using (status = 'published');
create policy own_reviews on reviews for select using (user_id = auth.uid());
create policy staff_reviews on reviews for all using (is_staff()) with check (is_staff());

-- logs
create policy own_consents on consents for select using (user_id = auth.uid());
create policy staff_consents on consents for select using (is_staff());
create policy own_notifications on notifications for select using (user_id = auth.uid());
create policy staff_notifications on notifications for select using (is_staff());
create policy staff_audit on audit_log for select using (is_staff());
create policy staff_contact on contact_messages for all using (is_staff()) with check (is_staff());
-- reference_counters and rate_limits: no policies, service role only

-- Advisor track record is computed and public
grant select on advisor_stats to anon, authenticated;
