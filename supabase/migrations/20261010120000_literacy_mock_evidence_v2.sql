begin;
-- Published versions are append-only. Existing session snapshots and v1 rows
-- retain their original wording, answers, and access conditions.
alter table public.literacy_mock_items drop constraint literacy_mock_items_pkey;
alter table public.literacy_mock_items drop constraint literacy_mock_items_content_version_check;
alter table public.literacy_mock_items add primary key(content_version,id);
alter table public.literacy_mock_items add check(content_version in ('literacy-mock-v1','literacy-mock-v2'));
create table public.literacy_mock_publications(
  content_version text primary key check(content_version in ('literacy-mock-v1','literacy-mock-v2')),
  item_count integer not null check(item_count>0), available_for_new_sessions boolean not null default true, published_at timestamptz not null default now());
alter table public.literacy_mock_publications enable row level security;
revoke all on public.literacy_mock_publications from public,anon,authenticated;

create function public.lp_literacy_exposure_identity(p_value jsonb)
returns jsonb language sql immutable set search_path='' as $$
  with source as (select coalesce(p_value->'itemSnapshot',p_value->'questionSnapshot',p_value) s)
  select jsonb_build_object(
    'exposureItemId',coalesce(nullif(p_value->>'exposureItemId',''),nullif(s->>'canonicalItemId',''),nullif(s->>'sourceItemId',''),nullif(p_value->>'questionId',''),s->>'id',''),
    'exposurePassageKey',lower(regexp_replace(replace(replace(btrim(coalesce(nullif(p_value->>'exposurePassageKey',''),nullif(s->>'canonicalPassageId',''),nullif(s->>'passage',''),s->>'stimulusKey','')), '’', chr(39)), '‘', chr(39)), '\s+', ' ', 'g')),
    'exposureFamilyId',coalesce(nullif(p_value->>'exposureFamilyId',''),nullif(s->>'exposureFamilyId',''),s->>'itemFamilyId','')) from source;
$$;

-- Return identity only, not answers or other learners' data. The private helper
-- is reachable only after the token/teacher-owned assignment checks below.
create function public.lp_literacy_exposures(p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  with prior as (
    select response value from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses||r.media_failures) response where r.student_id=p_student_id
    union all
    select step from public.student_progress p
      cross join lateral jsonb_path_query(p.payload,'$.**.completions[*]') event
      cross join lateral jsonb_array_elements(case when jsonb_typeof(event->'steps')='array' then event->'steps' else '[]'::jsonb end) step
      where p.student_id=p_student_id and event->>'gameId'='literacy-practice'
  ), identities as (select public.lp_literacy_exposure_identity(value) identity from prior)
  select coalesce(jsonb_agg(distinct identity),'[]'::jsonb) from identities;
$$;
create function public.lp_literacy_familiarity(p_student_id uuid,p_item jsonb)
returns jsonb language sql stable security definer set search_path='' as $$
  with target as (select public.lp_literacy_exposure_identity(p_item) identity), matches as (
    select key from target cross join lateral jsonb_each_text(identity) t(key,value)
    where t.value<>'' and exists(select 1 from jsonb_array_elements(public.lp_literacy_exposures(p_student_id)) prior where prior->>t.key=t.value))
  select coalesce(jsonb_agg(case key when 'exposureItemId' then 'item' when 'exposurePassageKey' then 'passage' else 'family' end order by key),'[]'::jsonb) from matches;
$$;
create function public.lp_literacy_response_eligible(p_response jsonb)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(p_response->>'evidenceType'='independent'
    and p_response->>'responseStatus'='answered' and jsonb_typeof(p_response->'isCorrect')='boolean'
    and coalesce(p_response->>'supportUsed','false')='false'
    and coalesce(p_response->>'knownFamiliar','false')<>'true'
    and coalesce(p_response->>'priorPracticeExposure','false')<>'true'
    and coalesce(p_response->>'knownPracticeFamiliarity','false')<>'true'
    and coalesce(p_response->>'validity','valid')<>'invalid'
    and coalesce(p_response->>'presentationRole','first_probe')='first_probe',false);
$$;
create or replace function public.lp_progress_config_valid(p_config jsonb,p_version text)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
  if p_version in ('literacy-mock-v1','literacy-mock-v2')
    and p_config=jsonb_build_object('plan_kind','mock','track_id','all','bank_version',p_version) then return true; end if;
  return public.lp_progress_config_valid_before_mock(p_config,p_version);
