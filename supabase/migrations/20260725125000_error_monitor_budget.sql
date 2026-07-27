-- Add the exact fields needed to evaluate and investigate the documented
-- fleet error budget. These functions remain administrator-only.

drop function if exists public.admin_recent_error_events(integer);

create function public.admin_recent_error_events(p_limit integer default 25)
returns table (
  release_id text,
  severity text,
  surface text,
  error_type text,
  source text,
  fingerprint text,
  stack_frames text[],
  alert_required boolean,
  occurred_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    return;
  end if;

  return query
    select
      event.release_id,
      event.severity,
      event.surface,
      event.error_type,
      event.source,
      event.fingerprint,
      event.stack_frames,
      event.alert_required,
      event.occurred_at
    from public.app_error_events event
    where event.expires_at > now()
    order by event.occurred_at desc
    limit least(greatest(coalesce(p_limit, 25), 1), 100);
end;
$$;

drop function if exists public.admin_error_monitor_summary();

create function public.admin_error_monitor_summary()
returns table (
  release_id text,
  events_24h bigint,
  affected_fingerprints bigint,
  fatal_events_24h bigint,
  alerts_24h bigint,
  latest_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    return;
  end if;

  return query
    select
      event.release_id,
      count(*) as events_24h,
      count(distinct event.fingerprint) as affected_fingerprints,
      count(*) filter (where event.severity = 'fatal') as fatal_events_24h,
      count(*) filter (where event.alert_required) as alerts_24h,
      max(event.occurred_at) as latest_at
    from public.app_error_events event
    where event.occurred_at >= now() - interval '24 hours'
      and event.expires_at > now()
    group by event.release_id
    order by max(event.occurred_at) desc;
end;
$$;

revoke execute on function public.admin_recent_error_events(integer)
  from public, anon;
revoke execute on function public.admin_error_monitor_summary()
  from public, anon;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
