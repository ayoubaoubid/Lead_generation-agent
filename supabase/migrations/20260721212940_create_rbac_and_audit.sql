create type public.membership_status as enum (
  'invited',
  'active',
  'suspended',
  'removed'
);

create type public.role_scope as enum ('agency', 'client');

create table public.permissions (
  id uuid not null default gen_random_uuid(),
  key text not null,
  resource text not null,
  action text not null,
  description text not null,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_permissions primary key (id),
  constraint uq_permissions__key unique (key),
  constraint uq_permissions__resource_action unique (resource, action),
  constraint fk_permissions__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_permissions__key_format check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  constraint ck_permissions__resource_format check (resource ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_permissions__action_format check (action ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_permissions__description_not_blank check (char_length(btrim(description)) between 1 and 240),
  constraint ck_permissions__key_matches_parts check (key = resource || '.' || action)
);

comment on table public.permissions is
  'Global, code-defined permission catalog. Permissions never contain tenant-specific assignments.';

create table public.roles (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid,
  scope public.role_scope not null,
  name text not null,
  slug text not null,
  description text,
  is_system boolean not null default false,
  archived_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_roles primary key (id),
  constraint uq_roles__agency_id_id unique (agency_id, id),
  constraint uq_roles__agency_id_client_id_id unique (agency_id, client_id, id),
  constraint fk_roles__agency_id foreign key (agency_id)
    references public.agencies (id) on delete restrict,
  constraint fk_roles__agency_id_client_id foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_roles__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_roles__scope_matches_client check (
    (scope = 'agency' and client_id is null)
    or (scope = 'client' and client_id is not null)
  ),
  constraint ck_roles__name_length check (char_length(btrim(name)) between 1 and 100),
  constraint ck_roles__slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 80
  )
);

comment on table public.roles is
  'Agency-scoped or client-scoped RBAC role. archived_at is retained because memberships and audit history must remain attributable.';
comment on column public.roles.client_id is
  'Null only for agency-scoped roles; otherwise identifies the exact client workspace.';

create unique index uq_roles__agency_slug_active
  on public.roles (agency_id, slug)
  where client_id is null and archived_at is null;
create unique index uq_roles__client_slug_active
  on public.roles (agency_id, client_id, slug)
  where client_id is not null and archived_at is null;

create table public.agency_members (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  profile_id uuid not null,
  role_id uuid not null,
  status public.membership_status not null default 'invited',
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_agency_members primary key (id),
  constraint uq_agency_members__agency_id_profile_id unique (agency_id, profile_id),
  constraint fk_agency_members__agency_id foreign key (agency_id)
    references public.agencies (id) on delete restrict,
  constraint fk_agency_members__profile_id foreign key (profile_id)
    references public.profiles (id) on delete restrict,
  constraint fk_agency_members__agency_id_role_id foreign key (agency_id, role_id)
    references public.roles (agency_id, id) on delete restrict,
  constraint fk_agency_members__created_by foreign key (created_by)
    references public.profiles (id) on delete set null
);

comment on table public.agency_members is
  'Membership of an internal user in one agency. Status transitions replace soft deletion.';

create table public.client_members (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  profile_id uuid not null,
  role_id uuid not null,
  status public.membership_status not null default 'invited',
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_client_members primary key (id),
  constraint uq_client_members__client_id_profile_id unique (client_id, profile_id),
  constraint fk_client_members__agency_id_client_id foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_client_members__profile_id foreign key (profile_id)
    references public.profiles (id) on delete restrict,
  constraint fk_client_members__agency_id_client_id_role_id foreign key (agency_id, client_id, role_id)
    references public.roles (agency_id, client_id, id) on delete restrict,
  constraint fk_client_members__created_by foreign key (created_by)
    references public.profiles (id) on delete set null
);

comment on table public.client_members is
  'Membership of a client-side user in one client workspace. The composite role foreign key prevents cross-client assignment.';

create table public.role_permissions (
  role_id uuid not null,
  permission_id uuid not null,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_role_permissions primary key (role_id, permission_id),
  constraint fk_role_permissions__role_id foreign key (role_id)
    references public.roles (id) on delete cascade,
  constraint fk_role_permissions__permission_id foreign key (permission_id)
    references public.permissions (id) on delete restrict,
  constraint fk_role_permissions__created_by foreign key (created_by)
    references public.profiles (id) on delete set null
);

comment on table public.role_permissions is
  'Assignment of a global permission to a tenant-scoped role. Tenant columns are derived from role_id to avoid duplicated scope that could drift.';

create table public.audit_logs (
  id bigint generated always as identity,
  agency_id uuid not null,
  client_id uuid,
  created_by uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  correlation_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_audit_logs primary key (id),
  constraint fk_audit_logs__agency_id foreign key (agency_id)
    references public.agencies (id) on delete restrict,
  constraint fk_audit_logs__agency_id_client_id foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_audit_logs__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_audit_logs__action_format check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint ck_audit_logs__resource_type_format check (resource_type ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_audit_logs__metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.audit_logs is
  'Append-only record of privileged and security-relevant actions. It intentionally has no updated_at or soft deletion.';
comment on column public.audit_logs.created_by is
  'Human actor when applicable; null is reserved for a verified technical actor described in metadata.';
comment on column public.audit_logs.metadata is
  'Redacted structured context only; secrets, tokens and unnecessary PII are forbidden.';

create index idx_permissions__created_by
  on public.permissions (created_by)
  where created_by is not null;
create index idx_roles__created_by on public.roles (created_by);
create index idx_roles__agency_id_client_id on public.roles (agency_id, client_id);
create index idx_agency_members__profile_id_status on public.agency_members (profile_id, status);
create index idx_agency_members__role_id on public.agency_members (role_id);
create index idx_agency_members__created_by on public.agency_members (created_by);
create index idx_client_members__profile_id_status on public.client_members (profile_id, status);
create index idx_client_members__agency_id_client_id
  on public.client_members (agency_id, client_id);
create index idx_client_members__role_id on public.client_members (role_id);
create index idx_client_members__created_by on public.client_members (created_by);
create index idx_role_permissions__permission_id on public.role_permissions (permission_id);
create index idx_role_permissions__created_by
  on public.role_permissions (created_by)
  where created_by is not null;
create index idx_audit_logs__agency_id_created_at
  on public.audit_logs (agency_id, created_at desc);
create index idx_audit_logs__agency_id_client_id_created_at
  on public.audit_logs (agency_id, client_id, created_at desc)
  where client_id is not null;
create index idx_audit_logs__resource
  on public.audit_logs (agency_id, resource_type, resource_id, created_at desc)
  where resource_id is not null;
create index idx_audit_logs__correlation_id
  on public.audit_logs (correlation_id)
  where correlation_id is not null;
create index idx_audit_logs__created_by
  on public.audit_logs (created_by, created_at desc)
  where created_by is not null;

create or replace function private.assert_agency_role_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.roles as role
    where role.id = new.role_id
      and role.agency_id = new.agency_id
      and role.scope = 'agency'
      and role.client_id is null
      and role.archived_at is null
  ) then
    raise exception 'agency membership requires an active agency-scoped role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.reject_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit logs are append-only'
    using errcode = '55000';
end;
$$;

revoke execute on function private.assert_agency_role_scope() from public, anon, authenticated;
revoke execute on function private.reject_audit_log_mutation() from public, anon, authenticated;

create trigger trg_agency_members__assert_role_scope
before insert or update of agency_id, role_id on public.agency_members
for each row execute function private.assert_agency_role_scope();

create trigger trg_audit_logs__reject_mutation
before update or delete on public.audit_logs
for each row execute function private.reject_audit_log_mutation();

create trigger trg_permissions__set_updated_at
before update on public.permissions
for each row execute function private.set_updated_at();
create trigger trg_roles__set_updated_at
before update on public.roles
for each row execute function private.set_updated_at();
create trigger trg_agency_members__set_updated_at
before update on public.agency_members
for each row execute function private.set_updated_at();
create trigger trg_client_members__set_updated_at
before update on public.client_members
for each row execute function private.set_updated_at();
create trigger trg_role_permissions__set_updated_at
before update on public.role_permissions
for each row execute function private.set_updated_at();

create trigger trg_roles__prevent_tenant_scope_change
before update of agency_id, client_id on public.roles
for each row execute function private.prevent_tenant_scope_change();
create trigger trg_agency_members__prevent_tenant_scope_change
before update of agency_id on public.agency_members
for each row execute function private.prevent_tenant_scope_change();
create trigger trg_client_members__prevent_tenant_scope_change
before update of agency_id, client_id on public.client_members
for each row execute function private.prevent_tenant_scope_change();
