create type public.onboarding_status as enum (
  'draft',
  'completed',
  'validated'
);

create type public.onboarding_section_key as enum (
  'company_information',
  'products_services',
  'current_offer',
  'pricing',
  'existing_customers',
  'customer_cases',
  'available_proofs',
  'competitors',
  'problems_solved',
  'sales_process',
  'target_markets',
  'objectives',
  'existing_channels',
  'available_integrations'
);

insert into public.permissions (
  key,
  resource,
  action,
  description,
  allowed_scopes
)
values
  (
    'onboarding.read',
    'onboarding',
    'read',
    'Read the structured onboarding of an authorized client.',
    array['agency'::public.role_scope, 'client'::public.role_scope]
  ),
  (
    'onboarding.write',
    'onboarding',
    'write',
    'Save and complete the structured onboarding of an authorized client.',
    array['agency'::public.role_scope, 'client'::public.role_scope]
  ),
  (
    'onboarding.validate',
    'onboarding',
    'validate',
    'Validate a completed client onboarding.',
    array['agency'::public.role_scope, 'client'::public.role_scope]
  )
on conflict (key) do update
set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes;

-- Owner, Agency Admin and Client Admin receive newly introduced permissions
-- through the existing system-role provisioning rules.
select private.provision_agency_system_roles(agency.id, agency.created_by)
from public.agencies as agency;

select private.provision_client_system_roles(
  client.agency_id,
  client.id,
  client.created_by
)
from public.clients as client;

create table public.onboarding_sessions (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  status public.onboarding_status not null default 'draft',
  current_step smallint not null default 1,
  completed_step_count smallint not null default 0,
  created_by uuid not null,
  updated_by uuid not null,
  completed_at timestamptz,
  validated_at timestamptz,
  validated_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_onboarding_sessions primary key (id),
  constraint uq_onboarding_sessions__agency_id_client_id
    unique (agency_id, client_id),
  constraint uq_onboarding_sessions__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_onboarding_sessions__agency_id_client_id
    foreign key (agency_id, client_id)
    references public.clients (agency_id, id)
    on delete restrict,
  constraint fk_onboarding_sessions__created_by
    foreign key (created_by)
    references public.profiles (id)
    on delete restrict,
  constraint fk_onboarding_sessions__updated_by
    foreign key (updated_by)
    references public.profiles (id)
    on delete restrict,
  constraint fk_onboarding_sessions__validated_by
    foreign key (validated_by)
    references public.profiles (id)
    on delete restrict,
  constraint ck_onboarding_sessions__current_step
    check (current_step between 1 and 14),
  constraint ck_onboarding_sessions__completed_step_count
    check (completed_step_count between 0 and 14),
  constraint ck_onboarding_sessions__status_timestamps check (
    (
      status = 'draft'
      and completed_at is null
      and validated_at is null
      and validated_by is null
    )
    or (
      status = 'completed'
      and completed_at is not null
      and validated_at is null
      and validated_by is null
    )
    or (
      status = 'validated'
      and completed_at is not null
      and validated_at is not null
      and validated_by is not null
    )
  )
);

comment on table public.onboarding_sessions is
  'Client-scoped onboarding progress and controlled draft/completed/validated lifecycle.';
comment on column public.onboarding_sessions.current_step is
  'Last step selected by the user, used only to resume the interface.';
comment on column public.onboarding_sessions.completed_step_count is
  'Deterministic count of answers explicitly marked complete.';
comment on column public.onboarding_sessions.validated_by is
  'Authorized profile that validated the completed onboarding.';

create table public.onboarding_answers (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  session_id uuid not null,
  section_key public.onboarding_section_key not null,
  answer_data jsonb not null default '{}'::jsonb,
  is_complete boolean not null default false,
  revision integer not null default 1,
  completed_at timestamptz,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_onboarding_answers primary key (id),
  constraint uq_onboarding_answers__session_id_section_key
    unique (session_id, section_key),
  constraint uq_onboarding_answers__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_onboarding_answers__agency_id_client_id_session_id
    foreign key (agency_id, client_id, session_id)
    references public.onboarding_sessions (agency_id, client_id, id)
    on delete cascade,
  constraint fk_onboarding_answers__created_by
    foreign key (created_by)
    references public.profiles (id)
    on delete restrict,
  constraint fk_onboarding_answers__updated_by
    foreign key (updated_by)
    references public.profiles (id)
    on delete restrict,
  constraint ck_onboarding_answers__answer_object
    check (jsonb_typeof(answer_data) = 'object'),
  constraint ck_onboarding_answers__answer_size
    check (octet_length(answer_data::text) <= 50000),
  constraint ck_onboarding_answers__revision
    check (revision > 0),
  constraint ck_onboarding_answers__completion_timestamp check (
    (is_complete and completed_at is not null)
    or (not is_complete and completed_at is null)
  )
);

