create extension if not exists unaccent with schema extensions;

create type public.data_fact_status as enum (
  'confirmed',
  'extracted',
  'estimated',
  'hypothesis',
  'unverified'
);

create type public.data_verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'invalid',
  'stale'
);

create type public.entity_source_type as enum (
  'manual',
  'csv',
  'api',
  'website',
  'directory',
  'other'
);

create or replace function private.normalize_entity_name(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(
        lower(extensions.unaccent(value)),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ),
    ''
  );
$$;

create or replace function private.normalize_domain(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(btrim(value)), '^https?://', ''),
        '^www\.',
        ''
      ),
      '[/#:?].*$',
      ''
    ),
    ''
  );
$$;

create or replace function private.normalize_email(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select nullif(lower(btrim(value)), '');
$$;

create or replace function private.normalize_linkedin_url(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(btrim(value)), '[?#].*$', ''),
      '/+$',
      ''
    ),
    ''
  );
$$;

create table public.companies (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  name text not null,
  normalized_name text not null,
  domain text,
  website_url text,
  industry text,
  country_code text,
  employee_count integer,
  annual_revenue numeric(18, 2),
  revenue_currency text,
  technologies text[] not null default '{}',
  description text,
  fact_status public.data_fact_status not null default 'unverified',
  confidence_score smallint,
  verification_status public.data_verification_status not null default 'unverified',
  verified_by uuid,
  verified_at timestamptz,
  created_by uuid not null,
  archived_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_companies primary key (id),
  constraint uq_companies__agency_client_id unique (agency_id, client_id, id),
  constraint fk_companies__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_companies__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_companies__verified_by foreign key (verified_by)
    references public.profiles (id) on delete restrict,
  constraint fk_companies__archived_by foreign key (archived_by)
    references public.profiles (id) on delete restrict,
  constraint ck_companies__name check (char_length(btrim(name)) between 1 and 200),
  constraint ck_companies__normalized_name check (char_length(normalized_name) between 1 and 200),
  constraint ck_companies__domain check (
    domain is null or domain ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
  ),
  constraint ck_companies__country_code check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  constraint ck_companies__employee_count check (
    employee_count is null or employee_count >= 0
  ),
  constraint ck_companies__annual_revenue check (
    annual_revenue is null or annual_revenue >= 0
  ),
  constraint ck_companies__revenue_currency check (
    revenue_currency is null or revenue_currency ~ '^[A-Z]{3}$'
  ),
  constraint ck_companies__confidence check (
    confidence_score is null or confidence_score between 0 and 100
  ),
  constraint ck_companies__verification_metadata check (
    (verification_status = 'verified' and verified_by is not null and verified_at is not null)
    or (verification_status <> 'verified' and verified_by is null and verified_at is null)
  ),
  constraint ck_companies__archive_metadata check (
    (archived_at is null and archived_by is null)
    or (archived_at is not null and archived_by is not null)
  )
);

