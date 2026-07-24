-- Ensure the authorization vocabulary is present in every environment. Seeds are
-- development-only and must not be the production source of RBAC permissions.
insert into public.permissions (key, resource, action, description)
values
  ('agency.manage', 'agency', 'manage', 'Manage the agency workspace settings.'),
  ('clients.read', 'clients', 'read', 'Read client workspaces within the authorized scope.'),
  ('clients.create', 'clients', 'create', 'Create a client workspace within an agency.'),
  ('clients.manage', 'clients', 'manage', 'Manage an existing client workspace.'),
  ('members.read', 'members', 'read', 'Read member profiles and memberships within the authorized scope.'),
  ('members.manage', 'members', 'manage', 'Invite, suspend, and assign roles to members.'),
  ('roles.read', 'roles', 'read', 'Read roles and permission assignments within the authorized scope.'),
  ('roles.manage', 'roles', 'manage', 'Create roles and assign permissions.'),
  ('audit.read', 'audit', 'read', 'Read tenant-scoped audit records.')
on conflict (key) do update
set
  resource = excluded.resource,
  action = excluded.action,
  description = excluded.description;

-- A client membership is always subordinate to an agency membership. The
-- membership status may still be invited or suspended, but access helpers below
-- require both rows to be active before granting client access.
alter table public.client_members
  add constraint fk_client_members__agency_id_profile_id
  foreign key (agency_id, profile_id)
  references public.agency_members (agency_id, profile_id)
  on delete restrict;

create or replace function private.is_client_member(
  requested_agency_id uuid,
  requested_client_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.client_members as client_membership
      join public.agency_members as agency_membership
        on agency_membership.agency_id = client_membership.agency_id
       and agency_membership.profile_id = client_membership.profile_id
       and agency_membership.status = 'active'
      where client_membership.agency_id = requested_agency_id
        and client_membership.client_id = requested_client_id
        and client_membership.profile_id = (select auth.uid())
        and client_membership.status = 'active'
    );
$$;

create or replace function private.has_permission(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1
        from public.agency_members as membership
        join public.roles as role
          on role.id = membership.role_id
         and role.agency_id = membership.agency_id
         and role.scope = 'agency'
         and role.client_id is null
         and role.archived_at is null
        join public.role_permissions as role_permission
          on role_permission.role_id = role.id
        join public.permissions as permission
          on permission.id = role_permission.permission_id
        where membership.agency_id = requested_agency_id
          and membership.profile_id = (select auth.uid())
          and membership.status = 'active'
          and permission.key = requested_permission_key
      )
      or (
        requested_client_id is not null
        and exists (
          select 1
          from public.client_members as client_membership
          join public.agency_members as agency_membership
            on agency_membership.agency_id = client_membership.agency_id
           and agency_membership.profile_id = client_membership.profile_id
           and agency_membership.status = 'active'
          join public.roles as role
            on role.id = client_membership.role_id
           and role.agency_id = client_membership.agency_id
           and role.client_id = client_membership.client_id
           and role.scope = 'client'
           and role.archived_at is null
          join public.role_permissions as role_permission
            on role_permission.role_id = role.id
          join public.permissions as permission
            on permission.id = role_permission.permission_id
          where client_membership.agency_id = requested_agency_id
            and client_membership.client_id = requested_client_id
            and client_membership.profile_id = (select auth.uid())
            and client_membership.status = 'active'
            and permission.key = requested_permission_key
        )
      )
    );
$$;

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
          and private.has_permission(requested.agency_id, null, 'members.read')
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
          and private.has_permission(requested.agency_id, requested.client_id, 'members.read')
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
        private.has_permission(role.agency_id, role.client_id, 'roles.read')
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
  values (
    created_agency_id,
    null,
    'agency',
    'Agency Owner',
    'owner',
    'System owner role created with the agency.',
    true,
    actor_id
  )
  returning id into owner_role_id;

  insert into public.role_permissions (role_id, permission_id, created_by)
  select owner_role_id, permission.id, actor_id
  from public.permissions as permission;

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
    resource_id
  )
  values (
    created_agency_id,
    actor_id,
    'agency.created',
    'agency',
    created_agency_id::text
  );

  return created_agency_id;
end;
$$;

comment on function private.bootstrap_agency(text, text) is
  'Atomically creates an agency, its system owner role, all permission assignments, the creator membership, and an audit record.';

