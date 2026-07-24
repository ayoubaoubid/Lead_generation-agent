begin;

select plan(18);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('7a000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'targeting-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('7a000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'targeting-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table targeting_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  icp_profile_a uuid,
  icp_v1 uuid,
  icp_copy_v1 uuid,
  persona_v1 uuid,
  ai_v1 uuid,
  archive_v1 uuid,
  archive_profile uuid
) on commit drop;

insert into targeting_test_context default values;
grant select, update on targeting_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000001', true);

update targeting_test_context
set agency_a = public.create_agency('Targeting Agency A', 'targeting-agency-a');

update targeting_test_context
set client_a = public.create_client_profile(
  agency_a, 'Targeting Client A', 'targeting-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

select ok(
  private.has_permission(
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    'targeting.write'
  )
  and private.has_permission(
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    'targeting.validate'
  ),
  'Agency Owner receives targeting write and validation permissions'
);

update targeting_test_context
set icp_v1 = public.create_targeting_draft(
  agency_a, client_a, 'icp', 'ICP Industrie', null
);

update targeting_test_context
set icp_profile_a = (
  select profile_id from public.targeting_versions where id = icp_v1
);

select is(
  (
    select version_number
    from public.targeting_versions
    where id = (select icp_v1 from targeting_test_context)
  ),
  1,
  'a manual ICP starts with version one'
);

select throws_ok(
  format(
    'select public.save_targeting_draft(%L, %L, %L, %L, %L, %L::jsonb)',
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select icp_v1 from targeting_test_context),
    'icp',
    'ICP invalid',
    '{"industries":[]}'
  ),
  '23514',
  'invalid structured targeting content',
  'an incomplete JSON contract is rejected before persistence'
);

select lives_ok(
  format(
    'select public.save_targeting_draft(%L, %L, %L, %L, %L, %L::jsonb)',
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select icp_v1 from targeting_test_context),
    'icp',
    'ICP Industrie',
    '{
      "rationale":["Segment observé à tester"],
      "industries":["Industrie"],
      "countries":["France"],
      "companySizes":["PME"],
      "employeeCount":{"min":20,"max":200},
      "annualRevenue":{"min":null,"max":null,"currencyCode":""},
      "technologies":[],
      "maturityLevels":["Processus commercial établi"],
      "budget":{"min":null,"max":null,"currencyCode":""},
      "problems":["Qualification lente"],
      "intentSignals":["Recrutement SDR"],
      "exclusions":[],
      "scoringWeights":[
        {"criterion":"industry","weight":60},
        {"criterion":"problem","weight":40}
      ],
      "assumptions":["Budget à vérifier"],
      "missingEvidence":["Entretiens sur le budget"]
    }'
  ),
  'a complete structured ICP draft can be saved'
);

select is(
  public.validate_targeting_version(
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select icp_v1 from targeting_test_context),
    'icp'
  ),
  (select icp_v1 from targeting_test_context),
  'an authorized human validates the ICP'
);

select throws_ok(
  format(
    'select public.save_targeting_draft(%L, %L, %L, %L, %L, %L::jsonb)',
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select icp_v1 from targeting_test_context),
    'icp',
    'Mutation',
    '{}'
  ),
  '42501',
  'authorized targeting draft not found',
  'a validated ICP version is immutable'
);

select is(
  public.set_targeting_lifecycle(
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select icp_profile_a from targeting_test_context),
    'icp',
    'active'
  ),
  (select icp_profile_a from targeting_test_context),
  'only the latest validated ICP can be activated'
);

update targeting_test_context
set icp_copy_v1 = public.create_targeting_draft(
  agency_a, client_a, 'icp', 'ICP Industrie copie', icp_profile_a
);

select is(
  (
    select origin
    from public.targeting_versions
    where id = (select icp_copy_v1 from targeting_test_context)
  ),
  'duplicate'::public.targeting_version_origin,
  'duplication creates a distinct traceable draft'
);

select isnt(
  (
    select profile_id
    from public.targeting_versions
    where id = (select icp_copy_v1 from targeting_test_context)
  ),
  (select icp_profile_a from targeting_test_context),
  'a duplicate never mutates the source profile'
);

update targeting_test_context
set persona_v1 = public.create_targeting_draft(
  agency_a, client_a, 'persona', 'Directrice commerciale', null
);

