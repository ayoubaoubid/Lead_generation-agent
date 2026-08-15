create type public.async_task_run_status as enum (
  'queued',
  'running',
  'retrying',
  'succeeded',
  'failed',
  'cancelled'
);

create type public.async_task_error_class as enum (
  'retryable',
  'permanent',
  'intervention_required'
);

create table public.async_task_runs (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  task_id text not null,
  resource_type text not null,
  resource_id uuid not null,
  actor_id uuid,
  idempotency_key text not null,
  trigger_run_id text,
  status public.async_task_run_status not null default 'queued',
  attempt_count integer not null default 0,
  cost_microusd bigint not null default 0,
  cost_currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  result jsonb,
  error_class public.async_task_error_class,
  error_code text,
  error_message_redacted text,
  queued_at timestamptz not null default statement_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_async_task_runs primary key (id),
  constraint uq_async_task_runs__tenant_id
    unique (agency_id, client_id, id),
  constraint uq_async_task_runs__idempotency
    unique (task_id, idempotency_key),
  constraint fk_async_task_runs__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_async_task_runs__actor foreign key (actor_id)
    references public.profiles (id) on delete set null,
  constraint ck_async_task_runs__task
    check (task_id ~ '^[a-z][a-z0-9-]*\.[a-z][A-Za-z0-9]*$'),
  constraint ck_async_task_runs__resource
    check (
      char_length(btrim(resource_type)) between 1 and 80
      and char_length(btrim(idempotency_key)) between 8 and 240
    ),
  constraint ck_async_task_runs__attempt check (attempt_count >= 0),
  constraint ck_async_task_runs__cost
    check (cost_microusd >= 0 and cost_currency = 'USD'),
  constraint ck_async_task_runs__json
    check (
      jsonb_typeof(metadata) = 'object'
      and (result is null or jsonb_typeof(result) = 'object')
    ),
  constraint ck_async_task_runs__lifecycle
    check (
      (
        status = 'queued'
        and started_at is null
        and completed_at is null
      )
      or (
        status in ('running', 'retrying')
        and started_at is not null
        and completed_at is null
      )
      or (
        status in ('succeeded', 'failed', 'cancelled')
        and started_at is not null
        and completed_at is not null
      )
    ),
  constraint ck_async_task_runs__error
    check (
      (
        status = 'failed'
        and error_class is not null
        and error_code is not null
        and error_message_redacted is not null
      )
      or (
        status <> 'failed'
        and error_class is null
        and error_code is null
        and error_message_redacted is null
      )
    )
);

create index idx_async_task_runs__tenant_status
  on public.async_task_runs (
    agency_id, client_id, status, updated_at desc
  );

create index idx_async_task_runs__resource
  on public.async_task_runs (
    agency_id, client_id, resource_type, resource_id, updated_at desc
  );

comment on table public.async_task_runs is
  'Durable tenant-scoped execution trace and business idempotency ledger for Trigger.dev tasks.';
comment on column public.async_task_runs.error_message_redacted is
  'Operator-safe failure description. Payloads, addresses, tokens and provider bodies are forbidden.';

create trigger trg_async_task_runs__set_updated_at
before update on public.async_task_runs
for each row execute function private.set_updated_at();

alter table public.async_task_runs enable row level security;

create policy async_task_runs_select_auditors
on public.async_task_runs for select to authenticated
using (private.has_permission(agency_id, client_id, 'audit.read'));

revoke all on public.async_task_runs from anon, authenticated;
grant select on public.async_task_runs to authenticated;

