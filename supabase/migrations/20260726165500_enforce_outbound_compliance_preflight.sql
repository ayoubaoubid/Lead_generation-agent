create or replace function private.enforce_outbound_compliance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  contact_email text;
  email_hash text;
begin
  if new.status not in ('scheduled', 'sending') then
    return new;
  end if;

  select contact.email into contact_email
  from public.campaign_prospects prospect
  join public.contacts contact
    on contact.agency_id = prospect.agency_id
    and contact.client_id = prospect.client_id
    and contact.id = prospect.contact_id
  where prospect.id = new.campaign_prospect_id
    and prospect.agency_id = new.agency_id
    and prospect.client_id = new.client_id;

  if contact_email is null then
    raise exception using errcode = '55000', message = 'A verified contact email is required.';
  end if;

  if exists (
    select 1 from public.email_verifications verification
    where verification.agency_id = new.agency_id
      and verification.client_id = new.client_id
      and verification.contact_id = (
        select contact_id from public.campaign_prospects
        where id = new.campaign_prospect_id
      )
      and verification.status in (
        'invalid', 'disposable', 'bounced', 'suppressed', 'unsubscribed'
      )
  ) then
    raise exception using errcode = '55000', message = 'Contact email is not sendable.';
  end if;

  email_hash := encode(
    extensions.digest(lower(btrim(contact_email)), 'sha256'),
    'hex'
  );
  if exists (
    select 1 from public.suppression_entries entry
    where entry.agency_id = new.agency_id
      and entry.normalized_email_hash = email_hash
      and (
        (entry.scope = 'agency' and entry.client_id is null)
        or (entry.scope = 'client' and entry.client_id = new.client_id)
      )
  ) then
    raise exception using errcode = '55000', message = 'Contact is suppressed.';
  end if;
  return new;
end;
$$;

create trigger trg_outbound_messages__compliance_preflight
before insert or update of status on public.outbound_messages
for each row execute function private.enforce_outbound_compliance();

comment on function private.enforce_outbound_compliance() is
  'Last-line database guard against scheduled or claimed sends to invalid, unsubscribed, deleted, complained or suppressed addresses.';

revoke all on function private.enforce_outbound_compliance()
  from public, anon, authenticated;
