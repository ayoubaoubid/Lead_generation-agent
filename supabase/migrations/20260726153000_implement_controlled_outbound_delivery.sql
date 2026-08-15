create type public.outbound_message_status as enum (
  'scheduled',
  'sending',
  'sent',
  'delivered',
  'stopped',
  'failed',
  'bounced',
  'complained'
);

create type public.delivery_attempt_status as enum (
  'started',
  'accepted',
  'retryable_failure',
  'permanent_failure'
);

create table public.outbound_messages (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  campaign_prospect_id uuid not null,
  sequence_step_id uuid not null,
  message_version_id uuid not null,
  sending_account_id uuid not null,
  commercial_attempt integer not null default 1,
  business_idempotency_key text not null,
  status public.outbound_message_status not null default 'scheduled',
  scheduled_for timestamptz not null,
  claimed_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  stopped_at timestamptz,
  stop_reason public.campaign_stop_reason,
  provider_message_id text,
  last_error_code text,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_outbound_messages primary key (id),
  constraint uq_outbound_messages__tenant_id unique (agency_id, client_id, id),
  constraint uq_outbound_messages__business_effect unique (business_idempotency_key),
  constraint uq_outbound_messages__commercial_step unique (
    campaign_prospect_id, sequence_step_id, commercial_attempt
  ),
  constraint fk_outbound_messages__campaign foreign key (
    agency_id, client_id, campaign_id
  ) references public.campaigns (agency_id, client_id, id) on delete restrict,
  constraint fk_outbound_messages__prospect foreign key (
    agency_id, client_id, campaign_prospect_id
  ) references public.campaign_prospects (agency_id, client_id, id) on delete restrict,
  constraint fk_outbound_messages__step foreign key (
    agency_id, client_id, sequence_step_id
  ) references public.campaign_sequence_steps (agency_id, client_id, id) on delete restrict,
  constraint fk_outbound_messages__version foreign key (
    agency_id, client_id, message_version_id
  ) references public.campaign_message_versions (agency_id, client_id, id) on delete restrict,
  constraint fk_outbound_messages__account foreign key (
    agency_id, client_id, sending_account_id
  ) references public.sending_accounts (agency_id, client_id, id) on delete restrict,
  constraint fk_outbound_messages__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_outbound_messages__business_key check (
    char_length(btrim(business_idempotency_key)) between 8 and 240
  ),
  constraint ck_outbound_messages__commercial_attempt check (commercial_attempt > 0),
  constraint ck_outbound_messages__stop check (
    (status = 'stopped' and stopped_at is not null and stop_reason is not null)
    or (status <> 'stopped' and stopped_at is null and stop_reason is null)
  )
);

create table public.delivery_attempts (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  outbound_message_id uuid not null,
  technical_attempt integer not null,
  trigger_run_id text,
  provider text not null,
  status public.delivery_attempt_status not null,
  provider_request_key text not null,
  provider_message_id text,
  error_code text,
  error_message_redacted text,
  cost_microusd bigint not null default 0,
  started_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_delivery_attempts primary key (id),
  constraint uq_delivery_attempts__technical_attempt unique (
    outbound_message_id, technical_attempt
  ),
  constraint fk_delivery_attempts__message foreign key (
    agency_id, client_id, outbound_message_id
  ) references public.outbound_messages (agency_id, client_id, id) on delete restrict,
  constraint ck_delivery_attempts__attempt check (technical_attempt > 0),
  constraint ck_delivery_attempts__provider check (
    char_length(btrim(provider)) between 2 and 80
    and char_length(btrim(provider_request_key)) between 8 and 240
  ),
  constraint ck_delivery_attempts__cost check (cost_microusd >= 0),
  constraint ck_delivery_attempts__completion check (
    (status = 'started' and completed_at is null)
    or (status <> 'started' and completed_at is not null)
  )
);

create table public.sequence_stop_events (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  campaign_prospect_id uuid not null,
  reason public.campaign_stop_reason not null,
  source_resource_type text not null,
  source_resource_id uuid,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_sequence_stop_events primary key (id),
  constraint fk_sequence_stop_events__prospect foreign key (
    agency_id, client_id, campaign_prospect_id
  ) references public.campaign_prospects (agency_id, client_id, id) on delete restrict,
  constraint fk_sequence_stop_events__campaign foreign key (
    agency_id, client_id, campaign_id
  ) references public.campaigns (agency_id, client_id, id) on delete restrict,
  constraint fk_sequence_stop_events__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_sequence_stop_events__source check (
    char_length(btrim(source_resource_type)) between 2 and 80
  )
);

create index idx_outbound_messages__scheduler
  on public.outbound_messages (status, scheduled_for, agency_id, client_id);
