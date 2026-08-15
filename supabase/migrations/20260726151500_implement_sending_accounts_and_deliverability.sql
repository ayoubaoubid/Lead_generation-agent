create type public.sending_account_status as enum (
  'pending',
  'connected',
  'degraded',
  'paused',
  'disconnected'
);

create type public.deliverability_check_kind as enum (
  'spf',
  'dkim',
  'dmarc',
  'domain_configured',
  'account_connected',
  'volume_allowed',
  'bounce_rate_acceptable',
  'list_verified'
);

create type public.deliverability_check_status as enum (
  'pending',
  'passed',
  'warning',
  'failed'
);

create table public.sending_domains (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  domain text not null,
  status public.deliverability_check_status not null default 'pending',
  last_checked_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  constraint pk_sending_domains primary key (id),
  constraint uq_sending_domains__tenant_id unique (agency_id, client_id, id),
  constraint uq_sending_domains__domain unique (agency_id, client_id, domain),
  constraint fk_sending_domains__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_sending_domains__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_sending_domains__domain check (
    domain = lower(domain)
    and domain ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
  )
);

create table public.sending_accounts (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  sending_domain_id uuid not null,
  email_address text not null,
  provider text not null,
  credential_reference text,
  status public.sending_account_status not null default 'pending',
  timezone text not null default 'UTC',
  daily_limit integer not null default 20,
  sent_today integer not null default 0,
  allowed_weekdays smallint[] not null default array[1,2,3,4,5]::smallint[],
  allowed_start time not null default '09:00',
  allowed_end time not null default '17:00',
  bounce_rate numeric(7,4) not null default 0,
  complaint_rate numeric(7,4) not null default 0,
  last_connection_test_at timestamptz,
  last_connection_error_code text,
  paused_reason text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  constraint pk_sending_accounts primary key (id),
  constraint uq_sending_accounts__tenant_id unique (agency_id, client_id, id),
  constraint uq_sending_accounts__email unique (agency_id, client_id, email_address),
  constraint fk_sending_accounts__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_sending_accounts__domain foreign key (
    agency_id, client_id, sending_domain_id
  ) references public.sending_domains (agency_id, client_id, id) on delete restrict,
  constraint fk_sending_accounts__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_sending_accounts__email check (
    email_address = lower(email_address)
    and email_address ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint ck_sending_accounts__provider check (
    char_length(btrim(provider)) between 2 and 80
  ),
  constraint ck_sending_accounts__credential check (
    credential_reference is null
    or (
      char_length(credential_reference) between 8 and 240
      and credential_reference !~* '(password|secret|token|bearer|api[_-]?key)\s*[:=]'
    )
  ),
  constraint ck_sending_accounts__limits check (
    daily_limit between 1 and 500
    and sent_today between 0 and daily_limit
    and allowed_start < allowed_end
    and cardinality(allowed_weekdays) between 1 and 7
  ),
  constraint ck_sending_accounts__rates check (
    bounce_rate between 0 and 1 and complaint_rate between 0 and 1
  )
);

create table public.deliverability_checks (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  sending_domain_id uuid,
  sending_account_id uuid,
  kind public.deliverability_check_kind not null,
  status public.deliverability_check_status not null,
  is_critical boolean not null default true,
  evidence jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_deliverability_checks primary key (id),
  constraint uq_deliverability_checks__tenant_id unique (agency_id, client_id, id),
  constraint fk_deliverability_checks__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_deliverability_checks__domain foreign key (
    agency_id, client_id, sending_domain_id
  ) references public.sending_domains (agency_id, client_id, id) on delete cascade,
  constraint fk_deliverability_checks__account foreign key (
    agency_id, client_id, sending_account_id
  ) references public.sending_accounts (agency_id, client_id, id) on delete cascade,
  constraint fk_deliverability_checks__created_by foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_deliverability_checks__target check (
    sending_domain_id is not null or sending_account_id is not null
  ),
  constraint ck_deliverability_checks__evidence check (
    jsonb_typeof(evidence) = 'object'
  )
);

create table public.campaign_sending_accounts (
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  sending_account_id uuid not null,
  weight integer not null default 1,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_sending_accounts primary key (
    agency_id, client_id, campaign_id, sending_account_id
  ),
  constraint fk_campaign_sending_accounts__campaign foreign key (
    agency_id, client_id, campaign_id
  ) references public.campaigns (agency_id, client_id, id) on delete cascade,
  constraint fk_campaign_sending_accounts__account foreign key (
    agency_id, client_id, sending_account_id
  ) references public.sending_accounts (agency_id, client_id, id) on delete restrict,
  constraint fk_campaign_sending_accounts__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_campaign_sending_accounts__weight check (weight between 1 and 100)
);

create index idx_sending_domains__tenant_status
  on public.sending_domains (agency_id, client_id, status)
  where archived_at is null;
create index idx_sending_accounts__tenant_status
  on public.sending_accounts (agency_id, client_id, status)
  where archived_at is null;
create index idx_deliverability_checks__account_latest
  on public.deliverability_checks (
    agency_id, client_id, sending_account_id, kind, checked_at desc
  );

comment on column public.sending_accounts.credential_reference is
  'Opaque reference to a secret manager entry. Never contains provider credentials.';
comment on table public.deliverability_checks is
  'Append-only evidence for campaign preflight. Raw DNS or provider secrets are forbidden.';

create trigger trg_sending_domains__set_updated_at
before update on public.sending_domains
for each row execute function private.set_updated_at();
create trigger trg_sending_accounts__set_updated_at
before update on public.sending_accounts
for each row execute function private.set_updated_at();
create trigger trg_deliverability_checks__set_updated_at
before update on public.deliverability_checks
for each row execute function private.set_updated_at();

alter table public.sending_domains enable row level security;
alter table public.sending_accounts enable row level security;
alter table public.deliverability_checks enable row level security;
alter table public.campaign_sending_accounts enable row level security;

create policy sending_domains_select on public.sending_domains for select
to authenticated using (private.has_permission(agency_id, client_id, 'settings.read'));
create policy sending_accounts_select on public.sending_accounts for select
to authenticated using (private.has_permission(agency_id, client_id, 'settings.read'));
create policy deliverability_checks_select on public.deliverability_checks for select
to authenticated using (private.has_permission(agency_id, client_id, 'settings.read'));
create policy campaign_sending_accounts_select on public.campaign_sending_accounts for select
to authenticated using (private.has_permission(agency_id, client_id, 'campaign.read'));

revoke all on public.sending_domains, public.sending_accounts,
  public.deliverability_checks, public.campaign_sending_accounts from anon, authenticated;
grant select on public.sending_domains, public.sending_accounts,
  public.deliverability_checks, public.campaign_sending_accounts to authenticated;
grant select, insert, update on public.sending_domains, public.sending_accounts,
  public.deliverability_checks, public.campaign_sending_accounts to service_role;

create or replace function public.upsert_sending_domain(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_domain text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  domain_id uuid;
  normalized_domain text := lower(btrim(requested_domain));
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'settings.manage')
  then
    raise exception using errcode = '42501', message = 'Sending domain management is not authorized.';
  end if;

  insert into public.sending_domains (agency_id, client_id, domain, created_by)
  values (requested_agency_id, requested_client_id, normalized_domain, auth.uid())
  on conflict (agency_id, client_id, domain) do update
    set archived_at = null
  returning id into domain_id;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  ) values (
    requested_agency_id, requested_client_id, auth.uid(),
    'sending_domain.upserted', 'sending_domain', domain_id, '{}'::jsonb
  );
  return domain_id;
