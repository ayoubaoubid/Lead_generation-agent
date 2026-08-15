create type public.campaign_message_status as enum (
  'draft',
  'quality_review_pending',
  'compliance_review_pending',
  'human_review_pending',
  'approved',
  'rejected'
);

create type public.message_version_origin as enum (
  'ai_generated',
  'human_edit',
  'regenerated'
);

create type public.message_review_type as enum (
  'quality',
  'compliance',
  'human'
);

create type public.message_review_decision as enum (
  'approve',
  'revise',
  'reject'
);

create type public.message_format as enum (
  'cold_email',
  'follow_up',
  'linkedin_message'
);

alter table public.campaign_sequence_steps
add constraint uq_campaign_sequence_steps__tenant_id
unique (agency_id, client_id, id);

create table public.campaign_messages (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  campaign_id uuid not null,
  campaign_prospect_id uuid not null,
  sequence_step_id uuid not null,
  current_version_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_messages primary key (id),
  constraint uq_campaign_messages__tenant_id unique (agency_id, client_id, id),
  constraint uq_campaign_messages__prospect_step
    unique (campaign_prospect_id, sequence_step_id),
  constraint fk_campaign_messages__campaign foreign key (
    agency_id, client_id, campaign_id
  ) references public.campaigns (agency_id, client_id, id) on delete cascade,
  constraint fk_campaign_messages__prospect foreign key (
    agency_id, client_id, campaign_prospect_id
  ) references public.campaign_prospects (agency_id, client_id, id)
    on delete cascade,
  constraint fk_campaign_messages__step foreign key (
    agency_id, client_id, sequence_step_id
  ) references public.campaign_sequence_steps (agency_id, client_id, id)
    on delete restrict,
  constraint fk_campaign_messages__created_by foreign key (created_by)
    references public.profiles (id) on delete restrict
);

