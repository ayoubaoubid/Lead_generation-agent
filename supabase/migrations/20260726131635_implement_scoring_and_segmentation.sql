create type public.scoring_model_status as enum (
  'draft',
  'active',
  'archived'
);

create type public.segment_status as enum (
  'draft',
  'active',
  'archived'
);

create table public.scoring_models (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  name text not null,
  status public.scoring_model_status not null default 'draft',
  active_version_id uuid,
  created_by uuid not null,
  archived_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_scoring_models primary key (id),
  constraint uq_scoring_models__tenant_id unique (agency_id, client_id, id),
  constraint uq_scoring_models__tenant_name unique (agency_id, client_id, name),
  constraint fk_scoring_models__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_scoring_models__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_scoring_models__archived_by foreign key (archived_by)
    references public.profiles (id) on delete restrict,
  constraint ck_scoring_models__name
    check (char_length(btrim(name)) between 1 and 160),
  constraint ck_scoring_models__archive check (
    (status = 'archived' and archived_by is not null and archived_at is not null)
    or (status <> 'archived' and archived_by is null and archived_at is null)
  )
);

create table public.scoring_model_versions (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  model_id uuid not null,
  version_number integer not null,
  configuration jsonb not null,
  configuration_hash text not null,
  created_by uuid not null,
  activated_by uuid,
  activated_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_scoring_model_versions primary key (id),
  constraint uq_scoring_model_versions__tenant_id
    unique (agency_id, client_id, id),
  constraint uq_scoring_model_versions__model_version
    unique (model_id, version_number),
  constraint fk_scoring_model_versions__model
    foreign key (agency_id, client_id, model_id)
    references public.scoring_models (agency_id, client_id, id)
    on delete cascade,
  constraint fk_scoring_model_versions__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_scoring_model_versions__activated_by foreign key (activated_by)
    references public.profiles (id) on delete restrict,
  constraint ck_scoring_model_versions__number check (version_number > 0),
  constraint ck_scoring_model_versions__configuration
    check (
      jsonb_typeof(configuration) = 'object'
      and octet_length(configuration::text) <= 250000
    ),
  constraint ck_scoring_model_versions__hash
    check (configuration_hash ~ '^[a-f0-9]{64}$'),
  constraint ck_scoring_model_versions__activation check (
    (activated_by is null and activated_at is null)
    or (activated_by is not null and activated_at is not null)
  )
);

alter table public.scoring_models
  add constraint fk_scoring_models__active_version
  foreign key (agency_id, client_id, active_version_id)
  references public.scoring_model_versions (agency_id, client_id, id)
  on delete restrict;

create table public.lead_scores (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  contact_id uuid not null,
  company_id uuid,
  model_version_id uuid not null,
  fit_score smallint not null,
  intent_score smallint not null,
  data_quality_score smallint not null,
  engagement_score smallint not null,
  total_score smallint not null,
  satisfied_criteria jsonb not null default '[]'::jsonb,
  missing_criteria jsonb not null default '[]'::jsonb,
  applied_weights jsonb not null default '{}'::jsonb,
  confidence_score smallint not null,
  next_action text not null,
  input_snapshot jsonb not null,
  input_fingerprint text not null,
  explanation jsonb not null,
  calculated_by uuid,
  calculated_at timestamptz not null default statement_timestamp(),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_lead_scores primary key (id),
  constraint uq_lead_scores__tenant_id unique (agency_id, client_id, id),
  constraint uq_lead_scores__reproduction
    unique (agency_id, client_id, contact_id, model_version_id, input_fingerprint),
  constraint fk_lead_scores__contact
    foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete cascade,
  constraint fk_lead_scores__company
    foreign key (agency_id, client_id, company_id)
    references public.companies (agency_id, client_id, id) on delete restrict,
  constraint fk_lead_scores__model_version
    foreign key (agency_id, client_id, model_version_id)
    references public.scoring_model_versions (agency_id, client_id, id)
    on delete restrict,
  constraint fk_lead_scores__calculated_by foreign key (calculated_by)
    references public.profiles (id) on delete restrict,
  constraint ck_lead_scores__scores check (
    fit_score between 0 and 100
    and intent_score between 0 and 100
    and data_quality_score between 0 and 100
    and engagement_score between 0 and 100
    and total_score between 0 and 100
    and confidence_score between 0 and 100
  ),
  constraint ck_lead_scores__satisfied
    check (jsonb_typeof(satisfied_criteria) = 'array'),
  constraint ck_lead_scores__missing
    check (jsonb_typeof(missing_criteria) = 'array'),
  constraint ck_lead_scores__weights
    check (jsonb_typeof(applied_weights) = 'object'),
  constraint ck_lead_scores__input
    check (jsonb_typeof(input_snapshot) = 'object'),
  constraint ck_lead_scores__explanation
    check (jsonb_typeof(explanation) = 'object'),
  constraint ck_lead_scores__fingerprint
    check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint ck_lead_scores__next_action
    check (char_length(btrim(next_action)) between 1 and 500)
);

