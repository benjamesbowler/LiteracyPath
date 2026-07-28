-- Durable, cross-device assessment-question reports.
--
-- The retired browser-only flag store told the reporter that a report was
-- "sent" even though it never left localStorage. This table is deliberately
-- private: a teacher or a valid short-lived student session may submit through
-- one bounded RPC, while only app administrators may review or change rows.

create table if not exists public.assessment_question_reports (
  id uuid primary key,
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  teacher_id uuid references auth.users(id) on delete set null,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_kind text not null
    check (reporter_kind in ('teacher', 'student')),
  flag_type text not null
    check (flag_type in ('image', 'question')),
  status text not null default 'open'
    check (status in ('open', 'reviewed')),
  decision text
    check (
      decision is null
      or decision in ('image_needs_checking', 'question_needs_checking', 'no_change_needed')
    ),
  decision_notes text not null default '',
  question_id text not null default '',
  skill_id text not null default '',
  skill_name text not null default '',
  prompt text not null default '',
  question_text text not null default '',
  sentence text not null default '',
  target_word text not null default '',
  correct_answer text not null default '',
  answer_choices jsonb not null default '[]'::jsonb
    check (jsonb_typeof(answer_choices) = 'array'),
  images jsonb not null default '[]'::jsonb
    check (jsonb_typeof(images) = 'array'),
  question_snapshot jsonb not null default '{}'::jsonb
    check (jsonb_typeof(question_snapshot) = 'object'),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_question_reports_school_status_idx
  on public.assessment_question_reports (school_id, status, created_at desc);

create index if not exists assessment_question_reports_question_idx
  on public.assessment_question_reports (question_id, created_at desc);

alter table public.assessment_question_reports enable row level security;

revoke all on public.assessment_question_reports from public, anon, authenticated;
grant select, delete on public.assessment_question_reports to authenticated;

drop policy if exists "App admins read assessment question reports"
  on public.assessment_question_reports;
create policy "App admins read assessment question reports"
  on public.assessment_question_reports for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins delete assessment question reports"
  on public.assessment_question_reports;
create policy "App admins delete assessment question reports"
  on public.assessment_question_reports for delete to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.report_assessment_question(
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
  v_actor_id uuid := auth.uid();
  v_actor_kind text;
  v_class public.classes;
  v_flag_type text := lower(btrim(coalesce(p_flag_type, '')));
  v_report public.assessment_question_reports;
  v_safe_choices jsonb := '[]'::jsonb;
  v_safe_images jsonb := '[]'::jsonb;
  v_safe_snapshot jsonb;
  v_snapshot jsonb := coalesce(p_question_snapshot, '{}'::jsonb);
  v_student public.students;
begin
  if p_report_id is null then
    raise exception using
      errcode = '22023',
      message = 'A report reference is required.';
  end if;

  if v_flag_type not in ('image', 'question') then
    raise exception using
      errcode = '22023',
      message = 'The report type must be image or question.';
  end if;

  if jsonb_typeof(v_snapshot) is distinct from 'object'
     or octet_length(v_snapshot::text) > 65536
  then
    raise exception using
      errcode = '22023',
      message = 'The question snapshot is invalid or too large.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', left(btrim(coalesce(choice.value ->> 'label', '')), 200),
        'value', left(btrim(coalesce(choice.value ->> 'value', '')), 200),
        'image', case
          when coalesce(choice.value ->> 'image', '') ~ '^/[A-Za-z0-9][A-Za-z0-9_./-]*$'
            and position('..' in coalesce(choice.value ->> 'image', '')) = 0
          then left(choice.value ->> 'image', 500)
          else ''
        end
      )
      order by choice.ordinality
    ),
    '[]'::jsonb
  )
  into v_safe_choices
  from jsonb_array_elements(
    case
      when jsonb_typeof(v_snapshot -> 'answerChoices') = 'array'
      then v_snapshot -> 'answerChoices'
      else '[]'::jsonb
    end
  ) with ordinality as choice(value, ordinality)
  where choice.ordinality <= 12
    and jsonb_typeof(choice.value) = 'object';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'label', left(btrim(coalesce(image.value ->> 'label', '')), 200),
        'path', case
          when coalesce(image.value ->> 'path', '') ~ '^/[A-Za-z0-9][A-Za-z0-9_./-]*$'
            and position('..' in coalesce(image.value ->> 'path', '')) = 0
          then left(image.value ->> 'path', 500)
          else ''
        end
      )
      order by image.ordinality
    ),
    '[]'::jsonb
  )
  into v_safe_images
  from jsonb_array_elements(
    case
      when jsonb_typeof(v_snapshot -> 'images') = 'array'
      then v_snapshot -> 'images'
      else '[]'::jsonb
    end
  ) with ordinality as image(value, ordinality)
  where image.ordinality <= 12
    and jsonb_typeof(image.value) = 'object';

  v_safe_images := coalesce((
    select jsonb_agg(safe_image.value)
    from jsonb_array_elements(v_safe_images) as safe_image(value)
    where nullif(safe_image.value ->> 'path', '') is not null
  ), '[]'::jsonb);

  v_safe_snapshot := jsonb_build_object(
    'schemaVersion', 1,
    'questionId', left(btrim(coalesce(v_snapshot ->> 'questionId', '')), 240),
    'skillId', left(btrim(coalesce(v_snapshot ->> 'skillId', '')), 240),
    'skillName', left(btrim(coalesce(v_snapshot ->> 'skillName', '')), 240),
    'prompt', left(btrim(coalesce(v_snapshot ->> 'prompt', '')), 2000),
    'questionText', left(btrim(coalesce(v_snapshot ->> 'questionText', '')), 2000),
    'sentence', left(btrim(coalesce(v_snapshot ->> 'sentence', '')), 4000),
    'targetWord', left(btrim(coalesce(v_snapshot ->> 'targetWord', '')), 500),
    'correctAnswer', left(btrim(coalesce(v_snapshot ->> 'correctAnswer', '')), 1000),
    'answerChoices', v_safe_choices,
    'images', v_safe_images
  );

  if nullif(btrim(coalesce(p_student_token, '')), '') is not null then
    select student.*
      into v_student
    from public.student_sessions session
    join public.students student on student.id = session.student_id
    where session.token = p_student_token
      and session.revoked = false
      and session.expires_at > now()
    limit 1;

    if v_student.id is null
       or (p_student_id is not null and p_student_id <> v_student.id)
    then
      raise exception using
        errcode = '42501',
        message = 'This student session cannot send the report.';
    end if;

    v_actor_kind := 'student';
    v_actor_id := null;
  else
    perform public.assert_current_actor_teacher_access();

    select student.*
      into v_student
    from public.students student
    where student.id = p_student_id
      and (
        student.teacher_id = auth.uid()
        or public.is_app_admin(auth.uid())
      )
    limit 1;

    if v_student.id is null then
      raise exception using
        errcode = '42501',
        message = 'This account cannot report a question for that student.';
    end if;

    v_actor_kind := 'teacher';
  end if;

  select class.*
    into v_class
  from public.classes class
  where class.id = v_student.class_id;

  if v_class.id is null or v_class.school_id is null then
    raise exception using
      errcode = '23502',
      message = 'The report needs a class with a school.';
  end if;

  insert into public.assessment_question_reports (
    id,
    school_id,
    class_id,
    student_id,
    teacher_id,
    reporter_user_id,
    reporter_kind,
    flag_type,
    question_id,
    skill_id,
    skill_name,
    prompt,
    question_text,
    sentence,
    target_word,
    correct_answer,
    answer_choices,
    images,
    question_snapshot
  )
  values (
    p_report_id,
    v_class.school_id,
    v_class.id,
    v_student.id,
    v_student.teacher_id,
    v_actor_id,
    v_actor_kind,
    v_flag_type,
    v_safe_snapshot ->> 'questionId',
    v_safe_snapshot ->> 'skillId',
    v_safe_snapshot ->> 'skillName',
    v_safe_snapshot ->> 'prompt',
    v_safe_snapshot ->> 'questionText',
    v_safe_snapshot ->> 'sentence',
    v_safe_snapshot ->> 'targetWord',
    v_safe_snapshot ->> 'correctAnswer',
    v_safe_choices,
    v_safe_images,
    v_safe_snapshot
  )
  on conflict (id) do nothing
  returning * into v_report;

  -- Retrying an uncertain network response is idempotent, but a caller may
  -- only recover the row created for this same student and reporter context.
  if v_report.id is null then
    select report.*
      into v_report
    from public.assessment_question_reports report
    where report.id = p_report_id
      and report.student_id = v_student.id
      and report.flag_type = v_flag_type
      and (
        (v_actor_kind = 'student' and report.reporter_kind = 'student')
        or (
          v_actor_kind = 'teacher'
          and report.reporter_kind = 'teacher'
          and report.reporter_user_id = auth.uid()
        )
      )
    limit 1;
  end if;

  if v_report.id is null then
    raise exception using
      errcode = '23505',
      message = 'That report reference is already in use.';
  end if;

  return query
  select
    v_report.id,
    v_report.status,
    v_report.flag_type,
    v_report.created_at;
end;
$$;

comment on function public.report_assessment_question(text, uuid, text, uuid, jsonb) is
  'Persists one bounded, sanitized assessment-question report for an approved owning teacher, app administrator, or valid student session. Returns only an acknowledgement, never the private review row.';

notify pgrst, 'reload schema';
