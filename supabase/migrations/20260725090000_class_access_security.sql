-- Class access abuse controls and teacher-visible security history.
--
-- Privacy properties:
-- - raw class codes, IP addresses, device identifiers, passwords, and learner
--   identifiers are never stored in the security tables;
-- - network/device/code values are one-way fingerprints used only for bounded
--   rate-limit buckets;
-- - teachers can read events for their own classes only, and the returned log
--   contains generic event labels rather than child data.

alter table public.classes
  add column if not exists access_code_created_at timestamptz not null default now(),
  add column if not exists access_code_expires_at timestamptz;

create table if not exists public.class_access_rate_limits (
  bucket_key text primary key,
  dimension text not null check (dimension in ('device', 'network', 'code')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists class_access_rate_limits_updated_idx
  on public.class_access_rate_limits (updated_at);

alter table public.class_access_rate_limits enable row level security;
revoke all on public.class_access_rate_limits from public, anon, authenticated;

create table if not exists public.class_access_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'code_accepted',
      'code_rejected',
      'code_expired',
      'rate_limited',
      'login_succeeded',
      'login_failed',
      'login_locked',
      'code_regenerated',
      'expiry_changed'
    )
  ),
  outcome text not null check (outcome in ('allowed', 'denied', 'blocked', 'changed')),
  device_fingerprint text not null,
  network_fingerprint text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists class_access_events_class_time_idx
  on public.class_access_events (class_id, occurred_at desc);

alter table public.class_access_events enable row level security;
revoke all on public.class_access_events from public, anon;
grant select on public.class_access_events to authenticated;

drop policy if exists "Teachers read their class access events"
  on public.class_access_events;
create policy "Teachers read their class access events"
  on public.class_access_events for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