select lives_ok(
  format(
    'select public.save_targeting_draft(%L, %L, %L, %L, %L, %L::jsonb)',
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select persona_v1 from targeting_test_context),
    'persona',
    'Directrice commerciale',
    '{
      "rationale":["Persona observé à tester"],
      "jobTitles":["Directrice commerciale"],
      "departments":["Sales"],
      "seniorityLevels":["Direction"],
      "responsibilities":["Prévisibilité du pipeline"],
      "goals":["Améliorer la qualification"],
      "problems":["Pipeline imprévisible"],
      "objections":["Données insuffisantes"],
      "decisionPower":"unknown",
      "buyingRoles":["Décideur"],
      "preferredChannels":["Email"],
      "assumptions":["Canal préféré à confirmer"],
      "missingEvidence":["Historique des réponses"]
    }'
  ),
  'a structured persona can be saved without inventing decision power'
);

select is(
  public.validate_targeting_version(
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    (select persona_v1 from targeting_test_context),
    'persona'
  ),
  (select persona_v1 from targeting_test_context),
  'an authorized human validates the persona'
);

update targeting_test_context
set ai_v1 = public.create_ai_targeting_proposal(
  agency_a,
  client_a,
  'persona',
  'Persona IA à vérifier',
  '{
    "rationale":[],
    "jobTitles":["Head of Sales"],
    "departments":["Sales"],
    "seniorityLevels":[],
    "responsibilities":[],
    "goals":[],
    "problems":[],
    "objections":[],
    "decisionPower":"unknown",
    "buyingRoles":[],
    "preferredChannels":[],
    "assumptions":["Rôle d’achat à vérifier"],
    "missingEvidence":["Entretien comportemental"]
  }'::jsonb,
  gen_random_uuid(),
  'openai/gpt-oss-20b',
  '1.0.0',
  'targeting-mom-test-v1',
  100,
  200,
  68,
  'groq-2026-07-24'
);

select results_eq(
  $$
    select status::text || ':' || origin::text
    from public.targeting_versions
    where id = (select ai_v1 from targeting_test_context)
  $$,
  array['draft:ai_proposal']::text[],
  'an AI proposal remains a draft with explicit provenance'
);

select is(
  (
    select lifecycle_status
    from public.targeting_profiles
    where id = (
      select profile_id
      from public.targeting_versions
      where id = (select ai_v1 from targeting_test_context)
    )
  ),
  'inactive'::public.targeting_lifecycle_status,
  'an AI proposal is never activated automatically'
);

select ok(
  exists (
    select 1
    from public.audit_logs
    where action = 'icp.validated'
      and client_id = (select client_a from targeting_test_context)
  )
  and exists (
    select 1
    from public.audit_logs
    where action = 'persona.ai_proposed'
      and client_id = (select client_a from targeting_test_context)
  ),
  'human validation and AI proposal creation are audited'
);

select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000002', true);

update targeting_test_context
set agency_b = public.create_agency('Targeting Agency B', 'targeting-agency-b');

update targeting_test_context
set client_b = public.create_client_profile(
  agency_b, 'Targeting Client B', 'targeting-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.targeting_profiles),
  0::bigint,
  'Agency B and Client B cannot read Agency A and Client A targeting data'
);

select throws_ok(
  format(
    'select public.create_targeting_draft(%L, %L, %L, %L, null)',
    (select agency_a from targeting_test_context),
    (select client_a from targeting_test_context),
    'icp',
    'Forged profile'
  ),
  '42501',
  'targeting.write permission required',
  'forged Agency A and Client A identifiers are rejected'
);

select throws_ok(
  format(
    'insert into public.targeting_profiles (agency_id, client_id, profile_type, name, created_by) values (%L, %L, %L, %L, %L)',
    (select agency_b from targeting_test_context),
    (select client_b from targeting_test_context),
    'icp',
    'Direct insert',
    '7a000000-0000-4000-8000-000000000002'
  ),
  '42501',
  null,
  'authenticated users cannot bypass RPC validation with direct writes'
);

update targeting_test_context
set archive_v1 = public.create_targeting_draft(
  agency_b, client_b, 'icp', 'Archive draft', null
);

update targeting_test_context
set archive_profile = (
  select profile_id
  from public.targeting_versions
  where id = archive_v1
);

select is(
  public.set_targeting_lifecycle(
    (select agency_b from targeting_test_context),
    (select client_b from targeting_test_context),
    (select archive_profile from targeting_test_context),
    'icp',
    'archived'
  ) is not null,
  true,
  'an authorized draft can be archived without soft-deleting its history'
);

select * from finish();
rollback;
