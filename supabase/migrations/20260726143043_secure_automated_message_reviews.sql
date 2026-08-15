revoke execute on function private.review_campaign_message(
  uuid,
  uuid,
  uuid,
  public.message_review_type,
  public.message_review_decision,
  jsonb
) from authenticated;

grant execute on function private.review_campaign_message(
  uuid,
  uuid,
  uuid,
  public.message_review_type,
  public.message_review_decision,
  jsonb
) to service_role;

create or replace function public.review_campaign_message(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_review_type public.message_review_type,
  requested_decision public.message_review_decision,
  requested_review jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if requested_review_type <> 'human' then
    raise exception using
      errcode = '42501',
      message = 'Automated reviews require the technical review boundary.';
  end if;

  return private.review_campaign_message(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    requested_review_type,
    requested_decision,
    requested_review
  );
end;
$$;

create or replace function public.record_campaign_message_machine_review(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_review_type public.message_review_type,
  requested_decision public.message_review_decision,
  requested_review jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  originating_actor_id uuid;
begin
  if requested_review_type not in ('quality', 'compliance') then
    raise exception using
      errcode = '42501',
      message = 'Only automated quality and compliance reviews are accepted.';
  end if;

  select submitted_for_review_by into originating_actor_id
  from public.campaign_message_versions
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_version_id;

  if originating_actor_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'Submitted message version not found in tenant.';
  end if;

  perform set_config(
    'request.jwt.claim.sub',
    originating_actor_id::text,
    true
  );
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  return private.review_campaign_message(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    requested_review_type,
    requested_decision,
    requested_review
  );
end;
$$;

revoke execute on function public.record_campaign_message_machine_review(
  uuid,
  uuid,
  uuid,
  public.message_review_type,
  public.message_review_decision,
  jsonb
) from public, anon, authenticated;

grant execute on function public.record_campaign_message_machine_review(
  uuid,
  uuid,
  uuid,
  public.message_review_type,
  public.message_review_decision,
  jsonb
) to service_role;