comment on table public.onboarding_answers is
  'Latest validated JSON answer for each of the fourteen onboarding sections.';
comment on column public.onboarding_answers.answer_data is
  'Structured application-validated input; external content remains untrusted data.';
comment on column public.onboarding_answers.revision is
  'Monotonic revision incremented only when the answer or completion flag changes.';

create table public.onboarding_answer_history (
  id bigint generated always as identity,
  agency_id uuid not null,
  client_id uuid not null,
  session_id uuid not null,
  answer_id uuid not null,
  section_key public.onboarding_section_key not null,
  revision integer not null,
  previous_answer_data jsonb,
  answer_data jsonb not null,
  previous_is_complete boolean,
  is_complete boolean not null,
  changed_by uuid not null,
  changed_at timestamptz not null default statement_timestamp(),
  constraint pk_onboarding_answer_history primary key (id),
  constraint uq_onboarding_answer_history__answer_id_revision
    unique (answer_id, revision),
  constraint fk_onboarding_answer_history__agency_id_client_id_session_id
    foreign key (agency_id, client_id, session_id)
    references public.onboarding_sessions (agency_id, client_id, id)
    on delete cascade,
  constraint fk_onboarding_answer_history__agency_id_client_id_answer_id
    foreign key (agency_id, client_id, answer_id)
    references public.onboarding_answers (agency_id, client_id, id)
    on delete cascade,
  constraint fk_onboarding_answer_history__changed_by
    foreign key (changed_by)
    references public.profiles (id)
    on delete restrict,
  constraint ck_onboarding_answer_history__answer_object
    check (jsonb_typeof(answer_data) = 'object'),
  constraint ck_onboarding_answer_history__previous_answer_object check (
    previous_answer_data is null
    or jsonb_typeof(previous_answer_data) = 'object'
  ),
  constraint ck_onboarding_answer_history__revision
    check (revision > 0)
);

comment on table public.onboarding_answer_history is
  'Append-only snapshot history for every meaningful onboarding answer revision.';
comment on column public.onboarding_answer_history.previous_answer_data is
  'Previous structured answer; null only for the first revision.';

create index idx_onboarding_sessions__agency_id_client_id_status
  on public.onboarding_sessions (agency_id, client_id, status);
create index idx_onboarding_sessions__created_by
  on public.onboarding_sessions (created_by);
create index idx_onboarding_sessions__updated_by
  on public.onboarding_sessions (updated_by);
create index idx_onboarding_sessions__validated_by
  on public.onboarding_sessions (validated_by)
  where validated_by is not null;
create index idx_onboarding_answers__agency_id_client_id
  on public.onboarding_answers (agency_id, client_id, section_key);
create index idx_onboarding_answers__session_id_is_complete
  on public.onboarding_answers (session_id, is_complete);
create index idx_onboarding_answers__created_by
  on public.onboarding_answers (created_by);
create index idx_onboarding_answers__updated_by
  on public.onboarding_answers (updated_by);
create index idx_onboarding_answer_history__agency_id_client_id_changed_at
  on public.onboarding_answer_history (
    agency_id,
    client_id,
    changed_at desc
  );
create index idx_onboarding_answer_history__session_id_section_key_revision
  on public.onboarding_answer_history (
    session_id,
    section_key,
    revision desc
  );
create index idx_onboarding_answer_history__changed_by
  on public.onboarding_answer_history (changed_by);

create trigger trg_onboarding_sessions__set_updated_at
before update on public.onboarding_sessions
for each row execute function private.set_updated_at();

create trigger trg_onboarding_answers__set_updated_at
before update on public.onboarding_answers
for each row execute function private.set_updated_at();

alter table public.onboarding_sessions enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.onboarding_answer_history enable row level security;

revoke all on table public.onboarding_sessions from public, anon, authenticated;
revoke all on table public.onboarding_answers from public, anon, authenticated;
revoke all on table public.onboarding_answer_history from public, anon, authenticated;

grant select on table public.onboarding_sessions to authenticated;
grant select on table public.onboarding_answers to authenticated;
grant select on table public.onboarding_answer_history to authenticated;

grant select, insert, update, delete
on table public.onboarding_sessions to service_role;
grant select, insert, update, delete
on table public.onboarding_answers to service_role;
grant select, insert, update, delete
on table public.onboarding_answer_history to service_role;
grant usage, select
on sequence public.onboarding_answer_history_id_seq to service_role;

create policy onboarding_sessions_select_authorized_members
on public.onboarding_sessions
for select
to authenticated
using (
  (select private.has_permission(
    agency_id,
    client_id,
    'onboarding.read'
  ))
);