create table public.segments (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  name text not null,
  description text,
  status public.segment_status not null default 'draft',
  is_dynamic boolean not null default true,
  filter_definition jsonb not null,
  filter_version integer not null default 1,
  created_by uuid not null,
  updated_by uuid not null,
  archived_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_segments primary key (id),
  constraint uq_segments__tenant_id unique (agency_id, client_id, id),
  constraint uq_segments__tenant_name unique (agency_id, client_id, name),
  constraint fk_segments__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_segments__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint fk_segments__updated_by foreign key (updated_by)
    references public.profiles (id) on delete restrict,
  constraint fk_segments__archived_by foreign key (archived_by)
    references public.profiles (id) on delete restrict,
  constraint ck_segments__name
    check (char_length(btrim(name)) between 1 and 160),
  constraint ck_segments__description
    check (description is null or char_length(description) <= 2000),
  constraint ck_segments__filter
    check (
      jsonb_typeof(filter_definition) = 'object'
      and octet_length(filter_definition::text) <= 100000
    ),
  constraint ck_segments__version check (filter_version > 0),
  constraint ck_segments__archive check (
    (status = 'archived' and archived_by is not null and archived_at is not null)
    or (status <> 'archived' and archived_by is null and archived_at is null)
  )
);

create table public.segment_memberships (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  segment_id uuid not null,
  contact_id uuid not null,
  lead_score_id uuid,
  matched_criteria jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_segment_memberships primary key (id),
  constraint uq_segment_memberships__segment_contact
    unique (segment_id, contact_id),
  constraint fk_segment_memberships__segment
    foreign key (agency_id, client_id, segment_id)
    references public.segments (agency_id, client_id, id) on delete cascade,
  constraint fk_segment_memberships__contact
    foreign key (agency_id, client_id, contact_id)
    references public.contacts (agency_id, client_id, id) on delete cascade,
  constraint fk_segment_memberships__score
    foreign key (agency_id, client_id, lead_score_id)
    references public.lead_scores (agency_id, client_id, id) on delete restrict,
  constraint ck_segment_memberships__matched
    check (jsonb_typeof(matched_criteria) = 'array'),
  constraint ck_segment_memberships__expiry
    check (expires_at is null or expires_at > evaluated_at)
);

comment on table public.scoring_model_versions is
  'Immutable scoring rule snapshots. Deterministic application code validates and executes the configuration.';
comment on table public.lead_scores is
  'Reproducible and explainable contact score snapshots; no opaque AI score is accepted.';
comment on table public.segments is
  'Client-scoped dynamic segment definitions across company, persona, offer, score, language, problem, intent and maturity.';
comment on table public.segment_memberships is
  'Materialized segment evaluation results that may expire and be recalculated.';

create index idx_scoring_models__client_status
  on public.scoring_models (agency_id, client_id, status, updated_at desc);
create index idx_scoring_versions__model
  on public.scoring_model_versions (agency_id, client_id, model_id, version_number desc);
create index idx_lead_scores__contact_latest
  on public.lead_scores (agency_id, client_id, contact_id, calculated_at desc);
create index idx_lead_scores__total
  on public.lead_scores (agency_id, client_id, total_score desc, calculated_at desc);
create index idx_segments__client_status
  on public.segments (agency_id, client_id, status, updated_at desc);
create index idx_segment_memberships__segment
  on public.segment_memberships (agency_id, client_id, segment_id, evaluated_at desc);
create index idx_segment_memberships__contact
  on public.segment_memberships (agency_id, client_id, contact_id);

create trigger trg_scoring_models__set_updated_at
before update on public.scoring_models
for each row execute function private.set_updated_at();
create trigger trg_scoring_model_versions__set_updated_at
before update on public.scoring_model_versions
for each row execute function private.set_updated_at();
create trigger trg_lead_scores__set_updated_at
before update on public.lead_scores
for each row execute function private.set_updated_at();
create trigger trg_segments__set_updated_at
before update on public.segments
for each row execute function private.set_updated_at();
create trigger trg_segment_memberships__set_updated_at
before update on public.segment_memberships
for each row execute function private.set_updated_at();

alter table public.scoring_models enable row level security;
alter table public.scoring_model_versions enable row level security;
alter table public.lead_scores enable row level security;
alter table public.segments enable row level security;
alter table public.segment_memberships enable row level security;

create policy scoring_models_select_authorized
on public.scoring_models for select to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));
create policy scoring_model_versions_select_authorized
on public.scoring_model_versions for select to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));
create policy lead_scores_select_authorized
on public.lead_scores for select to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));
create policy segments_select_authorized
on public.segments for select to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));
create policy segment_memberships_select_authorized
on public.segment_memberships for select to authenticated
using (private.has_permission(agency_id, client_id, 'lead.read'));

revoke all on
  public.scoring_models,
  public.scoring_model_versions,
  public.lead_scores,
  public.segments,
  public.segment_memberships
from anon, authenticated;

grant select on
  public.scoring_models,
  public.scoring_model_versions,
  public.lead_scores,
  public.segments,
  public.segment_memberships
to authenticated;