end;
$$;

create or replace function public.upsert_sending_account_metadata(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_account_id uuid,
  requested_domain_id uuid,
  requested_email text,
  requested_provider text,
  requested_timezone text,
  requested_daily_limit integer,
  requested_credential_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := coalesce(requested_account_id, gen_random_uuid());
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'settings.manage')
  then
    raise exception using errcode = '42501', message = 'Sending account management is not authorized.';
  end if;

  insert into public.sending_accounts (
    id, agency_id, client_id, sending_domain_id, email_address, provider,
    timezone, daily_limit, credential_reference, created_by
  ) values (
    account_id, requested_agency_id, requested_client_id, requested_domain_id,
    lower(btrim(requested_email)), btrim(requested_provider),
    requested_timezone, requested_daily_limit, requested_credential_reference,
    auth.uid()
  )
  on conflict (agency_id, client_id, id) do update set
    sending_domain_id = excluded.sending_domain_id,
    email_address = excluded.email_address,
    provider = excluded.provider,
    timezone = excluded.timezone,
    daily_limit = excluded.daily_limit,
    credential_reference = coalesce(
      excluded.credential_reference,
      public.sending_accounts.credential_reference
    );

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  ) values (
    requested_agency_id, requested_client_id, auth.uid(),
    'sending_account.upserted', 'sending_account', account_id,
    jsonb_build_object('provider', btrim(requested_provider))
  );
  return account_id;
