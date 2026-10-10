begin;
-- V3 adds resumable classroom windows and separate administration evidence.
-- Applied v1/v2 items and raw first answers remain immutable.
alter table public.literacy_mock_items drop constraint literacy_mock_items_content_version_check;
alter table public.literacy_mock_items add check(content_version in ('literacy-mock-v1','literacy-mock-v2','literacy-mock-v3'));
alter table public.literacy_mock_publications drop constraint literacy_mock_publications_content_version_check;
alter table public.literacy_mock_publications add check(content_version in ('literacy-mock-v1','literacy-mock-v2','literacy-mock-v3'));
alter table public.literacy_mock_sessions add column window_mode text not null default 'timed_sample'
 check(window_mode in ('timed_sample','pause_at_window_end'));
alter table public.literacy_mock_sessions add column pause_reason text;
alter table public.literacy_mock_sessions add column plan_kind text not null default 'mixed' check(plan_kind in ('mixed','fresh_check'));
alter table public.literacy_mock_sessions add column focus jsonb;
alter table public.literacy_mock_sessions add column source_session_id uuid references public.literacy_mock_sessions(session_id) on delete set null;
alter table public.literacy_mock_sessions add column source_question_id text;
alter table public.literacy_mock_sessions add column candidate_item_ids jsonb not null default '[]'::jsonb check(jsonb_typeof(candidate_item_ids)='array');
alter table public.literacy_mock_sessions drop constraint literacy_mock_sessions_item_count_check;
alter table public.literacy_mock_sessions add check((plan_kind='mixed' and item_count in (24,43)) or (plan_kind='fresh_check' and item_count between 1 and 6));
create table public.literacy_mock_events (
 event_id bigint generated always as identity primary key,
 session_id uuid not null, student_id uuid not null, question_id text not null,
 actor_key text not null, request_id text not null check(char_length(request_id) between 1 and 160),
 event_type text not null check(event_type in ('presented','help_requested','help_cancelled','support_resolved')),
 payload jsonb not null, created_at timestamptz not null default clock_timestamp(),
 unique(session_id,student_id,actor_key,request_id),
 foreign key(session_id,student_id) references public.literacy_mock_runs(session_id,student_id) on delete cascade
);
create index literacy_mock_events_question_idx on public.literacy_mock_events(session_id,student_id,question_id,event_id);
create index literacy_mock_events_student_idx on public.literacy_mock_events(student_id) where event_type='presented';
alter table public.literacy_mock_events enable row level security;
revoke all on public.literacy_mock_events from public,anon,authenticated;
revoke all on sequence public.literacy_mock_events_event_id_seq from public,anon,authenticated;
create or replace function public.lp_progress_config_valid(p_config jsonb,p_version text)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
  if p_version in ('literacy-mock-v1','literacy-mock-v2','literacy-mock-v3')
    and p_config=jsonb_build_object('plan_kind','mock','track_id','all','bank_version',p_version) then return true; end if;
  return public.lp_progress_config_valid_before_mock(p_config,p_version);
end; $$;

create or replace function public.lp_literacy_mock_assignment(p_student_id uuid,p_session_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.student_focus_sessions f
    join public.student_focus_session_members m on m.session_id=f.id
    join public.students s on s.id=m.student_id
    join public.literacy_mock_sessions w on w.session_id=f.id
    where f.id=p_session_id and m.student_id=p_student_id and s.archived_at is null
      and s.teacher_id=f.teacher_id and s.class_id=f.class_id and f.target='progress_check'
      and f.content_version in ('literacy-mock-v1','literacy-mock-v2','literacy-mock-v3')
      and m.resolved_config=jsonb_build_object('plan_kind','mock','track_id','all','bank_version',f.content_version));
$$;

