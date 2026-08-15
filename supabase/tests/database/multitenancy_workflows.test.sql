begin;

select plan(14);

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
  agency_id uuid not null,
  client_id uuid
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

update tenant_test_context
set client_id = public.create_client(
  agency_id,
  'Workflow Client',
  'workflow-client'
);

select ok(
  (select client_id is not null from tenant_test_context),
  'an authorized Agency Owner can create a client'
);

select results_eq(
  $$ select action from public.audit_logs order by id $$,
  array['agency.created', 'tenant_context.selected', 'client.created']::text[],
  'tenant selection and client creation are audited'
);

select lives_ok(
  $$
    select public.invite_or_assign_recruiter(
      context.agency_id,
      '61000000-0000-0000-0000-000000000002',
      array[context.client_id]
    )
    from tenant_test_context as context
  $$,
  'an Agency Owner can invite a Recruiter with an explicit client assignment'
);

select results_eq(
  $$ select action from public.audit_logs where action = 'recruiter.invited' $$,
  array['recruiter.invited']::text[],
  'the Recruiter invitation is audited'
);

select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);

select is_empty(
  $$ select id from public.agencies $$,
  'an invited user cannot access agency resources before acceptance'
);

select lives_ok(
  $$ select public.accept_pending_recruiter_invitations() $$,
  'an invited Recruiter can activate only their own pending memberships'
);

select results_eq(
  $$ select slug from public.agencies $$,
  array['workflow-agency']::text[],
  'an accepted Recruiter can access the agency'
);

select results_eq(
  $$ select slug from public.clients $$,
  array['workflow-client']::text[],
  'an accepted Recruiter can access the explicitly assigned client'
);

select is(
  private.has_permission(
    (select agency_id from tenant_test_context),
    null,
    'client.read'
  ),
  false,
  'a Recruiter receives no agency-wide client permission'
);

select * from finish();
rollback;
