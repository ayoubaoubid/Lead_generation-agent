create table private.api_rate_limit_windows (
  scope text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  expires_at timestamptz not null,
  constraint pk_api_rate_limit_windows primary key (
    scope,
    subject_hash,
    window_started_at
  ),
  constraint ck_api_rate_limit_windows__scope check (
    scope ~ '^[a-z][a-z0-9._-]{2,79}$'
  ),
  constraint ck_api_rate_limit_windows__subject_hash check (
    subject_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint ck_api_rate_limit_windows__request_count check (
    request_count > 0
  ),
  constraint ck_api_rate_limit_windows__expiry check (
    expires_at > window_started_at
  )
);

comment on table private.api_rate_limit_windows is
  'Atomic server-side counters for exposed API boundaries. Subjects are SHA-256 hashed before storage.';

create index idx_api_rate_limit_windows__expiry
  on private.api_rate_limit_windows (expires_at);

revoke all on private.api_rate_limit_windows from public, anon, authenticated;

create or replace function public.service_consume_api_rate_limit(
  requested_scope text,
  requested_subject text,
  requested_limit integer,
  requested_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_scope text := lower(btrim(requested_scope));
  subject_hash text;
  current_window timestamptz;
  resulting_count integer;
begin
  if normalized_scope !~ '^[a-z][a-z0-9._-]{2,79}$'
    or requested_subject is null
    or char_length(requested_subject) not between 1 and 1000
    or requested_limit not between 1 and 10000
    or requested_window_seconds not between 1 and 86400
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid rate limit parameters.';
  end if;

  subject_hash := encode(
    extensions.digest(requested_subject, 'sha256'),
    'hex'
  );
  current_window := to_timestamp(
    floor(
      extract(epoch from statement_timestamp()) / requested_window_seconds
    ) * requested_window_seconds
  );

  insert into private.api_rate_limit_windows (
    scope,
    subject_hash,
    window_started_at,
    request_count,
    expires_at
  )
  values (
    normalized_scope,
    subject_hash,
    current_window,
    1,
    current_window + make_interval(secs => requested_window_seconds * 2)
  )
  on conflict (scope, subject_hash, window_started_at)
  do update set request_count =
    private.api_rate_limit_windows.request_count + 1
  returning request_count into resulting_count;

  return resulting_count <= requested_limit;
end;
$$;

comment on function public.service_consume_api_rate_limit(
  text, text, integer, integer
) is
  'Consumes one atomic server-side rate limit token. Callable only with the service role.';

revoke execute on function public.service_consume_api_rate_limit(
  text, text, integer, integer
) from public, anon, authenticated;
grant execute on function public.service_consume_api_rate_limit(
  text, text, integer, integer
) to service_role;
