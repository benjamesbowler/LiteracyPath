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
values
  (
    'a1100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'question-report-teacher@example.invalid',
    '{"audit_only": true}'::jsonb,
    now(),
    now()
  ),
  (
    'a1100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'question-report-other@example.invalid',
    '{"audit_only": true}'::jsonb,
    now(),
    now()
  ),
  (
    'a1100000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'question-report-admin@example.invalid',
    '{"audit_only": true}'::jsonb,
    now(),
    now()
  );

insert into public.schools (id, name)
values ('a1200000-0000-4000-8000-000000000001', 'Question report audit school');

insert into public.pending_teacher_accounts (
  user_id,
  email,
  role,
  status,
  approval_status,
  school_id
)
values
  (
    'a1100000-0000-4000-8000-000000000001',
    'question-report-teacher@example.invalid',
    'teacher',
    'approved',
    'approved',
    'a1200000-0000-4000-8000-000000000001'
  ),
  (
    'a1100000-0000-4000-8000-000000000002',
    'question-report-other@example.invalid',
    'teacher',
    'approved',
    'approved',
    'a1200000-0000-4000-8000-000000000001'
  )
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    approval_status = excluded.approval_status,
    school_id = excluded.school_id;

insert into public.app_admins (user_id, email)
values (
  'a1100000-0000-4000-8000-000000000003',
  'question-report-admin@example.invalid'
);

insert into public.classes (id, teacher_id, school_id, name)
values
  (
    'a1300000-0000-4000-8000-000000000001',
    'a1100000-0000-4000-8000-000000000001',
    'a1200000-0000-4000-8000-000000000001',
    'Question report class'
  ),
  (
    'a1300000-0000-4000-8000-000000000002',
    'a1100000-0000-4000-8000-000000000002',
    'a1200000-0000-4000-8000-000000000001',
    'Other teacher class'
  );

insert into public.students (id, teacher_id, class_id, name)
values
  (
    'a1400000-0000-4000-8000-000000000001',
    'a1100000-0000-4000-8000-000000000001',
    'a1300000-0000-4000-8000-000000000001',
    'Question report learner'
  ),
  (
    'a1400000-0000-4000-8000-000000000002',
    'a1100000-0000-4000-8000-000000000002',
    'a1300000-0000-4000-8000-000000000002',
    'Other teacher learner'
  );

