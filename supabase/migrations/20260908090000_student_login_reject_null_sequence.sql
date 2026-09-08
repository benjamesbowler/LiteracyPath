-- Reject an absent submitted picture credential before issuing a learner session.
-- Preserve the current entry point, checks, failure accounting and execute boundary.
begin;

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

  if p_sequence is null
     or p_sequence !~ '^[1-9]{3}$'
     or v_student.symbol_password is distinct from p_sequence
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

notify pgrst, 'reload schema';

commit;
