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
  ('79000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('79000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'recruiter-a@example.test', '', now(), '{}', '{"full_name":"Recruiter A"}', now(), now()),
  ('79000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now()),
  ('79000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@example.test', '', now(), '{}', '{"full_name":"Outsider"}', now(), now());

create temporary table operator_test_context (
  agency_a uuid,
  client_a1 uuid,
  client_a2 uuid,
  agency_b uuid,
  client_b1 uuid
) on commit drop;
insert into operator_test_context default values;
grant select, update on operator_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '79000000-0000-0000-0000-000000000001', true);

update operator_test_context
set agency_a = public.create_agency('Operator Agency A', 'operator-agency-a');
update operator_test_context
set
  client_a1 = public.create_client(agency_a, 'Assigned Client', 'assigned-client'),
  client_a2 = public.create_client(agency_a, 'Private Client', 'private-client');

select set_config('request.jwt.claim.sub', '79000000-0000-0000-0000-000000000003', true);
update operator_test_context
set agency_b = public.create_agency('Operator Agency B', 'operator-agency-b');
update operator_test_context
set client_b1 = public.create_client(agency_b, 'Agency B Client', 'agency-b-client');

select set_config('request.jwt.claim.sub', '79000000-0000-0000-0000-000000000001', true);
select public.invite_or_assign_recruiter(
  (select agency_a from operator_test_context),
  '79000000-0000-0000-0000-000000000002',
  array[(select client_a1 from operator_test_context)]
);

select throws_ok(
  format(
    'select public.invite_or_assign_recruiter(%L, %L, array[%L::uuid])',
    (select agency_a from operator_test_context),
    '79000000-0000-0000-0000-000000000002',
    (select client_b1 from operator_test_context)
  ),
  '42501',
  'client assignment outside agency',
  'Owner A cannot assign an Agency B client'
);

select set_config('request.jwt.claim.sub', '79000000-0000-0000-0000-000000000002', true);
select public.accept_pending_recruiter_invitations();

select ok(
  private.has_permission(
    (select agency_a from operator_test_context),
    (select client_a1 from operator_test_context),
    'lead.write'
  ),
  'Recruiter receives operational permission on the assigned client'
);

select results_eq(
  $$ select name from public.clients order by name $$,
  array['Assigned Client']::text[],
  'Recruiter sees only the explicitly assigned client'
);

select is(
  (select count(*) from public.clients where id = (select client_a2 from operator_test_context)),
  0::bigint,
  'Recruiter cannot read another client in the same agency'
);

select is(
  (select count(*) from public.clients where id = (select client_b1 from operator_test_context)),
  0::bigint,
  'Recruiter cannot read a client in another agency'
);

select throws_ok(
  format(
    'select public.update_client_profile(%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L::text[], %L)',
    (select agency_a from operator_test_context),
    (select client_a2 from operator_test_context),
    'Forged update',
    'private-client',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '{}',
    'active'
  ),
  '42501',
  'client management permission required',
  'a forged unassigned client identifier is rejected'
);

select throws_ok(
  format(
    'select public.create_client(%L, %L, %L)',
    (select agency_a from operator_test_context),
    'Forbidden Client',
    'forbidden-client'
  ),
  '42501',
  'client creation permission required',
  'Recruiter cannot create an agency client'
);

select throws_ok(
  format(
    'select public.invite_or_assign_recruiter(%L, %L, array[]::uuid[])',
    (select agency_a from operator_test_context),
    '79000000-0000-0000-0000-000000000004'
  ),
  '42501',
  'agency owner permission required',
  'Recruiter cannot invite another Recruiter'
);

select set_config('request.jwt.claim.sub', '79000000-0000-0000-0000-000000000004', true);

select is_empty(
  $$ select id from public.agencies $$,
  'a non-member cannot read an agency'
);

select is_empty(
  $$ select id from public.clients $$,
  'a non-member cannot read any client'
);

select set_config('request.jwt.claim.sub', '79000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*) from public.clients),
  2::bigint,
  'Agency Owner sees every client in their own agency'
);

select is(
  (select count(*) from public.clients where agency_id = (select agency_b from operator_test_context)),
  0::bigint,
  'Agency Owner A cannot read Agency B clients'
);

select * from finish();
rollback;
