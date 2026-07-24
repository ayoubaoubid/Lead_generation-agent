create type public.strategy_artifact_type as enum (
  'positioning',
  'offer'
);

create type public.strategy_version_status as enum (
  'draft',
  'validated'
);

create type public.strategy_claim_status as enum (
  'confirmed',
  'inferred',
  'hypothesis',
  'missing'
);

create type public.strategy_evidence_type as enum (
  'customer_case',
  'testimonial',
  'statistic',
  'document',
  'internal_data',
  'authorization',
  'other'
);

create table public.strategy_artifacts (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  artifact_type public.strategy_artifact_type not null,
  name text not null,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_strategy_artifacts primary key (id),
  constraint uq_strategy_artifacts__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_strategy_artifacts__agency_id_client_id
    foreign key (agency_id, client_id)
    references public.clients (agency_id, id)
    on delete restrict,
  constraint fk_strategy_artifacts__created_by
    foreign key (created_by)
    references public.profiles (id)
    on delete restrict,
  constraint ck_strategy_artifacts__name
    check (char_length(btrim(name)) between 1 and 160)
);

create unique index uq_strategy_artifacts__positioning_per_client
  on public.strategy_artifacts (agency_id, client_id)
  where artifact_type = 'positioning';

create index idx_strategy_artifacts__client_type_updated
  on public.strategy_artifacts (
    agency_id,
    client_id,
    artifact_type,
    updated_at desc
  );

comment on table public.strategy_artifacts is
  'Client-scoped positioning or offer aggregate. Mutable content lives only in version rows.';

create table public.strategy_versions (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  artifact_id uuid not null,
  version_number integer not null,
  status public.strategy_version_status not null default 'draft',
  content jsonb not null default '[]'::jsonb,
  framework text not null,
  framework_version text not null,
  created_by uuid not null,
  updated_by uuid not null,
  validated_by uuid,
  validated_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_strategy_versions primary key (id),
  constraint uq_strategy_versions__artifact_version
    unique (artifact_id, version_number),
  constraint uq_strategy_versions__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_strategy_versions__agency_id_client_id_artifact_id
    foreign key (agency_id, client_id, artifact_id)
    references public.strategy_artifacts (agency_id, client_id, id)
    on delete cascade,
  constraint fk_strategy_versions__created_by
    foreign key (created_by)
    references public.profiles (id)
    on delete restrict,
  constraint fk_strategy_versions__updated_by
    foreign key (updated_by)
    references public.profiles (id)
    on delete restrict,
  constraint fk_strategy_versions__validated_by
    foreign key (validated_by)
    references public.profiles (id)
    on delete restrict,
  constraint ck_strategy_versions__version_number
    check (version_number > 0),
  constraint ck_strategy_versions__content_array
    check (jsonb_typeof(content) = 'array'),
  constraint ck_strategy_versions__content_size
    check (octet_length(content::text) <= 150000),
  constraint ck_strategy_versions__framework
    check (framework in ('obviously-awesome', '100m-offers')),
  constraint ck_strategy_versions__framework_version
    check (char_length(btrim(framework_version)) between 1 and 40),
  constraint ck_strategy_versions__validation_state check (
    (
      status = 'draft'
      and validated_by is null
      and validated_at is null
    )
    or (
      status = 'validated'
      and validated_by is not null
      and validated_at is not null
    )
  )
);

create unique index uq_strategy_versions__single_draft
  on public.strategy_versions (artifact_id)
  where status = 'draft';

create index idx_strategy_versions__client_artifact_version
  on public.strategy_versions (
    agency_id,
    client_id,
    artifact_id,
    version_number desc
  );

create index idx_strategy_versions__validated
  on public.strategy_versions (
    agency_id,
    client_id,
    artifact_id,
    validated_at desc
  )
  where status = 'validated';

comment on table public.strategy_versions is
  'Versioned strategic content. Validated versions are immutable and remain available as history.';
comment on column public.strategy_versions.content is
  'Array of structured items: kind, value, classification and evidenceIds.';