insert into public.student_sessions (student_id, token)
values (
  'a1400000-0000-4000-8000-000000000001',
  'question-report-student-token'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a1100000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $teacher_test$
declare
  v_report record;
begin
  select *
    into v_report
  from public.report_assessment_question(
    null,
    'a1400000-0000-4000-8000-000000000001',
    'question',
    'a1500000-0000-4000-8000-000000000001',
    jsonb_build_object(
      'schemaVersion', 1,
      'questionId', 'question-report-teacher-test',
      'skillId', 'initial_sounds',
      'prompt', repeat('p', 2500),
      'answerChoices', (
        select jsonb_agg(jsonb_build_object(
          'label', repeat(item::text, 250),
          'value', 'choice-' || item,
          'image', case
            when item = 1 then 'https://tracker.example/choice.png'
            else '/choice-' || item || '.webp'
          end
        ) order by item)
        from generate_series(1, 20) item
      ),
      'images', (
        select jsonb_agg(jsonb_build_object(
          'label', 'Image ' || item,
          'path', case
            when item = 1 then 'https://tracker.example/image.png'
            else '/image-' || item || '.webp'
          end
        ) order by item)
        from generate_series(1, 20) item
      ),
      'secret', 'must-not-survive'
    )
  );

  if v_report.report_id is distinct from 'a1500000-0000-4000-8000-000000000001'
     or v_report.report_status is distinct from 'open'
     or v_report.report_type is distinct from 'question'
  then
    raise exception 'approved teacher submission did not return its bounded acknowledgement';
  end if;

  if (select count(*) from public.assessment_question_reports) <> 0 then
    raise exception 'teacher could directly read the private admin review table';
  end if;

  begin
    perform public.report_assessment_question(
      null,
      'a1400000-0000-4000-8000-000000000002',
      'question',
      'a1500000-0000-4000-8000-000000000099',
      '{}'::jsonb
    );
    raise exception 'teacher reported against another teacher''s student';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.assessment_question_reports (
      id,
      school_id,
      class_id,
      reporter_kind,
      flag_type
    )
    values (
      'a1500000-0000-4000-8000-000000000098',
      'a1200000-0000-4000-8000-000000000001',
      'a1300000-0000-4000-8000-000000000001',
      'teacher',
      'question'
    );
    raise exception 'teacher bypassed the report RPC with a direct insert';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.admin_review_assessment_question_report(
      'a1500000-0000-4000-8000-000000000001',
      'question_needs_checking',
      'not an administrator'
    );
    raise exception 'teacher recorded an administrator review decision';
  exception
    when insufficient_privilege then null;
  end;
end
$teacher_test$;

reset role;
update public.pending_teacher_accounts
set status = 'disabled',
    approval_status = 'disabled'
where user_id = 'a1100000-0000-4000-8000-000000000001';
set local role authenticated;

do $disabled_teacher_test$
begin
  begin
    perform public.report_assessment_question(
      null,
      'a1400000-0000-4000-8000-000000000001',
      'question',
      'a1500000-0000-4000-8000-000000000097',
      '{}'::jsonb
    );
    raise exception 'disabled teacher sent a report';
  exception
    when insufficient_privilege then null;
  end;
end
$disabled_teacher_test$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $student_test$
declare
  v_report record;
begin
  select *
    into v_report
  from public.report_assessment_question(
      'question-report-student-token',
      'a1400000-0000-4000-8000-000000000001',
      'image',
      'a1500000-0000-4000-8000-000000000002',
      jsonb_build_object(
        'schemaVersion', 1,
        'questionId', 'question-report-student-test',
        'images', jsonb_build_array(
          jsonb_build_object('label', 'Apple', 'path', '/apple.webp')
        )
      )
    );

  if v_report.report_id is distinct from 'a1500000-0000-4000-8000-000000000002'
     or v_report.report_type is distinct from 'image'
  then
    raise exception 'valid student-session submission did not return its bounded acknowledgement';
  end if;

  begin
    perform public.report_assessment_question(
      'not-a-valid-token',
      'a1400000-0000-4000-8000-000000000001',
      'image',
      'a1500000-0000-4000-8000-000000000096',
      '{}'::jsonb
    );
    raise exception 'invalid student token sent a report';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform count(*) from public.assessment_question_reports;
    raise exception 'anonymous caller directly read the private review table';
  exception
    when insufficient_privilege then null;
  end;
end
$student_test$;

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a1100000-0000-4000-8000-000000000003',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $admin_test$
begin
  if (select count(*) from public.assessment_question_reports) <> 2 then
    raise exception 'app admin could not read both cross-device reports';
  end if;

  if (
    select reporter_kind
    from public.assessment_question_reports
    where id = 'a1500000-0000-4000-8000-000000000001'
  ) is distinct from 'teacher'
  then
    raise exception 'teacher report attribution was not stored';
  end if;

  if (
    select jsonb_array_length(answer_choices)
    from public.assessment_question_reports
    where id = 'a1500000-0000-4000-8000-000000000001'
  ) <> 12
  then
    raise exception 'hostile answer choices were not bounded to 12';
  end if;

  if (
    select jsonb_array_length(images)
    from public.assessment_question_reports
    where id = 'a1500000-0000-4000-8000-000000000001'
  ) <> 11
  then
    raise exception 'unsafe or excessive image evidence was not removed';
  end if;

  if exists (
    select 1
    from public.assessment_question_reports report,
      jsonb_array_elements(report.images) image
    where report.id = 'a1500000-0000-4000-8000-000000000001'
      and image ->> 'path' like 'http%'
  ) then
    raise exception 'remote image URL survived server sanitization';
  end if;

  if (
    select question_snapshot ? 'secret'
    from public.assessment_question_reports
    where id = 'a1500000-0000-4000-8000-000000000001'
  ) then
    raise exception 'unapproved snapshot field survived server sanitization';
  end if;

  if (
    select char_length(prompt)
    from public.assessment_question_reports
    where id = 'a1500000-0000-4000-8000-000000000001'
  ) <> 2000
  then
    raise exception 'prompt was not bounded before storage';
  end if;

  begin
    update public.assessment_question_reports
    set reviewed_by = 'a1100000-0000-4000-8000-000000000001'
    where id = 'a1500000-0000-4000-8000-000000000001';
    raise exception 'administrator spoofed the reviewer with a direct update';
  exception
    when insufficient_privilege then null;
  end;

  perform public.admin_review_assessment_question_report(
    'a1500000-0000-4000-8000-000000000001',
    'question_needs_checking',
    'Question needs checking'
  );

  if (
    select decision = 'question_needs_checking'
      and reviewed_by = auth.uid()
      and reviewed_at is not null
    from public.assessment_question_reports
    where id = 'a1500000-0000-4000-8000-000000000001'
  ) is not true
  then
    raise exception 'app admin decision or server-owned review attribution was not saved';
  end if;

  delete from public.assessment_question_reports
  where id = 'a1500000-0000-4000-8000-000000000002';

  if (select count(*) from public.assessment_question_reports) <> 1 then
    raise exception 'app admin could not delete one report';
  end if;
end
$admin_test$;

rollback;
