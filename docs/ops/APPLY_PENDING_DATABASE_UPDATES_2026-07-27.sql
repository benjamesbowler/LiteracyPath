-- ===========================================================================
-- LiteracyPath — apply the pending database updates
-- Assembled 2026-07-27 from supabase/migrations/. Safe to run more than once.
-- ===========================================================================
--
-- WHY YOU ARE RUNNING THIS
-- Deleting a child from the class list failed with "Could not find the function
-- public.teacher_prepare_learner_deletion(...) in the schema cache". That
-- message means the database has never been given the update that CREATED that
-- function. The app code was always correct; the database was behind.
--
-- HOW TO RUN IT
--   1. Open your Supabase project, then SQL Editor, then New query.
--   2. Paste this whole file in.
--   3. Press Run. It takes a few seconds.
--   4. Scroll to the bottom of this file and run the CHECK query separately.
--
-- IS IT SAFE TO RUN TWICE?
-- Yes. Every statement is written to be repeatable: tables are created only if
-- absent, policies and triggers are dropped before being recreated, and
-- functions are replaced rather than added. Running it on a database that is
-- already up to date changes nothing.
--
-- WHAT IT DOES NOT DO
-- It does not delete or modify any child's data. It only adds and updates the
-- functions, tables and rules the app calls.
-- ===========================================================================

begin;

-- ==== 20260725085000_students_lifecycle_columns.sql =====================

-- Add the two student lifecycle columns BEFORE anything reads them.
--
-- Why this file exists
-- --------------------
-- 20260725145000_teacher_child_lifecycle.sql adds students.archived_at and
-- students.updated_at, but three earlier migrations already reference them:
--
--   20260725090000_class_access_security.sql   reads s.archived_at
--   20260725110000_learner_data_rights.sql     reads v_student.archived_at
--   20260725120000_school_retention_policy.sql reads s.updated_at
--
-- On a database that already had the columns this was invisible. Applying the
-- set in order to a database that did NOT have them fails at
-- retention_last_learner_activity with:
--
--   ERROR: 42703: column s.updated_at does not exist
--
-- because PostgreSQL validates the body of a `language sql` function when the
-- function is created, not when it is called. Observed on 2026-07-27 against
-- the hosted project.
--
-- The columns are declared once, first, so no later migration can depend on a
-- column that does not exist yet. 20260725145000 still declares them too; both
-- are `if not exists`, so running either order is safe.

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.students.archived_at is
  'When the teacher archived this child. Null means active.';
comment on column public.students.updated_at is
  'Last change to the student row. Used by retention to find the last activity.';

-- ==== 20260725090000_class_access_security.sql ==========================

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

-- ==== 20260725100000_remote_error_monitoring.sql ========================

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

-- ==== 20260725110000_learner_data_rights.sql ============================

-- Verified learner data-rights export and deletion.
--
-- Requests and audit events deliberately retain no learner name, raw learner
-- ID, credential, answer, or report content. The irreversible subject_ref lets
-- an authorised requester prove that the requested learner was handled without
-- leaving the deleted identity in the audit trail.

create table if not exists public.data_rights_requests (
  id uuid primary key default gen_random_uuid(),
  subject_ref text not null check (subject_ref ~ '^[0-9a-f]{64}$'),
  -- These opaque ownership identifiers intentionally have no cascading
  -- foreign keys. A class or account deletion must not erase the evidence
  -- that a data-rights request was handled.
  teacher_id uuid not null,
  class_id uuid not null,
  school_id uuid references public.schools(id) on delete set null,
  request_type text not null
    check (request_type in ('access_export', 'correction', 'deletion', 'restriction')),
  requester_role text not null
    check (requester_role in ('school', 'parent_guardian', 'learner')),
  verification_method text not null
    check (verification_method in (
      'school_record_match',
      'verified_parent_via_school',
      'authorised_school_official'
    )),
  verification_status text not null default 'verified'
    check (verification_status in ('pending', 'verified', 'rejected')),
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'completed', 'rejected')),
  due_at timestamptz not null,
  completed_at timestamptz,
  outcome_counts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(outcome_counts) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists data_rights_requests_teacher_created_idx
  on public.data_rights_requests (teacher_id, created_at desc);
create index if not exists data_rights_requests_due_idx
  on public.data_rights_requests (status, due_at)
  where status in ('received', 'in_progress');
create index if not exists data_rights_requests_subject_idx
  on public.data_rights_requests (subject_ref, created_at desc);

create table if not exists public.data_rights_audit_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.data_rights_requests(id) on delete cascade,
  teacher_id uuid not null,
  actor_id uuid not null,
  event_type text not null
    check (event_type in (
      'request_verified',
      'export_completed',
      'deletion_started',
      'deletion_completed',
      'request_rejected'
    )),
  event_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(details) = 'object'
      and octet_length(details::text) <= 4096
    )
);

create index if not exists data_rights_audit_request_time_idx
  on public.data_rights_audit_events (request_id, event_at, id);
create index if not exists data_rights_audit_teacher_time_idx
  on public.data_rights_audit_events (teacher_id, event_at desc);

alter table public.data_rights_requests enable row level security;
alter table public.data_rights_audit_events enable row level security;

revoke all on public.data_rights_requests from anon, authenticated;
revoke all on public.data_rights_audit_events from anon, authenticated;
grant select on public.data_rights_requests to authenticated;
grant select on public.data_rights_audit_events to authenticated;

drop policy if exists "Teachers read owned data rights requests"
  on public.data_rights_requests;
create policy "Teachers read owned data rights requests"
  on public.data_rights_requests for select to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists "Teachers read owned data rights audit events"
  on public.data_rights_audit_events;
create policy "Teachers read owned data rights audit events"
  on public.data_rights_audit_events for select to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()));

