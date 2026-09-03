-- Stop rejecting a child's answer because the question's authored phase differs
-- from the assignment's phase.
--
-- `student_save_focus_assessment_answer` and `student_complete_focus_assessment`
-- compared p_answer/p_attempt `level` and `phase` against the member's
-- resolved_config and returned `assignment_mismatch` on any difference. Neither
-- value is ever stored from the client payload: the answer row does not carry a
-- level or phase at all, and `assessment_attempts.skill_level` / `skill_phase`
-- are written from resolved_config a few lines further down. So the comparison
-- bought no integrity, and it had one very expensive failure mode.
--
-- "Phase" means two different things either side of the wire. In resolved_config
-- it is the step of the assessment path a teacher assigned. In the v3 question
-- bank it is a property of the item -- for Initial Sounds level 1 it is an
-- alphabet split, letters a-m phase 1 and n-z phase 2, with no letter in both --
-- and the round selectors choose items without consulting it. A child working a
-- Level 1 Phase 1 assignment therefore reached a letter the bank calls phase 2,
-- the answer was refused, and the app told the teacher to check the connection.
--
-- The skill_id guard is the one that carries weight (it IS stored, as the
-- answer's skill/stage), so it stays. The client also now sends the assigned
-- level and phase, so this migration and that change each fix the fault alone.
--
-- Bodies below are copied verbatim from 20260828120000_student_focus_sessions.sql
-- with only those comparisons removed.

create or replace function public.student_save_focus_assessment_answer(
  p_token text,
  p_session_id uuid,
  p_answer jsonb
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_inserted integer := 0;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_answer is null
    or jsonb_typeof(p_answer) <> 'object'
    or octet_length(p_answer::text) > 65536
    or nullif(btrim(coalesce(p_answer ->> 'answer_event_id', '')), '') is null
    or char_length(p_answer ->> 'answer_event_id') > 160
    or nullif(btrim(coalesce(p_answer ->> 'skill_id', '')), '') is null
    or char_length(coalesce(p_answer ->> 'question', '')) > 10000
    or char_length(coalesce(p_answer ->> 'passage', '')) > 50000
    or char_length(coalesce(p_answer ->> 'chosen', '')) > 10000
    or char_length(coalesce(p_answer ->> 'correct', '')) > 10000
  then
    return json_build_object('ok', false, 'error', 'invalid_answer');
  end if;

  select member.* into v_member
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where session.id = p_session_id
    and session.target = 'skills_assessment'
    and session.status = 'active'
    and session.expires_at > now()
    and member.student_id = v_student.id
    and member.active
  for update of member;

  if v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  select * into v_session
  from public.student_focus_sessions
  where id = v_member.session_id;
  if p_answer ->> 'skill_id' <> v_member.resolved_config ->> 'skill_id' then
    return json_build_object('ok', false, 'error', 'assignment_mismatch');
  end if;

  insert into public.answers (
    student_id, teacher_id, client_event_id, skill, stage, diagnostic_target,
    question, passage, chosen_answer, correct_answer, is_correct, answered_at
  ) values (
    v_student.id,
    v_session.teacher_id,
    p_answer ->> 'answer_event_id',
    coalesce(p_answer ->> 'skill_label', p_answer ->> 'skill_id'),
    coalesce(p_answer ->> 'stage', p_answer ->> 'skill_label', p_answer ->> 'skill_id'),
    nullif(p_answer ->> 'diagnostic_target', ''),
    coalesce(p_answer ->> 'question', ''),
    coalesce(p_answer ->> 'passage', ''),
    coalesce(p_answer ->> 'chosen', ''),
    coalesce(p_answer ->> 'correct', ''),
    coalesce((p_answer ->> 'is_correct')::boolean, false),
    now()
  )
  on conflict (teacher_id, client_event_id) where client_event_id is not null do nothing;
  get diagnostics v_inserted = row_count;

  update public.student_focus_session_members
     set status = case when status = 'assigned' then 'active' else status end,
         current_view = 'assessment',
         content_ok = true,
         last_seen_at = now(),
         updated_at = now()
   where session_id = v_session.id and student_id = v_student.id;

  return json_build_object('ok', true, 'duplicate', v_inserted = 0, 'updated_at', now());
exception
  when invalid_text_representation then
    return json_build_object('ok', false, 'error', 'invalid_answer');
end;
$$;

create or replace function public.student_complete_focus_assessment(
  p_token text,
  p_session_id uuid,
  p_attempt jsonb
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_payload jsonb;
  v_attempt_id text;
  v_total integer;
  v_correct integer;
  v_question_total integer;
  v_question_correct integer;
  v_inserted integer := 0;
  v_attempts integer := 0;
  v_level_one_passed boolean := false;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_attempt is null
    or jsonb_typeof(p_attempt) <> 'object'
    or octet_length(p_attempt::text) > 4900000
  then
    return json_build_object('ok', false, 'error', 'invalid_attempt');
  end if;

  select member.* into v_member
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where session.id = p_session_id
    and session.target = 'skills_assessment'
    and session.status = 'active'
    and session.expires_at > now()
    and member.student_id = v_student.id
    and member.active
  for update of member;

  if v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  select * into v_session
  from public.student_focus_sessions
  where id = v_member.session_id;

  v_attempt_id := nullif(btrim(coalesce(p_attempt ->> 'attemptId', '')), '');
  v_total := coalesce((p_attempt ->> 'totalQuestions')::integer, -1);
  v_correct := coalesce((p_attempt ->> 'correctCount')::integer, -1);
  if jsonb_typeof(p_attempt -> 'questionRecords') <> 'array' then
    return json_build_object('ok', false, 'error', 'invalid_attempt');
  end if;
  v_question_total := jsonb_array_length(p_attempt -> 'questionRecords');
  select count(*) filter (where coalesce((question ->> 'isCorrect')::boolean, false))
    into v_question_correct
  from jsonb_array_elements(p_attempt -> 'questionRecords') question;
  if v_attempt_id is null
    or char_length(v_attempt_id) > 200
    or p_attempt ->> 'skillId' <> v_member.resolved_config ->> 'skill_id'
    or coalesce(p_attempt ->> 'assessmentType', '') <> 'skill_checkpoint'
    or v_total not between 1 and 100
    or v_correct not between 0 and v_total
    or v_question_total <> v_total
    or v_question_correct <> v_correct
    or coalesce(p_attempt ->> 'administrationStatus', 'completed') <> 'completed'
    or nullif(btrim(coalesce(p_attempt ->> 'assessmentVersion', '')), '') is null
    or nullif(btrim(coalesce(p_attempt ->> 'contentVersion', '')), '') is null
    or nullif(btrim(coalesce(p_attempt ->> 'policyVersion', '')), '') is null
  then
    return json_build_object('ok', false, 'error', 'assignment_mismatch');
  end if;

  v_payload := p_attempt || jsonb_build_object(
    'studentId', v_student.id::text,
    'studentName', v_student.name,
    'classId', v_session.class_id::text,
    'teacherId', v_session.teacher_id::text,
    'administrationMode', 'student_independent',
    'focusSessionId', v_session.id::text,
    'assignedByTeacher', true
  );

  insert into public.assessment_attempts (
    attempt_id, student_id, class_id, teacher_id, assessment_type,
    skill_id, skill_name, skill_level, skill_phase, started_at, completed_at,
    total_questions, correct_count, accuracy, status, administration_status,
    schema_version, evidence_schema_version, assessment_version, content_version,
    policy_version, payload, raw_evidence, updated_at
  ) values (
    v_attempt_id,
    v_student.id::text,
    v_session.class_id::text,
    v_session.teacher_id,
    'skill_checkpoint',
    v_member.resolved_config ->> 'skill_id',
    v_member.resolved_config ->> 'skill_label',
    (v_member.resolved_config ->> 'level')::integer,
    (v_member.resolved_config ->> 'phase')::integer,
    coalesce((p_attempt ->> 'startedAt')::timestamptz, now()),
    coalesce((p_attempt ->> 'completedAt')::timestamptz, now()),
    v_total,
    v_correct,
    round((v_correct::numeric / v_total::numeric) * 100, 2),
    coalesce(nullif(p_attempt ->> 'status', ''), 'evidence_recorded'),
    'completed',
    coalesce((p_attempt ->> 'schemaVersion')::integer, 2),
    1,
    p_attempt ->> 'assessmentVersion',
    p_attempt ->> 'contentVersion',
    p_attempt ->> 'policyVersion',
    v_payload,
    '{}'::jsonb,
    now()
  ) on conflict (attempt_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 and not exists (
    select 1
    from public.assessment_attempts existing
    where existing.attempt_id = v_attempt_id
      and existing.teacher_id = v_session.teacher_id
      and existing.student_id = v_student.id::text
      and existing.class_id = v_session.class_id::text
      and existing.skill_id = v_member.resolved_config ->> 'skill_id'
      and existing.payload ->> 'focusSessionId' = v_session.id::text
  ) then
    return json_build_object('ok', false, 'error', 'attempt_id_conflict');
  end if;

  select
    count(*),
    count(distinct attempt.skill_phase) filter (
      where attempt.skill_level = 1
        and attempt.skill_phase in (1, 2)
        and attempt.total_questions > 0
        and (attempt.correct_count::numeric / attempt.total_questions::numeric) >= 0.70
        and attempt.administration_status = 'completed'
    ) = 2
  into v_attempts, v_level_one_passed
  from public.assessment_attempts attempt
  where attempt.teacher_id = v_session.teacher_id
    and attempt.student_id = v_student.id::text
    and attempt.skill_id = v_member.resolved_config ->> 'skill_id';

  insert into public.mastery (
    student_id, teacher_id, checkpoint_id, skill_id, skill_label,
    mastered, attempts, last_score, last_total, updated_at
  ) values (
    v_student.id,
    v_session.teacher_id,
    v_attempt_id,
    v_member.resolved_config ->> 'skill_id',
    v_member.resolved_config ->> 'skill_label',
    v_level_one_passed,
    greatest(1, v_attempts),
    v_correct,
    v_total,
    now()
  ) on conflict (teacher_id, checkpoint_id) where checkpoint_id is not null do nothing;

  update public.student_focus_session_members
     set status = 'completed',
         completed_at = coalesce(completed_at, now()),
         current_view = 'assessment_complete',
         content_ok = true,
         last_seen_at = now(),
         updated_at = now()
   where session_id = v_session.id and student_id = v_student.id;

  return json_build_object('ok', true, 'duplicate', v_inserted = 0, 'attempt_id', v_attempt_id, 'completed_at', now());
exception
  when invalid_text_representation or datetime_field_overflow then
    return json_build_object('ok', false, 'error', 'invalid_attempt');
end;
$$;

revoke all on function public.student_save_focus_assessment_answer(text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.student_save_focus_assessment_answer(text, uuid, jsonb)
  to anon, authenticated;

revoke all on function public.student_complete_focus_assessment(text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.student_complete_focus_assessment(text, uuid, jsonb)
  to anon, authenticated;