create or replace function public.lp_literacy_mock_state(p_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_focus public.student_focus_sessions; v_mock public.literacy_mock_sessions; v_now timestamptz:=clock_timestamp();
begin
  select * into v_focus from public.student_focus_sessions where id=p_session_id for update;
  select * into v_mock from public.literacy_mock_sessions where session_id=p_session_id for update;
  if v_mock.session_id is null then return null; end if;
  v_now:=clock_timestamp();
  if v_mock.state<>'completed' and (v_focus.status<>'active' or v_focus.expires_at<=v_now
    or (v_mock.state='running' and v_mock.deadline_at<=v_now and v_mock.window_mode='timed_sample')) then
    update public.literacy_mock_sessions set state='completed',revision=revision+1,remaining_seconds=0,deadline_at=null,
      ended_at=v_now,end_reason=case when v_focus.status<>'active' then 'teacher_closed'
        when v_focus.expires_at<=v_now then 'session_expired' else 'time_finished' end,updated_at=v_now
      where session_id=p_session_id returning * into v_mock;
    update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id and status<>'completed';
    update public.student_focus_session_members set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now
      where session_id=p_session_id;
  elsif v_mock.state='running' and v_mock.deadline_at<=v_now then
    update public.literacy_mock_sessions set state='paused',revision=revision+1,remaining_seconds=duration_seconds,
      deadline_at=null,pause_reason='window_elapsed',updated_at=v_now where session_id=p_session_id returning * into v_mock;
  end if;
  return (to_jsonb(v_mock)-'session_id')||jsonb_build_object('server_now',v_now,'content_version',v_focus.content_version,
    'capabilities',jsonb_build_object('presentationReceipts',v_focus.content_version='literacy-mock-v3','supportResolution',v_focus.content_version='literacy-mock-v3',
      'freshChecks',v_focus.content_version='literacy-mock-v3','windowModes',v_focus.content_version='literacy-mock-v3'),
    'remaining_seconds',case when v_mock.state='running' then greatest(0,ceil(extract(epoch from(v_mock.deadline_at-v_now)))::integer)
      else least(v_mock.remaining_seconds,greatest(0,ceil(extract(epoch from(v_focus.expires_at-v_now)))::integer)) end);
end; $$;

create or replace function public.teacher_control_literacy_mock_session(p_session_id uuid,p_action text,p_expected_revision integer,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_mock jsonb; v_saved public.literacy_mock_controls; v_now timestamptz:=clock_timestamp(); v_remaining integer; v_expires timestamptz;
begin
  perform public.assert_current_actor_teacher_access();
  select expires_at into v_expires from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid() for update;
  if not found then return json_build_object('ok',false,'error','session_not_found'); end if;
  if p_action is null or p_action not in ('start','pause','resume','add_time','finish') or p_expected_revision is null
    or p_expected_revision<0 or coalesce(char_length(p_request_id),0) not between 1 and 160 then
    return json_build_object('ok',false,'error','invalid_control'); end if;
  v_mock:=public.lp_literacy_mock_state(p_session_id);
  if v_mock is null then return json_build_object('ok',false,'error','mock_not_found'); end if;
  select * into v_saved from public.literacy_mock_controls where session_id=p_session_id and request_id=p_request_id;
  if found then
    if v_saved.action<>p_action or v_saved.expected_revision<>p_expected_revision then
      return json_build_object('ok',false,'error','request_conflict'); end if;
    return (public.teacher_get_student_focus_session(p_session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
  end if;
  if (v_mock->>'revision')::integer<>p_expected_revision then return json_build_object('ok',false,'error','stale_revision','mock',v_mock); end if;
  if p_expected_revision>=500 then return json_build_object('ok',false,'error','control_limit'); end if;
  if v_mock->>'state'='completed' then return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
  if (p_action='start' and v_mock->>'state'<>'prepared') or (p_action='resume' and v_mock->>'state'<>'paused')
    or (p_action='pause' and v_mock->>'state'<>'running') then return json_build_object('ok',false,'error','invalid_transition','mock',v_mock); end if;
  v_now:=clock_timestamp();
  v_remaining:=(v_mock->>'remaining_seconds')::integer;
  if p_action='add_time' then v_remaining:=least(v_remaining+300,greatest(0,floor(extract(epoch from(v_expires-v_now)))::integer)); end if;
  update public.literacy_mock_sessions set
    state=case when p_action in ('start','resume') then 'running' when p_action='pause' then 'paused' when p_action='finish' then 'completed' else state end,
    pause_reason=case when p_action='pause' then 'teacher_pause' when p_action in ('start','resume','finish') then null else pause_reason end,
    revision=revision+1,remaining_seconds=case when p_action='finish' then 0 else v_remaining end,
    deadline_at=case when p_action in ('start','resume') or (p_action='add_time' and state='running') then least(v_expires,v_now+make_interval(secs=>v_remaining))
      when p_action in ('pause','finish') then null else deadline_at end,
    started_at=case when p_action='start' then v_now else started_at end,
    ended_at=case when p_action='finish' then v_now else ended_at end,
    end_reason=case when p_action='finish' then 'teacher_finished' else end_reason end,updated_at=v_now
    where session_id=p_session_id;
  if p_action='finish' then
    update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now where session_id=p_session_id and status<>'completed';
    update public.student_focus_session_members set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now where session_id=p_session_id;
  end if;
  insert into public.literacy_mock_controls(session_id,request_id,action,expected_revision,result_revision)
    values(p_session_id,p_request_id,p_action,p_expected_revision,p_expected_revision+1);
  return public.teacher_get_student_focus_session(p_session_id);
end; $$;

create or replace function public.teacher_prepare_literacy_mock_session_v3(p_class_id uuid,p_student_ids uuid[] default '{}',
  p_whole_class boolean default false,p_duration_minutes integer default 20,p_item_count integer default 43,p_request_id text default null,p_window_mode text default 'pause_at_window_end')
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_id uuid; v_saved public.literacy_mock_preparations; v_hash text; v_version text:='literacy-mock-v3';
begin
  perform public.assert_current_actor_teacher_access();
  if p_window_mode is null or p_window_mode not in ('pause_at_window_end','timed_sample') or p_duration_minutes is null or p_duration_minutes not in (10,20,30,40)
    or p_item_count is null or p_item_count not in (24,43) then
    return json_build_object('ok',false,'error','invalid_mock_options'); end if;
  if p_request_id is not null and char_length(p_request_id) not between 1 and 160 then
    return json_build_object('ok',false,'error','invalid_request_id'); end if;
  if p_request_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
    -- The fingerprint contains no recoverable pupil identifiers after deletion.
    v_hash:=encode(sha256(convert_to(jsonb_build_object('classId',p_class_id,'studentIds',p_student_ids,
      'wholeClass',p_whole_class,'minutes',p_duration_minutes,'count',p_item_count,'windowMode',p_window_mode,'version',v_version)::text,'UTF8')),'hex');
    select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
    if found then
      if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
      return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
    end if;
  end if;
  if not exists(select 1 from public.literacy_mock_publications p where p.content_version=v_version and p.available_for_new_sessions
      and p.item_count=(select count(*) from public.literacy_mock_items i where i.content_version=p.content_version)
      and (select count(distinct item->>'domainId') from public.literacy_mock_items i where i.content_version=p.content_version)=8) then
    return json_build_object('ok',false,'error','mock_v3_unavailable'); end if;
  v_result:=public.teacher_start_progress_check_session(p_class_id,p_student_ids,
    jsonb_build_object('*',jsonb_build_object('plan_kind','mock','track_id','all','bank_version',v_version)),120,v_version,p_whole_class)::jsonb;
  if v_result->>'ok'<>'true' then return v_result::json; end if;
  v_id:=(v_result#>>'{session,id}')::uuid;
  insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds,window_mode)
    values(v_id,p_item_count,p_duration_minutes*60,p_duration_minutes*60,p_window_mode);
  if p_request_id is not null then insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id)
    values(auth.uid(),p_request_id,v_hash,v_id); end if;
  return public.teacher_get_student_focus_session(v_id);
end; $$;

create function public.lp_literacy_mock_conditions(p_value jsonb)
returns jsonb language sql immutable set search_path='' as $$
 with source as (select coalesce(p_value->'itemSnapshot',p_value->'questionSnapshot',p_value) s)
 select jsonb_build_object('skillId',coalesce(nullif(p_value->>'skillId',''),s->>'skillId'),
  'domainId',coalesce(nullif(p_value->>'domainId',''),s->>'domainId'),
  'construct',coalesce(nullif(s->>'constructClaim',''),nullif(p_value->>'constructClaim',''),p_value->>'skillId',s->>'skillId'),
  'modality',concat_ws('|',coalesce(nullif(s->>'modality',''),nullif(s->>'literacyModality',''),'recognition'),
    coalesce(s->>'evidenceModality',''),coalesce(s->>'passageAccess',''),case when s->>'oralLanguageAccess'='true' then 'oral_language' else '' end,
    case when s->>'displayPassageDuringResponse'='false' then 'hidden' else 'visible' end),
  'level',coalesce(p_value->'level',s->'level')) from source;
$$;

create function public.lp_literacy_mock_help(p_session_id uuid,p_student_id uuid,p_question_id text)
returns jsonb language sql stable security definer set search_path='' as $$
 with requested as (select max(event_id) id,max(created_at) at from public.literacy_mock_events
   where session_id=p_session_id and student_id=p_student_id and question_id=p_question_id and event_type='help_requested'),
 cancelled as (select max(event_id) id from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and question_id=p_question_id and event_type='help_cancelled'),
 resolved as (select event_id,payload->>'assistance' assistance,created_at from public.literacy_mock_events
   where session_id=p_session_id and student_id=p_student_id and question_id=p_question_id and event_type='support_resolved' order by event_id desc limit 1),
 -- Once answer assistance was observed, a later access-only entry cannot turn
 -- that same first response into independent evidence.
 assistance as (select case when bool_or(payload->>'assistance'='answer') then 'answer'
    when bool_or(payload->>'assistance'='access') then 'access' else 'none' end value
   from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and question_id=p_question_id and event_type='support_resolved')
 select jsonb_build_object('questionId',p_question_id,'helpRequested',requested.id is not null,
   'pending',coalesce(requested.id>greatest(coalesce(resolved.event_id,0),coalesce(cancelled.id,0)),false),'helpCancelled',coalesce(cancelled.id>requested.id,false),'assistanceType',assistance.value,
   'status',case when coalesce(requested.id>greatest(coalesce(resolved.event_id,0),coalesce(cancelled.id,0)),false) then 'pending' when coalesce(cancelled.id>greatest(coalesce(requested.id,0),coalesce(resolved.event_id,0)),false) then 'cancelled' else 'resolved' end,
   'requestedAt',requested.at,'resolvedAt',resolved.created_at)
 from requested cross join assistance cross join cancelled left join resolved on true;
$$;

create function public.lp_literacy_mock_effective_response(p_session_id uuid,p_student_id uuid,p_response jsonb)
returns jsonb language sql stable security definer set search_path='' as $$
 with support as (select public.lp_literacy_mock_help(p_session_id,p_student_id,p_response->>'questionId') h),
 conditions as (select h,coalesce(p_response->>'supportUsed','false')='true' or h->>'assistanceType'='answer' answer_help from support)
 select p_response||jsonb_build_object('helpRequested',(h->>'helpRequested')::boolean,'supportPending',(h->>'pending')::boolean,
   'assistanceType',case when answer_help then 'answer' else h->>'assistanceType' end,
   'accessAssistance',h->>'assistanceType'='access','answerAssistance',answer_help,'supportUsed',answer_help,
   'evidenceType',case when p_response->>'responseStatus'<>'answered' then 'unscored'
    when answer_help then 'supported' when (h->>'pending')::boolean then 'unscored' else 'independent' end) from conditions;
$$;

create or replace function public.lp_literacy_exposures(p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 with prior as (
  select response value from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses||r.media_failures) response where r.student_id=p_student_id
  union all select payload from public.literacy_mock_events where student_id=p_student_id and event_type='presented'
  union all select step from public.student_progress p
   cross join lateral jsonb_path_query(p.payload,'$.**.completions[*]') event
   cross join lateral jsonb_array_elements(case when jsonb_typeof(event->'steps')='array' then event->'steps' else '[]'::jsonb end) step
   where p.student_id=p_student_id and event->>'gameId'='literacy-practice'
 ), identities as (select public.lp_literacy_exposure_identity(value) identity from prior)
 select coalesce(jsonb_agg(distinct identity),'[]'::jsonb) from identities;
$$;

create or replace function public.lp_literacy_response_eligible(p_response jsonb)
returns boolean language sql immutable set search_path='' as $$
 select coalesce(p_response->>'evidenceType'='independent'
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
 select jsonb_build_object('schemaVersion',case when f.content_version='literacy-mock-v3' then 2 else 1 end,
  'contentVersion',f.content_version,'assignmentId',r.session_id,'studentId',r.student_id,'revision',r.revision,
  'plan',r.plan,'planHistory',r.plan_history,'responses',case when f.content_version='literacy-mock-v3' then
   coalesce((select jsonb_agg(public.lp_literacy_mock_effective_response(p_session_id,p_student_id,response) order by position)
    from jsonb_array_elements(r.responses) with ordinality e(response,position)),'[]'::jsonb) else r.responses end,
  'status',r.status,'mediaFailures',r.media_failures,'completedAt',r.completed_at,'updatedAt',r.updated_at,
  'presentationTracking',f.content_version='literacy-mock-v3',
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
 where r.session_id=p_session_id and r.student_id=p_student_id;
$$;

create function public.student_record_literacy_mock_event(p_token text,p_session_id uuid,p_question_id text,p_event text,p_request_id text)
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
 if v_mock->>'content_version'<>'literacy-mock-v3' then return json_build_object('ok',false,'error','unsupported_event_version'); end if;
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
 select item into v_item from public.literacy_mock_items where content_version='literacy-mock-v3' and id=p_question_id;
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

create function public.teacher_resolve_literacy_mock_support(p_session_id uuid,p_student_id uuid,p_question_id text,p_assistance text,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_mock jsonb; v_run public.literacy_mock_runs; v_event public.literacy_mock_events; v_actor text;
begin
 perform public.assert_current_actor_teacher_access();
 perform 1 from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid() for update;
 if not found or not public.lp_literacy_mock_assignment(p_student_id,p_session_id) then return json_build_object('ok',false,'error','session_not_found'); end if;
 if p_assistance is null or p_assistance not in ('none','access','answer') or coalesce(char_length(p_request_id),0) not between 1 and 160 then
  return json_build_object('ok',false,'error','invalid_support'); end if;
 v_mock:=public.lp_literacy_mock_state(p_session_id);
 if v_mock->>'content_version'<>'literacy-mock-v3' then return json_build_object('ok',false,'error','unsupported_event_version'); end if;
 select * into v_run from public.literacy_mock_runs where session_id=p_session_id and student_id=p_student_id for update;
 if not found then return json_build_object('ok',false,'error','run_not_found'); end if;
 v_actor:='teacher:'||auth.uid()::text;
 select * into v_event from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and actor_key=v_actor and request_id=p_request_id;
 if found then
  if v_event.question_id<>p_question_id or v_event.payload->>'assistance'<>p_assistance then return json_build_object('ok',false,'error','request_conflict'); end if;
  return json_build_object('ok',true,'duplicate',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,p_student_id));
 end if;
 if not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id and question_id=p_question_id and event_type='presented') then
  return json_build_object('ok',false,'error','presentation_required'); end if;
 insert into public.literacy_mock_events(session_id,student_id,question_id,actor_key,request_id,event_type,payload)
  values(p_session_id,p_student_id,p_question_id,v_actor,p_request_id,'support_resolved',jsonb_build_object('assistance',p_assistance));
 return json_build_object('ok',true,'mock',v_mock,'run',public.lp_literacy_mock_run_json(p_session_id,p_student_id));
end; $$;

create function public.teacher_prepare_literacy_mock_fresh_check(p_source_session_id uuid,p_student_id uuid,p_question_id text,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_source public.student_focus_sessions; v_item jsonb; v_focus jsonb; v_candidate record; v_ids jsonb:='[]';
 v_item_keys text[]:='{}'; v_stimuli text[]:='{}'; v_families text[]:='{}'; v_item_key text; v_stimulus text; v_family text; v_result jsonb; v_id uuid;
 v_saved public.literacy_mock_preparations; v_hash text; v_count integer;
begin
 perform public.assert_current_actor_teacher_access();
 select * into v_source from public.student_focus_sessions where id=p_source_session_id and teacher_id=auth.uid();
 if not found or not public.lp_literacy_mock_assignment(p_student_id,p_source_session_id) then return json_build_object('ok',false,'error','source_session_not_found'); end if;
 if coalesce(char_length(p_request_id),0) not between 1 and 160 or coalesce(char_length(p_question_id),0) not between 1 and 240 then
  return json_build_object('ok',false,'error','invalid_request_id'); end if;
 perform pg_advisory_xact_lock(hashtextextended('literacy-mock-prepare:'||auth.uid()::text,0));
 v_hash:=encode(sha256(convert_to(jsonb_build_object('sourceSessionId',p_source_session_id,'studentId',p_student_id,'questionId',p_question_id,'kind','fresh_check')::text,'UTF8')),'hex');
 select * into v_saved from public.literacy_mock_preparations where teacher_id=auth.uid() and request_id=p_request_id;
 if found then
  if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
  return (public.teacher_get_student_focus_session(v_saved.session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
 end if;
 if not exists(select 1 from public.literacy_mock_publications p where content_version='literacy-mock-v3' and available_for_new_sessions
  and item_count=(select count(*) from public.literacy_mock_items where content_version=p.content_version)) then
  return json_build_object('ok',false,'error','mock_v3_unavailable'); end if;
 if not exists(select 1 from public.literacy_mock_runs r cross join lateral jsonb_array_elements(r.responses) response
   where r.session_id=p_source_session_id and r.student_id=p_student_id and response->>'questionId'=p_question_id)
  and not exists(select 1 from public.literacy_mock_events where session_id=p_source_session_id and student_id=p_student_id and question_id=p_question_id and event_type='presented') then
  return json_build_object('ok',false,'error','source_question_not_observed'); end if;
 select item into v_item from public.literacy_mock_items where content_version=v_source.content_version and id=p_question_id;
 if v_item is null then return json_build_object('ok',false,'error','source_item_unavailable'); end if;
 v_focus:=public.lp_literacy_mock_conditions(v_item);
 -- Distinct canonical items, stimuli and families remove cosmetic variants.
 for v_candidate in select id,item from public.literacy_mock_items i where content_version='literacy-mock-v3'
  and public.lp_literacy_mock_conditions(item)=v_focus
  and coalesce(item#>>'{itemSnapshot,tutorialOnly}','false')<>'true'
  and coalesce(item#>>'{itemSnapshot,mediaReady}','true')<>'false'
  and not exists(select 1 from public.literacy_mock_items t where t.content_version=i.content_version and t.item#>>'{itemSnapshot,tutorialOnly}'='true'
    and nullif(t.item#>>'{itemSnapshot,stimulusKey}','')=i.item#>>'{itemSnapshot,stimulusKey}')
  and jsonb_array_length(public.lp_literacy_familiarity(p_student_id,item))=0 order by id loop
  v_item_key:=coalesce(nullif(public.lp_literacy_exposure_identity(v_candidate.item)->>'exposureItemId',''),v_candidate.id);
  v_stimulus:=coalesce(nullif(public.lp_literacy_exposure_identity(v_candidate.item)->>'exposurePassageKey',''),v_candidate.id);
  v_family:=nullif(public.lp_literacy_exposure_identity(v_candidate.item)->>'exposureFamilyId','');
  if v_item_key=any(v_item_keys) or v_stimulus=any(v_stimuli) or (v_family is not null and v_family=any(v_families)) then continue; end if;
  v_ids:=v_ids||jsonb_build_array(v_candidate.id); v_item_keys:=array_append(v_item_keys,v_item_key); v_stimuli:=array_append(v_stimuli,v_stimulus);
  if v_family is not null then v_families:=array_append(v_families,v_family); end if;
 end loop;
 v_count:=least(6,jsonb_array_length(v_ids));
 if v_count=0 then return json_build_object('ok',false,'error','fresh_items_unavailable','focus',v_focus); end if;
 v_result:=public.teacher_start_progress_check_session(v_source.class_id,array[p_student_id],
  jsonb_build_object('*',jsonb_build_object('plan_kind','mock','track_id','all','bank_version','literacy-mock-v3')),120,'literacy-mock-v3',false)::jsonb;
 if v_result->>'ok'<>'true' then return v_result::json; end if;
 v_id:=(v_result#>>'{session,id}')::uuid;
 insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds,window_mode,plan_kind,focus,source_session_id,source_question_id,candidate_item_ids)
  values(v_id,v_count,600,600,'pause_at_window_end','fresh_check',v_focus,p_source_session_id,p_question_id,v_ids);
 insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id) values(auth.uid(),p_request_id,v_hash,v_id);
 return public.teacher_get_student_focus_session(v_id);
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
      if v_index>v_count and public.lp_literacy_mock_item_blocked(v_item,v_run.media_failures) then
        return json_build_object('ok',false,'error','blocked_media_item'); end if;
      if v_item#>>'{itemSnapshot,tutorialOnly}'='true' or exists (
        select 1 from public.literacy_mock_items tutorial where tutorial.content_version=v_version
          and tutorial.item#>>'{itemSnapshot,tutorialOnly}'='true'
          and nullif(v_item#>>'{itemSnapshot,stimulusKey}','')=tutorial.item#>>'{itemSnapshot,stimulusKey}') then
        return json_build_object('ok',false,'error','tutorial_item_not_scored'); end if;
      if v_version='literacy-mock-v3' and v_mock->>'plan_kind'='fresh_check' then
        if not (v_mock->'candidate_item_ids' ? v_id) or public.lp_literacy_mock_conditions(v_item)<>v_mock->'focus' then
          return json_build_object('ok',false,'error','invalid_fresh_check_plan'); end if;
        if v_index>v_count and not exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id and question_id=v_id and event_type='presented')
          and jsonb_array_length(public.lp_literacy_familiarity(v_student.id,v_item))>0 then
          return json_build_object('ok',false,'error','fresh_item_exposed'); end if;
      end if;
      if v_version='literacy-mock-v3' and v_run.session_id is null and v_mock->>'plan_kind'='mixed' and (v_item->>'level')::integer<>1 then
        return json_build_object('ok',false,'error','invalid_entry_level'); end if;
      if v_run.session_id is not null then
        select item into v_old_item from public.literacy_mock_items where id=v_run.plan->'itemIds'->>(v_index-1) and content_version=v_version;
        if (v_index<=v_count and to_jsonb(v_id)<>v_run.plan->'itemIds'->(v_index-1))
          or v_item->>'skillId' is distinct from v_old_item->>'skillId' or v_item->>'domainId' is distinct from v_old_item->>'domainId' then
          return json_build_object('ok',false,'error','plan_conflict'); end if;
        if v_version='literacy-mock-v3' and public.lp_literacy_mock_conditions(v_item)-'level' is distinct from public.lp_literacy_mock_conditions(v_old_item)-'level' then
          return json_build_object('ok',false,'error','plan_condition_conflict'); end if;
        if v_version='literacy-mock-v3' and v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1)
          and not public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures)
          and exists(select 1 from public.literacy_mock_events where session_id=p_session_id and student_id=v_student.id
            and question_id=v_old_item->>'id' and event_type='presented') then
          return json_build_object('ok',false,'error','presented_item_frozen'); end if;
        if v_index>v_count and v_id<>v_run.plan->'itemIds'->>(v_index-1) then
          select effective into v_previous from jsonb_array_elements(v_run.responses) with ordinality r(response,position)
            cross join lateral (select case when v_version='literacy-mock-v3'
              then public.lp_literacy_mock_effective_response(p_session_id,v_student.id,response) else response end effective) e
            where response->>'skillId'=v_item->>'skillId' and public.lp_literacy_response_eligible(effective)
              and (v_version<>'literacy-mock-v3' or public.lp_literacy_mock_conditions(effective)-'level'=public.lp_literacy_mock_conditions(v_item)-'level')
            order by position desc limit 1;
          v_expected_level:=case when v_mock->>'plan_kind'='fresh_check' or public.lp_literacy_mock_item_blocked(v_old_item,v_run.media_failures)
            then (v_old_item->>'level')::integer when v_previous is null then case when v_version='literacy-mock-v3' then 1 else (v_old_item->>'level')::integer end
            when (v_previous->>'isCorrect')::boolean then 2 else 1 end;
          if (v_item->>'level')::integer<>v_expected_level then return json_build_object('ok',false,'error','invalid_adaptation'); end if;
        end if;
      end if;
    end loop;
    -- A mixed mock must actually cover every advertised area. No claims are
    -- inferred from an area that a timer prevented the child from reaching.
    if coalesce(v_mock->>'plan_kind','mixed')='mixed' and (select count(distinct i.item->>'domainId') from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version)<>8 then return json_build_object('ok',false,'error','incomplete_domain_plan'); end if;
    if v_version='literacy-mock-v3' and exists(select 1 from jsonb_array_elements_text(p_plan->'itemIds') p(id)
      join public.literacy_mock_items i on i.id=p.id and i.content_version=v_version
      group by coalesce(nullif(i.item#>>'{itemSnapshot,stimulusKey}',''),i.id) having count(*)>1) then
      return json_build_object('ok',false,'error','repeated_stimulus'); end if;
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
    if v_version='literacy-mock-v3' then
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
    v_familiarity:=case when v_version='literacy-mock-v3' then v_presentation->'familiarityReasons' else public.lp_literacy_familiarity(v_student.id,v_item) end;
    v_answer:=p_response||public.lp_literacy_exposure_identity(v_item)||jsonb_build_object('questionId',v_item->>'id','skillId',v_item->>'skillId',
      'domainId',v_item->>'domainId','level',v_item->'level','itemSnapshot',v_item->'itemSnapshot',
      'isCorrect',case when p_response->>'responseStatus'='answered' then public.lp_literacy_mock_normalize_answer(p_response->'selected',v_item->>'answerMode')
        =public.lp_literacy_mock_normalize_answer(v_item->'answer',v_item->>'answerMode') else null end,
      'evidenceType',case when v_valid then 'independent' when p_response->>'responseStatus'='answered' then 'supported' else 'unscored' end,
      'presentationRole','first_probe','administration','rehearsal','presentationVersion','mock-explicit-submit-v1',
      'familiarityReasons',v_familiarity,'knownFamiliar',case when jsonb_array_length(v_familiarity)>0
        then 'true'::jsonb else coalesce(p_response->'knownFamiliar','null'::jsonb) end,'serverReceivedAt',v_now,'occurredAt',v_now);
    if v_version='literacy-mock-v3' then v_answer:=public.lp_literacy_mock_effective_response(p_session_id,v_student.id,v_answer); end if;
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

-- Keep the verified export path and include the complete administration
-- timeline. Aggregate help status alone would lose cancellations and later
-- annotations. Request IDs and private actor keys are operational metadata.
create or replace function public.teacher_export_learner_data(p_student_id uuid,p_requester_role text,p_verification_method text)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_package jsonb;
begin
 v_package:=public.teacher_export_learner_data_before_mock(p_student_id,p_requester_role,p_verification_method);
 return v_package||jsonb_build_object('literacyMockAssessments',coalesce((select jsonb_agg(jsonb_build_object(
  'sessionId',f.id,'classId',f.class_id,'teacherId',f.teacher_id,'preparedAt',f.started_at,
  'state',w.state,'itemCount',w.item_count,'durationSeconds',w.duration_seconds,'windowMode',w.window_mode,
  'planKind',w.plan_kind,'focus',w.focus,'sourceSessionId',w.source_session_id,'sourceQuestionId',w.source_question_id,
  'startedAt',w.started_at,'endedAt',w.ended_at,'endReason',w.end_reason,
  'run',public.lp_literacy_mock_run_json(f.id,p_student_id),
  'administrationEvents',coalesce((select jsonb_agg(jsonb_build_object('eventType',e.event_type,'questionId',e.question_id,
   'actorRole',case when e.actor_key='student' then 'student' else 'teacher' end,'payload',e.payload,'serverReceivedAt',e.created_at)
   order by e.event_id) from public.literacy_mock_events e where e.session_id=f.id and e.student_id=p_student_id),'[]'::jsonb)) order by f.started_at)
  from public.student_focus_sessions f join public.literacy_mock_sessions w on w.session_id=f.id
  join public.student_focus_session_members m on m.session_id=f.id where m.student_id=p_student_id),'[]'::jsonb));
end; $$;

-- All sidecar events cascade with their learner/run deletion and count toward
-- the existing school's learner inactivity retention policy.
create or replace function public.retention_last_learner_activity(p_student_id uuid)
returns timestamptz language sql stable security definer set search_path='' as $$
 select greatest(public.retention_last_learner_activity_before_mock(p_student_id),
  (select max((response->>'serverReceivedAt')::timestamptz) from public.literacy_mock_runs r,
   jsonb_array_elements(r.responses||r.media_failures) response where r.student_id=p_student_id),
  (select max(created_at) from public.literacy_mock_events where student_id=p_student_id));
$$;

revoke all on function public.lp_literacy_mock_conditions(jsonb),public.lp_literacy_mock_help(uuid,uuid,text),
 public.lp_literacy_mock_effective_response(uuid,uuid,jsonb),public.lp_literacy_exposures(uuid),public.lp_literacy_response_eligible(jsonb),
 public.lp_progress_config_valid(jsonb,text),public.lp_literacy_mock_assignment(uuid,uuid),public.lp_literacy_mock_state(uuid),
 public.lp_literacy_mock_run_json(uuid,uuid),public.retention_last_learner_activity(uuid) from public,anon,authenticated;
revoke all on function public.teacher_prepare_literacy_mock_session_v3(uuid,uuid[],boolean,integer,integer,text,text),
 public.teacher_prepare_literacy_mock_fresh_check(uuid,uuid,text,text),public.teacher_resolve_literacy_mock_support(uuid,uuid,text,text,text),
 public.teacher_control_literacy_mock_session(uuid,text,integer,text),public.teacher_export_learner_data(uuid,text,text),
 public.student_record_literacy_mock_event(text,uuid,text,text,text),public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb)
 from public,anon,authenticated;
grant execute on function public.teacher_prepare_literacy_mock_session_v3(uuid,uuid[],boolean,integer,integer,text,text),
 public.teacher_prepare_literacy_mock_fresh_check(uuid,uuid,text,text),public.teacher_resolve_literacy_mock_support(uuid,uuid,text,text,text),
 public.teacher_control_literacy_mock_session(uuid,text,integer,text),public.teacher_export_learner_data(uuid,text,text) to authenticated;
grant execute on function public.student_record_literacy_mock_event(text,uuid,text,text,text),public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
commit;
