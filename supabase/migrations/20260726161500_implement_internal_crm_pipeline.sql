create type public.opportunity_status as enum ('open', 'won', 'lost');
create type public.sales_task_status as enum (
  'open',
  'in_progress',
  'completed',
  'cancelled'
);

create table public.pipeline_stages (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  code text not null,
  name text not null,
  position integer not null,
  default_probability integer not null,
  is_closed boolean not null default false,
  closed_status public.opportunity_status,
  active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_pipeline_stages primary key (id),
  constraint uq_pipeline_stages__tenant_id unique (agency_id, client_id, id),
  constraint uq_pipeline_stages__code unique (agency_id, client_id, code),
  constraint uq_pipeline_stages__position unique (agency_id, client_id, position),
  constraint fk_pipeline_stages__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_pipeline_stages__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_pipeline_stages__code check (code ~ '^[a-z][a-z0-9_]{1,49}$'),
  constraint ck_pipeline_stages__name check (char_length(btrim(name)) between 2 and 100),
  constraint ck_pipeline_stages__position check (position > 0),
  constraint ck_pipeline_stages__probability check (default_probability between 0 and 100),
  constraint ck_pipeline_stages__closed check (
    (is_closed and closed_status in ('won', 'lost'))
    or (not is_closed and closed_status is null)
  )
);

create table public.opportunities (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  stage_id uuid not null,
  contact_id uuid,
  company_id uuid,
  campaign_id uuid,
  meeting_id uuid,
  title text not null,
  status public.opportunity_status not null default 'open',
  value_amount numeric(14,2),
  currency char(3) not null default 'EUR',
  probability integer not null,
  owner_id uuid,
  next_action text,
  next_action_due_at timestamptz,
  lost_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  constraint pk_opportunities primary key (id),
  constraint uq_opportunities__tenant_id unique (agency_id, client_id, id),
  constraint fk_opportunities__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_opportunities__stage foreign key (agency_id, client_id, stage_id)
    references public.pipeline_stages (agency_id, client_id, id) on delete restrict,
  constraint fk_opportunities__contact foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint fk_opportunities__company foreign key (agency_id, client_id, company_id)
    references public.companies (agency_id, client_id, id) on delete restrict,
  constraint fk_opportunities__campaign foreign key (agency_id, client_id, campaign_id)
    references public.campaigns (agency_id, client_id, id) on delete set null,
  constraint fk_opportunities__meeting foreign key (agency_id, client_id, meeting_id)
    references public.meetings (agency_id, client_id, id) on delete set null,
  constraint fk_opportunities__owner foreign key (owner_id)
    references public.profiles (id) on delete set null,
  constraint fk_opportunities__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_opportunities__title check (char_length(btrim(title)) between 2 and 200),
  constraint ck_opportunities__value check (value_amount is null or value_amount >= 0),
  constraint ck_opportunities__currency check (currency ~ '^[A-Z]{3}$'),
  constraint ck_opportunities__probability check (probability between 0 and 100),
  constraint ck_opportunities__lifecycle check (
    (status = 'open' and won_at is null and lost_at is null and lost_reason is null)
    or (status = 'won' and won_at is not null and lost_at is null and lost_reason is null)
    or (status = 'lost' and won_at is null and lost_at is not null and lost_reason is not null)
  )
);

create table public.opportunity_history (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  opportunity_id uuid not null,
  from_stage_id uuid,
  to_stage_id uuid not null,
  from_status public.opportunity_status,
  to_status public.opportunity_status not null,
  change_reason text,
  changed_by uuid,
  changed_at timestamptz not null default statement_timestamp(),
  constraint pk_opportunity_history primary key (id),
  constraint fk_opportunity_history__opportunity foreign key (
    agency_id, client_id, opportunity_id
  ) references public.opportunities (agency_id, client_id, id) on delete cascade,
  constraint fk_opportunity_history__from_stage foreign key (
    agency_id, client_id, from_stage_id
  ) references public.pipeline_stages (agency_id, client_id, id) on delete restrict,
  constraint fk_opportunity_history__to_stage foreign key (
    agency_id, client_id, to_stage_id
  ) references public.pipeline_stages (agency_id, client_id, id) on delete restrict,
  constraint fk_opportunity_history__actor foreign key (changed_by)
    references public.profiles (id) on delete set null
);

