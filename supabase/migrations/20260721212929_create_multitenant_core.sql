create schema if not exists private;

comment on schema private is
  'Non-exposed database functions used by triggers and row-level security.';

revoke all on schema private from public, anon, authenticated;

create type public.workspace_status as enum (
  'draft',
  'onboarding',
  'active',
  'paused',
  'archived'
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create or replace function private.prevent_tenant_scope_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if to_jsonb(new) ? 'agency_id'
     and to_jsonb(old) -> 'agency_id' is distinct from to_jsonb(new) -> 'agency_id' then
    raise exception 'agency_id cannot be reassigned'
      using errcode = '23514';
  end if;

  if to_jsonb(new) ? 'client_id'
     and to_jsonb(old) -> 'client_id' is distinct from to_jsonb(new) -> 'client_id' then
    raise exception 'client_id cannot be reassigned'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.prevent_tenant_scope_change() from public, anon, authenticated;

create table public.profiles (
  id uuid not null,
  display_name text,
  avatar_url text,
  locale text not null default 'fr',
  timezone text not null default 'UTC',
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_profiles primary key (id),
  constraint fk_profiles__id foreign key (id)
    references auth.users (id) on delete cascade,
  constraint fk_profiles__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_profiles__display_name_length check (
    display_name is null or char_length(btrim(display_name)) between 1 and 120
  ),
  constraint ck_profiles__locale_format check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint ck_profiles__timezone_not_blank check (char_length(btrim(timezone)) between 1 and 64)
);

comment on table public.profiles is
  'Application profile paired one-to-one with auth.users; it contains no authorization claims.';
comment on column public.profiles.id is 'Supabase Auth user identifier.';
comment on column public.profiles.created_by is
  'Actor that created the profile when provisioned administratively; null for the Auth signup trigger.';

create table public.agencies (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null,
  status public.workspace_status not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_agencies primary key (id),
  constraint uq_agencies__slug unique (slug),
  constraint fk_agencies__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_agencies__name_length check (char_length(btrim(name)) between 1 and 160),
  constraint ck_agencies__slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 80
  )
);

comment on table public.agencies is
  'Top-level business tenant operated by a lead-generation agency.';
comment on column public.agencies.status is
  'Lifecycle state; archived replaces hard deletion so tenant history remains attributable.';

create table public.clients (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  name text not null,
  slug text not null,
  status public.workspace_status not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_clients primary key (id),
  constraint uq_clients__agency_id_id unique (agency_id, id),
  constraint uq_clients__agency_id_slug unique (agency_id, slug),
  constraint fk_clients__agency_id foreign key (agency_id)
    references public.agencies (id) on delete restrict,
  constraint fk_clients__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_clients__name_length check (char_length(btrim(name)) between 1 and 160),
  constraint ck_clients__slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 80
  )
);

comment on table public.clients is
  'Client workspace owned by exactly one agency; all client-scoped resources inherit this pair.';
comment on column public.clients.agency_id is
  'Immutable parent tenant identifier.';
comment on column public.clients.status is
  'Lifecycle state; archived replaces hard deletion to preserve business and audit history.';

create index idx_profiles__created_by
  on public.profiles (created_by)
  where created_by is not null;
create index idx_agencies__created_by on public.agencies (created_by);
create index idx_agencies__status on public.agencies (status);
create index idx_clients__created_by on public.clients (created_by);
create index idx_clients__agency_id_status on public.clients (agency_id, status);

create trigger trg_profiles__set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger trg_agencies__set_updated_at
before update on public.agencies
for each row execute function private.set_updated_at();

create trigger trg_clients__set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

create trigger trg_clients__prevent_tenant_scope_change
before update of agency_id on public.clients
for each row execute function private.prevent_tenant_scope_change();

create or replace function private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '')
  );

  return new;
end;
$$;

comment on function private.create_profile_for_auth_user() is
  'Creates display-only profile data after Auth signup; metadata is never used for authorization.';

revoke execute on function private.create_profile_for_auth_user() from public, anon, authenticated;

create trigger trg_auth_users__create_profile
after insert on auth.users
for each row execute function private.create_profile_for_auth_user();
