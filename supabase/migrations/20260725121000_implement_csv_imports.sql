create type public.data_import_entity_type as enum ('company', 'contact');
create type public.data_import_status as enum (
  'draft',
  'ready',
  'queued',
  'processing',
  'completed',
  'completed_with_errors',
  'failed',
  'cancel_requested',
  'cancelled'
);
create type public.data_import_row_status as enum (
  'pending',
  'created',
  'duplicate',
  'invalid',
  'failed',
  'cancelled'
);

create table public.data_imports (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  entity_type public.data_import_entity_type not null,
  status public.data_import_status not null default 'draft',
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  file_sha256 text,
  delimiter text not null default ',',
  column_mapping jsonb not null,
  estimated_row_count integer,
  processed_row_count integer not null default 0,
  created_row_count integer not null default 0,
  duplicate_row_count integer not null default 0,
  invalid_row_count integer not null default 0,
  failed_row_count integer not null default 0,
  trigger_run_id text,
  error_summary jsonb not null default '{}'::jsonb,
  cancellation_requested_by uuid,
  cancellation_requested_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_data_imports primary key (id),
  constraint uq_data_imports__agency_client_id unique (agency_id, client_id, id),
  constraint uq_data_imports__storage_path unique (storage_path),
  constraint fk_data_imports__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_data_imports__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_data_imports__cancelled_by foreign key (cancellation_requested_by)
    references public.profiles (id) on delete restrict,
  constraint ck_data_imports__file_name check (
    char_length(file_name) between 1 and 240
    and file_name !~ '[/\\]'
  ),
  constraint ck_data_imports__storage_path check (
    storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
  ),
  constraint ck_data_imports__mime_type check (
    mime_type in ('text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain')
  ),
  constraint ck_data_imports__file_size check (
    file_size_bytes between 1 and 6291456
  ),
  constraint ck_data_imports__sha256 check (
    file_sha256 is null or file_sha256 ~ '^[a-f0-9]{64}$'
  ),
  constraint ck_data_imports__delimiter check (
    delimiter in (',', ';', E'\t', '|')
  ),
  constraint ck_data_imports__mapping_object check (
    jsonb_typeof(column_mapping) = 'object'
  ),
  constraint ck_data_imports__row_counts check (
    coalesce(estimated_row_count, 0) >= 0
    and processed_row_count >= 0
    and created_row_count >= 0
    and duplicate_row_count >= 0
    and invalid_row_count >= 0
    and failed_row_count >= 0
  ),
  constraint ck_data_imports__error_summary_object check (
    jsonb_typeof(error_summary) = 'object'
  ),
  constraint ck_data_imports__cancellation_metadata check (
    (cancellation_requested_by is null and cancellation_requested_at is null)
    or (cancellation_requested_by is not null and cancellation_requested_at is not null)
  )
);

alter table public.companies
  add column source_import_id uuid,
  add column source_import_row_number integer,
  add constraint fk_companies__source_import
    foreign key (agency_id, client_id, source_import_id)
    references public.data_imports (agency_id, client_id, id) on delete restrict,
  add constraint ck_companies__source_import_metadata check (
    (source_import_id is null and source_import_row_number is null)
    or (source_import_id is not null and source_import_row_number > 0)
  );

alter table public.contacts
  add column source_import_id uuid,
  add column source_import_row_number integer,
  add constraint fk_contacts__source_import
    foreign key (agency_id, client_id, source_import_id)
    references public.data_imports (agency_id, client_id, id) on delete restrict,
  add constraint ck_contacts__source_import_metadata check (
    (source_import_id is null and source_import_row_number is null)
    or (source_import_id is not null and source_import_row_number > 0)
  );

create unique index uq_companies__source_import_row
  on public.companies (source_import_id, source_import_row_number)
  where source_import_id is not null;
create unique index uq_contacts__source_import_row
  on public.contacts (source_import_id, source_import_row_number)
  where source_import_id is not null;

