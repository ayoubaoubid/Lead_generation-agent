alter table public.clients
  add column legal_name text,
  add column website_url text,
  add column industry text,
  add column country_code text,
  add column language_code text,
  add column timezone text,
  add column description text,
  add column logo_url text,
  add column objectives text[] not null default '{}'::text[],
  add column archived_at timestamptz,
  add column archived_by uuid;

update public.clients
set archived_at = updated_at
where status = 'archived'
  and archived_at is null;

alter table public.clients
  add constraint fk_clients__archived_by
    foreign key (archived_by)
    references public.profiles (id)
    on delete set null,
  add constraint ck_clients__legal_name_length check (
    legal_name is null
    or char_length(btrim(legal_name)) between 1 and 200
  ),
  add constraint ck_clients__website_url check (
    website_url is null
    or (
      char_length(website_url) <= 2048
      and website_url ~* '^https?://'
    )
  ),
  add constraint ck_clients__industry_length check (
    industry is null
    or char_length(btrim(industry)) between 1 and 120
  ),
  add constraint ck_clients__country_code check (
    country_code is null
    or country_code ~ '^[A-Z]{2}$'
  ),
  add constraint ck_clients__language_code check (
    language_code is null
    or language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'
  ),
  add constraint ck_clients__timezone check (
    timezone is null
    or (
      char_length(timezone) between 1 and 64
      and (
        timezone = 'UTC'
        or timezone ~ '^[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)+$'
      )
    )
  ),
  add constraint ck_clients__description_length check (
    description is null
    or char_length(btrim(description)) between 1 and 2000
  ),
  add constraint ck_clients__logo_url check (
    logo_url is null
    or (
      char_length(logo_url) <= 2048
      and logo_url ~* '^https://'
    )
  ),
  add constraint ck_clients__objectives_count check (
    cardinality(objectives) <= 20
  ),
  add constraint ck_clients__archive_consistency check (
    (
      status = 'archived'
      and archived_at is not null
    )
    or (
      status <> 'archived'
      and archived_at is null
      and archived_by is null
    )
  );

comment on column public.clients.legal_name is
  'Optional registered legal name, distinct from the commercial workspace name.';
comment on column public.clients.website_url is
  'Canonical HTTP(S) website supplied by the agency.';
comment on column public.clients.industry is
  'Agency-maintained industry label used for client portfolio filtering.';
comment on column public.clients.country_code is
  'ISO 3166-1 alpha-2 country code stored in uppercase.';
comment on column public.clients.language_code is
  'Primary BCP 47-compatible language code used for client operations.';
comment on column public.clients.timezone is
  'IANA timezone used for scheduling and reporting.';
comment on column public.clients.description is
  'General business context supplied during onboarding.';
comment on column public.clients.logo_url is
  'HTTPS URL for the client logo; it is presentation data, not an authorization input.';
comment on column public.clients.objectives is
  'Short agency-approved onboarding objectives, limited to twenty entries.';
comment on column public.clients.archived_at is
  'Timestamp of the controlled archive transition; null for active workspaces.';
comment on column public.clients.archived_by is
  'Profile that performed the controlled archive transition.';

create index idx_clients__agency_id_status_updated_at
  on public.clients (agency_id, status, updated_at desc, id);
create index idx_clients__agency_id_country_code
  on public.clients (agency_id, country_code)
  where status <> 'archived' and country_code is not null;
create index idx_clients__agency_id_industry
  on public.clients (agency_id, industry)
  where status <> 'archived' and industry is not null;
create index idx_clients__archived_by
  on public.clients (archived_by)
  where archived_by is not null;

insert into public.permissions (
  key,
  resource,
  action,
  description,
  allowed_scopes
)
values (
  'client.archive',
  'client',
  'archive',
  'Archive a client workspace through the controlled lifecycle transition.',
  array['agency'::public.role_scope]
)
on conflict (key) do update
set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes;

-- Synchronizing the system templates assigns client.archive only to Agency
-- Owner and Agency Admin because it is agency-scoped and no specialist role
-- includes it explicitly.
select private.provision_agency_system_roles(agency.id, agency.created_by)
from public.agencies as agency;

