-- The MVP exposes two operator roles only:
--   * Agency Owner: agency administration and access to every client.
--   * Recruiter: agency membership without agency-wide business permissions;
--     operational permissions are granted only through explicit client membership.

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
    (
      requested_agency_id,
      null,
      'agency',
      'Agency Owner',
      'owner',
      'Owns the agency, its clients, memberships, settings and controlled launches.',
      true,
      requested_created_by
    ),
    (
      requested_agency_id,
      null,
      'agency',
      'Recruiter',
      'recruiter',
      'Internal operator whose business access comes only from explicit client assignments.',
      true,
      requested_created_by
    )
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
    and role.client_id is null
    and role.archived_at is null
    and role.slug in ('owner', 'recruiter');

  insert into public.role_permissions (role_id, permission_id, created_by)
  select
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
    and role.slug = 'owner'
  on conflict (role_id, permission_id) do nothing;
end;
$$;

comment on function private.provision_agency_system_roles(uuid, uuid) is
  'Synchronizes the two MVP agency roles. Recruiters receive client-scoped permissions only after explicit assignment.';

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
  values (
    requested_agency_id,
    requested_client_id,
    'client',
    'Recruiter',
    'recruiter',
    'Operates the approved lead-generation workflow for this client only.',
    true,
    requested_created_by
  )
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
    and role.archived_at is null
    and role.slug = 'recruiter';

  with recruiter_permissions(permission_key) as (
    values
      ('client.read'),
      ('onboarding.read'),
      ('onboarding.write'),
      ('onboarding.validate'),
      ('offer.read'),
      ('offer.write'),
      ('targeting.read'),
      ('targeting.write'),
      ('targeting.validate'),
      ('targeting.propose'),
      ('campaign.read'),
      ('campaign.create'),
      ('campaign.write'),
      ('campaign.approve'),
      ('campaign.launch'),
      ('lead.read'),
      ('lead.write'),
      ('message.read'),
      ('message.write'),
      ('message.approve'),
      ('reply.read'),
      ('reply.write'),
      ('meeting.read'),
      ('meeting.write'),
      ('pipeline.read'),
      ('pipeline.write'),
      ('analytics.read'),
      ('audit.read'),
      ('settings.read')
  )
  insert into public.role_permissions (role_id, permission_id, created_by)
  select
    role.id,
    permission.id,
    requested_created_by
  from public.roles as role
  join recruiter_permissions as assignment on true
  join public.permissions as permission
    on permission.key = assignment.permission_key
   and 'client'::public.role_scope = any(permission.allowed_scopes)
  where role.agency_id = requested_agency_id
    and role.client_id = requested_client_id
    and role.scope = 'client'
    and role.slug = 'recruiter'
    and role.archived_at is null
  on conflict (role_id, permission_id) do nothing;
end;
$$;

comment on function private.provision_client_system_roles(uuid, uuid, uuid) is
  'Synchronizes the single client Recruiter role and its explicit operational permission allowlist.';

-- Provision the new roles before moving existing memberships.
select private.provision_agency_system_roles(agency.id, agency.created_by)
from public.agencies as agency;

select private.provision_client_system_roles(
  client.agency_id,
  client.id,
  client.created_by
)
from public.clients as client;

-- Existing non-owner internal memberships become Recruiters.
update public.agency_members as membership
set role_id = recruiter_role.id
from public.roles as previous_role
join public.roles as recruiter_role
  on recruiter_role.agency_id = previous_role.agency_id
 and recruiter_role.scope = 'agency'
 and recruiter_role.client_id is null
 and recruiter_role.slug = 'recruiter'
 and recruiter_role.archived_at is null
where previous_role.id = membership.role_id
  and previous_role.scope = 'agency'
  and previous_role.slug <> 'owner';

-- Every former client-side role maps to the single operational Recruiter role.
update public.client_members as membership
set role_id = recruiter_role.id
from public.roles as previous_role
join public.roles as recruiter_role
  on recruiter_role.agency_id = previous_role.agency_id
 and recruiter_role.client_id = previous_role.client_id
 and recruiter_role.scope = 'client'
 and recruiter_role.slug = 'recruiter'
 and recruiter_role.archived_at is null
