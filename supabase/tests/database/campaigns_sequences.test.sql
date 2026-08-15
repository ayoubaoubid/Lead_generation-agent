begin;

select plan(14);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('ab000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'campaign-owner-a@example.test', '', now(), '{}', '{"full_name":"Owner A"}', now(), now()),
  ('ab000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'campaign-owner-b@example.test', '', now(), '{}', '{"full_name":"Owner B"}', now(), now());

create temporary table campaign_test_context (
  agency_a uuid,
  agency_b uuid,
  client_a uuid,
  client_b uuid,
  campaign_a uuid
) on commit drop;

insert into campaign_test_context default values;
grant select, update on campaign_test_context to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ab000000-0000-4000-8000-000000000001', true);

update campaign_test_context
set agency_a = public.create_agency('Campaign Agency A', 'campaign-agency-a');

update campaign_test_context
set client_a = public.create_client_profile(
  agency_a, 'Campaign Client A', 'campaign-client-a', '', '', '', 'FR', 'fr',
  'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

update campaign_test_context
set campaign_a = public.create_campaign_draft(
  agency_a,
  client_a,
  jsonb_build_object(
    'name', 'Founders France',
    'objective', 'Obtenir des conversations qualifiées',
    'channel', 'email',
    'timezone', 'Europe/Paris',
    'sequenceName', 'Séquence fondatrice',
    'templateSubject', 'Question sur votre prospection',
    'templateBody', 'Bonjour {{firstName}}, voici un brouillon à personnaliser.',
    'scheduleRules', '{"weekdays":[1,2,3,4,5]}'::jsonb,
    'targetMetrics', '{}'::jsonb,
    'personaIds', '[]'::jsonb
  )
);

select is(
  (
    select status::text
    from public.campaigns
    where id = (select campaign_a from campaign_test_context)
  ),
  'draft',
  'a newly created campaign is always a draft'
);

select is(
  (
    select count(*)
    from public.campaign_sequences
    where campaign_id = (select campaign_a from campaign_test_context)
  ),
  1::bigint,
  'campaign creation provisions one active sequence'
);

select is(
  (
    select count(*)
    from public.campaign_sequence_steps steps
    join public.campaign_sequences sequences
      on sequences.id = steps.sequence_id
    where sequences.campaign_id = (select campaign_a from campaign_test_context)
  ),
  1::bigint,
  'campaign creation provisions a first cold email step'
);

select is(
  (
    select cardinality(steps.stop_rules)
    from public.campaign_sequence_steps steps
    join public.campaign_sequences sequences
      on sequences.id = steps.sequence_id
    where sequences.campaign_id = (select campaign_a from campaign_test_context)
  ),
  6,
  'the initial step carries every mandatory stop rule'
);

select throws_ok(
  format(
    'select public.transition_campaign(%L, %L, %L, %L)',
    (select agency_a from campaign_test_context),
    (select client_a from campaign_test_context),
    (select campaign_a from campaign_test_context),
    'approve'
  ),
  '55000',
  null,
  'a draft cannot be approved without review submission'
);

select lives_ok(
  format(
    'select public.transition_campaign(%L, %L, %L, %L)',
    (select agency_a from campaign_test_context),
    (select client_a from campaign_test_context),
    (select campaign_a from campaign_test_context),
    'submit'
  ),
  'an authorized owner can submit the campaign for review'
);

select is(
  (
    select status::text
    from public.campaigns
    where id = (select campaign_a from campaign_test_context)
  ),
  'ready_for_review',
  'submission moves the campaign to human review'
);

select lives_ok(
  format(
    'select public.transition_campaign(%L, %L, %L, %L)',
    (select agency_a from campaign_test_context),
    (select client_a from campaign_test_context),
    (select campaign_a from campaign_test_context),
    'approve'
  ),
  'an authorized owner can approve a reviewed campaign'
);

select lives_ok(
  format(
    'select public.transition_campaign(%L, %L, %L, %L, now() + interval ''1 day'')',
    (select agency_a from campaign_test_context),
    (select client_a from campaign_test_context),
    (select campaign_a from campaign_test_context),
    'schedule'
  ),
  'an approved campaign can be scheduled for a future instant'
);

select is(
  (
    select status::text
    from public.campaigns
    where id = (select campaign_a from campaign_test_context)
  ),
  'scheduled',
  'scheduling records the explicit campaign state'
);

select is(
  (
    select count(*)
    from public.audit_logs
    where resource_type = 'campaign'
      and resource_id = (select campaign_a::text from campaign_test_context)
  ),
  4::bigint,
  'creation and every successful transition are audited'
);

select throws_ok(
  format(
    'insert into public.campaigns (agency_id, client_id, name, objective, created_by, updated_by) values (%L, %L, %L, %L, %L, %L)',
    (select agency_a from campaign_test_context),
    (select client_a from campaign_test_context),
    'Direct campaign',
    'Bypass service',
    'ab000000-0000-4000-8000-000000000001',
    'ab000000-0000-4000-8000-000000000001'
  ),
  '42501',
  null,
  'authenticated users cannot bypass the campaign workflow'
);

select set_config('request.jwt.claim.sub', 'ab000000-0000-4000-8000-000000000002', true);

update campaign_test_context
set agency_b = public.create_agency('Campaign Agency B', 'campaign-agency-b');

update campaign_test_context
set client_b = public.create_client_profile(
  agency_b, 'Campaign Client B', 'campaign-client-b', '', '', '', 'MA', 'fr',
  'Africa/Casablanca', '', '', array[]::text[], 'onboarding'
);

select is(
  (select count(*) from public.campaigns),
  0::bigint,
  'Agency B cannot read Agency A campaigns'
);

select throws_ok(
  format(
    'select public.transition_campaign(%L, %L, %L, %L)',
    (select agency_a from campaign_test_context),
    (select client_a from campaign_test_context),
    (select campaign_a from campaign_test_context),
    'cancel'
  ),
  '42501',
  null,
  'a forged tenant transition is rejected'
);

select * from finish();
rollback;
