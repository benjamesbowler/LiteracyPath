-- Teacher-controlled classroom assessment windows. Mock evidence is isolated
-- from practice, mastery and the official progress-check archive.
begin;

create table public.literacy_mock_sessions (
  session_id uuid primary key references public.student_focus_sessions(id) on delete cascade,
  state text not null default 'prepared' check (state in ('prepared','running','paused','completed')),
  revision integer not null default 0 check (revision >= 0),
  item_count integer not null check (item_count in (24,43)),
  duration_seconds integer not null check (duration_seconds between 600 and 3600),
  remaining_seconds integer not null check (remaining_seconds between 0 and 7200),
  deadline_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  updated_at timestamptz not null default now(),
  check ((state = 'running') = (deadline_at is not null))
);
create table public.literacy_mock_controls (
  session_id uuid not null references public.literacy_mock_sessions(session_id) on delete cascade,
  request_id text not null check (char_length(request_id) between 1 and 160),
  action text not null,
  expected_revision integer not null,
  result_revision integer not null,
  created_at timestamptz not null default now(),
  primary key(session_id,request_id)
);
create table public.literacy_mock_preparations (
  teacher_id uuid not null,
  request_id text not null check(char_length(request_id) between 1 and 160),
  payload_hash text not null,
  session_id uuid not null references public.literacy_mock_sessions(session_id) on delete cascade,
  primary key(teacher_id,request_id)
);
create table public.literacy_mock_runs (
  session_id uuid not null references public.literacy_mock_sessions(session_id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  revision integer not null default 0,
  plan jsonb not null,
  responses jsonb not null default '[]'::jsonb,
  status text not null default 'ready' check (status in ('ready','running','completed')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(session_id,student_id),
  foreign key(session_id,student_id) references public.student_focus_session_members(session_id,student_id) on delete cascade,
  check (jsonb_typeof(plan)='object' and octet_length(plan::text)<=1000000),
  check (jsonb_typeof(responses)='array' and jsonb_array_length(responses)<=50)
);
create table public.literacy_mock_items (
  id text primary key,
  content_version text not null check(content_version='literacy-mock-v1'),
  item jsonb not null
);
create function public.lp_guard_literacy_mock_item() returns trigger language plpgsql set search_path='' as $$
begin
  if new.id is distinct from old.id or new.content_version is distinct from old.content_version or new.item is distinct from old.item then
    raise exception 'Published mock items are immutable; publish a new item identity/version'; end if;
  return new;
end; $$;
create trigger literacy_mock_immutable_items before update on public.literacy_mock_items
  for each row execute function public.lp_guard_literacy_mock_item();
alter table public.literacy_mock_sessions enable row level security;
alter table public.literacy_mock_controls enable row level security;
alter table public.literacy_mock_preparations enable row level security;
alter table public.literacy_mock_runs enable row level security;
alter table public.literacy_mock_items enable row level security;
revoke all on public.literacy_mock_sessions, public.literacy_mock_controls, public.literacy_mock_preparations, public.literacy_mock_runs, public.literacy_mock_items from public,anon,authenticated;

-- Preserve the existing practice and independent-check validator unchanged.
alter function public.lp_progress_config_valid(jsonb,text) rename to lp_progress_config_valid_before_mock;
create function public.lp_progress_config_valid(p_config jsonb,p_version text)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
  if p_config = '{"plan_kind":"mock","track_id":"all","bank_version":"literacy-mock-v1"}'::jsonb
    and p_version='literacy-mock-v1' then return true; end if;
  return public.lp_progress_config_valid_before_mock(p_config,p_version);
end; $$;

-- Every reader/control/save takes the same focus->window lock order. Expiry
-- uses the server clock and closes unanswered items without creating errors.
create function public.lp_literacy_mock_state(p_session_id uuid)
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
  return (to_jsonb(v_mock)-'session_id')||jsonb_build_object('server_now',v_now,
    'remaining_seconds',case when v_mock.state='running' then greatest(0,ceil(extract(epoch from(v_mock.deadline_at-v_now)))::integer)
      else least(v_mock.remaining_seconds,greatest(0,ceil(extract(epoch from(v_focus.expires_at-v_now)))::integer)) end);
end; $$;

alter function public.teacher_get_student_focus_session(uuid) rename to teacher_get_student_focus_session_before_mock;
create function public.teacher_get_student_focus_session(p_session_id uuid default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_mock jsonb;
begin
  v_result:=public.teacher_get_student_focus_session_before_mock(p_session_id)::jsonb;
  if v_result#>>'{session,id}' is not null then
    v_mock:=public.lp_literacy_mock_state((v_result#>>'{session,id}')::uuid);
    if v_mock is not null then
      -- Refresh members if expiry changed their operational status.
      v_result:=public.teacher_get_student_focus_session_before_mock((v_result#>>'{session,id}')::uuid)::jsonb;
      v_result:=jsonb_set(v_result,'{session,mock}',v_mock);
      v_result:=jsonb_set(v_result,'{members}',coalesce((select jsonb_agg(m||jsonb_build_object('mock_run',
        case when r.student_id is null then null else jsonb_build_object('revision',r.revision,'status',r.status,
          'answered_count',jsonb_array_length(r.responses),'completed_at',r.completed_at,'updated_at',r.updated_at) end))
        from jsonb_array_elements(v_result->'members') m left join public.literacy_mock_runs r
          on r.session_id=(v_result#>>'{session,id}')::uuid and r.student_id=(m->>'student_id')::uuid),'[]'::jsonb));
    end if;
  end if;
  return v_result::json;
end; $$;

alter function public.student_get_focus_session(text,text,boolean) rename to student_get_focus_session_before_mock;
create function public.student_get_focus_session(p_token text,p_current_view text default null,p_content_ok boolean default true)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_mock jsonb;
begin
  v_result:=public.student_get_focus_session_before_mock(p_token,p_current_view,p_content_ok)::jsonb;
  if v_result#>>'{session,id}' is not null then
    v_mock:=public.lp_literacy_mock_state((v_result#>>'{session,id}')::uuid);
    if v_mock is not null then v_result:=jsonb_set(v_result,'{session,mock}',v_mock); end if;
  end if;
  return v_result::json;
end; $$;

create function public.teacher_prepare_literacy_mock_session(p_class_id uuid,p_student_ids uuid[] default '{}',
  p_whole_class boolean default false,p_duration_minutes integer default 20,p_item_count integer default 43,p_request_id text default null)
returns json language plpgsql volatile security definer set search_path='' as $$
declare v_result jsonb; v_id uuid; v_saved public.literacy_mock_preparations; v_hash text;
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
  if (select count(distinct item->>'domainId') from public.literacy_mock_items where content_version='literacy-mock-v1')<>8 then
    return json_build_object('ok',false,'error','mock_content_unavailable'); end if;
  v_result:=public.teacher_start_progress_check_session(p_class_id,p_student_ids,
    '{"*":{"plan_kind":"mock","track_id":"all","bank_version":"literacy-mock-v1"}}'::jsonb,120,'literacy-mock-v1',p_whole_class)::jsonb;
  if v_result->>'ok'<>'true' then return v_result::json; end if;
  v_id:=(v_result#>>'{session,id}')::uuid;
  insert into public.literacy_mock_sessions(session_id,item_count,duration_seconds,remaining_seconds)
    values(v_id,p_item_count,p_duration_minutes*60,p_duration_minutes*60);
  if p_request_id is not null then insert into public.literacy_mock_preparations(teacher_id,request_id,payload_hash,session_id)
    values(auth.uid(),p_request_id,v_hash,v_id); end if;
  return public.teacher_get_student_focus_session(v_id);
end; $$;

create function public.teacher_control_literacy_mock_session(p_session_id uuid,p_action text,p_expected_revision integer,p_request_id text)
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

-- Generic completion cannot bypass the mock's authoritative run/timer rules.
alter function public.student_complete_focus_session(text,uuid) rename to student_complete_focus_session_before_mock;
create function public.student_complete_focus_session(p_token text,p_session_id uuid)
returns json language plpgsql volatile security definer set search_path='' as $$
begin
  if exists(select 1 from public.literacy_mock_sessions where session_id=p_session_id) then
    return json_build_object('ok',false,'error','mock_completion_requires_saved_run'); end if;
  return public.student_complete_focus_session_before_mock(p_token,p_session_id);
end; $$;

revoke all on function public.lp_progress_config_valid_before_mock(jsonb,text), public.lp_progress_config_valid(jsonb,text),
  public.lp_guard_literacy_mock_item(), public.lp_literacy_mock_state(uuid), public.teacher_get_student_focus_session_before_mock(uuid),
  public.student_get_focus_session_before_mock(text,text,boolean),public.student_complete_focus_session_before_mock(text,uuid) from public,anon,authenticated;
revoke all on function public.teacher_prepare_literacy_mock_session(uuid,uuid[],boolean,integer,integer,text),
  public.teacher_control_literacy_mock_session(uuid,text,integer,text), public.teacher_get_student_focus_session(uuid),
  public.student_get_focus_session(text,text,boolean), public.student_complete_focus_session(text,uuid) from public,anon,authenticated;
grant execute on function public.teacher_prepare_literacy_mock_session(uuid,uuid[],boolean,integer,integer,text),
  public.teacher_control_literacy_mock_session(uuid,text,integer,text),public.teacher_get_student_focus_session(uuid) to authenticated;
grant execute on function public.student_get_focus_session(text,text,boolean),public.student_complete_focus_session(text,uuid) to anon,authenticated;
notify pgrst,'reload schema';
commit;