create index idx_outbound_messages__prospect
  on public.outbound_messages (
    agency_id, client_id, campaign_prospect_id, created_at desc
  );
create index idx_delivery_attempts__message
  on public.delivery_attempts (outbound_message_id, technical_attempt desc);
create index idx_delivery_attempts__provider_request
  on public.delivery_attempts (provider, provider_request_key, started_at desc);

comment on table public.outbound_messages is
  'One durable commercial send per campaign prospect and sequence step. Technical retries only add delivery_attempts.';
comment on table public.delivery_attempts is
  'Provider delivery attempts. A retry cannot create a new commercial follow-up.';

create trigger trg_outbound_messages__set_updated_at
before update on public.outbound_messages
for each row execute function private.set_updated_at();

alter table public.outbound_messages enable row level security;
alter table public.delivery_attempts enable row level security;
alter table public.sequence_stop_events enable row level security;

create policy outbound_messages_select on public.outbound_messages for select
to authenticated using (private.has_permission(agency_id, client_id, 'campaign.read'));
create policy delivery_attempts_select on public.delivery_attempts for select
to authenticated using (private.has_permission(agency_id, client_id, 'campaign.read'));
create policy sequence_stop_events_select on public.sequence_stop_events for select
to authenticated using (private.has_permission(agency_id, client_id, 'campaign.read'));

revoke all on public.outbound_messages, public.delivery_attempts,
  public.sequence_stop_events from anon, authenticated;
grant select on public.outbound_messages, public.delivery_attempts,
  public.sequence_stop_events to authenticated;
grant select, insert, update on public.outbound_messages, public.delivery_attempts,
  public.sequence_stop_events to service_role;

