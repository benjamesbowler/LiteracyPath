\set ON_ERROR_STOP on

begin;

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
  'fc000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'intervention-lifecycle@example.invalid',
  '{"audit_only": true}'::jsonb,
  now(),
  now()
);

insert into public.classes (id, teacher_id, name)
values (
  'fc100000-0000-4000-8000-000000000001',
  'fc000000-0000-4000-8000-000000000001',
  'Intervention lifecycle class'
);

insert into public.students (id, teacher_id, class_id, name, archived_at)
values
  (
    'fc200000-0000-4000-8000-000000000001',
    'fc000000-0000-4000-8000-000000000001',
    'fc100000-0000-4000-8000-000000000001',
    'Active learner',
    null
  ),
  (
    'fc200000-0000-4000-8000-000000000002',
    'fc000000-0000-4000-8000-000000000001',
    'fc100000-0000-4000-8000-000000000001',
    'Archived learner',
    now()
  );

do $test$
declare
  v_rejected boolean := false;
  v_message text;
begin
  begin
    insert into public.teacher_interventions (
      teacher_id,
      class_id,
      owner_label,
      group_label,
      student_ids,
      focus,
      activity,
      planned_for
    )
    values (
      'fc000000-0000-4000-8000-000000000001',
      'fc100000-0000-4000-8000-000000000001',
      'Class teacher',
      'Archived target',
      array['fc200000-0000-4000-8000-000000000002'::uuid],
      'Initial sounds',
      'Short guided practice',
      current_date
    );
  exception
    when others then
      get stacked diagnostics v_message = message_text;
      if v_message like '%must be active and belong%' then
        v_rejected := true;
      else
        raise;
      end if;
  end;

  if not v_rejected then
    raise exception 'an archived learner was accepted into a support plan';
  end if;

  v_rejected := false;
  begin
    insert into public.teacher_interventions (
      teacher_id,
      class_id,
      owner_label,
      group_label,
      student_ids,
      focus,
      activity,
      planned_for
    )
    values (
      'fc000000-0000-4000-8000-000000000001',
      'fc100000-0000-4000-8000-000000000001',
      'Class teacher',
      'Empty target',
      '{}'::uuid[],
      'Initial sounds',
      'Short guided practice',
      current_date
    );
  exception
    when others then
      get stacked diagnostics v_message = message_text;
      if v_message like '%at least one learner%' then
        v_rejected := true;
      else
        raise;
      end if;
  end;

  if not v_rejected then
    raise exception 'a zero-student support plan was accepted';
  end if;
end
$test$;

rollback;