end; $$;

create or replace function public.lp_literacy_mock_state(p_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_focus public.student_focus_sessions; v_mock public.literacy_mock_sessions; v_now timestamptz:=clock_timestamp();
begin
  select * into v_focus from public.student_focus_sessions where id=p_session_id for update;
  select * into v_mock from public.literacy_mock_sessions where session_id=p_session_id for update;
  if v_mock.session_id is null then return null; end if;
  v_now:=clock_timestamp();
  if v_mock.state<>'completed' and (v_focus.status<>'active' or v_focus.expires_at<=v_now
    or (v_mock.state='running' and v_mock.deadline_at<=v_now)) then
    update public.literacy_mock_sessions set state='completed',revision=revision+1,remaining_seconds=0,deadline_at=null,
      ended_at=v_now,end_reason=case when v_focus.status<>'active' then 'teacher_closed'
        when v_focus.expires_at<=v_now then 'session_expired' else 'time_finished' end,updated_at=v_now
      where session_id=p_session_id returning * into v_mock;
    update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id and status<>'completed';
    update public.student_focus_session_members set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id;
  end if;
  return (to_jsonb(v_mock)-'session_id')||jsonb_build_object('server_now',v_now,'content_version',v_focus.content_version,
    'remaining_seconds',case when v_mock.state='running' then greatest(0,ceil(extract(epoch from(v_mock.deadline_at-v_now)))::integer)
      else least(v_mock.remaining_seconds,greatest(0,ceil(extract(epoch from(v_focus.expires_at-v_now)))::integer)) end);
end; $$;

create or replace function public.teacher_prepare_literacy_mock_session(p_class_id uuid,p_student_ids uuid[] default '{}',
  p_whole_class boolean default false,p_duration_minutes integer default 20,p_item_count integer default 43,p_request_id text default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_id uuid; v_saved public.literacy_mock_preparations; v_hash text; v_version text:='literacy-mock-v1';
begin
  perform public.assert_current_actor_teacher_access();
  if p_duration_minutes is null or p_duration_minutes not in (10,20,30,40)
    or p_item_count is null or p_item_count not in (24,43) then
    return json_build_object('ok',false,'error','invalid_mock_options'); end if;
  if p_request_id is not null and char_length(p_request_id) not between 1 and 160 then
    return json_build_object('ok',false,'error','invalid_request_id'); end if;
  if p_request_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
    -- The fingerprint contains no recoverable pupil identifiers after deletion.
    v_hash:=encode(sha256(convert_to(jsonb_build_object('classId',p_class_id,'studentIds',p_student_ids,
      'wholeClass',p_whole_class,'minutes',p_duration_minutes,'count',p_item_count)::text,'UTF8')),'hex');
    select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
    if found then
      if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
      return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
    end if;
  end if;
  if exists(select 1 from public.literacy_mock_publications p where p.content_version='literacy-mock-v2' and p.available_for_new_sessions
      and p.item_count=(select count(*) from public.literacy_mock_items i where i.content_version=p.content_version)
      and (select count(distinct item->>'domainId') from public.literacy_mock_items i where i.content_version=p.content_version)=8) then
    v_version:='literacy-mock-v2'; end if;
  if (select count(distinct item->>'domainId') from public.literacy_mock_items where content_version=v_version)<>8 then
    return json_build_object('ok',false,'error','mock_content_unavailable'); end if;
  v_result:=public.teacher_start_progress_check_session(p_class_id,p_student_ids,
    jsonb_build_object('*',jsonb_build_object('plan_kind','mock','track_id','all','bank_version',v_version)),120,v_version,p_whole_class)::jsonb;
  if v_result->>'ok'<>'true' then return v_result::json; end if;
  v_id:=(v_result#>>'{session,id}')::uuid;
  insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds)
    values(v_id,p_item_count,p_duration_minutes*60,p_duration_minutes*60);
  if p_request_id is not null then insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id)
    values(auth.uid(),p_request_id,v_hash,v_id); end if;
  return public.teacher_get_student_focus_session(v_id);
end; $$;

create or replace function public.lp_literacy_mock_run_json(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('schemaVersion',1,'contentVersion',f.content_version,'assignmentId',r.session_id,
    'studentId',r.student_id,'revision',r.revision,'plan',r.plan,'planHistory',r.plan_history,'responses',r.responses,'status',r.status,
    'mediaFailures',r.media_failures,'completedAt',r.completed_at,'updatedAt',r.updated_at,
    'unsampledItemIds',coalesce((select jsonb_agg(item_id order by position)
      from jsonb_array_elements(r.plan->'itemIds') with ordinality p(item_id,position)
      where position>jsonb_array_length(r.responses)),'[]'::jsonb))
    from public.literacy_mock_runs r join public.student_focus_sessions f on f.id=r.session_id where r.session_id=p_session_id and r.student_id=p_student_id;
$$;

create or replace function public.lp_literacy_mock_assignment(p_student_id uuid,p_session_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.student_focus_sessions f
    join public.student_focus_session_members m on m.session_id=f.id
    join public.students s on s.id=m.student_id
    join public.literacy_mock_sessions w on w.session_id=f.id
    where f.id=p_session_id and m.student_id=p_student_id and s.archived_at is null
      and s.teacher_id=f.teacher_id and s.class_id=f.class_id and f.target='progress_check'
      and f.content_version in ('literacy-mock-v1','literacy-mock-v2')
      and m.resolved_config=jsonb_build_object('plan_kind','mock','track_id','all','bank_version',f.content_version));
$$;

create or replace function public.student_get_literacy_mock_run(p_token text,p_session_id uuid)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_student public.students; v_mock jsonb;
begin
  v_student:=public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok',false,'error','invalid_session'); end if;
  perform 1 from public.students where id=v_student.id for share;
  if not public.lp_literacy_mock_assignment(v_student.id,p_session_id) then
    return json_build_object('ok',false,'error','assignment_not_found'); end if;
  v_mock:=public.lp_literacy_mock_state(p_session_id);
  return json_build_object('ok',true,'mock',v_mock,'exposures',public.lp_literacy_exposures(v_student.id),'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
end; $$;

create or replace function public.student_save_literacy_mock_run(p_token text,p_session_id uuid,p_request_id text,
  p_expected_revision integer,p_plan jsonb default null,p_response jsonb default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare
  v_student public.students; v_mock jsonb; v_run public.literacy_mock_runs; v_request public.literacy_mock_run_requests;
  v_payload jsonb; v_plan jsonb; v_item jsonb; v_old_item jsonb; v_answer jsonb; v_previous jsonb; v_failure jsonb; v_failed_paths jsonb;
  v_version text; v_familiarity jsonb; v_id text; v_index integer; v_count integer; v_expected_level integer; v_valid boolean; v_now timestamptz;
begin
  v_student:=public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok',false,'error','invalid_session'); end if;
  perform 1 from public.students where id=v_student.id for share;
  if not public.lp_literacy_mock_assignment(v_student.id,p_session_id) then
    return json_build_object('ok',false,'error','assignment_not_found'); end if;
  if coalesce(char_length(p_request_id),0) not between 1 and 160 or p_expected_revision is null or p_expected_revision<0
    or (p_plan is null and p_response is null) or octet_length(coalesce(p_plan,'{}')::text)>20000
    or octet_length(coalesce(p_response,'{}')::text)>32000 then
    return json_build_object('ok',false,'error','invalid_payload'); end if;
  v_mock:=public.lp_literacy_mock_state(p_session_id);
  select content_version into v_version from public.student_focus_sessions where id=p_session_id;
  v_payload:=jsonb_build_object('expectedRevision',p_expected_revision,'plan',p_plan,'response',p_response);
  select * into v_request from public.literacy_mock_run_requests where session_id=p_session_id and student_id=v_student.id and request_id=p_request_id;
  if found then
    if v_request.request_payload<>v_payload then return json_build_object('ok',false,'error','request_conflict'); end if;
    return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
  end if;
  if v_mock->>'state'='completed' or not exists(select 1 from public.student_focus_sessions f
    join public.student_focus_session_members m on m.session_id=f.id where f.id=p_session_id
      and f.status='active' and f.expires_at>clock_timestamp() and m.student_id=v_student.id and m.active) then
    return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
  select * into v_run from public.literacy_mock_runs where session_id=p_session_id and student_id=v_student.id for update;
  if coalesce(v_run.revision,0)<>p_expected_revision then
    return json_build_object('ok',false,'error','stale_revision','mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id)); end if;
  if v_run.status='completed' then return json_build_object('ok',false,'error','run_completed'); end if;
  if p_response is not null and v_mock->>'state'<>'running' then
    return json_build_object('ok',false,'error','assessment_not_running','mock',v_mock); end if;
  v_count:=coalesce(jsonb_array_length(v_run.responses),0);
  if v_run.revision>=256 or (p_plan is not null and p_plan is distinct from v_run.plan and coalesce(jsonb_array_length(v_run.plan_history),0)>=128)
    or (p_response->>'responseStatus'='media_failed' and coalesce(jsonb_array_length(v_run.media_failures),0)>=128) then
    return json_build_object('ok',false,'error','run_mutation_limit'); end if;
  v_plan:=coalesce(v_run.plan,p_plan);
  if p_plan is not null then
    if jsonb_typeof(p_plan) is distinct from 'object' or jsonb_typeof(p_plan->'itemIds') is distinct from 'array'
      or jsonb_typeof(p_plan->'seed') is distinct from 'string' or char_length(p_plan->>'seed') not between 1 and 160
      or exists(select 1 from jsonb_object_keys(p_plan) k where k not in ('itemIds','seed'))
      or jsonb_array_length(p_plan->'itemIds')<>(v_mock->>'item_count')::integer
      or (select count(distinct value) from jsonb_array_elements(p_plan->'itemIds'))<>jsonb_array_length(p_plan->'itemIds') then
      return json_build_object('ok',false,'error','invalid_plan'); end if;
    if v_run.session_id is not null and (p_plan->'seed'<>v_run.plan->'seed'
      or (v_mock->>'state'<>'running' and p_plan<>v_run.plan)) then
      return json_build_object('ok',false,'error','plan_conflict'); end if;
    for v_id,v_index in select value,ordinality::integer from jsonb_array_elements_text(p_plan->'itemIds') with ordinality loop
      select item into v_item from public.literacy_mock_items where id=v_id and content_version=v_version;
      if v_item is null then return json_build_object('ok',false,'error','unknown_item'); end if;
      if v_index>v_count and public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures) then
        return json_build_object('ok',false,'error','blocked_media_item'); end if;
      if v_item#>>'{itemSnapshot,tutorialOnly}'='true' or exists (
        select 1 from public.literacy_mock_items tutorial where tutorial.content_version=v_version
          and tutorial.item#>>'{itemSnapshot,tutorialOnly}'='true'
          and nullif(v_item#>>'{itemSnapshot,stimulusKey}','')=tutorial.item#>>'{itemSnapshot,stimulusKey}') then
        return json_build_object('ok',false,'error','tutorial_item_not_scored'); end if;
      if v_run.session_id is not null then
        select item into v_old_item from public.literacy_mock_items where id=v_run.plan->'itemIds'->>(v_index-1) and content_version=v_version;
        if (v_index<=v_count and to_jsonb(v_id)<>v_run.plan->'itemIds'->(v_index-1))
          or v_item->>'skillId' is distinct from v_old_item->>'skillId' or v_item->>'domainId' is distinct from v_old_item->>'domainId' then
          return json_build_object('ok',false,'error','plan_conflict'); end if;
        if v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1) then
          select response into v_previous from jsonb_array_elements(v_run.responses) with ordinality r(response,position)
            where response->>'skillId'=v_item->>'skillId' and public.lp_literacy_response_eligible(response) order by position desc limit 1;
          v_expected_level:=case when public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures) or v_previous is null
            then (v_old_item->>'level')::integer when (v_previous->>'isCorrect')::boolean then 2 else 1 end;
          if (v_item->>'level')::integer<>v_expected_level then return json_build_object('ok',false,'error','invalid_adaptation'); end if;
        end if;
      end if;
    end loop;
    -- A mixed mock must actually cover every advertised area. No claims are
    -- inferred from an area that a timer prevented the child from reaching.
    if (select count(distinct i.item->>'domainId') from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version)<>8 then return json_build_object('ok',false,'error','incomplete_domain_plan'); end if;
    v_plan:=p_plan;
  end if;
  if v_plan is null then return json_build_object('ok',false,'error','plan_required'); end if;
  if p_response is null and v_run.session_id is not null and v_plan=v_run.plan then
    return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id)); end if;
  if p_response is not null then
    if jsonb_typeof(p_response) is distinct from 'object'
      or exists(select 1 from jsonb_object_keys(p_response) k where k not in ('questionId','selected','responseStatus','audioDelivery','supportUsed','responseTimeMs','knownFamiliar','failedMediaPaths'))
      or p_response->>'questionId' is distinct from v_plan->'itemIds'->>v_count
      or p_response->>'responseStatus' is null or p_response->>'responseStatus' not in ('answered','skipped','media_failed')
      or jsonb_typeof(p_response->'audioDelivery') is distinct from 'object'
      or jsonb_typeof(p_response->'supportUsed') is distinct from 'boolean'
      or (p_response ? 'knownFamiliar' and jsonb_typeof(p_response->'knownFamiliar') not in ('null','boolean'))
      or (p_response ? 'responseTimeMs' and (jsonb_typeof(p_response->'responseTimeMs')<>'number'
        or (p_response->>'responseTimeMs')::numeric not between 0 and 7200000)) then
      return json_build_object('ok',false,'error','invalid_response'); end if;
    select item into v_item from public.literacy_mock_items where id=p_response->>'questionId' and content_version=v_version;
    if p_response->>'responseStatus'<>'media_failed' and (p_response ? 'failedMediaPaths'
      or public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures)) then
      return json_build_object('ok',false,'error','blocked_media_item'); end if;
    if p_response->>'responseStatus'='media_failed' then
      if v_run.session_id is null or (p_plan is not null and p_plan<>v_run.plan)
        or jsonb_typeof(p_response->'selected') is distinct from 'null'
        or jsonb_typeof(p_response->'failedMediaPaths') is distinct from 'array'
        or jsonb_array_length(p_response->'failedMediaPaths') not between 1 and 100
        or exists(select 1 from jsonb_array_elements(p_response->'failedMediaPaths') path where jsonb_typeof(path)<>'string')
        or exists(select 1 from jsonb_array_elements_text(p_response->'failedMediaPaths') failed where not exists(
          select 1 from jsonb_array_elements_text(public.lp_literacy_mock_media_paths(v_item)) required
          where split_part(failed,'#',1)=split_part(required,'#',1))) then
        return json_build_object('ok',false,'error','invalid_media_failure'); end if;
      -- Store exact canonical source paths, even when an image element reports
      -- a source URL without its atlas-cell fragment.
      select jsonb_agg(distinct required order by required) into v_failed_paths
        from jsonb_array_elements_text(public.lp_literacy_mock_media_paths(v_item)) required
        where exists(select 1 from jsonb_array_elements_text(p_response->'failedMediaPaths') failed
          where split_part(failed,'#',1)=split_part(required,'#',1));
    end if;
    if p_response->>'responseStatus'='answered' then
      if jsonb_typeof(p_response->'selected') not in ('string','array') or p_response->'selected' is null then
        return json_build_object('ok',false,'error','invalid_answer'); end if;
      if (v_item->>'answerMode' in ('set','sequence') and (jsonb_typeof(p_response->'selected')<>'array'
        or jsonb_array_length(p_response->'selected') not between 1 and 30
        or exists(select 1 from jsonb_array_elements(p_response->'selected') choice where jsonb_typeof(choice)<>'string')))
        or (v_item->>'answerMode' in ('exact','sentence') and jsonb_typeof(p_response->'selected')<>'string') then
        return json_build_object('ok',false,'error','invalid_answer'); end if;
      if v_item->>'answerMode'='set' and (select count(distinct value) from jsonb_array_elements(p_response->'selected'))<>jsonb_array_length(p_response->'selected') then
        return json_build_object('ok',false,'error','invalid_answer'); end if;
      if v_item->>'format' in ('choice','select_text','multi_select','order','match') and exists(
        select 1 from jsonb_array_elements_text(case when jsonb_typeof(p_response->'selected')='array'
          then p_response->'selected' else jsonb_build_array(p_response->'selected') end) chosen
        where not exists(select 1 from jsonb_array_elements(v_item->'choices') choice where choice->>'id'=chosen)) then
        return json_build_object('ok',false,'error','invalid_answer_choice'); end if;
      if exists(select 1 from jsonb_array_elements_text(v_item->'requiredAudioPaths') path where p_response->'audioDelivery'->>path is distinct from 'completed') then
        return json_build_object('ok',false,'error','audio_not_delivered'); end if;
    elsif coalesce(p_response->'selected','null'::jsonb)<>'null'::jsonb then
      return json_build_object('ok',false,'error','unscored_response_has_answer');
    end if;
    if exists(select 1 from jsonb_each(p_response->'audioDelivery') cue
      where not (v_item->'requiredAudioPaths' ? cue.key) or cue.value not in ('"completed"'::jsonb,'"failed"'::jsonb)) then
      return json_build_object('ok',false,'error','invalid_audio_receipt'); end if;
    v_now:=clock_timestamp();
    -- Recheck after validation, so a slow transaction cannot submit on an old clock.
    if (v_mock->>'deadline_at')::timestamptz<=v_now then
      v_mock:=public.lp_literacy_mock_state(p_session_id);
      return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
    v_valid:=p_response->>'responseStatus'='answered' and not (p_response->>'supportUsed')::boolean;
    v_familiarity:=public.lp_literacy_familiarity(v_student.id,v_item);
    v_answer:=p_response||public.lp_literacy_exposure_identity(v_item)||jsonb_build_object('questionId',v_item->>'id','skillId',v_item->>'skillId',
      'domainId',v_item->>'domainId','level',v_item->'level','itemSnapshot',v_item->'itemSnapshot',
      'isCorrect',case when p_response->>'responseStatus'='answered' then public.lp_literacy_mock_normalize_answer(p_response->'selected',v_item->>'answerMode')
        =public.lp_literacy_mock_normalize_answer(v_item->'answer',v_item->>'answerMode') else null end,
      'evidenceType',case when v_valid then 'independent' when p_response->>'responseStatus'='answered' then 'supported' else 'unscored' end,
      'presentationRole','first_probe','administration','rehearsal','presentationVersion','mock-explicit-submit-v1',
      'familiarityReasons',v_familiarity,'knownFamiliar',case when jsonb_array_length(v_familiarity)>0
        then 'true'::jsonb else coalesce(p_response->'knownFamiliar','null'::jsonb) end,'serverReceivedAt',v_now,'occurredAt',v_now);
    if p_response->>'responseStatus'='media_failed' then
      v_failure:=v_answer||jsonb_build_object('failedMediaPaths',v_failed_paths);
      v_answer:=null;
    end if;
  end if;
  if v_run.session_id is null then
    insert into public.literacy_mock_runs(session_id,student_id,plan) values(p_session_id,v_student.id,v_plan) returning * into v_run;
  end if;
  update public.literacy_mock_runs set plan=v_plan,revision=revision+1,
    responses=responses||case when v_answer is null then '[]'::jsonb else jsonb_build_array(v_answer) end,
    media_failures=media_failures||case when v_failure is null then '[]'::jsonb else jsonb_build_array(v_failure) end,
    status=case when v_failure is not null then status when v_count+case when v_answer is null then 0 else 1 end=jsonb_array_length(v_plan->'itemIds') then 'completed'
      when v_mock->>'state'='prepared' then 'ready' else 'running' end,
    completed_at=case when v_count+case when v_answer is null then 0 else 1 end=jsonb_array_length(v_plan->'itemIds') then clock_timestamp() else null end,
    updated_at=clock_timestamp() where session_id=p_session_id and student_id=v_student.id returning * into v_run;
  insert into public.literacy_mock_run_requests(session_id,student_id,request_id,request_payload,result_revision)
    values(p_session_id,v_student.id,p_request_id,v_payload,v_run.revision);
  if v_run.status='completed' then update public.student_focus_session_members set status='completed',completed_at=v_run.completed_at,updated_at=clock_timestamp()
    where session_id=p_session_id and student_id=v_student.id; end if;
  return json_build_object('ok',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
exception when invalid_text_representation or numeric_value_out_of_range or invalid_parameter_value then
  return json_build_object('ok',false,'error','invalid_payload');
end; $$;
revoke all on function public.lp_literacy_exposure_identity(jsonb), public.lp_literacy_exposures(uuid),
  public.lp_literacy_familiarity(uuid,jsonb), public.lp_literacy_response_eligible(jsonb) from public,anon,authenticated;
-- Reassert the complete boundary on every replaced SECURITY DEFINER function.
revoke all on function public.lp_progress_config_valid(jsonb,text),public.lp_literacy_mock_state(uuid),
  public.lp_literacy_mock_run_json(uuid,uuid),public.lp_literacy_mock_assignment(uuid,uuid),
  public.teacher_prepare_literacy_mock_session(uuid,uuid[],boolean,integer,integer,text),
  public.student_get_literacy_mock_run(text,uuid),public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function public.teacher_prepare_literacy_mock_session(uuid,uuid[],boolean,integer,integer,text) to authenticated;
grant execute on function public.student_get_literacy_mock_run(text,uuid),public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) to anon,authenticated;
commit;
