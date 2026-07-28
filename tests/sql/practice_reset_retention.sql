\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_teacher_id constant uuid := '11000000-0000-4000-8000-000000000001';
  v_class_id constant uuid := '21000000-0000-4000-8000-000000000001';
  v_student_id constant uuid := '31000000-0000-4000-8000-000000000001';
  v_result jsonb;
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
  values (
    v_teacher_id,
    'authenticated',
    'authenticated',
    'practice-reset-check@example.invalid',
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
  values (
    v_teacher_id,
    'practice-reset-check@example.invalid',
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
  values (v_class_id, v_teacher_id, 'Practice reset check');

  insert into public.students (id, teacher_id, class_id, name)
  values (v_student_id, v_teacher_id, v_class_id, 'Retained evidence');

  insert into public.student_progress (
    student_id,
    area,
    key,
    payload,
    updated_at
  )
  values
    (v_student_id, 'profile', '__all__', '{"reducedChoiceMode": true}', now()),
    (v_student_id, 'guided_reading', 'book-1', '{"completedPages": 4}', now()),
    (v_student_id, 'story_quests', 'story-1', '{"completed": true}', now()),
    (v_student_id, 'phonics_letters', '__all__', '{"a": "complete"}', now()),
    (v_student_id, 'phonics_quest', '__all__', '{"trail": {"currentStop": 4}}', now());

  v_result := public.teacher_reset_student_progress(
    v_student_id,
    '2026-07-27T12:00:00.000Z'::timestamptz
  );

  if v_result ->> 'ok' is distinct from 'true'
     or v_result ->> 'learnerProfileRetained' is distinct from 'true'
     or v_result ->> 'guidedReadingRetained' is distinct from 'true'
     or v_result ->> 'storyQuestRetained' is distinct from 'true'
  then
    raise exception 'practice reset did not declare its retention contract: %', v_result;
  end if;

  if (
    select array_agg(area order by area)
    from public.student_progress
    where student_id = v_student_id
      and area <> '__reset__'
  ) is distinct from array['guided_reading', 'profile', 'story_quests']::text[]
  then
    raise exception 'practice reset did not retain exactly the promised progress areas';
  end if;

  if not exists (
    select 1
    from public.student_progress
    where student_id = v_student_id
      and area = '__reset__'
      and payload ->> 'guidedReadingRetained' = 'true'
      and payload ->> 'storyQuestRetained' = 'true'
  ) then
    raise exception 'cross-device reset marker is missing retention metadata';
  end if;
end
$test$;

rollback;