create policy onboarding_answers_select_authorized_members
on public.onboarding_answers
for select
to authenticated
using (
  (select private.has_permission(
    agency_id,
    client_id,
    'onboarding.read'
  ))
);

create policy onboarding_answer_history_select_authorized_members
on public.onboarding_answer_history
for select
to authenticated
using (
  (select private.has_permission(
    agency_id,
    client_id,
    'onboarding.read'
  ))
);

create or replace function private.save_onboarding_step(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_section_key public.onboarding_section_key,
  requested_answer_data jsonb,
  requested_is_complete boolean,
  requested_current_step smallint
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  onboarding_session public.onboarding_sessions%rowtype;
  previous_answer public.onboarding_answers%rowtype;
  saved_answer public.onboarding_answers%rowtype;
  complete_count smallint;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    'onboarding.write'
  ) then
    raise exception 'onboarding write permission required'
      using errcode = '42501';
  end if;

  if requested_current_step not between 1 and 14 then
    raise exception 'invalid onboarding step'
      using errcode = '23514';
  end if;

  if jsonb_typeof(requested_answer_data) <> 'object'
    or octet_length(requested_answer_data::text) > 50000
  then
    raise exception 'invalid onboarding answer'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.clients as client
    where client.agency_id = requested_agency_id
      and client.id = requested_client_id
      and client.status <> 'archived'
  ) then
    raise exception 'client not found'
      using errcode = 'P0002';
  end if;

  insert into public.onboarding_sessions (
    agency_id,
    client_id,
    current_step,
    created_by,
    updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    requested_current_step,
    actor_id,
    actor_id
  )
  on conflict (agency_id, client_id) do update
  set
    current_step = excluded.current_step,
    updated_by = excluded.updated_by
  returning * into onboarding_session;

  if onboarding_session.status = 'validated' then
    raise exception 'validated onboarding is immutable'
      using errcode = '55000';
  end if;

  select answer.*
  into previous_answer
  from public.onboarding_answers as answer
  where answer.session_id = onboarding_session.id
    and answer.section_key = requested_section_key
  for update;

  if previous_answer.id is not null
    and previous_answer.answer_data = requested_answer_data
    and previous_answer.is_complete = requested_is_complete
  then
    return onboarding_session.id;
  end if;

  insert into public.onboarding_answers (
    agency_id,
    client_id,
    session_id,
    section_key,
    answer_data,
    is_complete,
    completed_at,
    created_by,
    updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    onboarding_session.id,
    requested_section_key,
    requested_answer_data,
    requested_is_complete,
    case
      when requested_is_complete then statement_timestamp()
      else null
    end,
    actor_id,
    actor_id
  )
  on conflict (session_id, section_key) do update
  set
    answer_data = excluded.answer_data,
    is_complete = excluded.is_complete,
    completed_at = excluded.completed_at,
    revision = public.onboarding_answers.revision + 1,
    updated_by = excluded.updated_by
  returning * into saved_answer;

  insert into public.onboarding_answer_history (
    agency_id,
    client_id,
    session_id,
    answer_id,
    section_key,
    revision,
    previous_answer_data,
    answer_data,
    previous_is_complete,
    is_complete,
    changed_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    onboarding_session.id,
    saved_answer.id,
    requested_section_key,
    saved_answer.revision,
    previous_answer.answer_data,
    saved_answer.answer_data,
    previous_answer.is_complete,
    saved_answer.is_complete,
    actor_id
  );

  select count(*)::smallint
  into complete_count
  from public.onboarding_answers as answer
  where answer.session_id = onboarding_session.id
    and answer.is_complete;

  update public.onboarding_sessions
  set
    status = 'draft',
    current_step = requested_current_step,
    completed_step_count = complete_count,
    completed_at = null,
    validated_at = null,
    validated_by = null,
    updated_by = actor_id
  where id = onboarding_session.id;

  update public.clients
  set status = 'onboarding'
  where agency_id = requested_agency_id
    and id = requested_client_id
    and status = 'draft';

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
    'onboarding.step_saved',
    'onboarding_session',
    onboarding_session.id::text,
    jsonb_build_object(
      'section_key', requested_section_key,
      'revision', saved_answer.revision,
      'is_complete', saved_answer.is_complete,
      'completed_step_count', complete_count
    )
  );

  return onboarding_session.id;
end;
$$;

