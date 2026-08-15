begin;

select plan(16);

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
  ('76000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clients-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('76000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clients-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now()),
  ('76000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clients-viewer-a@example.test', '', now(), '{}', '{"full_name":"Viewer A"}', now(), now());

create temporary table clients_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid
) on commit drop;

insert into clients_test_context default values;
grant select, update on clients_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000001', true);

update clients_test_context
set agency_a = public.create_agency('Clients Agency A', 'clients-agency-a');

update clients_test_context
set client_a = public.create_client_profile(
  agency_a,
  'Client Alpha',
  'client-alpha',
  'Client Alpha SAS',
  'https://alpha.example.test',
  'Logiciels B2B',
  'FR',
  'fr-FR',
  'Europe/Paris',
  'Contexte Alpha',
  'https://cdn.example.test/alpha.svg',
  array['Qualifier les comptes prioritaires'],
  'onboarding'
);

select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000002', true);

update clients_test_context
set agency_b = public.create_agency('Clients Agency B', 'clients-agency-b');

update clients_test_context
set client_b = public.create_client_profile(
  agency_b,
  'Client Beta',
  'client-beta',
  '',
  '',
  '',
  'MA',
  'fr',
  'Africa/Casablanca',
  '',
  '',
  array[]::text[],
  'draft'
);

reset role;

insert into public.agency_members (
  agency_id,
  profile_id,
  role_id,
  status,
  created_by
)
select
  context.agency_a,
  '76000000-0000-0000-0000-000000000003',
  role.id,
  'active',
  '76000000-0000-0000-0000-000000000001'
from clients_test_context as context
 join public.roles as role
  on role.agency_id = context.agency_a
 and role.client_id is null
 and role.slug = 'recruiter';

insert into public.client_members (
  agency_id,
  client_id,
  profile_id,
  role_id,
  status,
  created_by
)
select
  context.agency_a,
  context.client_a,
  '76000000-0000-0000-0000-000000000003',
  role.id,
  'active',
  '76000000-0000-0000-0000-000000000001'
from clients_test_context as context
 join public.roles as role
  on role.agency_id = context.agency_a
 and role.client_id = context.client_a
 and role.slug = 'recruiter';

select ok(
  exists (
    select 1 from public.permissions
    where key = 'client.archive'
      and allowed_scopes = array['agency'::public.role_scope]
  ),
  'client.archive is an atomic agency-scoped permission'
);

select is(
  (
    select legal_name
    from public.clients
    where id = (select client_a from clients_test_context)
  ),
  'Client Alpha SAS',
  'the complete client profile is persisted'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*) from public.clients),
  1::bigint,
  'Agency A owner sees only Agency A clients through RLS'
);

select is(
  (
    select count(*)
    from public.clients
    where id = (select client_b from clients_test_context)
  ),
  0::bigint,
  'Agency A cannot read Client B'
);

select throws_ok(
  format(
    'select public.archive_client(%L, %L)',
    (select agency_b from clients_test_context),
    (select client_b from clients_test_context)
  ),
  '42501',
  'client archive permission required',
  'a forged Agency B and Client B pair is rejected'
);

select ok(
  private.has_permission(
    (select agency_a from clients_test_context),
    (select client_a from clients_test_context),
    'client.archive'
  ),
  'Agency Owner receives the archive permission'
);

select is(
  public.update_client_profile(
    (select agency_a from clients_test_context),
    (select client_a from clients_test_context),
    'Client Alpha Updated',
    'client-alpha',
    'Client Alpha SAS',
    'https://alpha.example.test',
    'Logiciels B2B',
    'FR',
    'fr-FR',
    'Europe/Paris',
    'Contexte Alpha mis à jour',
    'https://cdn.example.test/alpha.svg',
    array['Qualifier les comptes prioritaires'],
    'active'
  ),
  (select client_a from clients_test_context),
  'an authorized manager can update the profile'
);

select ok(
  exists (
    select 1
    from public.audit_logs
    where client_id = (select client_a from clients_test_context)
      and action = 'client.updated'
  ),
  'the update is audited'
);

select throws_ok(
  format(
    'update public.clients set name = %L where id = %L',
    'Direct update',
    (select client_a from clients_test_context)
  ),
  '42501',
  null,
  'authenticated users cannot bypass the audited update RPC'
);

select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000003', true);

select is(
  (
    select count(*)
    from public.clients
    where id = (select client_a from clients_test_context)
  ),
  1::bigint,
  'an assigned Recruiter can consult its client'
);

select is(
  private.has_permission(
    (select agency_a from clients_test_context),
    (select client_a from clients_test_context),
    'client.archive'
  ),
  false,
  'Recruiter cannot archive a client'
);

select throws_ok(
  format(
    'select public.archive_client(%L, %L)',
    (select agency_a from clients_test_context),
    (select client_a from clients_test_context)
  ),
  '42501',
  'client archive permission required',
  'Recruiter archive attempt is rejected'
);

select set_config('request.jwt.claim.sub', '76000000-0000-0000-0000-000000000001', true);

select is(
  public.archive_client(
    (select agency_a from clients_test_context),
    (select client_a from clients_test_context)
  ),
  (select client_a from clients_test_context),
  'Agency Owner can run the controlled archive transition'
);

select ok(
  exists (
    select 1
    from public.clients
    where id = (select client_a from clients_test_context)
      and status = 'archived'
      and archived_at is not null
      and archived_by = '76000000-0000-0000-0000-000000000001'
  ),
  'archive status, timestamp and actor remain consistent'
);

select ok(
  exists (
    select 1
    from public.audit_logs
    where client_id = (select client_a from clients_test_context)
      and action = 'client.archived'
      and created_by = '76000000-0000-0000-0000-000000000001'
  ),
  'the controlled archive is audited'
);

select throws_ok(
  format(
    'select public.update_client_profile(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L::text[], %L)',
    (select agency_a from clients_test_context),
    (select client_a from clients_test_context),
    'Archived Client',
    'client-alpha',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{}',
    'paused'
  ),
  '55000',
  'client is archived',
  'an archived client cannot be edited'
);

select * from finish();
rollback;