create or replace function public.data_rights_subject_ref(
  p_student_id uuid,
  p_created_at timestamptz
)
returns text
language sql
immutable
strict
set search_path = public, extensions
as $$
  select encode(
    digest(
      convert_to(p_student_id::text || ':' || p_created_at::text, 'utf8'),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.data_rights_subject_ref(uuid, timestamptz)
  from public, anon, authenticated;

create or replace function public.assert_learner_data_rights_actor(
  p_student_id uuid
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required';
  end if;

  select s.*
  into v_student
  from public.students s
  where s.id = p_student_id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update;

  if not found then
    raise exception 'An owned learner was not found';
  end if;

  return v_student;
end;
$$;

revoke all on function public.assert_learner_data_rights_actor(uuid)
  from public, anon, authenticated;

create or replace function public.assert_data_rights_request_inputs(
  p_requester_role text,
  p_verification_method text
)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_requester_role is null
    or p_requester_role not in ('school', 'parent_guardian', 'learner')
  then
    raise exception 'A supported requester role is required';
  end if;

  if p_verification_method is null
    or p_verification_method not in (
      'school_record_match',
      'verified_parent_via_school',
      'authorised_school_official'
    )
  then
    raise exception 'A supported identity verification method is required';
  end if;
end;
$$;

revoke all on function public.assert_data_rights_request_inputs(text, text)
  from public, anon, authenticated;

create or replace function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_class public.classes;
  v_subject_ref text;
  v_request public.data_rights_requests;
  v_package jsonb;
begin
  perform public.assert_data_rights_request_inputs(
    p_requester_role,
    p_verification_method
  );
  v_student := public.assert_learner_data_rights_actor(p_student_id);

  select c.*
  into strict v_class
  from public.classes c
  where c.id = v_student.class_id;

  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  insert into public.data_rights_requests (
    subject_ref,
    teacher_id,
    class_id,
    school_id,
    request_type,
    requester_role,
    verification_method,
    verification_status,
    status,
    due_at,
    completed_at
  )
  values (
    v_subject_ref,
    v_student.teacher_id,
    v_student.class_id,
    v_class.school_id,
    'access_export',
    p_requester_role,
    p_verification_method,
    'verified',
    'completed',
    now() + interval '30 days',
    now()
  )
  returning * into v_request;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'request_verified',
    jsonb_build_object('requestType', 'access_export')
  );

  v_package := jsonb_build_object(
    'schemaVersion', 1,
    'request', jsonb_build_object(
      'id', v_request.id,
      'subjectRef', v_subject_ref,
      'requestType', v_request.request_type,
      'requesterRole', v_request.requester_role,
      'verificationMethod', v_request.verification_method,
      'status', v_request.status,
      'dueAt', v_request.due_at,
      'createdAt', v_request.created_at,
      'completedAt', v_request.completed_at,
      'responseTargetDays', 30
    ),
    'learner', jsonb_build_object(
      'id', v_student.id,
      'displayName', v_student.name,
      'classId', v_student.class_id,
      'className', v_class.name,
      'teacherId', v_student.teacher_id,
      'archivedAt', v_student.archived_at,
      'createdAt', v_student.created_at,
      'updatedAt', v_student.updated_at,
      'pictureCredentialConfigured',
        nullif(btrim(coalesce(v_student.symbol_password, '')), '') is not null
    ),
    'answers', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.answered_at, a.id)
      from public.answers a
      where a.student_id = v_student.id
    ), '[]'::jsonb),
    'mastery', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.updated_at, m.id)
      from public.mastery m
      where m.student_id = v_student.id
    ), '[]'::jsonb),
    'itemMastery', coalesce((
      select jsonb_agg(to_jsonb(im) order by im.updated_at, im.id)
      from public.item_mastery im
      where im.student_id = v_student.id
    ), '[]'::jsonb),
    'progress', coalesce((
      select jsonb_agg(to_jsonb(sp) order by sp.updated_at, sp.id)
      from public.student_progress sp
      where sp.student_id = v_student.id
    ), '[]'::jsonb),
    'learningActivity', coalesce((
      select jsonb_agg(to_jsonb(la) order by la.created_at, la.id)
      from public.learn_activity la
      where la.student_id = v_student.id
    ), '[]'::jsonb),
    'syncHealth', coalesce((
      select jsonb_agg(
        to_jsonb(sh) - 'device_id'
        order by sh.observed_at, sh.student_id
      )
      from public.activity_sync_health sh
      where sh.student_id = v_student.id
    ), '[]'::jsonb),
    'assessmentAttempts', coalesce((
      select jsonb_agg(to_jsonb(aa) order by aa.completed_at, aa.attempt_id)
      from public.assessment_attempts aa
      where aa.student_id = v_student.id::text
    ), '[]'::jsonb),
    'individualReports', coalesce((
      select jsonb_agg(to_jsonb(er) order by er.generated_at, er.report_id)
      from public.el_assessment_reports er
      where er.student_id = v_student.id::text
    ), '[]'::jsonb),
    'classReportReferences', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reportId', er.report_id,
          'reportType', er.report_type,
          'generatedAt', er.generated_at,
          'schemaVersion', er.schema_version
        )
        order by er.generated_at, er.report_id
      )
      from public.el_assessment_reports er
      where er.teacher_id = v_student.teacher_id
        and (
          er.payload::text like '%' || v_student.id::text || '%'
          or er.summary::text like '%' || v_student.id::text || '%'
        )
    ), '[]'::jsonb),
    'interventions', coalesce((
      select jsonb_agg(
        to_jsonb(ti) - 'student_ids'
        order by ti.created_at, ti.id
      )
      from public.teacher_interventions ti
      where v_student.id = any(ti.student_ids)
    ), '[]'::jsonb),
    'instructionalGroupReviews', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reviewId', gr.id,
          'groupId', gr.group_id,
          'reviewedAt', gr.reviewed_at,
          'evidenceSnapshot', gr.evidence_snapshot
        )
        order by gr.reviewed_at, gr.id
      )
      from public.teacher_instructional_group_reviews gr
      where v_student.id = any(gr.student_ids)
    ), '[]'::jsonb),
    'teacherObservations', coalesce((
      select jsonb_agg(
        to_jsonb(io) - 'student_ids'
        order by io.observed_at, io.id
      )
      from public.teacher_insight_observations io
      where v_student.id = any(io.student_ids)
    ), '[]'::jsonb),
    'sessionHistory', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'createdAt', ss.created_at,
          'expiresAt', ss.expires_at,
          'revoked', ss.revoked
        )
        order by ss.created_at
      )
      from public.student_sessions ss
      where ss.student_id = v_student.id
    ), '[]'::jsonb)
  );

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'export_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'sections', jsonb_object_length(v_package)
    )
  );

  return v_package;
end;
$$;

