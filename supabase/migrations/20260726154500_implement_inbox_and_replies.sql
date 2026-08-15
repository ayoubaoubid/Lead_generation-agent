create type public.inbound_webhook_status as enum (
  'received',
  'verified',
  'rejected',
  'processed',
  'failed'
);

create type public.reply_category as enum (
  'positive_interest',
  'information_request',
  'meeting_requested',
  'later',
  'wrong_contact',
  'referral',
  'not_interested',
  'objection',
  'unsubscribe',
  'out_of_office',
  'automatic_reply',
  'existing_customer',
  'competitor',
  'spam',
  'ambiguous'
);

create type public.reply_review_status as enum (
  'pending',
  'confirmed',
  'corrected',
  'rejected'
);

create table public.inbound_webhook_events (
  id uuid not null default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  signature_version text not null,
  payload_sha256 text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default statement_timestamp(),
  status public.inbound_webhook_status not null default 'received',
  agency_id uuid,
  client_id uuid,
  error_code text,
  processed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_inbound_webhook_events primary key (id),
  constraint uq_inbound_webhook_events__provider_event unique (
    provider, provider_event_id
  ),
  constraint fk_inbound_webhook_events__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint ck_inbound_webhook_events__provider check (
    char_length(btrim(provider)) between 2 and 80
    and char_length(btrim(provider_event_id)) between 4 and 240
  ),
  constraint ck_inbound_webhook_events__fingerprint check (
    payload_sha256 ~ '^[a-f0-9]{64}$'
  ),
  constraint ck_inbound_webhook_events__tenant check (
    (agency_id is null and client_id is null)
    or (agency_id is not null and client_id is not null)
  )
);

