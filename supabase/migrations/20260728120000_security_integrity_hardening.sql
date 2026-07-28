-- Close the integrity gaps found by the final teacher-side audit.
--
-- This migration deliberately does not repeat the global SECURITY DEFINER
-- boundary. A later migration owns the final callable-function inventory after
-- every audit fix has landed.

-- ---------------------------------------------------------------------------
-- Archived learners: revoke every existing session and prevent new sessions.
-- ---------------------------------------------------------------------------

create or replace function public.revoke_student_sessions_after_archive()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if old.archived_at is null and new.archived_at is not null then
    update public.student_sessions
    set revoked = true
    where student_id = new.id
      and revoked = false;
  end if;

  return new;
end;
$$;

revoke all on function public.revoke_student_sessions_after_archive()
  from public, anon, authenticated;

drop trigger if exists revoke_student_sessions_after_archive
  on public.students;
create trigger revoke_student_sessions_after_archive
  after update of archived_at on public.students
  for each row
  execute function public.revoke_student_sessions_after_archive();

create or replace function public.require_active_student_session_owner()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if new.revoked = false
     and not exists (
       select 1
       from public.students student
       where student.id = new.student_id
         and student.archived_at is null
     )
  then
    raise exception using
      errcode = '42501',
      message = 'An archived learner cannot have an active session.';
  end if;

  return new;
end;
$$;

revoke all on function public.require_active_student_session_owner()
  from public, anon, authenticated;

drop trigger if exists require_active_student_session_owner
  on public.student_sessions;
create trigger require_active_student_session_owner
  before insert or update on public.student_sessions
  for each row
  execute function public.require_active_student_session_owner();

-- Repair sessions created before the archive invariant existed.
update public.student_sessions session
set revoked = true
from public.students student
where student.id = session.student_id
  and student.archived_at is not null
  and session.revoked = false;

create or replace function public.student_login(
  p_student_id uuid,
  p_sequence text,
  p_device_id text,
  p_code text
)
returns json
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_class public.classes;
  v_token text;
  v_limit json;
begin
  select *
  into v_student
  from public.students
  where id = p_student_id
    and archived_at is null
  for update;

  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select *
  into v_class
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

comment on function public.student_login(uuid, text, text, text) is
  'Issues a learner session only after the class-code, device, symbol-password, rate-limit, expiry, and active-learner checks pass.';