create table public.sales_tasks (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  opportunity_id uuid,
  contact_id uuid,
  title text not null,
  status public.sales_task_status not null default 'open',
  assigned_to uuid,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_sales_tasks primary key (id),
  constraint uq_sales_tasks__tenant_id unique (agency_id, client_id, id),
  constraint fk_sales_tasks__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_sales_tasks__opportunity foreign key (
    agency_id, client_id, opportunity_id
  ) references public.opportunities (agency_id, client_id, id) on delete cascade,
  constraint fk_sales_tasks__contact foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint fk_sales_tasks__assignee foreign key (assigned_to)
    references public.profiles (id) on delete set null,
  constraint fk_sales_tasks__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_sales_tasks__title check (char_length(btrim(title)) between 2 and 300),
  constraint ck_sales_tasks__completion check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.opportunity_notes (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  opportunity_id uuid not null,
  body text not null,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_opportunity_notes primary key (id),
  constraint uq_opportunity_notes__tenant_id unique (agency_id, client_id, id),
  constraint fk_opportunity_notes__opportunity foreign key (
    agency_id, client_id, opportunity_id
  ) references public.opportunities (agency_id, client_id, id) on delete cascade,
  constraint fk_opportunity_notes__creator foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_opportunity_notes__body check (
    char_length(btrim(body)) between 1 and 10000
  )
);

create index idx_opportunities__pipeline
  on public.opportunities (agency_id, client_id, stage_id, updated_at desc)
  where archived_at is null;
create index idx_sales_tasks__open
  on public.sales_tasks (agency_id, client_id, status, due_at)
  where status in ('open', 'in_progress');

create trigger trg_pipeline_stages__set_updated_at before update on public.pipeline_stages
for each row execute function private.set_updated_at();
create trigger trg_opportunities__set_updated_at before update on public.opportunities
for each row execute function private.set_updated_at();
create trigger trg_sales_tasks__set_updated_at before update on public.sales_tasks
for each row execute function private.set_updated_at();
create trigger trg_opportunity_notes__set_updated_at before update on public.opportunity_notes
for each row execute function private.set_updated_at();

alter table public.pipeline_stages enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_history enable row level security;
alter table public.sales_tasks enable row level security;
alter table public.opportunity_notes enable row level security;

create policy pipeline_stages_select on public.pipeline_stages for select to authenticated
using (private.has_permission(agency_id, client_id, 'pipeline.read'));
create policy opportunities_select on public.opportunities for select to authenticated
using (private.has_permission(agency_id, client_id, 'pipeline.read'));
create policy opportunity_history_select on public.opportunity_history for select to authenticated
using (private.has_permission(agency_id, client_id, 'pipeline.read'));
create policy sales_tasks_select on public.sales_tasks for select to authenticated
using (private.has_permission(agency_id, client_id, 'pipeline.read'));
create policy opportunity_notes_select on public.opportunity_notes for select to authenticated
using (private.has_permission(agency_id, client_id, 'pipeline.read'));

revoke all on public.pipeline_stages, public.opportunities,
  public.opportunity_history, public.sales_tasks, public.opportunity_notes
  from anon, authenticated;
grant select on public.pipeline_stages, public.opportunities,
  public.opportunity_history, public.sales_tasks, public.opportunity_notes
  to authenticated;
grant select, insert, update on public.pipeline_stages, public.opportunities,
  public.opportunity_history, public.sales_tasks, public.opportunity_notes
  to service_role;

create or replace function public.ensure_default_pipeline(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'pipeline.write')
  then
    raise exception using errcode = '42501', message = 'Pipeline configuration is not authorized.';
  end if;

  insert into public.pipeline_stages (
    agency_id, client_id, code, name, position, default_probability,
    is_closed, closed_status, created_by
  )
  select requested_agency_id, requested_client_id, stage.code, stage.name,
    stage.position, stage.probability, stage.is_closed, stage.closed_status,
    auth.uid()
  from (
    values
      ('new_lead', 'New Lead', 1, 5, false, null::public.opportunity_status),
      ('qualified', 'Qualified', 2, 10, false, null),
      ('contacted', 'Contacted', 3, 15, false, null),
      ('replied', 'Replied', 4, 25, false, null),
      ('meeting_booked', 'Meeting Booked', 5, 35, false, null),
      ('discovery_completed', 'Discovery Completed', 6, 45, false, null),
      ('opportunity', 'Opportunity', 7, 55, false, null),
      ('proposal_sent', 'Proposal Sent', 8, 65, false, null),
      ('negotiation', 'Negotiation', 9, 80, false, null),
      ('won', 'Won', 10, 100, true, 'won'::public.opportunity_status),
      ('lost', 'Lost', 11, 0, true, 'lost'::public.opportunity_status),
      ('nurturing', 'Nurturing', 12, 10, false, null),
      ('disqualified', 'Disqualified', 13, 0, true, 'lost'::public.opportunity_status)
  ) as stage(code, name, position, probability, is_closed, closed_status)
  on conflict (agency_id, client_id, code) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.create_opportunity(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_stage_id uuid,
  requested_contact_id uuid,
  requested_company_id uuid,
  requested_title text,
  requested_value_amount numeric,
  requested_currency text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  opportunity_id uuid;
  stage_probability integer;
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'pipeline.write')
  then
    raise exception using errcode = '42501', message = 'Opportunity creation is not authorized.';
  end if;

  select default_probability into stage_probability
  from public.pipeline_stages
  where id = requested_stage_id
    and agency_id = requested_agency_id
    and client_id = requested_client_id
    and active;
  if not found then
    raise exception using errcode = '42501', message = 'Pipeline stage is not accessible.';
  end if;

  insert into public.opportunities (
    agency_id, client_id, stage_id, contact_id, company_id, title,
    value_amount, currency, probability, owner_id, created_by
  ) values (
    requested_agency_id, requested_client_id, requested_stage_id,
    requested_contact_id, requested_company_id, btrim(requested_title),
    requested_value_amount, upper(requested_currency), stage_probability,
    auth.uid(), auth.uid()
  )
  returning id into opportunity_id;

  insert into public.opportunity_history (
    agency_id, client_id, opportunity_id, to_stage_id, to_status, changed_by
  ) values (
    requested_agency_id, requested_client_id, opportunity_id,
    requested_stage_id, 'open', auth.uid()
  );
  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  ) values (
    requested_agency_id, requested_client_id, auth.uid(),
    'opportunity.created', 'opportunity', opportunity_id,
    jsonb_build_object('stageId', requested_stage_id)
  );
  return opportunity_id;