create or replace function private.create_client_profile(
  requested_agency_id uuid,
  requested_name text,
  requested_slug text,
  requested_legal_name text,
  requested_website_url text,
  requested_industry text,
  requested_country_code text,
  requested_language_code text,
  requested_timezone text,
  requested_description text,
  requested_logo_url text,
  requested_objectives text[],
  requested_status public.workspace_status
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_client_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(requested_agency_id, null, 'client.create') then
    raise exception 'client creation permission required'
      using errcode = '42501';
  end if;

  if requested_status not in ('draft', 'onboarding') then
    raise exception 'invalid initial client status'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(coalesce(requested_objectives, '{}'::text[])) as objective(value)
    where char_length(btrim(objective.value)) not between 1 and 240
  ) then
    raise exception 'invalid client objective'
      using errcode = '23514';
  end if;

  insert into public.clients (
    agency_id,
    name,
    slug,
    status,
    legal_name,
    website_url,
    industry,
    country_code,
    language_code,
    timezone,
    description,
    logo_url,
    objectives,
    created_by
  )
  values (
    requested_agency_id,
    requested_name,
    requested_slug,
    requested_status,
    nullif(btrim(requested_legal_name), ''),
    nullif(btrim(requested_website_url), ''),
    nullif(btrim(requested_industry), ''),
    nullif(upper(btrim(requested_country_code)), ''),
    nullif(btrim(requested_language_code), ''),
    nullif(btrim(requested_timezone), ''),
    nullif(btrim(requested_description), ''),
    nullif(btrim(requested_logo_url), ''),
    coalesce(requested_objectives, '{}'::text[]),
    actor_id
  )
  returning id into created_client_id;

  perform private.provision_client_system_roles(
    requested_agency_id,
    created_client_id,
    actor_id
  );

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
    created_client_id,
    actor_id,
    'client.created',
    'client',
    created_client_id::text,
    jsonb_build_object(
      'initial_status', requested_status,
      'system_roles_provisioned', true
    )
  );

  return created_client_id;
end;
$$;

create or replace function public.create_client_profile(
  requested_agency_id uuid,
  requested_name text,
  requested_slug text,
  requested_legal_name text,
  requested_website_url text,
  requested_industry text,
  requested_country_code text,
  requested_language_code text,
  requested_timezone text,
  requested_description text,
  requested_logo_url text,
  requested_objectives text[],
  requested_status public.workspace_status
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_client_profile(
    requested_agency_id,
    requested_name,
    requested_slug,
    requested_legal_name,
    requested_website_url,
    requested_industry,
    requested_country_code,
    requested_language_code,
    requested_timezone,
    requested_description,
    requested_logo_url,
    requested_objectives,
    requested_status
  );
$$;

comment on function public.create_client_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) is
  'Creates a complete client workspace after server and database permission checks.';

create or replace function private.update_client_profile(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_name text,
  requested_slug text,
  requested_legal_name text,
  requested_website_url text,
  requested_industry text,
  requested_country_code text,
  requested_language_code text,
  requested_timezone text,
  requested_description text,
  requested_logo_url text,
  requested_objectives text[],
  requested_status public.workspace_status
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  previous_status public.workspace_status;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    'client.manage'
  ) then
    raise exception 'client management permission required'
      using errcode = '42501';
  end if;

  if requested_status = 'archived' then
    raise exception 'use the controlled archive transition'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(coalesce(requested_objectives, '{}'::text[])) as objective(value)
    where char_length(btrim(objective.value)) not between 1 and 240
  ) then
    raise exception 'invalid client objective'
      using errcode = '23514';
  end if;

  select client.status
  into previous_status
  from public.clients as client
  where client.agency_id = requested_agency_id
    and client.id = requested_client_id;

  if previous_status is null then
    raise exception 'client not found'
      using errcode = 'P0002';
  end if;

  if previous_status = 'archived' then
    raise exception 'client is archived'
      using errcode = '55000';
  end if;

  update public.clients
  set
    name = requested_name,
    slug = requested_slug,
    status = requested_status,
    legal_name = nullif(btrim(requested_legal_name), ''),
    website_url = nullif(btrim(requested_website_url), ''),
    industry = nullif(btrim(requested_industry), ''),
    country_code = nullif(upper(btrim(requested_country_code)), ''),
    language_code = nullif(btrim(requested_language_code), ''),
    timezone = nullif(btrim(requested_timezone), ''),
    description = nullif(btrim(requested_description), ''),
    logo_url = nullif(btrim(requested_logo_url), ''),
    objectives = coalesce(requested_objectives, '{}'::text[])
  where agency_id = requested_agency_id
    and id = requested_client_id;

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
    'client.updated',
    'client',
    requested_client_id::text,
    jsonb_build_object(
      'previous_status', previous_status,
      'next_status', requested_status,
      'updated_fields',
      jsonb_build_array(
        'name',
        'slug',
        'legal_name',
        'website_url',
        'industry',
        'country_code',
        'language_code',
        'timezone',
        'description',
        'logo_url',
        'objectives',
        'status'
      )
    )
  );

  return requested_client_id;
