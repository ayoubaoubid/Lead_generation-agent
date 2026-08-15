begin;

select plan(17);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('ac000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'message-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('ac000000-0000-4000-8000-000000000002', '00000000-0000-0000-8000-000000000000', 'authenticated', 'authenticated', 'message-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table message_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  company_a uuid,
  contact_a uuid,
  campaign_a uuid,
  sequence_a uuid,
  step_a uuid,
  prospect_a uuid,
  version_a uuid,
  message_a uuid
) on commit drop;

insert into message_test_context default values;
grant select, update on message_test_context to authenticated;
grant select, update on message_test_context to service_role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac000000-0000-4000-8000-000000000001', true);

update message_test_context
set agency_a = public.create_agency('Message Agency A', 'message-agency-a');

update message_test_context
set client_a = public.create_client_profile(
  agency_a, 'Message Client A', 'message-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

update message_test_context
set company_a = public.create_company(
  agency_a,
  client_a,
  '{"name":"Message Company A","domain":"message-a.example","technologies":[]}'::jsonb
);

update message_test_context
set contact_a = public.create_contact(
  agency_a,
  client_a,
  jsonb_build_object(
    'companyId', company_a,
    'fullName', 'Message Contact A',
    'email', 'message-contact-a@example.test'
  )
);

update message_test_context
set campaign_a = public.create_campaign_draft(
  agency_a,
  client_a,
  jsonb_build_object(
    'name', 'Message campaign',
    'objective', 'Tester le workflow de revue',
    'channel', 'email',
    'timezone', 'Europe/Paris',
    'sequenceName', 'Séquence de test',
    'templateSubject', 'Question rapide',
    'templateBody', 'Ce template sera remplacé par une variante fondée.',
    'personaIds', '[]'::jsonb
  )
);

reset role;

update message_test_context context
set
  sequence_a = sequences.id,
  step_a = steps.id
from public.campaign_sequences sequences
join public.campaign_sequence_steps steps
  on steps.sequence_id = sequences.id
where sequences.campaign_id = context.campaign_a;

update message_test_context set prospect_a = gen_random_uuid();

insert into public.campaign_prospects (
  id, agency_id, client_id, campaign_id, contact_id
)
select prospect_a, agency_a, client_a, campaign_a, contact_a
from message_test_context;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac000000-0000-4000-8000-000000000001', true);

update message_test_context
set version_a = public.create_campaign_message_variant(
  agency_a,
  client_a,
  jsonb_build_object(
    'campaignId', campaign_a,
    'campaignProspectId', prospect_a,
    'sequenceStepId', step_a,
    'origin', 'ai_generated',
    'format', 'cold_email',
    'subject', 'Question rapide',
    'body', array_to_string(array_fill('mot'::text, array[50]), ' '),
    'callToAction', 'Ouvert à un échange de quinze minutes ?',
    'mainIdea', 'Vérifier si le problème est prioritaire.',
    'groundedStatements', '[]'::jsonb,
    'missingEvidence', '[]'::jsonb,
    'inputSnapshot', '{"references":[]}'::jsonb,
    'skillVersions', jsonb_build_object(
      'storybrand', '1.0.0',
      'made-to-stick', '1.0.0',
      'obviously-awesome', '1.0.0',
      '100m-offers', '1.0.0'
    ),
    'aiExecutionId', 'ac100000-0000-4000-8000-000000000001',
    'generationCostMicrousd', 1200,
    'generationTokens', 250
  )
);

update message_test_context context
set message_a = versions.message_id
from public.campaign_message_versions versions
where versions.id = context.version_a;

select is(
  (
    select status::text
    from public.campaign_message_versions
    where id = (select version_a from message_test_context)
  ),
  'draft',
  'generated content remains a draft'
);

select is(
  (
    select word_count
    from public.campaign_message_versions
    where id = (select version_a from message_test_context)
  ),
  50,
  'cold email word count is calculated by the database'
);

select is(
  (
    select current_version_id
    from public.campaign_messages
    where id = (select message_a from message_test_context)
  ),
  (select version_a from message_test_context),
  'the aggregate points to the current immutable variant'
);

select throws_ok(
  format(
    'select public.create_campaign_message_variant(%L, %L, %L::jsonb)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    jsonb_build_object(
      'messageId', (select message_a from message_test_context),
      'campaignId', (select campaign_a from message_test_context),
      'campaignProspectId', (select prospect_a from message_test_context),
      'sequenceStepId', (select step_a from message_test_context),
      'origin', 'human_edit',
      'format', 'cold_email',
      'subject', 'Trop court',
      'body', 'Message trop court',
      'callToAction', 'Échanger ?',
      'mainIdea', 'Test',
      'inputSnapshot', '{}'::jsonb,
      'skillVersions', '{"human":"1"}'::jsonb
    )::text
  ),
  '23514',
  null,
  'cold emails outside the required length are rejected'
);

select lives_ok(
  format(
    'select public.submit_campaign_message_for_review(%L, %L, %L)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    (select version_a from message_test_context)
  ),
  'a writer can submit a draft to quality review'
);

select is(
  (
    select status::text
    from public.campaign_message_versions
    where id = (select version_a from message_test_context)
  ),
  'quality_review_pending',
  'quality review is the first mandatory gate'
);

select throws_ok(
  format(
    'select public.review_campaign_message(%L, %L, %L, %L::public.message_review_type, %L::public.message_review_decision, %L::jsonb)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    (select version_a from message_test_context),
    'quality',
    'approve',
    '{"issues":[],"scores":{}}'
  ),
  '42501',
  null,
  'a browser identity cannot forge an automated quality review'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);

select lives_ok(
  format(
    'select public.record_campaign_message_machine_review(%L, %L, %L, %L::public.message_review_type, %L::public.message_review_decision, %L::jsonb)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    (select version_a from message_test_context),
    'quality',
    'approve',
    '{"issues":[],"scores":{"clarity":9},"agentId":"message-quality-agent","agentVersion":"1.0.0","skillId":"made-to-stick","skillVersion":"1.0.0","promptVersion":"1","modelId":"test-model","aiExecutionId":"ac200000-0000-4000-8000-000000000001"}'
  ),
  'quality review can advance a grounded message'
);

select is(
  (
    select status::text
    from public.campaign_message_versions
    where id = (select version_a from message_test_context)
  ),
  'compliance_review_pending',
  'compliance review follows quality review'
);

select lives_ok(
  format(
    'select public.record_campaign_message_machine_review(%L, %L, %L, %L::public.message_review_type, %L::public.message_review_decision, %L::jsonb)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    (select version_a from message_test_context),
    'compliance',
    'approve',
    '{"issues":[],"scores":{},"agentId":"compliance-agent","agentVersion":"1.0.0","skillId":"compliance-policy","skillVersion":"1.0.0","promptVersion":"1","modelId":"deterministic"}'
  ),
  'compliance review can advance an eligible message'
);

select is(
  (
    select status::text
    from public.campaign_message_versions
    where id = (select version_a from message_test_context)
  ),
  'human_review_pending',
  'machine reviews never bypass human review'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ac000000-0000-4000-8000-000000000001', true);

select lives_ok(
  format(
    'select public.review_campaign_message(%L, %L, %L, %L::public.message_review_type, %L::public.message_review_decision, %L::jsonb)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    (select version_a from message_test_context),
    'human',
    'approve',
    '{"issues":[],"scores":{}}'
  ),
  'an authorized human can approve the exact reviewed version'
);

select is(
  (
    select status::text
    from public.campaign_message_versions
    where id = (select version_a from message_test_context)
  ),
  'approved',
  'the exact reviewed version becomes approved'
);

select is(
  (
    select count(*)
    from public.campaign_message_reviews
    where message_version_id = (select version_a from message_test_context)
  ),
  3::bigint,
  'quality, compliance and human review evidence is retained'
);

select throws_ok(
  format(
    'update public.campaign_message_versions set status = %L where id = %L',
    'approved',
    (select version_a from message_test_context)
  ),
  '42501',
  null,
  'direct approval bypass is denied'
);

select set_config('request.jwt.claim.sub', 'ac000000-0000-4000-8000-000000000002', true);

update message_test_context
set agency_b = public.create_agency('Message Agency B', 'message-agency-b');

update message_test_context
set client_b = public.create_client_profile(
  agency_b, 'Message Client B', 'message-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.campaign_message_versions),
  0::bigint,
  'Agency B cannot read Agency A message variants'
);

select throws_ok(
  format(
    'select public.submit_campaign_message_for_review(%L, %L, %L)',
    (select agency_a from message_test_context),
    (select client_a from message_test_context),
    (select version_a from message_test_context)
  ),
  '42501',
  null,
  'a forged tenant review request is rejected'
);

select * from finish();
rollback;
