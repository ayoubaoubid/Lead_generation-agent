begin;

select plan(11);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('9a000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'provider-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('9a000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'provider-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table provider_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  company_a uuid,
  contact_a uuid,
  operation_a uuid
) on commit drop;

insert into provider_test_context default values;
grant select, update on provider_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '9a000000-0000-4000-8000-000000000001', true);

update provider_test_context
set agency_a = public.create_agency('Provider Agency A', 'provider-agency-a');

update provider_test_context
set client_a = public.create_client_profile(
  agency_a, 'Provider Client A', 'provider-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

update provider_test_context
set company_a = public.create_company(
  agency_a,
  client_a,
  '{"name":"Provider Company A","domain":"provider-a.example","technologies":[]}'::jsonb
);

update provider_test_context
set contact_a = public.create_contact(
  agency_a,
  client_a,
  jsonb_build_object(
    'companyId', company_a,
    'fullName', 'Provider Contact A',
    'email', 'provider-contact-a@example.test'
  )
);

reset role;

update provider_test_context
set operation_a = gen_random_uuid();

insert into public.provider_operations (
  id, agency_id, client_id, operation_kind, status, provider, company_id,
  idempotency_key, input_fingerprint, source, confidence_score, cost_amount,
  cost_currency, sanitized_raw_result, normalized_result, completed_at,
  created_by
)
select
  operation_a, agency_a, client_a, 'company_enrichment', 'completed',
  'development-mock', company_a, 'company:test:provider-a',
  repeat('a', 64), 'development-mock', null, 0, 'USD',
  '{"mode":"passthrough"}'::jsonb,
  '{"legalName":"Provider Company A","source":"development-mock"}'::jsonb,
  statement_timestamp(), '9a000000-0000-4000-8000-000000000001'
from provider_test_context;

select has_table(
  'public',
  'provider_operations',
  'provider operations have a durable ledger'
);

select is(
  (
    select string_agg(enumlabel::text, ',' order by enumsortorder)
    from pg_enum
    join pg_type on pg_type.oid = pg_enum.enumtypid
    where pg_type.typname = 'email_verification_result'
  ),
  'valid,risky,catch_all,unknown,invalid,disposable,role_based,bounced,suppressed,unsubscribed',
  'email verification statuses match the normalized contract'
);

select throws_ok(
  format(
    'insert into public.provider_operations (agency_id, client_id, operation_kind, provider, company_id, idempotency_key, input_fingerprint, sanitized_raw_result) values (%L, %L, %L, %L, %L, %L, %L, %L::jsonb)',
    (select agency_a from provider_test_context),
    (select client_a from provider_test_context),
    'company_enrichment',
    'unsafe-provider',
    (select company_a from provider_test_context),
    'company:test:unsafe-raw',
    repeat('b', 64),
    '["not-an-object"]'
  ),
  '23514',
  null,
  'provider raw results must be sanitized objects'
);

select throws_ok(
  format(
    'insert into public.provider_operations (agency_id, client_id, operation_kind, provider, contact_id, idempotency_key, input_fingerprint) values (%L, %L, %L, %L, %L, %L, %L)',
    (select agency_a from provider_test_context),
    (select client_a from provider_test_context),
    'company_enrichment',
    'development-mock',
    (select contact_a from provider_test_context),
    'company:test:wrong-resource',
    repeat('c', 64)
  ),
  '23514',
  null,
  'operation kinds cannot be associated with the wrong resource type'
);

select throws_ok(
  format(
    'insert into public.provider_operations (agency_id, client_id, operation_kind, provider, company_id, idempotency_key, input_fingerprint, status) values (%L, %L, %L, %L, %L, %L, %L, %L)',
    (select agency_a from provider_test_context),
    (select client_a from provider_test_context),
    'company_enrichment',
    'development-mock',
    (select company_a from provider_test_context),
    'company:test:invalid-lifecycle',
    repeat('d', 64),
    'completed'
  ),
  '23514',
  null,
  'completed operations require a timestamp and normalized result'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '9a000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*) from public.provider_operations),
  1::bigint,
  'Agency A can read its provider operation'
);

select throws_ok(
  format(
    'insert into public.provider_operations (agency_id, client_id, operation_kind, provider, company_id, idempotency_key, input_fingerprint) values (%L, %L, %L, %L, %L, %L, %L)',
    (select agency_a from provider_test_context),
    (select client_a from provider_test_context),
    'company_enrichment',
    'development-mock',
    (select company_a from provider_test_context),
    'company:test:direct-write',
    repeat('e', 64)
  ),
  '42501',
  null,
  'authenticated users cannot write provider operations directly'
);

select set_config('request.jwt.claim.sub', '9a000000-0000-4000-8000-000000000002', true);

update provider_test_context
set agency_b = public.create_agency('Provider Agency B', 'provider-agency-b');

update provider_test_context
set client_b = public.create_client_profile(
  agency_b, 'Provider Client B', 'provider-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.provider_operations),
  0::bigint,
  'Agency B cannot read Agency A provider operations'
);

select is(
  (
    select count(*)
    from public.provider_operations
    where agency_id = (select agency_a from provider_test_context)
      and client_id = (select client_a from provider_test_context)
  ),
  0::bigint,
  'forged tenant filters do not bypass RLS'
);

reset role;

select throws_ok(
  format(
    'insert into public.provider_operations (agency_id, client_id, operation_kind, provider, company_id, idempotency_key, input_fingerprint) values (%L, %L, %L, %L, %L, %L, %L)',
    (select agency_b from provider_test_context),
    (select client_b from provider_test_context),
    'company_enrichment',
    'development-mock',
    (select company_a from provider_test_context),
    'company:test:cross-tenant',
    repeat('f', 64)
  ),
  '23503',
  null,
  'tenant-aware foreign keys reject cross-client resources'
);

select is(
  (
    select cost_amount
    from public.provider_operations
    where id = (select operation_a from provider_test_context)
  ),
  0::numeric,
  'technical provider cost is recorded independently of billing'
);

select * from finish();
rollback;