create table public.contacts (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  company_id uuid,
  first_name text,
  last_name text,
  full_name text not null,
  normalized_name text not null,
  email text,
  linkedin_url text,
  job_title text,
  department text,
  seniority text,
  phone text,
  country_code text,
  fact_status public.data_fact_status not null default 'unverified',
  confidence_score smallint,
  verification_status public.data_verification_status not null default 'unverified',
  verified_by uuid,
  verified_at timestamptz,
  created_by uuid not null,
  archived_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_contacts primary key (id),
  constraint uq_contacts__agency_client_id unique (agency_id, client_id, id),
  constraint fk_contacts__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_contacts__company foreign key (agency_id, client_id, company_id)
    references public.companies (agency_id, client_id, id) on delete restrict,
  constraint fk_contacts__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_contacts__verified_by foreign key (verified_by)
    references public.profiles (id) on delete restrict,
  constraint fk_contacts__archived_by foreign key (archived_by)
    references public.profiles (id) on delete restrict,
  constraint ck_contacts__full_name check (char_length(btrim(full_name)) between 1 and 200),
  constraint ck_contacts__normalized_name check (char_length(normalized_name) between 1 and 200),
  constraint ck_contacts__email check (
    email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint ck_contacts__linkedin_url check (
    linkedin_url is null or linkedin_url ~ '^https?://([a-z]{2,3}\.)?linkedin\.com/'
  ),
  constraint ck_contacts__country_code check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  constraint ck_contacts__confidence check (
    confidence_score is null or confidence_score between 0 and 100
  ),
  constraint ck_contacts__verification_metadata check (
    (verification_status = 'verified' and verified_by is not null and verified_at is not null)
    or (verification_status <> 'verified' and verified_by is null and verified_at is null)
  ),
  constraint ck_contacts__archive_metadata check (
    (archived_at is null and archived_by is null)
    or (archived_at is not null and archived_by is not null)
  )
);

create table public.company_sources (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  company_id uuid not null,
  source_type public.entity_source_type not null,
  provider text,
  external_id text,
  source_url text,
  collected_at timestamptz not null,
  fact_status public.data_fact_status not null default 'unverified',
  confidence_score smallint,
  verification_status public.data_verification_status not null default 'unverified',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_company_sources primary key (id),
  constraint fk_company_sources__company foreign key (agency_id, client_id, company_id)
    references public.companies (agency_id, client_id, id) on delete cascade,
  constraint fk_company_sources__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_company_sources__provider_external check (
    external_id is null or provider is not null
  ),
  constraint ck_company_sources__confidence check (
    confidence_score is null or confidence_score between 0 and 100
  ),
  constraint ck_company_sources__metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.contact_sources (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  contact_id uuid not null,
  source_type public.entity_source_type not null,
  provider text,
  external_id text,
  source_url text,
  collected_at timestamptz not null,
  fact_status public.data_fact_status not null default 'unverified',
  confidence_score smallint,
  verification_status public.data_verification_status not null default 'unverified',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_contact_sources primary key (id),
  constraint fk_contact_sources__contact foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete cascade,
  constraint fk_contact_sources__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_contact_sources__provider_external check (
    external_id is null or provider is not null
  ),
  constraint ck_contact_sources__confidence check (
    confidence_score is null or confidence_score between 0 and 100
  ),
  constraint ck_contact_sources__metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.companies is
  'Client-scoped company registry. Canonical fields are separated from their provenance records.';
comment on table public.contacts is
  'Client-scoped professional contacts. Email and LinkedIn are normalized before persistence.';
comment on table public.company_sources is
  'Appendable lineage for company facts and provider identifiers; never stores provider secrets.';
comment on table public.contact_sources is
  'Appendable lineage for contact facts and provider identifiers; never stores provider secrets.';
comment on column public.companies.normalized_name is
  'Deterministic search and duplicate-candidate key. It is not globally unique because names can legitimately collide.';
comment on column public.companies.confidence_score is
  'Source confidence from 0 to 100; null means the source did not provide a meaningful score.';

create unique index uq_companies__active_domain
  on public.companies (agency_id, client_id, domain)
  where domain is not null and archived_at is null;
create index idx_companies__active_normalized_name
  on public.companies (agency_id, client_id, normalized_name)
  where archived_at is null;
create index idx_companies__client_updated
  on public.companies (agency_id, client_id, updated_at desc)
  where archived_at is null;
create unique index uq_contacts__active_email
  on public.contacts (agency_id, client_id, email)
  where email is not null and archived_at is null;
create unique index uq_contacts__active_linkedin
  on public.contacts (agency_id, client_id, linkedin_url)
  where linkedin_url is not null and archived_at is null;
create index idx_contacts__active_normalized_name
  on public.contacts (agency_id, client_id, normalized_name)
  where archived_at is null;
create index idx_contacts__company
  on public.contacts (agency_id, client_id, company_id)
  where archived_at is null;
create unique index uq_company_sources__external_identifier
  on public.company_sources (agency_id, client_id, lower(provider), external_id)
  where provider is not null and external_id is not null;
create unique index uq_contact_sources__external_identifier
  on public.contact_sources (agency_id, client_id, lower(provider), external_id)
  where provider is not null and external_id is not null;
create index idx_company_sources__company_collected
  on public.company_sources (agency_id, client_id, company_id, collected_at desc);
create index idx_contact_sources__contact_collected
  on public.contact_sources (agency_id, client_id, contact_id, collected_at desc);

create trigger trg_companies__set_updated_at
before update on public.companies
for each row execute function private.set_updated_at();
create trigger trg_contacts__set_updated_at
before update on public.contacts
for each row execute function private.set_updated_at();
create trigger trg_company_sources__set_updated_at
before update on public.company_sources
for each row execute function private.set_updated_at();
create trigger trg_contact_sources__set_updated_at
before update on public.contact_sources
for each row execute function private.set_updated_at();

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.company_sources enable row level security;
alter table public.contact_sources enable row level security;

create policy companies_select_authorized
on public.companies
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

create policy contacts_select_authorized
on public.contacts
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

create policy company_sources_select_authorized
on public.company_sources
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

create policy contact_sources_select_authorized
on public.contact_sources
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

revoke all on public.companies, public.contacts, public.company_sources, public.contact_sources
  from anon, authenticated;
grant select on public.companies, public.contacts, public.company_sources, public.contact_sources
  to authenticated;

create or replace function private.create_company(
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
  created_id uuid;
  company_name text := nullif(btrim(requested_payload ->> 'name'), '');
  company_domain text := private.normalize_domain(requested_payload ->> 'domain');
  company_fact_status public.data_fact_status :=
    coalesce((requested_payload ->> 'factStatus')::public.data_fact_status, 'confirmed');
  company_confidence smallint :=
    nullif(requested_payload ->> 'confidenceScore', '')::smallint;
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Company creation is not authorized.';
  end if;
  if company_name is null then
    raise exception using errcode = '22023', message = 'Company name is required.';
  end if;
  if exists (
    select 1
    from public.companies as company
    where company.agency_id = requested_agency_id
      and company.client_id = requested_client_id
      and company.archived_at is null
      and (
        (company_domain is not null and company.domain = company_domain)
        or (
          company_domain is null
          and company.normalized_name = private.normalize_entity_name(company_name)
        )
      )
  ) then
    raise exception using errcode = '23505', message = 'A matching company already exists.';
  end if;

  insert into public.companies (
    agency_id, client_id, name, normalized_name, domain, website_url,
    industry, country_code, employee_count, annual_revenue, revenue_currency,
    technologies, description, fact_status, confidence_score, created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    company_name,
    private.normalize_entity_name(company_name),
    company_domain,
    nullif(btrim(requested_payload ->> 'websiteUrl'), ''),
    nullif(btrim(requested_payload ->> 'industry'), ''),
    upper(nullif(btrim(requested_payload ->> 'countryCode'), '')),
    nullif(requested_payload ->> 'employeeCount', '')::integer,
    nullif(requested_payload ->> 'annualRevenue', '')::numeric,
    upper(nullif(btrim(requested_payload ->> 'revenueCurrency'), '')),
    coalesce(
      array(select jsonb_array_elements_text(requested_payload -> 'technologies')),
      '{}'
    ),
    nullif(btrim(requested_payload ->> 'description'), ''),
    company_fact_status,
    company_confidence,
    actor_id
  )
  returning id into created_id;

  insert into public.company_sources (
    agency_id, client_id, company_id, source_type, provider, external_id,
    source_url, collected_at, fact_status, confidence_score,
    verification_status, created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_id,
    'manual',
    nullif(btrim(requested_payload ->> 'sourceProvider'), ''),
    nullif(btrim(requested_payload ->> 'externalId'), ''),
    nullif(btrim(requested_payload ->> 'sourceUrl'), ''),
    coalesce(nullif(requested_payload ->> 'collectedAt', '')::timestamptz, statement_timestamp()),
    company_fact_status,
    company_confidence,
    'unverified',
    actor_id
  );

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'company.created', 'company', created_id::text,
    jsonb_build_object('source', 'manual')
  );
  return created_id;
end;
$$;

create or replace function private.create_contact(
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
  created_id uuid;
  contact_company_id uuid := nullif(requested_payload ->> 'companyId', '')::uuid;
  contact_first_name text := nullif(btrim(requested_payload ->> 'firstName'), '');
  contact_last_name text := nullif(btrim(requested_payload ->> 'lastName'), '');
  contact_full_name text := coalesce(
    nullif(btrim(requested_payload ->> 'fullName'), ''),
    nullif(btrim(concat_ws(' ', contact_first_name, contact_last_name)), '')
  );
  contact_email text := private.normalize_email(requested_payload ->> 'email');
  contact_linkedin text := private.normalize_linkedin_url(requested_payload ->> 'linkedinUrl');
  contact_fact_status public.data_fact_status :=
    coalesce((requested_payload ->> 'factStatus')::public.data_fact_status, 'confirmed');
  contact_confidence smallint :=
    nullif(requested_payload ->> 'confidenceScore', '')::smallint;
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Contact creation is not authorized.';
  end if;
  if contact_full_name is null or (contact_email is null and contact_linkedin is null) then
    raise exception using
      errcode = '22023',
      message = 'A contact name and at least an email or LinkedIn URL are required.';
  end if;
  if contact_company_id is not null and not exists (
    select 1
    from public.companies
    where agency_id = requested_agency_id
      and client_id = requested_client_id
      and id = contact_company_id
      and archived_at is null
  ) then
    raise exception using errcode = '23503', message = 'The company does not belong to this tenant.';
  end if;
  if exists (
    select 1
    from public.contacts as contact
    where contact.agency_id = requested_agency_id
      and contact.client_id = requested_client_id
      and contact.archived_at is null
      and (
        (contact_email is not null and contact.email = contact_email)
        or (contact_linkedin is not null and contact.linkedin_url = contact_linkedin)
      )
  ) then
    raise exception using errcode = '23505', message = 'A matching contact already exists.';
  end if;

  insert into public.contacts (
    agency_id, client_id, company_id, first_name, last_name, full_name,
    normalized_name, email, linkedin_url, job_title, department, seniority,
    phone, country_code, fact_status, confidence_score, created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    contact_company_id,
    contact_first_name,
    contact_last_name,
    contact_full_name,
    private.normalize_entity_name(contact_full_name),
    contact_email,
    contact_linkedin,
    nullif(btrim(requested_payload ->> 'jobTitle'), ''),
    nullif(btrim(requested_payload ->> 'department'), ''),
    nullif(btrim(requested_payload ->> 'seniority'), ''),
    nullif(btrim(requested_payload ->> 'phone'), ''),
    upper(nullif(btrim(requested_payload ->> 'countryCode'), '')),
    contact_fact_status,
    contact_confidence,
    actor_id
  )
  returning id into created_id;

  insert into public.contact_sources (
    agency_id, client_id, contact_id, source_type, provider, external_id,
    source_url, collected_at, fact_status, confidence_score,
    verification_status, created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_id,
    'manual',
    nullif(btrim(requested_payload ->> 'sourceProvider'), ''),
    nullif(btrim(requested_payload ->> 'externalId'), ''),
    nullif(btrim(requested_payload ->> 'sourceUrl'), ''),
    coalesce(nullif(requested_payload ->> 'collectedAt', '')::timestamptz, statement_timestamp()),
    contact_fact_status,
    contact_confidence,
    'unverified',
    actor_id
  );

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'contact.created', 'contact', created_id::text,
    jsonb_build_object('source', 'manual')
  );
  return created_id;
end;
$$;

create or replace function private.archive_company(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_company_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Company archive is not authorized.';
  end if;
  update public.companies
  set archived_by = actor_id, archived_at = statement_timestamp()
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_company_id
    and archived_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Company not found in tenant.';
  end if;
  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'company.archived', 'company', requested_company_id::text
  );
  return requested_company_id;
end;
$$;

create or replace function private.archive_contact(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_contact_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'lead.write')
  then
    raise exception using errcode = '42501', message = 'Contact archive is not authorized.';
  end if;
  update public.contacts
  set archived_by = actor_id, archived_at = statement_timestamp()
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_contact_id
    and archived_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Contact not found in tenant.';
  end if;
  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'contact.archived', 'contact', requested_contact_id::text
  );
  return requested_contact_id;
end;
$$;

create or replace function public.create_company(
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
  select private.create_company(
    requested_agency_id,
    requested_client_id,
    requested_payload
  );
$$;

create or replace function public.create_contact(
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
  select private.create_contact(
    requested_agency_id,
    requested_client_id,
    requested_payload
  );
$$;

create or replace function public.archive_company(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_company_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.archive_company(
    requested_agency_id,
    requested_client_id,
    requested_company_id
  );
$$;

create or replace function public.archive_contact(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_contact_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.archive_contact(
    requested_agency_id,
    requested_client_id,
    requested_contact_id
  );
$$;

revoke execute on function private.normalize_entity_name(text) from public, anon, authenticated;
revoke execute on function private.normalize_domain(text) from public, anon, authenticated;
revoke execute on function private.normalize_email(text) from public, anon, authenticated;
revoke execute on function private.normalize_linkedin_url(text) from public, anon, authenticated;
revoke execute on function private.create_company(uuid, uuid, jsonb) from public, anon;
revoke execute on function private.create_contact(uuid, uuid, jsonb) from public, anon;
revoke execute on function private.archive_company(uuid, uuid, uuid) from public, anon;
revoke execute on function private.archive_contact(uuid, uuid, uuid) from public, anon;
revoke execute on function public.create_company(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.create_contact(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.archive_company(uuid, uuid, uuid) from public, anon;
revoke execute on function public.archive_contact(uuid, uuid, uuid) from public, anon;
grant execute on function public.create_company(uuid, uuid, jsonb) to authenticated;
grant execute on function public.create_contact(uuid, uuid, jsonb) to authenticated;
grant execute on function public.archive_company(uuid, uuid, uuid) to authenticated;
grant execute on function public.archive_contact(uuid, uuid, uuid) to authenticated;
grant execute on function private.create_company(uuid, uuid, jsonb) to authenticated;
grant execute on function private.create_contact(uuid, uuid, jsonb) to authenticated;
grant execute on function private.archive_company(uuid, uuid, uuid) to authenticated;
grant execute on function private.archive_contact(uuid, uuid, uuid) to authenticated;
