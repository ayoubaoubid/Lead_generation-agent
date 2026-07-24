begin;

select plan(15);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('77000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'onboarding-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('77000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'onboarding-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table onboarding_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  session_a uuid
) on commit drop;

insert into onboarding_test_context default values;
grant select, update on onboarding_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000001', true);

update onboarding_test_context
set agency_a = public.create_agency(
  'Onboarding Agency A',
  'onboarding-agency-a'
);

update onboarding_test_context
set client_a = public.create_client_profile(
  agency_a,
  'Onboarding Client A',
  'onboarding-client-a',
  '',
  '',
  '',
  'FR',
  'fr',
  'Europe/Paris',
  '',
  '',
  array[]::text[],
  'onboarding'
);

select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000002', true);

update onboarding_test_context
set agency_b = public.create_agency(
  'Onboarding Agency B',
  'onboarding-agency-b'
);

update onboarding_test_context
set client_b = public.create_client_profile(
  agency_b,
  'Onboarding Client B',
  'onboarding-client-b',
  '',
  '',
  '',
  'MA',
  'fr',
  'Africa/Casablanca',
  '',
  '',
  array[]::text[],
  'onboarding'
);

select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000001', true);

select ok(
  private.has_permission(
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context),
    'onboarding.write'
  ),
  'Agency Owner receives onboarding.write'
);

select ok(
  private.has_permission(
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context),
    'onboarding.validate'
  ),
  'Agency Owner receives onboarding.validate'
);

update onboarding_test_context
set session_a = public.save_onboarding_step(
  agency_a,
  client_a,
  'company_information',
  '{"companyName":"Acme"}'::jsonb,
  false,
  1::smallint
);

select is(
  (select count(*) from public.onboarding_sessions),
  1::bigint,
  'Agency A can read its onboarding session'
);

select ok(
  exists (
    select 1
    from public.onboarding_answer_history
    where session_id = (select session_a from onboarding_test_context)
      and revision = 1
  ),
  'the first progressive save creates an append-only history entry'
);

select throws_ok(
  format(
    'insert into public.onboarding_answers (agency_id, client_id, session_id, section_key, created_by, updated_by) values (%L, %L, %L, %L, %L, %L)',
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context),
    (select session_a from onboarding_test_context),
    'pricing',
    '77000000-0000-0000-0000-000000000001',
    '77000000-0000-0000-0000-000000000001'
  ),
  '42501',
  null,
  'authenticated users cannot bypass the audited save RPC'
);

select throws_ok(
  format(
    'select public.complete_client_onboarding(%L, %L)',
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context)
  ),
  '23514',
  'all onboarding steps must be complete',
  'an incomplete onboarding cannot be completed'
);

select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000002', true);

select is(
  (select count(*) from public.onboarding_sessions),
  0::bigint,
  'Agency B cannot read Agency A onboarding'
);

select throws_ok(
  format(
    'select public.save_onboarding_step(%L, %L, %L, %L::jsonb, true, 1::smallint)',
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context),
    'company_information',
    '{"companyName":"Forged"}'
  ),
  '42501',
  'onboarding write permission required',
  'a forged Agency A and Client A pair is rejected'
);

select set_config('request.jwt.claim.sub', '77000000-0000-0000-0000-000000000001', true);

select public.save_onboarding_step(
  (select agency_a from onboarding_test_context),
  (select client_a from onboarding_test_context),
  section.section_key,
  jsonb_build_object('verifiedInput', section.section_key::text),
  true,
  section.step::smallint
)
from unnest(enum_range(null::public.onboarding_section_key))
  with ordinality as section(section_key, step);

select is(
  (
    select completed_step_count
    from public.onboarding_sessions
    where id = (select session_a from onboarding_test_context)
  ),
  14::smallint,
  'all fourteen complete steps are counted deterministically'
);

select is(
  public.complete_client_onboarding(
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context)
  ),
  (select session_a from onboarding_test_context),
  'the complete transition returns the onboarding session'
);

select is(
  (
    select status
    from public.onboarding_sessions
    where id = (select session_a from onboarding_test_context)
  ),
  'completed'::public.onboarding_status,
  'the onboarding enters completed status'
);

select is(
  public.validate_client_onboarding(
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context)
  ),
  (select session_a from onboarding_test_context),
  'an authorized owner validates a completed onboarding'
);

select throws_ok(
  format(
    'select public.save_onboarding_step(%L, %L, %L, %L::jsonb, true, 1::smallint)',
    (select agency_a from onboarding_test_context),
    (select client_a from onboarding_test_context),
    'company_information',
    '{"companyName":"Late edit"}'
  ),
  '55000',
  'validated onboarding is immutable',
  'a validated onboarding cannot be modified'
);

select ok(
  exists (
    select 1
    from public.audit_logs
    where client_id = (select client_a from onboarding_test_context)
      and action = 'onboarding.completed'
  )
  and exists (
    select 1
    from public.audit_logs
    where client_id = (select client_a from onboarding_test_context)
      and action = 'onboarding.validated'
  ),
  'completion and validation are audited'
);

select is(
  (
    select status
    from public.onboarding_sessions
    where id = (select session_a from onboarding_test_context)
  ),
  'validated'::public.onboarding_status,
  'the final persisted status is validated'
);

select * from finish();
rollback;
