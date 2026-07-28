-- Harden assessment-question reporting after the first durable release.
--
-- The submission RPC returns only a small acknowledgement. Evidence is
-- allow-listed and bounded before storage. Administrators record review
-- decisions through an RPC so the reviewer identity and timestamp always come
-- from the authenticated database session rather than browser-provided data.

alter table public.assessment_question_reports
  drop constraint if exists assessment_question_reports_class_id_fkey;

alter table public.assessment_question_reports
  alter column class_id drop not null;

alter table public.assessment_question_reports
  add constraint assessment_question_reports_class_id_fkey
  foreign key (class_id) references public.classes(id) on delete set null;

revoke update on public.assessment_question_reports from authenticated;

drop policy if exists "App admins update assessment question reports"
  on public.assessment_question_reports;

drop function if exists public.report_assessment_question(
  text, uuid, text, uuid, jsonb
);

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

  -- A retry after an uncertain response is safe, but the same reference cannot
  -- be used to inspect or acknowledge somebody else's report.
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

create or replace function public.admin_review_assessment_question_report(
  p_report_id uuid,
  p_decision text,
  p_notes text
)
returns setof public.assessment_question_reports
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_notes text := btrim(coalesce(p_notes, ''));
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception using
      errcode = '42501',
      message = 'Only an app administrator can review this report.';
  end if;

  if p_report_id is null then
    raise exception using
      errcode = '22023',
      message = 'Choose a report to review.';
  end if;

  if v_decision not in (
    'image_needs_checking',
    'question_needs_checking',
    'no_change_needed'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Choose a valid review decision.';
  end if;

  if char_length(v_notes) > 1000 then
    raise exception using
      errcode = '22023',
      message = 'Review notes must be 1,000 characters or fewer.';
  end if;

  return query
  update public.assessment_question_reports report
  set status = 'reviewed',
      decision = v_decision,
      decision_notes = v_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where report.id = p_report_id
  returning report.*;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'That report could not be found.';
  end if;
end;
$$;

comment on function public.admin_review_assessment_question_report(uuid, text, text) is
  'Records a bounded administrator decision and derives the reviewer identity and timestamp from the authenticated database session.';

revoke execute on function public.report_assessment_question(
  text, uuid, text, uuid, jsonb
) from public, anon, authenticated;
revoke execute on function public.admin_review_assessment_question_report(
  uuid, text, text
) from public, anon, authenticated;

notify pgrst, 'reload schema';
