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
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer-a@example.test', '', now(), '{}', '{"full_name":"Viewer A"}', now(), now()),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now()),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-a@example.test', '', now(), '{}', '{"full_name":"Client A"}', now(), now()),
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-b@example.test', '', now(), '{}', '{"full_name":"Client B"}', now(), now()),
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'non-member@example.test', '', now(), '{}', '{"full_name":"Non Member"}', now(), now());

insert into public.agencies (id, name, slug, status, created_by)
values
  ('a0000000-0000-0000-0000-000000000001', 'Agency A', 'agency-a', 'active', '10000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', 'Agency B', 'agency-b', 'active', '20000000-0000-0000-0000-000000000001');

insert into public.clients (id, agency_id, name, slug, status, created_by)
values
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Client A1', 'client-a1', 'active', '10000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Client B1', 'client-b1', 'active', '20000000-0000-0000-0000-000000000001');

insert into public.roles (id, agency_id, client_id, scope, name, slug, created_by)
values
  ('aa000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', null, 'agency', 'Agency A Owner', 'owner', '10000000-0000-0000-0000-000000000001'),
  ('aa000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', null, 'agency', 'Agency A Viewer', 'viewer', '10000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', null, 'agency', 'Agency B Owner', 'owner', '20000000-0000-0000-0000-000000000001'),
  ('bb000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', null, 'agency', 'Agency B Viewer', 'viewer', '20000000-0000-0000-0000-000000000001'),
  ('ac000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'client', 'Client A Viewer', 'viewer', '10000000-0000-0000-0000-000000000001'),
  ('bc000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'client', 'Client B Viewer', 'viewer', '20000000-0000-0000-0000-000000000001');

insert into public.role_permissions (role_id, permission_id, created_by)
select 'aa000000-0000-0000-0000-000000000001', permission.id, '10000000-0000-0000-0000-000000000001'
from public.permissions as permission;

insert into public.role_permissions (role_id, permission_id, created_by)
select 'bb000000-0000-0000-0000-000000000001', permission.id, '20000000-0000-0000-0000-000000000001'
from public.permissions as permission;

insert into public.role_permissions (role_id, permission_id, created_by)
select role.id, permission.id, role.created_by
from public.roles as role
cross join public.permissions as permission
where role.id in (
    'ac000000-0000-0000-0000-000000000001',
    'bc000000-0000-0000-0000-000000000001'
  )
  and permission.key = 'client.read';

insert into public.agency_members (agency_id, profile_id, role_id, status, created_by)
values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'active', '10000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000002', 'active', '10000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000002', 'active', '10000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'active', '20000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000002', 'active', '20000000-0000-0000-0000-000000000001');

insert into public.client_members (agency_id, client_id, profile_id, role_id, status, created_by)
values
  ('a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'active', '10000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'bc000000-0000-0000-0000-000000000001', 'active', '20000000-0000-0000-0000-000000000001');

insert into public.audit_logs (agency_id, client_id, created_by, action, resource_type, resource_id)
values
  ('a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'client.created', 'client', 'a1000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'client.created', 'client', 'b1000000-0000-0000-0000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$ select slug from public.agencies order by slug $$,
  array['agency-a']::text[],
  'an agency member sees only their agency'
);

select results_eq(
  $$ select slug from public.clients order by slug $$,
  array['client-a1']::text[],
  'an agency member sees only clients in their agency'
);

select ok(
  private.has_permission('a0000000-0000-0000-0000-000000000001', null, 'client.create'),
  'an agency owner receives an assigned agency permission'
);

select is(
  private.has_permission('b0000000-0000-0000-0000-000000000001', null, 'client.create'),
  false,
  'an agency permission never crosses agencies'
);

select results_eq(
  $$ select display_name from public.profiles order by display_name $$,
  array['Client A', 'Owner A', 'Viewer A']::text[],
  'agency members see only profiles belonging to their agency scope'
);

select results_eq(
  $$ select agency_id from public.audit_logs $$,
  array['a0000000-0000-0000-0000-000000000001'::uuid],
  'audit readers see records only in their agency'
);

select throws_ok(
  $$ insert into public.audit_logs (agency_id, action, resource_type) values ('a0000000-0000-0000-0000-000000000001', 'audit.forged', 'audit') $$,
  '42501',
  'permission denied for table audit_logs',
  'authenticated users cannot forge audit records'
);

select throws_ok(
  $$ select public.create_client('b0000000-0000-0000-0000-000000000001', 'Cross Tenant', 'cross-tenant') $$,
  '42501',
  'client creation permission required',
  'a forged agency identifier is rejected by the audited client workflow'
);

reset role;

select throws_ok(
  $$ insert into public.client_members (agency_id, client_id, profile_id, role_id, status, created_by) values ('a0000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'ac000000-0000-0000-0000-000000000001', 'invited', '10000000-0000-0000-0000-000000000001') $$,
  '23503',
  'insert or update on table "client_members" violates foreign key constraint "fk_client_members__agency_id_profile_id"',
  'a user cannot receive client access without an agency membership'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$ select slug from public.clients order by slug $$,
  array['client-a1']::text[],
  'a client member sees only their exact client workspace'
);

select is(
  private.is_client_member('b0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  false,
  'client membership never crosses agency and client boundaries'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$ select display_name from public.profiles order by display_name $$,
  array['Viewer A']::text[],
  'an agency member without member.read sees only their own profile'
);

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);

select is_empty(
  $$ select id from public.agencies $$,
  'a non-member cannot read any agency'
);

select is_empty(
  $$ select id from public.clients $$,
  'a non-member cannot read any client resource'
);

reset role;

select throws_ok(
  $$ update public.audit_logs set action = 'audit.changed' where resource_id = 'a1000000-0000-0000-0000-000000000001' $$,
  '55000',
  'audit logs are append-only',
  'audit records cannot be mutated even by a privileged database actor'
);

select * from finish();
rollback;
