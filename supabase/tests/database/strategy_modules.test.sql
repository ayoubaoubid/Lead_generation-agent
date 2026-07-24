begin;

select plan(20);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('79000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'strategy-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('79000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'strategy-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table strategy_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  proof_a uuid,
  authorization_a uuid,
  evidence_b uuid,
  positioning_v1 uuid,
  positioning_v2 uuid,
  offer_v1 uuid
) on commit drop;

insert into strategy_test_context default values;
grant select, update on strategy_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '79000000-0000-4000-8000-000000000001', true);

update strategy_test_context
set agency_a = public.create_agency('Strategy Agency A', 'strategy-agency-a');

update strategy_test_context
set client_a = public.create_client_profile(
  agency_a, 'Strategy Client A', 'strategy-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

select ok(
  private.has_permission(
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    'offer.write'
  ),
  'Agency Owner receives offer.write'
);

select throws_ok(
  format(
    'select public.create_strategy_evidence(%L, %L, %L, %L, %L, %L, %L, %L)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    'statistic', 'Unverified number', 'No source', 'confirmed', '', ''
  ),
  '23514',
  null,
  'confirmed evidence without a source is rejected'
);

select throws_ok(
  format(
    'select public.create_strategy_evidence(%L, %L, %L, %L, %L, %L, %L, %L)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    'document', 'Unsafe URL', 'Invalid protocol', 'confirmed',
    'javascript:alert(1)', ''
  ),
  '23514',
  null,
  'evidence source URLs are restricted to HTTP and HTTPS'
);

update strategy_test_context
set proof_a = public.create_strategy_evidence(
  agency_a, client_a, 'document', 'Verified source', 'A referenced document',
  'confirmed', 'https://example.test/proof', ''
);

update strategy_test_context
set authorization_a = public.create_strategy_evidence(
  agency_a, client_a, 'authorization', 'Guarantee authorization',
  'Explicit human authorization', 'confirmed', '',
  'Signed authorization STRATEGY-A'
);

update strategy_test_context
set positioning_v1 = public.create_positioning_draft(agency_a, client_a);

select is(
  (
    select version_number
    from public.strategy_versions
    where id = (select positioning_v1 from strategy_test_context)
  ),
  1,
  'the first positioning draft is version one'
);

select throws_ok(
  format(
    'select public.save_positioning_draft(%L, %L, %L, %L::jsonb)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select positioning_v1 from strategy_test_context),
    '[{"kind":"positioning_statement","value":"Unsupported fact","classification":"confirmed","evidenceIds":[]}]'
  ),
  '23514',
  'confirmed items require confirmed evidence',
  'a confirmed positioning claim without confirmed evidence is rejected'
);

select lives_ok(
  format(
    'select public.save_positioning_draft(%L, %L, %L, %L::jsonb)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select positioning_v1 from strategy_test_context),
    '[
      {"kind":"positioning_statement","value":"Positioning statement","classification":"hypothesis","evidenceIds":[]},
      {"kind":"competitive_alternative","value":"Spreadsheet","classification":"inferred","evidenceIds":[]},
      {"kind":"unique_capability","value":"Tenant controls","classification":"hypothesis","evidenceIds":[]},
      {"kind":"customer_value","value":"Controlled workflow","classification":"hypothesis","evidenceIds":[]},
      {"kind":"best_fit_segment","value":"Agencies","classification":"hypothesis","evidenceIds":[]},
      {"kind":"differentiator","value":"Human validation","classification":"hypothesis","evidenceIds":[]}
    ]'
  ),
  'a structured Obviously Awesome positioning draft can be saved'
);

select is(
  public.validate_positioning_version(
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select positioning_v1 from strategy_test_context)
  ),
  (select positioning_v1 from strategy_test_context),
  'an authorized human validates the complete positioning'
);

select is(
  (
    select status
    from public.strategy_versions
    where id = (select positioning_v1 from strategy_test_context)
  ),
  'validated'::public.strategy_version_status,
  'the positioning version persists as validated'
);

select throws_ok(
  format(
    'select public.save_positioning_draft(%L, %L, %L, %L::jsonb)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select positioning_v1 from strategy_test_context),
    '[]'
  ),
  '42501',
  'authorized draft version not found',
  'a validated positioning version is immutable'
);

update strategy_test_context
set positioning_v2 = public.create_positioning_draft(agency_a, client_a);