create table public.strategy_evidence (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  evidence_type public.strategy_evidence_type not null,
  title text not null,
  description text not null,
  classification public.strategy_claim_status not null,
  source_url text,
  source_reference text,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  constraint pk_strategy_evidence primary key (id),
  constraint uq_strategy_evidence__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_strategy_evidence__agency_id_client_id
    foreign key (agency_id, client_id)
    references public.clients (agency_id, id)
    on delete restrict,
  constraint fk_strategy_evidence__created_by
    foreign key (created_by)
    references public.profiles (id)
    on delete restrict,
  constraint ck_strategy_evidence__title
    check (char_length(btrim(title)) between 1 and 200),
  constraint ck_strategy_evidence__description
    check (char_length(btrim(description)) between 1 and 4000),
  constraint ck_strategy_evidence__source_url
    check (
      source_url is null
      or (
        char_length(source_url) <= 2048
        and source_url ~* '^https?://'
      )
    ),
  constraint ck_strategy_evidence__source_reference
    check (source_reference is null or char_length(source_reference) <= 500),
  constraint ck_strategy_evidence__not_missing
    check (classification <> 'missing'),
  constraint ck_strategy_evidence__confirmed_has_source check (
    classification <> 'confirmed'
    or nullif(btrim(coalesce(source_url, '')), '') is not null
    or nullif(btrim(coalesce(source_reference, '')), '') is not null
  )
);

create index idx_strategy_evidence__client_active
  on public.strategy_evidence (
    agency_id,
    client_id,
    created_at desc
  )
  where archived_at is null;

comment on table public.strategy_evidence is
  'Human-provided or imported evidence. Confirmed evidence must keep a source reference.';

create table public.strategy_version_evidence (
  agency_id uuid not null,
  client_id uuid not null,
  version_id uuid not null,
  evidence_id uuid not null,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_strategy_version_evidence
    primary key (version_id, evidence_id),
  constraint fk_strategy_version_evidence__version
    foreign key (agency_id, client_id, version_id)
    references public.strategy_versions (agency_id, client_id, id)
    on delete cascade,
  constraint fk_strategy_version_evidence__evidence
    foreign key (agency_id, client_id, evidence_id)
    references public.strategy_evidence (agency_id, client_id, id)
    on delete restrict,
  constraint fk_strategy_version_evidence__created_by
    foreign key (created_by)
    references public.profiles (id)
    on delete restrict
);

create index idx_strategy_version_evidence__evidence_id
  on public.strategy_version_evidence (
    agency_id,
    client_id,
    evidence_id
  );

comment on table public.strategy_version_evidence is
  'Tenant-aware relational projection of evidenceIds referenced by version content.';

create trigger trg_strategy_artifacts__set_updated_at
before update on public.strategy_artifacts
for each row execute function private.set_updated_at();

create trigger trg_strategy_versions__set_updated_at
before update on public.strategy_versions
for each row execute function private.set_updated_at();

create trigger trg_strategy_evidence__set_updated_at
before update on public.strategy_evidence
for each row execute function private.set_updated_at();

create or replace function private.is_valid_strategy_content(
  requested_content jsonb,
  requested_artifact_type public.strategy_artifact_type
)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  item jsonb;
  item_kind text;
  evidence_value text;
  positioning_kinds constant text[] := array[
    'positioning_statement',
    'competitive_alternative',
    'unique_capability',
    'customer_value',
    'best_fit_segment',
    'market_category',
    'proof_point',
    'excluded_segment',
    'differentiator'
  ];
  offer_kinds constant text[] := array[
    'desired_result',
    'promise',
    'guarantee',
    'timeline',
    'objection',
    'proof_point',
    'obstacle',
    'bonus',
    'differentiator'
  ];
