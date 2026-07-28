\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_teacher_id constant uuid := 'd81254ce-9ac0-4b4c-882e-1ca82e0f2001';
  v_other_teacher_id constant uuid := 'd81254ce-9ac0-4b4c-882e-1ca82e0f2002';
  v_source_class_id constant uuid := 'e81254ce-9ac0-4b4c-882e-1ca82e0f3001';
  v_target_class_id constant uuid := 'e81254ce-9ac0-4b4c-882e-1ca82e0f3002';
  v_other_class_id constant uuid := 'e81254ce-9ac0-4b4c-882e-1ca82e0f3003';
  v_student_id constant uuid := 'f81254ce-9ac0-4b4c-882e-1ca82e0f4001';
  v_moved_id uuid;
  v_moved_class_id uuid;
begin
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
      v_teacher_id,
      'authenticated',
      'authenticated',
      'transfer-check@example.invalid',
      '{"audit_only": true}'::jsonb,
      now(),
      now()
    ),
    (
      v_other_teacher_id,
      'authenticated',
      'authenticated',
      'other-transfer-check@example.invalid',
      '{"audit_only": true}'::jsonb,
      now(),
      now()
    );

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    role,
    status,
    approval_status
  )
  values
    (
      v_teacher_id,
      'transfer-check@example.invalid',
      'teacher',
      'approved',
      'approved'
    ),
    (
      v_other_teacher_id,
      'other-transfer-check@example.invalid',
      'teacher',
      'approved',
      'approved'
    )
  on conflict (user_id) do update
  set email = excluded.email,
      role = excluded.role,
      status = excluded.status,
      approval_status = excluded.approval_status;

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.classes (id, teacher_id, name)
  values
    (v_source_class_id, v_teacher_id, 'Transfer source'),
    (v_target_class_id, v_teacher_id, 'Transfer target'),
    (v_other_class_id, v_other_teacher_id, 'Other teacher class');

  insert into public.students (id, teacher_id, class_id, name)
  values (v_student_id, v_teacher_id, v_source_class_id, 'Transfer learner');

  insert into public.student_sessions (student_id, token)
  values (v_student_id, 'transfer-test-token');

  insert into public.assessment_attempts (
    attempt_id,
    student_id,
    class_id,
    teacher_id
  )
  values (
    'transfer-evidence-check',
    v_student_id::text,
    v_source_class_id::text,
    v_teacher_id
  );

  begin
    perform public.teacher_transfer_student(
      v_student_id,
      v_source_class_id,
      v_other_class_id
    );
    raise exception 'transfer to another teacher''s class unexpectedly succeeded';
  exception
    when sqlstate '22023' then
      null;
  end;

  if (
    select class_id
    from public.students
    where id = v_student_id
  ) is distinct from v_source_class_id
  then
    raise exception 'failed transfer changed the student''s class';
  end if;

  if (
    select revoked
    from public.student_sessions
    where student_id = v_student_id
  ) is distinct from false
  then
    raise exception 'failed transfer revoked the learner session';
  end if;

  select moved.id, moved.class_id
    into v_moved_id, v_moved_class_id
  from public.teacher_transfer_student(
    v_student_id,
    v_source_class_id,
    v_target_class_id
  ) moved;

  if v_moved_id is distinct from v_student_id
     or v_moved_class_id is distinct from v_target_class_id
  then
    raise exception 'transfer did not return the moved roster row';
  end if;

  if (
    select revoked
    from public.student_sessions
    where student_id = v_student_id
  ) is distinct from true
  then
    raise exception 'successful transfer did not revoke the old learner session';
  end if;

  if (
    select class_id
    from public.assessment_attempts
    where attempt_id = 'transfer-evidence-check'
  ) is distinct from v_source_class_id::text
  then
    raise exception 'transfer rewrote historical assessment class provenance';
  end if;
end
$test$;

rollback;
