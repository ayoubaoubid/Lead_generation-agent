-- A hosted Supabase project can already contain Auth users before the
-- application schema is installed. The signup trigger only covers users
-- created after its installation, so provision the missing application
-- profiles explicitly and idempotently.

insert into public.profiles (id, display_name)
select
  auth_user.id,
  nullif(
    left(
      btrim(coalesce(auth_user.raw_user_meta_data ->> 'full_name', '')),
      120
    ),
    ''
  )
from auth.users as auth_user
on conflict (id) do nothing;

comment on table public.profiles is
  'Application profile paired one-to-one with auth.users; existing Auth users are backfilled during schema installation and metadata is never used for authorization.';