create or replace function public.teacher_list_learner_data_rights(
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_subject_ref text;
begin
  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  return jsonb_build_object(
    'subjectRef', v_subject_ref,
    'requests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', dr.id,
          'requestType', dr.request_type,
          'requesterRole', dr.requester_role,
          'verificationMethod', dr.verification_method,
          'verificationStatus', dr.verification_status,
          'status', dr.status,
          'dueAt', dr.due_at,
          'completedAt', dr.completed_at,
          'createdAt', dr.created_at,
          'events', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'eventType', dae.event_type,
                'eventAt', dae.event_at
              )
              order by dae.event_at, dae.id
            )
            from public.data_rights_audit_events dae
            where dae.request_id = dr.id
          ), '[]'::jsonb)
        )
        order by dr.created_at desc, dr.id desc
      )
      from public.data_rights_requests dr
      where dr.subject_ref = v_subject_ref
        and (
          dr.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.teacher_prepare_learner_deletion(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_class public.classes;
  v_subject_ref text;
  v_request public.data_rights_requests;
begin
  perform public.assert_data_rights_request_inputs(
    p_requester_role,
    p_verification_method
  );
  v_student := public.assert_learner_data_rights_actor(p_student_id);

  select c.*
  into strict v_class
  from public.classes c
  where c.id = v_student.class_id;

  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  insert into public.data_rights_requests (
    subject_ref,
    teacher_id,
    class_id,
    school_id,
    request_type,
    requester_role,
    verification_method,
    verification_status,
    status,
    due_at
  )
  values (
    v_subject_ref,
    v_student.teacher_id,
    v_student.class_id,
    v_class.school_id,
    'deletion',
    p_requester_role,
    p_verification_method,
    'verified',
    'in_progress',
    now() + interval '30 days'
  )
  returning * into v_request;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'request_verified',
    jsonb_build_object('requestType', 'deletion')
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_subject_ref,
    'status', v_request.status,
    'dueAt', v_request.due_at,
    'responseTargetDays', 30,
    'confirmationPhrase', 'DELETE LEARNER DATA'
  );
end;
$$;

create or replace function public.teacher_delete_learner_data(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_request public.data_rights_requests;
  v_expected_ref text;
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
begin
  if p_confirmation is distinct from 'DELETE LEARNER DATA' then
    raise exception 'The exact deletion confirmation phrase is required';
  end if;

  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_expected_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  if p_subject_ref is distinct from v_expected_ref then
    raise exception 'The deletion subject reference does not match the learner';
  end if;

  select dr.*
  into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = v_expected_ref
    and dr.teacher_id = v_student.teacher_id
    and dr.class_id = v_student.class_id
    and dr.request_type = 'deletion'
    and dr.verification_status = 'verified'
    and dr.status = 'in_progress'
  for update;

  if not found then
    raise exception 'A verified in-progress deletion request was not found';
  end if;

  -- These tables contain text, array, or JSON references rather than a
  -- student foreign key. The short write lock closes the race where another
  -- session could recreate learner evidence between cleanup and verification.
  lock table public.assessment_attempts in share row exclusive mode;
  lock table public.el_assessment_reports in share row exclusive mode;
  lock table public.teacher_interventions in share row exclusive mode;
  lock table public.teacher_instructional_group_reviews in share row exclusive mode;
  lock table public.teacher_insight_observations in share row exclusive mode;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_started',
    jsonb_build_object('schemaVersion', 1)
  );

  delete from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('teacherObservations', v_count);

  delete from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('instructionalGroupReviews', v_count);

  update public.teacher_interventions ti
  set student_ids = array_remove(ti.student_ids, v_student.id)
  where v_student.id = any(ti.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('interventionsUpdated', v_count);

  delete from public.el_assessment_reports er
  where er.student_id = v_student.id::text
    or er.payload::text like '%' || v_student.id::text || '%'
    or er.summary::text like '%' || v_student.id::text || '%';
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentReports', v_count);

  delete from public.assessment_attempts aa
  where aa.student_id = v_student.id::text;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentAttempts', v_count);

  select
    v_counts || jsonb_build_object(
      'answers', (select count(*) from public.answers a where a.student_id = v_student.id),
      'mastery', (select count(*) from public.mastery m where m.student_id = v_student.id),
      'itemMastery', (select count(*) from public.item_mastery im where im.student_id = v_student.id),
      'progress', (select count(*) from public.student_progress sp where sp.student_id = v_student.id),
      'learningActivity', (select count(*) from public.learn_activity la where la.student_id = v_student.id),
      'syncHealth', (select count(*) from public.activity_sync_health sh where sh.student_id = v_student.id),
      'sessions', (select count(*) from public.student_sessions ss where ss.student_id = v_student.id)
    )
  into strict v_counts;

  delete from public.students s
  where s.id = v_student.id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    );

  if not found then
    raise exception 'Learner deletion did not complete';
  end if;

  if exists (
    select 1 from public.answers a where a.student_id = p_student_id
    union all
    select 1 from public.mastery m where m.student_id = p_student_id
    union all
    select 1 from public.item_mastery im where im.student_id = p_student_id
    union all
    select 1 from public.student_progress sp where sp.student_id = p_student_id
    union all
    select 1 from public.learn_activity la where la.student_id = p_student_id
    union all
    select 1 from public.activity_sync_health sh where sh.student_id = p_student_id
    union all
    select 1 from public.student_sessions ss where ss.student_id = p_student_id
    union all
    select 1 from public.assessment_attempts aa where aa.student_id = p_student_id::text
    union all
    select 1 from public.el_assessment_reports er
      where er.student_id = p_student_id::text
        or er.payload::text like '%' || p_student_id::text || '%'
        or er.summary::text like '%' || p_student_id::text || '%'
    union all
    select 1 from public.teacher_interventions ti where p_student_id = any(ti.student_ids)
    union all
    select 1 from public.teacher_instructional_group_reviews gr where p_student_id = any(gr.student_ids)
    union all
    select 1 from public.teacher_insight_observations io where p_student_id = any(io.student_ids)
  ) then
    raise exception 'Learner deletion verification found residual managed records';
  end if;

  update public.data_rights_requests
  set
    status = 'completed',
    completed_at = now(),
    outcome_counts = v_counts,
    updated_at = now()
  where id = v_request.id;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'residualManagedRecords', 0
    )
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_expected_ref,
    'status', 'completed',
    'completedAt', now(),
    'deletedCounts', v_counts,
    'residualManagedRecords', 0
  );
end;
$$;

grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;

revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon;
revoke all on function public.teacher_list_learner_data_rights(uuid)
  from public, anon;
revoke all on function public.teacher_prepare_learner_deletion(uuid, text, text)
  from public, anon;
revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon;

comment on table public.data_rights_requests is
  'Privacy-minimal access/correction/deletion/restriction request tracking with a 30-day operational response target.';
comment on table public.data_rights_audit_events is
  'Append-only actor/action audit events with no learner identity or record content.';
comment on function public.teacher_export_learner_data(uuid, text, text) is
  'Exports one owned learner record after an explicit identity-verification declaration and records completion.';
comment on function public.teacher_list_learner_data_rights(uuid) is
  'Lists the privacy-minimal request and event history for one currently owned learner.';
comment on function public.teacher_prepare_learner_deletion(uuid, text, text) is
  'Creates a verified, tracked learner deletion request and returns its irreversible subject reference.';
comment on function public.teacher_delete_learner_data(uuid, uuid, text, text) is
  'Atomically removes all managed learner records and embedded group references, then records a privacy-safe tombstone.';

-- ==== 20260725120000_school_retention_policy.sql ========================

-- School-configurable retention, end-of-year handling, and deletion propagation.
--
-- Defaults are operational safeguards, not a legal conclusion. An authorised
-- app administrator records the school instruction, previews every run, and
-- must provide an exact destructive confirmation before records are removed.

create table if not exists public.school_retention_policies (
  school_id uuid primary key references public.schools(id) on delete cascade,
  inactive_after_days integer not null default 365
    check (inactive_after_days between 90 and 2555),
  archived_delete_after_days integer not null default 90
    check (archived_delete_after_days between 7 and 730),
  end_of_year_action text not null default 'archive'
    check (end_of_year_action in ('archive', 'delete')),
  academic_year_end_month integer not null default 7
    check (academic_year_end_month between 1 and 12),
  provider_expiry_days integer not null default 30
    check (provider_expiry_days between 1 and 365),
  backup_expiry_days integer not null default 35
    check (backup_expiry_days between 1 and 365),
  last_end_of_year_applied integer,
  policy_version integer not null default 1 check (policy_version = 1),
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deletion_propagation_records (
  request_id uuid primary key
    references public.data_rights_requests(id) on delete restrict,
  subject_ref text not null check (subject_ref ~ '^[0-9a-f]{64}$'),
  school_id uuid,
  active_systems_deleted_at timestamptz not null,
  provider_expires_at timestamptz not null,
  backup_expires_at timestamptz not null,
  status text not null default 'awaiting_expiry'
    check (status in ('awaiting_expiry', 'evidence_required', 'expired_verified')),
  evidence_reference text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      status in ('awaiting_expiry', 'evidence_required')
      and evidence_reference is null
      and verified_at is null
      and verified_by is null
    )
    or
    (
      status = 'expired_verified'
      and char_length(btrim(evidence_reference)) between 8 and 500
      and verified_at is not null
      and verified_by is not null
    )
  )
);