end;
$$;

create or replace function public.update_client_profile(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_name text,
  requested_slug text,
  requested_legal_name text,
  requested_website_url text,
  requested_industry text,
  requested_country_code text,
  requested_language_code text,
  requested_timezone text,
  requested_description text,
  requested_logo_url text,
  requested_objectives text[],
  requested_status public.workspace_status
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.update_client_profile(
    requested_agency_id,
    requested_client_id,
    requested_name,
    requested_slug,
    requested_legal_name,
    requested_website_url,
    requested_industry,
    requested_country_code,
    requested_language_code,
    requested_timezone,
    requested_description,
    requested_logo_url,
    requested_objectives,
    requested_status
  );
$$;

comment on function public.update_client_profile(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) is
  'Updates an authorized non-archived client and records a value-free audit summary.';

create or replace function private.archive_client(
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
  archived_client_id uuid;
  previous_status public.workspace_status;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    'client.archive'
  ) then
    raise exception 'client archive permission required'
      using errcode = '42501';
  end if;

  select client.status
  into previous_status
  from public.clients as client
  where client.agency_id = requested_agency_id
    and client.id = requested_client_id;

  if previous_status is null then
    raise exception 'client not found'
      using errcode = 'P0002';
  end if;

  if previous_status = 'archived' then
    raise exception 'client is already archived'
      using errcode = '55000';
  end if;

  update public.clients
  set
    status = 'archived',
    archived_at = statement_timestamp(),
    archived_by = actor_id
  where agency_id = requested_agency_id
    and id = requested_client_id
  returning id into archived_client_id;

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
    'client.archived',
    'client',
    requested_client_id::text,
    jsonb_build_object('previous_status', previous_status)
  );

  return archived_client_id;
end;
$$;

create or replace function public.archive_client(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.archive_client(requested_agency_id, requested_client_id);
$$;

comment on function public.archive_client(uuid, uuid) is
  'Archives an authorized client without deleting tenant history and records the actor.';

revoke all on function private.create_client_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) from public, anon, authenticated;
revoke all on function private.update_client_profile(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) from public, anon, authenticated;
revoke all on function private.archive_client(uuid, uuid)
from public, anon, authenticated;

revoke all on function public.create_client_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) from public, anon;
revoke all on function public.update_client_profile(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) from public, anon;
revoke all on function public.archive_client(uuid, uuid)
from public, anon;

-- The invoker wrappers need EXECUTE on these exact internal functions. The
-- private schema is not exposed through the Data API, and every function
-- independently validates auth.uid(), tenant membership and atomic permission.
grant execute on function private.create_client_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) to authenticated;
grant execute on function private.update_client_profile(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) to authenticated;
grant execute on function private.archive_client(uuid, uuid)
to authenticated;

grant execute on function public.create_client_profile(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) to authenticated;
grant execute on function public.update_client_profile(
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  public.workspace_status
) to authenticated;
grant execute on function public.archive_client(uuid, uuid)
to authenticated;
