-- Privacy-preserving remote application error monitor.
--
-- The RPC deliberately has no message, URL, user, learner, class, answer, or
-- arbitrary-context parameter. Clients can submit only a coarse surface,
-- error type, source, release, fingerprint, and sanitized stack-frame array.

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  release_id text not null,
  fingerprint text not null,
  severity text not null check (severity in ('warning', 'error', 'fatal')),
  surface text not null,
  error_type text not null,
  source text not null,
  stack_frames text[] not null default '{}',
  sample_rate numeric(5, 4) not null check (sample_rate > 0 and sample_rate <= 1),
  alert_required boolean not null default false,
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists app_error_events_release_time_idx
  on public.app_error_events (release_id, occurred_at desc);

create index if not exists app_error_events_fingerprint_time_idx
  on public.app_error_events (fingerprint, occurred_at desc);

create index if not exists app_error_events_expiry_idx
  on public.app_error_events (expires_at);

alter table public.app_error_events enable row level security;
revoke all on public.app_error_events from public, anon;
grant select on public.app_error_events to authenticated;

drop policy if exists "App admins read remote error events"
  on public.app_error_events;
create policy "App admins read remote error events"
  on public.app_error_events for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.report_app_error(
  p_client_event_id uuid,
  p_release_id text,
  p_fingerprint text,
  p_severity text,
  p_surface text,
  p_error_type text,
  p_source text,
  p_stack_frames text[],
  p_sample_rate numeric
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_payload text;
  v_recent_count integer;
  v_alert boolean;
begin
  v_payload := array_to_string(coalesce(p_stack_frames, '{}'::text[]), E'\n');

  if p_client_event_id is null
     or p_release_id !~ '^[A-Za-z0-9._:-]{1,120}$'
     or p_fingerprint !~ '^[a-f0-9]{8,64}$'
     or p_severity not in ('warning', 'error', 'fatal')
     or p_surface !~ '^[a-z0-9._:-]{1,80}$'
     or p_error_type !~ '^[A-Za-z][A-Za-z0-9._-]{0,79}$'
     or p_source !~ '^[a-z0-9._:-]{1,80}$'
     or coalesce(array_length(p_stack_frames, 1), 0) > 12
     or exists (
       select 1
       from unnest(coalesce(p_stack_frames, '{}'::text[])) frame
       where length(frame) > 300
          or frame !~ '^(assets|src)/[A-Za-z0-9._/-]+:[0-9]+:[0-9]+$'
     )
     or length(v_payload) > 3600
     or p_sample_rate <= 0
     or p_sample_rate > 1
     or v_payload ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
     or v_payload ~* '\m[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\M'
     or v_payload ~* '\m(bearer|password|answer|student_name|learner_name|class_code|access_token|refresh_token)\M[[:space:]]*[:=]'
     or v_payload ~* '\meyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
  then
    return json_build_object('ok', false, 'error', 'invalid_or_sensitive_payload');
  end if;

  select count(*) into v_recent_count
  from public.app_error_events
  where fingerprint = p_fingerprint
    and occurred_at >= now() - interval '1 minute';

  if v_recent_count >= 100 then
    return json_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_alert := p_severity = 'fatal' or v_recent_count >= 4;

  insert into public.app_error_events (
    client_event_id,
    release_id,
    fingerprint,
    severity,
    surface,
    error_type,
    source,
    stack_frames,
    sample_rate,
    alert_required
  )
  values (
    p_client_event_id,
    p_release_id,
    p_fingerprint,
    p_severity,
    p_surface,
    p_error_type,
    p_source,
    coalesce(p_stack_frames, '{}'::text[]),
    p_sample_rate,
    v_alert
  )
  on conflict (client_event_id) do nothing;

  return json_build_object(
    'ok', true,
    'alert_required', v_alert,
    'retention_days', 30
  );
end;
$$;

create or replace function public.admin_recent_error_events(p_limit integer default 25)
returns table (
  release_id text,
  severity text,
  surface text,
  error_type text,
  source text,
  fingerprint text,
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
      event.alert_required,
      event.occurred_at
    from public.app_error_events event
    where event.expires_at > now()
    order by event.occurred_at desc
    limit least(greatest(coalesce(p_limit, 25), 1), 100);
end;
$$;

create or replace function public.admin_error_monitor_summary()
returns table (
  release_id text,
  events_24h bigint,
  affected_fingerprints bigint,
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
      count(*) filter (where event.alert_required) as alerts_24h,
      max(event.occurred_at) as latest_at
    from public.app_error_events event
    where event.occurred_at >= now() - interval '24 hours'
      and event.expires_at > now()
    group by event.release_id
    order by max(event.occurred_at) desc;
end;
$$;

create or replace function public.admin_purge_expired_error_events()
returns bigint
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_deleted bigint;
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  delete from public.app_error_events
  where expires_at <= now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) from public;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

revoke execute on function public.admin_recent_error_events(integer)
  from public, anon;
revoke execute on function public.admin_error_monitor_summary()
  from public, anon;
revoke execute on function public.admin_purge_expired_error_events()
  from public, anon;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
