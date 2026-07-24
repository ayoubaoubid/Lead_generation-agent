alter table public.profiles enable row level security;
alter table public.agencies enable row level security;
alter table public.clients enable row level security;
alter table public.agency_members enable row level security;
alter table public.client_members enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.agencies from anon, authenticated;
revoke all on table public.clients from anon, authenticated;
revoke all on table public.agency_members from anon, authenticated;
revoke all on table public.client_members from anon, authenticated;
revoke all on table public.roles from anon, authenticated;
revoke all on table public.permissions from anon, authenticated;
revoke all on table public.role_permissions from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, locale, timezone) on table public.profiles to authenticated;

grant select on table public.agencies to authenticated;
grant update (name, slug, status) on table public.agencies to authenticated;

grant select on table public.clients to authenticated;
grant insert (agency_id, name, slug, status, created_by) on table public.clients to authenticated;
grant update (name, slug, status) on table public.clients to authenticated;

grant select on table public.agency_members to authenticated;
grant insert (agency_id, profile_id, role_id, status, created_by)
  on table public.agency_members to authenticated;
grant update (role_id, status) on table public.agency_members to authenticated;

grant select on table public.client_members to authenticated;
grant insert (agency_id, client_id, profile_id, role_id, status, created_by)
  on table public.client_members to authenticated;
grant update (role_id, status) on table public.client_members to authenticated;

grant select on table public.roles to authenticated;
grant insert (agency_id, client_id, scope, name, slug, description, created_by)
  on table public.roles to authenticated;
grant update (name, slug, description, archived_at) on table public.roles to authenticated;

grant select on table public.permissions to authenticated;
grant select on table public.role_permissions to authenticated;
grant insert (role_id, permission_id, created_by) on table public.role_permissions to authenticated;
grant delete on table public.role_permissions to authenticated;
grant select on table public.audit_logs to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.agencies to service_role;
grant all on table public.clients to service_role;
grant all on table public.agency_members to service_role;
grant all on table public.client_members to service_role;
grant all on table public.roles to service_role;
grant all on table public.permissions to service_role;
grant all on table public.role_permissions to service_role;
grant select, insert on table public.audit_logs to service_role;
grant usage, select on sequence public.audit_logs_id_seq to service_role;

create policy profiles_select_visible_members
on public.profiles
for select
to authenticated
using ((select private.can_read_profile(id)));

create policy profiles_update_self
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy agencies_select_active_members
on public.agencies
for select
to authenticated
using ((select private.is_agency_member(id)));

create policy agencies_update_managers
on public.agencies
for update
to authenticated
using ((select private.has_permission(id, null, 'agency.manage')))
with check ((select private.has_permission(id, null, 'agency.manage')));

create policy clients_select_tenant_members
on public.clients
for select
to authenticated
using (
  (select private.has_permission(agency_id, id, 'clients.read'))
  or (select private.is_client_member(agency_id, id))
);

create policy clients_insert_agency_managers
on public.clients
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_permission(agency_id, null, 'clients.create'))
);

create policy clients_update_managers
on public.clients
for update
to authenticated
using ((select private.has_permission(agency_id, id, 'clients.manage')))
with check ((select private.has_permission(agency_id, id, 'clients.manage')));

create policy agency_members_select_agency_members
on public.agency_members
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select private.has_permission(agency_id, null, 'members.read'))
);

create policy agency_members_insert_member_managers
on public.agency_members
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_permission(agency_id, null, 'members.manage'))
);

create policy agency_members_update_member_managers
on public.agency_members
for update
to authenticated
using ((select private.has_permission(agency_id, null, 'members.manage')))
with check ((select private.has_permission(agency_id, null, 'members.manage')));

create policy client_members_select_tenant_members
on public.client_members
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select private.has_permission(agency_id, client_id, 'members.read'))
);

create policy client_members_insert_member_managers
on public.client_members
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_permission(agency_id, client_id, 'members.manage'))
);

create policy client_members_update_member_managers
on public.client_members
for update
to authenticated
using ((select private.has_permission(agency_id, client_id, 'members.manage')))
with check ((select private.has_permission(agency_id, client_id, 'members.manage')));

create policy roles_select_tenant_members
on public.roles
for select
to authenticated
using ((select private.can_read_role(id)));

create policy roles_insert_role_managers
on public.roles
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_permission(agency_id, client_id, 'roles.manage'))
);

create policy roles_update_role_managers
on public.roles
for update
to authenticated
using ((select private.has_permission(agency_id, client_id, 'roles.manage')))
with check ((select private.has_permission(agency_id, client_id, 'roles.manage')));

create policy permissions_select_authenticated
on public.permissions
for select
to authenticated
using ((select auth.uid()) is not null);

create policy role_permissions_select_visible_roles
on public.role_permissions
for select
to authenticated
using ((select private.can_read_role(role_id)));

create policy role_permissions_insert_role_managers
on public.role_permissions
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_manage_role(role_id))
);

create policy role_permissions_delete_role_managers
on public.role_permissions
for delete
to authenticated
using ((select private.can_manage_role(role_id)));

create policy audit_logs_select_auditors
on public.audit_logs
for select
to authenticated
using ((select private.has_permission(agency_id, client_id, 'audit.read')));