begin
  if jsonb_typeof(requested_content) <> 'array'
     or jsonb_array_length(requested_content) > 100 then
    return false;
  end if;

  for item in
    select value from jsonb_array_elements(requested_content)
  loop
    if jsonb_typeof(item) <> 'object'
       or not (item ? 'kind')
       or not (item ? 'value')
       or not (item ? 'classification')
       or not (item ? 'evidenceIds')
       or jsonb_typeof(item -> 'kind') <> 'string'
       or jsonb_typeof(item -> 'value') <> 'string'
       or jsonb_typeof(item -> 'classification') <> 'string'
       or jsonb_typeof(item -> 'evidenceIds') <> 'array'
       or char_length(btrim(item ->> 'value')) not between 1 and 4000
       or item ->> 'classification' not in (
         'confirmed',
         'inferred',
         'hypothesis',
         'missing'
       )
       or jsonb_array_length(item -> 'evidenceIds') > 20 then
      return false;
    end if;

    item_kind := item ->> 'kind';
    if requested_artifact_type = 'positioning'
       and not (item_kind = any(positioning_kinds)) then
      return false;
    end if;
    if requested_artifact_type = 'offer'
       and not (item_kind = any(offer_kinds)) then
      return false;
    end if;

    if item ->> 'classification' = 'missing'
       and jsonb_array_length(item -> 'evidenceIds') <> 0 then
      return false;
    end if;

    for evidence_value in
      select value
      from jsonb_array_elements_text(item -> 'evidenceIds')
    loop
      if evidence_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        return false;
      end if;
    end loop;
  end loop;

  return true;
end;
$$;

comment on function private.is_valid_strategy_content(
  jsonb,
  public.strategy_artifact_type
) is
  'Validates the bounded structured content contract without trusting TypeScript types.';

create or replace function private.prevent_validated_strategy_version_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'validated' then
    raise exception 'validated strategy versions are immutable'
      using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger trg_strategy_versions__protect_validated
before update or delete on public.strategy_versions
for each row execute function private.prevent_validated_strategy_version_mutation();

alter table public.strategy_artifacts enable row level security;
alter table public.strategy_versions enable row level security;
alter table public.strategy_evidence enable row level security;
alter table public.strategy_version_evidence enable row level security;

revoke all on table public.strategy_artifacts
from public, anon, authenticated;
revoke all on table public.strategy_versions
from public, anon, authenticated;
revoke all on table public.strategy_evidence
from public, anon, authenticated;
revoke all on table public.strategy_version_evidence
from public, anon, authenticated;

grant select on table public.strategy_artifacts to authenticated;
grant select on table public.strategy_versions to authenticated;
grant select on table public.strategy_evidence to authenticated;
grant select on table public.strategy_version_evidence to authenticated;

grant select, insert, update, delete
on table public.strategy_artifacts to service_role;
grant select, insert, update, delete
on table public.strategy_versions to service_role;
grant select, insert, update, delete
on table public.strategy_evidence to service_role;
grant select, insert, update, delete
on table public.strategy_version_evidence to service_role;

create policy strategy_artifacts_select_authorized
on public.strategy_artifacts
for select
to authenticated
using (
  (select private.has_permission(
    strategy_artifacts.agency_id,
    strategy_artifacts.client_id,
    'offer.read'
  ))
);

create policy strategy_versions_select_authorized
on public.strategy_versions
for select
to authenticated
using (
  (select private.has_permission(
    strategy_versions.agency_id,
    strategy_versions.client_id,
    'offer.read'
  ))
);

create policy strategy_evidence_select_authorized
on public.strategy_evidence
for select
to authenticated
using (
  (select private.has_permission(
    strategy_evidence.agency_id,
    strategy_evidence.client_id,
    'offer.read'
  ))
);

create policy strategy_version_evidence_select_authorized
on public.strategy_version_evidence
for select
to authenticated
using (
  (select private.has_permission(
    strategy_version_evidence.agency_id,
    strategy_version_evidence.client_id,
    'offer.read'
  ))
);

create or replace function private.assert_strategy_write_access(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    'offer.write'
  ) then
    raise exception 'offer write permission required'
      using errcode = '42501';
  end if;
  if not exists (
    select 1
    from public.clients as client
    where client.agency_id = requested_agency_id
      and client.id = requested_client_id
      and client.archived_at is null
  ) then
    raise exception 'authorized client not found'
      using errcode = '42501';
  end if;
  return actor_id;
