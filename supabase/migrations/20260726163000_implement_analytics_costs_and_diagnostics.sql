create type public.cost_category as enum (
  'enrichment',
  'verification',
  'ai',
  'email_delivery',
  'calendar',
  'infrastructure',
  'other_technical'
);

create type public.diagnostic_status as enum (
  'pending',
  'completed',
  'needs_data',
  'failed'
);

create table public.technical_cost_entries (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  category public.cost_category not null,
  provider text not null,
  resource_type text not null,
  resource_id uuid,
  external_operation_id text,
  amount_microusd bigint not null,
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_technical_cost_entries primary key (id),
  constraint uq_technical_cost_entries__provider_operation unique (
    provider, external_operation_id
  ),
  constraint fk_technical_cost_entries__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint ck_technical_cost_entries__provider check (
    char_length(btrim(provider)) between 2 and 80
    and char_length(btrim(resource_type)) between 2 and 80
  ),
  constraint ck_technical_cost_entries__amount check (amount_microusd >= 0),
  constraint ck_technical_cost_entries__metadata check (
    jsonb_typeof(metadata) = 'object'
  )
);

create table public.analytics_daily_metrics (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  metric_date date not null,
  leads integer not null default 0,
  qualified_leads integer not null default 0,
  emails_prepared integer not null default 0,
  emails_sent integer not null default 0,
  delivered integer not null default 0,
  bounces integer not null default 0,
  replies integer not null default 0,
  positive_replies integer not null default 0,
  meetings integer not null default 0,
  opportunities integer not null default 0,
  won_sales integer not null default 0,
  won_value_microunits bigint not null default 0,
  technical_cost_microusd bigint not null default 0,
  currency char(3) not null default 'EUR',
  generated_at timestamptz not null default statement_timestamp(),
  source_watermark timestamptz not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_analytics_daily_metrics primary key (id),
  constraint uq_analytics_daily_metrics__tenant_date unique (
    agency_id, client_id, metric_date
  ),
  constraint fk_analytics_daily_metrics__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint ck_analytics_daily_metrics__counts check (
    leads >= 0 and qualified_leads >= 0 and emails_prepared >= 0
    and emails_sent >= 0 and delivered >= 0 and bounces >= 0
    and replies >= 0 and positive_replies >= 0 and meetings >= 0
    and opportunities >= 0 and won_sales >= 0
    and won_value_microunits >= 0 and technical_cost_microusd >= 0
  ),
  constraint ck_analytics_daily_metrics__currency check (currency ~ '^[A-Z]{3}$')
);

create table public.diagnostic_runs (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  status public.diagnostic_status not null default 'pending',
  period_start date not null,
  period_end date not null,
  diagnosis jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  missing_data jsonb not null default '[]'::jsonb,
  confidence numeric(5,4),
  skill_version text not null,
  model text,
  prompt_version text,
  cost_microusd bigint not null default 0,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  constraint pk_diagnostic_runs primary key (id),
  constraint uq_diagnostic_runs__tenant_id unique (agency_id, client_id, id),
  constraint fk_diagnostic_runs__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_diagnostic_runs__creator foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_diagnostic_runs__period check (period_end >= period_start),
  constraint ck_diagnostic_runs__json check (
    jsonb_typeof(diagnosis) = 'array'
    and jsonb_typeof(evidence) = 'array'
    and jsonb_typeof(missing_data) = 'array'
  ),
  constraint ck_diagnostic_runs__confidence check (
    confidence is null or confidence between 0 and 1
  ),
  constraint ck_diagnostic_runs__cost check (cost_microusd >= 0),
  constraint ck_diagnostic_runs__completion check (
    (status in ('completed', 'needs_data', 'failed') and completed_at is not null)
    or (status = 'pending' and completed_at is null)
  )
);

create index idx_technical_cost_entries__tenant_date
  on public.technical_cost_entries (agency_id, client_id, occurred_at desc);
create index idx_analytics_daily_metrics__tenant_date
  on public.analytics_daily_metrics (agency_id, client_id, metric_date desc);

