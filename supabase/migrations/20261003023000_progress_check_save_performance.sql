-- Index the authoritative bank once per call instead of rescanning 576
-- large JSON items for every pool entry and saved response.
create or replace function public.lp_validate_progress_run(p_run jsonb, p_previous jsonb default null)
returns void language plpgsql stable security definer set search_path = '' as $$
declare
  v_bank jsonb; v_bank_items jsonb; v_pool_items jsonb; v_item jsonb; v_expected jsonb; v_row jsonb; v_key text; v_track text;
  v_tiers jsonb := '{}'::jsonb; v_initial integer; v_before integer; v_after integer;
  v_ordinal integer := 0; v_scored integer := 0; v_correct boolean; v_status text;
  v_max integer; v_min integer; v_track_ids jsonb; v_role text; v_cue jsonb; v_audio jsonb; v_index integer;
begin
  if jsonb_typeof(p_run) is distinct from 'object' or octet_length(p_run::text)>4900000
    or p_run->>'schemaVersion' is distinct from '1'
    or char_length(coalesce(p_run->>'attemptId','')) not between 1 and 120
    or p_run->>'policyVersion' is distinct from 'progress-ordinal-v1'
    or coalesce(p_run->>'status','') not in ('warmup','running','completed','partial')
    or jsonb_typeof(p_run->'pool') is distinct from 'array'
    or jsonb_typeof(p_run->'responses') is distinct from 'array'
    or jsonb_typeof(p_run->'tracks') is distinct from 'object'
    or jsonb_typeof(p_run->'startingPoints') is distinct from 'object'
    or jsonb_typeof(p_run->'routeDecisions') is distinct from 'array'
    or jsonb_typeof(p_run->'warmupRecords') is distinct from 'array'
    or jsonb_typeof(p_run->'pauseEvents') is distinct from 'array'
  then raise exception 'Invalid progress run'; end if;
  select manifest into v_bank from public.progress_test_banks
    where version=p_run->>'contentVersion' and difficulty_version=p_run->>'difficultyVersion';
  if v_bank is null then raise exception 'Progress bank version unavailable'; end if;
  select jsonb_object_agg(x->>'id',x) into v_bank_items from jsonb_array_elements(v_bank->'items') x;
  select jsonb_object_agg(x->>'id',x) into v_pool_items from jsonb_array_elements(p_run->'pool') x;
  if p_run#>>'{plan,id}'='broad_profile' then
    v_min:=4; v_max:=8;
    v_track_ids:='["hear_sounds","printed_words","common_words","word_meaning","listening_stories","reading_stories"]'::jsonb;
    if p_run#>>'{plan,maximumValid}' is distinct from '36' or p_run#>>'{plan,maximumPresentations}' is distinct from '48'
      then raise exception 'Invalid progress plan'; end if;
  elsif p_run#>>'{plan,id}'='focused' then
    v_min:=10; v_max:=16; v_track_ids:=p_run#>'{plan,trackIds}';
    if jsonb_array_length(v_track_ids)<>1 or coalesce(v_track_ids->>0,'') not in
      ('hear_sounds','printed_words','common_words','word_meaning','listening_stories','reading_stories')
      or p_run#>>'{plan,maximumValid}' is distinct from '16' or p_run#>>'{plan,maximumPresentations}' is distinct from '24'
      then raise exception 'Invalid progress plan'; end if;
  else raise exception 'Invalid progress plan'; end if;
  if p_run#>'{plan,trackIds}' is distinct from v_track_ids
    or p_run#>>'{plan,minimumPerTrack}' is distinct from v_min::text
    or p_run#>>'{plan,maximumPerTrack}' is distinct from v_max::text
    or jsonb_array_length(p_run->'responses')>(p_run#>>'{plan,maximumPresentations}')::integer
    or (select count(*) from jsonb_object_keys(p_run->'tracks'))<>jsonb_array_length(v_track_ids)
    or p_run->'policySnapshot' is distinct from jsonb_build_object('version','progress-ordinal-v1','plan',p_run->'plan','firstResponseOnly',true,'recencyDays',90,'contradictionStops',false)
    or p_run#>>'{exposureSnapshot,familiarityUnknown}' is distinct from 'true'
    or jsonb_array_length(p_run->'pool')=0
  then raise exception 'Invalid progress plan'; end if;
  for v_item in select value from jsonb_array_elements(p_run->'pool') loop
    v_expected := v_bank_items->(v_item->>'id');
    if v_expected is null or v_item<>v_expected or not v_track_ids ? (v_item->>'trackId')
      then raise exception 'Progress pool differs from the authoritative bank'; end if;
  end loop;
  if (select count(distinct x->>'id') from jsonb_array_elements(p_run->'pool') x)<>jsonb_array_length(p_run->'pool')
    then raise exception 'Duplicate progress pool item'; end if;
  for v_track in select jsonb_array_elements_text(v_track_ids) loop
    v_initial:=(p_run#>>array['startingPoints',v_track,'tier'])::integer;
    if v_initial is null or v_initial not between 0 and 2 or p_run#>>array['tracks',v_track,'minimumTier'] is distinct from '0'
      or p_run#>>array['tracks',v_track,'maximumTier'] is distinct from '2'
      then raise exception 'Invalid progress starting point'; end if;
    if (select count(*) from generate_series(0,2) tier where (select count(distinct x->>'stimulusFamilyId') from jsonb_array_elements(p_run->'pool') x where x->>'trackId'=v_track and (x->>'difficultyTier')::integer=tier)<v_max)>0
      then raise exception 'Insufficient fresh progress stock'; end if;
    v_tiers:=v_tiers||jsonb_build_object(v_track,v_initial);
  end loop;
  for v_row in select value from jsonb_array_elements(p_run->'responses') loop
    v_expected := v_pool_items->(v_row->>'questionId');
    v_status:=v_row->>'responseStatus'; v_track:=v_expected->>'trackId';
    if v_expected is null or not public.lp_progress_item_valid(v_row->'itemSnapshot',v_expected)
      or v_row->>'trackId' is distinct from v_track
      or v_row->>'stimulusFamilyId' is distinct from v_expected->>'stimulusFamilyId'
      or v_row->>'difficultyTier' is distinct from v_expected->>'difficultyTier'
      or v_row->>'responseId' is distinct from (p_run->>'attemptId')||':'||v_ordinal
      or coalesce(v_status,'') not in ('correct','incorrect','supported','skipped','no_response','media_failed')
      or (v_row->>'selected' is not null and not exists(select 1 from jsonb_array_elements(v_expected->'choices') x where x->>'id'=v_row->>'selected'))
    then raise exception 'Invalid progress response snapshot'; end if;
    v_before:=(v_tiers->>v_track)::integer; v_after:=v_before;
    if (v_expected->>'difficultyTier')::integer<>v_before then raise exception 'Invalid adaptive route'; end if;
    if v_status in ('correct','incorrect') then
      v_correct:=v_row->>'selected'=v_expected->>'answer';
      if v_row->>'selected' is null or v_row->>'mediaReady' is distinct from 'true'
        or v_row->>'supported' is distinct from 'false' or v_row->>'isCorrect' is distinct from v_correct::text
        or v_status is distinct from (case when v_correct then 'correct' else 'incorrect' end)
        then raise exception 'Invalid progress scoring'; end if;
      for v_role,v_cue in select key,value from jsonb_each(coalesce(v_expected->'audio','{}'::jsonb)) loop
        if jsonb_typeof(v_cue)='array' then
          v_index:=0;
          for v_audio in select value from jsonb_array_elements(v_row#>array['itemSnapshot','audio',v_role]) loop
            if v_audio->>'required'='true' and v_row#>>array['audioDelivery',v_role||':'||v_index] is distinct from 'completed'
              then raise exception 'Required progress audio not delivered'; end if;
            v_index:=v_index+1;
          end loop;
        elsif v_cue->>'required'='true' and v_row#>>array['audioDelivery',v_role] is distinct from 'completed'
          then raise exception 'Required progress audio not delivered'; end if;
      end loop;
      v_after:=greatest(0,least(2,v_before+case when v_correct then 1 else -1 end)); v_scored:=v_scored+1;
    elsif v_row->'isCorrect' is distinct from 'null'::jsonb then raise exception 'Unscored progress response has a score'; end if;
    -- End-early unanswered rows retain their snapshot but have no routing event.
    if (v_status in ('correct','incorrect') and not (v_row ?& array['routeBefore','routeAfter'])) or (v_row ? 'routeBefore' and (v_row->>'routeBefore' is distinct from v_before::text or v_row->>'routeAfter' is distinct from v_after::text))
      then raise exception 'Invalid adaptive route'; end if;
    v_tiers:=v_tiers||jsonb_build_object(v_track,v_after); v_ordinal:=v_ordinal+1;
  end loop;
  if (select count(distinct x->>'questionId') from jsonb_array_elements(p_run->'responses') x)<>v_ordinal
    or (select count(distinct x->>'stimulusFamilyId') from jsonb_array_elements(p_run->'responses') x)<>v_ordinal
    or v_scored>(p_run#>>'{plan,maximumValid}')::integer then raise exception 'Duplicate or excess progress response'; end if;
  for v_track in select jsonb_array_elements_text(v_track_ids) loop
    if p_run#>>array['tracks',v_track,'nextTier'] is distinct from v_tiers->>v_track
      then raise exception 'Progress track state does not match its answers'; end if;
    if p_run->>'status'='completed' and (select count(*) from jsonb_array_elements(p_run->'responses') x
      where x->>'trackId'=v_track and x->>'responseStatus' in ('correct','incorrect'))<v_min
      then raise exception 'Completed progress plan lacks independent evidence'; end if;
  end loop;
  if p_run->'currentItem' is distinct from 'null'::jsonb then
    v_expected := v_pool_items->(p_run#>>'{currentItem,id}');
    if v_expected is null or not public.lp_progress_item_valid(p_run->'currentItem',v_expected)
      or exists(select 1 from jsonb_array_elements(p_run->'responses') x where x->>'questionId'=v_expected->>'id')
      or (v_expected->>'difficultyTier')::integer<>(v_tiers->>(v_expected->>'trackId'))::integer
      then raise exception 'Invalid pending progress item'; end if;
  end if;
  if p_previous is not null then
    if p_previous->>'status' in ('completed','partial') and p_previous<>p_run
      then raise exception 'Terminal progress evidence is immutable'; end if;
    foreach v_key in array array['attemptId','studentId','classId','teacherId','assignmentId','contentVersion',
      'difficultyVersion','policyVersion','policySnapshot','startingPoints','exposureSnapshot','plan','seed','pool','startedAt'] loop
      if p_previous->v_key is distinct from p_run->v_key then raise exception 'Frozen progress metadata changed'; end if;
    end loop;
    foreach v_key in array array['responses','routeDecisions','warmupRecords','pauseEvents'] loop
      if jsonb_array_length(p_run->v_key)<jsonb_array_length(p_previous->v_key)
        or exists(select 1 from jsonb_array_elements(p_previous->v_key) with ordinality old(value,n)
          where old.value is distinct from (p_run->v_key)->(old.n::integer-1))
        then raise exception 'Committed progress history changed'; end if;
    end loop;
  end if;
end;
$$;

-- Reaffirm the existing private-helper boundary. The hosted helpers already
-- deny these roles; CREATE OR REPLACE preserves owner/service-role privileges.
revoke all on function public.lp_validate_progress_run(jsonb,jsonb),
  public.lp_progress_save(uuid,uuid,uuid,uuid,jsonb,jsonb),
  public.lp_validate_progress_exposure(uuid,jsonb)
  from public, anon, authenticated;

create or replace function public.lp_progress_save(p_student_id uuid,p_teacher_id uuid,p_class_id uuid,p_assignment_id uuid,p_run jsonb,p_attempt jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_config jsonb; v_payload jsonb; v_existing jsonb; v_terminal boolean; v_total integer; v_correct integer; v_pool jsonb; v_bank_items jsonb;
begin
  -- Send only frozen pool IDs across the wire; restore exact published items.
  if jsonb_typeof(p_run->'pool')='array' and jsonb_typeof(p_run#>'{pool,0}')='string' then
    select jsonb_object_agg(item->>'id',item) into v_bank_items
      from public.progress_test_banks bank cross join lateral jsonb_array_elements(bank.manifest->'items') item
      where bank.version=p_run->>'contentVersion';
    select jsonb_agg(v_bank_items->(requested.id#>>'{}') order by requested.n) into v_pool
      from jsonb_array_elements(p_run->'pool') with ordinality requested(id,n)
      where v_bank_items ? (requested.id#>>'{}');
    if jsonb_array_length(v_pool) is distinct from jsonb_array_length(p_run->'pool')
      then return jsonb_build_object('ok',false,'error','invalid_progress_pool'); end if;
    p_run:=p_run||jsonb_build_object('pool',v_pool);
  end if;
  if p_run->>'studentId' is distinct from p_student_id::text or p_run->>'teacherId' is distinct from p_teacher_id::text
    or p_run->>'classId' is distinct from p_class_id::text or coalesce(p_run->>'assignmentId','') is distinct from coalesce(p_assignment_id::text,'')
    then return jsonb_build_object('ok',false,'error','ownership_mismatch'); end if;
  perform 1 from public.students where id=p_student_id and teacher_id=p_teacher_id and class_id=p_class_id and archived_at is null for update;
  if not found then return jsonb_build_object('ok',false,'error','student_not_owned'); end if;
  if p_assignment_id is not null then
    select m.resolved_config into v_config from public.student_focus_sessions s join public.student_focus_session_members m on m.session_id=s.id
      where s.id=p_assignment_id and s.teacher_id=p_teacher_id and s.class_id=p_class_id and s.target='progress_check' and m.student_id=p_student_id;
    if v_config is null or not public.lp_progress_config_valid(v_config,p_run->>'contentVersion')
      or v_config->>'plan_kind' is distinct from p_run#>>'{plan,id}'
      or (v_config->>'plan_kind'='focused' and v_config->>'track_id' is distinct from p_run#>>'{plan,trackIds,0}')
      then return jsonb_build_object('ok',false,'error','assignment_mismatch'); end if;
  end if;
  v_terminal:=p_run->>'status' in ('completed','partial');
  if v_terminal is distinct from (p_attempt is not null) then return jsonb_build_object('ok',false,'error','terminal_attempt_required'); end if;
  perform public.lp_validate_progress_run(p_run);
  if v_terminal then
    select count(*),count(*) filter(where x->>'responseStatus'='correct') into v_total,v_correct
      from jsonb_array_elements(p_run->'responses') x where x->>'responseStatus' in ('correct','incorrect');
    if not public.lp_progress_attempt_valid(p_attempt,p_run) or octet_length(p_attempt::text)>4900000 or p_attempt->>'attemptId' is distinct from p_run->>'attemptId'
      or p_attempt->>'assessmentType' is distinct from 'adaptive_progress_test' or p_attempt#>>'{metadata,instrumentId}' is distinct from 'literacypath_progress'
      or p_attempt->>'contentVersion' is distinct from p_run->>'contentVersion' or p_attempt->>'policyVersion' is distinct from p_run->>'policyVersion'
      or p_attempt->>'administrationStatus' is distinct from p_run->>'status' or p_attempt->'questionRecords' is distinct from p_run->'responses'
      or p_attempt->>'passed' is distinct from 'false' or p_attempt->'accuracy' is distinct from 'null'::jsonb
      or p_attempt->>'skillLevel' is distinct from '0' or p_attempt->>'skillPhase' is distinct from '0'
      or p_attempt->>'totalQuestions' is distinct from v_total::text or p_attempt->>'correctCount' is distinct from v_correct::text
      or p_attempt->>'startedAt' is distinct from p_run->>'startedAt' or p_attempt->>'completedAt' is distinct from p_run->>'completedAt'
      then return jsonb_build_object('ok',false,'error','invalid_progress_attempt'); end if;
    v_payload:=p_attempt||jsonb_build_object('studentId',p_student_id::text,'teacherId',p_teacher_id::text,'classId',p_class_id::text,
      'studentName',(select name from public.students where id=p_student_id));
    select payload into v_existing from public.assessment_attempts where attempt_id=p_run->>'attemptId';
    if v_existing is not null and v_existing<>v_payload then return jsonb_build_object('ok',false,'error','attempt_conflict'); end if;
  end if;
  insert into public.student_progress(student_id,area,key,payload,updated_at)
    values(p_student_id,'progress_check','run:'||(p_run->>'attemptId'),p_run,now())
    on conflict(student_id,area,key) do update set payload=excluded.payload,updated_at=now();
  if v_terminal then
    insert into public.assessment_attempts(attempt_id,student_id,class_id,teacher_id,assessment_type,skill_id,skill_name,skill_level,skill_phase,
      started_at,completed_at,total_questions,correct_count,accuracy,status,administration_status,schema_version,evidence_schema_version,
      assessment_version,content_version,policy_version,payload,raw_evidence)
    values(p_run->>'attemptId',p_student_id::text,p_class_id::text,p_teacher_id,'adaptive_progress_test','progress_check','Progress check',0,0,
      (p_run->>'startedAt')::timestamptz,(p_run->>'completedAt')::timestamptz,v_total,v_correct,null,p_run->>'status',p_run->>'status',4,1,
      p_attempt->>'assessmentVersion',p_run->>'contentVersion',p_run->>'policyVersion',v_payload,'{}'::jsonb)
    on conflict(attempt_id) do nothing;
    if p_assignment_id is not null then update public.student_focus_session_members set status='completed',completed_at=now(),updated_at=now()
      where session_id=p_assignment_id and student_id=p_student_id; end if;
  end if;
  return jsonb_build_object('ok',true,'attemptId',p_run->>'attemptId','terminal',v_terminal);
exception when invalid_text_representation or numeric_value_out_of_range or check_violation then
  return jsonb_build_object('ok',false,'error','invalid_progress_run');
end;
$$;

-- Preserve every exposure exclusion while building a lookup once, rather than
-- looping through the whole pool for each question in the learner's history.
create or replace function public.lp_validate_progress_exposure(p_student_id uuid,p_run jsonb) returns void
language plpgsql stable security definer set search_path = '' as $$
declare v_history jsonb; v_exposed jsonb; v_paths jsonb; v_item jsonb;
begin
  v_history := public.lp_progress_history(p_student_id);
  with questions as (
    select q.value as question from jsonb_array_elements(v_history) h
      cross join lateral jsonb_array_elements(h.value->'questionRecords') q
      where h.value->>'attemptId' is distinct from p_run->>'attemptId'
  ), keys as (
    select distinct k.value from questions q cross join lateral jsonb_array_elements_text(
      jsonb_build_array(q.question->>'questionId',q.question->>'stimulusFamilyId',q.question->>'sourceStimulusFamilyId')) k
      where k.value is not null
  ) select coalesce(jsonb_object_agg(value,true),'{}'::jsonb) into v_exposed from keys;
  with questions as (
    select q.value as question from jsonb_array_elements(v_history) h
      cross join lateral jsonb_array_elements(h.value->'questionRecords') q
      where h.value->>'attemptId' is distinct from p_run->>'attemptId'
  ), paths as (
    select distinct p.value from questions q cross join lateral jsonb_array_elements_text(coalesce(q.question->'sourcePaths','[]'::jsonb)) p
      where p.value is not null
  ) select coalesce(jsonb_object_agg(value,true),'{}'::jsonb) into v_paths from paths;
  for v_item in select value from jsonb_array_elements(p_run->'pool') loop
    if v_exposed ? (v_item->>'id') or v_exposed ? (v_item->>'stimulusFamilyId')
      or exists(select 1 from jsonb_array_elements_text(coalesce(v_item->'enemyItemGroups','[]'::jsonb)) enemy where v_exposed ? enemy)
      then raise exception 'Previously exposed progress family is in the frozen pool'; end if;
    if exists(select 1 from jsonb_array_elements(v_item#>'{media,requiredSources}') source
      where source->>'role'='passage' and v_paths ? (source->>'path'))
      then raise exception 'Previously exposed passage is in the frozen pool'; end if;
  end loop;
end;
$$;