end;
$$;

create or replace function private.create_strategy_evidence(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_evidence_type public.strategy_evidence_type,
  requested_title text,
  requested_description text,
  requested_classification public.strategy_claim_status,
  requested_source_url text,
  requested_source_reference text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  created_id uuid;
begin
  actor_id := private.assert_strategy_write_access(
    requested_agency_id,
    requested_client_id
  );

  insert into public.strategy_evidence (
    agency_id,
    client_id,
    evidence_type,
    title,
    description,
    classification,
    source_url,
    source_reference,
    created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    requested_evidence_type,
    btrim(requested_title),
    btrim(requested_description),
    requested_classification,
    nullif(btrim(requested_source_url), ''),
    nullif(btrim(requested_source_reference), ''),
    actor_id
  )
  returning id into created_id;

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    requested_client_id,
    actor_id,
    'strategy_evidence.created',
    'strategy_evidence',
    created_id::text,
    jsonb_build_object(
      'evidence_type', requested_evidence_type,
      'classification', requested_classification
    )
  );

  return created_id;
end;
$$;

create or replace function public.create_strategy_evidence(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_evidence_type public.strategy_evidence_type,
  requested_title text,
  requested_description text,
  requested_classification public.strategy_claim_status,
  requested_source_url text default '',
  requested_source_reference text default ''
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_strategy_evidence(
    requested_agency_id,
    requested_client_id,
    requested_evidence_type,
    requested_title,
    requested_description,
    requested_classification,
    requested_source_url,
    requested_source_reference
  );
$$;

create or replace function private.create_strategy_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_artifact_type public.strategy_artifact_type,
  requested_artifact_id uuid,
  requested_name text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_artifact public.strategy_artifacts%rowtype;
  existing_draft_id uuid;
  next_version integer;
  cloned_content jsonb := '[]'::jsonb;
  created_version_id uuid;
  selected_framework text;
begin
  actor_id := private.assert_strategy_write_access(
    requested_agency_id,
    requested_client_id
  );

  if requested_artifact_type = 'positioning' then
    select artifact.*
    into target_artifact
    from public.strategy_artifacts as artifact
    where artifact.agency_id = requested_agency_id
      and artifact.client_id = requested_client_id
      and artifact.artifact_type = 'positioning'
    for update;

    if not found then
      insert into public.strategy_artifacts (
        agency_id,
        client_id,
        artifact_type,
        name,
        created_by
      )
      values (
        requested_agency_id,
        requested_client_id,
        'positioning',
        'Positionnement',
        actor_id
      )
      returning * into target_artifact;
    end if;
  elsif requested_artifact_id is null then
    insert into public.strategy_artifacts (
      agency_id,
      client_id,
      artifact_type,
      name,
      created_by
    )
    values (
      requested_agency_id,
      requested_client_id,
      'offer',
      btrim(requested_name),
      actor_id
    )
    returning * into target_artifact;
  else
    select artifact.*
    into target_artifact
    from public.strategy_artifacts as artifact
    where artifact.agency_id = requested_agency_id
      and artifact.client_id = requested_client_id
      and artifact.id = requested_artifact_id
      and artifact.artifact_type = 'offer'
    for update;

    if not found then
      raise exception 'authorized offer not found' using errcode = '42501';
    end if;
  end if;

  select version.id
  into existing_draft_id
  from public.strategy_versions as version
  where version.artifact_id = target_artifact.id
    and version.status = 'draft';

  if existing_draft_id is not null then
    return existing_draft_id;
  end if;

  select
    coalesce(max(version.version_number), 0) + 1,
    coalesce(
      (
        array_agg(version.content order by version.version_number desc)
      )[1],
      '[]'::jsonb
    )
  into next_version, cloned_content
  from public.strategy_versions as version
  where version.artifact_id = target_artifact.id;

  selected_framework := case
    when requested_artifact_type = 'positioning' then 'obviously-awesome'
    else '100m-offers'
  end;

  insert into public.strategy_versions (
    agency_id,
    client_id,
    artifact_id,
    version_number,
    content,
    framework,
    framework_version,
    created_by,
    updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    target_artifact.id,
    next_version,
    cloned_content,
    selected_framework,
    '1.0.0',
    actor_id,
    actor_id
  )
  returning id into created_version_id;

  insert into public.strategy_version_evidence (
    agency_id,
    client_id,
    version_id,
    evidence_id,
    created_by
  )
  select
    requested_agency_id,
    requested_client_id,
    created_version_id,
    source_link.evidence_id,
    actor_id
  from public.strategy_versions as source_version
  join public.strategy_version_evidence as source_link
    on source_link.version_id = source_version.id
  where source_version.artifact_id = target_artifact.id
    and source_version.version_number = next_version - 1
  on conflict do nothing;

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    requested_client_id,
    actor_id,
    requested_artifact_type::text || '.draft_created',
    'strategy_version',
    created_version_id::text,
    jsonb_build_object(
      'artifact_id', target_artifact.id,
      'version_number', next_version,
      'framework', selected_framework,
      'framework_version', '1.0.0'
    )
  );

  return created_version_id;
