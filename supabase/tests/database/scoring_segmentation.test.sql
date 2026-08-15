begin;

select plan(10);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('aa000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'score-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('aa000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'score-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table score_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  company_a uuid,
  contact_a uuid,
  model_a uuid,
  version_a uuid,
  score_a uuid,
  segment_a uuid
) on commit drop;

insert into score_test_context default values;
grant select, update on score_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'aa000000-0000-4000-8000-000000000001', true);

update score_test_context
set agency_a = public.create_agency('Score Agency A', 'score-agency-a');

update score_test_context
set client_a = public.create_client_profile(
  agency_a, 'Score Client A', 'score-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

update score_test_context
set company_a = public.create_company(
  agency_a, client_a,
  '{"name":"Score Company A","domain":"score-a.example","technologies":[]}'::jsonb
);

update score_test_context
set contact_a = public.create_contact(
  agency_a, client_a,
  jsonb_build_object(
    'companyId', company_a,
    'fullName', 'Score Contact A',
    'email', 'score-contact-a@example.test'
  )
);

reset role;

update score_test_context
set
  model_a = gen_random_uuid(),
  version_a = gen_random_uuid(),
  score_a = gen_random_uuid(),
  segment_a = gen_random_uuid();

insert into public.scoring_models (
  id, agency_id, client_id, name, created_by
)
select model_a, agency_a, client_a, 'Default model',
  'aa000000-0000-4000-8000-000000000001'
from score_test_context;

insert into public.scoring_model_versions (
  id, agency_id, client_id, model_id, version_number, configuration,
  configuration_hash, created_by
)
select
  version_a, agency_a, client_a, model_a, 1,
  '{"version":"1.0.0","componentWeights":{"fit":40,"intent":30,"data_quality":20,"engagement":10},"rules":[{"id":"fit-industry","component":"fit","field":"industry","operator":"equals","expected":"SaaS","weight":100}]}'::jsonb,
  repeat('a', 64), 'aa000000-0000-4000-8000-000000000001'
from score_test_context;

update public.scoring_models
set status = 'active', active_version_id = (
  select version_a from score_test_context
)
where id = (select model_a from score_test_context);

insert into public.lead_scores (
  id, agency_id, client_id, contact_id, company_id, model_version_id,
  fit_score, intent_score, data_quality_score, engagement_score, total_score,
  satisfied_criteria, missing_criteria, applied_weights, confidence_score,
  next_action, input_snapshot, input_fingerprint, explanation, calculated_by
)
select
  score_a, agency_a, client_a, contact_a, company_a, version_a,
  100, 50, 80, 20, 70, '["fit-industry"]', '[]',
  '{"fit-industry":100}', 95, 'prioritize',
  '{"industry":"SaaS"}', repeat('b', 64),
  '{"rules":[{"id":"fit-industry","matched":true}]}',
  'aa000000-0000-4000-8000-000000000001'
from score_test_context;

insert into public.segments (
  id, agency_id, client_id, name, status, filter_definition,
  created_by, updated_by
)
select
  segment_a, agency_a, client_a, 'Priority SaaS', 'active',
  '{"industries":["SaaS"],"minimumScore":70}',
  'aa000000-0000-4000-8000-000000000001',
  'aa000000-0000-4000-8000-000000000001'
from score_test_context;

insert into public.segment_memberships (
  agency_id, client_id, segment_id, contact_id, lead_score_id, matched_criteria
)
select agency_a, client_a, segment_a, contact_a, score_a,
  '["industry","minimum_score"]'
from score_test_context;

select has_table('public', 'lead_scores', 'lead score snapshots are durable');

select is(
  (
    select fit_score + intent_score + data_quality_score
      + engagement_score + total_score
    from public.lead_scores
    where id = (select score_a from score_test_context)
  ),
  320::smallint,
  'all five score values are stored'
);

select is(
  (
    select input_fingerprint
    from public.lead_scores
    where id = (select score_a from score_test_context)
  ),
  repeat('b', 64),
  'score inputs are fingerprinted for reproducibility'
);

select throws_ok(
  format(
    'update public.lead_scores set total_score = 101 where id = %L',
    (select score_a from score_test_context)
  ),
  '23514',
  null,
  'scores outside zero to one hundred are rejected'
);

select throws_ok(
  format(
    'insert into public.segments (agency_id, client_id, name, filter_definition, created_by, updated_by) values (%L, %L, %L, %L::jsonb, %L, %L)',
    (select agency_a from score_test_context),
    (select client_a from score_test_context),
    'Invalid filter',
    '[]',
    'aa000000-0000-4000-8000-000000000001',
    'aa000000-0000-4000-8000-000000000001'
  ),
  '23514',
  null,
  'segment filters must be structured objects'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'aa000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*) from public.lead_scores),
  1::bigint,
  'Agency A can read its score'
);

select is(
  (select count(*) from public.segment_memberships),
  1::bigint,
  'Agency A can read its segment membership'
);

select throws_ok(
  format(
    'insert into public.segments (agency_id, client_id, name, filter_definition, created_by, updated_by) values (%L, %L, %L, %L::jsonb, %L, %L)',
    (select agency_a from score_test_context),
    (select client_a from score_test_context),
    'Direct write',
    '{}',
    'aa000000-0000-4000-8000-000000000001',
    'aa000000-0000-4000-8000-000000000001'
  ),
  '42501',
  null,
  'authenticated users cannot bypass scoring services'
);

select set_config('request.jwt.claim.sub', 'aa000000-0000-4000-8000-000000000002', true);

update score_test_context
set agency_b = public.create_agency('Score Agency B', 'score-agency-b');

update score_test_context
set client_b = public.create_client_profile(
  agency_b, 'Score Client B', 'score-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.lead_scores),
  0::bigint,
  'Agency B cannot read Agency A scores'
);

select is(
  (select count(*) from public.segments),
  0::bigint,
  'Agency B cannot read Agency A segments'
);

select * from finish();
rollback;
