\set ON_ERROR_STOP on

begin;
set local search_path = public, extensions;

insert into auth.users (
  id,
  aud,
  role,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    'b0100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'integrity-teacher@example.invalid',
    '{"audit_only":true}'::jsonb,
    now(),
    now()
  ),
  (
    'b0100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'integrity-pending@example.invalid',
    '{"audit_only":true}'::jsonb,
    now(),
    now()
  ),
  (
    'b0100000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'integrity-admin@example.invalid',
    '{"audit_only":true}'::jsonb,
    now(),
    now()
  );

insert into public.app_admins (user_id, email)
values (
  'b0100000-0000-4000-8000-000000000003',
  'integrity-admin@example.invalid'
);

insert into public.schools (id, name)
values (
  'b0200000-0000-4000-8000-000000000001',
  'Integrity Audit School'
);

-- Database-owner setup is deliberately allowed for migrations and the
-- deterministic audit seed. SET ROLE browser simulations below must not inherit
-- this path even though session_user remains the test database owner.
update public.pending_teacher_accounts
set role = 'teacher',
    status = 'approved',
    approval_status = 'approved',
    school_id = 'b0200000-0000-4000-8000-000000000001'
where user_id = 'b0100000-0000-4000-8000-000000000001';

insert into public.classes (
  id,
  teacher_id,
  school_id,
  name,
  access_code
)
values (
  'b0300000-0000-4000-8000-000000000001',
  'b0100000-0000-4000-8000-000000000001',
  'b0200000-0000-4000-8000-000000000001',
  'Integrity Audit Class',
  'SAFE24'
);

insert into public.students (
  id,
  teacher_id,
  class_id,
  name,
  symbol_password
)
values (
  'b0400000-0000-4000-8000-000000000001',
  'b0100000-0000-4000-8000-000000000001',
  'b0300000-0000-4000-8000-000000000001',
  'Integrity Learner',
  '123'
);

insert into public.student_sessions (
  id,
  student_id,
  token,
  expires_at,
  revoked
)
values (
  'b0500000-0000-4000-8000-000000000001',
  'b0400000-0000-4000-8000-000000000001',
  'integrity-live-student-token',
  now() + interval '1 hour',
  false
);

-- A pending browser account cannot manufacture review provenance while keeping
-- its status pending.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0100000-0000-4000-8000-000000000002',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $pending_spoof$
begin
  begin
    update public.pending_teacher_accounts
    set reviewed_at = now(),
        reviewed_by = auth.uid(),
        rejection_reason = 'forged by browser'
    where user_id = auth.uid();
    raise exception 'pending browser account forged decision audit fields';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.find_or_create_school('Pending-created school');
    raise exception 'pending browser account created a school';
  exception
    when insufficient_privilege then null;
  end;
end
$pending_spoof$;

reset role;

do $pending_proof$
begin
  if exists (
    select 1
    from public.pending_teacher_accounts
    where user_id = 'b0100000-0000-4000-8000-000000000002'
      and (
        reviewed_at is not null
        or reviewed_by is not null
        or rejection_reason is not null
      )
  ) then
    raise exception 'pending audit-field spoof survived the trigger';
  end if;
end
$pending_proof$;

-- Even an administrator cannot forge decision fields with a direct table
-- update. The owned RPC derives reviewer identity and time on the server.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0100000-0000-4000-8000-000000000003',
  true
);

do $admin_decision$
begin
  begin
    update public.pending_teacher_accounts
    set status = 'rejected',
        approval_status = 'rejected',
        role = 'pending',
        reviewed_at = timestamp with time zone '2001-01-01 00:00:00+00',
        reviewed_by = 'b0100000-0000-4000-8000-000000000002'
    where user_id = 'b0100000-0000-4000-8000-000000000001';
    raise exception 'administrator bypassed the decision RPC';
  exception
    when insufficient_privilege then null;
  end;

  perform public.admin_set_teacher_account_status(
    (
      select id
      from public.pending_teacher_accounts
      where user_id = 'b0100000-0000-4000-8000-000000000001'
    ),
    'approved',
    null
  );

  if not exists (
    select 1
    from public.pending_teacher_accounts
    where user_id = 'b0100000-0000-4000-8000-000000000001'
      and role = 'teacher'
      and status = 'approved'
      and approval_status = 'approved'
      and reviewed_by = auth.uid()
      and reviewed_at > now() - interval '1 minute'
  ) then
    raise exception 'server-owned administrator decision was not recorded';
  end if;
end
$admin_decision$;

reset role;

-- Existing schools remain usable after the quota is full, while new directory
-- creation is bounded for an approved teacher.
insert into public.school_creation_rate_limits (
  actor_id,
  creation_count,
  window_started_at,
  updated_at
)
values (
  'b0100000-0000-4000-8000-000000000001',
  5,
  now(),
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0100000-0000-4000-8000-000000000001',
  true
);