end;
$$;

create or replace function public.create_positioning_draft(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_strategy_draft(
    requested_agency_id,
    requested_client_id,
    'positioning',
    null,
    'Positionnement'
  );
$$;

create or replace function public.create_offer_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_artifact_id uuid default null,
  requested_name text default 'Nouvelle offre'
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_strategy_draft(
    requested_agency_id,
    requested_client_id,
    'offer',
    requested_artifact_id,
    requested_name
  );
$$;

create or replace function private.save_strategy_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_artifact_type public.strategy_artifact_type,
  requested_name text,
  requested_content jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_version public.strategy_versions%rowtype;
  target_artifact public.strategy_artifacts%rowtype;
  item jsonb;
  evidence_value text;
  evidence_uuid uuid;
begin
  actor_id := private.assert_strategy_write_access(
    requested_agency_id,
    requested_client_id
  );

  select version.*
  into target_version
  from public.strategy_versions as version
  where version.agency_id = requested_agency_id
    and version.client_id = requested_client_id
    and version.id = requested_version_id
    and version.status = 'draft'
  for update;

  if not found then
    raise exception 'authorized draft version not found'
      using errcode = '42501';
  end if;

  select artifact.*
  into target_artifact
  from public.strategy_artifacts as artifact
  where artifact.agency_id = requested_agency_id
    and artifact.client_id = requested_client_id
    and artifact.id = target_version.artifact_id
    and artifact.artifact_type = requested_artifact_type;

  if not found then
    raise exception 'strategy artifact type mismatch'
      using errcode = '23514';
  end if;

  if not private.is_valid_strategy_content(
    requested_content,
    requested_artifact_type
  ) then
    raise exception 'invalid structured strategy content'
      using errcode = '23514';
  end if;

  for item in select value from jsonb_array_elements(requested_content)
  loop
    for evidence_value in
      select value
      from jsonb_array_elements_text(item -> 'evidenceIds')
    loop
      evidence_uuid := evidence_value::uuid;
      if not exists (
        select 1
        from public.strategy_evidence as evidence
        where evidence.agency_id = requested_agency_id
          and evidence.client_id = requested_client_id
          and evidence.id = evidence_uuid
          and evidence.archived_at is null
      ) then
        raise exception 'cross-tenant or unavailable evidence reference'
          using errcode = '42501';
      end if;
    end loop;

    if item ->> 'classification' = 'confirmed' then
      if not exists (
        select 1
        from jsonb_array_elements_text(item -> 'evidenceIds') as reference(value)
        join public.strategy_evidence as evidence
          on evidence.id = reference.value::uuid
        where evidence.agency_id = requested_agency_id
          and evidence.client_id = requested_client_id
          and evidence.classification = 'confirmed'
          and evidence.archived_at is null
      ) then
        raise exception 'confirmed items require confirmed evidence'
          using errcode = '23514';
      end if;
    end if;

    if item ->> 'kind' = 'guarantee'
       and item ->> 'classification' = 'confirmed'
       and not exists (
         select 1
         from jsonb_array_elements_text(item -> 'evidenceIds') as reference(value)
         join public.strategy_evidence as evidence
           on evidence.id = reference.value::uuid
         where evidence.agency_id = requested_agency_id
           and evidence.client_id = requested_client_id
           and evidence.evidence_type = 'authorization'
           and evidence.classification = 'confirmed'
           and evidence.archived_at is null
       ) then
      raise exception 'confirmed guarantees require confirmed authorization'
        using errcode = '23514';
    end if;
  end loop;

  update public.strategy_artifacts
  set name = case
    when requested_artifact_type = 'offer' then btrim(requested_name)
    else name
  end
  where id = target_artifact.id;

  update public.strategy_versions
  set
    content = requested_content,
    updated_by = actor_id
  where id = target_version.id;

  delete from public.strategy_version_evidence
  where version_id = target_version.id;

  insert into public.strategy_version_evidence (
    agency_id,
    client_id,
    version_id,
    evidence_id,
    created_by
  )
  select distinct
    requested_agency_id,
    requested_client_id,
    target_version.id,
    reference.value::uuid,
    actor_id
  from jsonb_array_elements(requested_content) as item(value)
  cross join lateral jsonb_array_elements_text(
    item.value -> 'evidenceIds'
  ) as reference(value);

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    requested_client_id,
    actor_id,
    requested_artifact_type::text || '.draft_saved',
    'strategy_version',
    target_version.id::text,
    jsonb_build_object(
      'artifact_id', target_artifact.id,
      'version_number', target_version.version_number,
      'item_count', jsonb_array_length(requested_content)
    )
  );

  return target_version.id;
