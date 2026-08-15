create type public.calendar_connection_status as enum (
  'pending',
  'connected',
  'degraded',
  'disconnected'
);

create type public.meeting_status as enum (
  'proposed',
  'confirmed',
  'rescheduled',
  'cancelled',
  'completed',
  'no_show'
);

create table public.calendar_connections (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  provider text not null,
  external_calendar_reference text not null,
  credential_reference text,
  status public.calendar_connection_status not null default 'pending',
  timezone text not null default 'UTC',
  last_sync_at timestamptz,
  last_error_code text,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  constraint pk_calendar_connections primary key (id),
  constraint uq_calendar_connections__tenant_id unique (agency_id, client_id, id),
  constraint uq_calendar_connections__external unique (
    agency_id, client_id, provider, external_calendar_reference
  ),
  constraint fk_calendar_connections__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_calendar_connections__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_calendar_connections__provider check (
    char_length(btrim(provider)) between 2 and 80
  ),
  constraint ck_calendar_connections__credential check (
    credential_reference is null
    or (
      char_length(credential_reference) between 8 and 240
      and credential_reference !~* '(password|secret|token|bearer|api[_-]?key)\s*[:=]'
    )
  )
);

create table public.calendar_availability_rules (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  calendar_connection_id uuid not null,
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  timezone text not null,
  buffer_before_minutes integer not null default 10,
  buffer_after_minutes integer not null default 10,
  active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_calendar_availability_rules primary key (id),
  constraint uq_calendar_availability_rules__tenant_id unique (agency_id, client_id, id),
  constraint fk_calendar_availability_rules__calendar foreign key (
    agency_id, client_id, calendar_connection_id
  ) references public.calendar_connections (agency_id, client_id, id) on delete cascade,
  constraint fk_calendar_availability_rules__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_calendar_availability_rules__weekday check (weekday between 1 and 7),
  constraint ck_calendar_availability_rules__times check (start_time < end_time),
  constraint ck_calendar_availability_rules__buffers check (
    buffer_before_minutes between 0 and 240
    and buffer_after_minutes between 0 and 240
  )
);

create table public.meetings (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  calendar_connection_id uuid,
  contact_id uuid not null,
  campaign_id uuid,
  campaign_prospect_id uuid,
  inbound_message_id uuid,
  owner_id uuid,
  title text not null,
  status public.meeting_status not null default 'proposed',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  video_url text,
  external_event_id text,
  cancellation_reason text,
  reminder_minutes integer[] not null default array[1440,60]::integer[],
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_meetings primary key (id),
  constraint uq_meetings__tenant_id unique (agency_id, client_id, id),
  constraint uq_meetings__external unique (
    agency_id, client_id, calendar_connection_id, external_event_id
  ),
  constraint fk_meetings__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_meetings__calendar foreign key (
    agency_id, client_id, calendar_connection_id
  ) references public.calendar_connections (agency_id, client_id, id) on delete restrict,
  constraint fk_meetings__contact foreign key (
    agency_id, client_id, contact_id
  ) references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint fk_meetings__campaign foreign key (
    agency_id, client_id, campaign_id
  ) references public.campaigns (agency_id, client_id, id) on delete set null,
  constraint fk_meetings__prospect foreign key (
    agency_id, client_id, campaign_prospect_id
  ) references public.campaign_prospects (agency_id, client_id, id) on delete set null,
  constraint fk_meetings__inbound foreign key (
    agency_id, client_id, inbound_message_id
  ) references public.inbound_messages (agency_id, client_id, id) on delete set null,
  constraint fk_meetings__owner foreign key (owner_id)
    references public.profiles (id) on delete set null,
  constraint fk_meetings__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_meetings__title check (char_length(btrim(title)) between 2 and 200),
  constraint ck_meetings__duration check (
    ends_at > starts_at and ends_at <= starts_at + interval '8 hours'
  ),
  constraint ck_meetings__video_url check (
    video_url is null or video_url ~ '^https://'
  )
);