do $school_quota$
begin
  if not exists (
    select 1
    from public.find_or_create_school('Integrity Audit School')
  ) then
    raise exception 'existing school lookup was blocked by the creation quota';
  end if;

  begin
    perform public.find_or_create_school('Sixth school in one day');
    raise exception 'teacher exceeded the school creation quota';
  exception
    when raise_exception then
      if sqlerrm not like '%school-creation limit%' then
        raise;
      end if;
  end;
end
$school_quota$;

reset role;

-- Error ingestion uses a server-derived anonymous caller bucket. Rotating both
-- the client event UUID and client fingerprint cannot bypass it.
select set_config(
  'request.headers',
  '{"x-forwarded-for":"198.51.100.88"}',
  true
);

do $prepare_error_limit$
declare
  v_caller_key text;
begin
  v_caller_key := encode(
    digest(
      'literacy-path-error-caller-v1:'
        || public.class_access_network_fingerprint(),
      'sha256'
    ),
    'hex'
  );

  insert into public.app_error_rate_limits (
    bucket_key,
    dimension,
    attempt_count,
    window_started_at,
    expires_at,
    updated_at
  )
  values (
    v_caller_key,
    'caller',
    60,
    now(),
    now() + interval '1 minute',
    now()
  );
end
$prepare_error_limit$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $rotating_error_client$
declare
  v_first json;
  v_second json;
begin
  v_first := public.report_app_error(
    'b0600000-0000-4000-8000-000000000001',
    'integrity-test',
    'abcdef12',
    'error',
    'student.home',
    'Error',
    'global',
    array['src/app.js:1:1'],
    1
  );
  v_second := public.report_app_error(
    'b0600000-0000-4000-8000-000000000002',
    'integrity-test',
    'fedcba98',
    'error',
    'student.home',
    'Error',
    'global',
    array['src/app.js:1:1'],
    1
  );

  if v_first ->> 'error' is distinct from 'rate_limited'
     or v_second ->> 'error' is distinct from 'rate_limited'
  then
    raise exception 'rotating client identifiers bypassed the server caller bucket';
  end if;
end
$rotating_error_client$;

reset role;
delete from public.app_error_rate_limits;

insert into public.app_error_rate_limits (
  bucket_key,
  dimension,
  attempt_count,
  window_started_at,
  expires_at,
  updated_at
)
values (
  encode(digest('literacy-path-error-global-v1', 'sha256'), 'hex'),
  'global',
  1000,
  now(),
  now() + interval '1 minute',
  now()
);

set local role anon;

do $global_error_limit$
declare
  v_result json;
begin
  v_result := public.report_app_error(
    'b0600000-0000-4000-8000-000000000003',
    'integrity-test',
    '1234abcd',
    'error',
    'student.home',
    'Error',
    'global',
    array['src/app.js:1:1'],
    1
  );
  if v_result ->> 'error' is distinct from 'rate_limited' then
    raise exception 'global anonymous error-ingestion limit did not hold';
  end if;
end
$global_error_limit$;

reset role;
delete from public.app_error_rate_limits;

-- A valid report is idempotent even once the session quota is full. A new
-- report from the same session is rejected.
set local role anon;

do $initial_student_report$
declare
  v_report record;
begin
  select *
  into v_report
  from public.report_assessment_question(
    'integrity-live-student-token',
    'b0400000-0000-4000-8000-000000000001',
    'question',
    'b0700000-0000-4000-8000-000000000001',
    '{"schemaVersion":1,"questionId":"integrity-question"}'::jsonb
  );

  if v_report.report_id is distinct from
    'b0700000-0000-4000-8000-000000000001'
  then
    raise exception 'initial student question report was not saved';
  end if;
end
$initial_student_report$;

reset role;
update public.assessment_question_report_rate_limits
set attempt_count = 30,
    window_started_at = now(),
    expires_at = now() + interval '1 hour'
where bucket_key = encode(
  digest(
    'literacy-path-question-report-session-v1:'
      || 'b0500000-0000-4000-8000-000000000001',
    'sha256'
  ),
  'hex'
);

set local role anon;

do $question_session_quota$
declare
  v_retry record;
begin
  select *
  into v_retry
  from public.report_assessment_question(
    'integrity-live-student-token',
    'b0400000-0000-4000-8000-000000000001',
    'question',
    'b0700000-0000-4000-8000-000000000001',
    '{"schemaVersion":1,"questionId":"integrity-question"}'::jsonb
  );

  if v_retry.report_id is null then
    raise exception 'idempotent report retry was blocked by the quota';
  end if;

  begin
    perform public.report_assessment_question(
      'integrity-live-student-token',
      'b0400000-0000-4000-8000-000000000001',
      'question',
      'b0700000-0000-4000-8000-000000000002',
      '{"schemaVersion":1}'::jsonb
    );
    raise exception 'session exceeded the question-report quota';
  exception
    when raise_exception then
      if sqlerrm not like '%Too many question reports%' then
        raise;
      end if;
  end;
