-- Full, phase-specific Skills sittings and unscored media recovery.
-- Constants mirror skillBlueprints.js; behavioral/parity tests guard drift.
-- Forward-only migration. No assessment evidence is rewritten.
begin;

create or replace function public.lp_skill_assessment_sitting_size(p_skill_id text)
returns integer language sql immutable set search_path = '' as $$
  select items from (values
    ('initial_sounds', 10),
    ('final_sounds', 10),
    ('rhyming', 8),
    ('cvc_short_vowels', 10),
    ('short_vowel_discrimination', 10),
    ('hfw_1_25', 12),
    ('hfw_26_50', 12),
    ('hfw_51_75', 12),
    ('hfw_76_100', 12),
    ('blends', 10),
    ('digraphs', 10),
    ('long_vowels_silent_e', 12),
    ('vowel_teams', 12),
    ('r_controlled_vowels', 12),
    ('nouns', 8),
    ('verbs', 8),
    ('adjectives', 8),
    ('prepositions_of_place', 8),
    ('plurals', 8),
    ('prefixes_suffixes', 10),
    ('antonyms_synonyms', 8),
    ('homophones_homonyms', 10),
    ('sentence_comprehension', 8),
    ('key_details', 8),
    ('sequencing', 8),
    ('main_idea', 8),
    ('inference', 8),
    ('cause_effect', 8),
    ('context_clues', 8),
    ('theme_higher_comprehension', 8)
  ) as blueprint(skill_id, items) where skill_id = p_skill_id;
$$;

