create type public.campaign_status as enum (
  'draft',
  'ready_for_review',
  'approved',
  'scheduled',
  'running',
  'paused',
  'completed',
  'cancelled'
);

create type public.outreach_channel as enum (
  'email',
  'linkedin',
  'multichannel'
);

create type public.sequence_step_type as enum (
  'cold_email',
  'follow_up_email',
  'manual_linkedin',
  'wait'
);

create type public.campaign_prospect_status as enum (
  'pending',
  'ready',
  'scheduled',
  'contacted',
  'stopped',
  'excluded'
);

create type public.campaign_stop_reason as enum (
  'reply_received',
  'meeting_booked',
  'unsubscribe',
  'hard_bounce',
  'complaint',
  'suppressed',
  'campaign_paused',
  'account_disconnected'
);

create table public.campaigns (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  name text not null,
  objective text not null,
  status public.campaign_status not null default 'draft',
  channel public.outreach_channel not null default 'email',
  offer_id uuid,
  icp_id uuid,
  segment_id uuid,
  timezone text not null,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  schedule_rules jsonb not null default '{}'::jsonb,
  stop_rules public.campaign_stop_reason[] not null default array[
    'reply_received',
    'meeting_booked',
    'unsubscribe',
    'hard_bounce',
    'complaint',
    'suppressed',
    'campaign_paused',
    'account_disconnected'
  ]::public.campaign_stop_reason[],
  target_metrics jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  updated_by uuid not null,
  submitted_by uuid,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  scheduled_by uuid,
  scheduled_at timestamptz,
  paused_by uuid,
  paused_at timestamptz,
  completed_at timestamptz,
  cancelled_by uuid,
  cancelled_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_campaigns primary key (id),
  constraint uq_campaigns__tenant_id unique (agency_id, client_id, id),
  constraint uq_campaigns__tenant_name unique (agency_id, client_id, name),
  constraint fk_campaigns__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_campaigns__offer
    foreign key (agency_id, client_id, offer_id)
    references public.strategy_artifacts (agency_id, client_id, id)
    on delete restrict,
  constraint fk_campaigns__icp
    foreign key (agency_id, client_id, icp_id)
    references public.targeting_profiles (agency_id, client_id, id)
    on delete restrict,
  constraint fk_campaigns__segment
    foreign key (agency_id, client_id, segment_id)
    references public.segments (agency_id, client_id, id)
    on delete restrict,
  constraint fk_campaigns__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaigns__updated_by foreign key (updated_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaigns__submitted_by foreign key (submitted_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaigns__approved_by foreign key (approved_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaigns__scheduled_by foreign key (scheduled_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaigns__paused_by foreign key (paused_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaigns__cancelled_by foreign key (cancelled_by)
    references public.profiles (id) on delete restrict,
  constraint ck_campaigns__name
    check (char_length(btrim(name)) between 1 and 160),
  constraint ck_campaigns__objective
    check (char_length(btrim(objective)) between 1 and 2000),
  constraint ck_campaigns__timezone
    check (char_length(btrim(timezone)) between 1 and 100),
  constraint ck_campaigns__schedule
    check (
      jsonb_typeof(schedule_rules) = 'object'
      and (
        scheduled_end_at is null
        or scheduled_start_at is null
        or scheduled_end_at > scheduled_start_at
      )
    ),
  constraint ck_campaigns__metrics
    check (jsonb_typeof(target_metrics) = 'object'),
  constraint ck_campaigns__review_state check (
    (status = 'draft' and submitted_by is null and submitted_at is null)
    or status <> 'draft'
  ),
  constraint ck_campaigns__approval_state check (
    (
      status in ('approved', 'scheduled', 'running', 'paused', 'completed')
      and approved_by is not null
      and approved_at is not null
    )
    or status not in ('approved', 'scheduled', 'running', 'paused', 'completed')
  ),
  constraint ck_campaigns__scheduled_state check (
    (
      status in ('scheduled', 'running', 'paused', 'completed')
      and scheduled_by is not null
      and scheduled_at is not null
      and scheduled_start_at is not null
    )
    or status not in ('scheduled', 'running', 'paused', 'completed')
  )
);

create table public.campaign_personas (
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  persona_id uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_personas primary key (campaign_id, persona_id),
  constraint fk_campaign_personas__campaign
    foreign key (agency_id, client_id, campaign_id)
    references public.campaigns (agency_id, client_id, id) on delete cascade,
  constraint fk_campaign_personas__persona
    foreign key (agency_id, client_id, persona_id)
    references public.targeting_profiles (agency_id, client_id, id)
    on delete restrict
);

create table public.campaign_sequences (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  name text not null,
  version_number integer not null default 1,
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_sequences primary key (id),
  constraint uq_campaign_sequences__tenant_id
    unique (agency_id, client_id, id),
  constraint uq_campaign_sequences__campaign_version
    unique (campaign_id, version_number),
  constraint fk_campaign_sequences__campaign
    foreign key (agency_id, client_id, campaign_id)
    references public.campaigns (agency_id, client_id, id) on delete cascade,
  constraint fk_campaign_sequences__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_campaign_sequences__name
    check (char_length(btrim(name)) between 1 and 160),
  constraint ck_campaign_sequences__version check (version_number > 0)
);

create unique index uq_campaign_sequences__active
  on public.campaign_sequences (campaign_id)
  where is_active;

create table public.campaign_sequence_steps (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  sequence_id uuid not null,
  step_order integer not null,
  step_type public.sequence_step_type not null,
  delay_minutes integer not null default 0,
  template_subject text,
  template_body text,
  conditions jsonb not null default '{}'::jsonb,
  stop_rules public.campaign_stop_reason[] not null default '{}',
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_sequence_steps primary key (id),
  constraint uq_campaign_sequence_steps__sequence_order
    unique (sequence_id, step_order),
  constraint fk_campaign_sequence_steps__sequence
    foreign key (agency_id, client_id, sequence_id)
    references public.campaign_sequences (agency_id, client_id, id)
    on delete cascade,
  constraint ck_campaign_sequence_steps__order check (step_order > 0),
  constraint ck_campaign_sequence_steps__delay check (delay_minutes >= 0),
  constraint ck_campaign_sequence_steps__conditions
    check (jsonb_typeof(conditions) = 'object'),
  constraint ck_campaign_sequence_steps__message check (
    (
      step_type in ('cold_email', 'follow_up_email')
      and template_body is not null
      and char_length(btrim(template_body)) between 1 and 10000
    )
    or step_type not in ('cold_email', 'follow_up_email')
  )
);

create table public.campaign_prospects (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  contact_id uuid not null,
  lead_score_id uuid,
  status public.campaign_prospect_status not null default 'pending',
  stop_reason public.campaign_stop_reason,
  stopped_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_prospects primary key (id),
  constraint uq_campaign_prospects__tenant_id unique (agency_id, client_id, id),
  constraint uq_campaign_prospects__campaign_contact
    unique (campaign_id, contact_id),
  constraint fk_campaign_prospects__campaign
    foreign key (agency_id, client_id, campaign_id)
    references public.campaigns (agency_id, client_id, id) on delete cascade,
  constraint fk_campaign_prospects__contact
    foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint fk_campaign_prospects__score
    foreign key (agency_id, client_id, lead_score_id)
    references public.lead_scores (agency_id, client_id, id) on delete restrict,
  constraint ck_campaign_prospects__stop check (
    (
      status = 'stopped'
      and stop_reason is not null
      and stopped_at is not null
    )
    or (
      status <> 'stopped'
      and stop_reason is null
      and stopped_at is null
    )
  )
);

comment on table public.campaigns is
  'Client-scoped outreach project. Creation always starts in draft and launch requires explicit approval.';
comment on table public.campaign_sequence_steps is
  'Versioned sequence steps. Technical retries never create new step rows.';
comment on table public.campaign_prospects is
  'Campaign recipients with durable stop state and tenant-aware contact references.';

create index idx_campaigns__client_status
  on public.campaigns (agency_id, client_id, status, updated_at desc);
create index idx_campaign_prospects__campaign_status
  on public.campaign_prospects (agency_id, client_id, campaign_id, status);
create index idx_campaign_prospects__contact
  on public.campaign_prospects (agency_id, client_id, contact_id);
create index idx_campaign_steps__sequence_order
  on public.campaign_sequence_steps (agency_id, client_id, sequence_id, step_order);

create trigger trg_campaigns__set_updated_at
before update on public.campaigns
for each row execute function private.set_updated_at();
create trigger trg_campaign_sequences__set_updated_at
before update on public.campaign_sequences
for each row execute function private.set_updated_at();
create trigger trg_campaign_sequence_steps__set_updated_at
before update on public.campaign_sequence_steps
for each row execute function private.set_updated_at();
create trigger trg_campaign_prospects__set_updated_at
before update on public.campaign_prospects
for each row execute function private.set_updated_at();

alter table public.campaigns enable row level security;
alter table public.campaign_personas enable row level security;
alter table public.campaign_sequences enable row level security;
alter table public.campaign_sequence_steps enable row level security;
alter table public.campaign_prospects enable row level security;

create policy campaigns_select_authorized
on public.campaigns for select to authenticated
using (private.has_permission(agency_id, client_id, 'campaign.read'));
create policy campaign_personas_select_authorized
on public.campaign_personas for select to authenticated
using (private.has_permission(agency_id, client_id, 'campaign.read'));
create policy campaign_sequences_select_authorized
on public.campaign_sequences for select to authenticated
using (private.has_permission(agency_id, client_id, 'campaign.read'));
create policy campaign_sequence_steps_select_authorized
on public.campaign_sequence_steps for select to authenticated
using (private.has_permission(agency_id, client_id, 'campaign.read'));
create policy campaign_prospects_select_authorized
on public.campaign_prospects for select to authenticated
using (private.has_permission(agency_id, client_id, 'campaign.read'));

revoke all on
  public.campaigns,
  public.campaign_personas,
  public.campaign_sequences,
  public.campaign_sequence_steps,
  public.campaign_prospects
from anon, authenticated;

grant select on
  public.campaigns,
  public.campaign_personas,
  public.campaign_sequences,
  public.campaign_sequence_steps,
  public.campaign_prospects
to authenticated;

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
      and archived_at is null
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

create or replace function private.transition_campaign(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_campaign_id uuid,
  requested_action text,
  requested_start_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  current_status public.campaign_status;
  required_permission text;
begin
  required_permission := case requested_action
    when 'submit' then 'campaign.write'
    when 'approve' then 'campaign.approve'
    when 'schedule' then 'campaign.launch'
    when 'pause' then 'campaign.launch'
    when 'cancel' then 'campaign.launch'
    else null
  end;
  if actor_id is null
    or required_permission is null
    or not private.has_permission(
      requested_agency_id, requested_client_id, required_permission
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Campaign transition is not authorized.';
  end if;

  select status into current_status
  from public.campaigns
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_campaign_id
  for update;
  if current_status is null then
    raise exception using errcode = 'P0002', message = 'Campaign not found.';
  end if;

  if requested_action = 'submit' and current_status = 'draft' then
    update public.campaigns
    set status = 'ready_for_review', submitted_by = actor_id,
      submitted_at = statement_timestamp(), updated_by = actor_id
    where id = requested_campaign_id;
  elsif requested_action = 'approve' and current_status = 'ready_for_review' then
    update public.campaigns
    set status = 'approved', approved_by = actor_id,
      approved_at = statement_timestamp(), updated_by = actor_id
    where id = requested_campaign_id;
  elsif requested_action = 'schedule'
    and current_status = 'approved'
    and requested_start_at is not null
    and requested_start_at > statement_timestamp()
  then
    update public.campaigns
    set status = 'scheduled', scheduled_by = actor_id,
      scheduled_at = statement_timestamp(),
      scheduled_start_at = requested_start_at, updated_by = actor_id
    where id = requested_campaign_id;
  elsif requested_action = 'pause' and current_status in ('scheduled', 'running') then
    update public.campaigns
    set status = 'paused', paused_by = actor_id,
      paused_at = statement_timestamp(), updated_by = actor_id
    where id = requested_campaign_id;
  elsif requested_action = 'cancel'
    and current_status not in ('completed', 'cancelled')
  then
    update public.campaigns
    set status = 'cancelled', cancelled_by = actor_id,
      cancelled_at = statement_timestamp(), updated_by = actor_id
    where id = requested_campaign_id;
  else
    raise exception using
      errcode = '55000',
      message = 'Campaign transition is invalid.';
  end if;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id,
    metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'campaign.' || requested_action, 'campaign', requested_campaign_id::text,
    jsonb_build_object('previous_status', current_status)
  );
  return requested_campaign_id;
end;
$$;

create or replace function public.create_campaign_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_payload jsonb
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_campaign_draft(
    requested_agency_id, requested_client_id, requested_payload
  );
$$;

create or replace function public.transition_campaign(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_campaign_id uuid,
  requested_action text,
  requested_start_at timestamptz default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.transition_campaign(
    requested_agency_id,
    requested_client_id,
    requested_campaign_id,
    requested_action,
    requested_start_at
  );
$$;

revoke execute on function
  private.create_campaign_draft(uuid, uuid, jsonb)
from public, anon;
revoke execute on function
  private.transition_campaign(uuid, uuid, uuid, text, timestamptz)
from public, anon;
revoke execute on function
  public.create_campaign_draft(uuid, uuid, jsonb)
from public, anon;
revoke execute on function
  public.transition_campaign(uuid, uuid, uuid, text, timestamptz)
from public, anon;
grant execute on function
  private.create_campaign_draft(uuid, uuid, jsonb)
to authenticated;
grant execute on function
  private.transition_campaign(uuid, uuid, uuid, text, timestamptz)
to authenticated;
grant execute on function
  public.create_campaign_draft(uuid, uuid, jsonb)
to authenticated;
grant execute on function
  public.transition_campaign(uuid, uuid, uuid, text, timestamptz)
to authenticated;