where previous_role.id = membership.role_id
  and previous_role.scope = 'client'
  and previous_role.slug <> 'recruiter';

-- Historical roles remain attributable but cannot grant authority.
update public.roles
set archived_at = statement_timestamp()
where archived_at is null
  and (
    (scope = 'agency' and slug not in ('owner', 'recruiter'))
    or (scope = 'client' and slug <> 'recruiter')
  );

create or replace function private.invite_or_assign_recruiter(
  requested_agency_id uuid,
  requested_profile_id uuid,
  requested_client_ids uuid[]
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  normalized_client_ids uuid[] := coalesce(requested_client_ids, array[]::uuid[]);
  recruiter_agency_role_id uuid;
  recruiter_membership_id uuid;
  recruiter_membership_status public.membership_status;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  if not private.has_permission(requested_agency_id, null, 'member.invite')
     or not private.has_permission(requested_agency_id, null, 'member.assign_role') then
    raise exception 'agency owner permission required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles where id = requested_profile_id
  ) then
    raise exception 'recruiter profile not found'
      using errcode = '23503';
  end if;

  if exists (
    select 1
    from public.agency_members as membership
    join public.roles as role
      on role.id = membership.role_id
     and role.agency_id = membership.agency_id
     and role.scope = 'agency'
     and role.slug = 'owner'
     and role.archived_at is null
    where membership.agency_id = requested_agency_id
      and membership.profile_id = requested_profile_id
  ) then
    raise exception 'agency owner cannot be assigned as recruiter'
      using errcode = '23514';
  end if;

  if cardinality(normalized_client_ids) > 100 then
    raise exception 'too many client assignments'
      using errcode = '22023';
  end if;

  if (
    select count(distinct requested_client_id)
    from unnest(normalized_client_ids)
      as requested_client(requested_client_id)
  ) <> cardinality(normalized_client_ids) then
    raise exception 'duplicate client assignment'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(normalized_client_ids)
      as requested_client(requested_client_id)
    left join public.clients as client
      on client.id = requested_client_id
     and client.agency_id = requested_agency_id
     and client.status <> 'archived'
    where client.id is null
  ) then
    raise exception 'client assignment outside agency'
      using errcode = '42501';
  end if;

  select role.id
  into recruiter_agency_role_id
  from public.roles as role
  where role.agency_id = requested_agency_id
    and role.client_id is null
    and role.scope = 'agency'
    and role.slug = 'recruiter'
    and role.archived_at is null;

  if recruiter_agency_role_id is null then
    raise exception 'recruiter agency role not provisioned'
      using errcode = '55000';
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
    recruiter_agency_role_id,
    'invited',
    actor_id
  )
  on conflict (agency_id, profile_id)
  do update
  set
    role_id = excluded.role_id,
    status = case
      when public.agency_members.status = 'active'
        then 'active'::public.membership_status
      else 'invited'::public.membership_status
    end
  returning id, status
  into recruiter_membership_id, recruiter_membership_status;

  insert into public.client_members (
    agency_id,
    client_id,
    profile_id,
    role_id,
    status,
    created_by
  )
  select
    requested_agency_id,
    client.id,
    requested_profile_id,
    role.id,
    case
      when recruiter_membership_status = 'active'
        then 'active'::public.membership_status
      else 'invited'::public.membership_status
    end,
    actor_id
  from public.clients as client
  join public.roles as role
    on role.agency_id = client.agency_id
   and role.client_id = client.id
   and role.scope = 'client'
   and role.slug = 'recruiter'
   and role.archived_at is null
  where client.agency_id = requested_agency_id
    and client.id = any(normalized_client_ids)
  on conflict (client_id, profile_id)
  do update
  set
    role_id = excluded.role_id,
    status = excluded.status;

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
    case
      when recruiter_membership_status = 'active'
        then 'recruiter.assigned'
      else 'recruiter.invited'
    end,
    'agency_membership',
    recruiter_membership_id::text,
    jsonb_build_object(
      'profile_id', requested_profile_id,
      'client_ids', normalized_client_ids
    )
  );

  return recruiter_membership_id;
