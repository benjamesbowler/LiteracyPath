-- Accept the pictured, spoken Cycle Practice activity revision.
-- This changes only the evidence allowlist and authored audio necessity.
begin;

create or replace function public.student_complete_focus_cycle_practice(
  p_token text, p_session_id uuid, p_attempt jsonb
) returns json
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_student public.students;
  v_member public.student_focus_session_members;
  v_session public.student_focus_sessions;
  v_existing public.student_focus_cycle_practice_attempts;
  v_attempt_id text;
  v_total integer;
  v_correct integer := 0;
  v_scored integer := 0;
  v_supported integer := 0;
  v_media_failed integer := 0;
  v_practice integer;
  v_elapsed integer;
  v_check integer;
  v_session_cutoff timestamptz;
  v_late boolean;
  v_legacy boolean;
  v_required boolean;
  v_has_support boolean;
  v_status text;
  v_q jsonb;
  v_e jsonb;
  v_payload jsonb;
  v_question_ids text[] := '{}';
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok', false, 'error', 'invalid_session'); end if;
  if p_session_id is null or p_attempt is null or jsonb_typeof(p_attempt) is distinct from 'object'
    or octet_length(p_attempt::text) > 5000000
  then return json_build_object('ok', false, 'error', 'invalid_payload'); end if;
  v_attempt_id := p_attempt ->> 'attemptId';
  if v_attempt_id is null or v_attempt_id !~ '^[A-Za-z0-9._:-]{1,160}$'
  then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt'); end if;
  -- Serialize this learner's submissions across session IDs, including retries
  -- after the teacher ends the original session. Do not refresh timestamps.
  perform 1 from public.students where id = v_student.id for update;
  select * into v_existing from public.student_focus_cycle_practice_attempts
    where student_id = v_student.id and attempt_id = v_attempt_id;
  if v_existing.id is not null then
    if v_existing.session_id = p_session_id and v_existing.request_payload = p_attempt then
      return json_build_object('ok', true, 'duplicate', true, 'status', v_existing.payload->>'status');
    end if;
    return json_build_object('ok', false, 'error', 'attempt_conflict');
  end if;
  select * into v_session from public.student_focus_sessions
    where id = p_session_id and target = 'cycle_practice';
  select * into v_member from public.student_focus_session_members
    where session_id = p_session_id and student_id = v_student.id for update;
  if v_session.id is null or v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;
  v_session_cutoff := least(now(), v_session.expires_at, coalesce(v_session.ended_at, now()));
  v_late := v_session.status <> 'active' or v_session.expires_at <= now() or not v_member.active;
  if p_attempt->>'assessmentType' is distinct from 'cycle_practice_check'
    or p_attempt->>'cycleId' is distinct from v_member.resolved_config->>'cycle_id'
    or p_attempt->>'cycleNumber' is distinct from v_member.resolved_config->>'cycle_number'
    or coalesce(p_attempt->>'contentVersion', '') not in ('cycle-practice-v1', 'cycle-practice-v2')
    or jsonb_typeof(p_attempt->'questionRecords') is distinct from 'array'
  then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt'); end if;
  v_total := jsonb_array_length(p_attempt->'questionRecords');
  if exists (select 1 from jsonb_array_elements(p_attempt->'questionRecords') q where jsonb_typeof(q) <> 'object')
    or v_total not between 1 and 100 or p_attempt->'totalQuestions' is distinct from to_jsonb(v_total)
  then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt'); end if;
  v_legacy := p_attempt->>'contentVersion' = 'cycle-practice-v1';
  if v_legacy then
    -- Old clients lack provable support/media/timing fields. Retain their
    -- evidence as unverified; never accept their accuracy or fabricated time.
    v_practice := null;
    v_payload := p_attempt || jsonb_build_object('practiceSeconds', null,
      'sessionElapsedSeconds', null, 'checkSeconds', null, 'evidenceStatus', 'legacy_unverified',
      'questionRecords', (select jsonb_agg(q || jsonb_build_object('responseStatus', 'legacy_unverified', 'isCorrect', null))
        from jsonb_array_elements(p_attempt->'questionRecords') q));
  else
    if p_attempt->>'assessmentVersion' is distinct from 'cycle-practice-v2'
      or p_attempt->>'policyVersion' is distinct from 'cycle-practice-policy-v2'
      or jsonb_typeof(p_attempt->'practiceSeconds') is distinct from 'number'
      or jsonb_typeof(p_attempt->'sessionElapsedSeconds') is distinct from 'number'
      or jsonb_typeof(p_attempt->'checkSeconds') is distinct from 'number'
      or (p_attempt->>'practiceSeconds') !~ '^[0-9]+$'
      or (p_attempt->>'sessionElapsedSeconds') !~ '^[0-9]+$'
      or (p_attempt->>'checkSeconds') !~ '^[0-9]+$'
    then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt'); end if;
    if p_attempt ? 'practiceManifest' then
      if jsonb_typeof(p_attempt->'practiceManifest') is distinct from 'array' then
        return json_build_object('ok', false, 'error', 'invalid_cycle_practice_manifest');
      end if;
      for v_q in select value from jsonb_array_elements(p_attempt->'practiceManifest') loop
        if jsonb_typeof(v_q) is distinct from 'object'
          or jsonb_typeof(v_q->'construct') is distinct from 'string'
          or length(btrim(v_q->>'construct')) not between 1 and 200
          or jsonb_typeof(v_q->'responses') is distinct from 'number'
          or coalesce(v_q->>'responses', '') !~ '^[1-9][0-9]*$'
        then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_manifest'); end if;
      end loop;
      if (select count(*) <> count(distinct value->>'construct') from jsonb_array_elements(p_attempt->'practiceManifest')) then
        return json_build_object('ok', false, 'error', 'invalid_cycle_practice_manifest');
      end if;
    end if;
    v_practice := (p_attempt->>'practiceSeconds')::integer;
    v_elapsed := (p_attempt->>'sessionElapsedSeconds')::integer;
    v_check := (p_attempt->>'checkSeconds')::integer;
    if v_practice < 1800 or v_elapsed > floor(extract(epoch from (v_session_cutoff - v_session.started_at)))
      or v_elapsed < v_practice::bigint + v_check::bigint
    then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_duration'); end if;
    for v_q in select value from jsonb_array_elements(p_attempt->'questionRecords') loop
      v_e := v_q->'evidence';
      if jsonb_typeof(v_q) is distinct from 'object'
        or jsonb_typeof(v_e) is distinct from 'object'
        or jsonb_typeof(v_q->'questionId') is distinct from 'string'
        or coalesce(v_q->>'questionId', '') = '' or length(v_q->>'questionId') > 200
        or v_q->>'questionId' = any(v_question_ids)
        or jsonb_typeof(v_q->'construct') is distinct from 'string' or coalesce(v_q->>'construct', '') = ''
        or jsonb_typeof(v_q->'evidenceConstruct') is distinct from 'string' or coalesce(v_q->>'evidenceConstruct', '') = ''
        or not (v_q ? 'selected')
        or jsonb_typeof(v_q->'audioRequired') is distinct from 'boolean'
        or coalesce(v_q->>'mechanicId', '') not in ('soundGate','sceneHunt','soundBoxes','wordMachine','wordChain',
          'letterPair','letterTrace','patternSort','wordWindow','heartWord',
          'pictureSound','letterMatch','rhymeMatch','wordBuild','soundSort')
      then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_evidence'); end if;
      v_question_ids := array_append(v_question_ids, v_q->>'questionId');
      -- New activities always require the recorded instruction and target.
      -- Keep pre-overhaul tracing retries valid under their original contract.
      v_required := v_q->>'mechanicId' in ('soundGate','sceneHunt','soundBoxes','wordMachine','wordChain',
          'pictureSound','letterMatch','rhymeMatch','wordBuild','soundSort')
        or (v_q->>'mechanicId' = 'letterTrace'
          and coalesce(v_e->>'activityRevision', '') = 'cycle-play-2026-09');
      if v_q->'audioRequired' is distinct from to_jsonb(v_required)
        or coalesce(v_q->>'audioDelivery', '') not in ('delivered','unavailable','interrupted','not_required','pending')
        or (v_required and v_q->>'audioDelivery' = 'not_required')
        or (not v_required and v_q->>'audioDelivery' <> 'not_required')
        or (v_e ? 'independent' and jsonb_typeof(v_e->'independent') is distinct from 'boolean')
        or (v_e ? 'supportLevel' and (jsonb_typeof(v_e->'supportLevel') is distinct from 'number'
          or (v_e->>'supportLevel')::numeric < 0))
        or (v_e ? 'supportUsed' and jsonb_typeof(v_e->'supportUsed') is distinct from 'array')
      then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_evidence'); end if;
      v_has_support := coalesce(v_e->>'independent' = 'false', false)
        or coalesce((v_e->>'supportLevel')::numeric > 0, false)
        or lower(btrim(coalesce(v_e->>'measure', ''))) = 'support_only'
        or (case when v_e ? 'supportUsed' then jsonb_array_length(v_e->'supportUsed') > 0 else false end);
      v_status := case when v_required and v_q->>'audioDelivery' <> 'delivered' then 'media_failed'
        when v_has_support then 'supported'
        when v_q->'isCorrect' = 'true'::jsonb then 'correct'
        when v_q->'isCorrect' = 'false'::jsonb then 'incorrect' else null end;
      if v_status is null or v_q->>'responseStatus' is distinct from v_status
        or (v_status in ('supported','media_failed') and v_q->'isCorrect' is distinct from 'null'::jsonb)
      then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_evidence'); end if;
      v_scored := v_scored + case when v_status in ('correct','incorrect') then 1 else 0 end;
      v_correct := v_correct + case when v_status = 'correct' then 1 else 0 end;
      v_supported := v_supported + case when v_status = 'supported' then 1 else 0 end;
      v_media_failed := v_media_failed + case when v_status = 'media_failed' then 1 else 0 end;
    end loop;
    v_payload := p_attempt || jsonb_build_object('evidenceStatus', 'validated_client_report');
  end if;
  v_status := case when v_scored = v_total then 'completed' else 'incomplete' end;
  -- Counts are derived; caller aggregate fields are never the authority.
  v_payload := v_payload || jsonb_build_object('receivedAfterSessionEnd', v_late, 'totalQuestions', v_total, 'correctCount', v_correct,
    'scoredQuestions', v_scored, 'supportedCount', v_supported, 'mediaFailedCount', v_media_failed,
    'accuracy', case when v_scored > 0 then round(100.0 * v_correct / v_scored) else null end,
    'scorePercent', case when v_scored > 0 then round(100.0 * v_correct / v_scored) else null end,
    'passed', false, 'mastered', false, 'status', v_status);
  insert into public.student_focus_cycle_practice_attempts (
    session_id, student_id, teacher_id, class_id, cycle_id, cycle_number, attempt_id,
    started_at, completed_at, practice_seconds, total_questions, correct_count, payload,
    request_payload, scored_questions, supported_count, media_failed_count, session_elapsed_seconds, check_seconds, evidence_verified
  ) values (p_session_id, v_student.id, v_session.teacher_id, v_session.class_id,
    v_member.resolved_config->>'cycle_id', (v_member.resolved_config->>'cycle_number')::integer, v_attempt_id,
    v_session.started_at, now(), v_practice, v_total, v_correct, v_payload, p_attempt,
    v_scored, v_supported, v_media_failed, v_elapsed, v_check, not v_legacy);
  update public.student_focus_session_members set
    status = case when v_status = 'completed' then 'completed' else 'needs_attention' end,
    completed_at = case when v_status = 'completed' then coalesce(completed_at, now()) else null end, updated_at = now()
  where session_id = p_session_id and student_id = v_student.id and active and not v_late;
  return json_build_object('ok', true, 'duplicate', false, 'status', v_status);
exception when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range
  then return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt');
end;
$$;
revoke all on function public.student_complete_focus_cycle_practice(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.student_complete_focus_cycle_practice(text, uuid, jsonb) to anon, authenticated;

commit;