end;
$$;

create or replace function public.campaign_deliverability_preflight(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_campaign_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with assigned_accounts as (
    select distinct account.id
    from public.campaigns campaign
    join public.campaign_sending_accounts assignment
      on assignment.agency_id = campaign.agency_id
      and assignment.client_id = campaign.client_id
      and assignment.campaign_id = campaign.id
    join public.sending_accounts account
      on account.agency_id = assignment.agency_id
      and account.client_id = assignment.client_id
      and account.id = assignment.sending_account_id
      and account.archived_at is null
    where campaign.id = requested_campaign_id
      and campaign.agency_id = requested_agency_id
      and campaign.client_id = requested_client_id
      and account.status = 'connected'
  ),
  required(kind) as (
    values
      ('spf'::public.deliverability_check_kind),
      ('dkim'::public.deliverability_check_kind),
      ('dmarc'::public.deliverability_check_kind),
      ('domain_configured'::public.deliverability_check_kind),
      ('account_connected'::public.deliverability_check_kind),
      ('volume_allowed'::public.deliverability_check_kind),
      ('bounce_rate_acceptable'::public.deliverability_check_kind),
      ('list_verified'::public.deliverability_check_kind)
  ),
  missing as (
    select required.kind
    from required
    where not exists (
      select 1
      from assigned_accounts assigned
      join lateral (
        select check_result.status
        from public.deliverability_checks check_result
        where check_result.agency_id = requested_agency_id
          and check_result.client_id = requested_client_id
          and check_result.sending_account_id = assigned.id
          and check_result.kind = required.kind
          and (check_result.expires_at is null or check_result.expires_at > now())
        order by check_result.checked_at desc
        limit 1
      ) latest on latest.status = 'passed'
    )
  )
  select jsonb_build_object(
    'passed', exists (select 1 from assigned_accounts)
      and not exists (select 1 from missing),
    'missingChecks', coalesce(
      (select jsonb_agg(kind order by kind) from missing),
      '[]'::jsonb
    )
  );
$$;

revoke execute on function public.upsert_sending_domain(uuid, uuid, text)
  from public, anon;
revoke execute on function public.upsert_sending_account_metadata(
  uuid, uuid, uuid, uuid, text, text, text, integer, text
) from public, anon;
revoke execute on function public.campaign_deliverability_preflight(
  uuid, uuid, uuid
) from public, anon;
grant execute on function public.upsert_sending_domain(uuid, uuid, text)
  to authenticated;
grant execute on function public.upsert_sending_account_metadata(
  uuid, uuid, uuid, uuid, text, text, text, integer, text
) to authenticated;
grant execute on function public.campaign_deliverability_preflight(
  uuid, uuid, uuid
) to authenticated, service_role;