create table public.meeting_preparations (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  meeting_id uuid not null,
  version_number integer not null,
  status public.reply_review_status not null default 'pending',
  prospect_summary text not null,
  known_information jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  situation_questions jsonb not null default '[]'::jsonb,
  problem_questions jsonb not null default '[]'::jsonb,
  implication_questions jsonb not null default '[]'::jsonb,
  need_payoff_questions jsonb not null default '[]'::jsonb,
  likely_objections jsonb not null default '[]'::jsonb,
  meeting_objective text not null,
  desired_next_step text not null,
  skill_version text not null,
  model text,
  confidence numeric(5,4) not null,
  evidence jsonb not null default '[]'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_meeting_preparations primary key (id),
  constraint uq_meeting_preparations__tenant_id unique (agency_id, client_id, id),
  constraint uq_meeting_preparations__version unique (meeting_id, version_number),
  constraint fk_meeting_preparations__meeting foreign key (
    agency_id, client_id, meeting_id
  ) references public.meetings (agency_id, client_id, id) on delete cascade,
  constraint fk_meeting_preparations__reviewer foreign key (reviewed_by)
    references public.profiles (id) on delete restrict,
  constraint fk_meeting_preparations__creator foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_meeting_preparations__json check (
    jsonb_typeof(known_information) = 'array'
    and jsonb_typeof(missing_information) = 'array'
    and jsonb_typeof(situation_questions) = 'array'
    and jsonb_typeof(problem_questions) = 'array'
    and jsonb_typeof(implication_questions) = 'array'
    and jsonb_typeof(need_payoff_questions) = 'array'
    and jsonb_typeof(likely_objections) = 'array'
    and jsonb_typeof(evidence) = 'array'
  ),
  constraint ck_meeting_preparations__confidence check (confidence between 0 and 1),
  constraint ck_meeting_preparations__review check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

create index idx_meetings__calendar
  on public.meetings (agency_id, client_id, starts_at, status);

comment on column public.calendar_connections.credential_reference is
  'Opaque secret-manager reference. OAuth tokens are never stored in this table.';
comment on table public.meeting_preparations is
  'Versioned SPIN Selling preparation grounded in tenant data and subject to human review.';

create trigger trg_calendar_connections__set_updated_at
before update on public.calendar_connections
for each row execute function private.set_updated_at();
create trigger trg_calendar_availability_rules__set_updated_at
before update on public.calendar_availability_rules
for each row execute function private.set_updated_at();
create trigger trg_meetings__set_updated_at
before update on public.meetings
for each row execute function private.set_updated_at();

alter table public.calendar_connections enable row level security;
alter table public.calendar_availability_rules enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_preparations enable row level security;

create policy calendar_connections_select on public.calendar_connections for select
to authenticated using (private.has_permission(agency_id, client_id, 'meeting.read'));
create policy calendar_availability_rules_select on public.calendar_availability_rules for select
to authenticated using (private.has_permission(agency_id, client_id, 'meeting.read'));
create policy meetings_select on public.meetings for select
to authenticated using (private.has_permission(agency_id, client_id, 'meeting.read'));
create policy meeting_preparations_select on public.meeting_preparations for select
to authenticated using (private.has_permission(agency_id, client_id, 'meeting.read'));

revoke all on public.calendar_connections, public.calendar_availability_rules,
  public.meetings, public.meeting_preparations from anon, authenticated;
grant select on public.calendar_connections, public.calendar_availability_rules,
  public.meetings, public.meeting_preparations to authenticated;
grant select, insert, update on public.calendar_connections,
  public.calendar_availability_rules, public.meetings,
  public.meeting_preparations to service_role;

create or replace function public.create_meeting(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_contact_id uuid,
  requested_campaign_id uuid,
  requested_title text,
  requested_starts_at timestamptz,
  requested_ends_at timestamptz,
  requested_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  meeting_id uuid;
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'meeting.write')
  then
    raise exception using errcode = '42501', message = 'Meeting creation is not authorized.';
  end if;

  insert into public.meetings (
    agency_id, client_id, contact_id, campaign_id, owner_id, title,
    starts_at, ends_at, timezone, created_by
  ) values (
    requested_agency_id, requested_client_id, requested_contact_id,
    requested_campaign_id, auth.uid(), btrim(requested_title),
    requested_starts_at, requested_ends_at, requested_timezone, auth.uid()
  )
  returning id into meeting_id;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  ) values (
    requested_agency_id, requested_client_id, auth.uid(),
    'meeting.created', 'meeting', meeting_id,
    jsonb_build_object('startsAt', requested_starts_at)
  );
  return meeting_id;
end;
$$;

revoke execute on function public.create_meeting(
  uuid, uuid, uuid, uuid, text, timestamptz, timestamptz, text
) from public, anon;
grant execute on function public.create_meeting(
  uuid, uuid, uuid, uuid, text, timestamptz, timestamptz, text
) to authenticated;
