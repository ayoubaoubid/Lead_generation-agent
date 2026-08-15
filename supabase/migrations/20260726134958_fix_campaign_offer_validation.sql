create or replace function private.create_campaign_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  created_campaign_id uuid;
  created_sequence_id uuid;
  requested_offer_id uuid := nullif(requested_payload ->> 'offerId', '')::uuid;
  requested_icp_id uuid := nullif(requested_payload ->> 'icpId', '')::uuid;
  requested_segment_id uuid := nullif(requested_payload ->> 'segmentId', '')::uuid;
  persona_id uuid;
begin
  if actor_id is null
    or not private.has_permission(
      requested_agency_id, requested_client_id, 'campaign.create'
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Campaign creation is not authorized.';
  end if;

  if requested_offer_id is not null and not exists (
    select 1 from public.strategy_artifacts
    where agency_id = requested_agency_id
      and client_id = requested_client_id
      and id = requested_offer_id
      and artifact_type = 'offer'
  ) then
    raise exception using errcode = '23503', message = 'Offer not found in tenant.';
  end if;

  if requested_icp_id is not null and not exists (
    select 1 from public.targeting_profiles
    where agency_id = requested_agency_id
      and client_id = requested_client_id
      and id = requested_icp_id
      and profile_type = 'icp'
      and lifecycle_status <> 'archived'
  ) then
    raise exception using errcode = '23503', message = 'ICP not found in tenant.';
  end if;

  if requested_segment_id is not null and not exists (
    select 1 from public.segments
    where agency_id = requested_agency_id
      and client_id = requested_client_id
      and id = requested_segment_id
      and status <> 'archived'
  ) then
    raise exception using errcode = '23503', message = 'Segment not found in tenant.';
  end if;

  insert into public.campaigns (
    agency_id, client_id, name, objective, channel, offer_id, icp_id,
    segment_id, timezone, schedule_rules, target_metrics, created_by, updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    btrim(requested_payload ->> 'name'),
    btrim(requested_payload ->> 'objective'),
    coalesce(
      nullif(requested_payload ->> 'channel', '')::public.outreach_channel,
      'email'
    ),
    requested_offer_id,
    requested_icp_id,
    requested_segment_id,
    coalesce(nullif(btrim(requested_payload ->> 'timezone'), ''), 'UTC'),
    coalesce(requested_payload -> 'scheduleRules', '{}'::jsonb),
    coalesce(requested_payload -> 'targetMetrics', '{}'::jsonb),
    actor_id,
    actor_id
  )
  returning id into created_campaign_id;

  insert into public.campaign_sequences (
    agency_id, client_id, campaign_id, name, created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_campaign_id,
    coalesce(
      nullif(btrim(requested_payload ->> 'sequenceName'), ''),
      'Séquence principale'
    ),
    actor_id
  )
  returning id into created_sequence_id;

  insert into public.campaign_sequence_steps (
    agency_id, client_id, sequence_id, step_order, step_type, delay_minutes,
    template_subject, template_body, stop_rules
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_sequence_id,
    1,
    'cold_email',
    0,
    nullif(btrim(requested_payload ->> 'templateSubject'), ''),
    btrim(requested_payload ->> 'templateBody'),
    array[
      'reply_received',
      'meeting_booked',
      'unsubscribe',
      'hard_bounce',
      'complaint',
      'suppressed'
    ]::public.campaign_stop_reason[]
  );

  for persona_id in
    select value::uuid
    from jsonb_array_elements_text(
      coalesce(requested_payload -> 'personaIds', '[]'::jsonb)
    )
  loop
    if not exists (
      select 1 from public.targeting_profiles
      where agency_id = requested_agency_id
        and client_id = requested_client_id
        and id = persona_id
        and profile_type = 'persona'
        and lifecycle_status <> 'archived'
    ) then
      raise exception using
        errcode = '23503',
        message = 'Persona not found in tenant.';
    end if;

    insert into public.campaign_personas (
      agency_id, client_id, campaign_id, persona_id
    )
    values (
      requested_agency_id, requested_client_id, created_campaign_id, persona_id
    );
  end loop;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id,
    metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'campaign.created', 'campaign', created_campaign_id::text,
    jsonb_build_object('status', 'draft', 'channel', requested_payload ->> 'channel')
  );

  return created_campaign_id;
end;
$$;
