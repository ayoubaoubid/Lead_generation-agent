-- Permissions are code-defined capabilities. Role names are presentation and
-- provisioning labels only; no authorization rule below compares a role name or slug.
alter table public.permissions
  add column allowed_scopes public.role_scope[] not null
  default array[
    'agency'::public.role_scope,
    'client'::public.role_scope
  ];

alter table public.permissions
  add constraint ck_permissions__allowed_scopes_not_empty
  check (cardinality(allowed_scopes) > 0);

comment on column public.permissions.allowed_scopes is
  'Role scopes to which the permission may be assigned. Enforced by a trigger on role_permissions.';

insert into public.permissions (
  key,
  resource,
  action,
  description,
  allowed_scopes
)
values
  ('agency.manage', 'agency', 'manage', 'Manage agency settings and lifecycle.', array['agency'::public.role_scope]),
  ('agency.transfer_ownership', 'agency', 'transfer_ownership', 'Transfer ownership of an agency.', array['agency'::public.role_scope]),
  ('client.read', 'client', 'read', 'Read authorized client workspaces.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('client.create', 'client', 'create', 'Create a client workspace within an agency.', array['agency'::public.role_scope]),
  ('client.manage', 'client', 'manage', 'Manage an authorized client workspace.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.read', 'member', 'read', 'Read authorized member profiles and memberships.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.invite', 'member', 'invite', 'Invite a member into an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.assign_role', 'member', 'assign_role', 'Assign an allowed role to a member.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('member.suspend', 'member', 'suspend', 'Suspend or remove a membership.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.read', 'role', 'read', 'Read roles and their permission assignments.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.create', 'role', 'create', 'Create a custom role in an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.assign', 'role', 'assign', 'Change permission assignments on a custom role.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('role.archive', 'role', 'archive', 'Archive a custom role.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('offer.read', 'offer', 'read', 'Read client offers and supporting evidence.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('offer.write', 'offer', 'write', 'Create and update client offers.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.read', 'campaign', 'read', 'Read campaigns and sequences.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.create', 'campaign', 'create', 'Create a campaign.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.write', 'campaign', 'write', 'Edit campaign configuration and content.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.approve', 'campaign', 'approve', 'Approve a campaign for its next controlled stage.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('campaign.launch', 'campaign', 'launch', 'Launch an approved campaign after all preflight checks.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('lead.read', 'lead', 'read', 'Read authorized company, contact, and lead data.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('lead.write', 'lead', 'write', 'Create and update authorized lead data.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('message.read', 'message', 'read', 'Read generated messages and templates.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('message.write', 'message', 'write', 'Create and edit messages and templates.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('message.approve', 'message', 'approve', 'Approve or reject generated messages.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('reply.read', 'reply', 'read', 'Read authorized inbound replies.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('reply.write', 'reply', 'write', 'Classify replies and record authorized follow-up actions.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('meeting.read', 'meeting', 'read', 'Read authorized meeting information.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('meeting.write', 'meeting', 'write', 'Create and update authorized meetings.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('pipeline.read', 'pipeline', 'read', 'Read authorized pipeline and opportunity data.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('pipeline.write', 'pipeline', 'write', 'Create and update authorized pipeline records.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('analytics.read', 'analytics', 'read', 'Read authorized analytics and reports.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('audit.read', 'audit', 'read', 'Read tenant-scoped audit records.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('settings.read', 'settings', 'read', 'Read settings in an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope]),
  ('settings.manage', 'settings', 'manage', 'Manage settings in an authorized scope.', array['agency'::public.role_scope, 'client'::public.role_scope])
on conflict (key) do update
set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes;

-- Preserve the effective capabilities of custom roles while replacing the
-- original broad/plural vocabulary with the atomic catalog.
with permission_migration (old_key, new_key) as (
  values
    ('clients.read', 'client.read'),
    ('clients.create', 'client.create'),
    ('clients.manage', 'client.manage'),
    ('members.read', 'member.read'),
    ('members.manage', 'member.invite'),
    ('members.manage', 'member.assign_role'),
    ('members.manage', 'member.suspend'),
    ('roles.read', 'role.read'),
    ('roles.manage', 'role.create'),
    ('roles.manage', 'role.assign'),
    ('roles.manage', 'role.archive')
)
insert into public.role_permissions (role_id, permission_id, created_by)
select
  role_permission.role_id,
  replacement.id,
  role_permission.created_by
from public.role_permissions as role_permission
join public.permissions as current_permission
  on current_permission.id = role_permission.permission_id
join permission_migration as migration
  on migration.old_key = current_permission.key
join public.permissions as replacement
  on replacement.key = migration.new_key
on conflict (role_id, permission_id) do nothing;

delete from public.role_permissions as role_permission
using public.permissions as permission
where role_permission.permission_id = permission.id
  and permission.key in (
    'clients.read',
    'clients.create',
    'clients.manage',
    'members.read',
    'members.manage',
    'roles.read',
    'roles.manage'
  );

delete from public.permissions
where key in (
  'clients.read',
  'clients.create',
  'clients.manage',
  'members.read',
  'members.manage',
  'roles.read',
  'roles.manage'
);

create or replace function private.provision_agency_system_roles(
  requested_agency_id uuid,
  requested_created_by uuid
)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  insert into public.roles (
    agency_id,
    client_id,
    scope,
    name,
    slug,
    description,
    is_system,
    created_by
  )
  values
    (requested_agency_id, null, 'agency', 'Agency Owner', 'owner', 'Full agency authority, including ownership transfer.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'Agency Admin', 'admin', 'Full agency administration except ownership transfer.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'Campaign Manager', 'campaign-manager', 'Builds, approves, and launches campaigns.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'Lead Researcher', 'lead-researcher', 'Researches and maintains lead data.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'SDR', 'sdr', 'Operates lead outreach, replies, meetings, and pipeline updates.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'Sales Manager', 'sales-manager', 'Manages campaigns and the sales pipeline.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'Reviewer', 'reviewer', 'Reviews campaigns and generated messages.', true, requested_created_by),
    (requested_agency_id, null, 'agency', 'Analyst', 'analyst', 'Reads operational data and analytics.', true, requested_created_by)
  on conflict (agency_id, slug)
    where client_id is null and archived_at is null
  do update
  set
    name = excluded.name,
    description = excluded.description,
    is_system = true;

  delete from public.role_permissions as role_permission
  using public.roles as role
  where role_permission.role_id = role.id
    and role.agency_id = requested_agency_id
    and role.scope = 'agency'
    and role.is_system;

  with explicit_assignments (role_slug, permission_key) as (
    values
      ('campaign-manager', 'client.read'),
      ('campaign-manager', 'offer.read'),
      ('campaign-manager', 'campaign.read'),
      ('campaign-manager', 'campaign.create'),
      ('campaign-manager', 'campaign.write'),
      ('campaign-manager', 'campaign.approve'),
      ('campaign-manager', 'campaign.launch'),
      ('campaign-manager', 'lead.read'),
      ('campaign-manager', 'message.read'),
      ('campaign-manager', 'message.write'),
      ('campaign-manager', 'message.approve'),
      ('campaign-manager', 'analytics.read'),
      ('lead-researcher', 'client.read'),
      ('lead-researcher', 'offer.read'),
      ('lead-researcher', 'lead.read'),
      ('lead-researcher', 'lead.write'),
      ('sdr', 'client.read'),
      ('sdr', 'offer.read'),
      ('sdr', 'campaign.read'),
      ('sdr', 'lead.read'),
      ('sdr', 'lead.write'),
      ('sdr', 'message.read'),
      ('sdr', 'message.write'),
      ('sdr', 'reply.read'),
      ('sdr', 'reply.write'),
      ('sdr', 'meeting.read'),
      ('sdr', 'meeting.write'),
      ('sdr', 'pipeline.read'),
      ('sdr', 'pipeline.write'),
      ('sales-manager', 'client.read'),
      ('sales-manager', 'offer.read'),
      ('sales-manager', 'campaign.read'),
      ('sales-manager', 'campaign.create'),
      ('sales-manager', 'campaign.write'),
      ('sales-manager', 'campaign.approve'),
      ('sales-manager', 'campaign.launch'),
      ('sales-manager', 'lead.read'),
      ('sales-manager', 'lead.write'),
      ('sales-manager', 'message.read'),
      ('sales-manager', 'message.write'),
      ('sales-manager', 'message.approve'),
      ('sales-manager', 'reply.read'),
      ('sales-manager', 'reply.write'),
      ('sales-manager', 'meeting.read'),
      ('sales-manager', 'meeting.write'),
      ('sales-manager', 'pipeline.read'),
      ('sales-manager', 'pipeline.write'),
      ('sales-manager', 'analytics.read'),
      ('reviewer', 'client.read'),
      ('reviewer', 'offer.read'),
      ('reviewer', 'campaign.read'),
      ('reviewer', 'campaign.approve'),
      ('reviewer', 'lead.read'),
      ('reviewer', 'message.read'),
      ('reviewer', 'message.approve'),
      ('analyst', 'client.read'),
      ('analyst', 'offer.read'),
      ('analyst', 'campaign.read'),
      ('analyst', 'lead.read'),
      ('analyst', 'message.read'),
      ('analyst', 'reply.read'),
      ('analyst', 'pipeline.read'),
      ('analyst', 'analytics.read')
  )
  insert into public.role_permissions (role_id, permission_id, created_by)
  select distinct
    role.id,
    permission.id,
    requested_created_by
  from public.roles as role
  join public.permissions as permission
    on 'agency'::public.role_scope = any(permission.allowed_scopes)
  where role.agency_id = requested_agency_id
    and role.scope = 'agency'
    and role.client_id is null
    and role.archived_at is null
    and role.is_system
    and (
      role.slug = 'owner'
      or (role.slug = 'admin' and permission.key <> 'agency.transfer_ownership')
      or exists (
        select 1
        from explicit_assignments as assignment
        where assignment.role_slug = role.slug
          and assignment.permission_key = permission.key
      )
    )
  on conflict (role_id, permission_id) do nothing;
end;
$$;

comment on function private.provision_agency_system_roles(uuid, uuid) is
  'Creates or synchronizes the fixed agency role templates and their atomic permission matrix.';

create or replace function private.provision_client_system_roles(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_created_by uuid
)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  insert into public.roles (
    agency_id,
    client_id,
    scope,
    name,
    slug,
    description,
    is_system,
    created_by
  )
  values
    (requested_agency_id, requested_client_id, 'client', 'Client Admin', 'admin', 'Administers the authorized client workspace.', true, requested_created_by),
    (requested_agency_id, requested_client_id, 'client', 'Client Reviewer', 'reviewer', 'Reviews campaigns and generated messages for the client.', true, requested_created_by),
    (requested_agency_id, requested_client_id, 'client', 'Client Viewer', 'viewer', 'Read-only access to the authorized client workspace.', true, requested_created_by)
  on conflict (agency_id, client_id, slug)
    where client_id is not null and archived_at is null
  do update
  set
    name = excluded.name,
    description = excluded.description,
    is_system = true;

  delete from public.role_permissions as role_permission
  using public.roles as role
  where role_permission.role_id = role.id
    and role.agency_id = requested_agency_id
    and role.client_id = requested_client_id
    and role.scope = 'client'
    and role.is_system;

  with explicit_assignments (role_slug, permission_key) as (
    values
      ('reviewer', 'client.read'),
      ('reviewer', 'offer.read'),
      ('reviewer', 'campaign.read'),
      ('reviewer', 'campaign.approve'),
      ('reviewer', 'lead.read'),
      ('reviewer', 'message.read'),
      ('reviewer', 'message.approve'),
      ('reviewer', 'analytics.read'),
      ('viewer', 'client.read'),
      ('viewer', 'offer.read'),
      ('viewer', 'campaign.read'),
      ('viewer', 'lead.read'),
      ('viewer', 'message.read'),
      ('viewer', 'reply.read'),
      ('viewer', 'meeting.read'),
      ('viewer', 'pipeline.read'),
      ('viewer', 'analytics.read')
  )
  insert into public.role_permissions (role_id, permission_id, created_by)
  select distinct
    role.id,
    permission.id,
    requested_created_by
  from public.roles as role
  join public.permissions as permission
    on 'client'::public.role_scope = any(permission.allowed_scopes)
  where role.agency_id = requested_agency_id
    and role.client_id = requested_client_id
    and role.scope = 'client'
    and role.archived_at is null
    and role.is_system
    and (
      (role.slug = 'admin' and permission.key <> 'campaign.launch')
      or exists (
        select 1
        from explicit_assignments as assignment
        where assignment.role_slug = role.slug
          and assignment.permission_key = permission.key
      )
    )
  on conflict (role_id, permission_id) do nothing;
end;
$$;

comment on function private.provision_client_system_roles(uuid, uuid, uuid) is
  'Creates or synchronizes the fixed client role templates and their atomic permission matrix.';

-- Synchronize existing tenants before the scope-assignment trigger is installed.
select private.provision_agency_system_roles(agency.id, agency.created_by)
from public.agencies as agency;

select private.provision_client_system_roles(
  client.agency_id,
  client.id,
  client.created_by
)
from public.clients as client;

create or replace function private.assert_role_permission_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role_scope public.role_scope;
  allowed_role_scopes public.role_scope[];
begin
  select role.scope
  into assigned_role_scope
  from public.roles as role
  where role.id = new.role_id
    and role.archived_at is null;

  select permission.allowed_scopes
  into allowed_role_scopes
  from public.permissions as permission
  where permission.id = new.permission_id;

  if assigned_role_scope is null
     or allowed_role_scopes is null
     or not (assigned_role_scope = any(allowed_role_scopes)) then
    raise exception 'permission is not allowed for the role scope'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.assert_role_permission_scope() is
  'Rejects permission assignments that are incompatible with the agency or client scope of the role.';

revoke all on function private.assert_role_permission_scope()
from public, anon, authenticated;

create trigger trg_role_permissions__assert_scope
before insert or update of role_id, permission_id
on public.role_permissions
for each row execute function private.assert_role_permission_scope();

create or replace function private.can_read_profile(requested_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      requested_profile_id = (select auth.uid())
      or exists (
        select 1
        from public.agency_members as requested
        where requested.profile_id = requested_profile_id
          and requested.status = 'active'
          and private.has_permission(requested.agency_id, null, 'member.read')
      )
      or exists (
        select 1
        from public.client_members as requested
        join public.agency_members as requested_agency_membership
          on requested_agency_membership.agency_id = requested.agency_id
         and requested_agency_membership.profile_id = requested.profile_id
         and requested_agency_membership.status = 'active'
        where requested.profile_id = requested_profile_id
          and requested.status = 'active'
          and private.has_permission(requested.agency_id, requested.client_id, 'member.read')
      )
    );
$$;

create or replace function private.can_read_role(requested_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roles as role
    where role.id = requested_role_id
      and (
        private.has_permission(role.agency_id, role.client_id, 'role.read')
        or exists (
          select 1
          from public.agency_members as membership
          where membership.role_id = role.id
            and membership.profile_id = (select auth.uid())
            and membership.status = 'active'
        )
        or exists (
          select 1
          from public.client_members as client_membership
          join public.agency_members as agency_membership
            on agency_membership.agency_id = client_membership.agency_id
           and agency_membership.profile_id = client_membership.profile_id
           and agency_membership.status = 'active'
          where client_membership.role_id = role.id
            and client_membership.profile_id = (select auth.uid())
            and client_membership.status = 'active'
        )
      )
  );
$$;

create or replace function private.can_manage_role(requested_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roles as role
    where role.id = requested_role_id
      and not role.is_system
      and private.has_permission(role.agency_id, role.client_id, 'role.assign')
  );
$$;

create or replace function private.bootstrap_agency(
  requested_name text,
  requested_slug text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_agency_id uuid;
  owner_role_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles where id = actor_id
  ) then
    raise exception 'profile required'
      using errcode = '23503';
  end if;

  insert into public.agencies (name, slug, status, created_by)
  values (requested_name, requested_slug, 'draft', actor_id)
  returning id into created_agency_id;

  perform private.provision_agency_system_roles(created_agency_id, actor_id);

  select role.id
  into owner_role_id
  from public.roles as role
  where role.agency_id = created_agency_id
    and role.client_id is null
    and role.scope = 'agency'
    and role.slug = 'owner'
    and role.is_system
    and role.archived_at is null;

  insert into public.agency_members (
    agency_id,
    profile_id,
    role_id,
    status,
    created_by
  )
  values (
    created_agency_id,
    actor_id,
    owner_role_id,
    'active',
    actor_id
  );

  insert into public.audit_logs (
    agency_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    created_agency_id,
    actor_id,
    'agency.created',
    'agency',
    created_agency_id::text,
    jsonb_build_object('system_roles_provisioned', true)
  );

  return created_agency_id;
end;
$$;

create or replace function private.create_client(
  requested_agency_id uuid,
  requested_name text,
  requested_slug text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_client_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(requested_agency_id, null, 'client.create') then
    raise exception 'client creation permission required'
      using errcode = '42501';
  end if;

  insert into public.clients (
    agency_id,
    name,
    slug,
    status,
    created_by
  )
  values (
    requested_agency_id,
    requested_name,
    requested_slug,
    'draft',
    actor_id
  )
  returning id into created_client_id;

  perform private.provision_client_system_roles(
    requested_agency_id,
    created_client_id,
    actor_id
  );

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
    created_client_id,
    actor_id,
    'client.created',
    'client',
    created_client_id::text,
    jsonb_build_object('system_roles_provisioned', true)
  );

  return created_client_id;
end;
$$;

create or replace function private.assign_agency_member(
  requested_agency_id uuid,
  requested_profile_id uuid,
  requested_role_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_membership_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(requested_agency_id, null, 'member.invite')
     or not private.has_permission(requested_agency_id, null, 'member.assign_role') then
    raise exception 'member invitation and role assignment permissions required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.roles as role
    where role.id = requested_role_id
      and role.agency_id = requested_agency_id
      and role.scope = 'agency'
      and role.client_id is null
      and role.archived_at is null
  ) then
    raise exception 'agency role not found'
      using errcode = '23514';
  end if;

  insert into public.agency_members (
    agency_id,
    profile_id,
    role_id,
    status,
    created_by
  )
  values (
    requested_agency_id,
    requested_profile_id,
    requested_role_id,
    'invited',
    actor_id
  )
  returning id into created_membership_id;

  insert into public.audit_logs (
    agency_id,
    created_by,
    action,
    resource_type,
    resource_id,
    metadata
  )
  values (
    requested_agency_id,
    actor_id,
    'agency_membership.invited',
    'agency_membership',
    created_membership_id::text,
    jsonb_build_object(
      'profile_id', requested_profile_id,
      'role_id', requested_role_id
    )
  );

  return created_membership_id;
end;
$$;

create or replace function private.assign_client_member(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_id uuid,
  requested_role_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  created_membership_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(
       requested_agency_id,
       requested_client_id,
       'member.invite'
     )
     or not private.has_permission(
       requested_agency_id,
       requested_client_id,
       'member.assign_role'
     ) then
    raise exception 'member invitation and role assignment permissions required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.roles as role
    where role.id = requested_role_id
      and role.agency_id = requested_agency_id
      and role.client_id = requested_client_id
      and role.scope = 'client'
      and role.archived_at is null
  ) then
    raise exception 'client role not found'
      using errcode = '23514';
  end if;

  insert into public.client_members (
    agency_id,
    client_id,
    profile_id,
    role_id,
    status,
    created_by
  )
  values (
    requested_agency_id,
    requested_client_id,
    requested_profile_id,
    requested_role_id,
    'invited',
    actor_id
  )
  returning id into created_membership_id;

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
    'client_membership.invited',
    'client_membership',
    created_membership_id::text,
    jsonb_build_object(
      'profile_id', requested_profile_id,
      'role_id', requested_role_id
    )
  );

  return created_membership_id;
end;
$$;

revoke all on function private.provision_agency_system_roles(uuid, uuid)
from public, anon, authenticated;
revoke all on function private.provision_client_system_roles(uuid, uuid, uuid)
from public, anon, authenticated;

-- Direct RBAC mutations are intentionally unavailable to browser sessions.
-- Audited RPC workflows remain the only mutation path currently exposed.
revoke insert, update on table public.agency_members from authenticated;
revoke insert, update on table public.client_members from authenticated;
revoke insert, update on table public.roles from authenticated;
revoke insert, delete on table public.role_permissions from authenticated;
revoke update on table public.agencies from authenticated;
revoke insert, update on table public.clients from authenticated;

drop policy if exists agencies_update_managers on public.agencies;

drop policy if exists clients_select_tenant_members on public.clients;
create policy clients_select_tenant_members
on public.clients
for select
to authenticated
using (
  (select private.has_permission(agency_id, id, 'client.read'))
  or (select private.is_client_member(agency_id, id))
);

drop policy if exists clients_insert_agency_managers on public.clients;
drop policy if exists clients_update_managers on public.clients;

drop policy if exists agency_members_select_agency_members on public.agency_members;
create policy agency_members_select_agency_members
on public.agency_members
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select private.has_permission(agency_id, null, 'member.read'))
);

drop policy if exists agency_members_insert_member_managers on public.agency_members;
drop policy if exists agency_members_update_member_managers on public.agency_members;

drop policy if exists client_members_select_tenant_members on public.client_members;
create policy client_members_select_tenant_members
on public.client_members
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select private.has_permission(agency_id, client_id, 'member.read'))
);

drop policy if exists client_members_insert_member_managers on public.client_members;
drop policy if exists client_members_update_member_managers on public.client_members;

drop policy if exists roles_insert_role_managers on public.roles;
drop policy if exists roles_update_role_managers on public.roles;
drop policy if exists role_permissions_insert_role_managers on public.role_permissions;
drop policy if exists role_permissions_delete_role_managers on public.role_permissions;
