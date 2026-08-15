create type public.contact_audience_type as enum ('b2b', 'b2c', 'unknown');
create type public.data_subject_request_type as enum (
  'access',
  'export',
  'delete_contact',
  'delete_client',
  'delete_agency'
);
create type public.data_subject_request_status as enum (
  'received',
  'verified',
  'in_progress',
  'completed',
  'rejected'
);
create type public.suppression_reason as enum (
  'unsubscribe',
  'deleted',
  'suppression_list',
  'complaint',
  'hard_bounce',
  'manual'
);
create type public.suppression_scope as enum ('client', 'agency');

insert into public.permissions (
  key, resource, action, description, allowed_scopes
) values
  (
    'compliance.read', 'compliance', 'read',
    'Read compliance records, suppression state and data subject requests.',
    array['agency'::public.role_scope, 'client'::public.role_scope]
  ),
  (
    'compliance.manage', 'compliance', 'manage',
    'Manage lawful-basis configuration, suppression and data subject requests.',
    array['agency'::public.role_scope, 'client'::public.role_scope]
  )
on conflict (key) do update set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes;

insert into public.role_permissions (role_id, permission_id, created_by)
select role.id, permission.id, role.created_by
from public.roles role
join public.permissions permission
  on permission.key in ('compliance.read', 'compliance.manage')
where role.archived_at is null
  and (
    (role.scope = 'agency' and role.slug = 'owner')
    or (role.scope = 'client' and role.slug = 'recruiter')
  )
on conflict (role_id, permission_id) do nothing;

create table public.client_compliance_profiles (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  purpose text not null,
  legal_basis text,
  audience_type public.contact_audience_type not null default 'unknown',
  countries text[] not null default '{}'::text[],
  channels text[] not null default array['email']::text[],
  retention_days integer,
  configuration_status text not null default 'draft',
  legal_reviewed_by text,
  legal_reviewed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_client_compliance_profiles primary key (id),
  constraint uq_client_compliance_profiles__tenant unique (agency_id, client_id),
  constraint fk_client_compliance_profiles__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_client_compliance_profiles__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_client_compliance_profiles__purpose check (
    char_length(btrim(purpose)) between 3 and 1000
  ),
  constraint ck_client_compliance_profiles__retention check (
    retention_days is null or retention_days between 1 and 3650
  ),
  constraint ck_client_compliance_profiles__status check (
    configuration_status in ('draft', 'review_required', 'validated')
  ),
  constraint ck_client_compliance_profiles__legal_review check (
    (configuration_status <> 'validated')
    or (
      legal_basis is not null
      and legal_reviewed_by is not null
      and legal_reviewed_at is not null
    )
  )
);

create table public.contact_compliance_records (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  contact_id uuid not null,
  source text not null,
  source_url text,
  purpose text not null,
  legal_basis text,
  audience_type public.contact_audience_type not null default 'unknown',
  country text,
  collected_at timestamptz not null,
  retain_until timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_contact_compliance_records primary key (id),
  constraint uq_contact_compliance_records__tenant_id unique (agency_id, client_id, id),
  constraint fk_contact_compliance_records__contact foreign key (
    agency_id, client_id, contact_id
  ) references public.contacts (agency_id, client_id, id) on delete cascade,
  constraint fk_contact_compliance_records__creator foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_contact_compliance_records__source check (
    char_length(btrim(source)) between 2 and 500
  ),
  constraint ck_contact_compliance_records__purpose check (
    char_length(btrim(purpose)) between 3 and 1000
  ),
  constraint ck_contact_compliance_records__evidence check (
    jsonb_typeof(evidence) = 'object'
  )
);

