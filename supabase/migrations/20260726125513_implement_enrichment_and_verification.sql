create type public.provider_operation_kind as enum (
  'company_enrichment',
  'contact_enrichment',
  'email_verification',
  'domain_validation'
);

create type public.provider_operation_status as enum (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

create type public.email_verification_result as enum (
  'valid',
  'risky',
  'catch_all',
  'unknown',
  'invalid',
  'disposable',
  'role_based',
  'bounced',
  'suppressed',
  'unsubscribed'
);

create table public.provider_operations (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  operation_kind public.provider_operation_kind not null,
  status public.provider_operation_status not null default 'pending',
  provider text not null,
  company_id uuid,
  contact_id uuid,
  requested_domain text,
  idempotency_key text not null,
  input_fingerprint text not null,
  source text,
  source_url text,
  confidence_score smallint,
  cost_amount numeric(18, 6) not null default 0,
  cost_currency text not null default 'USD',
  sanitized_raw_result jsonb,
  normalized_result jsonb,
  error_code text,
  error_message_redacted text,
  is_retryable boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_provider_operations primary key (id),
  constraint uq_provider_operations__tenant_id
    unique (agency_id, client_id, id),
  constraint uq_provider_operations__idempotency
    unique (agency_id, client_id, operation_kind, idempotency_key),
  constraint fk_provider_operations__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_provider_operations__company
    foreign key (agency_id, client_id, company_id)
    references public.companies (agency_id, client_id, id) on delete restrict,
  constraint fk_provider_operations__contact
    foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint fk_provider_operations__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_provider_operations__provider
    check (char_length(btrim(provider)) between 1 and 100),
  constraint ck_provider_operations__idempotency
    check (char_length(btrim(idempotency_key)) between 8 and 200),
  constraint ck_provider_operations__fingerprint
    check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint ck_provider_operations__source
    check (source is null or char_length(btrim(source)) between 1 and 200),
  constraint ck_provider_operations__confidence
    check (confidence_score is null or confidence_score between 0 and 100),
  constraint ck_provider_operations__cost
    check (cost_amount >= 0),
  constraint ck_provider_operations__currency
    check (cost_currency ~ '^[A-Z]{3}$'),
  constraint ck_provider_operations__raw_object
    check (
      sanitized_raw_result is null
      or jsonb_typeof(sanitized_raw_result) = 'object'
    ),
  constraint ck_provider_operations__normalized_object
    check (
      normalized_result is null
      or jsonb_typeof(normalized_result) = 'object'
    ),
  constraint ck_provider_operations__resource_shape
    check (
      (
        operation_kind = 'company_enrichment'
        and company_id is not null
        and contact_id is null
        and requested_domain is null
      )
      or (
        operation_kind in ('contact_enrichment', 'email_verification')
        and company_id is null
        and contact_id is not null
        and requested_domain is null
      )
      or (
        operation_kind = 'domain_validation'
        and contact_id is null
        and requested_domain is not null
      )
    ),
  constraint ck_provider_operations__domain
    check (
      requested_domain is null
      or requested_domain = private.normalize_domain(requested_domain)
    ),
  constraint ck_provider_operations__lifecycle
    check (
      (status = 'pending' and started_at is null and completed_at is null)
      or (status = 'running' and started_at is not null and completed_at is null)
      or (
        status in ('completed', 'failed', 'cancelled')
        and completed_at is not null
      )
    ),
  constraint ck_provider_operations__completed_result
    check (
      status <> 'completed'
      or (
        normalized_result is not null
        and error_code is null
        and error_message_redacted is null
      )
    ),
  constraint ck_provider_operations__failed_error
    check (
      status <> 'failed'
      or (error_code is not null and error_message_redacted is not null)
    )
);

comment on table public.provider_operations is
  'Tenant-scoped ledger of enrichment, domain validation and email verification operations. Provider secrets and unsanitized payloads are forbidden.';
comment on column public.provider_operations.sanitized_raw_result is
  'Provider-shaped response after removal of secrets, headers and unnecessary personal data.';
comment on column public.provider_operations.normalized_result is
  'Provider-independent result validated by the application before persistence.';
comment on column public.provider_operations.input_fingerprint is
  'SHA-256 fingerprint used to detect reuse of an idempotency key with different inputs.';
comment on column public.provider_operations.cost_amount is
  'Technical provider consumption only; this is not customer billing.';

create index idx_provider_operations__resource_company
  on public.provider_operations (
    agency_id,
    client_id,
    company_id,
    created_at desc
  )
  where company_id is not null;

create index idx_provider_operations__resource_contact
  on public.provider_operations (
    agency_id,
    client_id,
    contact_id,
    created_at desc
  )
  where contact_id is not null;

create index idx_provider_operations__status
  on public.provider_operations (
    agency_id,
    client_id,
    status,
    created_at
  )
  where status in ('pending', 'running', 'failed');

create trigger trg_provider_operations__set_updated_at
before update on public.provider_operations
for each row execute function private.set_updated_at();

alter table public.provider_operations enable row level security;

create policy provider_operations_select_authorized
on public.provider_operations
for select
to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

revoke all on public.provider_operations from anon, authenticated;
grant select on public.provider_operations to authenticated;
