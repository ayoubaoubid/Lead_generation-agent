begin;

select plan(7);

select has_table(
  'private',
  'api_rate_limit_windows',
  'the private rate limit ledger exists'
);

select has_function(
  'public',
  'service_consume_api_rate_limit',
  array['text', 'text', 'integer', 'integer'],
  'the service rate limit function exists'
);

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);

select ok(
  public.service_consume_api_rate_limit(
    'webhook.inbound',
    '198.51.100.22',
    2,
    60
  ),
  'the first request is allowed'
);

select ok(
  public.service_consume_api_rate_limit(
    'webhook.inbound',
    '198.51.100.22',
    2,
    60
  ),
  'the request at the limit is allowed'
);

select is(
  public.service_consume_api_rate_limit(
    'webhook.inbound',
    '198.51.100.22',
    2,
    60
  ),
  false,
  'the request above the limit is rejected atomically'
);

select ok(
  public.service_consume_api_rate_limit(
    'imports.prepare',
    '198.51.100.22',
    2,
    60
  ),
  'independent scopes have independent counters'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_like(
  $$
    select public.service_consume_api_rate_limit(
      'webhook.inbound',
      '198.51.100.23',
      2,
      60
    )
  $$,
  '%permission denied%',
  'authenticated users cannot consume privileged rate limits directly'
);

select * from finish();
rollback;