create or replace function public.create_agency(
  requested_name text,
  requested_slug text
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.bootstrap_agency(requested_name, requested_slug);
$$;

comment on function public.create_agency(text, text) is
  'Authenticated Data API entry point for atomic agency bootstrap. Authorization is enforced inside the non-exposed private function.';

create or replace function private.accept_agency_membership(
  requested_membership_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  accepted_agency_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  update public.agency_members
  set status = 'active'
  where id = requested_membership_id
    and profile_id = actor_id
    and status = 'invited'
  returning agency_id into accepted_agency_id;

  if accepted_agency_id is null then
    raise exception 'membership invitation not found'
      using errcode = 'P0002';
  end if;

  insert into public.audit_logs (
    agency_id,
    created_by,
    action,
    resource_type,
    resource_id
  )
  values (
    accepted_agency_id,
    actor_id,
    'agency_membership.accepted',
    'agency_membership',
    requested_membership_id::text
  );

  return accepted_agency_id;
end;
$$;

comment on function private.accept_agency_membership(uuid) is
  'Activates only an invitation belonging to the current authenticated profile and records the transition.';

create or replace function public.accept_agency_membership(
  requested_membership_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.accept_agency_membership(requested_membership_id);
$$;

comment on function public.accept_agency_membership(uuid) is
  'Authenticated Data API entry point for accepting the current user agency invitation.';

create or replace function private.select_active_agency(
  requested_agency_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.is_agency_member(requested_agency_id) then
    raise exception 'agency membership required'
      using errcode = '42501';
  end if;

  insert into public.audit_logs (
    agency_id,
    created_by,
    action,
    resource_type,
    resource_id
  )
  values (
    requested_agency_id,
    actor_id,
    'tenant_context.selected',
    'agency',
    requested_agency_id::text
  );

  return requested_agency_id;
end;
$$;

create or replace function public.select_active_agency(
  requested_agency_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.select_active_agency(requested_agency_id);
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

  if not private.has_permission(requested_agency_id, null, 'clients.create') then
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

  insert into public.audit_logs (
    agency_id,
    client_id,
    created_by,
    action,
    resource_type,
    resource_id
  )
  values (
    requested_agency_id,
    created_client_id,
    actor_id,
    'client.created',
    'client',
    created_client_id::text
  );

  return created_client_id;
end;
$$;

create or replace function public.create_client(
  requested_agency_id uuid,
  requested_name text,
  requested_slug text
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_client(
    requested_agency_id,
    requested_name,
    requested_slug
  );
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

  if not private.has_permission(requested_agency_id, null, 'members.manage') then
    raise exception 'member management permission required'
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
    jsonb_build_object('profile_id', requested_profile_id)
  );

  return created_membership_id;
end;
$$;

create or replace function public.assign_agency_member(
  requested_agency_id uuid,
  requested_profile_id uuid,
  requested_role_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.assign_agency_member(
    requested_agency_id,
    requested_profile_id,
    requested_role_id
  );
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
    'members.manage'
  ) then
    raise exception 'member management permission required'
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
    jsonb_build_object('profile_id', requested_profile_id)
  );

  return created_membership_id;
end;
$$;

create or replace function public.assign_client_member(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_profile_id uuid,
  requested_role_id uuid
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.assign_client_member(
    requested_agency_id,
    requested_client_id,
    requested_profile_id,
    requested_role_id
  );
$$;

revoke all on function private.bootstrap_agency(text, text) from public, anon, authenticated;
revoke all on function private.accept_agency_membership(uuid) from public, anon, authenticated;
revoke all on function private.select_active_agency(uuid) from public, anon, authenticated;
revoke all on function private.create_client(uuid, text, text) from public, anon, authenticated;
revoke all on function private.assign_agency_member(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.assign_client_member(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_agency(text, text) from public, anon, authenticated;
revoke all on function public.accept_agency_membership(uuid) from public, anon, authenticated;
revoke all on function public.select_active_agency(uuid) from public, anon, authenticated;
revoke all on function public.create_client(uuid, text, text) from public, anon, authenticated;
revoke all on function public.assign_agency_member(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.assign_client_member(uuid, uuid, uuid, uuid) from public, anon, authenticated;

grant execute on function private.bootstrap_agency(text, text) to authenticated;
grant execute on function private.accept_agency_membership(uuid) to authenticated;
grant execute on function private.select_active_agency(uuid) to authenticated;
grant execute on function private.create_client(uuid, text, text) to authenticated;
grant execute on function private.assign_agency_member(uuid, uuid, uuid) to authenticated;
grant execute on function private.assign_client_member(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.create_agency(text, text) to authenticated;
grant execute on function public.accept_agency_membership(uuid) to authenticated;
grant execute on function public.select_active_agency(uuid) to authenticated;
grant execute on function public.create_client(uuid, text, text) to authenticated;
grant execute on function public.assign_agency_member(uuid, uuid, uuid) to authenticated;
grant execute on function public.assign_client_member(uuid, uuid, uuid, uuid) to authenticated;