create or replace function public.claim_async_task_run(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_actor_id uuid,
  requested_task_id text,
  requested_resource_type text,
  requested_resource_id uuid,
  requested_idempotency_key text,
  requested_trigger_run_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_run public.async_task_runs%rowtype;
begin
  if not exists (
    select 1 from public.clients
    where agency_id = requested_agency_id
      and id = requested_client_id
      and archived_at is null
  ) then
    raise exception using
      errcode = '23503',
      message = 'Task tenant does not exist.';
  end if;

  insert into public.async_task_runs (
    agency_id, client_id, actor_id, task_id, resource_type, resource_id,
    idempotency_key, trigger_run_id, status, attempt_count, started_at
  )
  values (
    requested_agency_id, requested_client_id, requested_actor_id,
    requested_task_id, requested_resource_type, requested_resource_id,
    requested_idempotency_key, requested_trigger_run_id, 'running', 1,
    statement_timestamp()
  )
  on conflict (task_id, idempotency_key) do nothing
  returning * into claimed_run;

  if claimed_run.id is not null then
    return jsonb_build_object(
      'taskRunId', claimed_run.id,
      'shouldExecute', true,
      'attemptCount', claimed_run.attempt_count
    );
  end if;

  select * into claimed_run
  from public.async_task_runs
  where task_id = requested_task_id
    and idempotency_key = requested_idempotency_key
  for update;

  if claimed_run.agency_id <> requested_agency_id
    or claimed_run.client_id <> requested_client_id
    or claimed_run.resource_type <> requested_resource_type
    or claimed_run.resource_id <> requested_resource_id
  then
    raise exception using
      errcode = '42501',
      message = 'Idempotency key belongs to a different task resource.';
  end if;

  if claimed_run.status = 'succeeded' then
    return jsonb_build_object(
      'taskRunId', claimed_run.id,
      'shouldExecute', false,
      'attemptCount', claimed_run.attempt_count,
      'result', claimed_run.result
    );
  end if;

  if claimed_run.status in ('running', 'retrying') then
    return jsonb_build_object(
      'taskRunId', claimed_run.id,
      'shouldExecute', false,
      'attemptCount', claimed_run.attempt_count,
      'inProgress', true
    );
  end if;

  update public.async_task_runs
  set
    status = case
      when claimed_run.attempt_count > 0
        then 'retrying'::public.async_task_run_status
      else 'running'::public.async_task_run_status
    end,
    attempt_count = claimed_run.attempt_count + 1,
    trigger_run_id = coalesce(
      requested_trigger_run_id, claimed_run.trigger_run_id
    ),
    started_at = coalesce(claimed_run.started_at, statement_timestamp()),
    completed_at = null,
    result = null,
    error_class = null,
    error_code = null,
    error_message_redacted = null
  where id = claimed_run.id
  returning * into claimed_run;

  return jsonb_build_object(
    'taskRunId', claimed_run.id,
    'shouldExecute', true,
    'attemptCount', claimed_run.attempt_count
  );
end;
$$;

create or replace function public.complete_async_task_run(
  requested_task_run_id uuid,
  requested_result jsonb,
  requested_cost_microusd bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.async_task_runs
  set
    status = 'succeeded',
    result = coalesce(requested_result, '{}'::jsonb),
    cost_microusd = requested_cost_microusd,
    completed_at = statement_timestamp(),
    error_class = null,
    error_code = null,
    error_message_redacted = null
  where id = requested_task_run_id
    and status in ('running', 'retrying');

  if not found then
    raise exception using errcode = '55000', message = 'Task run is not completable.';
  end if;
  return requested_task_run_id;
end;
$$;

create or replace function public.fail_async_task_run(
  requested_task_run_id uuid,
  requested_error_class public.async_task_error_class,
  requested_error_code text,
  requested_error_message_redacted text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.async_task_runs
  set
    status = 'failed',
    completed_at = statement_timestamp(),
    error_class = requested_error_class,
    error_code = left(btrim(requested_error_code), 120),
    error_message_redacted = left(btrim(requested_error_message_redacted), 500)
  where id = requested_task_run_id
    and status in ('running', 'retrying');

  if not found then
    raise exception using errcode = '55000', message = 'Task run is not fail-able.';
  end if;
  return requested_task_run_id;
end;
$$;

revoke execute on function public.claim_async_task_run(
  uuid, uuid, uuid, text, text, uuid, text, text
) from public, anon, authenticated;
revoke execute on function public.complete_async_task_run(
  uuid, jsonb, bigint
) from public, anon, authenticated;
revoke execute on function public.fail_async_task_run(
  uuid, public.async_task_error_class, text, text
) from public, anon, authenticated;

grant execute on function public.claim_async_task_run(
  uuid, uuid, uuid, text, text, uuid, text, text
) to service_role;
grant execute on function public.complete_async_task_run(
  uuid, jsonb, bigint
) to service_role;
grant execute on function public.fail_async_task_run(
  uuid, public.async_task_error_class, text, text
) to service_role;
