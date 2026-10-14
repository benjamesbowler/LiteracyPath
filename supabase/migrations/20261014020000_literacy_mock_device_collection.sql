begin;

alter table public.student_focus_sessions add column device_receiving_window boolean not null default false;
alter table public.student_focus_sessions drop constraint student_focus_sessions_expiry_check;
alter table public.student_focus_sessions add constraint student_focus_sessions_expiry_check
 check(expires_at>started_at and (expires_at<=started_at+interval '2 hours'
  or (device_receiving_window and target='progress_check' and content_version='literacy-mock-v4'
   and expires_at<=started_at+interval '12 hours')));

alter table public.literacy_mock_sessions
 add column delivery_mode text not null default 'live' check(delivery_mode in ('live','collect')),
 add column collection_id text,
 add column collection_requested_at timestamptz;
alter table public.literacy_mock_runs
 add column offline_lease_id uuid,
 add column offline_lease_expires_at timestamptz,
 add column collection_ack_id text,
 add column collection_ack_at timestamptz;
alter table public.literacy_mock_sessions drop constraint literacy_mock_sessions_window_mode_check;
alter table public.literacy_mock_sessions add constraint literacy_mock_sessions_window_mode_check
 check(window_mode in ('timed_sample','pause_at_window_end','untimed'));
alter table public.literacy_mock_sessions drop constraint literacy_mock_sessions_check;
alter table public.literacy_mock_sessions add constraint literacy_mock_sessions_check
 check((window_mode='untimed' and deadline_at is null)
  or (window_mode<>'untimed' and (state='running')=(deadline_at is not null)));

create table public.literacy_mock_delivery_receipts (
 session_id uuid not null, student_id uuid not null, batch_id text not null,
 payload_hash text not null, receipt jsonb not null, created_at timestamptz not null default now(),
 primary key(session_id,student_id,batch_id),
 foreign key(session_id,student_id) references public.literacy_mock_runs(session_id,student_id) on delete cascade,
 check(char_length(batch_id) between 1 and 160), check(octet_length(receipt::text)<=4000000)
);
alter table public.literacy_mock_delivery_receipts enable row level security;
revoke all on public.literacy_mock_delivery_receipts from public,anon,authenticated;