comment on table public.technical_cost_entries is
  'External technical consumption only. It is never a customer wallet, invoice, subscription or payment.';
comment on column public.analytics_daily_metrics.won_value_microunits is
  'Declared CRM opportunity value for analytics. It is not an invoice or payment record.';

create trigger trg_analytics_daily_metrics__set_updated_at
before update on public.analytics_daily_metrics
for each row execute function private.set_updated_at();

alter table public.technical_cost_entries enable row level security;
alter table public.analytics_daily_metrics enable row level security;
alter table public.diagnostic_runs enable row level security;

create policy technical_cost_entries_select on public.technical_cost_entries for select
to authenticated using (private.has_permission(agency_id, client_id, 'analytics.read'));
create policy analytics_daily_metrics_select on public.analytics_daily_metrics for select
to authenticated using (private.has_permission(agency_id, client_id, 'analytics.read'));
create policy diagnostic_runs_select on public.diagnostic_runs for select
to authenticated using (private.has_permission(agency_id, client_id, 'analytics.read'));

revoke all on public.technical_cost_entries, public.analytics_daily_metrics,
  public.diagnostic_runs from anon, authenticated;
grant select on public.technical_cost_entries, public.analytics_daily_metrics,
  public.diagnostic_runs to authenticated;
grant select, insert, update on public.technical_cost_entries,
  public.analytics_daily_metrics, public.diagnostic_runs to service_role;

create or replace function public.get_client_funnel_analytics(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_period_start date,
  requested_period_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  totals jsonb;
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'analytics.read')
  then
    raise exception using errcode = '42501', message = 'Analytics are not authorized.';
  end if;
  if requested_period_end < requested_period_start then
    raise exception using errcode = '22023', message = 'Analytics period is invalid.';
  end if;

  select jsonb_build_object(
    'leads', coalesce(sum(leads), 0),
    'qualifiedLeads', coalesce(sum(qualified_leads), 0),
    'emailsPrepared', coalesce(sum(emails_prepared), 0),
    'emailsSent', coalesce(sum(emails_sent), 0),
    'delivered', coalesce(sum(delivered), 0),
    'bounces', coalesce(sum(bounces), 0),
    'replies', coalesce(sum(replies), 0),
    'positiveReplies', coalesce(sum(positive_replies), 0),
    'meetings', coalesce(sum(meetings), 0),
    'opportunities', coalesce(sum(opportunities), 0),
    'wonSales', coalesce(sum(won_sales), 0),
    'wonValueMicrounits', coalesce(sum(won_value_microunits), 0),
    'technicalCostMicrousd', coalesce(sum(technical_cost_microusd), 0),
    'costPerLeadMicrousd', case when sum(leads) > 0
      then sum(technical_cost_microusd) / sum(leads) else null end,
    'costPerQualifiedLeadMicrousd', case when sum(qualified_leads) > 0
      then sum(technical_cost_microusd) / sum(qualified_leads) else null end,
    'costPerReplyMicrousd', case when sum(replies) > 0
      then sum(technical_cost_microusd) / sum(replies) else null end,
    'costPerMeetingMicrousd', case when sum(meetings) > 0
      then sum(technical_cost_microusd) / sum(meetings) else null end,
    'costPerOpportunityMicrousd', case when sum(opportunities) > 0
      then sum(technical_cost_microusd) / sum(opportunities) else null end,
    'costPerSaleMicrousd', case when sum(won_sales) > 0
      then sum(technical_cost_microusd) / sum(won_sales) else null end,
    'marginAvailable', false,
    'marginUnavailableReason',
      'Client billing and agency delivery costs are managed outside the platform.'
  ) into totals
  from public.analytics_daily_metrics
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and metric_date between requested_period_start and requested_period_end;
  return totals;
end;
$$;

revoke execute on function public.get_client_funnel_analytics(
  uuid, uuid, date, date
) from public, anon;
grant execute on function public.get_client_funnel_analytics(
  uuid, uuid, date, date
) to authenticated;