create or replace function public.class_access_fingerprint(
  p_kind text,
  p_value text
)
returns text
language sql immutable security definer
set search_path = public, extensions
as $$
  select encode(
    digest(
      'literacy-path-class-access-v1:' || coalesce(p_kind, '') || ':' || coalesce(p_value, ''),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.class_access_network_fingerprint()
returns text
language plpgsql stable security definer
set search_path = public, extensions
as $$
declare
  v_headers jsonb := '{}'::jsonb;
  v_network text := 'unknown';
begin
  begin
    v_headers := coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_network := split_part(
    coalesce(
      nullif(v_headers ->> 'cf-connecting-ip', ''),
      nullif(v_headers ->> 'x-forwarded-for', ''),
      nullif(v_headers ->> 'x-real-ip', ''),
      'unknown'
    ),
    ',',
    1
  );

  return public.class_access_fingerprint('network', btrim(v_network));
end;
$$;

create or replace function public.class_access_record_event(
  p_class_id uuid,
  p_teacher_id uuid,
  p_event_type text,
  p_outcome text,
  p_device_id text default null
)
returns void
language plpgsql volatile security definer
set search_path = public, extensions
as $$
begin
  insert into public.class_access_events (
    class_id,
    teacher_id,
    event_type,
    outcome,
    device_fingerprint,
    network_fingerprint
  )
  values (
    p_class_id,
    p_teacher_id,
    p_event_type,
    p_outcome,
    public.class_access_fingerprint('device', coalesce(p_device_id, 'server')),
    public.class_access_network_fingerprint()
  );
end;
$$;

create or replace function public.class_access_rate_limit_status(
  p_device_id text,
  p_code text
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_dimensions text[] := array['device', 'network', 'code'];
  v_values text[];
  v_thresholds integer[] := array[10, 60, 120];
  v_index integer;
  v_bucket public.class_access_rate_limits;
  v_key text;
  v_retry_seconds integer := 0;
  v_blocked_dimension text := null;
begin
  if p_device_id is null
     or p_device_id !~ '^[A-Za-z0-9._:-]{16,120}$'
  then
    return json_build_object('ok', false, 'error', 'invalid_device');
  end if;

  v_values := array[
    public.class_access_fingerprint('device', p_device_id),
    public.class_access_network_fingerprint(),
    public.class_access_fingerprint('code', upper(btrim(coalesce(p_code, ''))))
  ];

  for v_index in 1..3 loop
    v_key := public.class_access_fingerprint(
      'bucket',
      v_dimensions[v_index] || ':' || v_values[v_index]
    );

    insert into public.class_access_rate_limits (
      bucket_key,
      dimension,
      attempt_count,
      window_started_at,
      locked_until,
      updated_at
    )
    values (
      v_key,
      v_dimensions[v_index],
      1,
      now(),
      null,
      now()
    )
    on conflict (bucket_key)
    do update set
      attempt_count = case
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then 1
        else class_access_rate_limits.attempt_count + 1
      end,
      window_started_at = case
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then now()
        else class_access_rate_limits.window_started_at
      end,
      locked_until = case
        when class_access_rate_limits.locked_until > now()
          then class_access_rate_limits.locked_until
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then null
        else class_access_rate_limits.locked_until
      end,
      updated_at = now()
    returning * into v_bucket;

    if v_bucket.locked_until > now()
       or v_bucket.attempt_count > v_thresholds[v_index]
    then
      if v_bucket.locked_until is null or v_bucket.locked_until <= now() then
        update public.class_access_rate_limits
        set locked_until = now() + interval '2 minutes',
            updated_at = now()
        where bucket_key = v_key
        returning * into v_bucket;
      end if;

      if v_blocked_dimension is null then
        v_blocked_dimension := v_dimensions[v_index];
      end if;
      v_retry_seconds := greatest(
        v_retry_seconds,
        ceil(extract(epoch from (v_bucket.locked_until - now())))::integer
      );
    end if;
  end loop;

  if v_blocked_dimension is not null then
    return json_build_object(
      'ok', false,
      'error', 'rate_limited',
      'dimension', v_blocked_dimension,
      'retry_seconds', greatest(v_retry_seconds, 1)
    );
  end if;

  return json_build_object('ok', true);
end;
$$;

-- Replace the roster lookup with the non-bypassable device-aware signature.
create or replace function public.student_class_by_code(
  p_code text,
  p_device_id text
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_class public.classes;
  v_students json;
  v_school json;
  v_limit json;
begin
  v_limit := public.class_access_rate_limit_status(p_device_id, p_code);

  select * into v_class
  from public.classes
  where access_code = upper(btrim(coalesce(p_code, '')));

  if coalesce((v_limit ->> 'ok')::boolean, false) is false then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'rate_limited',
      'blocked',
      p_device_id
    );
    return v_limit;
  end if;

  if v_class.id is null then
    perform public.class_access_record_event(
      null,
      null,
      'code_rejected',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_class.access_code_expires_at is not null
     and v_class.access_code_expires_at <= now()
  then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'code_expired',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'code_expired');
  end if;

  select json_agg(
           json_build_object(
             'id', s.id,
             'name', s.name,
             'has_password', (s.symbol_password is not null)
           )
           order by s.name
         )
  into v_students
  from public.students s
  where s.class_id = v_class.id
    and s.archived_at is null;

  select json_build_object('id', sc.id, 'name', sc.name)
  into v_school
  from public.schools sc
  where sc.id = v_class.school_id;

  perform public.class_access_record_event(
    v_class.id,
    v_class.teacher_id,
    'code_accepted',
    'allowed',
    p_device_id
  );

  return json_build_object(
    'ok', true,
    'class', json_build_object('id', v_class.id, 'name', v_class.name),
    'school', v_school,
    'students', coalesce(v_students, '[]'::json)
  );
end;
$$;

-- Replace student login with a device-aware overload. The previous two-argument
-- signature is retained only for migration compatibility and is not executable
-- by app roles, preventing a caller from bypassing these controls.
create or replace function public.student_login(
  p_student_id uuid,
  p_sequence text,
  p_device_id text,
  p_code text
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_class public.classes;
  v_token text;
  v_limit json;
begin
  select * into v_student
  from public.students
  where id = p_student_id
  for update;

  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_class
  from public.classes
  where id = v_student.class_id;

  v_limit := public.class_access_rate_limit_status(p_device_id, p_code);
  if coalesce((v_limit ->> 'ok')::boolean, false) is false then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'rate_limited',
      'blocked',
      p_device_id
    );
    return v_limit;
  end if;

  if v_class.access_code is distinct from upper(btrim(coalesce(p_code, ''))) then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'code_rejected',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_class.access_code_expires_at is not null
     and v_class.access_code_expires_at <= now()
  then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'code_expired',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'code_expired');
  end if;

  if v_student.symbol_password is null then
    return json_build_object('ok', false, 'error', 'no_password');
  end if;

  if v_student.failed_login_count >= 5
     and v_student.last_failed_login_at > now() - interval '60 seconds'
  then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'login_locked',
      'blocked',
      p_device_id
    );
    return json_build_object(
      'ok', false,
      'error', 'locked',
      'retry_seconds',
      greatest(
        ceil(extract(epoch from (
          v_student.last_failed_login_at + interval '60 seconds' - now()
        )))::integer,
        1
      )
    );
  end if;

  if p_sequence !~ '^[1-9]{3}$'
     or v_student.symbol_password <> p_sequence
  then
    update public.students
    set failed_login_count = case
          when last_failed_login_at is null
            or last_failed_login_at < now() - interval '60 seconds'
          then 1
          else failed_login_count + 1
        end,
        last_failed_login_at = now()
    where id = p_student_id;

    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'login_failed',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'wrong_password');
  end if;

  update public.students
  set failed_login_count = 0,
      last_failed_login_at = null
  where id = p_student_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token)
  values (p_student_id, v_token);

  perform public.class_access_record_event(
    v_class.id,
    v_class.teacher_id,
    'login_succeeded',
    'allowed',
    p_device_id
  );

  return json_build_object(
    'ok', true,
    'token', v_token,
    'student_id', v_student.id,
    'student_name', v_student.name,
    'class_id', v_student.class_id,
    'teacher_id', v_student.teacher_id,
    'school_id', v_class.school_id
  );