select is(
  (
    select version_number
    from public.strategy_versions
    where id = (select positioning_v2 from strategy_test_context)
  ),
  2,
  'a new positioning draft increments the version number'
);

select is(
  (
    select content
    from public.strategy_versions
    where id = (select positioning_v2 from strategy_test_context)
  ),
  (
    select content
    from public.strategy_versions
    where id = (select positioning_v1 from strategy_test_context)
  ),
  'the new draft starts from the latest version content'
);

select set_config('request.jwt.claim.sub', '79000000-0000-4000-8000-000000000002', true);

update strategy_test_context
set agency_b = public.create_agency('Strategy Agency B', 'strategy-agency-b');

update strategy_test_context
set client_b = public.create_client_profile(
  agency_b, 'Strategy Client B', 'strategy-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.strategy_artifacts),
  0::bigint,
  'Agency B cannot read Agency A strategy artifacts'
);

select throws_ok(
  format(
    'select public.create_positioning_draft(%L, %L)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context)
  ),
  '42501',
  'offer write permission required',
  'forged Agency A and Client A identifiers are rejected'
);

update strategy_test_context
set evidence_b = public.create_strategy_evidence(
  agency_b, client_b, 'document', 'Tenant B proof', 'Private evidence',
  'confirmed', 'https://example.test/tenant-b', ''
);

select set_config('request.jwt.claim.sub', '79000000-0000-4000-8000-000000000001', true);

select throws_ok(
  format(
    'select public.save_positioning_draft(%L, %L, %L, %L::jsonb)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select positioning_v2 from strategy_test_context),
    format(
      '[{"kind":"positioning_statement","value":"Cross tenant","classification":"confirmed","evidenceIds":["%s"]}]',
      (select evidence_b from strategy_test_context)
    )
  ),
  '42501',
  'cross-tenant or unavailable evidence reference',
  'cross-tenant evidence cannot be attached to a positioning version'
);

update strategy_test_context
set offer_v1 = public.create_offer_draft(
  agency_a, client_a, null, 'Controlled offer'
);

select is(
  (
    select framework
    from public.strategy_versions
    where id = (select offer_v1 from strategy_test_context)
  ),
  '100m-offers',
  'offer versions retain the 100M Offers framework'
);

select throws_ok(
  format(
    'select public.save_offer_draft(%L, %L, %L, %L, %L::jsonb)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select offer_v1 from strategy_test_context),
    'Controlled offer',
    format(
      '[{"kind":"guarantee","value":"Unauthorized guarantee","classification":"confirmed","evidenceIds":["%s"]}]',
      (select proof_a from strategy_test_context)
    )
  ),
  '23514',
  'confirmed guarantees require confirmed authorization',
  'a generic proof cannot authorize a confirmed guarantee'
);

select lives_ok(
  format(
    'select public.save_offer_draft(%L, %L, %L, %L, %L::jsonb)',
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select offer_v1 from strategy_test_context),
    'Controlled offer',
    format(
      '[
        {"kind":"desired_result","value":"Desired outcome","classification":"hypothesis","evidenceIds":[]},
        {"kind":"promise","value":"Conditional promise","classification":"inferred","evidenceIds":[]},
        {"kind":"timeline","value":"Timeline to validate","classification":"hypothesis","evidenceIds":[]},
        {"kind":"differentiator","value":"Controlled workflow","classification":"hypothesis","evidenceIds":[]},
        {"kind":"guarantee","value":"Authorized guarantee","classification":"confirmed","evidenceIds":["%s"]}
      ]',
      (select authorization_a from strategy_test_context)
    )
  ),
  'a structured 100M Offers draft with authorized guarantee can be saved'
);

select is(
  public.validate_offer_version(
    (select agency_a from strategy_test_context),
    (select client_a from strategy_test_context),
    (select offer_v1 from strategy_test_context)
  ),
  (select offer_v1 from strategy_test_context),
  'an authorized human validates the complete offer'
);

select is(
  (
    select status
    from public.strategy_versions
    where id = (select offer_v1 from strategy_test_context)
  ),
  'validated'::public.strategy_version_status,
  'the offer version persists as validated'
);

select ok(
  exists (
    select 1 from public.audit_logs
    where action = 'positioning.validated'
      and client_id = (select client_a from strategy_test_context)
  )
  and exists (
    select 1 from public.audit_logs
    where action = 'offer.validated'
      and client_id = (select client_a from strategy_test_context)
  ),
  'positioning and offer human validations are audited'
);

select * from finish();
rollback;
