create table if not exists public.public_api_rate_limits (
  scope text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0),
  primary key (scope, identifier_hash)
);

alter table public.public_api_rate_limits enable row level security;
revoke all on public.public_api_rate_limits from public, anon, authenticated;

create or replace function public.consume_public_api_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if p_scope !~ '^[a-z0-9_-]{1,80}$'
     or p_identifier_hash !~ '^[a-f0-9]{64}$'
     or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 10 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.public_api_rate_limits as limits
    (scope, identifier_hash, window_started_at, request_count)
  values (p_scope, p_identifier_hash, now(), 1)
  on conflict (scope, identifier_hash) do update
    set window_started_at = case
          when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
          else limits.request_count + 1
        end
  returning request_count <= p_limit into allowed;

  return coalesce(allowed, false);
end;
$$;

revoke all on function public.consume_public_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_api_rate_limit(text, text, integer, integer) to service_role;

create index if not exists public_api_rate_limits_window_idx
  on public.public_api_rate_limits (window_started_at);
