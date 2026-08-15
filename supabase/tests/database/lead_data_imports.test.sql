begin;

select plan(19);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('8a000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lead-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('8a000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lead-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table lead_data_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  company_a uuid,
  contact_a uuid,
  import_a uuid
) on commit drop;

insert into lead_data_test_context default values;
grant select, update on lead_data_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '8a000000-0000-4000-8000-000000000001', true);

update lead_data_test_context
set agency_a = public.create_agency('Lead Data Agency A', 'lead-data-agency-a');

update lead_data_test_context
set client_a = public.create_client_profile(
  agency_a, 'Lead Data Client A', 'lead-data-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

select ok(
  private.has_permission(
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    'lead.read'
  )
  and private.has_permission(
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    'lead.write'
  ),
  'Agency Owner receives lead read and write permissions'
);

update lead_data_test_context
set company_a = public.create_company(
  agency_a,
  client_a,
  '{
    "name":"Àcme France",
    "domain":"https://www.Acme.example/about",
    "factStatus":"confirmed",
    "confidenceScore":90,
    "sourceProvider":"manual-review",
    "externalId":"company-001",
    "technologies":[]
  }'::jsonb
);

select is(
  (
    select normalized_name || ':' || domain
    from public.companies
    where id = (select company_a from lead_data_test_context)
  ),
  'acme france:acme.example',
  'company identity fields are normalized before persistence'
);

select throws_ok(
  format(
    'select public.create_company(%L, %L, %L::jsonb)',
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    '{"name":"Other spelling","domain":"acme.example","technologies":[]}'
  ),
  '23505',
  'A matching company already exists.',
  'an active domain cannot create a second company in the same client'
);

select throws_ok(
  format(
    'select public.create_company(%L, %L, %L::jsonb)',
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    '{"name":"Acme source conflict","domain":"other.example","sourceProvider":"MANUAL-REVIEW","externalId":"company-001","technologies":[]}'
  ),
  '23505',
  null,
  'a provider external identifier is unique per tenant and entity type'
);

update lead_data_test_context
set contact_a = public.create_contact(
  agency_a,
  client_a,
  jsonb_build_object(
    'companyId', company_a,
    'firstName', 'Ada',
    'lastName', 'Lovelace',
    'email', 'ADA@EXAMPLE.COM',
    'linkedinUrl', 'https://www.linkedin.com/in/ada-lovelace/',
    'factStatus', 'confirmed',
    'sourceProvider', 'manual-review',
    'externalId', 'contact-001'
  )
);

select results_eq(
  $$
    select email || ':' || linkedin_url
    from public.contacts
    where id = (select contact_a from lead_data_test_context)
  $$,
  array['ada@example.com:https://www.linkedin.com/in/ada-lovelace']::text[],
  'email and LinkedIn URL are normalized'
);

select throws_ok(
  format(
    'select public.create_contact(%L, %L, %L::jsonb)',
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    '{"fullName":"Duplicate Ada","email":"ada@example.com"}'
  ),
  '23505',
  'A matching contact already exists.',
  'contact email deduplication is tenant-scoped'
);

select is(
  (
    select count(*)
    from public.company_sources
    where company_id = (select company_a from lead_data_test_context)
  ),
  1::bigint,
  'company provenance is recorded separately'
);

select is(
  (
    select count(*)
    from public.contact_sources
    where contact_id = (select contact_a from lead_data_test_context)
  ),
  1::bigint,
  'contact provenance is recorded separately'
);

update lead_data_test_context
set import_a = (
  select (result ->> 'id')::uuid
  from (
    select public.prepare_data_import(
      agency_a,
      client_a,
      'company',
      'companies.csv',
      'text/csv',
      128,
      repeat('a', 64),
      ',',
      '{"name":"Company","domain":"Domain"}'::jsonb,
      2
    ) as result
    from lead_data_test_context
  ) as prepared
);

select ok(
  (
    select storage_path like '%/companies.csv'
    from public.data_imports
    where id = (select import_a from lead_data_test_context)
  ),
  'an import receives a private tenant-aware object path'
);

select is(
  public.request_data_import_cancellation(
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    (select import_a from lead_data_test_context)
  ),
  (select import_a from lead_data_test_context),
  'a draft import can be cancelled'
);

select is(
  (
    select status
    from public.data_imports
    where id = (select import_a from lead_data_test_context)
  ),
  'cancelled'::public.data_import_status,
  'cancellation is a durable terminal state before processing starts'
);

select ok(
  exists (
    select 1 from public.audit_logs
    where action = 'company.created'
      and resource_id = (select company_a::text from lead_data_test_context)
  )
  and exists (
    select 1 from public.audit_logs
    where action = 'import.cancellation_requested'
      and resource_id = (select import_a::text from lead_data_test_context)
  ),
  'lead data mutations and import cancellation are audited'
);

select set_config('request.jwt.claim.sub', '8a000000-0000-4000-8000-000000000002', true);

update lead_data_test_context
set agency_b = public.create_agency('Lead Data Agency B', 'lead-data-agency-b');

update lead_data_test_context
set client_b = public.create_client_profile(
  agency_b, 'Lead Data Client B', 'lead-data-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.companies),
  0::bigint,
  'Agency B cannot read Agency A companies'
);

select is(
  (select count(*) from public.contacts),
  0::bigint,
  'Agency B cannot read Agency A contacts'
);

select is(
  (select count(*) from public.data_imports),
  0::bigint,
  'Agency B cannot read Agency A import history'
);

select throws_ok(
  format(
    'select public.create_company(%L, %L, %L::jsonb)',
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    '{"name":"Forged company","domain":"forged.example","technologies":[]}'
  ),
  '42501',
  'Company creation is not authorized.',
  'forged Agency A and Client A identifiers are rejected'
);

select throws_ok(
  format(
    'select public.create_contact(%L, %L, %L::jsonb)',
    (select agency_b from lead_data_test_context),
    (select client_b from lead_data_test_context),
    jsonb_build_object(
      'companyId', (select company_a from lead_data_test_context),
      'fullName', 'Cross tenant',
      'email', 'cross@example.test'
    )
  ),
  '23503',
  'The company does not belong to this tenant.',
  'a contact cannot reference a company from another tenant'
);

select throws_ok(
  format(
    'select public.prepare_data_import(%L, %L, %L, %L, %L, %s, %L, %L, %L::jsonb, %s)',
    (select agency_a from lead_data_test_context),
    (select client_a from lead_data_test_context),
    'company',
    'forged.csv',
    'text/csv',
    100,
    repeat('b', 64),
    ',',
    '{"name":"Company"}',
    1
  ),
  '42501',
  'Import creation is not authorized.',
  'forged tenant identifiers cannot prepare an import'
);

select throws_ok(
  format(
    'insert into public.companies (agency_id, client_id, name, normalized_name, created_by) values (%L, %L, %L, %L, %L)',
    (select agency_b from lead_data_test_context),
    (select client_b from lead_data_test_context),
    'Direct insert',
    'direct insert',
    '8a000000-0000-4000-8000-000000000002'
  ),
  '42501',
  null,
  'authenticated users cannot bypass RPC validation with direct writes'
);

select * from finish();
rollback;