end;
$$;

create or replace function public.save_positioning_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_content jsonb
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.save_strategy_draft(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    'positioning',
    'Positionnement',
    requested_content
  );
$$;

create or replace function public.save_offer_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_name text,
  requested_content jsonb
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.save_strategy_draft(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    'offer',
    requested_name,
    requested_content
  );
$$;

create or replace function private.validate_strategy_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_artifact_type public.strategy_artifact_type
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_version public.strategy_versions%rowtype;
  target_artifact public.strategy_artifacts%rowtype;
  required_kind text;
  required_positioning constant text[] := array[
    'positioning_statement',
    'competitive_alternative',
    'unique_capability',
    'customer_value',
    'best_fit_segment',
    'differentiator'
  ];
  required_offer constant text[] := array[
    'desired_result',
    'promise',
    'timeline',
    'differentiator'
  ];
begin
  actor_id := private.assert_strategy_write_access(
    requested_agency_id,
    requested_client_id
  );

  select version.*
  into target_version
  from public.strategy_versions as version
  where version.agency_id = requested_agency_id
    and version.client_id = requested_client_id
    and version.id = requested_version_id
    and version.status = 'draft'
  for update;

  if not found then
    raise exception 'authorized draft version not found'
      using errcode = '42501';
  end if;

  select artifact.*
  into target_artifact
  from public.strategy_artifacts as artifact
  where artifact.id = target_version.artifact_id
    and artifact.agency_id = requested_agency_id
    and artifact.client_id = requested_client_id
    and artifact.artifact_type = requested_artifact_type;

  if not found then
    raise exception 'strategy artifact type mismatch'
      using errcode = '23514';
  end if;

  foreach required_kind in array (
    case
      when requested_artifact_type = 'positioning'
        then required_positioning
      else required_offer
    end
  )
  loop
    if not exists (
      select 1
      from jsonb_array_elements(target_version.content) as item(value)
      where item.value ->> 'kind' = required_kind
        and item.value ->> 'classification' <> 'missing'
    ) then
      raise exception 'required strategy content is missing: %', required_kind
        using errcode = '23514';
    end if;
  end loop;

  update public.strategy_versions
  set
    status = 'validated',
    validated_by = actor_id,
    validated_at = statement_timestamp(),
    updated_by = actor_id
  where id = target_version.id;

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    requested_client_id,
    actor_id,
    requested_artifact_type::text || '.validated',
    'strategy_version',
    target_version.id::text,
    jsonb_build_object(
      'artifact_id', target_artifact.id,
      'version_number', target_version.version_number,
      'framework', target_version.framework,
      'framework_version', target_version.framework_version
    )
  );

  return target_version.id;