end;
$$;

create or replace function public.teacher_regenerate_class_code(p_class_id uuid)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid;
  v_code text;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid()
     and not public.is_app_admin(auth.uid())
  then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_code := public.gen_class_access_code();
  update public.classes
  set access_code = v_code,
      access_code_created_at = now(),
      access_code_expires_at = case
        when access_code_expires_at <= now() then null
        else access_code_expires_at
      end
  where id = p_class_id;

  perform public.class_access_record_event(
    p_class_id,
    v_owner,
    'code_regenerated',
    'changed',
    null
  );

  return json_build_object('ok', true, 'access_code', v_code);
end;
$$;

create or replace function public.teacher_set_class_code_expiry(
  p_class_id uuid,
  p_expires_at timestamptz
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid()
     and not public.is_app_admin(auth.uid())
  then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;
  if p_expires_at is not null
     and (
       p_expires_at < now() + interval '1 hour'
       or p_expires_at > now() + interval '365 days'
     )
  then
    return json_build_object('ok', false, 'error', 'invalid_expiry');
  end if;

  update public.classes
  set access_code_expires_at = p_expires_at
  where id = p_class_id;

  perform public.class_access_record_event(
    p_class_id,
    v_owner,
    'expiry_changed',
    'changed',
    null
  );

  return json_build_object(
    'ok', true,
    'access_code_expires_at', p_expires_at
  );
end;
$$;

create or replace function public.teacher_class_access_summary(p_class_id uuid)
returns json
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_denied integer;
  v_blocked integer;
  v_allowed integer;
  v_latest timestamptz;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid()
     and not public.is_app_admin(auth.uid())
  then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  select
    count(*) filter (where outcome = 'denied'),
    count(*) filter (where outcome = 'blocked'),
    count(*) filter (where outcome = 'allowed'),
    max(occurred_at)
  into v_denied, v_blocked, v_allowed, v_latest
  from public.class_access_events
  where class_id = p_class_id
    and occurred_at >= now() - interval '24 hours';

  return json_build_object(
    'ok', true,
    'allowed', coalesce(v_allowed, 0),
    'denied', coalesce(v_denied, 0),
    'blocked', coalesce(v_blocked, 0),
    'anomaly', coalesce(v_blocked, 0) > 0 or coalesce(v_denied, 0) >= 5,
    'latest_at', v_latest
  );
end;
$$;

create or replace function public.teacher_class_access_log(
  p_class_id uuid,
  p_limit integer default 20
)
returns table (
  event_type text,
  outcome text,
  occurred_at timestamptz,
  device_label text
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null
     or (
       v_owner is distinct from auth.uid()
       and not public.is_app_admin(auth.uid())
     )
  then
    return;
  end if;

  return query
    select
      event.event_type,
      event.outcome,
      event.occurred_at,
      'Device ' || upper(substr(event.device_fingerprint, 1, 6))
    from public.class_access_events event
    where event.class_id = p_class_id
    order by event.occurred_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

revoke execute on function public.class_access_fingerprint(text, text)
  from public, anon, authenticated;
revoke execute on function public.class_access_network_fingerprint()
  from public, anon, authenticated;
revoke execute on function public.class_access_record_event(uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.class_access_rate_limit_status(text, text)
  from public, anon, authenticated;

revoke execute on function public.student_class_by_code(text)
  from public, anon, authenticated;
revoke execute on function public.student_login(uuid, text)
  from public, anon, authenticated;

grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