create or replace function public.save_onboarding_step(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_section_key public.onboarding_section_key,
  requested_answer_data jsonb,
  requested_is_complete boolean,
  requested_current_step smallint
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.save_onboarding_step(
    requested_agency_id,
    requested_client_id,
    requested_section_key,
    requested_answer_data,
    requested_is_complete,
    requested_current_step
  );
$$;

comment on function public.save_onboarding_step(
  uuid,
  uuid,
  public.onboarding_section_key,
  jsonb,
  boolean,
  smallint
) is
  'Atomically saves one authorized onboarding step, its revision history and audit metadata.';

create or replace function private.complete_client_onboarding(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  onboarding_session public.onboarding_sessions%rowtype;
  complete_count smallint;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    'onboarding.write'
  ) then
    raise exception 'onboarding write permission required'
      using errcode = '42501';
  end if;

  select session.*
  into onboarding_session
  from public.onboarding_sessions as session
  where session.agency_id = requested_agency_id
    and session.client_id = requested_client_id
  for update;

  if onboarding_session.id is null then
    raise exception 'onboarding not found'
      using errcode = 'P0002';
  end if;

  if onboarding_session.status = 'validated' then
    raise exception 'validated onboarding is immutable'
      using errcode = '55000';
  end if;

  select count(*)::smallint
  into complete_count
  from public.onboarding_answers as answer
  where answer.session_id = onboarding_session.id
    and answer.is_complete;

  if complete_count <> 14 then
    raise exception 'all onboarding steps must be complete'
      using errcode = '23514';
  end if;

  update public.onboarding_sessions
  set
    status = 'completed',
    completed_step_count = 14,
    completed_at = statement_timestamp(),
    validated_at = null,
    validated_by = null,
    updated_by = actor_id
  where id = onboarding_session.id;

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
    'onboarding.completed',
    'onboarding_session',
    onboarding_session.id::text,
    jsonb_build_object('completed_step_count', 14)
  );

  return onboarding_session.id;
end;
$$;

create or replace function public.complete_client_onboarding(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.complete_client_onboarding(
    requested_agency_id,
    requested_client_id
  );
$$;

comment on function public.complete_client_onboarding(uuid, uuid) is
  'Transitions an authorized onboarding to completed only when all fourteen steps are complete.';

create or replace function private.validate_client_onboarding(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  onboarding_session public.onboarding_sessions%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    'onboarding.validate'
  ) then
    raise exception 'onboarding validation permission required'
      using errcode = '42501';
  end if;

  select session.*
  into onboarding_session
  from public.onboarding_sessions as session
  where session.agency_id = requested_agency_id
    and session.client_id = requested_client_id
  for update;

  if onboarding_session.id is null then
    raise exception 'onboarding not found'
      using errcode = 'P0002';
  end if;

  if onboarding_session.status <> 'completed' then
    raise exception 'onboarding must be completed before validation'
      using errcode = '55000';
  end if;

  update public.onboarding_sessions
  set
    status = 'validated',
    validated_at = statement_timestamp(),
    validated_by = actor_id,
    updated_by = actor_id
  where id = onboarding_session.id;

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
    'onboarding.validated',
    'onboarding_session',
    onboarding_session.id::text,
    jsonb_build_object('completed_step_count', 14)
  );

  return onboarding_session.id;
end;
$$;

create or replace function public.validate_client_onboarding(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.validate_client_onboarding(
    requested_agency_id,
    requested_client_id
  );
$$;

comment on function public.validate_client_onboarding(uuid, uuid) is
  'Validates a completed onboarding after an independent atomic permission check.';

revoke all on function private.save_onboarding_step(
  uuid,
  uuid,
  public.onboarding_section_key,
  jsonb,
  boolean,
  smallint
) from public, anon, authenticated;
revoke all on function private.complete_client_onboarding(uuid, uuid)
from public, anon, authenticated;
revoke all on function private.validate_client_onboarding(uuid, uuid)
from public, anon, authenticated;

revoke all on function public.save_onboarding_step(
  uuid,
  uuid,
  public.onboarding_section_key,
  jsonb,
  boolean,
  smallint
) from public, anon;
revoke all on function public.complete_client_onboarding(uuid, uuid)
from public, anon;
revoke all on function public.validate_client_onboarding(uuid, uuid)
from public, anon;

-- Public SECURITY INVOKER wrappers need EXECUTE on the exact private functions.
-- The private schema is not exposed and every function rechecks auth and tenant.
grant execute on function private.save_onboarding_step(
  uuid,
  uuid,
  public.onboarding_section_key,
  jsonb,
  boolean,
  smallint
) to authenticated;
grant execute on function private.complete_client_onboarding(uuid, uuid)
to authenticated;
grant execute on function private.validate_client_onboarding(uuid, uuid)
to authenticated;

grant execute on function public.save_onboarding_step(
  uuid,
  uuid,
  public.onboarding_section_key,
  jsonb,
  boolean,
  smallint
) to authenticated;
grant execute on function public.complete_client_onboarding(uuid, uuid)
to authenticated;
grant execute on function public.validate_client_onboarding(uuid, uuid)
to authenticated;
