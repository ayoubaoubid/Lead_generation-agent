create or replace function public.add_suppression_entry(
  requested_agency_id uuid,
  requested_client_id uuid,
  requested_email text,
  requested_reason public.suppression_reason,
  requested_scope public.suppression_scope,
  requested_source_resource_type text,
  requested_source_resource_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(requested_email));
  email_hash text;
  entry_id uuid;
  local_part text;
  domain_part text;
  is_technical_actor boolean := coalesce(auth.role(), '') = 'service_role';
begin
  if not is_technical_actor
    and (
      auth.uid() is null
      or not private.has_permission(
        requested_agency_id,
        case
          when requested_scope = 'agency' then null
          else requested_client_id
        end,
        'compliance.manage'
      )
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Suppression is not authorized.';
  end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using
      errcode = '22023',
      message = 'Email address is invalid.';
  end if;
  if not exists (
    select 1 from public.agencies agency
    where agency.id = requested_agency_id
      and agency.status <> 'archived'
  ) or (
    requested_scope = 'client'
    and not exists (
      select 1 from public.clients client
      where client.agency_id = requested_agency_id
        and client.id = requested_client_id
        and client.archived_at is null
    )
  ) then
    raise exception using
      errcode = '23503',
      message = 'Suppression tenant does not exist.';
  end if;

  email_hash := encode(extensions.digest(normalized_email, 'sha256'), 'hex');
  local_part := split_part(normalized_email, '@', 1);
  domain_part := split_part(normalized_email, '@', 2);

  insert into public.suppression_entries (
    agency_id,
    client_id,
    scope,
    normalized_email_hash,
    masked_email,
    reason,
    source_resource_type,
    source_resource_id,
    created_by
  )
  values (
    requested_agency_id,
    case when requested_scope = 'agency' then null else requested_client_id end,
    requested_scope,
    email_hash,
    left(local_part, 1) || '***@' || domain_part,
    requested_reason,
    requested_source_resource_type,
    requested_source_resource_id,
    auth.uid()
  )
  on conflict do nothing
  returning id into entry_id;

  if entry_id is null then
    select entry.id into entry_id
    from public.suppression_entries entry
    where entry.agency_id = requested_agency_id
      and entry.normalized_email_hash = email_hash
      and (
        (
          requested_scope = 'agency'
          and entry.scope = 'agency'
          and entry.client_id is null
        )
        or (
          requested_scope = 'client'
          and entry.scope = 'client'
          and entry.client_id = requested_client_id
        )
      );
  end if;

  return entry_id;
end;
$$;

revoke execute on function public.add_suppression_entry(
  uuid,
  uuid,
  text,
  public.suppression_reason,
  public.suppression_scope,
  text,
  uuid
) from public, anon;
grant execute on function public.add_suppression_entry(
  uuid,
  uuid,
  text,
  public.suppression_reason,
  public.suppression_scope,
  text,
  uuid
) to authenticated, service_role;