create table public.inbound_messages (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  webhook_event_id uuid not null,
  outbound_message_id uuid,
  campaign_id uuid,
  campaign_prospect_id uuid,
  contact_id uuid,
  provider_message_id text not null,
  provider_thread_id text,
  sender_address text not null,
  recipient_address text not null,
  subject text,
  body_text text not null,
  received_at timestamptz not null,
  category public.reply_category,
  classification_confidence numeric(5,4),
  classification_explanation text,
  classification_model text,
  classification_prompt_version text,
  review_status public.reply_review_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_inbound_messages primary key (id),
  constraint uq_inbound_messages__tenant_id unique (agency_id, client_id, id),
  constraint uq_inbound_messages__provider_message unique (
    agency_id, client_id, provider_message_id
  ),
  constraint fk_inbound_messages__tenant foreign key (agency_id, client_id)
    references public.clients (agency_id, id) on delete restrict,
  constraint fk_inbound_messages__webhook foreign key (webhook_event_id)
    references public.inbound_webhook_events (id) on delete restrict,
  constraint fk_inbound_messages__outbound foreign key (
    agency_id, client_id, outbound_message_id
  ) references public.outbound_messages (agency_id, client_id, id) on delete restrict,
  constraint fk_inbound_messages__campaign foreign key (
    agency_id, client_id, campaign_id
  ) references public.campaigns (agency_id, client_id, id) on delete restrict,
  constraint fk_inbound_messages__prospect foreign key (
    agency_id, client_id, campaign_prospect_id
  ) references public.campaign_prospects (agency_id, client_id, id) on delete restrict,
  constraint fk_inbound_messages__contact foreign key (
    agency_id, client_id, contact_id
  ) references public.contacts (agency_id, client_id, id) on delete restrict,
  constraint fk_inbound_messages__reviewer foreign key (reviewed_by)
    references public.profiles (id) on delete restrict,
  constraint ck_inbound_messages__addresses check (
    sender_address = lower(sender_address)
    and recipient_address = lower(recipient_address)
    and sender_address ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and recipient_address ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint ck_inbound_messages__body check (
    char_length(body_text) between 1 and 100000
  ),
  constraint ck_inbound_messages__classification check (
    (
      category is null
      and classification_confidence is null
      and classification_explanation is null
    )
    or (
      category is not null
      and classification_confidence between 0 and 1
      and char_length(btrim(classification_explanation)) between 1 and 2000
      and classification_model is not null
      and classification_prompt_version is not null
    )
  ),
  constraint ck_inbound_messages__review check (
    (review_status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (review_status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.reply_drafts (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  inbound_message_id uuid not null,
  version_number integer not null,
  subject text,
  body text not null,
  grounded_facts jsonb not null default '[]'::jsonb,
  missing_information jsonb not null default '[]'::jsonb,
  model text,
  prompt_version text,
  status public.reply_review_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default statement_timestamp(),
  constraint pk_reply_drafts primary key (id),
  constraint uq_reply_drafts__tenant_id unique (agency_id, client_id, id),
  constraint uq_reply_drafts__version unique (inbound_message_id, version_number),
  constraint fk_reply_drafts__message foreign key (
    agency_id, client_id, inbound_message_id
  ) references public.inbound_messages (agency_id, client_id, id) on delete cascade,
  constraint fk_reply_drafts__reviewer foreign key (reviewed_by)
    references public.profiles (id) on delete restrict,
  constraint fk_reply_drafts__creator foreign key (created_by)
    references public.profiles (id) on delete set null,
  constraint ck_reply_drafts__body check (char_length(btrim(body)) between 1 and 10000),
  constraint ck_reply_drafts__grounding check (
    jsonb_typeof(grounded_facts) = 'array'
    and jsonb_typeof(missing_information) = 'array'
  ),
  constraint ck_reply_drafts__review check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.inbox_tasks (
  id uuid not null default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  inbound_message_id uuid not null,
  task_type text not null,
  status text not null default 'open',
  assigned_to uuid,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint pk_inbox_tasks primary key (id),
  constraint uq_inbox_tasks__tenant_id unique (agency_id, client_id, id),
  constraint fk_inbox_tasks__message foreign key (
    agency_id, client_id, inbound_message_id
  ) references public.inbound_messages (agency_id, client_id, id) on delete cascade,
  constraint fk_inbox_tasks__assignee foreign key (assigned_to)
    references public.profiles (id) on delete set null,
  constraint ck_inbox_tasks__type check (
    task_type in ('review_reply', 'respond', 'schedule_meeting', 'research', 'manual_review')
  ),
  constraint ck_inbox_tasks__status check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  constraint ck_inbox_tasks__completion check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index idx_inbound_webhook_events__status
  on public.inbound_webhook_events (status, received_at);
create index idx_inbound_messages__inbox
  on public.inbound_messages (agency_id, client_id, received_at desc);
create index idx_inbox_tasks__open
  on public.inbox_tasks (agency_id, client_id, status, due_at)
  where status in ('open', 'in_progress');

comment on table public.inbound_webhook_events is
  'Replay-protected inbound event ledger. It stores a payload hash, never provider secrets.';
comment on table public.reply_drafts is
  'AI or human reply proposals. No row in this table is permission to send.';

create trigger trg_inbound_webhook_events__set_updated_at
before update on public.inbound_webhook_events
for each row execute function private.set_updated_at();
create trigger trg_inbound_messages__set_updated_at
before update on public.inbound_messages
for each row execute function private.set_updated_at();
create trigger trg_inbox_tasks__set_updated_at
before update on public.inbox_tasks
for each row execute function private.set_updated_at();

alter table public.inbound_webhook_events enable row level security;
alter table public.inbound_messages enable row level security;
alter table public.reply_drafts enable row level security;
alter table public.inbox_tasks enable row level security;

create policy inbound_webhook_events_select on public.inbound_webhook_events for select
to authenticated using (
  agency_id is not null
  and private.has_permission(agency_id, client_id, 'audit.read')
);
create policy inbound_messages_select on public.inbound_messages for select
to authenticated using (private.has_permission(agency_id, client_id, 'reply.read'));
create policy reply_drafts_select on public.reply_drafts for select
to authenticated using (private.has_permission(agency_id, client_id, 'reply.read'));
create policy inbox_tasks_select on public.inbox_tasks for select
to authenticated using (private.has_permission(agency_id, client_id, 'reply.read'));

revoke all on public.inbound_webhook_events, public.inbound_messages,
  public.reply_drafts, public.inbox_tasks from anon, authenticated;
grant select on public.inbound_webhook_events, public.inbound_messages,
  public.reply_drafts, public.inbox_tasks to authenticated;
grant select, insert, update on public.inbound_webhook_events,
  public.inbound_messages, public.reply_drafts, public.inbox_tasks to service_role;

create or replace function public.review_inbound_classification(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_inbound_message_id uuid,
  requested_category public.reply_category,
  requested_status public.reply_review_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or requested_status not in ('confirmed', 'corrected', 'rejected')
    or not private.has_permission(requested_agency_id, requested_client_id, 'reply.write')
  then
    raise exception using errcode = '42501', message = 'Reply review is not authorized.';
  end if;

  update public.inbound_messages
  set category = case when requested_status = 'rejected' then category else requested_category end,
      review_status = requested_status,
      reviewed_by = auth.uid(),
      reviewed_at = statement_timestamp()
  where id = requested_inbound_message_id
    and agency_id = requested_agency_id
    and client_id = requested_client_id;
  if not found then
    raise exception using errcode = '42501', message = 'Inbound message is not accessible.';
  end if;

  insert into public.audit_logs (
    agency_id, client_id, created_by, action, resource_type, resource_id, metadata
  ) values (
    requested_agency_id, requested_client_id, auth.uid(),
    'reply.classification_reviewed', 'inbound_message', requested_inbound_message_id,
    jsonb_build_object('status', requested_status, 'category', requested_category)
  );
  return requested_inbound_message_id;
end;
$$;

revoke execute on function public.review_inbound_classification(
  uuid, uuid, uuid, public.reply_category, public.reply_review_status
) from public, anon;
grant execute on function public.review_inbound_classification(
  uuid, uuid, uuid, public.reply_category, public.reply_review_status
) to authenticated;
