begin;

select plan(28);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    'd1000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ops-owner-a@example.test', '', now(),
    '{}', '{"full_name":"Owner A"}', now(), now()
  ),
  (
    'd1000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'ops-owner-b@example.test', '', now(),
    '{}', '{"full_name":"Owner B"}', now(), now()
  );

create temporary table ops_context (
  agency_a uuid,
  client_a uuid,
  agency_b uuid,
  client_b uuid,
  task_run_id uuid,
  pipeline_count integer
) on commit drop;
insert into ops_context default values;
grant select, update on ops_context to authenticated, service_role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);

update ops_context set agency_a = public.create_agency(
  'Operations Agency A', 'operations-agency-a'
);
update ops_context set client_a = public.create_client_profile(
  agency_a, 'Operations Client A', 'operations-client-a', '', '', '', 'FR',
  'fr', 'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

select has_table('public', 'sending_accounts', 'sending accounts exist');
select has_table('public', 'deliverability_checks', 'deliverability checks exist');
select has_table('public', 'outbound_messages', 'outbound ledger exists');
select has_table('public', 'delivery_attempts', 'technical attempts exist');
select has_table('public', 'inbound_messages', 'inbox messages exist');
select has_table('public', 'meetings', 'meetings exist');
select has_table('public', 'pipeline_stages', 'pipeline stages exist');
select has_table('public', 'opportunities', 'opportunities exist');
select has_table('public', 'analytics_daily_metrics', 'analytics snapshots exist');
select has_table('public', 'suppression_entries', 'suppression ledger exists');
select has_table('public', 'async_task_runs', 'async task ledger exists');

update ops_context set pipeline_count = public.ensure_default_pipeline(
  agency_a, client_a
);
select is(
  (select pipeline_count from ops_context),
  13,
  'the default pipeline creates exactly the documented stages'
);
select is(
  (
    select count(*)::integer from public.pipeline_stages
    where agency_id = (select agency_a from ops_context)
      and client_id = (select client_a from ops_context)
  ),
  13,
  'the owner can read the current client pipeline'
);

select ok(
  public.add_suppression_entry(
    (select agency_a from ops_context),
    (select client_a from ops_context),
    'Stop.Me@Example.test',
    'unsubscribe',
    'client',
    'test',
    null
  ) is not null,
  'an authorized user can add a client suppression'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);

select ok(
  public.is_email_suppressed(
    (select agency_a from ops_context),
    (select client_a from ops_context),
    ' stop.me@example.test '
  ),
  'suppression matching is normalized and case-insensitive'
);

update ops_context set task_run_id = (
  public.claim_async_task_run(
    agency_a,
    client_a,
    'd1000000-0000-4000-8000-000000000001',
    'report.generateDaily',
    'client',
    client_a,
    'daily-report:operations-client-a:2026-07-26',
    'run_ops_1'
  ) ->> 'taskRunId'
)::uuid;

select is(
  (
    public.claim_async_task_run(
      agency_a,
      client_a,
      'd1000000-0000-4000-8000-000000000001',
      'report.generateDaily',
      'client',
      client_a,
      'daily-report:operations-client-a:2026-07-26',
      'run_ops_1_retry'
    ) ->> 'shouldExecute'
  )::boolean,
  false,
  'a concurrent duplicate cannot execute the same business effect'
) from ops_context;

select lives_ok(
  format(
    'select public.fail_async_task_run(%L::uuid, %L, %L, %L)',
    (select task_run_id from ops_context),
    'retryable',
    'TRANSIENT_TEST',
    'Transient test failure.'
  ),
  'a retryable failure is persisted before the next claim'
);

select is(
  (
    public.claim_async_task_run(
      agency_a,
      client_a,
      'd1000000-0000-4000-8000-000000000001',
      'report.generateDaily',
      'client',
      client_a,
      'daily-report:operations-client-a:2026-07-26',
      'run_ops_1_retry_after_failure'
    ) ->> 'attemptCount'
  )::integer,
  2,
  'a retry after failure reuses the durable row and increments the attempt'
) from ops_context;

select lives_ok(
  format(
    'select public.complete_async_task_run(%L::uuid, %L::jsonb, 120)',
    (select task_run_id from ops_context),
    '{"generated":true}'
  ),
  'the durable task can be completed once'
);

select is(
  (
    public.claim_async_task_run(
      agency_a,
      client_a,
      'd1000000-0000-4000-8000-000000000001',
      'report.generateDaily',
      'client',
      client_a,
      'daily-report:operations-client-a:2026-07-26',
      'run_ops_2'
    ) ->> 'shouldExecute'
  )::boolean,
  false,
  'a completed business idempotency key suppresses the duplicate effect'
) from ops_context;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);

update ops_context set agency_b = public.create_agency(
  'Operations Agency B', 'operations-agency-b'
);
update ops_context set client_b = public.create_client_profile(
  agency_b, 'Operations Client B', 'operations-client-b', '', '', '', 'FR',
  'fr', 'Europe/Paris', '', '', array[]::text[], 'onboarding'
);

select is(
  (
    select count(*)::integer from public.pipeline_stages
    where agency_id = (select agency_a from ops_context)
      and client_id = (select client_a from ops_context)
  ),
  0,
  'agency B cannot read agency A pipeline stages'
);
select is(
  (
    select count(*)::integer from public.suppression_entries
    where agency_id = (select agency_a from ops_context)
  ),
  0,
  'agency B cannot read agency A suppression entries'
);
select is(
  (
    select count(*)::integer from public.async_task_runs
    where agency_id = (select agency_a from ops_context)
  ),
  0,
  'agency B cannot read agency A task ledger'
);

select throws_ok(
  format(
    'select public.ensure_default_pipeline(%L::uuid, %L::uuid)',
    (select agency_a from ops_context),
    (select client_a from ops_context)
  ),
  '42501',
  'Pipeline configuration is not authorized.',
  'a forged tenant is rejected by pipeline mutation'
);

select throws_ok(
  format(
    'select public.add_suppression_entry(%L::uuid, %L::uuid, %L, %L, %L, %L, null)',
    (select agency_a from ops_context),
    (select client_a from ops_context),
    'victim@example.test',
    'manual',
    'client',
    'forged-test'
  ),
  '42501',
  'Suppression is not authorized.',
  'a forged tenant is rejected by suppression mutation'
);

reset role;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);

select lives_ok(
  format(
    'select public.add_suppression_entry(%L::uuid, %L::uuid, %L, %L, %L, %L, null)',
    (select agency_b from ops_context),
    (select client_b from ops_context),
    'complaint@example.test',
    'complaint',
    'client',
    'inbound_webhook'
  ),
  'a verified technical webhook can add a tenant-scoped suppression'
);

select throws_ok(
  format(
    'select public.claim_async_task_run(%L::uuid, %L::uuid, %L::uuid, %L, %L, %L::uuid, %L, %L)',
    (select agency_b from ops_context),
    (select client_b from ops_context),
    'd1000000-0000-4000-8000-000000000002',
    'report.generateDaily',
    'client',
    (select client_b from ops_context),
    'daily-report:operations-client-a:2026-07-26',
    'run_forged'
  ),
  '42501',
  'Idempotency key belongs to a different task resource.',
  'an idempotency key cannot be replayed across tenants'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);

select is(
  (
    select status::text from public.async_task_runs
    where id = (select task_run_id from ops_context)
  ),
  'succeeded',
  'the durable task result remains succeeded after replay attempts'
);

select * from finish();
rollback;
