create or replace function private.request_data_import_cancellation(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  previous_status public.data_import_status;
  next_status public.data_import_status;
begin
  if actor_id is null
    or not private.has_permission(
      requested_agency_id,
      requested_client_id,
      'lead.write'
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Import cancellation is not authorized.';
  end if;

  select status into previous_status
  from public.data_imports
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_import_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Import not found in tenant.';
  end if;
  if previous_status not in (
    'draft',
    'ready',
    'queued',
    'processing',
    'cancel_requested'
  ) then
    raise exception using
      errcode = '55000',
      message = 'Import can no longer be cancelled.';
  end if;

  next_status := case
    when previous_status = 'processing'
      then 'cancel_requested'::public.data_import_status
    when previous_status = 'cancel_requested'
      then 'cancel_requested'::public.data_import_status
    else 'cancelled'::public.data_import_status
  end;

  update public.data_imports
  set
    status = next_status,
    cancellation_requested_by = actor_id,
    cancellation_requested_at = statement_timestamp(),
    completed_at = case
      when next_status = 'cancelled' then statement_timestamp()
      else completed_at
    end
  where id = requested_import_id;

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    requested_client_id,
    actor_id,
    'import.cancellation_requested',
    'data_import',
    requested_import_id::text,
    jsonb_build_object(
      'previous_status',
      previous_status,
      'next_status',
      next_status
    )
  );

  return requested_import_id;
end;
$$;

create or replace function private.review_campaign_message(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_review_type public.message_review_type,
  requested_decision public.message_review_decision,
  requested_review jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  current_status public.campaign_message_status;
  current_message_id uuid;
  required_permission text;
  next_status public.campaign_message_status;
begin
  required_permission := case
    when requested_review_type = 'human' then 'message.approve'
    else 'message.write'
  end;

  if actor_id is null
    or not private.has_permission(
      requested_agency_id,
      requested_client_id,
      required_permission
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Message review is not authorized.';
  end if;

  select status, message_id into current_status, current_message_id
  from public.campaign_message_versions
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_version_id
  for update;

  if current_status is null then
    raise exception using
      errcode = 'P0002',
      message = 'Message version not found.';
  end if;

  if requested_review_type = 'quality'
    and current_status = 'quality_review_pending'
  then
    next_status := case requested_decision
      when 'approve'
        then 'compliance_review_pending'::public.campaign_message_status
      when 'revise' then 'draft'::public.campaign_message_status
      else 'rejected'::public.campaign_message_status
    end;
  elsif requested_review_type = 'compliance'
    and current_status = 'compliance_review_pending'
  then
    next_status := case requested_decision
      when 'approve'
        then 'human_review_pending'::public.campaign_message_status
      when 'revise' then 'draft'::public.campaign_message_status
      else 'rejected'::public.campaign_message_status
    end;
  elsif requested_review_type = 'human'
    and current_status = 'human_review_pending'
  then
    next_status := case requested_decision
      when 'approve' then 'approved'::public.campaign_message_status
      else 'rejected'::public.campaign_message_status
    end;
  else
    raise exception using
      errcode = '55000',
      message = 'Message review order is invalid.';
  end if;

  insert into public.campaign_message_reviews (
    agency_id,
    client_id,
    message_id,
    message_version_id,
    review_type,
    decision,
    issues,
    scores,
    reviewer_agent_id,
    reviewer_agent_version,
    reviewer_skill_id,
    reviewer_skill_version,
    reviewer_prompt_version,
    reviewer_model_id,
    ai_execution_id,
    reviewed_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    current_message_id,
    requested_version_id,
    requested_review_type,
    requested_decision,
    coalesce(requested_review -> 'issues', '[]'::jsonb),
    coalesce(requested_review -> 'scores', '{}'::jsonb),
    case when requested_review_type <> 'human'
      then requested_review ->> 'agentId' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'agentVersion' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'skillId' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'skillVersion' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'promptVersion' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'modelId' end,
    case when requested_review_type <> 'human'
      then nullif(requested_review ->> 'aiExecutionId', '')::uuid end,
    case when requested_review_type = 'human' then actor_id end
  );

  update public.campaign_message_versions
  set
    status = next_status,
    approved_by = case when next_status = 'approved' then actor_id end,
    approved_at = case
      when next_status = 'approved' then statement_timestamp()
    end,
    rejected_by = case when next_status = 'rejected' then actor_id end,
    rejected_at = case
      when next_status = 'rejected' then statement_timestamp()
    end
  where id = requested_version_id;

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    requested_client_id,
    actor_id,
    'message.' || requested_review_type::text || '_reviewed',
    'campaign_message_version',
    requested_version_id::text,
    jsonb_build_object(
      'decision',
      requested_decision,
      'previous_status',
      current_status,
      'next_status',
      next_status
    )
  );

  return requested_version_id;
end;
$$;

create or replace function public.fail_outbound_delivery(
  requested_delivery_attempt_id uuid,
  requested_retryable boolean,
  requested_error_code text,
  requested_error_message_redacted text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt public.delivery_attempts%rowtype;
begin
  update public.delivery_attempts
  set
    status = case
      when requested_retryable
        then 'retryable_failure'::public.delivery_attempt_status
      else 'permanent_failure'::public.delivery_attempt_status
    end,
    error_code = left(btrim(requested_error_code), 120),
    error_message_redacted = left(
      btrim(requested_error_message_redacted),
      500
    ),
    completed_at = statement_timestamp()
  where id = requested_delivery_attempt_id
    and status = 'started'
  returning * into attempt;

  if not found then
    raise exception using
      errcode = '55000',
      message = 'Delivery attempt is not fail-able.';
  end if;

  update public.outbound_messages
  set
    status = 'failed',
    last_error_code = left(btrim(requested_error_code), 120)
  where id = attempt.outbound_message_id
    and status = 'sending';

  return attempt.outbound_message_id;
end;
$$;

revoke execute on function public.fail_outbound_delivery(
  uuid,
  boolean,
  text,
  text
) from public, anon, authenticated;
grant execute on function public.fail_outbound_delivery(
  uuid,
  boolean,
  text,
  text
) to service_role;
