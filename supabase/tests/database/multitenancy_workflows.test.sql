begin;

select plan(12);

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
  ('61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'creator@example.test', '', now(), '{}', '{"full_name":"Creator"}', now(), now()),
  ('61000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invitee@example.test', '', now(), '{}', '{"full_name":"Invitee"}', now(), now()),
  ('61000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@example.test', '', now(), '{}', '{"full_name":"Outsider"}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);

create temporary table tenant_test_context (
  agency_id uuid not null
) on commit drop;

insert into tenant_test_context (agency_id)
select public.create_agency('Workflow Agency', 'workflow-agency');

select results_eq(
  $$ select slug from public.agencies $$,
  array['workflow-agency']::text[],
  'agency creation makes the creator an active member'
);

select results_eq(
  $$ select status::text from public.agency_members where profile_id = '61000000-0000-0000-0000-000000000001' $$,
  array['active']::text[],
  'agency creation activates the creator membership'
);

select results_eq(
  $$ select count(*) from public.role_permissions where role_id = (select role_id from public.agency_members where profile_id = '61000000-0000-0000-0000-000000000001') $$,
  $$ select count(*) from public.permissions $$,
  'the system owner role receives the complete permission catalog'
);

select results_eq(
  $$ select action from public.audit_logs $$,
  array['agency.created']::text[],
  'agency creation is audited'
);

select lives_ok(
  $$ select public.select_active_agency(agency_id) from tenant_test_context $$,
  'an active member can select their agency'
);

select lives_ok(
  $$ select public.create_client(agency_id, 'Workflow Client', 'workflow-client') from tenant_test_context $$,
  'an authorized agency member can create a client'
);

select results_eq(
  $$ select action from public.audit_logs order by id $$,
  array['agency.created', 'tenant_context.selected', 'client.created']::text[],
  'tenant selection and client creation are audited'
);

select lives_ok(
  $$
    select public.assign_agency_member(
      context.agency_id,
      '61000000-0000-0000-0000-000000000002',
      membership.role_id
    )
    from tenant_test_context as context
    join public.agency_members as membership
      on membership.agency_id = context.agency_id
     and membership.profile_id = '61000000-0000-0000-0000-000000000001'
  $$,
  'a member manager can create an agency invitation'
);

select results_eq(
  $$ select action from public.audit_logs where action = 'agency_membership.invited' $$,
  array['agency_membership.invited']::text[],
  'a sensitive membership invitation is audited'
);

select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);

select is_empty(
  $$ select id from public.agencies $$,
  'an invited user cannot access agency resources before acceptance'
);

select lives_ok(
  $$
    select public.accept_agency_membership(id)
    from public.agency_members
    where profile_id = '61000000-0000-0000-0000-000000000002'
  $$,
  'an invited user can accept only their own agency membership'
);

select results_eq(
  $$ select slug from public.agencies $$,
  array['workflow-agency']::text[],
  'an accepted member can access the agency'
);

select * from finish();
rollback;