create table public.data_import_rows (
  id bigint generated always as identity,
  agency_id uuid not null,
  client_id uuid not null,
  import_id uuid not null,
  row_number integer not null,
  status public.data_import_row_status not null default 'pending',
  raw_data jsonb not null,
  normalized_data jsonb not null default '{}'::jsonb,
  company_id uuid,
  contact_id uuid,
  duplicate_reason text,
  error_codes text[] not null default '{}',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_data_import_rows primary key (id),
  constraint uq_data_import_rows__import_row unique (import_id, row_number),
  constraint fk_data_import_rows__import foreign key (agency_id, client_id, import_id)
    references public.data_imports (agency_id, client_id, id) on delete cascade,
  constraint fk_data_import_rows__company foreign key (agency_id, client_id, company_id)
    references public.companies (agency_id, client_id, id) on delete restrict,
  constraint fk_data_import_rows__contact foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint ck_data_import_rows__row_number check (row_number > 0),
  constraint ck_data_import_rows__raw_object check (jsonb_typeof(raw_data) = 'object'),
  constraint ck_data_import_rows__normalized_object check (jsonb_typeof(normalized_data) = 'object'),
  constraint ck_data_import_rows__target check (num_nonnulls(company_id, contact_id) <= 1),
  constraint ck_data_import_rows__error_message check (
    error_message is null or char_length(error_message) <= 500
  )
);

comment on table public.data_imports is
  'Tenant-scoped CSV import history and durable orchestration state. File content stays in a private Storage bucket.';
comment on table public.data_import_rows is
  'Per-row result and safe error report. The unique import/row key makes worker retries idempotent.';
comment on column public.data_imports.column_mapping is
  'Canonical-field-to-CSV-header mapping validated by the application before the import is queued.';
comment on column public.data_imports.file_sha256 is
  'Client-computed integrity hint. The server never treats this untrusted value as authorization evidence.';
comment on column public.data_import_rows.raw_data is
  'Potentially personal data protected by tenant RLS; it must never be copied to application logs.';

create index idx_data_imports__client_created
  on public.data_imports (agency_id, client_id, created_at desc);
create index idx_data_imports__work_queue
  on public.data_imports (status, created_at)
  where status in ('ready', 'queued', 'processing', 'cancel_requested');
create index idx_data_import_rows__import_status_row
  on public.data_import_rows (import_id, status, row_number);
create index idx_data_import_rows__company
  on public.data_import_rows (agency_id, client_id, company_id)
  where company_id is not null;
create index idx_data_import_rows__contact
  on public.data_import_rows (agency_id, client_id, contact_id)
  where contact_id is not null;

create trigger trg_data_imports__set_updated_at
before update on public.data_imports
for each row execute function private.set_updated_at();
create trigger trg_data_import_rows__set_updated_at
before update on public.data_import_rows
for each row execute function private.set_updated_at();

alter table public.data_imports enable row level security;
alter table public.data_import_rows enable row level security;

create policy data_imports_select_authorized
on public.data_imports
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

create policy data_import_rows_select_authorized
on public.data_import_rows
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

revoke all on public.data_imports, public.data_import_rows from anon, authenticated;
grant select on public.data_imports, public.data_import_rows to authenticated;
grant all on public.data_imports, public.data_import_rows to service_role;
grant usage, select on sequence public.data_import_rows_id_seq to service_role;