end;
$$;

create or replace function public.move_opportunity(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_opportunity_id uuid,
  requested_stage_id uuid,
  requested_lost_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  opportunity_row public.opportunities%rowtype;
  stage_row public.pipeline_stages%rowtype;
  target_status public.opportunity_status;
begin
  if auth.uid() is null
    or not private.has_permission(requested_agency_id, requested_client_id, 'pipeline.write')
  then
    raise exception using errcode = '42501', message = 'Opportunity update is not authorized.';
  end if;

  select * into opportunity_row from public.opportunities
  where id = requested_opportunity_id
    and agency_id = requested_agency_id and client_id = requested_client_id
  for update;
  select * into stage_row from public.pipeline_stages
  where id = requested_stage_id
    and agency_id = requested_agency_id and client_id = requested_client_id
    and active;
  if opportunity_row.id is null or stage_row.id is null then
    raise exception using errcode = '42501', message = 'Opportunity or stage is not accessible.';
  end if;

  target_status := coalesce(stage_row.closed_status, 'open');
  if target_status = 'lost' and nullif(btrim(requested_lost_reason), '') is null then
    raise exception using errcode = '22023', message = 'A loss reason is required.';
  end if;

  update public.opportunities set
    stage_id = stage_row.id,
    status = target_status,
    probability = stage_row.default_probability,
    won_at = case when target_status = 'won' then statement_timestamp() else null end,
    lost_at = case when target_status = 'lost' then statement_timestamp() else null end,
    lost_reason = case when target_status = 'lost' then btrim(requested_lost_reason) else null end
  where id = opportunity_row.id;

  insert into public.opportunity_history (
    agency_id, client_id, opportunity_id, from_stage_id, to_stage_id,
    from_status, to_status, change_reason, changed_by
  ) values (
    requested_agency_id, requested_client_id, opportunity_row.id,
    opportunity_row.stage_id, stage_row.id, opportunity_row.status,
    target_status, requested_lost_reason, auth.uid()
  );
  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  ) values (
    requested_agency_id, requested_client_id, auth.uid(),
    'opportunity.moved', 'opportunity', opportunity_row.id,
    jsonb_build_object('fromStageId', opportunity_row.stage_id, 'toStageId', stage_row.id)
  );
  return opportunity_row.id;
end;
$$;

revoke execute on function public.ensure_default_pipeline(uuid, uuid)
  from public, anon;
revoke execute on function public.create_opportunity(
  uuid, uuid, uuid, uuid, uuid, text, numeric, text
) from public, anon;
revoke execute on function public.move_opportunity(
  uuid, uuid, uuid, uuid, text
) from public, anon;
grant execute on function public.ensure_default_pipeline(uuid, uuid)
  to authenticated;
grant execute on function public.create_opportunity(
  uuid, uuid, uuid, uuid, uuid, text, numeric, text
) to authenticated;
grant execute on function public.move_opportunity(
  uuid, uuid, uuid, uuid, text
) to authenticated;
