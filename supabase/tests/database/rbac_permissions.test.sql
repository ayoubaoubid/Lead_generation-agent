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
  ('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rbac-owner@example.test', '', now(), '{}', '{"full_name":"RBAC Owner"}', now(), now()),
  ('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rbac-recruiter@example.test', '', now(), '{}', '{"full_name":"RBAC Recruiter"}', now(), now()),
  ('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fake-owner@example.test', '', now(), '{}', '{"full_name":"Fake Owner"}', now(), now());

create temporary table rbac_test_context (
  agency_id uuid not null,
  client_id uuid
) on commit drop;
grant select, insert, update on rbac_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);

insert into rbac_test_context (agency_id)
select public.create_agency('RBAC Agency', 'rbac-agency');

update rbac_test_context
set client_id = public.create_client(
  agency_id,
  'RBAC Client',
  'rbac-client'
);

select public.invite_or_assign_recruiter(
  (select agency_id from rbac_test_context),
  '71000000-0000-0000-0000-000000000002',
  array[(select client_id from rbac_test_context)]
);

reset role;

insert into public.roles (
  agency_id,
  scope,
  name,
  slug,
  description,
  created_by
)
select
  agency_id,
  'agency',
  'Agency Owner',
  'fake-owner',
  'A presentation label that grants no capability.',
  '71000000-0000-0000-0000-000000000001'
from rbac_test_context;

insert into public.agency_members (
  agency_id,
  profile_id,
  role_id,
  status,
  created_by
)
select
  context.agency_id,
  '71000000-0000-0000-0000-000000000003',
  role.id,
  'active',
  '71000000-0000-0000-0000-000000000001'
from rbac_test_context as context
join public.roles as role
  on role.agency_id = context.agency_id
 and role.client_id is null
 and role.slug = 'fake-owner';

select is(
  (
    select count(*) from public.roles
    where agency_id = (select agency_id from rbac_test_context)
      and scope = 'agency'
      and is_system
      and archived_at is null
  ),
  2::bigint,
  'agency provisioning exposes only Agency Owner and Recruiter'
);

select is(
  (
    select count(*) from public.roles
    where agency_id = (select agency_id from rbac_test_context)
      and client_id = (select client_id from rbac_test_context)
      and scope = 'client'
      and is_system
      and archived_at is null
  ),
  1::bigint,
  'client provisioning exposes only Recruiter'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);

select ok(private.has_permission((select agency_id from rbac_test_context), null, 'agency.transfer_ownership'), 'Agency Owner can transfer ownership');
select ok(private.has_permission((select agency_id from rbac_test_context), null, 'client.create'), 'Agency Owner can create clients');
select ok(private.has_permission((select agency_id from rbac_test_context), null, 'member.invite'), 'Agency Owner can invite Recruiters');

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000002', true);
select public.accept_pending_recruiter_invitations();

select ok(private.has_permission((select agency_id from rbac_test_context), (select client_id from rbac_test_context), 'lead.write'), 'assigned Recruiter can operate lead data');
select ok(private.has_permission((select agency_id from rbac_test_context), (select client_id from rbac_test_context), 'campaign.launch'), 'assigned Recruiter can launch an approved campaign');
select is(private.has_permission((select agency_id from rbac_test_context), (select client_id from rbac_test_context), 'client.manage'), false, 'Recruiter cannot administer the client');
select is(private.has_permission((select agency_id from rbac_test_context), (select client_id from rbac_test_context), 'member.invite'), false, 'Recruiter cannot invite members');
select is(private.has_permission((select agency_id from rbac_test_context), (select client_id from rbac_test_context), 'settings.manage'), false, 'Recruiter cannot change protected client settings');
select is(private.has_permission((select agency_id from rbac_test_context), null, 'client.read'), false, 'Recruiter has no agency-wide client access');
select is(private.has_permission((select agency_id from rbac_test_context), null, 'agency.transfer_ownership'), false, 'Recruiter cannot transfer agency ownership');

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000003', true);
select is(private.has_permission((select agency_id from rbac_test_context), null, 'campaign.launch'), false, 'a role merely named Agency Owner grants no authority');

reset role;

select throws_ok(
  $$
    insert into public.role_permissions (role_id, permission_id)
    select role.id, permission.id
    from public.roles as role
    cross join public.permissions as permission
    where role.agency_id = (select agency_id from rbac_test_context)
      and role.client_id = (select client_id from rbac_test_context)
      and role.slug = 'recruiter'
      and permission.key = 'agency.transfer_ownership'
  $$,
  '23514',
  'permission is not allowed for the role scope',
  'an agency-only permission cannot be assigned to a client role'
);

select * from finish();
rollback;