end;
$$;

comment on function private.invite_or_assign_recruiter(uuid, uuid, uuid[]) is
  'Creates or refreshes the Recruiter agency membership and validates every explicit client assignment inside one transaction.';

create or replace function public.invite_or_assign_recruiter(
  requested_agency_id uuid,
  requested_profile_id uuid,
  requested_client_ids uuid[]
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.invite_or_assign_recruiter(
    requested_agency_id,
    requested_profile_id,
    requested_client_ids
  );
$$;

comment on function public.invite_or_assign_recruiter(uuid, uuid, uuid[]) is
  'Authenticated entry point for the owner-controlled Recruiter invitation and assignment workflow.';

create or replace function private.accept_pending_recruiter_invitations()
returns uuid[]
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  accepted_agency_ids uuid[];
  accepted_agency_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '28000';
  end if;

  select coalesce(array_agg(membership.agency_id), array[]::uuid[])
  into accepted_agency_ids
  from public.agency_members as membership
  join public.roles as role
    on role.id = membership.role_id
   and role.agency_id = membership.agency_id
   and role.scope = 'agency'
   and role.slug = 'recruiter'
   and role.archived_at is null
  where membership.profile_id = actor_id
    and membership.status = 'invited';

  if cardinality(accepted_agency_ids) = 0 then
    return accepted_agency_ids;
  end if;

  update public.agency_members
  set status = 'active'
  where profile_id = actor_id
    and status = 'invited'
    and agency_id = any(accepted_agency_ids);

  update public.client_members
  set status = 'active'
  where profile_id = actor_id
    and status = 'invited'
    and agency_id = any(accepted_agency_ids);

  foreach accepted_agency_id in array accepted_agency_ids
  loop
    insert into public.audit_logs (
      agency_id,
      created_by,
      action,
      resource_type,
      resource_id
    )
    select
      membership.agency_id,
      actor_id,
      'agency_membership.accepted',
      'agency_membership',
      membership.id::text
    from public.agency_members as membership
    where membership.agency_id = accepted_agency_id
      and membership.profile_id = actor_id;
  end loop;

  return accepted_agency_ids;
end;
$$;

create or replace function public.accept_pending_recruiter_invitations()
returns uuid[]
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.accept_pending_recruiter_invitations();
$$;

comment on function public.accept_pending_recruiter_invitations() is
  'Activates only the current authenticated Recruiter pending agency and client memberships.';

-- A Recruiter can list and access only explicitly assigned clients. The Owner
-- remains authorized through the agency-scoped client.read permission.
drop policy if exists clients_select_tenant_members on public.clients;
create policy clients_select_authorized_operators
on public.clients
for select
to authenticated
using (
  (select private.has_permission(agency_id, id, 'client.read'))
);

revoke all on function private.invite_or_assign_recruiter(uuid, uuid, uuid[])
from public, anon, authenticated;
revoke all on function private.accept_pending_recruiter_invitations()
from public, anon, authenticated;
revoke all on function public.invite_or_assign_recruiter(uuid, uuid, uuid[])
from public, anon, authenticated;
revoke all on function public.accept_pending_recruiter_invitations()
from public, anon, authenticated;
revoke all on function private.assign_agency_member(uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function private.assign_client_member(uuid, uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function public.assign_agency_member(uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function public.assign_client_member(uuid, uuid, uuid, uuid)
from public, anon, authenticated;

grant execute on function private.invite_or_assign_recruiter(uuid, uuid, uuid[])
to authenticated;
grant execute on function private.accept_pending_recruiter_invitations()
to authenticated;
grant execute on function public.invite_or_assign_recruiter(uuid, uuid, uuid[])
to authenticated;
grant execute on function public.accept_pending_recruiter_invitations()
to authenticated;
