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

revoke execute on function public.claim_async_task_run(
  uuid, uuid, uuid, text, text, uuid, text, text
) from public, anon, authenticated;
grant execute on function public.claim_async_task_run(
  uuid, uuid, uuid, text, text, uuid, text, text
) to service_role;