create or replace function public.claim_outbound_delivery(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_outbound_message_id uuid,
  requested_trigger_run_id text,
  requested_provider text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  outbound public.outbound_messages%rowtype;
  campaign_row public.campaigns%rowtype;
  account_row public.sending_accounts%rowtype;
  attempt_number integer;
  attempt_id uuid;
  preflight jsonb;
begin
  select * into outbound
  from public.outbound_messages
  where id = requested_outbound_message_id
    and agency_id = requested_agency_id
    and client_id = requested_client_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Outbound message is not accessible.';
  end if;

  if outbound.status in ('sent', 'delivered') then
    return jsonb_build_object(
      'shouldSend', false,
      'status', outbound.status,
      'providerMessageId', outbound.provider_message_id
    );
  end if;
  if outbound.status = 'stopped' then
    return jsonb_build_object('shouldSend', false, 'status', 'stopped');
  end if;
  if outbound.status = 'sending' then
    return jsonb_build_object('shouldSend', false, 'status', 'in_progress');
  end if;

  select * into campaign_row
  from public.campaigns
  where id = outbound.campaign_id
    and agency_id = outbound.agency_id
    and client_id = outbound.client_id;
  if campaign_row.status not in ('scheduled', 'running') then
    raise exception using errcode = '55000', message = 'Campaign is not sendable.';
  end if;

  if exists (
    select 1 from public.campaign_prospects prospect
    where prospect.id = outbound.campaign_prospect_id
      and prospect.status in ('stopped', 'excluded')
  ) then
    raise exception using errcode = '55000', message = 'Prospect sequence is stopped.';
  end if;

  select * into account_row
  from public.sending_accounts
  where id = outbound.sending_account_id
    and agency_id = outbound.agency_id
    and client_id = outbound.client_id
  for update;
  if account_row.status <> 'connected'
    or account_row.sent_today >= account_row.daily_limit
  then
    raise exception using errcode = '55000', message = 'Sending account is unavailable.';
  end if;

  preflight := public.campaign_deliverability_preflight(
    outbound.agency_id, outbound.client_id, outbound.campaign_id
  );
  if not coalesce((preflight ->> 'passed')::boolean, false) then
    raise exception using errcode = '55000', message = 'Deliverability preflight failed.';
  end if;

  if not exists (
    select 1 from public.campaign_message_versions version
    where version.id = outbound.message_version_id
      and version.agency_id = outbound.agency_id
      and version.client_id = outbound.client_id
      and version.status = 'approved'
  ) then
    raise exception using errcode = '55000', message = 'Message is not approved.';
  end if;

  select coalesce(max(technical_attempt), 0) + 1 into attempt_number
  from public.delivery_attempts
  where outbound_message_id = outbound.id;

  insert into public.delivery_attempts (
    agency_id, client_id, outbound_message_id, technical_attempt,
    trigger_run_id, provider, status, provider_request_key
  ) values (
    outbound.agency_id, outbound.client_id, outbound.id, attempt_number,
    requested_trigger_run_id, btrim(requested_provider), 'started',
    outbound.business_idempotency_key
  )
  returning id into attempt_id;

  update public.outbound_messages
  set status = 'sending', claimed_at = statement_timestamp()
  where id = outbound.id;

  return jsonb_build_object(
    'shouldSend', true,
    'deliveryAttemptId', attempt_id,
    'technicalAttempt', attempt_number,
    'providerRequestKey', outbound.business_idempotency_key
  );
end;
$$;

create or replace function public.complete_outbound_delivery(
  requested_delivery_attempt_id uuid,
  requested_provider_message_id text,
  requested_cost_microusd bigint default 0
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
  set status = 'accepted',
      provider_message_id = requested_provider_message_id,
      cost_microusd = requested_cost_microusd,
      completed_at = statement_timestamp()
  where id = requested_delivery_attempt_id
    and status = 'started'
  returning * into attempt;
  if not found then
    raise exception using errcode = '55000', message = 'Delivery attempt is not completable.';
  end if;

  update public.outbound_messages
  set status = 'sent',
      provider_message_id = requested_provider_message_id,
      sent_at = statement_timestamp()
  where id = attempt.outbound_message_id
    and status = 'sending';

  update public.sending_accounts
  set sent_today = sent_today + 1
  where id = (
    select sending_account_id from public.outbound_messages
    where id = attempt.outbound_message_id
  );
  return attempt.outbound_message_id;
end;
$$;

create or replace function public.stop_campaign_prospect_sequence(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_campaign_prospect_id uuid,
  requested_reason public.campaign_stop_reason,
  requested_source_resource_type text,
  requested_source_resource_id uuid default null,
  requested_actor_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  campaign_id_value uuid;
begin
  select campaign_id into campaign_id_value
  from public.campaign_prospects
  where id = requested_campaign_prospect_id
    and agency_id = requested_agency_id
    and client_id = requested_client_id
  for update;
  if not found then
    raise exception using errcode = '42501', message = 'Campaign prospect is not accessible.';
  end if;

  update public.campaign_prospects
  set status = 'stopped',
      stop_reason = requested_reason,
      stopped_at = statement_timestamp()
  where id = requested_campaign_prospect_id
    and status <> 'stopped';

  update public.outbound_messages
  set status = 'stopped',
      stop_reason = requested_reason,
      stopped_at = statement_timestamp()
  where campaign_prospect_id = requested_campaign_prospect_id
    and status in ('scheduled', 'sending', 'failed');

  insert into public.sequence_stop_events (
    agency_id, client_id, campaign_id, campaign_prospect_id, reason,
    source_resource_type, source_resource_id, created_by
  ) values (
    requested_agency_id, requested_client_id, campaign_id_value,
    requested_campaign_prospect_id, requested_reason,
    requested_source_resource_type, requested_source_resource_id,
    requested_actor_id
  );
  return requested_campaign_prospect_id;
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
  set status = case
        when requested_retryable
          then 'retryable_failure'::public.delivery_attempt_status
        else 'permanent_failure'::public.delivery_attempt_status
      end,
      error_code = left(btrim(requested_error_code), 120),
      error_message_redacted = left(btrim(requested_error_message_redacted), 500),
      completed_at = statement_timestamp()
  where id = requested_delivery_attempt_id
    and status = 'started'
  returning * into attempt;
  if not found then
    raise exception using errcode = '55000', message = 'Delivery attempt is not fail-able.';
  end if;

  update public.outbound_messages
  set status = 'failed',
      last_error_code = left(btrim(requested_error_code), 120)
  where id = attempt.outbound_message_id
    and status = 'sending';
  return attempt.outbound_message_id;
end;
$$;

revoke execute on function public.claim_outbound_delivery(
  uuid, uuid, uuid, text, text
) from public, anon, authenticated;
revoke execute on function public.complete_outbound_delivery(
  uuid, text, bigint
) from public, anon, authenticated;
revoke execute on function public.stop_campaign_prospect_sequence(
  uuid, uuid, uuid, public.campaign_stop_reason, text, uuid, uuid
) from public, anon, authenticated;
revoke execute on function public.fail_outbound_delivery(
  uuid, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.claim_outbound_delivery(
  uuid, uuid, uuid, text, text
) to service_role;
grant execute on function public.complete_outbound_delivery(
  uuid, text, bigint
) to service_role;
grant execute on function public.stop_campaign_prospect_sequence(
  uuid, uuid, uuid, public.campaign_stop_reason, text, uuid, uuid
) to service_role;
grant execute on function public.fail_outbound_delivery(
  uuid, boolean, text, text
) to service_role;