revoke all on function public.student_login(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Error monitoring: rate-limit a server-derived network bucket atomically.
-- ---------------------------------------------------------------------------

create table if not exists public.app_error_rate_limits (
  bucket_key text primary key,
  dimension text not null check (
    dimension in ('global', 'caller', 'network', 'fingerprint')
  ),
  attempt_count integer not null check (attempt_count >= 1),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists app_error_rate_limits_expiry_idx
  on public.app_error_rate_limits (expires_at);

alter table public.app_error_rate_limits enable row level security;
revoke all on public.app_error_rate_limits from public, anon, authenticated;

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
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_alert boolean;
  v_bucket public.app_error_rate_limits;
  v_bucket_key text;
  v_bucket_limit integer;
  v_caller_key text;
  v_dimension text;
  v_network_key text;
  v_payload text;
  v_recent_count integer;
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

  if exists (
    select 1
    from public.app_error_events event
    where event.client_event_id = p_client_event_id
  ) then
    return json_build_object(
      'ok', true,
      'duplicate', true,
      'alert_required', false,
      'retention_days', 30
    );
  end if;

  -- This key comes from trusted request headers read by the database. The
  -- browser cannot choose it by rotating its event UUID or fingerprint.
  v_network_key := encode(
    digest(
      'literacy-path-error-network-v1:'
        || public.class_access_network_fingerprint(),
      'sha256'
    ),
    'hex'
  );
  v_caller_key := encode(
    digest(
      'literacy-path-error-caller-v1:'
        || coalesce(auth.uid()::text, public.class_access_network_fingerprint()),
      'sha256'
    ),
    'hex'
  );

  delete from public.app_error_rate_limits
  where expires_at <= now();

  for v_dimension, v_bucket_key, v_bucket_limit in
    select spec.dimension, spec.bucket_key, spec.bucket_limit
    from (
      values
        (
          'global'::text,
          encode(
            digest(
              'literacy-path-error-global-v1',
              'sha256'
            ),
            'hex'
          ),
          1000
        ),
        ('caller'::text, v_caller_key, 60),
        ('network'::text, v_network_key, 120),
        (
          'fingerprint'::text,
          encode(
            digest(
              'literacy-path-error-fingerprint-v1:' || p_fingerprint,
              'sha256'
            ),
            'hex'
          ),
          100
        )
    ) as spec(dimension, bucket_key, bucket_limit)
  loop
    insert into public.app_error_rate_limits (
      bucket_key,
      dimension,
      attempt_count,
      window_started_at,
      expires_at,
      updated_at
    )
    values (
      v_bucket_key,
      v_dimension,
      1,
      now(),
      now() + interval '1 minute',
      now()
    )
    on conflict (bucket_key)
    do update set
      dimension = excluded.dimension,
      attempt_count = case
        when app_error_rate_limits.window_started_at <= now() - interval '1 minute'
          then 1
        else least(app_error_rate_limits.attempt_count + 1, 1000000)
      end,
      window_started_at = case
        when app_error_rate_limits.window_started_at <= now() - interval '1 minute'
          then now()
        else app_error_rate_limits.window_started_at
      end,
      expires_at = case
        when app_error_rate_limits.window_started_at <= now() - interval '1 minute'
          then now() + interval '1 minute'
        else app_error_rate_limits.expires_at
      end,
      updated_at = now()
    returning * into v_bucket;

    if v_bucket.attempt_count > v_bucket_limit then
      return json_build_object('ok', false, 'error', 'rate_limited');
    end if;
  end loop;

  select count(*)
  into v_recent_count
  from public.app_error_events
  where fingerprint = p_fingerprint
    and occurred_at >= now() - interval '1 minute';

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

comment on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) is
  'Accepts only bounded non-PII diagnostics and atomically limits global ingestion, a server-derived one-way caller bucket, a network bucket, and the client fingerprint.';

revoke all on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) from public, anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Student question reports: active-session check plus bounded atomic quotas.
-- ---------------------------------------------------------------------------