create or replace function private.prepare_data_import(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_entity_type public.data_import_entity_type,
  requested_file_name text,
  requested_mime_type text,
  requested_file_size_bytes bigint,
  requested_file_sha256 text,
  requested_delimiter text,
  requested_column_mapping jsonb,
  requested_estimated_row_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  import_id uuid := gen_random_uuid();
  clean_file_name text := btrim(requested_file_name);
  object_path text;
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Import creation is not authorized.';
  end if;
  if clean_file_name = ''
    or clean_file_name ~ '[/\\]'
    or clean_file_name !~* '\.csv$'
  then
    raise exception using errcode = '22023', message = 'A safe CSV file name is required.';
  end if;
  if requested_column_mapping is null
    or jsonb_typeof(requested_column_mapping) <> 'object'
    or requested_column_mapping = '{}'::jsonb
  then
    raise exception using errcode = '22023', message = 'A column mapping is required.';
  end if;

  object_path := concat(
    requested_agency_id::text, '/',
    requested_client_id::text, '/',
    import_id::text, '/',
    clean_file_name
  );

  insert into public.data_imports (
    id, agency_id, client_id, entity_type, file_name, storage_path,
    mime_type, file_size_bytes, file_sha256, delimiter, column_mapping,
    estimated_row_count, created_by
  )
  values (
    import_id, requested_agency_id, requested_client_id, requested_entity_type,
    clean_file_name, object_path, requested_mime_type, requested_file_size_bytes,
    lower(nullif(requested_file_sha256, '')), requested_delimiter,
    requested_column_mapping, requested_estimated_row_count, actor_id
  );

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id,
    metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'import.prepared', 'data_import', import_id::text,
    jsonb_build_object(
      'entity_type', requested_entity_type,
      'file_size_bytes', requested_file_size_bytes
    )
  );

  return jsonb_build_object('id', import_id, 'storagePath', object_path);
end;
$$;

create or replace function public.prepare_data_import(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_entity_type public.data_import_entity_type,
  requested_file_name text,
  requested_mime_type text,
  requested_file_size_bytes bigint,
  requested_file_sha256 text,
  requested_delimiter text,
  requested_column_mapping jsonb,
  requested_estimated_row_count integer
)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.prepare_data_import(
    requested_agency_id,
    requested_client_id,
    requested_entity_type,
    requested_file_name,
    requested_mime_type,
    requested_file_size_bytes,
    requested_file_sha256,
    requested_delimiter,
    requested_column_mapping,
    requested_estimated_row_count
  );
$$;

create or replace function private.mark_data_import_ready(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_import public.data_imports%rowtype;
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Import queueing is not authorized.';
  end if;

  select *
  into target_import
  from public.data_imports
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_import_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Import not found in tenant.';
  end if;
  if target_import.status not in ('draft', 'ready') then
    raise exception using errcode = '55000', message = 'Import is not queueable.';
  end if;
  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'lead-imports'
      and name = target_import.storage_path
  ) then
    raise exception using errcode = 'P0002', message = 'Uploaded CSV object not found.';
  end if;

  update public.data_imports
  set status = 'ready'
  where id = target_import.id;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'import.ready', 'data_import', requested_import_id::text
  );
  return requested_import_id;
end;
$$;

