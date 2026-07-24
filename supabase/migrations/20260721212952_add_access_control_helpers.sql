create or replace function private.is_agency_member(requested_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.agency_members as membership
      where membership.agency_id = requested_agency_id
        and membership.profile_id = (select auth.uid())
        and membership.status = 'active'
    );
$$;

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
      from public.client_members as membership
      where membership.agency_id = requested_agency_id
        and membership.client_id = requested_client_id
        and membership.profile_id = (select auth.uid())
        and membership.status = 'active'
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
          from public.client_members as membership
          join public.roles as role
            on role.id = membership.role_id
           and role.agency_id = membership.agency_id
           and role.client_id = membership.client_id
           and role.scope = 'client'
           and role.archived_at is null
          join public.role_permissions as role_permission
            on role_permission.role_id = role.id
          join public.permissions as permission
            on permission.id = role_permission.permission_id
          where membership.agency_id = requested_agency_id
            and membership.client_id = requested_client_id
            and membership.profile_id = (select auth.uid())
            and membership.status = 'active'
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
          from public.client_members as membership
          where membership.role_id = role.id
            and membership.profile_id = (select auth.uid())
            and membership.status = 'active'
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
      and private.has_permission(role.agency_id, role.client_id, 'roles.manage')
  );
$$;

comment on function private.is_agency_member(uuid) is
  'RLS helper that verifies the current authenticated user has an active agency membership.';
comment on function private.is_client_member(uuid, uuid) is
  'RLS helper that verifies exact agency/client membership for the current authenticated user.';
comment on function private.has_permission(uuid, uuid, text) is
  'RLS helper that resolves active agency and client role permissions for the current authenticated user.';

revoke all on function private.is_agency_member(uuid) from public, anon, authenticated;
revoke all on function private.is_client_member(uuid, uuid) from public, anon, authenticated;
revoke all on function private.has_permission(uuid, uuid, text) from public, anon, authenticated;
revoke all on function private.can_read_profile(uuid) from public, anon, authenticated;
revoke all on function private.can_read_role(uuid) from public, anon, authenticated;
revoke all on function private.can_manage_role(uuid) from public, anon, authenticated;

grant usage on schema private to authenticated;
grant execute on function private.is_agency_member(uuid) to authenticated;
grant execute on function private.is_client_member(uuid, uuid) to authenticated;
grant execute on function private.has_permission(uuid, uuid, text) to authenticated;
grant execute on function private.can_read_profile(uuid) to authenticated;
grant execute on function private.can_read_role(uuid) to authenticated;
grant execute on function private.can_manage_role(uuid) to authenticated;