end;
$$;

create or replace function public.validate_positioning_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.validate_strategy_version(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    'positioning'
  );
$$;

create or replace function public.validate_offer_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.validate_strategy_version(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    'offer'
  );
$$;

revoke all on function private.is_valid_strategy_content(
  jsonb,
  public.strategy_artifact_type
) from public, anon, authenticated;
revoke all on function private.prevent_validated_strategy_version_mutation()
from public, anon, authenticated;
revoke all on function private.assert_strategy_write_access(uuid, uuid)
from public, anon, authenticated;
revoke all on function private.create_strategy_evidence(
  uuid,
  uuid,
  public.strategy_evidence_type,
  text,
  text,
  public.strategy_claim_status,
  text,
  text
) from public, anon, authenticated;
revoke all on function private.create_strategy_draft(
  uuid,
  uuid,
  public.strategy_artifact_type,
  uuid,
  text
) from public, anon, authenticated;
revoke all on function private.save_strategy_draft(
  uuid,
  uuid,
  uuid,
  public.strategy_artifact_type,
  text,
  jsonb
) from public, anon, authenticated;
revoke all on function private.validate_strategy_version(
  uuid,
  uuid,
  uuid,
  public.strategy_artifact_type
) from public, anon, authenticated;

revoke all on function public.create_strategy_evidence(
  uuid,
  uuid,
  public.strategy_evidence_type,
  text,
  text,
  public.strategy_claim_status,
  text,
  text
) from public, anon;
revoke all on function public.create_positioning_draft(uuid, uuid)
from public, anon;
revoke all on function public.create_offer_draft(uuid, uuid, uuid, text)
from public, anon;
revoke all on function public.save_positioning_draft(uuid, uuid, uuid, jsonb)
from public, anon;
revoke all on function public.save_offer_draft(uuid, uuid, uuid, text, jsonb)
from public, anon;
revoke all on function public.validate_positioning_version(uuid, uuid, uuid)
from public, anon;
revoke all on function public.validate_offer_version(uuid, uuid, uuid)
from public, anon;

grant execute on function private.create_strategy_evidence(
  uuid,
  uuid,
  public.strategy_evidence_type,
  text,
  text,
  public.strategy_claim_status,
  text,
  text
) to authenticated;
grant execute on function private.create_strategy_draft(
  uuid,
  uuid,
  public.strategy_artifact_type,
  uuid,
  text
) to authenticated;
grant execute on function private.save_strategy_draft(
  uuid,
  uuid,
  uuid,
  public.strategy_artifact_type,
  text,
  jsonb
) to authenticated;
grant execute on function private.validate_strategy_version(
  uuid,
  uuid,
  uuid,
  public.strategy_artifact_type
) to authenticated;

grant execute on function public.create_strategy_evidence(
  uuid,
  uuid,
  public.strategy_evidence_type,
  text,
  text,
  public.strategy_claim_status,
  text,
  text
) to authenticated;
grant execute on function public.create_positioning_draft(uuid, uuid)
to authenticated;
grant execute on function public.create_offer_draft(uuid, uuid, uuid, text)
to authenticated;
grant execute on function public.save_positioning_draft(
  uuid,
  uuid,
  uuid,
  jsonb
) to authenticated;
grant execute on function public.save_offer_draft(
  uuid,
  uuid,
  uuid,
  text,
  jsonb
) to authenticated;
grant execute on function public.validate_positioning_version(
  uuid,
  uuid,
  uuid
) to authenticated;
grant execute on function public.validate_offer_version(uuid, uuid, uuid)
to authenticated;
