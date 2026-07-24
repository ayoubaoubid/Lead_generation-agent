insert into public.permissions (
  key,
  resource,
  action,
  description,
  allowed_scopes
)
values
  ('targeting.read', 'targeting', 'read', 'Read authorized ICP and persona profiles.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.write', 'targeting', 'write', 'Create, edit, duplicate, version, and archive ICP and persona profiles.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.validate', 'targeting', 'validate', 'Human validation and activation of ICP and persona versions.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('targeting.propose', 'targeting', 'propose', 'Request structured AI proposals for ICP and persona drafts.', array['agency'::public.role_scope, 'client'::public.role_scope])
on conflict (key) do update
set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes;

create or replace function private.assign_targeting_permissions_for_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.roles%rowtype;
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  select role.*
  into target_role
  from public.roles as role
  where role.id = new.role_id
    and role.is_system
    and role.archived_at is null;

  if not found then
    return new;
  end if;

  insert into public.role_permissions (role_id, permission_id, created_by)
  select
    target_role.id,
    permission.id,
    new.created_by
  from public.permissions as permission
  where permission.key in (
    select assignment.permission_key
    from (
      values
        ('agency'::public.role_scope, 'owner', 'targeting.read'),
        ('agency'::public.role_scope, 'owner', 'targeting.write'),
        ('agency'::public.role_scope, 'owner', 'targeting.validate'),
        ('agency'::public.role_scope, 'owner', 'targeting.propose'),
        ('agency'::public.role_scope, 'admin', 'targeting.read'),
        ('agency'::public.role_scope, 'admin', 'targeting.write'),
        ('agency'::public.role_scope, 'admin', 'targeting.validate'),
        ('agency'::public.role_scope, 'admin', 'targeting.propose'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.read'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.write'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.validate'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.propose'),
        ('agency'::public.role_scope, 'lead-researcher', 'targeting.read'),
        ('agency'::public.role_scope, 'lead-researcher', 'targeting.write'),
        ('agency'::public.role_scope, 'lead-researcher', 'targeting.propose'),
        ('agency'::public.role_scope, 'sdr', 'targeting.read'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.read'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.write'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.validate'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.propose'),
        ('agency'::public.role_scope, 'reviewer', 'targeting.read'),
        ('agency'::public.role_scope, 'reviewer', 'targeting.validate'),
        ('agency'::public.role_scope, 'analyst', 'targeting.read'),
        ('client'::public.role_scope, 'admin', 'targeting.read'),
        ('client'::public.role_scope, 'admin', 'targeting.write'),
        ('client'::public.role_scope, 'admin', 'targeting.validate'),
        ('client'::public.role_scope, 'admin', 'targeting.propose'),
        ('client'::public.role_scope, 'reviewer', 'targeting.read'),
        ('client'::public.role_scope, 'reviewer', 'targeting.validate'),
        ('client'::public.role_scope, 'viewer', 'targeting.read')
    ) as assignment(role_scope, role_slug, permission_key)
    where assignment.role_scope = target_role.scope
      and assignment.role_slug = target_role.slug
  )
  on conflict (role_id, permission_id) do nothing;

  return new;
end;
$$;

comment on function private.assign_targeting_permissions_for_role() is
  'Synchronizes the explicit ICP/persona permission matrix whenever a system role is provisioned.';

create trigger trg_role_permissions__assign_targeting
after insert on public.role_permissions
for each row execute function private.assign_targeting_permissions_for_role();

-- Synchronize system roles that already exist before this migration.
insert into public.role_permissions (role_id, permission_id, created_by)
select
  role.id,
  permission.id,
  role.created_by
from public.roles as role
join public.permissions as permission
  on permission.key in (
    select assignment.permission_key
    from (
      values
        ('agency'::public.role_scope, 'owner', 'targeting.read'),
        ('agency'::public.role_scope, 'owner', 'targeting.write'),
        ('agency'::public.role_scope, 'owner', 'targeting.validate'),
        ('agency'::public.role_scope, 'owner', 'targeting.propose'),
        ('agency'::public.role_scope, 'admin', 'targeting.read'),
        ('agency'::public.role_scope, 'admin', 'targeting.write'),
        ('agency'::public.role_scope, 'admin', 'targeting.validate'),
        ('agency'::public.role_scope, 'admin', 'targeting.propose'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.read'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.write'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.validate'),
        ('agency'::public.role_scope, 'campaign-manager', 'targeting.propose'),
        ('agency'::public.role_scope, 'lead-researcher', 'targeting.read'),
        ('agency'::public.role_scope, 'lead-researcher', 'targeting.write'),
        ('agency'::public.role_scope, 'lead-researcher', 'targeting.propose'),
        ('agency'::public.role_scope, 'sdr', 'targeting.read'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.read'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.write'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.validate'),
        ('agency'::public.role_scope, 'sales-manager', 'targeting.propose'),
        ('agency'::public.role_scope, 'reviewer', 'targeting.read'),
        ('agency'::public.role_scope, 'reviewer', 'targeting.validate'),
        ('agency'::public.role_scope, 'analyst', 'targeting.read'),
        ('client'::public.role_scope, 'admin', 'targeting.read'),
        ('client'::public.role_scope, 'admin', 'targeting.write'),
        ('client'::public.role_scope, 'admin', 'targeting.validate'),
        ('client'::public.role_scope, 'admin', 'targeting.propose'),
        ('client'::public.role_scope, 'reviewer', 'targeting.read'),
        ('client'::public.role_scope, 'reviewer', 'targeting.validate'),
        ('client'::public.role_scope, 'viewer', 'targeting.read')
    ) as assignment(role_scope, role_slug, permission_key)
    where assignment.role_scope = role.scope
      and assignment.role_slug = role.slug
  )
where role.is_system
  and role.archived_at is null
on conflict (role_id, permission_id) do nothing;

create type public.targeting_profile_type as enum ('icp', 'persona');
create type public.targeting_lifecycle_status as enum (
  'inactive',
  'active',
  'archived'
);
create type public.targeting_version_status as enum ('draft', 'validated');
create type public.targeting_version_origin as enum (
  'manual',
  'ai_proposal',
  'duplicate'
);

create table public.targeting_profiles (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  profile_type public.targeting_profile_type not null,
  name text not null,
  lifecycle_status public.targeting_lifecycle_status not null default 'inactive',
  created_by uuid not null,
  activated_by uuid,
  activated_at timestamptz,
  archived_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_targeting_profiles primary key (id),
  constraint uq_targeting_profiles__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_targeting_profiles__agency_id_client_id
    foreign key (agency_id, client_id)
    references public.clients (agency_id, id)
    on delete restrict,
  constraint fk_targeting_profiles__created_by
    foreign key (created_by) references public.profiles (id) on delete restrict,
  constraint fk_targeting_profiles__activated_by
    foreign key (activated_by) references public.profiles (id) on delete restrict,
  constraint fk_targeting_profiles__archived_by
    foreign key (archived_by) references public.profiles (id) on delete restrict,
  constraint ck_targeting_profiles__name
    check (char_length(btrim(name)) between 1 and 160),
  constraint ck_targeting_profiles__lifecycle_metadata check (
    (
      lifecycle_status = 'inactive'
      and archived_by is null
      and archived_at is null
    )
    or (
      lifecycle_status = 'active'
      and activated_by is not null
      and activated_at is not null
      and archived_by is null
      and archived_at is null
    )
    or (
      lifecycle_status = 'archived'
      and archived_by is not null
      and archived_at is not null
    )
  )
);

create index idx_targeting_profiles__client_type_status_updated
  on public.targeting_profiles (
    agency_id,
    client_id,
    profile_type,
    lifecycle_status,
    updated_at desc
  );

comment on table public.targeting_profiles is
  'Client-scoped ICP or persona aggregate with lifecycle independent from version validation.';

create table public.targeting_versions (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  profile_id uuid not null,
  version_number integer not null,
  status public.targeting_version_status not null default 'draft',
  origin public.targeting_version_origin not null default 'manual',
  content jsonb not null,
  source_version_id uuid,
  ai_execution_id uuid,
  ai_model_id text,
  ai_skill_id text,
  ai_skill_version text,
  ai_prompt_version text,
  input_tokens integer,
  output_tokens integer,
  technical_cost_microusd bigint,
  pricing_version text,
  created_by uuid not null,
  updated_by uuid not null,
  validated_by uuid,
  validated_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_targeting_versions primary key (id),
  constraint uq_targeting_versions__profile_version
    unique (profile_id, version_number),
  constraint uq_targeting_versions__agency_id_client_id_id
    unique (agency_id, client_id, id),
  constraint fk_targeting_versions__profile
    foreign key (agency_id, client_id, profile_id)
    references public.targeting_profiles (agency_id, client_id, id)
    on delete cascade,
  constraint fk_targeting_versions__source
    foreign key (agency_id, client_id, source_version_id)
    references public.targeting_versions (agency_id, client_id, id)
    on delete restrict,
  constraint fk_targeting_versions__created_by
    foreign key (created_by) references public.profiles (id) on delete restrict,
  constraint fk_targeting_versions__updated_by
    foreign key (updated_by) references public.profiles (id) on delete restrict,
  constraint fk_targeting_versions__validated_by
    foreign key (validated_by) references public.profiles (id) on delete restrict,
  constraint ck_targeting_versions__version_number
    check (version_number > 0),
  constraint ck_targeting_versions__content_object
    check (jsonb_typeof(content) = 'object'),
  constraint ck_targeting_versions__content_size
    check (octet_length(content::text) <= 200000),
  constraint ck_targeting_versions__validation_state check (
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
  ),
  constraint ck_targeting_versions__token_usage check (
    coalesce(input_tokens, 0) >= 0
    and coalesce(output_tokens, 0) >= 0
    and coalesce(technical_cost_microusd, 0) >= 0
  ),
  constraint ck_targeting_versions__ai_provenance check (
    (
      origin = 'ai_proposal'
      and ai_execution_id is not null
      and nullif(btrim(ai_model_id), '') is not null
      and ai_skill_id = 'mom-test'
      and nullif(btrim(ai_skill_version), '') is not null
      and nullif(btrim(ai_prompt_version), '') is not null
      and input_tokens is not null
      and output_tokens is not null
      and technical_cost_microusd is not null
      and nullif(btrim(pricing_version), '') is not null
    )
    or (
      origin <> 'ai_proposal'
      and ai_execution_id is null
      and ai_model_id is null
      and ai_skill_id is null
      and ai_skill_version is null
      and ai_prompt_version is null
      and input_tokens is null
      and output_tokens is null
      and technical_cost_microusd is null
      and pricing_version is null
    )
  )
);

create unique index uq_targeting_versions__single_draft
  on public.targeting_versions (profile_id)
  where status = 'draft';

create index idx_targeting_versions__client_profile_version
  on public.targeting_versions (
    agency_id,
    client_id,
    profile_id,
    version_number desc
  );

comment on table public.targeting_versions is
  'Immutable-after-validation ICP/persona snapshots with manual, duplicate, or AI proposal provenance.';

create trigger trg_targeting_profiles__set_updated_at
before update on public.targeting_profiles
for each row execute function private.set_updated_at();

create trigger trg_targeting_versions__set_updated_at
before update on public.targeting_versions
for each row execute function private.set_updated_at();

create or replace function private.empty_targeting_content(
  requested_profile_type public.targeting_profile_type
)
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select case requested_profile_type
    when 'icp' then jsonb_build_object(
      'rationale', '[]'::jsonb,
      'industries', '[]'::jsonb,
      'countries', '[]'::jsonb,
      'companySizes', '[]'::jsonb,
      'employeeCount', jsonb_build_object('min', null, 'max', null),
      'annualRevenue', jsonb_build_object(
        'min', null,
        'max', null,
        'currencyCode', 'EUR'
      ),
      'technologies', '[]'::jsonb,
      'maturityLevels', '[]'::jsonb,
      'budget', jsonb_build_object(
        'min', null,
        'max', null,
        'currencyCode', 'EUR'
      ),
      'problems', '[]'::jsonb,
      'intentSignals', '[]'::jsonb,
      'exclusions', '[]'::jsonb,
      'scoringWeights', '[]'::jsonb,
      'assumptions', '[]'::jsonb,
      'missingEvidence', '[]'::jsonb
    )
    else jsonb_build_object(
      'rationale', '[]'::jsonb,
      'jobTitles', '[]'::jsonb,
      'departments', '[]'::jsonb,
      'seniorityLevels', '[]'::jsonb,
      'responsibilities', '[]'::jsonb,
      'goals', '[]'::jsonb,
      'problems', '[]'::jsonb,
      'objections', '[]'::jsonb,
      'decisionPower', 'unknown',
      'buyingRoles', '[]'::jsonb,
      'preferredChannels', '[]'::jsonb,
      'assumptions', '[]'::jsonb,
      'missingEvidence', '[]'::jsonb
    )
  end;
$$;

create or replace function private.is_bounded_targeting_text_array(
  requested_value jsonb,
  requested_max_items integer,
  requested_max_length integer
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select
    jsonb_typeof(requested_value) = 'array'
    and jsonb_array_length(requested_value) <= requested_max_items
    and not exists (
      select 1
      from jsonb_array_elements(requested_value) as item(value)
      where jsonb_typeof(item.value) <> 'string'
        or char_length(btrim(item.value #>> '{}')) not between 1
          and requested_max_length
    );
$$;

create or replace function private.is_valid_targeting_range(
  requested_value jsonb,
  requested_integer_only boolean,
  requested_requires_currency boolean
)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  minimum_value numeric;
  maximum_value numeric;
  expected_key_count integer := case
    when requested_requires_currency then 3
    else 2
  end;
begin
  if jsonb_typeof(requested_value) <> 'object'
     or (
       select count(*)
       from jsonb_object_keys(requested_value)
     ) <> expected_key_count
     or not (requested_value ? 'min')
     or not (requested_value ? 'max') then
    return false;
  end if;

  if requested_requires_currency
     and (
       not (requested_value ? 'currencyCode')
       or jsonb_typeof(requested_value -> 'currencyCode') <> 'string'
       or requested_value ->> 'currencyCode' !~ '^([A-Z]{3})?$'
     ) then
    return false;
  end if;

  if jsonb_typeof(requested_value -> 'min') not in ('number', 'null')
     or jsonb_typeof(requested_value -> 'max') not in ('number', 'null') then
    return false;
  end if;

  minimum_value := case
    when jsonb_typeof(requested_value -> 'min') = 'number'
      then (requested_value ->> 'min')::numeric
    else null
  end;
  maximum_value := case
    when jsonb_typeof(requested_value -> 'max') = 'number'
      then (requested_value ->> 'max')::numeric
    else null
  end;

  if coalesce(minimum_value, 0) < 0
     or coalesce(maximum_value, 0) < 0
     or coalesce(minimum_value, 0) > 1000000000000000
     or coalesce(maximum_value, 0) > 1000000000000000
     or (
       minimum_value is not null
       and maximum_value is not null
       and minimum_value > maximum_value
     )
     or (
       requested_integer_only
       and (
         minimum_value <> trunc(minimum_value)
         or maximum_value <> trunc(maximum_value)
       )
     )
     or (
       requested_requires_currency
       and (minimum_value is not null or maximum_value is not null)
       and requested_value ->> 'currencyCode' !~ '^[A-Z]{3}$'
     ) then
    return false;
  end if;

  return true;
end;
$$;

create or replace function private.is_valid_targeting_content(
  requested_content jsonb,
  requested_profile_type public.targeting_profile_type
)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  scoring_item jsonb;
  scoring_criterion text;
  seen_scoring_criteria text[] := array[]::text[];
  icp_array_keys constant text[] := array[
    'rationale',
    'industries',
    'countries',
    'companySizes',
    'technologies',
    'maturityLevels',
    'problems',
    'intentSignals',
    'exclusions',
    'assumptions',
    'missingEvidence'
  ];
  persona_array_keys constant text[] := array[
    'rationale',
    'jobTitles',
    'departments',
    'seniorityLevels',
    'responsibilities',
    'goals',
    'problems',
    'objections',
    'buyingRoles',
    'preferredChannels',
    'assumptions',
    'missingEvidence'
  ];
  array_key text;
begin
  if jsonb_typeof(requested_content) <> 'object'
     or octet_length(requested_content::text) > 200000 then
    return false;
  end if;

  if requested_profile_type = 'icp' then
    if (
      select count(*)
      from jsonb_object_keys(requested_content)
    ) <> 15
       or not (
         requested_content ?& array[
           'rationale',
           'industries',
           'countries',
           'companySizes',
           'employeeCount',
           'annualRevenue',
           'technologies',
           'maturityLevels',
           'budget',
           'problems',
           'intentSignals',
           'exclusions',
           'scoringWeights',
           'assumptions',
           'missingEvidence'
         ]
       )
       or not private.is_valid_targeting_range(
         requested_content -> 'employeeCount',
         true,
         false
       )
       or not private.is_valid_targeting_range(
         requested_content -> 'annualRevenue',
         false,
         true
       )
       or not private.is_valid_targeting_range(
         requested_content -> 'budget',
         false,
         true
       ) then
      return false;
    end if;

    foreach array_key in array icp_array_keys
    loop
      if not private.is_bounded_targeting_text_array(
        requested_content -> array_key,
        100,
        500
      ) then
        return false;
      end if;
    end loop;

    if jsonb_typeof(requested_content -> 'scoringWeights') <> 'array'
       or jsonb_array_length(requested_content -> 'scoringWeights') > 10 then
      return false;
    end if;

    for scoring_item in
      select value
      from jsonb_array_elements(requested_content -> 'scoringWeights')
    loop
      scoring_criterion := scoring_item ->> 'criterion';
      if jsonb_typeof(scoring_item) <> 'object'
         or (
           select count(*)
           from jsonb_object_keys(scoring_item)
         ) <> 2
         or jsonb_typeof(scoring_item -> 'criterion') <> 'string'
         or jsonb_typeof(scoring_item -> 'weight') <> 'number'
         or scoring_criterion not in (
           'industry',
           'country',
           'company_size',
           'employee_count',
           'annual_revenue',
           'technology',
           'maturity',
           'budget',
           'problem',
           'intent_signal'
         )
         or (scoring_item ->> 'weight')::numeric
           <> trunc((scoring_item ->> 'weight')::numeric)
         or (scoring_item ->> 'weight')::integer not between 0 and 100
         or scoring_criterion = any(seen_scoring_criteria) then
        return false;
      end if;
      seen_scoring_criteria := array_append(
        seen_scoring_criteria,
        scoring_criterion
      );
    end loop;

    return true;
  end if;

  if (
    select count(*)
    from jsonb_object_keys(requested_content)
  ) <> 13
     or not (
       requested_content ?& array[
         'rationale',
         'jobTitles',
         'departments',
         'seniorityLevels',
         'responsibilities',
         'goals',
         'problems',
         'objections',
         'decisionPower',
         'buyingRoles',
         'preferredChannels',
         'assumptions',
         'missingEvidence'
       ]
     )
     or jsonb_typeof(requested_content -> 'decisionPower') <> 'string'
     or requested_content ->> 'decisionPower' not in (
       'low',
       'medium',
       'high',
       'unknown'
     ) then
    return false;
  end if;

  foreach array_key in array persona_array_keys
  loop
    if not private.is_bounded_targeting_text_array(
      requested_content -> array_key,
      100,
      500
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

create or replace function private.is_targeting_ready_for_validation(
  requested_content jsonb,
  requested_profile_type public.targeting_profile_type
)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select private.is_valid_targeting_content(
    requested_content,
    requested_profile_type
  )
  and case requested_profile_type
    when 'icp' then
      (
        jsonb_array_length(requested_content -> 'industries') > 0
        or jsonb_array_length(requested_content -> 'countries') > 0
        or jsonb_array_length(requested_content -> 'companySizes') > 0
        or jsonb_array_length(requested_content -> 'technologies') > 0
      )
      and jsonb_array_length(requested_content -> 'problems') > 0
      and jsonb_array_length(requested_content -> 'scoringWeights') > 0
      and (
        select coalesce(sum((item.value ->> 'weight')::integer), 0)
        from jsonb_array_elements(
          requested_content -> 'scoringWeights'
        ) as item(value)
      ) = 100
    else
      jsonb_array_length(requested_content -> 'jobTitles') > 0
      and (
        jsonb_array_length(requested_content -> 'goals') > 0
        or jsonb_array_length(requested_content -> 'problems') > 0
      )
      and jsonb_array_length(requested_content -> 'buyingRoles') > 0
  end;
$$;

create or replace function private.prevent_validated_targeting_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'validated' then
    raise exception 'validated targeting versions are immutable'
      using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger trg_targeting_versions__protect_validated
before update or delete on public.targeting_versions
for each row execute function private.prevent_validated_targeting_mutation();

alter table public.targeting_profiles enable row level security;
alter table public.targeting_versions enable row level security;

revoke all on table public.targeting_profiles
from public, anon, authenticated;
revoke all on table public.targeting_versions
from public, anon, authenticated;

grant select on table public.targeting_profiles to authenticated;
grant select on table public.targeting_versions to authenticated;

grant select, insert, update, delete
on table public.targeting_profiles to service_role;
grant select, insert, update, delete
on table public.targeting_versions to service_role;

create policy targeting_profiles_select_authorized
on public.targeting_profiles
for select
to authenticated
using (
  (select private.has_permission(
    targeting_profiles.agency_id,
    targeting_profiles.client_id,
    'targeting.read'
  ))
);

create policy targeting_versions_select_authorized
on public.targeting_versions
for select
to authenticated
using (
  (select private.has_permission(
    targeting_versions.agency_id,
    targeting_versions.client_id,
    'targeting.read'
  ))
);

create or replace function private.assert_targeting_access(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_permission_key text
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

  if requested_permission_key not in (
    'targeting.read',
    'targeting.write',
    'targeting.validate',
    'targeting.propose'
  ) then
    raise exception 'unsupported targeting permission'
      using errcode = '22023';
  end if;

  if not private.has_permission(
    requested_agency_id,
    requested_client_id,
    requested_permission_key
  ) then
    raise exception '% permission required', requested_permission_key
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

create or replace function private.create_targeting_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_name text,
  requested_source_profile_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  source_version public.targeting_versions%rowtype;
  selected_content jsonb;
  selected_origin public.targeting_version_origin;
  created_profile_id uuid;
  created_version_id uuid;
begin
  actor_id := private.assert_targeting_access(
    requested_agency_id,
    requested_client_id,
    'targeting.write'
  );

  if nullif(btrim(requested_name), '') is null then
    raise exception 'targeting profile name is required'
      using errcode = '23514';
  end if;

  if requested_source_profile_id is null then
    selected_content := private.empty_targeting_content(
      requested_profile_type
    );
    selected_origin := 'manual';
  else
    select version.*
    into source_version
    from public.targeting_profiles as profile
    join public.targeting_versions as version
      on version.profile_id = profile.id
    where profile.agency_id = requested_agency_id
      and profile.client_id = requested_client_id
      and profile.id = requested_source_profile_id
      and profile.profile_type = requested_profile_type
      and profile.lifecycle_status <> 'archived'
    order by version.version_number desc
    limit 1;

    if not found then
      raise exception 'authorized source targeting profile not found'
        using errcode = '42501';
    end if;

    selected_content := source_version.content;
    selected_origin := 'duplicate';
  end if;

  insert into public.targeting_profiles (
    agency_id,
    client_id,
    profile_type,
    name,
    created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    requested_profile_type,
    btrim(requested_name),
    actor_id
  )
  returning id into created_profile_id;

  insert into public.targeting_versions (
    agency_id,
    client_id,
    profile_id,
    version_number,
    content,
    origin,
    source_version_id,
    created_by,
    updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_profile_id,
    1,
    selected_content,
    selected_origin,
    source_version.id,
    actor_id,
    actor_id
  )
  returning id into created_version_id;

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
    requested_profile_type::text || '.created',
    'targeting_profile',
    created_profile_id::text,
    jsonb_build_object(
      'version_id', created_version_id,
      'origin', selected_origin,
      'source_profile_id', requested_source_profile_id
    )
  );

  return created_version_id;
end;
$$;

create or replace function public.create_targeting_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_name text,
  requested_source_profile_id uuid default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_targeting_draft(
    requested_agency_id,
    requested_client_id,
    requested_profile_type,
    requested_name,
    requested_source_profile_id
  );
$$;

create or replace function private.create_targeting_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_id uuid,
  requested_profile_type public.targeting_profile_type
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  existing_draft_id uuid;
  latest_version public.targeting_versions%rowtype;
  created_version_id uuid;
begin
  actor_id := private.assert_targeting_access(
    requested_agency_id,
    requested_client_id,
    'targeting.write'
  );

  if not exists (
    select 1
    from public.targeting_profiles as profile
    where profile.agency_id = requested_agency_id
      and profile.client_id = requested_client_id
      and profile.id = requested_profile_id
      and profile.profile_type = requested_profile_type
      and profile.lifecycle_status <> 'archived'
  ) then
    raise exception 'authorized targeting profile not found'
      using errcode = '42501';
  end if;

  select version.id
  into existing_draft_id
  from public.targeting_versions as version
  where version.profile_id = requested_profile_id
    and version.status = 'draft';

  if existing_draft_id is not null then
    return existing_draft_id;
  end if;

  select version.*
  into latest_version
  from public.targeting_versions as version
  where version.agency_id = requested_agency_id
    and version.client_id = requested_client_id
    and version.profile_id = requested_profile_id
  order by version.version_number desc
  limit 1
  for update;

  if not found then
    raise exception 'targeting version history not found'
      using errcode = '55000';
  end if;

  insert into public.targeting_versions (
    agency_id,
    client_id,
    profile_id,
    version_number,
    content,
    origin,
    source_version_id,
    created_by,
    updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    requested_profile_id,
    latest_version.version_number + 1,
    latest_version.content,
    'manual',
    latest_version.id,
    actor_id,
    actor_id
  )
  returning id into created_version_id;

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
    requested_profile_type::text || '.version_created',
    'targeting_version',
    created_version_id::text,
    jsonb_build_object(
      'profile_id', requested_profile_id,
      'source_version_id', latest_version.id,
      'version_number', latest_version.version_number + 1
    )
  );

  return created_version_id;
end;
$$;

create or replace function public.create_targeting_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_id uuid,
  requested_profile_type public.targeting_profile_type
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_targeting_version(
    requested_agency_id,
    requested_client_id,
    requested_profile_id,
    requested_profile_type
  );
$$;

create or replace function private.save_targeting_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_profile_type public.targeting_profile_type,
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
  target_version public.targeting_versions%rowtype;
  target_profile public.targeting_profiles%rowtype;
begin
  actor_id := private.assert_targeting_access(
    requested_agency_id,
    requested_client_id,
    'targeting.write'
  );

  select version.*
  into target_version
  from public.targeting_versions as version
  where version.agency_id = requested_agency_id
    and version.client_id = requested_client_id
    and version.id = requested_version_id
    and version.status = 'draft'
  for update;

  if not found then
    raise exception 'authorized targeting draft not found'
      using errcode = '42501';
  end if;

  select profile.*
  into target_profile
  from public.targeting_profiles as profile
  where profile.agency_id = requested_agency_id
    and profile.client_id = requested_client_id
    and profile.id = target_version.profile_id
    and profile.profile_type = requested_profile_type
    and profile.lifecycle_status <> 'archived';

  if not found then
    raise exception 'targeting profile type or lifecycle mismatch'
      using errcode = '23514';
  end if;

  if nullif(btrim(requested_name), '') is null
     or not private.is_valid_targeting_content(
       requested_content,
       requested_profile_type
     ) then
    raise exception 'invalid structured targeting content'
      using errcode = '23514';
  end if;

  update public.targeting_profiles
  set name = btrim(requested_name)
  where id = target_profile.id;

  update public.targeting_versions
  set
    content = requested_content,
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
    requested_profile_type::text || '.draft_saved',
    'targeting_version',
    target_version.id::text,
    jsonb_build_object(
      'profile_id', target_profile.id,
      'version_number', target_version.version_number,
      'origin', target_version.origin
    )
  );

  return target_version.id;
end;
$$;

create or replace function public.save_targeting_draft(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_name text,
  requested_content jsonb
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.save_targeting_draft(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    requested_profile_type,
    requested_name,
    requested_content
  );
$$;

create or replace function private.validate_targeting_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_profile_type public.targeting_profile_type
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_version public.targeting_versions%rowtype;
  target_profile public.targeting_profiles%rowtype;
begin
  actor_id := private.assert_targeting_access(
    requested_agency_id,
    requested_client_id,
    'targeting.validate'
  );

  select version.*
  into target_version
  from public.targeting_versions as version
  where version.agency_id = requested_agency_id
    and version.client_id = requested_client_id
    and version.id = requested_version_id
    and version.status = 'draft'
  for update;

  if not found then
    raise exception 'authorized targeting draft not found'
      using errcode = '42501';
  end if;

  select profile.*
  into target_profile
  from public.targeting_profiles as profile
  where profile.agency_id = requested_agency_id
    and profile.client_id = requested_client_id
    and profile.id = target_version.profile_id
    and profile.profile_type = requested_profile_type
    and profile.lifecycle_status <> 'archived'
  for update;

  if not found then
    raise exception 'targeting profile type or lifecycle mismatch'
      using errcode = '23514';
  end if;

  if not private.is_targeting_ready_for_validation(
    target_version.content,
    requested_profile_type
  ) then
    raise exception 'targeting draft is incomplete or scoring weights do not total 100'
      using errcode = '23514';
  end if;

  update public.targeting_versions
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
    requested_profile_type::text || '.validated',
    'targeting_version',
    target_version.id::text,
    jsonb_build_object(
      'profile_id', target_profile.id,
      'version_number', target_version.version_number,
      'origin', target_version.origin
    )
  );

  return target_version.id;
end;
$$;

create or replace function public.validate_targeting_version(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_profile_type public.targeting_profile_type
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.validate_targeting_version(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    requested_profile_type
  );
$$;

create or replace function private.set_targeting_lifecycle(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_lifecycle_status public.targeting_lifecycle_status
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  target_profile public.targeting_profiles%rowtype;
  latest_version public.targeting_versions%rowtype;
  required_permission text;
begin
  if requested_lifecycle_status not in ('active', 'archived') then
    raise exception 'unsupported targeting lifecycle transition'
      using errcode = '22023';
  end if;

  required_permission := case requested_lifecycle_status
    when 'active' then 'targeting.validate'
    else 'targeting.write'
  end;
  actor_id := private.assert_targeting_access(
    requested_agency_id,
    requested_client_id,
    required_permission
  );

  select profile.*
  into target_profile
  from public.targeting_profiles as profile
  where profile.agency_id = requested_agency_id
    and profile.client_id = requested_client_id
    and profile.id = requested_profile_id
    and profile.profile_type = requested_profile_type
    and profile.lifecycle_status <> 'archived'
  for update;

  if not found then
    raise exception 'authorized targeting profile not found'
      using errcode = '42501';
  end if;

  if requested_lifecycle_status = 'active' then
    if exists (
      select 1
      from public.targeting_versions as version
      where version.profile_id = target_profile.id
        and version.status = 'draft'
    ) then
      raise exception 'validate or discard the draft before activation'
        using errcode = '23514';
    end if;

    select version.*
    into latest_version
    from public.targeting_versions as version
    where version.agency_id = requested_agency_id
      and version.client_id = requested_client_id
      and version.profile_id = target_profile.id
    order by version.version_number desc
    limit 1;

    if not found or latest_version.status <> 'validated' then
      raise exception 'the latest targeting version must be validated'
        using errcode = '23514';
    end if;

    update public.targeting_profiles
    set
      lifecycle_status = 'active',
      activated_by = actor_id,
      activated_at = statement_timestamp(),
      archived_by = null,
      archived_at = null
    where id = target_profile.id;
  else
    update public.targeting_profiles
    set
      lifecycle_status = 'archived',
      archived_by = actor_id,
      archived_at = statement_timestamp()
    where id = target_profile.id;
  end if;

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
    requested_profile_type::text || case requested_lifecycle_status
      when 'active' then '.activated'
      else '.archived'
    end,
    'targeting_profile',
    target_profile.id::text,
    jsonb_build_object(
      'previous_status', target_profile.lifecycle_status,
      'new_status', requested_lifecycle_status
    )
  );

  return target_profile.id;
end;
$$;

create or replace function public.set_targeting_lifecycle(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_lifecycle_status public.targeting_lifecycle_status
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.set_targeting_lifecycle(
    requested_agency_id,
    requested_client_id,
    requested_profile_id,
    requested_profile_type,
    requested_lifecycle_status
  );
$$;

create or replace function private.create_ai_targeting_proposal(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_name text,
  requested_content jsonb,
  requested_execution_id uuid,
  requested_model_id text,
  requested_skill_version text,
  requested_prompt_version text,
  requested_input_tokens integer,
  requested_output_tokens integer,
  requested_cost_microusd bigint,
  requested_pricing_version text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  created_profile_id uuid;
  created_version_id uuid;
begin
  actor_id := private.assert_targeting_access(
    requested_agency_id,
    requested_client_id,
    'targeting.propose'
  );

  if nullif(btrim(requested_name), '') is null
     or char_length(btrim(requested_name)) > 160
     or requested_execution_id is null
     or nullif(btrim(requested_model_id), '') is null
     or nullif(btrim(requested_skill_version), '') is null
     or nullif(btrim(requested_prompt_version), '') is null
     or nullif(btrim(requested_pricing_version), '') is null
     or requested_input_tokens < 0
     or requested_output_tokens < 0
     or requested_cost_microusd < 0
     or not private.is_valid_targeting_content(
       requested_content,
       requested_profile_type
     ) then
    raise exception 'invalid structured AI targeting proposal'
      using errcode = '23514';
  end if;

  insert into public.targeting_profiles (
    agency_id,
    client_id,
    profile_type,
    name,
    created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    requested_profile_type,
    btrim(requested_name),
    actor_id
  )
  returning id into created_profile_id;

  insert into public.targeting_versions (
    agency_id,
    client_id,
    profile_id,
    version_number,
    content,
    origin,
    ai_execution_id,
    ai_model_id,
    ai_skill_id,
    ai_skill_version,
    ai_prompt_version,
    input_tokens,
    output_tokens,
    technical_cost_microusd,
    pricing_version,
    created_by,
    updated_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_profile_id,
    1,
    requested_content,
    'ai_proposal',
    requested_execution_id,
    btrim(requested_model_id),
    'mom-test',
    btrim(requested_skill_version),
    btrim(requested_prompt_version),
    requested_input_tokens,
    requested_output_tokens,
    requested_cost_microusd,
    btrim(requested_pricing_version),
    actor_id,
    actor_id
  )
  returning id into created_version_id;

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
    requested_profile_type::text || '.ai_proposed',
    'targeting_profile',
    created_profile_id::text,
    jsonb_build_object(
      'version_id', created_version_id,
      'execution_id', requested_execution_id,
      'model_id', btrim(requested_model_id),
      'skill_name', 'mom-test',
      'skill_version', btrim(requested_skill_version),
      'prompt_version', btrim(requested_prompt_version),
      'input_tokens', requested_input_tokens,
      'output_tokens', requested_output_tokens,
      'cost_microusd', requested_cost_microusd,
      'pricing_version', btrim(requested_pricing_version)
    )
  );

  return created_version_id;
end;
$$;

create or replace function public.create_ai_targeting_proposal(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_type public.targeting_profile_type,
  requested_name text,
  requested_content jsonb,
  requested_execution_id uuid,
  requested_model_id text,
  requested_skill_version text,
  requested_prompt_version text,
  requested_input_tokens integer,
  requested_output_tokens integer,
  requested_cost_microusd bigint,
  requested_pricing_version text
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_ai_targeting_proposal(
    requested_agency_id,
    requested_client_id,
    requested_profile_type,
    requested_name,
    requested_content,
    requested_execution_id,
    requested_model_id,
    requested_skill_version,
    requested_prompt_version,
    requested_input_tokens,
    requested_output_tokens,
    requested_cost_microusd,
    requested_pricing_version
  );
$$;

revoke all on function private.assign_targeting_permissions_for_role()
from public, anon, authenticated;
revoke all on function private.empty_targeting_content(
  public.targeting_profile_type
) from public, anon, authenticated;
revoke all on function private.is_bounded_targeting_text_array(
  jsonb,
  integer,
  integer
) from public, anon, authenticated;
revoke all on function private.is_valid_targeting_range(
  jsonb,
  boolean,
  boolean
) from public, anon, authenticated;
revoke all on function private.is_valid_targeting_content(
  jsonb,
  public.targeting_profile_type
) from public, anon, authenticated;
revoke all on function private.is_targeting_ready_for_validation(
  jsonb,
  public.targeting_profile_type
) from public, anon, authenticated;
revoke all on function private.prevent_validated_targeting_mutation()
from public, anon, authenticated;
revoke all on function private.assert_targeting_access(uuid, uuid, text)
from public, anon, authenticated;
revoke all on function private.create_targeting_draft(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  uuid
) from public, anon, authenticated;
revoke all on function private.create_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) from public, anon, authenticated;
revoke all on function private.save_targeting_draft(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb
) from public, anon, authenticated;
revoke all on function private.validate_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) from public, anon, authenticated;
revoke all on function private.set_targeting_lifecycle(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  public.targeting_lifecycle_status
) from public, anon, authenticated;
revoke all on function private.create_ai_targeting_proposal(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  bigint,
  text
) from public, anon, authenticated;

revoke all on function public.create_targeting_draft(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  uuid
) from public, anon;
revoke all on function public.create_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) from public, anon;
revoke all on function public.save_targeting_draft(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb
) from public, anon;
revoke all on function public.validate_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) from public, anon;
revoke all on function public.set_targeting_lifecycle(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  public.targeting_lifecycle_status
) from public, anon;
revoke all on function public.create_ai_targeting_proposal(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  bigint,
  text
) from public, anon;

grant execute on function private.create_targeting_draft(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  uuid
) to authenticated;
grant execute on function private.create_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) to authenticated;
grant execute on function private.save_targeting_draft(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb
) to authenticated;
grant execute on function private.validate_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) to authenticated;
grant execute on function private.set_targeting_lifecycle(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  public.targeting_lifecycle_status
) to authenticated;
grant execute on function private.create_ai_targeting_proposal(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  bigint,
  text
) to authenticated;

grant execute on function public.create_targeting_draft(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  uuid
) to authenticated;
grant execute on function public.create_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) to authenticated;
grant execute on function public.save_targeting_draft(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb
) to authenticated;
grant execute on function public.validate_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) to authenticated;
grant execute on function public.set_targeting_lifecycle(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  public.targeting_lifecycle_status
) to authenticated;
grant execute on function public.create_ai_targeting_proposal(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  bigint,
  text
) to authenticated;

comment on function public.create_targeting_draft(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  uuid
) is 'Creates a manual ICP/persona draft or duplicates an authorized profile.';
comment on function public.create_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) is 'Creates the next editable version from the latest authorized profile snapshot.';
comment on function public.save_targeting_draft(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb
) is 'Validates and saves an authorized structured ICP/persona draft.';
comment on function public.validate_targeting_version(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type
) is 'Records an explicit human validation after checking profile completeness.';
comment on function public.set_targeting_lifecycle(
  uuid,
  uuid,
  uuid,
  public.targeting_profile_type,
  public.targeting_lifecycle_status
) is 'Activates a latest validated targeting profile or archives an authorized profile.';
comment on function public.create_ai_targeting_proposal(
  uuid,
  uuid,
  public.targeting_profile_type,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  bigint,
  text
) is 'Persists a structured, inactive AI proposal with model, prompt, skill, usage, and cost provenance.';
