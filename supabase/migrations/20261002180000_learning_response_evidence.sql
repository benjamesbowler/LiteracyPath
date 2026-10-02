begin;

-- Preserve rich, client-reported practice evidence without changing Cycle Check v2 scoring or admission.

-- Pure practice persistence helpers: choose whole snapshots, never merge answers.
create or replace function public.lp_learning_response_time(value text)
returns timestamptz language plpgsql immutable set search_path = '' as $$
begin
  return value::timestamptz;
exception when invalid_datetime_format or datetime_field_overflow then return null;
end;
$$;
create or replace function public.lp_learning_response_checkpoint(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  old_time timestamptz := coalesce(public.lp_learning_response_time(existing->>'updatedAt'),'epoch'::timestamptz);
  new_time timestamptz := coalesce(public.lp_learning_response_time(incoming->>'updatedAt'),'epoch'::timestamptz);
  old_episode jsonb := existing->'episode'; new_episode jsonb := incoming->'episode';
  same_episode boolean; known_episodes boolean := true;
  old_extends boolean := true; new_extends boolean := true;
  prior jsonb; candidate jsonb; attr text; direction integer; prior_phase integer; candidate_phase integer;
  extends_prefix boolean; selected jsonb;
begin
  if jsonb_typeof(existing) is distinct from 'object' then return incoming; end if;
  if jsonb_typeof(incoming) is distinct from 'object' then return existing; end if;
  same_episode := nullif(old_episode->>'id','') is not null and old_episode->>'id' = new_episode->>'id';
  if same_episode
    and jsonb_typeof(existing#>'{episode,firstResponse}') = 'object'
    and jsonb_typeof(incoming#>'{episode,firstResponse}') = 'object'
    and existing#>'{episode,firstResponse}' is distinct from incoming#>'{episode,firstResponse}' then
    return existing || jsonb_build_object('responseConflict',true);
  end if;
  -- Unknown schemas stay opaque. Current episodes can only advance one coherent
  -- append-only history; clocks never reopen an answered presentation.
  for prior in select value from jsonb_array_elements(jsonb_build_array(old_episode,new_episode)) loop
    if prior->'schemaVersion' is distinct from '1'::jsonb or prior->>'policyVersion' is distinct from 'learning-response-v1'
      or nullif(prior->>'id','') is null or prior->'firstQuestion' is null or prior->'firstQuestion' = 'null'::jsonb
      or prior->'question' is null or prior->'question' = 'null'::jsonb
      or coalesce(prior->>'phase','') not in ('answer','receipt','teaching','finish_teaching','complete')
      or coalesce(prior->>'role','') not in ('first_probe','transfer')
      or jsonb_typeof(prior->'responses') is distinct from 'array' or jsonb_typeof(prior->'events') is distinct from 'array'
      or jsonb_typeof(prior->'guidedActions') is distinct from 'array' then known_episodes := false; end if;
  end loop;
  if same_episode and known_episodes then
    if jsonb_typeof(old_episode->'firstResponse') = 'object' and jsonb_typeof(new_episode->'firstResponse') is distinct from 'object' then
      selected := existing;
    elsif jsonb_typeof(new_episode->'firstResponse') = 'object' and jsonb_typeof(old_episode->'firstResponse') is distinct from 'object' then
      selected := incoming;
    else
      for direction in 0..1 loop
        prior := case when direction = 0 then old_episode else new_episode end;
        candidate := case when direction = 0 then new_episode else old_episode end;
        extends_prefix := true;
        foreach attr in array array['id','instrument','slotId','firstQuestion','firstExpected'] loop
          if coalesce(prior->attr,'null'::jsonb) is distinct from coalesce(candidate->attr,'null'::jsonb) then extends_prefix := false; end if;
        end loop;
        foreach attr in array array['responses','events','guidedActions'] loop
          if jsonb_array_length(prior->attr) > jsonb_array_length(candidate->attr)
            or exists(select 1 from jsonb_array_elements(prior->attr) with ordinality as entries(value,position)
              where value is distinct from candidate->attr->((position-1)::integer)) then extends_prefix := false; end if;
        end loop;
        foreach attr in array array['firstResponse','transfer','completion'] loop
          if prior->attr is not null and prior->attr <> 'null'::jsonb and prior->attr is distinct from candidate->attr then extends_prefix := false; end if;
        end loop;
        if prior->'modelFirst' = 'true'::jsonb and candidate->'modelFirst' is distinct from 'true'::jsonb then extends_prefix := false; end if;
        if prior->>'role' = 'transfer' and candidate->>'role' <> 'transfer' then extends_prefix := false; end if;
        prior_phase := case when prior->>'phase' = 'complete' then 7 when prior->>'phase' = 'finish_teaching' then 6
          when prior->>'role' = 'transfer' then case when prior->>'phase' = 'answer' then 4 else 5 end
          when prior->>'phase' = 'answer' then 0 when prior->>'phase' = 'receipt' then 1 else 2 end;
        candidate_phase := case when candidate->>'phase' = 'complete' then 7 when candidate->>'phase' = 'finish_teaching' then 6
          when candidate->>'role' = 'transfer' then case when candidate->>'phase' = 'answer' then 4 else 5 end
          when candidate->>'phase' = 'answer' then 0 when candidate->>'phase' = 'receipt' then 1 else 2 end;
        if candidate_phase < prior_phase then extends_prefix := false; end if;
        if prior->>'role' = candidate->>'role' then
          if prior->'question' is distinct from candidate->'question' or coalesce(prior->'expected','null'::jsonb) is distinct from coalesce(candidate->'expected','null'::jsonb) then extends_prefix := false; end if;
          if prior->>'phase' = candidate->>'phase' and prior->>'phase' in ('teaching','finish_teaching')
            and public.lp_el_quest_number(candidate,'guidedCursor') < public.lp_el_quest_number(prior,'guidedCursor') then extends_prefix := false; end if;
        end if;
        if direction = 0 then new_extends := extends_prefix; else old_extends := extends_prefix; end if;
      end loop;
      if not old_extends and not new_extends then return existing || jsonb_build_object('responseConflict',true); end if;
      if new_extends and not old_extends then selected := incoming;
      elsif old_extends and not new_extends then selected := existing; end if;
    end if;
  end if;
  if selected is null then
    selected := case when new_time > old_time or (new_time = old_time and public.lp_el_quest_number(incoming,'revision') > public.lp_el_quest_number(existing,'revision')) then incoming else existing end;
  end if;
  if same_episode and (existing->'responseConflict' = 'true'::jsonb or incoming->'responseConflict' = 'true'::jsonb) then selected := selected || jsonb_build_object('responseConflict',true); end if;
  return selected;
end;
$$;
create or replace function public.lp_learning_response_history(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  events jsonb := '[]'; conflicts jsonb := '[]'; item jsonb; prior jsonb; identity text;
begin
  if jsonb_typeof(existing->'learningResponses') is distinct from 'array'
    and jsonb_typeof(incoming->'learningResponses') is distinct from 'array' then return '{}'; end if;
  for item in select value from jsonb_array_elements(
    (case when jsonb_typeof(existing->'learningResponseConflicts') = 'array' then existing->'learningResponseConflicts' else '[]'::jsonb end)
    || (case when jsonb_typeof(incoming->'learningResponseConflicts') = 'array' then incoming->'learningResponseConflicts' else '[]'::jsonb end)) loop
    if jsonb_typeof(item) = 'string' and not conflicts @> jsonb_build_array(item) then conflicts := conflicts || jsonb_build_array(item); end if;
  end loop;
  for item in select value from jsonb_array_elements(
    (case when jsonb_typeof(existing->'learningResponses') = 'array' then existing->'learningResponses' else '[]'::jsonb end)
    || (case when jsonb_typeof(incoming->'learningResponses') = 'array' then incoming->'learningResponses' else '[]'::jsonb end)) loop
    identity := item->>'id';
    if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item->'id') is distinct from 'string' or nullif(trim(identity),'') is null
      or jsonb_typeof(item->'contentVersion') is distinct from 'string' or nullif(trim(item->>'contentVersion'),'') is null
      or jsonb_typeof(item->'completedAt') is distinct from 'string' or public.lp_learning_response_time(item->>'completedAt') is null
      or jsonb_typeof(item->'steps') is distinct from 'array' then continue; end if;
    if jsonb_array_length(item->'steps') = 0 or exists(select 1 from jsonb_array_elements(item->'steps') step where jsonb_typeof(step) is distinct from 'object') then continue; end if;
    select value into prior from jsonb_array_elements(events) where value->>'id' = identity limit 1;
    if prior is null then events := events || jsonb_build_array(item);
    elsif prior is distinct from item and not conflicts @> jsonb_build_array(identity) then conflicts := conflicts || jsonb_build_array(identity); end if;
  end loop;
  return jsonb_build_object('learningResponses',events,'learningResponseConflicts',conflicts);
end;
$$;
revoke all on function public.lp_learning_response_time(text), public.lp_learning_response_checkpoint(jsonb,jsonb), public.lp_learning_response_history(jsonb,jsonb) from public;
grant execute on function public.lp_learning_response_time(text), public.lp_learning_response_checkpoint(jsonb,jsonb), public.lp_learning_response_history(jsonb,jsonb) to anon, authenticated;

create or replace function public.lp_merge_el_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  existing_epoch numeric := public.lp_el_quest_epoch(existing);
  incoming_epoch numeric := public.lp_el_quest_epoch(incoming);
  existing_schema numeric := public.lp_el_quest_schema(existing);
  incoming_schema numeric := public.lp_el_quest_schema(incoming);
  existing_is_future boolean := existing_epoch > 2 or existing_schema > 2;
  incoming_is_future boolean := incoming_epoch > 2 or incoming_schema > 2;
  local_payload jsonb := public.lp_normalize_el_quest(existing);
  incoming_payload jsonb := public.lp_normalize_el_quest(incoming);
begin
  -- An unknown future schema or epoch is opaque to this release. Keep the
  -- winning payload intact instead of applying this release's v2 merge rules.
  if existing_is_future or incoming_is_future then
    if not incoming_is_future then return existing; end if;
    if not existing_is_future then return incoming; end if;
    if existing_epoch <> incoming_epoch then
      if existing_epoch > incoming_epoch then return existing; end if;
      return incoming;
    end if;
    if existing_schema > incoming_schema then return existing; end if;
    return incoming;
  end if;

  if public.lp_is_current_el_quest(existing) and not public.lp_is_current_el_quest(incoming) then
    return local_payload;
  end if;
  if not public.lp_is_current_el_quest(existing) and public.lp_is_current_el_quest(incoming) then
    return incoming_payload;
  end if;

  return (local_payload || incoming_payload) || jsonb_build_object(
    'schemaVersion', 2,
    'progressEpoch', 2,
    'cycles', public.lp_merge_el_quest_cycles(local_payload -> 'cycles', incoming_payload -> 'cycles')
  ) || case when jsonb_typeof(local_payload->'learningCheckpoint') = 'object'
    or jsonb_typeof(incoming_payload->'learningCheckpoint') = 'object'
    then jsonb_build_object('learningCheckpoint', public.lp_learning_response_checkpoint(local_payload->'learningCheckpoint',incoming_payload->'learningCheckpoint')) else '{}'::jsonb end
  || public.lp_learning_response_history(local_payload,incoming_payload);
end;
$$;


create or replace function public.teacher_get_student_focus_session(p_session_id uuid default null)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_session public.student_focus_sessions;
  v_members json;
begin
  perform public.assert_current_actor_teacher_access();
  perform public.end_expired_student_focus_sessions();

  select * into v_session
  from public.student_focus_sessions session
  where session.teacher_id = auth.uid()
    and ((p_session_id is not null and session.id = p_session_id)
      or (p_session_id is null and session.status = 'active' and session.expires_at > now()))
  order by session.started_at desc
  limit 1;

  if v_session.id is null then
    return json_build_object('ok', true, 'session', null, 'members', '[]'::json);
  end if;

  select coalesce(json_agg(json_build_object(
    'student_id', member.student_id,
    'status', member.status,
    'current_view', member.current_view,
    'content_ok', member.content_ok,
    'last_seen_at', member.last_seen_at,
    'completed_at', member.completed_at,
    'connected', coalesce(member.last_seen_at > now() - interval '6 seconds', false),
    'resolved_config', member.resolved_config,
    'cycle_practice_result', cycle_result.summary
  ) order by student.name), '[]'::json)
  into v_members
  from public.student_focus_session_members member
  join public.students student on student.id = member.student_id
  left join lateral (
    select jsonb_build_object(
      'attemptId', result.attempt_id, 'cycleId', result.cycle_id,
      'receivedAt', result.created_at, 'clientCompletedAt', result.payload->'completedAt',
      'status', result.payload->>'status', 'receivedAfterSessionEnd', result.payload->'receivedAfterSessionEnd', 'totalQuestions', result.total_questions,
      'scoredQuestions', result.scored_questions, 'correctCount', result.correct_count,
      'supportedCount', result.supported_count, 'mediaFailedCount', result.media_failed_count,
      'accuracy', case when result.scored_questions > 0 then round(100.0 * result.correct_count / result.scored_questions) else null end,
      'practiceSeconds', result.practice_seconds, 'sessionElapsedSeconds', result.session_elapsed_seconds,
      'checkSeconds', result.check_seconds, 'evidenceStatus', result.payload->>'evidenceStatus',
      'practiceManifest', case when result.evidence_verified then coalesce(result.payload->'practiceManifest', '[]'::jsonb) else '[]'::jsonb end,
      'practiceManifestSource', 'client_reported',
      'learningResponsePolicyVersion', result.payload->'learningResponsePolicyVersion',
      'learningResponses', case when jsonb_typeof(result.payload->'learningResponses') = 'array'
        then result.payload->'learningResponses' else '[]'::jsonb end,
      'learningResponseSource', 'client_reported_practice_not_mastery',
      'checkedConstructs', (select coalesce(jsonb_agg(construct order by construct), '[]'::jsonb)
        from (select distinct question->>'construct' as construct
          from jsonb_array_elements(result.payload->'questionRecords') question
          where nullif(question->>'construct', '') is not null) checked),
      'questionRecords', (select coalesce(jsonb_agg(jsonb_build_object(
        'questionId', question->>'questionId', 'itemKey', question->>'itemKey',
        'construct', question->>'construct', 'evidenceConstruct', question->>'evidenceConstruct',
        'selected', question->'selected', 'responseStatus', question->>'responseStatus',
        'evidence', question->'evidence'
      ) order by position), '[]'::jsonb)
      from jsonb_array_elements(result.payload->'questionRecords') with ordinality as records(question, position)
      where question->>'responseStatus' in ('incorrect','supported','media_failed','legacy_unverified'))
    ) as summary
    from public.student_focus_cycle_practice_attempts result
    where result.session_id = v_session.id and result.student_id = member.student_id
      and result.teacher_id = auth.uid()
    order by result.completed_at desc, result.created_at desc, result.id desc limit 1
  ) cycle_result on v_session.target = 'cycle_practice'
  where member.session_id = v_session.id;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id,
      'teacher_id', v_session.teacher_id,
      'class_id', v_session.class_id,
      'target', v_session.target,
      'audience', v_session.selection_scope,
      'selection_scope', v_session.selection_scope,
      'content_version', v_session.content_version,
      'status', v_session.status,
      'started_at', v_session.started_at,
      'expires_at', v_session.expires_at,
      'updated_at', v_session.updated_at
    ),
    'members', v_members
  );
end;
$$;

revoke all on function public.teacher_get_student_focus_session(uuid) from public, anon, authenticated;
grant execute on function public.teacher_get_student_focus_session(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
