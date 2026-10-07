begin;
alter table public.literacy_mock_runs add column plan_history jsonb not null default '[]'::jsonb
  check(jsonb_typeof(plan_history)='array' and jsonb_array_length(plan_history)<=128 and octet_length(plan_history::text)<=2000000);
alter table public.literacy_mock_runs add column media_failures jsonb not null default '[]'::jsonb
  check(jsonb_typeof(media_failures)='array' and jsonb_array_length(media_failures)<=128 and octet_length(media_failures::text)<=2000000);
create function public.lp_guard_literacy_mock_run() returns trigger language plpgsql set search_path='' as $$
declare v_count integer:=jsonb_array_length(old.responses);
begin
  if new.session_id<>old.session_id or new.student_id<>old.student_id
    or jsonb_array_length(new.responses)<v_count
    or exists(select 1 from jsonb_array_elements(old.responses) with ordinality r(response,position)
      where response is distinct from new.responses->(position::integer-1))
    or jsonb_array_length(new.media_failures)<jsonb_array_length(old.media_failures)
    or exists(select 1 from jsonb_array_elements(old.media_failures) with ordinality f(failure,position)
      where failure is distinct from new.media_failures->(position::integer-1))
    or new.plan_history<>old.plan_history
    or (old.status='completed' and (new.plan<>old.plan or new.responses<>old.responses or new.media_failures<>old.media_failures or new.status<>old.status)) then
    raise exception 'Mock first-response evidence is immutable'; end if;
  if new.plan<>old.plan then
    if new.plan->'seed'<>old.plan->'seed' or jsonb_array_length(new.plan->'itemIds')<>jsonb_array_length(old.plan->'itemIds')
      or exists(select 1 from jsonb_array_elements(old.plan->'itemIds') with ordinality p(id,position)
        where position<=v_count and id is distinct from new.plan->'itemIds'->(position::integer-1)) then
      raise exception 'Mock answered plan prefix is immutable'; end if;
    new.plan_history:=old.plan_history||jsonb_build_array(jsonb_build_object('previousPlan',old.plan,'afterResponses',v_count,'changedAt',clock_timestamp()));
  end if;
  return new;
end; $$;
create trigger literacy_mock_immutable_evidence before update on public.literacy_mock_runs
  for each row execute function public.lp_guard_literacy_mock_run();
create table public.literacy_mock_run_requests (
  session_id uuid not null,
  student_id uuid not null,
  request_id text not null check(char_length(request_id) between 1 and 160),
  request_payload jsonb not null,
  result_revision integer not null,
  created_at timestamptz not null default now(),
  primary key(session_id,student_id,request_id),
  foreign key(session_id,student_id) references public.literacy_mock_runs(session_id,student_id) on delete cascade
);
alter table public.literacy_mock_run_requests enable row level security;
revoke all on public.literacy_mock_run_requests from public,anon,authenticated;