alter function public.lp_literacy_mock_run_json(uuid,uuid) rename to lp_mock_run_before_delivery;
create function public.lp_literacy_mock_run_json(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select public.lp_mock_run_before_delivery(p_session_id,p_student_id)||jsonb_build_object(
  'offlineLeaseId',r.offline_lease_id,'offlineLeaseExpiresAt',r.offline_lease_expires_at,
  'collectionAckId',r.collection_ack_id,'collectionAckAt',r.collection_ack_at)
 from public.literacy_mock_runs r where r.session_id=p_session_id and r.student_id=p_student_id;
$$;

alter function public.lp_literacy_mock_state(uuid) rename to lp_mock_state_before_delivery;
create function public.lp_literacy_mock_state(p_session_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_mock jsonb; v_pending integer; v_received integer;
begin
 v_mock:=public.lp_mock_state_before_delivery(p_session_id);
 if v_mock is null then return null; end if;
 select count(*) filter(where r.offline_lease_id is not null and r.status<>'completed'
   and r.collection_ack_id is distinct from v_mock->>'collection_id'),
  count(*) filter(where r.offline_lease_id is not null and (r.status='completed' or r.collection_ack_id=v_mock->>'collection_id'))
 into v_pending,v_received from public.literacy_mock_runs r where r.session_id=p_session_id;
 return v_mock||jsonb_build_object('capabilities',coalesce(v_mock->'capabilities','{}'::jsonb)||
  jsonb_build_object('offlineDelivery',v_mock->>'content_version'='literacy-mock-v4' and v_mock->>'window_mode'='untimed'),
  'collection_pending_count',v_pending,'collection_received_count',v_received);
end; $$;

-- Only the original teacher's collection request can finish this session.
-- An untouched pupil has no lease: a device cannot queue scored work before
-- the initial plan and device lease have been confirmed by the server.
create function public.lp_finish_mock_collection(p_session_id uuid)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare v_focus public.student_focus_sessions; v_mock public.literacy_mock_sessions; v_now timestamptz:=clock_timestamp();
begin
 select * into v_focus from public.student_focus_sessions where id=p_session_id for update;
 select * into v_mock from public.literacy_mock_sessions where session_id=p_session_id for update;
 if v_mock.collection_id is null or v_mock.state='completed' or v_focus.status not in ('prepared','active') then return false; end if;
 if exists(select 1 from public.literacy_mock_runs r where r.session_id=p_session_id and r.offline_lease_id is not null
  and r.status<>'completed' and r.collection_ack_id is distinct from v_mock.collection_id) then return false; end if;
 update public.literacy_mock_sessions set state='completed',revision=revision+1,remaining_seconds=0,deadline_at=null,
  ended_at=v_now,end_reason='teacher_collected',updated_at=v_now where session_id=p_session_id;
 update public.literacy_mock_runs set status='completed',completed_at=coalesce(completed_at,v_now),updated_at=v_now where session_id=p_session_id and status<>'completed';
 update public.student_focus_session_members set status='completed',active=false,completed_at=coalesce(completed_at,v_now),updated_at=v_now where session_id=p_session_id;
 update public.student_focus_sessions set status='ended',end_action=coalesce(end_action,'return_home'),ended_at=coalesce(ended_at,v_now),updated_at=v_now where id=p_session_id;
 return true;
end; $$;

alter function public.teacher_prepare_literacy_mock_session_v4(uuid,uuid[],boolean,integer,integer,text,text) rename to lp_mock_prepare_before_delivery;
create function public.teacher_prepare_literacy_mock_session_v4(p_class_id uuid,p_student_ids uuid[] default '{}',
 p_whole_class boolean default false,p_duration_minutes integer default 20,p_item_count integer default 43,p_request_id text default null,p_window_mode text default 'untimed')
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb;
begin
 if p_window_mode not in ('timed_sample','pause_at_window_end','untimed') then return json_build_object('ok',false,'error','invalid_window_mode'); end if;
 v_result:=public.lp_mock_prepare_before_delivery(p_class_id,p_student_ids,p_whole_class,p_duration_minutes,p_item_count,p_request_id,
  case when p_window_mode='untimed' then 'pause_at_window_end' else p_window_mode end)::jsonb;
 if v_result->>'ok'='true' and coalesce((v_result->>'duplicate')::boolean,false)=false then
  update public.literacy_mock_sessions set delivery_mode=case when p_window_mode='untimed' then 'collect' else 'live' end,
   window_mode=p_window_mode where session_id=(v_result#>>'{session,id}')::uuid;
  return public.teacher_get_student_focus_session((v_result#>>'{session,id}')::uuid);
 end if;
 if v_result->>'ok'='true' and v_result#>>'{session,mock,window_mode}' is distinct from p_window_mode then
  return json_build_object('ok',false,'error','request_conflict'); end if;
 return v_result::json;
end; $$;

alter function public.teacher_control_literacy_mock_session(uuid,text,integer,text) rename to lp_mock_control_before_delivery;
create function public.teacher_control_literacy_mock_session(p_session_id uuid,p_action text,p_expected_revision integer,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_focus public.student_focus_sessions; v_mock jsonb; v_saved public.literacy_mock_controls; v_collect boolean; v_result json;
begin
 perform public.assert_current_actor_teacher_access();
 select * into v_focus from public.student_focus_sessions where id=p_session_id and teacher_id=auth.uid() for update;
 if not found then return json_build_object('ok',false,'error','session_not_found'); end if;
 v_collect:=p_action='collect' or (p_action='finish' and exists(select 1 from public.literacy_mock_runs r
  where r.session_id=p_session_id and r.offline_lease_id is not null and r.status<>'completed'));
 if p_action not in ('collect','live_on','live_off') and not v_collect then
  if exists(select 1 from public.literacy_mock_sessions where session_id=p_session_id and window_mode='untimed') then
   update public.literacy_mock_sessions set window_mode='pause_at_window_end',
    deadline_at=case when state='running' then clock_timestamp()+interval '1 hour' else null end where session_id=p_session_id;
   v_result:=public.lp_mock_control_before_delivery(p_session_id,p_action,p_expected_revision,p_request_id);
   update public.literacy_mock_sessions set window_mode='untimed',deadline_at=null where session_id=p_session_id;
   if v_result->>'ok'='true' then return (public.teacher_get_student_focus_session(p_session_id)::jsonb||jsonb_build_object('duplicate',coalesce((v_result->>'duplicate')::boolean,false)))::json; end if;
   return v_result;
  end if;
  return public.lp_mock_control_before_delivery(p_session_id,p_action,p_expected_revision,p_request_id);
 end if;
 if p_expected_revision is null or p_expected_revision<0 or coalesce(char_length(p_request_id),0) not between 1 and 160 then
  return json_build_object('ok',false,'error','invalid_control'); end if;
 v_mock:=public.lp_literacy_mock_state(p_session_id);
 if v_mock is null then return json_build_object('ok',false,'error','mock_not_found'); end if;
 select * into v_saved from public.literacy_mock_controls where session_id=p_session_id and request_id=p_request_id;
 if found then
  if v_saved.action<>p_action or v_saved.expected_revision<>p_expected_revision then return json_build_object('ok',false,'error','request_conflict'); end if;
  perform public.lp_finish_mock_collection(p_session_id);
  return (public.teacher_get_student_focus_session(p_session_id)::jsonb||jsonb_build_object('duplicate',true))::json;
 end if;
 if v_mock->>'content_version'<>'literacy-mock-v4' or v_mock->>'window_mode'<>'untimed' then return json_build_object('ok',false,'error','unsupported_delivery_mode'); end if;
 if v_mock->>'state'='completed' then return json_build_object('ok',false,'error','assessment_finished','mock',v_mock); end if;
 if (v_mock->>'revision')::integer<>p_expected_revision then return json_build_object('ok',false,'error','stale_revision','mock',v_mock); end if;
 if p_expected_revision>=500 then return json_build_object('ok',false,'error','control_limit'); end if;
 if v_mock->>'collection_id' is not null then return json_build_object('ok',false,'error','collection_in_progress','mock',v_mock); end if;
 update public.literacy_mock_sessions set revision=revision+1,
  delivery_mode=case when p_action='live_on' then 'live' when p_action='live_off' then 'collect' else delivery_mode end,
  collection_id=case when v_collect then p_request_id else collection_id end,
  collection_requested_at=case when v_collect then clock_timestamp() else collection_requested_at end,updated_at=clock_timestamp()
  where session_id=p_session_id;
 insert into public.literacy_mock_controls(session_id,request_id,action,expected_revision,result_revision)
  values(p_session_id,p_request_id,p_action,p_expected_revision,p_expected_revision+1);
 if v_collect then perform public.lp_finish_mock_collection(p_session_id); end if;
 return public.teacher_get_student_focus_session(p_session_id);
end; $$;

-- Do not change adaptive prerequisites behind an unfinished device queue.
-- A requested-help question is blocked on the device until its resolution arrives.
-- Unsolicited answer assistance can be recorded after collection/completion;
-- access-only help remains immediate and never changes task demand.
alter function public.teacher_resolve_literacy_mock_support(uuid,uuid,text,text,text) rename to lp_mock_support_before_delivery;
create function public.teacher_resolve_literacy_mock_support(p_session_id uuid,p_student_id uuid,p_question_id text,p_assistance text,p_request_id text)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_run jsonb;
begin
 perform public.assert_current_actor_teacher_access();
 if p_assistance='answer' and exists(select 1 from public.student_focus_sessions f join public.literacy_mock_runs r on r.session_id=f.id
   where f.id=p_session_id and f.teacher_id=auth.uid() and r.student_id=p_student_id
    and r.offline_lease_id is not null and r.status<>'completed' and r.collection_ack_id is null) then
  v_run:=public.lp_literacy_mock_run_json(p_session_id,p_student_id);
  if exists(select 1 from jsonb_array_elements(v_run->'presentations') p where p->>'questionId'=p_question_id)
   and not exists(select 1 from jsonb_array_elements(v_run->'helpRequests') h where h->>'questionId'=p_question_id and h->>'pending'='true') then
   return json_build_object('ok',false,'error','device_data_required_for_answer_assistance');
  end if;
 end if;
 return public.lp_mock_support_before_delivery(p_session_id,p_student_id,p_question_id,p_assistance,p_request_id);
end; $$;

-- No other teacher workflow may discard a device's unfinished leased work.
-- Expiry and learner deletion retain their existing authority.
create function public.lp_guard_mock_device_collection()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status='active' and new.status<>'active' and old.expires_at>clock_timestamp()
  and exists(select 1 from public.literacy_mock_runs r join public.literacy_mock_sessions w on w.session_id=r.session_id
   where r.session_id=old.id and r.offline_lease_id is not null and r.status<>'completed'
   and (w.collection_id is null or r.collection_ack_id is distinct from w.collection_id)) then
  raise exception 'offline_collection_required' using errcode='P0001';
 end if;
 return new;
end; $$;
create trigger literacy_mock_device_collection_guard before update of status on public.student_focus_sessions
 for each row execute function public.lp_guard_mock_device_collection();

create function public.student_sync_literacy_mock_batch(p_token text,p_session_id uuid,p_batch_id text,p_lease_id uuid,
 p_requests jsonb,p_collection_id text default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_student public.students; v_focus public.student_focus_sessions; v_mock jsonb; v_run public.literacy_mock_runs;
 v_saved public.literacy_mock_delivery_receipts; v_hash text; v_request jsonb; v_result jsonb; v_receipt jsonb;
 v_ack jsonb:='[]'; v_error text; v_state text; v_deadline timestamptz;
begin
 v_student:=public.student_from_token(p_token);
 if v_student.id is null then return json_build_object('ok',false,'error','invalid_session'); end if;
 perform 1 from public.students where id=v_student.id for share;
 if not public.lp_literacy_mock_assignment(v_student.id,p_session_id) then return json_build_object('ok',false,'error','assignment_not_found'); end if;
 if coalesce(char_length(p_batch_id),0) not between 1 and 160 or jsonb_typeof(p_requests) is distinct from 'array'
  or jsonb_array_length(p_requests)>512 or octet_length(p_requests::text)>3000000 then return json_build_object('ok',false,'error','invalid_batch'); end if;
 select * into v_focus from public.student_focus_sessions where id=p_session_id for update;
 select * into v_run from public.literacy_mock_runs where session_id=p_session_id and student_id=v_student.id for update;
 if v_run.session_id is null then return json_build_object('ok',false,'error','run_not_registered'); end if;
 v_hash:=md5(jsonb_build_object('lease',p_lease_id,'requests',p_requests,'collection',p_collection_id)::text);
 select * into v_saved from public.literacy_mock_delivery_receipts where session_id=p_session_id and student_id=v_student.id and batch_id=p_batch_id;
 if found then
  if v_saved.payload_hash<>v_hash then return json_build_object('ok',false,'error','request_conflict'); end if;
  return (v_saved.receipt||jsonb_build_object('duplicate',true))::json;
 end if;
 v_mock:=public.lp_literacy_mock_state(p_session_id);
 if v_mock->>'content_version'<>'literacy-mock-v4' or v_mock->>'window_mode'<>'untimed' then return json_build_object('ok',false,'error','unsupported_delivery_mode'); end if;
 if v_focus.status<>'active' or v_focus.expires_at<=clock_timestamp() or v_mock->>'state'='completed' then return json_build_object('ok',false,'error','assessment_finished'); end if;
 if p_lease_id is null then
  if jsonb_array_length(p_requests)<>0 or p_collection_id is not null or v_mock->>'state'<>'running' or v_mock->>'collection_id' is not null
   or v_run.status='completed' then return json_build_object('ok',false,'error','invalid_device_bootstrap'); end if;
  if v_run.offline_lease_id is null then
   -- An untimed device test gets a receiving window bounded to the school day.
   update public.student_focus_sessions set device_receiving_window=true,expires_at=greatest(expires_at,started_at+interval '12 hours') where id=p_session_id returning * into v_focus;
   update public.literacy_mock_runs set offline_lease_id=gen_random_uuid(),offline_lease_expires_at=v_focus.expires_at
    where session_id=p_session_id and student_id=v_student.id returning * into v_run;
  end if;
 else
  if v_run.offline_lease_id is distinct from p_lease_id or v_run.offline_lease_expires_at<=clock_timestamp() then
   return json_build_object('ok',false,'error','invalid_device_lease'); end if;
 end if;
 if p_collection_id is not null and p_collection_id is distinct from v_mock->>'collection_id' then return json_build_object('ok',false,'error','stale_collection'); end if;
 v_state:=v_mock->>'state';
 select deadline_at into v_deadline from public.literacy_mock_sessions where session_id=p_session_id;
 begin
  -- A pause stops new local work when received. Previously authorized queued
  -- answers can drain while paused; the externally visible state is restored
  -- within this same transaction, before a receipt can be returned.
  if v_state='paused' then update public.literacy_mock_sessions set state='running',deadline_at=null where session_id=p_session_id; end if;
  for v_request in select value from jsonb_array_elements(p_requests) loop
   if jsonb_typeof(v_request)<>'object' or coalesce(char_length(v_request->>'requestId'),0) not between 1 and 160 then
    v_error:='invalid_batch_request'; raise exception 'batch_rejected'; end if;
   if v_request->>'type'='event' then
    v_result:=public.student_record_literacy_mock_event(p_token,p_session_id,v_request->>'questionId',v_request->>'event',v_request->>'requestId')::jsonb;
   else
    if v_request->>'expectedRevision' !~ '^[0-9]{1,9}$' then v_error:='invalid_batch_revision'; raise exception 'batch_rejected'; end if;
    v_result:=public.student_save_literacy_mock_run(p_token,p_session_id,v_request->>'requestId',(v_request->>'expectedRevision')::integer,
     nullif(v_request->'plan','null'::jsonb),nullif(v_request->'response','null'::jsonb))::jsonb;
   end if;
   if v_result->>'ok' is distinct from 'true' then v_error:=coalesce(v_result->>'error','batch_rejected'); raise exception 'batch_rejected'; end if;
   v_ack:=v_ack||jsonb_build_array(v_request->>'requestId');
  end loop;
  if v_state='paused' then update public.literacy_mock_sessions set state='paused',deadline_at=v_deadline where session_id=p_session_id; end if;
  if p_collection_id is not null then
   update public.literacy_mock_runs set collection_ack_id=p_collection_id,collection_ack_at=clock_timestamp()
    where session_id=p_session_id and student_id=v_student.id;
  end if;
  perform public.lp_finish_mock_collection(p_session_id);
  v_receipt:=jsonb_build_object('ok',true,'mock',public.lp_literacy_mock_state(p_session_id),
   'run',public.lp_literacy_mock_run_json(p_session_id,v_student.id),'acknowledged',v_ack,'batchId',p_batch_id);
  insert into public.literacy_mock_delivery_receipts(session_id,student_id,batch_id,payload_hash,receipt)
   values(p_session_id,v_student.id,p_batch_id,v_hash,v_receipt);
  return v_receipt::json;
 exception when others then
  return json_build_object('ok',false,'error',coalesce(v_error,'batch_rejected'));
 end;
end; $$;

revoke all on function public.lp_mock_run_before_delivery(uuid,uuid),public.lp_literacy_mock_run_json(uuid,uuid),
 public.lp_mock_state_before_delivery(uuid),public.lp_literacy_mock_state(uuid),public.lp_finish_mock_collection(uuid),
 public.lp_mock_prepare_before_delivery(uuid,uuid[],boolean,integer,integer,text,text),public.lp_mock_control_before_delivery(uuid,text,integer,text),
 public.lp_guard_mock_device_collection(),public.lp_mock_support_before_delivery(uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.teacher_prepare_literacy_mock_session_v4(uuid,uuid[],boolean,integer,integer,text,text),
 public.teacher_control_literacy_mock_session(uuid,text,integer,text),public.teacher_resolve_literacy_mock_support(uuid,uuid,text,text,text),public.student_sync_literacy_mock_batch(text,uuid,text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.teacher_prepare_literacy_mock_session_v4(uuid,uuid[],boolean,integer,integer,text,text),
 public.teacher_control_literacy_mock_session(uuid,text,integer,text),public.teacher_resolve_literacy_mock_support(uuid,uuid,text,text,text) to authenticated;
grant execute on function public.student_sync_literacy_mock_batch(text,uuid,text,uuid,jsonb,text) to anon,authenticated;
commit;