create table if not exists public.retention_job_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  actor_id uuid not null,
  policy_snapshot jsonb not null,
  preview_snapshot jsonb not null,
  archived_learners integer not null default 0 check (archived_learners >= 0),
  deleted_learners integer not null default 0 check (deleted_learners >= 0),
  propagation_records_due integer not null default 0
    check (propagation_records_due >= 0),
  completed_at timestamptz not null default now()
);

create index if not exists deletion_propagation_expiry_idx
  on public.deletion_propagation_records (status, provider_expires_at, backup_expires_at);
create index if not exists deletion_propagation_school_idx
  on public.deletion_propagation_records (school_id, created_at desc);

alter table public.school_retention_policies enable row level security;
alter table public.deletion_propagation_records enable row level security;
alter table public.retention_job_runs enable row level security;

revoke all on public.school_retention_policies from anon, authenticated;
revoke all on public.deletion_propagation_records from anon, authenticated;
revoke all on public.retention_job_runs from anon, authenticated;
grant select on public.school_retention_policies to authenticated;
grant select on public.deletion_propagation_records to authenticated;
grant select on public.retention_job_runs to authenticated;

drop policy if exists "App admins read school retention policies"
  on public.school_retention_policies;
create policy "App admins read school retention policies"
  on public.school_retention_policies for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins read deletion propagation"
  on public.deletion_propagation_records;
create policy "App admins read deletion propagation"
  on public.deletion_propagation_records for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins read retention job runs"
  on public.retention_job_runs;
create policy "App admins read retention job runs"
  on public.retention_job_runs for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.assert_retention_admin()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_app_admin(v_actor_id) then
    raise exception 'App administrator access is required';
  end if;
  return v_actor_id;
end;
$$;

revoke all on function public.assert_retention_admin()
  from public, anon, authenticated;

create or replace function public.ensure_school_retention_policy(
  p_school_id uuid
)
returns public.school_retention_policies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_policy public.school_retention_policies;
begin
  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'School not found';
  end if;

  insert into public.school_retention_policies (
    school_id,
    last_end_of_year_applied,
    updated_by
  )
  values (
    p_school_id,
    extract(year from public.retention_latest_year_end(7, current_date))::integer,
    v_actor_id
  )
  on conflict (school_id) do nothing;

  select *
  into strict v_policy
  from public.school_retention_policies
  where school_id = p_school_id;

  return v_policy;
end;
$$;

revoke all on function public.ensure_school_retention_policy(uuid)
  from public, anon, authenticated;

create or replace function public.retention_latest_year_end(
  p_month integer,
  p_today date default current_date
)
returns date
language sql
immutable
strict
set search_path = public
as $$
  select case
    when p_today >= (
      date_trunc('month', make_date(extract(year from p_today)::integer, p_month, 1))
      + interval '1 month - 1 day'
    )::date
    then (
      date_trunc('month', make_date(extract(year from p_today)::integer, p_month, 1))
      + interval '1 month - 1 day'
    )::date
    else (
      date_trunc('month', make_date(extract(year from p_today)::integer - 1, p_month, 1))
      + interval '1 month - 1 day'
    )::date
  end;
$$;

revoke all on function public.retention_latest_year_end(integer, date)
  from public, anon, authenticated;

create or replace function public.retention_last_learner_activity(
  p_student_id uuid
)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    s.updated_at,
    (select max(a.answered_at) from public.answers a where a.student_id = s.id),
    (select max(m.updated_at) from public.mastery m where m.student_id = s.id),
    (select max(im.updated_at) from public.item_mastery im where im.student_id = s.id),
    (select max(sp.updated_at) from public.student_progress sp where sp.student_id = s.id),
    (
      select max(greatest(la.created_at, coalesce(la.occurred_at, la.created_at)))
      from public.learn_activity la
      where la.student_id = s.id
    ),
    (select max(ss.created_at) from public.student_sessions ss where ss.student_id = s.id),
    (select max(aa.completed_at) from public.assessment_attempts aa where aa.student_id = s.id::text)
  )
  from public.students s
  where s.id = p_student_id;
$$;

revoke all on function public.retention_last_learner_activity(uuid)
  from public, anon, authenticated;