create table if not exists public.assessment_question_report_rate_limits (
  bucket_key text primary key,
  dimension text not null check (
    dimension in ('session', 'student', 'school')
  ),
  attempt_count integer not null check (attempt_count >= 1),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists assessment_question_report_rate_limits_expiry_idx
  on public.assessment_question_report_rate_limits (expires_at);

alter table public.assessment_question_report_rate_limits enable row level security;
revoke all on public.assessment_question_report_rate_limits
  from public, anon, authenticated;

alter function public.report_assessment_question(
  text, uuid, text, uuid, jsonb
) rename to report_assessment_question_core;

revoke all on function public.report_assessment_question_core(
  text, uuid, text, uuid, jsonb
) from public, anon, authenticated;

comment on function public.report_assessment_question_core(
  text, uuid, text, uuid, jsonb
) is
  'Private sanitized report writer. Callers must use report_assessment_question so active-session and quota checks cannot be bypassed.';

create function public.report_assessment_question(
  p_student_token text,
  p_student_id uuid,
  p_flag_type text,
  p_report_id uuid,
  p_question_snapshot jsonb
)
returns table (
  report_id uuid,
  report_status text,
  report_type text,
  reported_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_bucket public.assessment_question_report_rate_limits;
  v_bucket_key text;
  v_bucket_limit integer;
  v_dimension text;
  v_existing boolean := false;
  v_flag_type text := lower(btrim(coalesce(p_flag_type, '')));
  v_school_id uuid;
  v_session_id uuid;
  v_student public.students;
  v_student_id uuid;
begin
  if nullif(btrim(coalesce(p_student_token, '')), '') is null then
    return query
    select *
    from public.report_assessment_question_core(
      p_student_token,
      p_student_id,
      p_flag_type,
      p_report_id,
      p_question_snapshot
    );
    return;
  end if;

  select session.id, student.id
  into v_session_id, v_student_id
  from public.student_sessions session
  join public.students student on student.id = session.student_id
  where session.token = p_student_token
    and session.revoked = false
    and session.expires_at > now()
    and student.archived_at is null
  for update of session, student;

  if v_student_id is null
     or (p_student_id is not null and p_student_id <> v_student_id)
  then
    raise exception using
      errcode = '42501',
      message = 'This student session cannot send the report.';
  end if;

  select *
  into v_student
  from public.students
  where id = v_student_id;

  -- Idempotent retries do not consume another quota slot, including after the
  -- first request has reached the limit.
  select exists (
    select 1
    from public.assessment_question_reports report
    where report.id = p_report_id
      and report.student_id = v_student.id
      and report.reporter_kind = 'student'
      and report.flag_type = v_flag_type
  )
  into v_existing;

  if not v_existing then
    select class.school_id
    into v_school_id
    from public.classes class
    where class.id = v_student.class_id;

    if v_school_id is null then
      raise exception using
        errcode = '23502',
        message = 'The report needs a class with a school.';
    end if;

    delete from public.assessment_question_report_rate_limits
    where expires_at <= now();

    for v_dimension, v_bucket_key, v_bucket_limit in
      select spec.dimension, spec.bucket_key, spec.bucket_limit
      from (
        values
          (
            'session'::text,
            encode(
              digest(
                'literacy-path-question-report-session-v1:' || v_session_id::text,
                'sha256'
              ),
              'hex'
            ),
            30
          ),
          (
            'student'::text,
            encode(
              digest(
                'literacy-path-question-report-student-v1:' || v_student.id::text,
                'sha256'
              ),
              'hex'
            ),
            40
          ),
          (
            'school'::text,
            encode(
              digest(
                'literacy-path-question-report-school-v1:' || v_school_id::text,
                'sha256'
              ),
              'hex'
            ),
            500
          )
      ) as spec(dimension, bucket_key, bucket_limit)
    loop
      insert into public.assessment_question_report_rate_limits (
        bucket_key,
        dimension,
        attempt_count,
        window_started_at,
        expires_at,
        updated_at
      )
      values (
        v_bucket_key,
        v_dimension,
        1,
        now(),
        now() + interval '1 hour',
        now()
      )
      on conflict (bucket_key)
      do update set
        dimension = excluded.dimension,
        attempt_count = case
          when assessment_question_report_rate_limits.window_started_at
            <= now() - interval '1 hour'
          then 1
          else least(
            assessment_question_report_rate_limits.attempt_count + 1,
            1000000
          )
        end,
        window_started_at = case
          when assessment_question_report_rate_limits.window_started_at
            <= now() - interval '1 hour'
          then now()
          else assessment_question_report_rate_limits.window_started_at
        end,
        expires_at = case
          when assessment_question_report_rate_limits.window_started_at
            <= now() - interval '1 hour'
          then now() + interval '1 hour'
          else assessment_question_report_rate_limits.expires_at
        end,
        updated_at = now()
      returning * into v_bucket;

      if v_bucket.attempt_count > v_bucket_limit then
        raise exception using
          errcode = 'P0001',
          message = 'Too many question reports were sent from this learner session. Try again later.';
      end if;
    end loop;
  end if;

  return query
  select *
  from public.report_assessment_question_core(
    p_student_token,
    p_student_id,
    p_flag_type,
    p_report_id,
    p_question_snapshot
  );
end;
$$;

comment on function public.report_assessment_question(
  text, uuid, text, uuid, jsonb
) is
  'Accepts a bounded sanitized report from an approved owning teacher, administrator, or active non-archived learner session. Learner reports are limited per session, learner, and school per hour; idempotent retries remain safe.';

revoke all on function public.report_assessment_question(
  text, uuid, text, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.report_assessment_question(
  text, uuid, text, uuid, jsonb
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- School directory: approved callers only, with a bounded creation quota.
-- ---------------------------------------------------------------------------

create table if not exists public.school_creation_rate_limits (
  actor_id uuid primary key references auth.users(id) on delete cascade,
  creation_count integer not null check (creation_count >= 1),
  window_started_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.school_creation_rate_limits enable row level security;
revoke all on public.school_creation_rate_limits
  from public, anon, authenticated;

create or replace function public.create_school_directory_entry(
  p_name text
)
returns table (id uuid, name text)
language plpgsql
volatile
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
    raise exception using
      errcode = '22023',
      message = 'Choose a valid school name between 2 and 120 characters.';
  end if;

  insert into public.schools (name)
  values (v_clean)
  on conflict (name_normalized)
  do update set name = public.schools.name
  returning public.schools.id, public.schools.name
    into v_id, v_name;

  return query select v_id, v_name;
end;
$$;

revoke all on function public.create_school_directory_entry(text)
  from public, anon, authenticated;

create or replace function public.find_or_create_school(p_name text)
returns table (id uuid, name text)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_id uuid := auth.uid();
  v_clean text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_existing public.schools;
  v_limit integer;
  v_rate public.school_creation_rate_limits;
begin
  perform public.assert_current_actor_teacher_access();

  if char_length(v_clean) < 2
     or char_length(v_clean) > 120
     or v_clean ~ '[[:cntrl:]]'
  then
    raise exception using
      errcode = '22023',
      message = 'Choose a valid school name between 2 and 120 characters.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('school-directory:' || lower(v_clean), 0)
  );

  select school.*
  into v_existing
  from public.schools school
  where school.name_normalized = lower(v_clean)
  limit 1;

  if v_existing.id is not null then
    return query select v_existing.id, v_existing.name;
    return;
  end if;

  v_limit := case
    when public.is_app_admin(v_actor_id) then 20
    else 5
  end;

  insert into public.school_creation_rate_limits (
    actor_id,
    creation_count,
    window_started_at,
    updated_at
  )
  values (
    v_actor_id,
    1,
    now(),
    now()
  )
  on conflict (actor_id)
  do update set
    creation_count = case
      when school_creation_rate_limits.window_started_at
        <= now() - interval '24 hours'
      then 1
      else school_creation_rate_limits.creation_count + 1
    end,
    window_started_at = case
      when school_creation_rate_limits.window_started_at
        <= now() - interval '24 hours'
      then now()
      else school_creation_rate_limits.window_started_at
    end,
    updated_at = now()
  returning * into v_rate;

  if v_rate.creation_count > v_limit then
    raise exception using
      errcode = 'P0001',
      message = 'The school-creation limit for this account has been reached. Try again tomorrow.';
  end if;

  return query
  select school.id, school.name
  from public.create_school_directory_entry(v_clean) school;
end;
$$;

comment on function public.find_or_create_school(text) is
  'Returns an existing normalized school or creates one for an approved teacher/admin within the account 24-hour creation quota.';

revoke all on function public.find_or_create_school(text)
  from public, anon, authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;

-- The auth trigger needs a private creation path before the new account can be
-- approved. Browser callers cannot execute that helper.
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
  requested_school_name := nullif(
    btrim(new.raw_user_meta_data ->> 'school_name'),
    ''
  );

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
    from public.create_school_directory_entry(requested_school_name) school;
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
    coalesce(
      requested_display_name,
      requested_username,
      split_part(new.email, '@', 1)
    ),
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

revoke all on function public.create_pending_teacher_account_for_new_user()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Teacher-account decisions: browser-safe profile edits, server-owned audit.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_teacher_account_audit_integrity()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  -- SECURITY DEFINER changes current_user, so it is not a safe way to identify
  -- a seed/migration connection. session_user remains the connection principal:
  -- psql seed/reset uses the database owner, while browser requests keep the
  -- PostgREST authenticator session plus an authenticated/anon active role and
  -- therefore cannot enter this branch. Checking the role setting matters in
  -- SQL policy tests too: SET ROLE authenticated must behave like PostgREST.
  v_trusted_decision boolean := (
    (
      session_user in ('postgres', 'supabase_admin')
      and coalesce(current_setting('role', true), 'none')
        in ('none', 'postgres', 'supabase_admin')
    )
    or (
      coalesce(
        current_setting(
          'literacy_path.teacher_account_decision',
          true
        ),
        ''
      ) = 'on'
      and public.is_app_admin(auth.uid())
    )
  );
begin
  if tg_op = 'INSERT' then
    if not v_trusted_decision then
      if lower(coalesce(new.role, '')) <> 'pending'
         or lower(coalesce(new.status, '')) <> 'pending'
         or lower(coalesce(new.approval_status, '')) <> 'pending'
         or new.reviewed_at is not null
         or new.reviewed_by is not null
         or new.approved_at is not null
         or new.approved_by is not null
         or new.rejected_at is not null
         or new.rejected_by is not null
         or new.rejection_reason is not null
      then
        raise exception using
          errcode = '42501',
          message = 'Teacher-account decision fields are set by the server.';
      end if;

      new.requested_at := now();
      new.created_at := now();
      new.updated_at := now();
    end if;

    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at
     or new.requested_at is distinct from old.requested_at
  then
    raise exception using
      errcode = '42501',
      message = 'Teacher-account identity and request timestamps cannot be changed.';
  end if;

  if not v_trusted_decision
     and (
       new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.approval_status is distinct from old.approval_status
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
       or new.rejected_at is distinct from old.rejected_at
       or new.rejected_by is distinct from old.rejected_by
       or new.rejection_reason is distinct from old.rejection_reason
     )
  then
    raise exception using
      errcode = '42501',
      message = 'Teacher-account decisions must use the administrator action.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.enforce_teacher_account_audit_integrity()
  from public, anon, authenticated;

drop trigger if exists enforce_teacher_account_audit_integrity
  on public.pending_teacher_accounts;
create trigger enforce_teacher_account_audit_integrity
  before insert or update on public.pending_teacher_accounts
  for each row
  execute function public.enforce_teacher_account_audit_integrity();

create or replace function public.admin_set_teacher_account_status(
  p_account_id uuid,
  p_status text,
  p_rejection_reason text default null
)
returns setof public.pending_teacher_accounts
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_reason text := nullif(btrim(coalesce(p_rejection_reason, '')), '');
  v_status text := lower(btrim(coalesce(p_status, '')));
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception using
      errcode = '42501',
      message = 'Only an app administrator can decide a teacher account.';
  end if;

  if p_account_id is null
     or v_status not in ('approved', 'rejected', 'disabled')
  then
    raise exception using
      errcode = '22023',
      message = 'Choose a valid teacher account decision.';
  end if;

  if char_length(coalesce(v_reason, '')) > 500 then
    raise exception using
      errcode = '22023',
      message = 'The rejection reason must be 500 characters or fewer.';
  end if;

  if not exists (
    select 1
    from public.pending_teacher_accounts account
    where account.id = p_account_id
    for update
  ) then
    raise exception using
      errcode = 'P0002',
      message = 'That teacher account no longer exists.';
  end if;

  perform set_config(
    'literacy_path.teacher_account_decision',
    'on',
    true
  );

  return query
  update public.pending_teacher_accounts account
  set
    status = v_status,
    approval_status = v_status,
    role = case when v_status = 'approved' then 'teacher' else 'pending' end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    approved_at = case
      when v_status = 'approved' then now()
      when v_status = 'rejected' then null
      else account.approved_at
    end,
    approved_by = case
      when v_status = 'approved' then auth.uid()
      when v_status = 'rejected' then null
      else account.approved_by
    end,
    rejected_at = case
      when v_status = 'rejected' then now()
      when v_status = 'approved' then null
      else account.rejected_at
    end,
    rejected_by = case
      when v_status = 'rejected' then auth.uid()
      when v_status = 'approved' then null
      else account.rejected_by
    end,
    rejection_reason = case
      when v_status = 'rejected' then v_reason
      when v_status = 'approved' then null
      else account.rejection_reason
    end,
    updated_at = now()
  where account.id = p_account_id
  returning account.*;
end;
$$;

comment on function public.admin_set_teacher_account_status(
  uuid, text, text
) is
  'Applies an administrator teacher-account decision with reviewer identity and timestamps derived solely from auth.uid() and database time.';

revoke all on function public.admin_set_teacher_account_status(
  uuid, text, text
) from public, anon, authenticated;
grant execute on function public.admin_set_teacher_account_status(
  uuid, text, text
) to authenticated;

notify pgrst, 'reload schema';