end
$question_session_quota$;

reset role;
delete from public.assessment_question_report_rate_limits;
insert into public.assessment_question_report_rate_limits (
  bucket_key,
  dimension,
  attempt_count,
  window_started_at,
  expires_at,
  updated_at
)
values (
  encode(
    digest(
      'literacy-path-question-report-school-v1:'
        || 'b0200000-0000-4000-8000-000000000001',
      'sha256'
    ),
    'hex'
  ),
  'school',
  500,
  now(),
  now() + interval '1 hour',
  now()
);

set local role anon;

do $question_school_quota$
begin
  begin
    perform public.report_assessment_question(
      'integrity-live-student-token',
      'b0400000-0000-4000-8000-000000000001',
      'image',
      'b0700000-0000-4000-8000-000000000003',
      '{"schemaVersion":1}'::jsonb
    );
    raise exception 'school exceeded the question-report review-queue quota';
  exception
    when raise_exception then
      if sqlerrm not like '%Too many question reports%' then
        raise;
      end if;
  end;
end
$question_school_quota$;

reset role;

-- The everyday teacher archive path revokes an already-live session.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0100000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select * from public.teacher_set_student_archived(
  'b0400000-0000-4000-8000-000000000001',
  'b0300000-0000-4000-8000-000000000001',
  true
);

reset role;

do $teacher_archive_proof$
begin
  if not exists (
    select 1
    from public.students
    where id = 'b0400000-0000-4000-8000-000000000001'
      and archived_at is not null
  ) or not exists (
    select 1
    from public.student_sessions
    where id = 'b0500000-0000-4000-8000-000000000001'
      and revoked = true
  ) then
    raise exception 'teacher archive did not revoke the live learner session';
  end if;
end
$teacher_archive_proof$;

set local role anon;

do $archived_access_denied$
declare
  v_login json;
begin
  v_login := public.student_login(
    'b0400000-0000-4000-8000-000000000001',
    '123',
    'integrity-device-0001',
    'SAFE24'
  );
  if v_login ->> 'error' is distinct from 'not_found' then
    raise exception 'archived learner received a fresh login: %', v_login;
  end if;

  begin
    perform public.report_assessment_question(
      'integrity-live-student-token',
      'b0400000-0000-4000-8000-000000000001',
      'question',
      'b0700000-0000-4000-8000-000000000004',
      '{}'::jsonb
    );
    raise exception 'archived learner used a revoked session to report';
  exception
    when insufficient_privilege then null;
  end;
end
$archived_access_denied$;

-- Explicit restore works, but it never revives the old revoked token.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'b0100000-0000-4000-8000-000000000001',
  true
);
select * from public.teacher_set_student_archived(
  'b0400000-0000-4000-8000-000000000001',
  'b0300000-0000-4000-8000-000000000001',
  false
);

reset role;
set local role anon;

do $restore_login$
declare
  v_login json;
begin
  v_login := public.student_login(
    'b0400000-0000-4000-8000-000000000001',
    '123',
    'integrity-device-0002',
    'SAFE24'
  );
  if coalesce((v_login ->> 'ok')::boolean, false) is not true then
    raise exception 'restored learner could not obtain a fresh login: %', v_login;
  end if;
end
$restore_login$;

-- Retention uses a direct student archive update. The table trigger must revoke
-- every session without relying on a particular application code path.
reset role;
insert into public.student_sessions (
  id,
  student_id,
  token,
  expires_at,
  revoked
)
values (
  'b0500000-0000-4000-8000-000000000002',
  'b0400000-0000-4000-8000-000000000001',
  'integrity-retention-token',
  now() + interval '1 hour',
  false
);

update public.students
set archived_at = now()
where id = 'b0400000-0000-4000-8000-000000000001';

do $retention_archive_proof$
begin
  if not exists (
    select 1
    from public.student_sessions
    where id = 'b0500000-0000-4000-8000-000000000002'
      and revoked = true
  ) then
    raise exception 'retention-style archive left a live learner session';
  end if;
end
$retention_archive_proof$;

set local role anon;

do $retention_report_denied$
begin
  begin
    perform public.report_assessment_question(
      'integrity-retention-token',
      'b0400000-0000-4000-8000-000000000001',
      'question',
      'b0700000-0000-4000-8000-000000000005',
      '{}'::jsonb
    );
    raise exception 'retention-archived learner reported with an old token';
  exception
    when insufficient_privilege then null;
  end;
end
$retention_report_denied$;

rollback;
