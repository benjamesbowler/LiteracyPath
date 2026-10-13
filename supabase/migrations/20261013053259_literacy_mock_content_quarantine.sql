-- Selection-only content quarantine. Published item JSON, plans, receipts and raw
-- historical scores are retained. Current projections distinguish defective
-- content from a child's incorrect response. No tables or caller grants change.
begin;

create or replace function public.lp_literacy_item_quality_issue(p_value jsonb)
returns jsonb language sql immutable set search_path='' as $$
 with source as (select coalesce(p_value->'itemSnapshot',p_value->'questionSnapshot',p_value->'question',p_value) s),
 withdrawn(id,target,alternative) as (values
   ('lp3.r_controlled_vowels.l1.C.ur.v9','turn','tern'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.legacy-heard.turn','turn','tern'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.heard-print.turn','turn','tern'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.turn','turn','tern'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.legacy-heard.fur','fur','fir'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.legacy-heard.fur','fur','fir'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.heard-print.fur','fur','fir'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.fur','fur','fir'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.legacy-heard.surf','surf','serf'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.legacy-heard.surf','surf','serf'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.heard-print.surf','surf','serf'),
   ('mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.surf','surf','serf'),
   ('lp3.vowel_teams.l1.A.ea.v104','meat','meet'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.legacy-heard.meat','meat','meet'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ee-long-e.l1.legacy-heard.see','see','sea'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ee-long-e.l1.heard-print.see','see','sea'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.legacy-heard.sea','sea','see'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.heard-print.sea','sea','see'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.heard-print.heal','heal','heel'),
   ('mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l2.legacy-heard.beach','beach','beech'))
 select jsonb_build_object('code','ambiguous_spelling','target',target,'alternative',alternative,
  'reason','This question offers both '||target||' and '||alternative||' from the same spoken word without context to distinguish them. It cannot establish a correct or incorrect literacy response.')
 from withdrawn cross join source where id=any(array[p_value->>'questionId',p_value->>'id',s->>'id',p_value->>'sourceItemId',s->>'sourceItemId']) limit 1;
$$;

create or replace function public.lp_literacy_item_quarantined(p_value jsonb)
returns boolean language sql immutable set search_path='' as $$
 select public.lp_literacy_item_quality_issue(p_value) is not null;
$$;