create table public.suppression_entries (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid,
  scope public.suppression_scope not null,
  normalized_email_hash text not null,
  masked_email text not null,
  reason public.suppression_reason not null,
  source_resource_type text not null,
  source_resource_id uuid,
  effective_at timestamptz not null default statement_timestamp(),
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_suppression_entries primary key (id),
  constraint fk_suppression_entries__agency foreign key (agency_id)
    references public.agencies (id) on delete restrict,
  constraint fk_suppression_entries__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_suppression_entries__creator foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_suppression_entries__scope check (
    (scope = 'agency' and client_id is null)
    or (scope = 'client' and client_id is not null)
  ),
  constraint ck_suppression_entries__hash check (
    normalized_email_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint ck_suppression_entries__source check (
    char_length(btrim(source_resource_type)) between 2 and 80
  )
);

create unique index uq_suppression_entries__client_email
  on public.suppression_entries (
    agency_id, client_id, normalized_email_hash
  ) where scope = 'client';
create unique index uq_suppression_entries__agency_email
  on public.suppression_entries (
    agency_id, normalized_email_hash
  ) where scope = 'agency';

create table public.data_subject_requests (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid,
  contact_id uuid,
  request_type public.data_subject_request_type not null,
  status public.data_subject_request_status not null default 'received',
  requester_email_hash text,
  verified_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  rejection_reason text,
  result_reference text,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_data_subject_requests primary key (id),
  constraint fk_data_subject_requests__agency foreign key (agency_id)
    references public.agencies (id) on delete restrict,
  constraint fk_data_subject_requests__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_data_subject_requests__contact foreign key (
    agency_id, client_id, contact_id
  ) references public.contacts (agency_id, client_id, id) on delete set null,
  constraint fk_data_subject_requests__creator foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_data_subject_requests__hash check (
    requester_email_hash is null or requester_email_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint ck_data_subject_requests__scope check (
    (request_type in ('delete_agency') and client_id is null and contact_id is null)
    or (request_type in ('delete_client') and client_id is not null and contact_id is null)
    or (request_type in ('access', 'export', 'delete_contact') and client_id is not null)
  ),
  constraint ck_data_subject_requests__completion check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index idx_contact_compliance_records__retention
  on public.contact_compliance_records (agency_id, client_id, retain_until);
create index idx_data_subject_requests__due
  on public.data_subject_requests (status, due_at)
  where status not in ('completed', 'rejected');

comment on table public.client_compliance_profiles is
  'Operational configuration only. Final lawful-basis decisions depend on jurisdiction and channel and require qualified review.';
comment on column public.suppression_entries.normalized_email_hash is
  'SHA-256 of the lowercase trimmed address. The suppression ledger does not retain the full address.';

create trigger trg_client_compliance_profiles__set_updated_at
before update on public.client_compliance_profiles
for each row execute function private.set_updated_at();
create trigger trg_contact_compliance_records__set_updated_at
before update on public.contact_compliance_records
for each row execute function private.set_updated_at();
create trigger trg_data_subject_requests__set_updated_at
before update on public.data_subject_requests
for each row execute function private.set_updated_at();

alter table public.client_compliance_profiles enable row level security;
alter table public.contact_compliance_records enable row level security;
alter table public.suppression_entries enable row level security;
alter table public.data_subject_requests enable row level security;

create policy client_compliance_profiles_select on public.client_compliance_profiles
for select to authenticated
using (private.has_permission(agency_id, client_id, 'compliance.read'));
create policy contact_compliance_records_select on public.contact_compliance_records
for select to authenticated
using (private.has_permission(agency_id, client_id, 'compliance.read'));
create policy suppression_entries_select on public.suppression_entries
for select to authenticated
using (private.has_permission(agency_id, client_id, 'compliance.read'));
create policy data_subject_requests_select on public.data_subject_requests
for select to authenticated
using (private.has_permission(agency_id, client_id, 'compliance.read'));

revoke all on public.client_compliance_profiles,
  public.contact_compliance_records, public.suppression_entries,
  public.data_subject_requests from anon, authenticated;
grant select on public.client_compliance_profiles,
  public.contact_compliance_records, public.suppression_entries,
  public.data_subject_requests to authenticated;
grant select, insert, update on public.client_compliance_profiles,
  public.contact_compliance_records, public.suppression_entries,
  public.data_subject_requests to service_role;

create or replace function public.is_email_suppressed(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_email text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.suppression_entries entry
    where entry.agency_id = requested_agency_id
      and (
        (entry.scope = 'agency' and entry.client_id is null)
        or (entry.scope = 'client' and entry.client_id = requested_client_id)
      )
      and entry.normalized_email_hash = encode(
        extensions.digest(lower(btrim(requested_email)), 'sha256'),
        'hex'
      )
  );
$$;

create or replace function public.add_suppression_entry(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_email text,
  requested_reason public.suppression_reason,
  requested_scope public.suppression_scope,
  requested_source_resource_type text,
  requested_source_resource_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(requested_email));
  email_hash text;
  entry_id uuid;
  local_part text;
  domain_part text;
begin
  if auth.uid() is null
    or not private.has_permission(
      requested_agency_id,
      case when requested_scope = 'agency' then null else requested_client_id end,
      'compliance.manage'
    )
  then
    raise exception using errcode = '42501', message = 'Suppression is not authorized.';
  end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = '22023', message = 'Email address is invalid.';
  end if;

  email_hash := encode(extensions.digest(normalized_email, 'sha256'), 'hex');
  local_part := split_part(normalized_email, '@', 1);
  domain_part := split_part(normalized_email, '@', 2);

  insert into public.suppression_entries (
    agency_id, client_id, scope, normalized_email_hash, masked_email,
    reason, source_resource_type, source_resource_id, created_by
  ) values (
    requested_agency_id,
    case when requested_scope = 'agency' then null else requested_client_id end,
    requested_scope,
    email_hash,
    left(local_part, 1) || '***@' || domain_part,
    requested_reason,
    requested_source_resource_type,
    requested_source_resource_id,
    auth.uid()
  )
  on conflict do nothing
  returning id into entry_id;

  if entry_id is null then
    select id into entry_id from public.suppression_entries
    where agency_id = requested_agency_id
      and normalized_email_hash = email_hash
      and (
        (requested_scope = 'agency' and scope = 'agency' and client_id is null)
        or (
          requested_scope = 'client' and scope = 'client'
          and client_id = requested_client_id
        )
      );
  end if;
  return entry_id;
end;
$$;

revoke execute on function public.is_email_suppressed(uuid, uuid, text)
  from public, anon, authenticated;
revoke execute on function public.add_suppression_entry(
  uuid, uuid, text, public.suppression_reason,
  public.suppression_scope, text, uuid
) from public, anon;
grant execute on function public.is_email_suppressed(uuid, uuid, text)
  to service_role;
grant execute on function public.add_suppression_entry(
  uuid, uuid, text, public.suppression_reason,
  public.suppression_scope, text, uuid
) to authenticated, service_role;