create function public.lp_literacy_mock_run_json(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('schemaVersion',1,'contentVersion','literacy-mock-v1','assignmentId',r.session_id,
    'studentId',r.student_id,'revision',r.revision,'plan',r.plan,'planHistory',r.plan_history,'responses',r.responses,'status',r.status,
    'mediaFailures',r.media_failures,'completedAt',r.completed_at,'updatedAt',r.updated_at,
    'unsampledItemIds',coalesce((select jsonb_agg(item_id order by position)
      from jsonb_array_elements(r.plan->'itemIds') with ordinality p(item_id,position)
      where position>jsonb_array_length(r.responses)),'[]'::jsonb))
    from public.literacy_mock_runs r where r.session_id=p_session_id and r.student_id=p_student_id;
$$;

create function public.lp_literacy_mock_assignment(p_student_id uuid,p_session_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.student_focus_sessions f
    join public.student_focus_session_members m on m.session_id=f.id
    join public.students s on s.id=m.student_id
    join public.literacy_mock_sessions w on w.session_id=f.id
    where f.id=p_session_id and m.student_id=p_student_id and s.archived_at is null
      and s.teacher_id=f.teacher_id and s.class_id=f.class_id and f.target='progress_check'
      and f.content_version='literacy-mock-v1'
      and m.resolved_config='{"plan_kind":"mock","track_id":"all","bank_version":"literacy-mock-v1"}'::jsonb);
$$;

create function public.student_get_literacy_mock_run(p_token text,p_session_id uuid)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_student public.students; v_mock jsonb;
begin
  v_student:=public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok',false,'error','invalid_session'); end if;
  perform 1 from public.students where id=v_student.id for share;
  if not public.lp_literacy_mock_assignment(v_student.id,p_session_id) then
    return json_build_object('ok',false,'error','assignment_not_found'); end if;
  v_mock:=public.lp_literacy_mock_state(p_session_id);
  return json_build_object('ok',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
end; $$;

create function public.lp_literacy_mock_normalize_answer(p_value jsonb,p_mode text)
returns text language sql immutable security definer set search_path='' as $$
  select case when p_mode='set' then (select string_agg(value, '|' order by value)
      from jsonb_array_elements_text(p_value) value)
    when p_mode='sequence' then p_value::text
    when p_mode='sentence' then lower(btrim(regexp_replace(p_value#>>'{}','\s+',' ','g')))
    else p_value#>>'{}' end;
$$;

create function public.lp_literacy_mock_media_paths(p_item jsonb)
returns jsonb language sql immutable set search_path='' as $$
  select coalesce(p_item->'requiredAudioPaths','[]'::jsonb)
    ||coalesce(p_item#>'{itemSnapshot,requiredImagePaths}','[]'::jsonb);
$$;
create function public.lp_literacy_mock_item_blocked(p_item jsonb,p_failures jsonb)
returns boolean language sql immutable set search_path='' as $$
  select exists(select 1 from jsonb_array_elements(coalesce(p_failures,'[]'::jsonb)) failure
    where failure->>'questionId'=p_item->>'id' or exists(
      select 1 from jsonb_array_elements_text(failure->'failedMediaPaths') failed,
        jsonb_array_elements_text(public.lp_literacy_mock_media_paths(p_item)) required
      where split_part(failed,'#',1)=split_part(required,'#',1)));
$$;

create function public.student_save_literacy_mock_run(p_token text,p_session_id uuid,p_request_id text,
  p_expected_revision integer,p_plan jsonb default null,p_response jsonb default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare
  v_student public.students; v_mock jsonb; v_run public.literacy_mock_runs; v_request public.literacy_mock_run_requests;
  v_payload jsonb; v_plan jsonb; v_item jsonb; v_old_item jsonb; v_answer jsonb; v_previous jsonb; v_failure jsonb; v_failed_paths jsonb;
  v_id text; v_index integer; v_count integer; v_expected_level integer; v_valid boolean; v_now timestamptz;
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
      select item into v_item from public.literacy_mock_items where id=v_id and content_version='literacy-mock-v1';
      if v_item is null then return json_build_object('ok',false,'error','unknown_item'); end if;
      if v_index>v_count and public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures) then
        return json_build_object('ok',false,'error','blocked_media_item'); end if;
      if v_item#>>'{itemSnapshot,tutorialOnly}'='true' or exists (
        select 1 from public.literacy_mock_items tutorial where tutorial.content_version='literacy-mock-v1'
          and tutorial.item#>>'{itemSnapshot,tutorialOnly}'='true'
          and nullif(v_item#>>'{itemSnapshot,stimulusKey}','')=tutorial.item#>>'{itemSnapshot,stimulusKey}') then
        return json_build_object('ok',false,'error','tutorial_item_not_scored'); end if;
      if v_run.session_id is not null then
        select item into v_old_item from public.literacy_mock_items where id=v_run.plan->'itemIds'->>(v_index-1);
        if (v_index<=v_count and to_jsonb(v_id)<>v_run.plan->'itemIds'->(v_index-1))
          or v_item->>'skillId' is distinct from v_old_item->>'skillId' or v_item->>'domainId' is distinct from v_old_item->>'domainId' then
          return json_build_object('ok',false,'error','plan_conflict'); end if;
        if v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1) then
          select response into v_previous from jsonb_array_elements(v_run.responses) with ordinality r(response,position)
            where response->>'skillId'=v_item->>'skillId' and response->>'responseStatus'='answered'
              and response->>'evidenceType'='independent' order by position desc limit 1;
          v_expected_level:=case when public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures) or v_previous is null
            then (v_old_item->>'level')::integer when (v_previous->>'isCorrect')::boolean then 2 else 1 end;
          if (v_item->>'level')::integer<>v_expected_level then return json_build_object('ok',false,'error','invalid_adaptation'); end if;
        end if;
      end if;
    end loop;
    -- A mixed mock must actually cover every advertised area. No claims are
    -- inferred from an area that a timer prevented the child from reaching.
    if (select count(distinct i.item->>'domainId') from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id)<>8 then return json_build_object('ok',false,'error','incomplete_domain_plan'); end if;
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
    select item into v_item from public.literacy_mock_items where id=p_response->>'questionId';
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
    v_answer:=p_response||jsonb_build_object('questionId',v_item->>'id','skillId',v_item->>'skillId',
      'domainId',v_item->>'domainId','level',v_item->'level','itemSnapshot',v_item->'itemSnapshot',
      'isCorrect',case when p_response->>'responseStatus'='answered' then public.lp_literacy_mock_normalize_answer(p_response->'selected',v_item->>'answerMode')
        =public.lp_literacy_mock_normalize_answer(v_item->'answer',v_item->>'answerMode') else null end,
      'evidenceType',case when v_valid then 'independent' when p_response->>'responseStatus'='answered' then 'supported' else 'unscored' end,
      'presentationRole','first_probe','knownFamiliar',case when exists(select 1 from public.literacy_mock_runs prior,
        jsonb_array_elements(prior.responses) response where prior.student_id=v_student.id and (response->>'questionId'=v_item->>'id'
          or (nullif(v_item#>>'{itemSnapshot,stimulusKey}','') is not null and response#>>'{itemSnapshot,stimulusKey}'=v_item#>>'{itemSnapshot,stimulusKey}')))
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

create function public.teacher_list_literacy_mock_sessions(p_class_id uuid,p_limit integer default 20)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_sessions jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists(select 1 from public.classes where id=p_class_id and teacher_id=auth.uid()) then
    return json_build_object('ok',false,'error','class_not_found'); end if;
  if p_limit is null or p_limit not between 1 and 50 then return json_build_object('ok',false,'error','invalid_limit'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'class_id',f.class_id,'started_at',f.started_at,
    'status',f.status,'selection_scope',f.selection_scope,'member_student_ids',coalesce((select jsonb_agg(student_id order by student_id)
      from public.student_focus_session_members where session_id=f.id),'[]'::jsonb),'mock',public.lp_literacy_mock_state(f.id)) order by f.started_at desc),'[]'::jsonb)
    into v_sessions from (select s.* from public.student_focus_sessions s join public.literacy_mock_sessions m on m.session_id=s.id
      where s.class_id=p_class_id and s.teacher_id=auth.uid() order by s.started_at desc limit p_limit) f;
  return json_build_object('ok',true,'sessions',v_sessions);
end; $$;

create function public.teacher_get_literacy_mock_report(p_session_id uuid)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_members jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists(select 1 from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid()) then
    return json_build_object('ok',false,'error','session_not_found'); end if;
  v_result:=public.teacher_get_student_focus_session(p_session_id)::jsonb;
  if v_result#>'{session,mock}' is null then return json_build_object('ok',false,'error','mock_not_found'); end if;
  select coalesce(jsonb_agg(m||jsonb_build_object('run',public.lp_literacy_mock_run_json(p_session_id,(m->>'student_id')::uuid))),'[]'::jsonb)
    into v_members from jsonb_array_elements(v_result->'members') m;
  return jsonb_set(v_result,'{members}',v_members)::json;
end; $$;

revoke all on function public.lp_guard_literacy_mock_run(),public.lp_literacy_mock_run_json(uuid,uuid),public.lp_literacy_mock_assignment(uuid,uuid),
  public.lp_literacy_mock_normalize_answer(jsonb,text),public.lp_literacy_mock_media_paths(jsonb),public.lp_literacy_mock_item_blocked(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.student_get_literacy_mock_run(text,uuid),public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb),
  public.teacher_list_literacy_mock_sessions(uuid,integer),public.teacher_get_literacy_mock_report(uuid) from public,anon,authenticated;
grant execute on function public.student_get_literacy_mock_run(text,uuid),public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) to anon,authenticated;
grant execute on function public.teacher_list_literacy_mock_sessions(uuid,integer),public.teacher_get_literacy_mock_report(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