create or replace function public.lp_literacy_content_response(p_response jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select case when issue is null then p_response else p_response||jsonb_build_object(
  'contentIssue',issue,'validity','invalid','evidenceType','unscored',
  'originalIsCorrect',coalesce(p_response->'originalIsCorrect',p_response->'isCorrect'),'isCorrect',null) end
 from (select public.lp_literacy_item_quality_issue(p_response) issue) quality;
$$;

create or replace function public.lp_literacy_mock_state(p_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_focus public.student_focus_sessions; v_mock public.literacy_mock_sessions; v_now timestamptz:=clock_timestamp();
begin
  select * into v_focus from public.student_focus_sessions where id=p_session_id for update;
  select * into v_mock from public.literacy_mock_sessions where session_id=p_session_id for update;
  if v_mock.session_id is null then return null; end if;
  v_now:=clock_timestamp();
  if v_mock.state<>'completed' and (v_focus.status='ended' or v_focus.expires_at<=v_now
    or (v_mock.state='running' and v_mock.deadline_at<=v_now and v_mock.window_mode='timed_sample')) then
    update public.literacy_mock_sessions set state='completed',revision=revision+1,remaining_seconds=0,deadline_at=null,
      ended_at=v_now,end_reason=case when v_focus.status='ended' then 'teacher_closed'
        when v_focus.expires_at<=v_now then 'session_expired' else 'time_finished' end,updated_at=v_now
      where session_id=p_session_id returning * into v_mock;
    update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id and status<>'completed';
    update public.student_focus_session_members set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id;
    update public.student_focus_session_members set active=false where session_id=p_session_id;
    update public.student_focus_sessions set status='ended',ended_at=coalesce(ended_at,v_now),updated_at=v_now where id=p_session_id;
  elsif v_mock.state='running' and v_mock.deadline_at<=v_now then
    update public.literacy_mock_sessions set state='paused',revision=revision+1,remaining_seconds=duration_seconds,
      deadline_at=null,pause_reason='window_elapsed',updated_at=v_now where session_id=p_session_id returning * into v_mock;
  end if;
  return (to_jsonb(v_mock)-'session_id')||jsonb_build_object('server_now',v_now,'content_version',v_focus.content_version,
    'capabilities',jsonb_build_object('contentQuarantineRepair',true,'presentationReceipts',v_focus.content_version in ('literacy-mock-v3','literacy-mock-v4'),'supportResolution',v_focus.content_version in ('literacy-mock-v3','literacy-mock-v4'),
      'entryChecks',v_focus.content_version in ('literacy-mock-v3','literacy-mock-v4'),'freshChecks',v_focus.content_version in ('literacy-mock-v3','literacy-mock-v4'),'windowModes',v_focus.content_version in ('literacy-mock-v3','literacy-mock-v4')),
    'remaining_seconds',case when v_mock.state='running' then greatest(0,ceil(extract(epoch from(v_mock.deadline_at-v_now)))::integer)
      else least(v_mock.remaining_seconds,greatest(0,ceil(extract(epoch from(v_focus.expires_at-v_now)))::integer)) end);
end; $$;

create or replace function public.lp_literacy_mock_effective_response(p_session_id uuid,p_student_id uuid,p_response jsonb)
returns jsonb language sql stable security definer set search_path='' as $$
 with support as (select public.lp_literacy_mock_help(p_session_id,p_student_id,p_response->>'questionId') h),
 conditions as (select h,coalesce(p_response->>'supportUsed','false')='true' or h->>'assistanceType'='answer' answer_help from support)
 select public.lp_literacy_content_response(p_response||jsonb_build_object('helpRequested',(h->>'helpRequested')::boolean,'supportPending',(h->>'pending')::boolean,
   'assistanceType',case when answer_help then 'answer' else h->>'assistanceType' end,
   'accessAssistance',h->>'assistanceType'='access','answerAssistance',answer_help,'supportUsed',answer_help,
   'evidenceType',case when p_response->>'responseStatus'<>'answered' then 'unscored'
    when answer_help then 'supported' when (h->>'pending')::boolean then 'unscored' else 'independent' end)) from conditions;
$$;

create or replace function public.lp_literacy_response_eligible(p_response jsonb)
returns boolean language sql immutable set search_path='' as $$
 select coalesce(not public.lp_literacy_item_quarantined(p_response) and p_response->>'evidenceType'='independent'
  and p_response->>'responseStatus'='answered' and jsonb_typeof(p_response->'isCorrect')='boolean'
  and coalesce(p_response->>'supportUsed','false')='false' and coalesce(p_response->>'supportPending','false')='false'
  and coalesce(p_response->>'knownFamiliar','false')<>'true'
  and coalesce(p_response->>'priorPracticeExposure','false')<>'true'
  and coalesce(p_response->>'knownPracticeFamiliarity','false')<>'true'
  and coalesce(p_response->>'validity','valid')<>'invalid'
  and coalesce(p_response->>'presentationRole','first_probe')='first_probe',false);
$$;

create or replace function public.lp_literacy_mock_run_json(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('schemaVersion',case when f.content_version in ('literacy-mock-v3','literacy-mock-v4') then 2 else 1 end,
  'contentVersion',f.content_version,'assignmentId',r.session_id,'studentId',r.student_id,'revision',r.revision,
  'windowMode',w.window_mode,'durationSeconds',w.duration_seconds,
  'timeExtensionCount',(select count(*) from public.literacy_mock_controls c where c.session_id=r.session_id and c.action='add_time'),
  'plan',r.plan,'planHistory',r.plan_history,'responses',case when f.content_version in ('literacy-mock-v3','literacy-mock-v4') then
   coalesce((select jsonb_agg(public.lp_literacy_mock_effective_response(p_session_id,p_student_id,response) order by position)
    from jsonb_array_elements(r.responses) with ordinality e(response,position)),'[]'::jsonb) else coalesce((select jsonb_agg(public.lp_literacy_content_response(response) order by position)
    from jsonb_array_elements(r.responses) with ordinality e(response,position)),'[]'::jsonb) end,
  'status',r.status,'mediaFailures',r.media_failures,'completedAt',r.completed_at,'updatedAt',r.updated_at,
  'presentationTracking',f.content_version in ('literacy-mock-v3','literacy-mock-v4'),
  'eventRevision',coalesce((select max(event_id) from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id),0),
  'presentations',coalesce((select jsonb_agg(e.payload||jsonb_build_object('serverReceivedAt',e.created_at) order by e.event_id)
   from public.literacy_mock_events e where e.session_id=p_session_id and e.student_id=p_student_id and e.event_type='presented'),'[]'::jsonb),
  'helpRequests',coalesce((select jsonb_agg(public.lp_literacy_mock_help(p_session_id,p_student_id,q.question_id)
   ||jsonb_build_object('itemSnapshot',(select payload->'itemSnapshot' from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and question_id=q.question_id and event_type='presented' order by event_id limit 1)))
   from (select distinct question_id from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id
    and event_type in ('help_requested','help_cancelled','support_resolved')) q),'[]'::jsonb),
  'unsampledItemIds',coalesce((select jsonb_agg(item_id order by position)
   from jsonb_array_elements(r.plan->'itemIds') with ordinality p(item_id,position)
   where position>jsonb_array_length(r.responses)),'[]'::jsonb))
 from public.literacy_mock_runs r join public.student_focus_sessions f on f.id=r.session_id
 join public.literacy_mock_sessions w on w.session_id=r.session_id
 where r.session_id=p_session_id and r.student_id=p_student_id;
$$;

create or replace function public.lp_literacy_mock_fresh_selection_for_version(p_student_id uuid,p_focus jsonb,p_version text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_candidate record; v_prior jsonb:=public.lp_literacy_exposures(p_student_id); v_identity jsonb;
  v_pool_ids text[]:='{}'; v_pool_items text[]:='{}'; v_pool_stimuli text[]:='{}'; v_pool_families text[]:='{}'; v_pool_raw_stimuli text[]:='{}';
  v_ids text[]:='{}'; v_items text[]:='{}'; v_stimuli text[]:='{}'; v_families text[]:='{}'; v_best text[]:='{}'; v_raw_stimuli text[]:='{}';
  v_item text; v_stimulus text; v_family text; v_raw_stimulus text; v_n integer; v_index integer; v_mask integer; v_bound integer; v_valid boolean;
begin
  for v_candidate in select id,item from public.literacy_mock_items i
    where content_version=p_version and (p_version<>'literacy-mock-v4' or item#>>'{itemSnapshot,adaptiveMixedEligible}'='true') and public.lp_literacy_mock_conditions(item)=p_focus
      and not public.lp_literacy_item_quarantined(item)
      and coalesce(item#>>'{itemSnapshot,tutorialOnly}','false')<>'true'
      and coalesce(item->>'mediaReady','true')<>'false'
      and coalesce(item#>>'{itemSnapshot,mediaReady}','true')<>'false'
      and not exists(select 1 from public.literacy_mock_items t where t.content_version=i.content_version
        and t.item#>>'{itemSnapshot,tutorialOnly}'='true'
        and nullif(t.item#>>'{itemSnapshot,stimulusKey}','')=i.item#>>'{itemSnapshot,stimulusKey}')
    order by id loop
    v_identity:=public.lp_literacy_exposure_identity(v_candidate.item);
    -- Read authoritative history once, retaining the familiarity helper's exact
    -- item/passage/family matching semantics for synced practice and mock events.
    if exists(select 1 from jsonb_each_text(v_identity) identity(key,value)
      where identity.value<>'' and exists(select 1 from jsonb_array_elements(v_prior) prior
        where prior->>identity.key=identity.value)) then continue; end if;
    v_item:=coalesce(nullif(v_identity->>'exposureItemId',''),v_candidate.id);
    v_stimulus:=coalesce(nullif(v_identity->>'exposurePassageKey',''),v_candidate.id);
    v_family:=coalesce(v_identity->>'exposureFamilyId','');
    v_raw_stimulus:=coalesce(nullif(v_candidate.item#>>'{itemSnapshot,stimulusKey}',''),v_candidate.id);
    v_pool_ids:=array_append(v_pool_ids,v_candidate.id); v_pool_items:=array_append(v_pool_items,v_item);
    v_pool_stimuli:=array_append(v_pool_stimuli,v_stimulus); v_pool_families:=array_append(v_pool_families,v_family);
    v_pool_raw_stimuli:=array_append(v_pool_raw_stimuli,v_raw_stimulus);
    if v_item=any(v_items) or v_stimulus=any(v_stimuli) or v_raw_stimulus=any(v_raw_stimuli) or (v_family<>'' and v_family=any(v_families)) then continue; end if;
    v_best:=array_append(v_best,v_candidate.id); v_items:=array_append(v_items,v_item); v_stimuli:=array_append(v_stimuli,v_stimulus); v_raw_stimuli:=array_append(v_raw_stimuli,v_raw_stimulus);
    if v_family<>'' then v_families:=array_append(v_families,v_family); end if;
  end loop;
  v_n:=cardinality(v_pool_ids);
  select least(count(distinct item_key),count(distinct stimulus),count(distinct raw_stimulus),
    count(distinct nullif(family,''))+count(*) filter(where family=''))::integer into v_bound
    from unnest(v_pool_items,v_pool_stimuli,v_pool_families,v_pool_raw_stimuli) pool(item_key,stimulus,family,raw_stimulus);
  if v_n between 1 and 10 and cardinality(v_best)<v_bound then
    for v_mask in 1..((1<<v_n)-1) loop
      if bit_count(v_mask::bit(10))<=cardinality(v_best) then continue; end if;
      v_ids:='{}'; v_items:='{}'; v_stimuli:='{}'; v_families:='{}'; v_raw_stimuli:='{}'; v_valid:=true;
      for v_index in 1..v_n loop
        if (v_mask & (1<<(v_index-1)))=0 then continue; end if;
        v_item:=v_pool_items[v_index]; v_stimulus:=v_pool_stimuli[v_index]; v_family:=v_pool_families[v_index]; v_raw_stimulus:=v_pool_raw_stimuli[v_index];
        if v_item=any(v_items) or v_stimulus=any(v_stimuli) or v_raw_stimulus=any(v_raw_stimuli) or (v_family<>'' and v_family=any(v_families)) then
          v_valid:=false; exit; end if;
        v_ids:=array_append(v_ids,v_pool_ids[v_index]); v_items:=array_append(v_items,v_item); v_stimuli:=array_append(v_stimuli,v_stimulus); v_raw_stimuli:=array_append(v_raw_stimuli,v_raw_stimulus);
        if v_family<>'' then v_families:=array_append(v_families,v_family); end if;
      end loop;
      if v_valid then v_best:=v_ids; end if;
      exit when cardinality(v_best)=v_bound;
    end loop;
  end if;
  return jsonb_build_object('candidateItemIds',to_jsonb(v_best),'remainingCount',cardinality(v_best),
    'countKind',case when v_n<=10 or cardinality(v_best)=v_bound then 'exact' else 'lower_bound' end);
end; $$;

create or replace function public.student_record_literacy_mock_event(p_token text,p_session_id uuid,p_question_id text,p_event text,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_student public.students; v_mock jsonb; v_run public.literacy_mock_runs; v_event public.literacy_mock_events;
 v_item jsonb; v_payload jsonb; v_familiarity jsonb;
begin
 v_student:=public.student_from_token(p_token);
 if v_student.id is null then return json_build_object('ok',false,'error','invalid_session'); end if;
 perform 1 from public.students where id=v_student.id for share;
 if not public.lp_literacy_mock_assignment(v_student.id,p_session_id) then return json_build_object('ok',false,'error','assignment_not_found'); end if;
 if p_event is null or p_event not in ('presented','help_requested','help_cancelled') or coalesce(char_length(p_question_id),0) not between 1 and 240
  or coalesce(char_length(p_request_id),0) not between 1 and 160 then return json_build_object('ok',false,'error','invalid_event'); end if;
 v_mock:=public.lp_literacy_mock_state(p_session_id);
 if v_mock->>'content_version' not in ('literacy-mock-v3','literacy-mock-v4') then return json_build_object('ok',false,'error','unsupported_event_version'); end if;
 select * into v_run from public.literacy_mock_runs where session_id=p_session_id and student_id=v_student.id for update;
 if not found then return json_build_object('ok',false,'error','plan_required'); end if;
 select * into v_event from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and actor_key='student' and request_id=p_request_id;
 if found then
  if v_event.event_type<>p_event or v_event.question_id<>p_question_id then return json_build_object('ok',false,'error','request_conflict'); end if;
  return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
 end if;
 -- Repeated render callbacks are a single offer, not additional familiarity.
 if p_event='presented' and exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=p_question_id and event_type='presented') then
  return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id)); end if;
 if v_mock->>'state'<>'running' or v_run.status='completed' then return json_build_object('ok',false,'error','assessment_not_running','mock',v_mock); end if;
 if p_question_id is distinct from v_run.plan->'itemIds'->>jsonb_array_length(v_run.responses) then return json_build_object('ok',false,'error','question_not_current'); end if;
 if not exists(select 1 from public.student_focus_session_members where session_id=p_session_id and student_id=v_student.id and active) then
  return json_build_object('ok',false,'error','assignment_not_found'); end if;
 select item into v_item from public.literacy_mock_items where content_version=v_mock->>'content_version' and id=p_question_id;
 if public.lp_literacy_item_quarantined(v_item) then return json_build_object('ok',false,'error','content_item_withdrawn'); end if;
 if v_item is null or public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures) then return json_build_object('ok',false,'error','blocked_media_item'); end if;
 if p_event in ('help_requested','help_cancelled') and not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=p_question_id and event_type='presented') then
  return json_build_object('ok',false,'error','presentation_required'); end if;
 if p_event='help_cancelled' and public.lp_literacy_mock_help(p_session_id,v_student.id,p_question_id)->>'pending'<>'true' then
  return json_build_object('ok',false,'error','help_not_pending'); end if;
 if (select count(*) from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id)>=512 then
  return json_build_object('ok',false,'error','event_limit'); end if;
 v_familiarity:=public.lp_literacy_familiarity(v_student.id,v_item);
 v_payload:=public.lp_literacy_exposure_identity(v_item)||jsonb_build_object('questionId',p_question_id,
  'skillId',v_item->>'skillId','domainId',v_item->>'domainId','level',v_item->'level','itemSnapshot',v_item->'itemSnapshot',
  'presentationStatus','presented','knownFamiliar',case when jsonb_array_length(v_familiarity)>0 then 'true'::jsonb else 'null'::jsonb end,
  'familiarityReasons',v_familiarity);
 insert into public.literacy_mock_events(session_id,student_id,question_id,actor_key,request_id,event_type,payload)
  values(p_session_id,v_student.id,p_question_id,'student',p_request_id,p_event,case when p_event='presented' then v_payload else '{}'::jsonb end);
 return json_build_object('ok',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id));
end; $$;

create or replace function public.student_save_literacy_mock_run(p_token text,p_session_id uuid,p_request_id text,
  p_expected_revision integer,p_plan jsonb default null,p_response jsonb default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare
  v_student public.students; v_mock jsonb; v_run public.literacy_mock_runs; v_request public.literacy_mock_run_requests;
  v_payload jsonb; v_plan jsonb; v_item jsonb; v_old_item jsonb; v_answer jsonb; v_previous jsonb; v_failure jsonb; v_failed_paths jsonb;
  v_version text; v_familiarity jsonb; v_presentation jsonb; v_id text; v_index integer; v_count integer; v_expected_level integer; v_valid boolean; v_now timestamptz;
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
      if v_index>v_count and public.lp_literacy_item_quarantined(v_item) then
        return json_build_object('ok',false,'error','content_item_withdrawn'); end if;
      if v_index>v_count and public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures) then
        return json_build_object('ok',false,'error','blocked_media_item'); end if;
      if v_item#>>'{itemSnapshot,tutorialOnly}'='true' or exists (
        select 1 from public.literacy_mock_items tutorial where tutorial.content_version=v_version
          and tutorial.item#>>'{itemSnapshot,tutorialOnly}'='true'
          and nullif(v_item#>>'{itemSnapshot,stimulusKey}','')=tutorial.item#>>'{itemSnapshot,stimulusKey}') then
        return json_build_object('ok',false,'error','tutorial_item_not_scored'); end if;
      if v_version in ('literacy-mock-v3','literacy-mock-v4') and v_mock->>'fresh_sampling'='true' and v_index>v_count
        and (v_run.session_id is null or v_id is distinct from v_run.plan->'itemIds'->>(v_index-1))
        and not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=v_id and event_type='presented')
        and jsonb_array_length(public.lp_literacy_familiarity(v_student.id,v_item))>0 then
        return json_build_object('ok',false,'error','fresh_item_exposed'); end if;
      if v_version in ('literacy-mock-v3','literacy-mock-v4') and v_mock->>'plan_kind'='fresh_check' then
        if not (v_mock->'candidate_item_ids' ? v_id) or public.lp_literacy_mock_conditions(v_item)<>v_mock->'focus' then
          return json_build_object('ok',false,'error','invalid_fresh_check_plan'); end if;
        if v_index>v_count and not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=v_id and event_type='presented')
          and jsonb_array_length(public.lp_literacy_familiarity(v_student.id,v_item))>0 then
          return json_build_object('ok',false,'error','fresh_item_exposed'); end if;
      end if;
      if v_version='literacy-mock-v4' and v_mock->>'plan_kind'='mixed'
      and coalesce((v_item#>>'{itemSnapshot,adaptiveMixedEligible}')::boolean,false)=false then
      return json_build_object('ok',false,'error','nonadaptive_mixed_task'); end if;
    if v_version in ('literacy-mock-v3','literacy-mock-v4') and v_run.session_id is null and v_mock->>'plan_kind'='mixed' and (v_item->>'level')::integer<>1 then
        return json_build_object('ok',false,'error','invalid_entry_level'); end if;
      if v_run.session_id is not null then
        select item into v_old_item from public.literacy_mock_items where id=v_run.plan->'itemIds'->>(v_index-1) and content_version=v_version;
        if (v_index<=v_count and to_jsonb(v_id)<>v_run.plan->'itemIds'->(v_index-1))
          or v_item->>'skillId' is distinct from v_old_item->>'skillId' or v_item->>'domainId' is distinct from v_old_item->>'domainId' then
          return json_build_object('ok',false,'error','plan_conflict'); end if;
        -- A content repair is the same task at the same level, including legacy sittings.
        if public.lp_literacy_item_quarantined(v_old_item) and public.lp_literacy_mock_conditions(v_item) is distinct from public.lp_literacy_mock_conditions(v_old_item) then
          return json_build_object('ok',false,'error','plan_condition_conflict'); end if;
        if v_version in ('literacy-mock-v3','literacy-mock-v4') and public.lp_literacy_mock_conditions(v_item)-'level' is distinct from public.lp_literacy_mock_conditions(v_old_item)-'level' then
          return json_build_object('ok',false,'error','plan_condition_conflict'); end if;
        if v_version in ('literacy-mock-v3','literacy-mock-v4') and v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1)
          and not public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures)
          and not public.lp_literacy_item_quarantined(v_old_item)
          and exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id
            and question_id=v_old_item->>'id' and event_type='presented') then
          return json_build_object('ok',false,'error','presented_item_frozen'); end if;
        if v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1) then
          select effective into v_previous from jsonb_array_elements(v_run.responses) with ordinality r(response,position)
            cross join lateral (select case when v_version in ('literacy-mock-v3','literacy-mock-v4')
              then public.lp_literacy_mock_effective_response(p_session_id,v_student.id,response) else response end effective) e
            where response->>'skillId'=v_item->>'skillId' and public.lp_literacy_response_eligible(effective)
              and (v_version not in ('literacy-mock-v3','literacy-mock-v4') or public.lp_literacy_mock_conditions(effective)-'level'=public.lp_literacy_mock_conditions(v_item)-'level')
            order by position desc limit 1;
          v_expected_level:=case when v_mock->>'plan_kind'='fresh_check' or public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures)
            or public.lp_literacy_item_quarantined(v_old_item)
            then (v_old_item->>'level')::integer when v_previous is null then case when v_version in ('literacy-mock-v3','literacy-mock-v4') then 1 else (v_old_item->>'level')::integer end
            when (v_previous->>'isCorrect')::boolean then 2 else 1 end;
          if (v_item->>'level')::integer<>v_expected_level then return json_build_object('ok',false,'error','invalid_adaptation'); end if;
        end if;
      end if;
    end loop;
    -- A mixed mock must actually cover every advertised area. No claims are
    -- inferred from an area that a timer prevented the child from reaching.
    if coalesce(v_mock->>'plan_kind','mixed')='mixed' and (select count(distinct i.item->>'domainId') from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version)<>8 then return json_build_object('ok',false,'error','incomplete_domain_plan'); end if;
    if v_version in ('literacy-mock-v3','literacy-mock-v4') and exists(select 1 from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version
      group by coalesce(nullif(i.item#>>'{itemSnapshot,stimulusKey}',''),i.id) having count(*)>1) then
      return json_build_object('ok',false,'error','repeated_stimulus'); end if;
    if v_version in ('literacy-mock-v3','literacy-mock-v4') and v_mock->>'fresh_sampling'='true' and exists(
      select identity.key,identity.value from jsonb_array_elements_text(p_plan->'itemIds') p(id)
        join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version
        cross join lateral jsonb_each_text(public.lp_literacy_exposure_identity(i.item)) identity
      where nullif(identity.value,'') is not null group by identity.key,identity.value having count(*)>1) then
      return json_build_object('ok',false,'error','repeated_exposure_identity'); end if;
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
    if public.lp_literacy_item_quarantined(v_item) then return json_build_object('ok',false,'error','content_item_withdrawn'); end if;
    if v_version in ('literacy-mock-v3','literacy-mock-v4') then
      select payload into v_presentation from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id
        and question_id=p_response->>'questionId' and event_type='presented' order by event_id limit 1;
      if v_presentation is null then return json_build_object('ok',false,'error','presentation_required'); end if;
    end if;
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
    v_familiarity:=case when v_version in ('literacy-mock-v3','literacy-mock-v4') then v_presentation->'familiarityReasons' else public.lp_literacy_familiarity(v_student.id,v_item) end;
    v_answer:=p_response||public.lp_literacy_exposure_identity(v_item)||jsonb_build_object('questionId',v_item->>'id','skillId',v_item->>'skillId',
      'domainId',v_item->>'domainId','level',v_item->'level','itemSnapshot',v_item->'itemSnapshot',
      'isCorrect',case when p_response->>'responseStatus'='answered' then public.lp_literacy_mock_normalize_answer(p_response->'selected',v_item->>'answerMode')
        =public.lp_literacy_mock_normalize_answer(v_item->'answer',v_item->>'answerMode') else null end,
      'evidenceType',case when v_valid then 'independent' when p_response->>'responseStatus'='answered' then 'supported' else 'unscored' end,
      'presentationRole','first_probe','administration','rehearsal','presentationVersion','mock-explicit-submit-v1',
      'familiarityReasons',v_familiarity,'knownFamiliar',case when jsonb_array_length(v_familiarity)>0
        then 'true'::jsonb else coalesce(p_response->'knownFamiliar','null'::jsonb) end,'serverReceivedAt',v_now,'occurredAt',v_now);
    if v_version in ('literacy-mock-v3','literacy-mock-v4') then v_answer:=public.lp_literacy_mock_effective_response(p_session_id,v_student.id,v_answer); end if;
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
revoke all on function public.lp_literacy_item_quality_issue(jsonb),public.lp_literacy_item_quarantined(jsonb),
 public.lp_literacy_content_response(jsonb),public.lp_literacy_response_eligible(jsonb),
 public.lp_literacy_mock_effective_response(uuid,uuid,jsonb),public.lp_literacy_mock_state(uuid),
 public.lp_literacy_mock_run_json(uuid,uuid),public.lp_literacy_mock_fresh_selection_for_version(uuid,jsonb,text) from public,anon,authenticated;
-- Restate the existing token-scoped RPC grants explicitly so each forward
-- migration has a complete, auditable privilege boundary of its own.
revoke all on function public.student_record_literacy_mock_event(text,uuid,text,text,text),
 public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.student_record_literacy_mock_event(text,uuid,text,text,text),
 public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) to anon,authenticated;
commit;