create or replace function public.lp_skill_assessment_sitting_summary(p_attempt jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  with normalized as (
    select question,
      coalesce(nullif(question ->> 'responseStatus', ''), case
        when question ->> 'isCorrect' = 'true' then 'correct'
        when question ->> 'isCorrect' = 'false' then 'incorrect'
        else 'not_administered' end) as response_state,
      coalesce((question ->> 'supported')::boolean, false)
        or coalesce((question ->> 'prompted')::boolean, false) as supported,
      coalesce(question ->> 'questionId', question ->> 'itemId', '') as item_id,
      coalesce((question ->> 'level')::integer, (question ->> 'itemLevel')::integer, (p_attempt ->> 'skillLevel')::integer, 1) as item_level,
      coalesce((question ->> 'phase')::integer, (question ->> 'itemPhase')::integer, (p_attempt ->> 'skillPhase')::integer, 1) as item_phase
    from jsonb_array_elements(case when jsonb_typeof(p_attempt -> 'questionRecords') = 'array'
      then p_attempt -> 'questionRecords' else '[]'::jsonb end) question
  ), scored as (
    select * from normalized where not supported and response_state in ('correct', 'incorrect', 'self_corrected', 'no_response')
  ), counts as (
    select count(*) as scored_count,
      count(*) filter (where response_state in ('correct', 'self_corrected')) as correct_count,
      count(distinct nullif(item_id, '')) as unique_count,
      coalesce(bool_and(item_level = coalesce((p_attempt ->> 'skillLevel')::integer, 1)
        and item_phase = coalesce((p_attempt ->> 'skillPhase')::integer, 1)
        and coalesce(question ->> 'skillId', p_attempt ->> 'skillId') = p_attempt ->> 'skillId'), false) as phase_valid
    from scored
  ), sized as (
    select *, greatest(public.lp_skill_assessment_sitting_size(p_attempt ->> 'skillId'),
      coalesce((p_attempt #>> '{policySnapshot,roundLength}')::integer,
        (p_attempt ->> 'totalQuestions')::integer, scored_count::integer)) as expected_items
    from counts
  ), complete as (
    select *, public.lp_skill_assessment_sitting_size(p_attempt ->> 'skillId') is not null
      and coalesce((p_attempt ->> 'skillLevel')::integer, 1) in (1, 2)
      and coalesce((p_attempt ->> 'skillPhase')::integer, 1) in (1, 2)
      and coalesce(p_attempt ->> 'administrationStatus', 'completed') = 'completed'
      and coalesce(p_attempt ->> 'status', '') not in ('partial', 'in_progress', 'not_started', 'discontinued', 'abandoned')
      and phase_valid and scored_count >= expected_items and unique_count >= expected_items as is_complete
    from sized
  ) select jsonb_build_object('expectedItems', expected_items, 'scoredCount', scored_count,
      'correctCount', correct_count, 'uniqueCount', unique_count, 'phaseValid', phase_valid,
      'complete', is_complete, 'passed', is_complete and correct_count::numeric / nullif(scored_count, 0) >= 0.70)
    from complete;
$$;

revoke all on function public.lp_skill_assessment_sitting_size(text), public.lp_skill_assessment_sitting_summary(jsonb) from public, anon, authenticated;

create or replace function public.student_complete_focus_assessment(
  p_token text,
  p_session_id uuid,
  p_attempt jsonb
)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_payload jsonb;
  v_summary jsonb;
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
  v_summary := public.lp_skill_assessment_sitting_summary(p_attempt);
  v_question_total := (v_summary ->> 'scoredCount')::integer;
  v_question_correct := (v_summary ->> 'correctCount')::integer;
  if v_attempt_id is null
    or char_length(v_attempt_id) > 200
    or p_attempt ->> 'skillId' <> v_member.resolved_config ->> 'skill_id'
    or coalesce(p_attempt ->> 'assessmentType', '') <> 'skill_checkpoint'
    or v_total not between 1 and 100
    or v_correct not between 0 and v_total
    or jsonb_array_length(p_attempt -> 'questionRecords') > 100
    or coalesce((p_attempt ->> 'skillLevel')::integer, -1) <> (v_member.resolved_config ->> 'level')::integer
    or coalesce((p_attempt ->> 'skillPhase')::integer, -1) <> (v_member.resolved_config ->> 'phase')::integer
    or not coalesce((v_summary ->> 'complete')::boolean, false)
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
    'assignedByTeacher', true,
    'policySnapshot', (case when jsonb_typeof(p_attempt -> 'policySnapshot') = 'object' then p_attempt -> 'policySnapshot' else '{}'::jsonb end) || jsonb_build_object('roundLength', (v_summary ->> 'expectedItems')::integer)
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

  -- Match the reducer's 90-day, complete-sitting Level 1 progression.
  -- Failed media and supported responses are never scored literacy errors.
  select count(*), count(distinct attempt.skill_phase) filter (
      where attempt.skill_level = 1 and attempt.skill_phase in (1, 2)
        and coalesce((public.lp_skill_assessment_sitting_summary(
          attempt.payload || jsonb_build_object('skillId', attempt.skill_id,
            'skillLevel', attempt.skill_level, 'skillPhase', attempt.skill_phase,
            'totalQuestions', attempt.total_questions,
            'administrationStatus', attempt.administration_status)
        ) ->> 'passed')::boolean, false)
    ) = 2
  into v_attempts, v_level_one_passed
  from public.assessment_attempts attempt
  where attempt.teacher_id = v_session.teacher_id
    and attempt.student_id = v_student.id::text
    and attempt.skill_id = v_member.resolved_config ->> 'skill_id'
    and attempt.assessment_type = 'skill_checkpoint'
    and attempt.completed_at >= now() - interval '90 days';

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

create or replace function public.student_get_focus_session(
  p_token text,
  p_current_view text default null,
  p_content_ok boolean default true
)
returns json
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_student public.students;
  v_candidate record;
  v_attempts json := '[]'::json;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_current_view is not null and char_length(p_current_view) > 80 then
    return json_build_object('ok', false, 'error', 'invalid_view');
  end if;

  perform public.end_expired_student_focus_sessions();

  -- Resolve active precedence and ended fallback in one statement/snapshot.
  -- The newest ended row is ranked without filtering by action or expiry;
  -- those command bounds are inspected only after the winner is selected.
  select
    session.id as session_id,
    session.teacher_id,
    session.class_id,
    session.target,
    session.selection_scope,
    session.content_version,
    session.status as session_status,
    session.started_at,
    session.expires_at,
    session.end_action,
    member.resolved_config,
    member.status as member_status
  into v_candidate
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where member.student_id = v_student.id
    and (
      (
        member.active
        and session.status = 'active'
        and session.expires_at > now()
      )
      or session.status = 'ended'
    )
  order by
    case
      when member.active
        and session.status = 'active'
        and session.expires_at > now()
      then 0
      else 1
    end,
    case when session.status = 'active' then session.started_at end desc nulls last,
    case when session.status = 'ended' then session.ended_at end desc nulls last,
    session.started_at desc,
    session.id desc
  limit 1;

  if v_candidate.session_id is null then
    return json_build_object('ok', true, 'session', null);
  end if;

  if v_candidate.session_status = 'ended' then
    if v_candidate.end_action = 'student_picker'
      and v_candidate.expires_at > now()
    then
      return json_build_object(
        'ok', true,
        'session', null,
        'end_action', v_candidate.end_action,
        'ended_session_id', v_candidate.session_id
      );
    end if;

    return json_build_object('ok', true, 'session', null);
  end if;

  update public.student_focus_session_members
     set status = case when status = 'assigned' then 'active' else status end,
         current_view = nullif(btrim(coalesce(p_current_view, '')), ''),
         content_ok = coalesce(p_content_ok, true),
         last_seen_at = now(),
         updated_at = now()
   where session_id = v_candidate.session_id and student_id = v_student.id;

  if v_candidate.target = 'skills_assessment' then
    select coalesce(json_agg(json_build_object(
      'attemptId', recent.attempt_id,
      'studentId', v_student.id::text,
      'assessmentType', recent.assessment_type,
      'administrationStatus', recent.administration_status,
      'policySnapshot', jsonb_build_object('roundLength', public.lp_skill_assessment_sitting_size(recent.skill_id)) || (case when jsonb_typeof(recent.payload -> 'policySnapshot') = 'object' then recent.payload -> 'policySnapshot' else '{}'::jsonb end),
      'skillId', recent.skill_id,
      'skillName', recent.skill_name,
      'skillLevel', recent.skill_level,
      'skillPhase', recent.skill_phase,
      'completedAt', recent.completed_at,
      'totalQuestions', recent.total_questions,
      'questionRecords', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'questionId', question ->> 'questionId',
          'questionSignature', question ->> 'questionSignature',
          'promptAnswerSignature', question ->> 'promptAnswerSignature',
          'optionSetSignature', question ->> 'optionSetSignature',
          'targetWord', question ->> 'targetWord',
          'targetLetter', question ->> 'targetLetter',
          'targetSound', question ->> 'targetSound',
          'targetPattern', question ->> 'targetPattern',
          'itemKey', question ->> 'itemKey',
          'itemType', question ->> 'itemType',
          'templateType', question ->> 'templateType',
          'level', question -> 'level',
          'phase', question -> 'phase',
          'responseStatus', question ->> 'responseStatus',
          'isCorrect', question -> 'isCorrect',
          'supported', question -> 'supported',
          'prompted', question -> 'prompted',
          'timestamp', question ->> 'timestamp'
        )), '[]'::jsonb)
        from jsonb_array_elements(
          case when jsonb_typeof(recent.payload -> 'questionRecords') = 'array'
            then recent.payload -> 'questionRecords'
            else '[]'::jsonb
          end
        ) question
      )
    ) order by recent.completed_at), '[]'::json)
      into v_attempts
    from (
      select
        attempt.attempt_id,
        attempt.assessment_type,
        attempt.administration_status,
        attempt.skill_id,
        attempt.skill_name,
        attempt.skill_level,
        attempt.skill_phase,
        attempt.completed_at,
        attempt.total_questions,
        attempt.payload
      from public.assessment_attempts attempt
      where attempt.teacher_id = v_candidate.teacher_id
        and attempt.student_id = v_student.id::text
        and attempt.skill_id = v_candidate.resolved_config ->> 'skill_id'
        and attempt.administration_status = 'completed'
      order by attempt.completed_at desc
      limit 50
    ) recent;
  end if;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_candidate.session_id,
      'teacher_id', v_candidate.teacher_id,
      'class_id', v_candidate.class_id,
      'target', v_candidate.target,
      'audience', v_candidate.selection_scope,
      'selection_scope', v_candidate.selection_scope,
      'content_version', v_candidate.content_version,
      'status', v_candidate.session_status,
      'started_at', v_candidate.started_at,
      'expires_at', v_candidate.expires_at,
      'resolved_config', v_candidate.resolved_config,
      'member_status', v_candidate.member_status,
      'content_ok', coalesce(p_content_ok, true),
      'prior_attempts', v_attempts
    )
  );
end;
$$;
revoke all on function public.student_complete_focus_assessment(text, uuid, jsonb), public.student_get_focus_session(text, text, boolean) from public, anon, authenticated;
grant execute on function public.student_complete_focus_assessment(text, uuid, jsonb), public.student_get_focus_session(text, text, boolean) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