create table public.campaign_message_versions (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  message_id uuid not null,
  version_number integer not null,
  status public.campaign_message_status not null default 'draft',
  origin public.message_version_origin not null,
  format public.message_format not null,
  subject text,
  body text not null,
  call_to_action text not null,
  word_count integer not null,
  main_idea text not null,
  grounded_statements jsonb not null default '[]'::jsonb,
  missing_evidence jsonb not null default '[]'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  input_fingerprint text not null,
  skill_versions jsonb not null,
  ai_execution_id uuid,
  generation_cost_microusd bigint,
  generation_tokens integer,
  submitted_for_review_by uuid,
  submitted_for_review_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_message_versions primary key (id),
  constraint uq_campaign_message_versions__tenant_id
    unique (agency_id, client_id, id),
  constraint uq_campaign_message_versions__message_version
    unique (message_id, version_number),
  constraint fk_campaign_message_versions__message foreign key (
    agency_id, client_id, message_id
  ) references public.campaign_messages (agency_id, client_id, id)
    on delete cascade,
  constraint fk_campaign_message_versions__submitted_by
    foreign key (submitted_for_review_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaign_message_versions__approved_by
    foreign key (approved_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaign_message_versions__rejected_by
    foreign key (rejected_by)
    references public.profiles (id) on delete restrict,
  constraint fk_campaign_message_versions__created_by
    foreign key (created_by)
    references public.profiles (id) on delete restrict,
  constraint ck_campaign_message_versions__version
    check (version_number > 0),
  constraint ck_campaign_message_versions__subject
    check (subject is null or char_length(btrim(subject)) between 1 and 200),
  constraint ck_campaign_message_versions__body
    check (char_length(btrim(body)) between 1 and 10000),
  constraint ck_campaign_message_versions__cta
    check (char_length(btrim(call_to_action)) between 1 and 500),
  constraint ck_campaign_message_versions__main_idea
    check (char_length(btrim(main_idea)) between 1 and 1000),
  constraint ck_campaign_message_versions__word_count
    check (
      word_count > 0
      and (
        format <> 'cold_email'
        or word_count between 50 and 120
      )
    ),
  constraint ck_campaign_message_versions__grounding
    check (
      jsonb_typeof(grounded_statements) = 'array'
      and jsonb_typeof(missing_evidence) = 'array'
      and jsonb_typeof(input_snapshot) = 'object'
      and jsonb_typeof(skill_versions) = 'object'
    ),
  constraint ck_campaign_message_versions__fingerprint
    check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  constraint ck_campaign_message_versions__cost
    check (
      (generation_cost_microusd is null or generation_cost_microusd >= 0)
      and (generation_tokens is null or generation_tokens >= 0)
    ),
  constraint ck_campaign_message_versions__review_lifecycle
    check (
      (
        status in (
          'draft',
          'quality_review_pending',
          'compliance_review_pending',
          'human_review_pending'
        )
        and approved_by is null and approved_at is null
        and rejected_by is null and rejected_at is null
      )
      or (
        status = 'approved'
        and approved_by is not null and approved_at is not null
        and rejected_by is null and rejected_at is null
      )
      or (
        status = 'rejected'
        and rejected_by is not null and rejected_at is not null
        and approved_by is null and approved_at is null
      )
    )
);

alter table public.campaign_messages
add constraint fk_campaign_messages__current_version foreign key (
  agency_id, client_id, current_version_id
) references public.campaign_message_versions (agency_id, client_id, id)
  on delete restrict;

create table public.campaign_message_reviews (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  message_id uuid not null,
  message_version_id uuid not null,
  review_type public.message_review_type not null,
  decision public.message_review_decision not null,
  issues jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  reviewer_agent_id text,
  reviewer_agent_version text,
  reviewer_skill_id text,
  reviewer_skill_version text,
  reviewer_prompt_version text,
  reviewer_model_id text,
  ai_execution_id uuid,
  reviewed_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_campaign_message_reviews primary key (id),
  constraint uq_campaign_message_reviews__tenant_id
    unique (agency_id, client_id, id),
  constraint uq_campaign_message_reviews__version_type
    unique (message_version_id, review_type),
  constraint fk_campaign_message_reviews__message foreign key (
    agency_id, client_id, message_id
  ) references public.campaign_messages (agency_id, client_id, id)
    on delete cascade,
  constraint fk_campaign_message_reviews__version foreign key (
    agency_id, client_id, message_version_id
  ) references public.campaign_message_versions (agency_id, client_id, id)
    on delete cascade,
  constraint fk_campaign_message_reviews__reviewed_by foreign key (reviewed_by)
    references public.profiles (id) on delete restrict,
  constraint ck_campaign_message_reviews__payload
    check (
      jsonb_typeof(issues) = 'array'
      and jsonb_typeof(scores) = 'object'
    ),
  constraint ck_campaign_message_reviews__reviewer
    check (
      (
        review_type = 'human'
        and reviewed_by is not null
        and reviewer_agent_id is null
        and reviewer_skill_id is null
      )
      or (
        review_type in ('quality', 'compliance')
        and reviewer_agent_id is not null
        and reviewer_agent_version is not null
        and reviewer_skill_id is not null
        and reviewer_skill_version is not null
        and reviewer_prompt_version is not null
      )
    )
);

create index idx_campaign_messages__campaign_updated
  on public.campaign_messages (
    agency_id, client_id, campaign_id, updated_at desc
  );

create index idx_campaign_message_versions__review_queue
  on public.campaign_message_versions (
    agency_id, client_id, status, updated_at
  );

create index idx_campaign_message_reviews__message_created
  on public.campaign_message_reviews (
    agency_id, client_id, message_id, created_at desc
  );

comment on table public.campaign_messages is
  'Stable campaign-prospect-step message aggregate used to compare immutable variants.';
comment on table public.campaign_message_versions is
  'Immutable message variants and edits with grounding, AI trace, cost and explicit human approval lifecycle.';
comment on table public.campaign_message_reviews is
  'Quality, compliance and human review evidence for one exact message version.';

create trigger trg_campaign_messages__set_updated_at
before update on public.campaign_messages
for each row execute function private.set_updated_at();

create trigger trg_campaign_message_versions__set_updated_at
before update on public.campaign_message_versions
for each row execute function private.set_updated_at();

alter table public.campaign_messages enable row level security;
alter table public.campaign_message_versions enable row level security;
alter table public.campaign_message_reviews enable row level security;

create policy campaign_messages_select_authorized
on public.campaign_messages for select to authenticated
using (private.has_permission(agency_id, client_id, 'message.read'));

create policy campaign_message_versions_select_authorized
on public.campaign_message_versions for select to authenticated
using (private.has_permission(agency_id, client_id, 'message.read'));

create policy campaign_message_reviews_select_authorized
on public.campaign_message_reviews for select to authenticated
using (private.has_permission(agency_id, client_id, 'message.read'));

revoke all on
  public.campaign_messages,
  public.campaign_message_versions,
  public.campaign_message_reviews
from anon, authenticated;

grant select on
  public.campaign_messages,
  public.campaign_message_versions,
  public.campaign_message_reviews
to authenticated;

create or replace function private.create_campaign_message_variant(
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
  requested_message_id uuid := nullif(requested_payload ->> 'messageId', '')::uuid;
  requested_campaign_id uuid := (requested_payload ->> 'campaignId')::uuid;
  requested_prospect_id uuid := (requested_payload ->> 'campaignProspectId')::uuid;
  requested_step_id uuid := (requested_payload ->> 'sequenceStepId')::uuid;
  created_message_id uuid;
  created_version_id uuid;
  next_version integer;
  normalized_body text := btrim(requested_payload ->> 'body');
  calculated_word_count integer;
begin
  if actor_id is null
    or not private.has_permission(
      requested_agency_id, requested_client_id, 'message.write'
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Message creation is not authorized.';
  end if;

  if not exists (
    select 1
    from public.campaign_prospects prospects
    where prospects.agency_id = requested_agency_id
      and prospects.client_id = requested_client_id
      and prospects.id = requested_prospect_id
      and prospects.campaign_id = requested_campaign_id
  ) or not exists (
    select 1
    from public.campaign_sequence_steps steps
    join public.campaign_sequences sequences
      on sequences.agency_id = steps.agency_id
      and sequences.client_id = steps.client_id
      and sequences.id = steps.sequence_id
    where steps.agency_id = requested_agency_id
      and steps.client_id = requested_client_id
      and steps.id = requested_step_id
      and sequences.campaign_id = requested_campaign_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'Campaign prospect or sequence step not found in tenant.';
  end if;

  calculated_word_count := cardinality(
    regexp_split_to_array(normalized_body, '\s+')
  );

  if requested_message_id is null then
    insert into public.campaign_messages (
      agency_id, client_id, campaign_id, campaign_prospect_id,
      sequence_step_id, created_by
    )
    values (
      requested_agency_id, requested_client_id, requested_campaign_id,
      requested_prospect_id, requested_step_id, actor_id
    )
    returning id into created_message_id;
    next_version := 1;
  else
    select messages.id into created_message_id
    from public.campaign_messages messages
    where messages.agency_id = requested_agency_id
      and messages.client_id = requested_client_id
      and messages.id = requested_message_id
      and messages.campaign_id = requested_campaign_id
      and messages.campaign_prospect_id = requested_prospect_id
      and messages.sequence_step_id = requested_step_id
    for update;

    if created_message_id is null then
      raise exception using errcode = 'P0002', message = 'Message not found.';
    end if;

    select coalesce(max(version_number), 0) + 1 into next_version
    from public.campaign_message_versions
    where message_id = created_message_id;
  end if;

  insert into public.campaign_message_versions (
    agency_id, client_id, message_id, version_number, origin, format,
    subject, body, call_to_action, word_count, main_idea,
    grounded_statements, missing_evidence, input_snapshot, input_fingerprint,
    skill_versions, ai_execution_id, generation_cost_microusd,
    generation_tokens, created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    created_message_id,
    next_version,
    (requested_payload ->> 'origin')::public.message_version_origin,
    (requested_payload ->> 'format')::public.message_format,
    nullif(btrim(requested_payload ->> 'subject'), ''),
    normalized_body,
    btrim(requested_payload ->> 'callToAction'),
    calculated_word_count,
    btrim(requested_payload ->> 'mainIdea'),
    coalesce(requested_payload -> 'groundedStatements', '[]'::jsonb),
    coalesce(requested_payload -> 'missingEvidence', '[]'::jsonb),
    coalesce(requested_payload -> 'inputSnapshot', '{}'::jsonb),
    encode(
      extensions.digest(
        convert_to(
          coalesce(requested_payload -> 'inputSnapshot', '{}'::jsonb)::text,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    ),
    requested_payload -> 'skillVersions',
    nullif(requested_payload ->> 'aiExecutionId', '')::uuid,
    nullif(requested_payload ->> 'generationCostMicrousd', '')::bigint,
    nullif(requested_payload ->> 'generationTokens', '')::integer,
    actor_id
  )
  returning id into created_version_id;

  update public.campaign_messages
  set current_version_id = created_version_id
  where id = created_message_id;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id,
    metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'message.variant_created', 'campaign_message', created_message_id::text,
    jsonb_build_object(
      'version_id', created_version_id,
      'version_number', next_version,
      'origin', requested_payload ->> 'origin'
    )
  );

  return created_version_id;
end;
$$;

create or replace function private.review_campaign_message(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_review_type public.message_review_type,
  requested_decision public.message_review_decision,
  requested_review jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  current_status public.campaign_message_status;
  current_message_id uuid;
  required_permission text;
  next_status public.campaign_message_status;
begin
  required_permission := case
    when requested_review_type = 'human' then 'message.approve'
    else 'message.write'
  end;

  if actor_id is null
    or not private.has_permission(
      requested_agency_id, requested_client_id, required_permission
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Message review is not authorized.';
  end if;

  select status, message_id into current_status, current_message_id
  from public.campaign_message_versions
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_version_id
  for update;

  if current_status is null then
    raise exception using errcode = 'P0002', message = 'Message version not found.';
  end if;

  if (
    requested_review_type = 'quality'
    and current_status = 'quality_review_pending'
  ) then
    next_status := case requested_decision
      when 'approve'
        then 'compliance_review_pending'::public.campaign_message_status
      when 'revise' then 'draft'::public.campaign_message_status
      else 'rejected'::public.campaign_message_status
    end;
  elsif (
    requested_review_type = 'compliance'
    and current_status = 'compliance_review_pending'
  ) then
    next_status := case requested_decision
      when 'approve'
        then 'human_review_pending'::public.campaign_message_status
      when 'revise' then 'draft'::public.campaign_message_status
      else 'rejected'::public.campaign_message_status
    end;
  elsif (
    requested_review_type = 'human'
    and current_status = 'human_review_pending'
  ) then
    next_status := case requested_decision
      when 'approve' then 'approved'::public.campaign_message_status
      else 'rejected'::public.campaign_message_status
    end;
  else
    raise exception using
      errcode = '55000',
      message = 'Message review order is invalid.';
  end if;

  insert into public.campaign_message_reviews (
    agency_id, client_id, message_id, message_version_id, review_type,
    decision, issues, scores, reviewer_agent_id, reviewer_agent_version,
    reviewer_skill_id, reviewer_skill_version, reviewer_prompt_version,
    reviewer_model_id, ai_execution_id, reviewed_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    current_message_id,
    requested_version_id,
    requested_review_type,
    requested_decision,
    coalesce(requested_review -> 'issues', '[]'::jsonb),
    coalesce(requested_review -> 'scores', '{}'::jsonb),
    case when requested_review_type <> 'human'
      then requested_review ->> 'agentId' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'agentVersion' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'skillId' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'skillVersion' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'promptVersion' end,
    case when requested_review_type <> 'human'
      then requested_review ->> 'modelId' end,
    case when requested_review_type <> 'human'
      then nullif(requested_review ->> 'aiExecutionId', '')::uuid end,
    case when requested_review_type = 'human' then actor_id end
  );

  update public.campaign_message_versions
  set
    status = next_status,
    approved_by = case when next_status = 'approved' then actor_id end,
    approved_at = case
      when next_status = 'approved' then statement_timestamp()
    end,
    rejected_by = case when next_status = 'rejected' then actor_id end,
    rejected_at = case
      when next_status = 'rejected' then statement_timestamp()
    end
  where id = requested_version_id;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id,
    metadata
  )
  values (
    requested_agency_id, requested_client_id, actor_id,
    'message.' || requested_review_type::text || '_reviewed',
    'campaign_message_version', requested_version_id::text,
    jsonb_build_object(
      'decision', requested_decision,
      'previous_status', current_status,
      'next_status', next_status
    )
  );

  return requested_version_id;
end;
$$;

create or replace function private.submit_campaign_message_for_review(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid
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
    or not private.has_permission(
      requested_agency_id, requested_client_id, 'message.write'
    )
  then
    raise exception using errcode = '42501', message = 'Submission is not authorized.';
  end if;

  update public.campaign_message_versions
  set
    status = 'quality_review_pending',
    submitted_for_review_by = actor_id,
    submitted_for_review_at = statement_timestamp()
  where agency_id = requested_agency_id
    and client_id = requested_client_id
    and id = requested_version_id
    and status = 'draft';

  if not found then
    raise exception using
      errcode = '55000',
      message = 'Only a tenant-owned draft can be submitted.';
  end if;

  return requested_version_id;
end;
$$;

create or replace function public.create_campaign_message_variant(
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
  select private.create_campaign_message_variant(
    requested_agency_id, requested_client_id, requested_payload
  );
$$;

create or replace function public.submit_campaign_message_for_review(
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
  select private.submit_campaign_message_for_review(
    requested_agency_id, requested_client_id, requested_version_id
  );
$$;

create or replace function public.review_campaign_message(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_version_id uuid,
  requested_review_type public.message_review_type,
  requested_decision public.message_review_decision,
  requested_review jsonb
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.review_campaign_message(
    requested_agency_id,
    requested_client_id,
    requested_version_id,
    requested_review_type,
    requested_decision,
    requested_review
  );
$$;

revoke execute on function
  private.create_campaign_message_variant(uuid, uuid, jsonb),
  private.submit_campaign_message_for_review(uuid, uuid, uuid),
  private.review_campaign_message(
    uuid, uuid, uuid, public.message_review_type,
    public.message_review_decision, jsonb
  ),
  public.create_campaign_message_variant(uuid, uuid, jsonb),
  public.submit_campaign_message_for_review(uuid, uuid, uuid),
  public.review_campaign_message(
    uuid, uuid, uuid, public.message_review_type,
    public.message_review_decision, jsonb
  )
from public, anon;

grant execute on function
  private.create_campaign_message_variant(uuid, uuid, jsonb),
  private.submit_campaign_message_for_review(uuid, uuid, uuid),
  private.review_campaign_message(
    uuid, uuid, uuid, public.message_review_type,
    public.message_review_decision, jsonb
  ),
  public.create_campaign_message_variant(uuid, uuid, jsonb),
  public.submit_campaign_message_for_review(uuid, uuid, uuid),
  public.review_campaign_message(
    uuid, uuid, uuid, public.message_review_type,
    public.message_review_decision, jsonb
  )
to authenticated;