create or replace function public.mark_data_import_ready(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.mark_data_import_ready(
    requested_agency_id,
    requested_client_id,
    requested_import_id
  );
$$;

create or replace function private.set_data_import_trigger_run(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid,
  requested_trigger_run_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Import run update is not authorized.';
  end if;
  update public.data_imports
  set
    trigger_run_id = requested_trigger_run_id,
    status = case when status = 'ready' then 'queued' else status end
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_import_id
    and status in (
      'ready', 'queued', 'processing', 'completed',
      'completed_with_errors', 'cancel_requested', 'cancelled'
    );
  if not found then
    raise exception using errcode = 'P0002', message = 'Import run is not assignable.';
  end if;
  return requested_import_id;
end;
$$;

create or replace function public.set_data_import_trigger_run(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid,
  requested_trigger_run_id text
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.set_data_import_trigger_run(
    requested_agency_id,
    requested_client_id,
    requested_import_id,
    requested_trigger_run_id
  );
$$;

create or replace function private.request_data_import_cancellation(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  previous_status public.data_import_status;
  next_status public.data_import_status;
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Import cancellation is not authorized.';
  end if;
  select status
  into previous_status
  from public.data_imports
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_import_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Import not found in tenant.';
  end if;
  if previous_status not in ('draft', 'ready', 'queued', 'processing', 'cancel_requested') then
    raise exception using errcode = '55000', message = 'Import can no longer be cancelled.';
  end if;

  next_status := case
    when previous_status = 'processing'
      then 'cancel_requested'::public.data_import_status
    when previous_status = 'cancel_requested'
      then 'cancel_requested'::public.data_import_status
    else 'cancelled'::public.data_import_status
  end;
  update public.data_imports
  set
    status = next_status,
    cancellation_requested_by = actor_id,
    cancellation_requested_at = statement_timestamp(),
    completed_at = case when next_status = 'cancelled' then statement_timestamp() else completed_at end
  where id = requested_import_id;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id,
    metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'import.cancellation_requested', 'data_import', requested_import_id::text,
    jsonb_build_object('previous_status', previous_status, 'next_status', next_status)
  );
  return requested_import_id;
end;
$$;

create or replace function public.request_data_import_cancellation(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_import_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.request_data_import_cancellation(
    requested_agency_id,
    requested_client_id,
    requested_import_id
  );
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-imports',
  'lead-imports',
  false,
  6291456,
  array['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy lead_import_objects_insert_authorized
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lead-imports'
  and exists (
    select 1
    from public.data_imports as data_import
    where data_import.storage_path = name
      and data_import.created_by = (select auth.uid())
      and data_import.status = 'draft'
      and private.has_permission(
        data_import.agency_id,
        data_import.client_id,
        'lead.write'
      )
  )
);

create policy lead_import_objects_select_authorized
on storage.objects
for select
to authenticated
using (
  bucket_id = 'lead-imports'
  and exists (
    select 1
    from public.data_imports as data_import
    where data_import.storage_path = name
      and private.has_permission(
        data_import.agency_id,
        data_import.client_id,
        'lead.read'
      )
  )
);

revoke execute on function private.prepare_data_import(
  uuid, uuid, public.data_import_entity_type, text, text, bigint, text, text,
  jsonb, integer
) from public, anon;
revoke execute on function private.mark_data_import_ready(uuid, uuid, uuid)
  from public, anon;
revoke execute on function private.set_data_import_trigger_run(uuid, uuid, uuid, text)
  from public, anon;
revoke execute on function private.request_data_import_cancellation(uuid, uuid, uuid)
  from public, anon;
revoke execute on function public.prepare_data_import(
  uuid, uuid, public.data_import_entity_type, text, text, bigint, text, text,
  jsonb, integer
) from public, anon;
revoke execute on function public.mark_data_import_ready(uuid, uuid, uuid)
  from public, anon;
revoke execute on function public.set_data_import_trigger_run(uuid, uuid, uuid, text)
  from public, anon;
revoke execute on function public.request_data_import_cancellation(uuid, uuid, uuid)
  from public, anon;

grant execute on function private.prepare_data_import(
  uuid, uuid, public.data_import_entity_type, text, text, bigint, text, text,
  jsonb, integer
) to authenticated;
grant execute on function private.mark_data_import_ready(uuid, uuid, uuid)
  to authenticated;
grant execute on function private.set_data_import_trigger_run(uuid, uuid, uuid, text)
  to authenticated;
grant execute on function private.request_data_import_cancellation(uuid, uuid, uuid)
  to authenticated;
grant execute on function public.prepare_data_import(
  uuid, uuid, public.data_import_entity_type, text, text, bigint, text, text,
  jsonb, integer
) to authenticated;
grant execute on function public.mark_data_import_ready(uuid, uuid, uuid)
  to authenticated;
grant execute on function public.set_data_import_trigger_run(uuid, uuid, uuid, text)
  to authenticated;
grant execute on function public.request_data_import_cancellation(uuid, uuid, uuid)
  to authenticated;