create or replace function public.admin_get_school_retention_policy(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
begin
  v_policy := public.ensure_school_retention_policy(p_school_id);
  return to_jsonb(v_policy);
end;
$$;

create or replace function public.admin_save_school_retention_policy(
  p_school_id uuid,
  p_inactive_after_days integer,
  p_archived_delete_after_days integer,
  p_end_of_year_action text,
  p_academic_year_end_month integer,
  p_provider_expiry_days integer,
  p_backup_expiry_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_policy public.school_retention_policies;
begin
  perform public.ensure_school_retention_policy(p_school_id);

  update public.school_retention_policies
  set
    inactive_after_days = p_inactive_after_days,
    archived_delete_after_days = p_archived_delete_after_days,
    end_of_year_action = p_end_of_year_action,
    academic_year_end_month = p_academic_year_end_month,
    provider_expiry_days = p_provider_expiry_days,
    backup_expiry_days = p_backup_expiry_days,
    updated_by = v_actor_id,
    updated_at = now()
  where school_id = p_school_id
  returning * into strict v_policy;

  return to_jsonb(v_policy);
end;
$$;

create or replace function public.admin_preview_school_retention(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
  v_year_end date;
  v_year integer;
  v_end_of_year_due boolean;
  v_inactive integer;
  v_archived_due integer;
  v_end_of_year integer;
  v_propagation_pending integer;
  v_propagation_due integer;
  v_now timestamptz := now();
begin
  v_policy := public.ensure_school_retention_policy(p_school_id);
  v_year_end := public.retention_latest_year_end(
    v_policy.academic_year_end_month,
    v_now::date
  );
  v_year := extract(year from v_year_end)::integer;
  v_end_of_year_due := coalesce(v_policy.last_end_of_year_applied, 0) < v_year;

  select count(*)
  into v_inactive
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is null
    and public.retention_last_learner_activity(s.id)
      <= v_now - make_interval(days => v_policy.inactive_after_days);

  select count(*)
  into v_archived_due
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is not null
    and s.archived_at
      <= v_now - make_interval(days => v_policy.archived_delete_after_days);

  select case when v_end_of_year_due then count(*) else 0 end
  into v_end_of_year
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is null;

  select count(*)
  into v_propagation_pending
  from public.deletion_propagation_records dpr
  where dpr.school_id = p_school_id
    and dpr.status = 'awaiting_expiry';

  select count(*)
  into v_propagation_due
  from public.deletion_propagation_records dpr
  where dpr.school_id = p_school_id
    and (
      dpr.status = 'evidence_required'
      or (
        dpr.status = 'awaiting_expiry'
        and dpr.provider_expires_at <= v_now
        and dpr.backup_expires_at <= v_now
      )
    );

  return jsonb_build_object(
    'schoolId', p_school_id,
    'previewedAt', v_now,
    'policy', jsonb_build_object(
      'inactiveAfterDays', v_policy.inactive_after_days,
      'archivedDeleteAfterDays', v_policy.archived_delete_after_days,
      'endOfYearAction', v_policy.end_of_year_action,
      'academicYearEndMonth', v_policy.academic_year_end_month,
      'providerExpiryDays', v_policy.provider_expiry_days,
      'backupExpiryDays', v_policy.backup_expiry_days,
      'lastEndOfYearApplied', v_policy.last_end_of_year_applied
    ),
    'latestYearEnd', v_year_end,
    'endOfYearDue', v_end_of_year_due,
    'inactiveArchiveCandidates', v_inactive,
    'archivedDeletionCandidates', v_archived_due,
    'endOfYearCandidates', v_end_of_year,
    'pendingPropagationRecords', v_propagation_pending,
    'propagationEvidenceDue', v_propagation_due
  );
end;
$$;

create or replace function public.admin_list_deletion_propagation(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_retention_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'requestId', dpr.request_id,
      'subjectRef', dpr.subject_ref,
      'activeSystemsDeletedAt', dpr.active_systems_deleted_at,
      'providerExpiresAt', dpr.provider_expires_at,
      'backupExpiresAt', dpr.backup_expires_at,
      'status', dpr.status,
      'evidenceDue', (
        dpr.provider_expires_at <= now()
        and dpr.backup_expires_at <= now()
      ),
      'evidenceReference', dpr.evidence_reference,
      'verifiedAt', dpr.verified_at
    ) order by dpr.created_at desc)
    from public.deletion_propagation_records dpr
    where dpr.school_id = p_school_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_verify_deletion_propagation(
  p_request_id uuid,
  p_evidence_reference text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_record public.deletion_propagation_records;
  v_now timestamptz := now();
begin
  if p_confirmation is distinct from 'VERIFY PROVIDER AND BACKUP EXPIRY' then
    raise exception 'The exact propagation verification phrase is required';
  end if;
  if char_length(btrim(coalesce(p_evidence_reference, ''))) not between 8 and 500 then
    raise exception 'A provider or backup evidence reference is required';
  end if;

  select *
  into v_record
  from public.deletion_propagation_records
  where request_id = p_request_id
  for update;

  if not found then
    raise exception 'Deletion propagation record not found';
  end if;
  if v_record.status = 'expired_verified' then
    raise exception 'Deletion propagation is already verified';
  end if;
  if v_record.provider_expires_at > v_now or v_record.backup_expires_at > v_now then
    raise exception 'Provider and backup expiry dates have not both passed';
  end if;

  update public.deletion_propagation_records
  set
    status = 'expired_verified',
    evidence_reference = btrim(p_evidence_reference),
    verified_at = v_now,
    verified_by = v_actor_id,
    updated_at = v_now
  where request_id = p_request_id
  returning * into strict v_record;

  return jsonb_build_object(
    'requestId', v_record.request_id,
    'status', v_record.status,
    'evidenceReference', v_record.evidence_reference,
    'verifiedAt', v_record.verified_at
  );
end;
$$;

create or replace function public.queue_deletion_propagation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.data_rights_requests;
  v_provider_days integer := 30;
  v_backup_days integer := 35;
begin
  if new.event_type <> 'deletion_completed' then
    return new;
  end if;

  select *
  into strict v_request
  from public.data_rights_requests
  where id = new.request_id;

  select
    coalesce(srp.provider_expiry_days, 30),
    coalesce(srp.backup_expiry_days, 35)
  into v_provider_days, v_backup_days
  from (select 1) seed
  left join public.school_retention_policies srp
    on srp.school_id = v_request.school_id;

  insert into public.deletion_propagation_records (
    request_id,
    subject_ref,
    school_id,
    active_systems_deleted_at,
    provider_expires_at,
    backup_expires_at
  )
  values (
    v_request.id,
    v_request.subject_ref,
    v_request.school_id,
    new.event_at,
    new.event_at + make_interval(days => v_provider_days),
    new.event_at + make_interval(days => v_backup_days)
  )
  on conflict (request_id) do nothing;

  return new;
end;
$$;

drop trigger if exists data_rights_queue_deletion_propagation
  on public.data_rights_audit_events;
create trigger data_rights_queue_deletion_propagation
  after insert on public.data_rights_audit_events
  for each row execute function public.queue_deletion_propagation();

insert into public.deletion_propagation_records (
  request_id,
  subject_ref,
  school_id,
  active_systems_deleted_at,
  provider_expires_at,
  backup_expires_at
)
select
  dr.id,
  dr.subject_ref,
  dr.school_id,
  dae.event_at,
  dae.event_at + make_interval(days => coalesce(srp.provider_expiry_days, 30)),
  dae.event_at + make_interval(days => coalesce(srp.backup_expiry_days, 35))
from public.data_rights_requests dr
join public.data_rights_audit_events dae
  on dae.request_id = dr.id
  and dae.event_type = 'deletion_completed'
left join public.school_retention_policies srp
  on srp.school_id = dr.school_id
on conflict (request_id) do nothing;

create or replace function public.admin_run_school_retention(
  p_school_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
  v_preview jsonb;
  v_year integer;
  v_student record;
  v_prepared jsonb;
  v_archived integer := 0;
  v_deleted integer := 0;
  v_deleted_student_ids uuid[] := array[]::uuid[];
  v_row_count integer;
  v_actor_id uuid := public.assert_retention_admin();
  v_now timestamptz := now();
begin
  if p_confirmation is distinct from 'APPLY RETENTION POLICY' then
    raise exception 'The exact retention confirmation phrase is required';
  end if;

  v_policy := public.ensure_school_retention_policy(p_school_id);
  v_preview := public.admin_preview_school_retention(p_school_id);
  v_year := extract(year from (v_preview ->> 'latestYearEnd')::date)::integer;

  if (v_preview ->> 'endOfYearDue')::boolean then
    if v_policy.end_of_year_action = 'archive' then
      update public.students s
      set archived_at = v_now, updated_at = v_now
      from public.classes c
      where c.id = s.class_id
        and c.school_id = p_school_id
        and s.archived_at is null;
      get diagnostics v_archived = row_count;
    else
      for v_student in
        select s.id
        from public.students s
        join public.classes c on c.id = s.class_id
        where c.school_id = p_school_id
          and s.archived_at is null
        order by s.id
      loop
        v_prepared := public.teacher_prepare_learner_deletion(
          v_student.id,
          'school',
          'authorised_school_official'
        );
        perform public.teacher_delete_learner_data(
          (v_prepared ->> 'requestId')::uuid,
          v_student.id,
          v_prepared ->> 'subjectRef',
          'DELETE LEARNER DATA'
        );
        v_deleted_student_ids := array_append(v_deleted_student_ids, v_student.id);
        v_deleted := v_deleted + 1;
      end loop;
    end if;

    update public.school_retention_policies
    set
      last_end_of_year_applied = v_year,
      updated_by = auth.uid(),
      updated_at = v_now
    where school_id = p_school_id;
  else
    update public.students s
    set archived_at = v_now, updated_at = v_now
    from public.classes c
    where c.id = s.class_id
      and c.school_id = p_school_id
      and s.archived_at is null
      and public.retention_last_learner_activity(s.id)
        <= v_now - make_interval(days => v_policy.inactive_after_days);
    get diagnostics v_archived = row_count;
  end if;

  for v_student in
    select s.id
    from public.students s
    join public.classes c on c.id = s.class_id
    where c.school_id = p_school_id
      and s.archived_at is not null
      and s.archived_at
        <= v_now - make_interval(days => v_policy.archived_delete_after_days)
    order by s.id
  loop
    v_prepared := public.teacher_prepare_learner_deletion(
      v_student.id,
      'school',
      'authorised_school_official'
    );
    perform public.teacher_delete_learner_data(
      (v_prepared ->> 'requestId')::uuid,
      v_student.id,
      v_prepared ->> 'subjectRef',
      'DELETE LEARNER DATA'
    );
    v_deleted_student_ids := array_append(v_deleted_student_ids, v_student.id);
    v_deleted := v_deleted + 1;
  end loop;

  update public.deletion_propagation_records
  set
    status = 'evidence_required',
    updated_at = v_now
  where school_id = p_school_id
    and status = 'awaiting_expiry'
    and provider_expires_at <= v_now
    and backup_expires_at <= v_now;
  get diagnostics v_row_count = row_count;

  insert into public.retention_job_runs (
    school_id,
    actor_id,
    policy_snapshot,
    preview_snapshot,
    archived_learners,
    deleted_learners,
    propagation_records_due,
    completed_at
  )
  values (
    p_school_id,
    v_actor_id,
    to_jsonb(v_policy),
    v_preview,
    v_archived,
    v_deleted,
    v_row_count,
    v_now
  );

  return jsonb_build_object(
    'schoolId', p_school_id,
    'completedAt', v_now,
    'archivedLearners', v_archived,
    'deletedLearners', v_deleted,
    'deletedStudentIds', to_jsonb(v_deleted_student_ids),
    'propagationRecordsDueForEvidence', v_row_count,
    'residualPreview', public.admin_preview_school_retention(p_school_id)
  );
end;
$$;

grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

revoke all on function public.admin_get_school_retention_policy(uuid)
  from public, anon;
revoke all on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) from public, anon;
revoke all on function public.admin_preview_school_retention(uuid)
  from public, anon;
revoke all on function public.admin_list_deletion_propagation(uuid)
  from public, anon;
revoke all on function public.admin_verify_deletion_propagation(
  uuid, text, text
) from public, anon;
revoke all on function public.admin_run_school_retention(uuid, text)
  from public, anon;
revoke all on function public.queue_deletion_propagation()
  from public, anon, authenticated;

comment on table public.school_retention_policies is
  'Versioned school instruction for inactivity, archive, end-of-year, provider, and backup retention.';
comment on table public.deletion_propagation_records is
  'Privacy-minimal proof that active deletion occurred and provider/backup expiry is pending, due for evidence, or explicitly verified.';
comment on table public.retention_job_runs is
  'Immutable result record for each authorised school retention job run.';

-- ==== 20260725125000_error_monitor_budget.sql ===========================

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

-- ==== 20260725130000_security_definer_boundary.sql ======================

-- Close the database API boundary for every SECURITY DEFINER function.
--
-- PostgreSQL grants EXECUTE on new functions to PUBLIC unless it is revoked.
-- Revoking only from `anon` is therefore insufficient because `anon` inherits
-- PUBLIC privileges. This migration first removes API-role execution from
-- every current SECURITY DEFINER function, then grants only the exact RPC
-- signatures used by the product.

-- Remove obsolete child-login entry points entirely. They were replaced by
-- the device-aware, class-code-gated RPCs below and are not used by the app.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

-- Authenticated users may read the school directory, but cannot bypass the
-- bounded RPC to insert or alter directory rows directly.
revoke insert, update, delete on public.schools from authenticated;
drop policy if exists "Authenticated users can create schools" on public.schools;

-- School creation is part of teacher onboarding, not the anonymous child API.
-- The auth.users trigger may call this bounded helper as its owner; browser
-- callers must be authenticated.
create or replace function public.find_or_create_school(p_name text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_clean text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_id uuid;
  v_name text;
begin
  if char_length(v_clean) < 2
     or char_length(v_clean) > 120
     or v_clean ~ '[[:cntrl:]]'
  then
    raise exception 'invalid_school_name';
  end if;

  insert into public.schools (name)
  values (v_clean)
  on conflict (name_normalized) do update set name = public.schools.name
  returning public.schools.id, public.schools.name into v_id, v_name;

  return query select v_id, v_name;
end;
$$;

-- Capture the school name inside the trusted auth trigger. This avoids the old
-- pre-signup anonymous SECURITY DEFINER write and ensures the durable pending
-- account receives its school even when email confirmation returns no session.
create or replace function public.create_pending_teacher_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
  requested_school_name text;
  requested_school_id uuid;
begin
  requested_username := lower(nullif(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_-]',
    '',
    'g'
  ), ''));
  requested_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    requested_username
  );
  requested_school_name := nullif(btrim(new.raw_user_meta_data ->> 'school_name'), '');

  if coalesce((new.raw_user_meta_data ->> 'audit_only')::boolean, false) is false
     and (
       requested_username is null
       or requested_username !~ '^[a-z0-9_-]{3,30}$'
       or requested_display_name is null
       or char_length(requested_display_name) > 80
       or requested_school_name is null
     )
  then
    raise exception 'invalid_teacher_signup_metadata';
  end if;

  if requested_username is not null and exists (
    select 1
    from public.pending_teacher_accounts
    where lower(username) = requested_username
  ) then
    raise exception 'username_unavailable';
  end if;

  if requested_school_name is not null then
    select school.id
    into requested_school_id
    from public.find_or_create_school(requested_school_name) school;
  end if;

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    username,
    display_name,
    name,
    role,
    status,
    approval_status,
    school_id,
    requested_at,
    created_at
  )
  values (
    new.id,
    new.email,
    requested_username,
    requested_display_name,
    coalesce(requested_display_name, requested_username, split_part(new.email, '@', 1)),
    'pending',
    'pending',
    'pending',
    requested_school_id,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Fail closed for all present SECURITY DEFINER functions, including internal
-- helpers and trigger functions. The owner retains execution automatically.
do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

-- ==== 20260725140000_private_class_code_trigger.sql =====================

-- Keep class access-code generation private while allowing normal teacher
-- inserts to fire the automatic-code trigger.
--
-- The security-definer boundary correctly revokes direct browser execution of
-- gen_class_access_code(). The trigger previously ran as the inserting teacher,
-- however, so its internal helper call inherited that revocation and every new
-- class insert failed. Run the trigger as its fixed owner instead; direct API
-- callers still cannot execute either internal function.

create or replace function public.set_class_access_code()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.access_code is null then
    new.access_code := public.gen_class_access_code();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_class_access_code()
  from public, anon, authenticated;
revoke execute on function public.gen_class_access_code()
  from public, anon, authenticated;

-- ==== 20260725145000_teacher_child_lifecycle.sql ========================

-- Give teachers one explicit, audited boundary for archiving and restoring a
-- child. The column reconciliation keeps older managed installations safe to
-- upgrade before the frontend begins using this RPC.

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.teacher_set_student_archived(
  p_student_id uuid,
  p_class_id uuid,
  p_archived boolean
)
returns table (id uuid)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The child was not found in this class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to change this child.';
  end if;

  return query
  update public.students s
     set archived_at = case when p_archived then now() else null end,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_class_id
  returning s.id;
end;
$$;

comment on function public.teacher_set_student_archived(uuid, uuid, boolean) is
  'Archives or restores one child after verifying teacher ownership of the class.';

revoke all on function public.teacher_set_student_archived(uuid, uuid, boolean)
  from public, anon;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;

-- ==== 20260725150000_security_definer_boundary.sql ======================

-- Reassert the complete database API boundary after all private trigger fixes.
--
-- PostgreSQL grants EXECUTE on newly created functions to PUBLIC by default.
-- This migration must remain after every SECURITY DEFINER migration: it first
-- removes execution from every API role, then restores only the reviewed RPC
-- surface used by the product.

-- Keep obsolete child-login entry points absent even on databases upgraded
-- through an older or partially applied migration history.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

-- ==== 20260726090000_data_rights_jsonb_section_count.sql ================

-- PostgreSQL does not provide jsonb_object_length(). The learner export uses
-- this bounded helper to count top-level package sections without expanding
-- or returning any child data to the caller.
create or replace function public.jsonb_object_length(p_value jsonb)
returns integer
language sql
immutable
parallel safe
set search_path = public
as $$
  select count(*)::integer
  from jsonb_object_keys(coalesce(p_value, '{}'::jsonb));
$$;

revoke all on function public.jsonb_object_length(jsonb)
  from public, anon, authenticated;

comment on function public.jsonb_object_length(jsonb) is
  'Owner-only helper used by the learner data export to count top-level JSON sections.';

-- ==== 20260727090000_data_rights_and_lifecycle_fixes.sql ================

-- Two corrections to the learner-lifecycle boundary, found by audit on
-- 2026-07-27. Both are safe to re-run.
--
-- 1. Deleting one learner destroyed other children's assessment evidence.
-- 2. Archiving a learner left them signed in for up to the session TTL.

-- ---------------------------------------------------------------------------
-- 1. Redact the subject from shared reports instead of deleting the row.
--
-- The previous statement was:
--
--   delete from public.el_assessment_reports er
--   where er.student_id = v_student.id::text
--      or er.payload::text like '%' || v_student.id::text || '%'
--      or er.summary::text like '%' || v_student.id::text || '%';
--
-- A whole-class report contains every learner in the class, so the substring
-- match deleted the WHOLE row — the other twenty-nine children's evidence went
-- with it. Being `security definer`, it bypassed row-level security, so it also
-- reached rows belonging to a co-teacher or an admin. That both destroys
-- evidence the school is required to keep and contradicts the immutability
-- promise in docs/teacher/ASSESSMENT_EVIDENCE.md.
--
-- The rule now: a report ABOUT the subject is deleted; a report that merely
-- MENTIONS the subject has the subject's entries stripped and is kept.

create or replace function public.redact_learner_from_shared_reports(
  p_student_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject text := p_student_id::text;
  v_redacted integer := 0;
begin
  -- Reports about this learner alone: remove entirely.
  delete from public.el_assessment_reports er
  where er.student_id = v_subject;

  -- Reports about a group that include this learner: strip their entries and
  -- keep the row, so every other child's evidence survives.
  update public.el_assessment_reports er
  set
    payload = public.jsonb_strip_student_entries(er.payload, v_subject),
    summary = public.jsonb_strip_student_entries(er.summary, v_subject)
  where er.student_id is distinct from v_subject
    and (
      er.payload::text like '%' || v_subject || '%'
      or er.summary::text like '%' || v_subject || '%'
    );
  get diagnostics v_redacted = row_count;

  return v_redacted;
end;
$$;

-- Walk a jsonb document and drop any object or array element that identifies
-- the subject, leaving the rest of the structure intact.
create or replace function public.jsonb_strip_student_entries(
  p_document jsonb,
  p_student_id text
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_key text;
  v_result jsonb;
  v_element jsonb;
begin
  if p_document is null then
    return null;
  end if;

  if jsonb_typeof(p_document) = 'array' then
    v_result := '[]'::jsonb;
    for v_element in select value from jsonb_array_elements(p_document) loop
      -- Drop array members that ARE the subject; recurse into the others.
      if jsonb_typeof(v_element) = 'object'
         and (
           v_element ->> 'studentId' = p_student_id
           or v_element ->> 'student_id' = p_student_id
           or v_element ->> 'id' = p_student_id
         )
      then
        continue;
      end if;
      v_result := v_result || jsonb_build_array(
        public.jsonb_strip_student_entries(v_element, p_student_id)
      );
    end loop;
    return v_result;
  end if;

  if jsonb_typeof(p_document) = 'object' then
    v_result := '{}'::jsonb;
    for v_key in select jsonb_object_keys(p_document) loop
      -- A map keyed by student id: drop the subject's key outright.
      if v_key like '%' || p_student_id || '%' then
        continue;
      end if;
      v_result := v_result || jsonb_build_object(
        v_key,
        public.jsonb_strip_student_entries(p_document -> v_key, p_student_id)
      );
    end loop;
    return v_result;
  end if;

  -- Any string carrying the subject's id — whole, or embedded in a longer
  -- value such as a report id or a file name — has it replaced by a marker.
  --
  -- "Contains", not "equals", and this is load-bearing rather than tidiness:
  -- teacher_delete_learner_data finishes by refusing to complete if the id
  -- still appears ANYWHERE in payload::text or summary::text. If redaction
  -- only removed whole-value matches, one id embedded in a file name would
  -- make every deletion raise and roll back. Erasing the substring is what
  -- lets the existing residual-records proof stay strict AND stay passable.
  if jsonb_typeof(p_document) = 'string' then
    return to_jsonb(replace(p_document #>> '{}', p_student_id, '[removed]'));
  end if;

  return p_document;
end;
$$;

revoke all on function public.redact_learner_from_shared_reports(uuid) from public, anon, authenticated;
revoke all on function public.jsonb_strip_student_entries(jsonb, text) from public, anon;

comment on function public.redact_learner_from_shared_reports(uuid) is
  'Deletes reports about one learner and redacts that learner from shared reports, so deleting one child never destroys another child''s evidence.';


-- ---------------------------------------------------------------------------
-- 1b. Re-issue teacher_delete_learner_data so it uses the redaction above.
--
-- The body is otherwise unchanged from
-- 20260725110000_learner_data_rights.sql: same ownership checks, same locking,
-- same audit event, same residual-record proof. Only the
-- el_assessment_reports statement is different.

create or replace function public.teacher_delete_learner_data(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_request public.data_rights_requests;
  v_expected_ref text;
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
begin
  if p_confirmation is distinct from 'DELETE LEARNER DATA' then
    raise exception 'The exact deletion confirmation phrase is required';
  end if;

  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_expected_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  if p_subject_ref is distinct from v_expected_ref then
    raise exception 'The deletion subject reference does not match the learner';
  end if;

  select dr.*
  into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = v_expected_ref
    and dr.teacher_id = v_student.teacher_id
    and dr.class_id = v_student.class_id
    and dr.request_type = 'deletion'
    and dr.verification_status = 'verified'
    and dr.status = 'in_progress'
  for update;

  if not found then
    raise exception 'A verified in-progress deletion request was not found';
  end if;

  -- These tables contain text, array, or JSON references rather than a
  -- student foreign key. The short write lock closes the race where another
  -- session could recreate learner evidence between cleanup and verification.
  lock table public.assessment_attempts in share row exclusive mode;
  lock table public.el_assessment_reports in share row exclusive mode;
  lock table public.teacher_interventions in share row exclusive mode;
  lock table public.teacher_instructional_group_reviews in share row exclusive mode;
  lock table public.teacher_insight_observations in share row exclusive mode;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_started',
    jsonb_build_object('schemaVersion', 1)
  );

  delete from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('teacherObservations', v_count);

  delete from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('instructionalGroupReviews', v_count);

  update public.teacher_interventions ti
  set student_ids = array_remove(ti.student_ids, v_student.id)
  where v_student.id = any(ti.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('interventionsUpdated', v_count);

  -- Reports ABOUT this learner are deleted; reports that merely mention them
  -- (whole-class reports) have this learner's entries stripped and are kept, so
  -- deleting one child can never destroy another child's evidence.
  v_count := public.redact_learner_from_shared_reports(v_student.id);
  v_counts := v_counts || jsonb_build_object('assessmentReportsRedacted', v_count);
  v_counts := v_counts || jsonb_build_object(
    'assessmentReports',
    (select count(*) from public.el_assessment_reports er
      where er.student_id = v_student.id::text)
  );

  delete from public.assessment_attempts aa
  where aa.student_id = v_student.id::text;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentAttempts', v_count);

  select
    v_counts || jsonb_build_object(
      'answers', (select count(*) from public.answers a where a.student_id = v_student.id),
      'mastery', (select count(*) from public.mastery m where m.student_id = v_student.id),
      'itemMastery', (select count(*) from public.item_mastery im where im.student_id = v_student.id),
      'progress', (select count(*) from public.student_progress sp where sp.student_id = v_student.id),
      'learningActivity', (select count(*) from public.learn_activity la where la.student_id = v_student.id),
      'syncHealth', (select count(*) from public.activity_sync_health sh where sh.student_id = v_student.id),
      'sessions', (select count(*) from public.student_sessions ss where ss.student_id = v_student.id)
    )
  into strict v_counts;

  delete from public.students s
  where s.id = v_student.id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    );

  if not found then
    raise exception 'Learner deletion did not complete';
  end if;

  if exists (
    select 1 from public.answers a where a.student_id = p_student_id
    union all
    select 1 from public.mastery m where m.student_id = p_student_id
    union all
    select 1 from public.item_mastery im where im.student_id = p_student_id
    union all
    select 1 from public.student_progress sp where sp.student_id = p_student_id
    union all
    select 1 from public.learn_activity la where la.student_id = p_student_id
    union all
    select 1 from public.activity_sync_health sh where sh.student_id = p_student_id
    union all
    select 1 from public.student_sessions ss where ss.student_id = p_student_id
    union all
    select 1 from public.assessment_attempts aa where aa.student_id = p_student_id::text
    union all
    select 1 from public.el_assessment_reports er
      where er.student_id = p_student_id::text
        or er.payload::text like '%' || p_student_id::text || '%'
        or er.summary::text like '%' || p_student_id::text || '%'
    union all
    select 1 from public.teacher_interventions ti where p_student_id = any(ti.student_ids)
    union all
    select 1 from public.teacher_instructional_group_reviews gr where p_student_id = any(gr.student_ids)
    union all
    select 1 from public.teacher_insight_observations io where p_student_id = any(io.student_ids)
  ) then
    raise exception 'Learner deletion verification found residual managed records';
  end if;

  update public.data_rights_requests
  set
    status = 'completed',
    completed_at = now(),
    outcome_counts = v_counts,
    updated_at = now()
  where id = v_request.id;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'residualManagedRecords', 0
    )
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_expected_ref,
    'status', 'completed',
    'completedAt', now(),
    'deletedCounts', v_counts,
    'residualManagedRecords', 0
  );
end;
$$;


revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Archiving a learner now ends their sessions.
--
-- student_from_token filtered on revoked/expires_at but not archived_at, and
-- teacher_set_student_archived revoked nothing, so a child the teacher had just
-- removed from the roster kept reading and writing progress until their session
-- expired. The teacher's screen said they were gone.

create or replace function public.teacher_set_student_archived(
  p_student_id uuid,
  p_class_id uuid,
  p_archived boolean
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The child was not found in this class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to change this child.';
  end if;

  -- Archiving is presented to the teacher as removal, so it must actually stop
  -- access rather than only hiding the row.
  if p_archived then
    update public.student_sessions
       set revoked = true
     where student_id = p_student_id
       and revoked = false;
  end if;

  return query
  update public.students s
     set archived_at = case when p_archived then now() else null end,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_class_id
  returning s.id;
end;
$$;

comment on function public.teacher_set_student_archived(uuid, uuid, boolean) is
  'Archives or restores one child after verifying teacher ownership of the class. Archiving also revokes the child''s active sessions.';

revoke all on function public.teacher_set_student_archived(uuid, uuid, boolean)
  from public, anon;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;

-- An archived child must not be able to resume on an existing token either.
-- Return type and grants are kept exactly as first defined in
-- 20260610000000_student_login_symbol_passwords.sql; only the archived_at
-- filter is added, because `create or replace` cannot change a return type.
create or replace function public.student_from_token(p_token text)
returns public.students
language sql stable security definer set search_path = public
as $$
  select s.* from public.student_sessions ss
  join public.students s on s.id = ss.student_id
  where ss.token = p_token
    and ss.revoked = false
    and ss.expires_at > now()
    and s.archived_at is null
  limit 1;
$$;

revoke all on function public.student_from_token(text) from public, anon, authenticated;

-- ==== 20260727091000_security_definer_boundary.sql ======================

-- Reassert the complete database API boundary after the 2026-07-27
-- data-rights and lifecycle fixes.
--
-- Re-issued because 20260727090000_data_rights_and_lifecycle_fixes.sql adds one
-- new SECURITY DEFINER function (redact_learner_from_shared_reports) and
-- replaces three others. This file must remain the LAST migration containing
-- the words "security definer" — tests/unit/databasePolicyContract.test.js
-- enforces exactly that, and it caught this file's absence.
--
-- PostgreSQL grants EXECUTE on newly created functions to PUBLIC by default.
-- This migration must remain after every SECURITY DEFINER migration: it first
-- removes execution from every API role, then restores only the reviewed RPC
-- surface used by the product.

-- Keep obsolete child-login entry points absent even on databases upgraded
-- through an older or partially applied migration history.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;

-- ===========================================================================
-- CHECK — run this on its own AFTER the block above has finished.
-- Every row must say 'present'. Any row saying 'MISSING' means that part did
-- not apply, and the matching screen in the app will still fail.
-- ===========================================================================
-- select
--   name,
--   case when exists (
--     select 1 from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = name
--   ) then 'present' else 'MISSING' end as status
-- from unnest(array[
--   'teacher_prepare_learner_deletion',
--   'teacher_delete_learner_data',
--   'teacher_export_learner_data',
--   'teacher_list_learner_data_rights',
--   'teacher_set_student_archived',
--   'redact_learner_from_shared_reports',
--   'jsonb_strip_student_entries',
--   'student_from_token'
-- ]) as name
-- order by status desc, name;

-- ===========================================================================
-- CHECK 2 — prove the redaction really erases a child's id from a shared
-- report, which is what lets a deletion complete. Expect: t
-- ===========================================================================
-- select public.jsonb_strip_student_entries(
--   '{"class":"3B","learners":[
--       {"studentId":"11111111-1111-1111-1111-111111111111","name":"Aaron","score":7},
--       {"studentId":"22222222-2222-2222-2222-222222222222","name":"Bea","score":9}],
--     "file":"report-11111111-1111-1111-1111-111111111111.json"}'::jsonb,
--   '11111111-1111-1111-1111-111111111111'
-- )::text not like '%11111111-1111-1111-1111-111111111111%'
--   as subject_id_fully_erased;
