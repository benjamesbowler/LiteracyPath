-- Class Quest Live: teacher-led presentation responses on student devices.
-- Response evidence is explicitly diagnostic, never automatic mastery.
-- The feature accepts taps and ordered tiles only; it has no media columns.

begin;

create table public.live_lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  cycle_id text not null check (char_length(btrim(cycle_id)) between 1 and 80),
  day_key text not null default '' check (day_key in ('', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  content jsonb not null,
  content_version text not null check (char_length(btrim(content_version)) between 1 and 120),
  slide_count integer not null check (slide_count between 1 and 240),
  current_slide_index integer not null default 0,
  current_prompt_id text,
  status text not null default 'active' check (status in ('active', 'ended')),
  revision bigint not null default 1,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint live_lesson_sessions_slide_range check (
    current_slide_index >= 0 and current_slide_index < slide_count
  ),
  constraint live_lesson_sessions_class_teacher_fk
    foreign key (class_id, teacher_id) references public.classes(id, teacher_id) on delete cascade
);

create unique index live_lesson_one_active_per_teacher_idx
  on public.live_lesson_sessions (teacher_id) where status = 'active';
create index live_lesson_retention_idx
  on public.live_lesson_sessions (ended_at) where status = 'ended';

create table public.live_lesson_participants (
  session_id uuid not null references public.live_lesson_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (session_id, student_id)
);
create index live_lesson_participants_student_idx
  on public.live_lesson_participants (student_id, session_id);

create table public.live_lesson_presence (
  session_id uuid not null,
  student_id uuid not null,
  slide_index integer,
  content_ok boolean not null default true,
  last_seen_at timestamptz not null default now(),
  primary key (session_id, student_id),
  foreign key (session_id, student_id)
    references public.live_lesson_participants(session_id, student_id) on delete cascade,
  check (slide_index is null or slide_index between 0 and 239)
);

create table public.live_lesson_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  student_id uuid not null,
  prompt_id text not null check (char_length(prompt_id) between 1 and 160),
  response jsonb not null check (octet_length(response::text) <= 2048),
  is_correct boolean not null,
  evidence_purpose text not null default 'diagnostic_not_mastery'
    check (evidence_purpose = 'diagnostic_not_mastery'),
  client_event_id text not null check (char_length(client_event_id) between 1 and 120),
  created_at timestamptz not null default now(),
  foreign key (session_id, student_id)
    references public.live_lesson_participants(session_id, student_id) on delete cascade,
  unique (session_id, student_id, prompt_id),
  unique (session_id, client_event_id)
);
create index live_lesson_responses_student_idx
  on public.live_lesson_responses (student_id, created_at);

alter table public.live_lesson_sessions enable row level security;
alter table public.live_lesson_participants enable row level security;
alter table public.live_lesson_presence enable row level security;
alter table public.live_lesson_responses enable row level security;

revoke all on public.live_lesson_sessions, public.live_lesson_participants,
  public.live_lesson_presence, public.live_lesson_responses
  from public, anon, authenticated;

create or replace function public.teacher_start_live_lesson(
  p_class_id uuid,
  p_student_ids uuid[],
  p_cycle_id text,
  p_day_key text,
  p_content jsonb,
  p_content_version text
)
returns json language plpgsql volatile security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.live_lesson_sessions;
  v_invalid uuid;
  v_busy uuid;
  v_slide_count integer;
begin
  perform public.assert_current_actor_teacher_access();
  v_slide_count := case when jsonb_typeof(p_content -> 'slideCount') = 'number'
    then (p_content ->> 'slideCount')::integer else 0 end;
  if p_class_id is null
    or coalesce(cardinality(p_student_ids), 0) not between 1 and 40
    or (select count(distinct value) from unnest(p_student_ids) value) <> cardinality(p_student_ids)
    or nullif(btrim(coalesce(p_cycle_id, '')), '') is null
    or coalesce(p_day_key, '') not in ('', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday')
    or jsonb_typeof(p_content) <> 'object'
    or jsonb_typeof(p_content -> 'prompts') <> 'array'
    or octet_length(p_content::text) > 131072
    or coalesce((p_content ->> 'schemaVersion')::integer, 0) <> 1
    or coalesce(p_content ->> 'cycleId', '') <> p_cycle_id
    or coalesce(p_content ->> 'day', '') <> coalesce(p_day_key, '')
    or v_slide_count not between 1 and 240
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or p_content_version <> p_content ->> 'contentVersion'
    or exists (
      select 1 from jsonb_array_elements(p_content -> 'prompts') prompt
      where jsonb_typeof(prompt) <> 'object'
        or coalesce(prompt ->> 'kind', '') not in ('grapheme_choice', 'word_choice', 'arrange_tiles')
        or coalesce(prompt ->> 'evidencePurpose', '') <> 'diagnostic_not_mastery'
        or coalesce((prompt ->> 'slideIndex')::integer, -1) not between 0 and v_slide_count - 1
        or nullif(prompt ->> 'id', '') is null
        or nullif(prompt ->> 'answer', '') is null
    )
  then return json_build_object('ok', false, 'error', 'invalid_payload'); end if;

  if not exists (select 1 from public.classes where id = p_class_id and teacher_id = v_actor) then
    return json_build_object('ok', false, 'error', 'class_not_found');
  end if;

  perform 1 from public.students where id = any(p_student_ids) order by id for update;
  select requested.id into v_invalid
  from unnest(p_student_ids) requested(id)
  left join public.students student on student.id = requested.id
    and student.class_id = p_class_id and student.teacher_id = v_actor
    and student.archived_at is null
  where student.id is null limit 1;
  if v_invalid is not null then
    return json_build_object('ok', false, 'error', 'student_not_in_class', 'student_id', v_invalid);
  end if;

  update public.live_lesson_sessions set status = 'ended', ended_at = now(), updated_at = now(), revision = revision + 1
    where status = 'active' and updated_at < now() - interval '90 minutes';

  select requested.id into v_busy
  from unnest(p_student_ids) requested(id)
  where exists (
    select 1 from public.live_lesson_participants participant
    join public.live_lesson_sessions session on session.id = participant.session_id
    where participant.student_id = requested.id and session.status = 'active' and session.teacher_id <> v_actor
  ) or exists (
    select 1 from public.reading_sessions reading
    where reading.status = 'active' and requested.id = any(reading.student_ids)
  ) limit 1;
  if v_busy is not null then
    return json_build_object('ok', false, 'error', 'student_busy', 'student_id', v_busy);
  end if;

  update public.live_lesson_sessions set status = 'ended', ended_at = now(), updated_at = now(), revision = revision + 1
    where teacher_id = v_actor and status = 'active';

  insert into public.live_lesson_sessions (
    teacher_id, class_id, cycle_id, day_key, content, content_version, slide_count
  ) values (
    v_actor, p_class_id, btrim(p_cycle_id), coalesce(p_day_key, ''), p_content,
    btrim(p_content_version), v_slide_count
  ) returning * into v_session;
  insert into public.live_lesson_participants(session_id, student_id)
    select v_session.id, id from unnest(p_student_ids) member(id);

  return json_build_object('ok', true, 'session', json_build_object(
    'id', v_session.id, 'class_id', v_session.class_id, 'cycle_id', v_session.cycle_id,
    'day_key', v_session.day_key, 'student_ids', p_student_ids,
    'slide_count', v_session.slide_count, 'current_slide_index', 0,
    'current_prompt_id', null, 'content_version', v_session.content_version,
    'status', v_session.status, 'revision', v_session.revision,
    'started_at', v_session.started_at, 'updated_at', v_session.updated_at
  ));
exception when unique_violation then
  return json_build_object('ok', false, 'error', 'session_conflict');
end;
$$;

create or replace function public.teacher_set_live_lesson_slide(
  p_session_id uuid, p_slide_index integer, p_client_event_id text
)
returns json language plpgsql volatile security definer set search_path = public
as $$
declare v_session public.live_lesson_sessions; v_prompt_id text;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_session from public.live_lesson_sessions
    where id = p_session_id and teacher_id = auth.uid() for update;
  if v_session.id is null then return json_build_object('ok', false, 'error', 'session_not_found'); end if;
  if v_session.status <> 'active' or v_session.updated_at < now() - interval '90 minutes' then
    update public.live_lesson_sessions set status='ended', ended_at=coalesce(ended_at,now()), updated_at=now(), revision=revision+1 where id=v_session.id;
    return json_build_object('ok', false, 'error', 'session_ended');
  end if;
  if p_slide_index is null or p_slide_index < 0 or p_slide_index >= v_session.slide_count
    or nullif(btrim(coalesce(p_client_event_id, '')), '') is null or char_length(p_client_event_id) > 120
  then return json_build_object('ok', false, 'error', 'invalid_payload'); end if;
  select prompt ->> 'id' into v_prompt_id
  from jsonb_array_elements(v_session.content -> 'prompts') prompt
  where (prompt ->> 'slideIndex')::integer = p_slide_index limit 1;
  update public.live_lesson_sessions set current_slide_index=p_slide_index,
    current_prompt_id=v_prompt_id, updated_at=now(), revision=revision+1 where id=v_session.id
    returning * into v_session;
  return json_build_object('ok', true, 'current_slide_index', p_slide_index,
    'current_prompt_id', v_prompt_id, 'revision', v_session.revision, 'updated_at', v_session.updated_at);
end;
$$;

create or replace function public.teacher_get_live_lesson_snapshot(p_session_id uuid)
returns json language plpgsql stable security definer set search_path = public
as $$
declare v_session public.live_lesson_sessions; v_students json;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_session from public.live_lesson_sessions where id=p_session_id and teacher_id=auth.uid();
  if v_session.id is null then return json_build_object('ok', false, 'error', 'session_not_found'); end if;
  select coalesce(json_agg(json_build_object(
    'student_id', participant.student_id,
    'connected', coalesce(presence.last_seen_at > now() - interval '6 seconds', false),
    'content_ok', coalesce(presence.content_ok, true),
    'slide_index', presence.slide_index,
    'last_seen_at', presence.last_seen_at,
    'responded', response.id is not null,
    'is_correct', response.is_correct,
    'responded_at', response.created_at
  ) order by student.name), '[]'::json) into v_students
  from public.live_lesson_participants participant
  join public.students student on student.id=participant.student_id
  left join public.live_lesson_presence presence on presence.session_id=participant.session_id and presence.student_id=participant.student_id
  left join public.live_lesson_responses response on response.session_id=participant.session_id
    and response.student_id=participant.student_id and response.prompt_id=v_session.current_prompt_id
  where participant.session_id=v_session.id;
  return json_build_object('ok', true, 'session', json_build_object(
    'id',v_session.id,'status',v_session.status,'current_slide_index',v_session.current_slide_index,
    'current_prompt_id',v_session.current_prompt_id,'revision',v_session.revision,'updated_at',v_session.updated_at
  ), 'students', v_students);
end;
$$;

create or replace function public.teacher_get_active_live_lesson()
returns json language plpgsql stable security definer set search_path = public
as $$
declare v_session public.live_lesson_sessions; v_student_ids uuid[];
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_session from public.live_lesson_sessions
    where teacher_id=auth.uid() and status='active' and updated_at>=now()-interval '90 minutes'
    order by started_at desc limit 1;
  if v_session.id is null then return json_build_object('ok', true, 'session', null); end if;
  select array_agg(student_id order by student_id) into v_student_ids
    from public.live_lesson_participants where session_id=v_session.id;
  return json_build_object('ok', true, 'session', json_build_object(
    'id',v_session.id,'class_id',v_session.class_id,'cycle_id',v_session.cycle_id,
    'day_key',v_session.day_key,'student_ids',coalesce(v_student_ids,'{}'::uuid[]),
    'slide_count',v_session.slide_count,'current_slide_index',v_session.current_slide_index,
    'current_prompt_id',v_session.current_prompt_id,'content_version',v_session.content_version,
    'status',v_session.status,'revision',v_session.revision,'started_at',v_session.started_at,
    'updated_at',v_session.updated_at
  ));
end;
$$;

create or replace function public.teacher_end_live_lesson(p_session_id uuid)
returns json language plpgsql volatile security definer set search_path = public
as $$
declare v_session public.live_lesson_sessions;
begin
  perform public.assert_current_actor_teacher_access();
  update public.live_lesson_sessions set status='ended', ended_at=coalesce(ended_at,now()),
    updated_at=case when status='active' then now() else updated_at end, revision=revision+1
    where id=p_session_id and teacher_id=auth.uid() returning * into v_session;
  if v_session.id is null then return json_build_object('ok', false, 'error', 'session_not_found'); end if;
  return json_build_object('ok', true, 'status', v_session.status, 'ended_at', v_session.ended_at);
end;
$$;

create or replace function public.student_get_live_lesson(
  p_token text, p_slide_index integer default null, p_content_ok boolean default true
)
returns json language plpgsql volatile security definer set search_path = public
as $$
declare v_student public.students; v_session public.live_lesson_sessions; v_prompt jsonb; v_safe_prompt jsonb;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok', false, 'error', 'invalid_session'); end if;
  select session.* into v_session from public.live_lesson_sessions session
  join public.live_lesson_participants participant on participant.session_id=session.id
  where participant.student_id=v_student.id and session.status='active'
    and session.updated_at >= now() - interval '90 minutes'
  order by session.started_at desc limit 1;
  if v_session.id is null then return json_build_object('ok', true, 'session', null); end if;
  if p_slide_index is not null and (p_slide_index < 0 or p_slide_index >= v_session.slide_count) then
    return json_build_object('ok', false, 'error', 'invalid_slide_index');
  end if;
  insert into public.live_lesson_presence(session_id,student_id,slide_index,content_ok,last_seen_at)
    values(v_session.id,v_student.id,p_slide_index,coalesce(p_content_ok,true),now())
    on conflict(session_id,student_id) do update set slide_index=excluded.slide_index,
      content_ok=excluded.content_ok,last_seen_at=excluded.last_seen_at;
  if v_session.current_prompt_id is not null then
    select prompt into v_prompt from jsonb_array_elements(v_session.content -> 'prompts') prompt
      where prompt ->> 'id'=v_session.current_prompt_id limit 1;
    v_safe_prompt := v_prompt - 'answer';
  end if;
  return json_build_object('ok', true, 'session', json_build_object(
    'id',v_session.id,'cycle_id',v_session.cycle_id,'day_key',v_session.day_key,
    'slide_count',v_session.slide_count,'current_slide_index',v_session.current_slide_index,
    'content_version',v_session.content_version,'status',v_session.status,'revision',v_session.revision,
    'prompt',v_safe_prompt,'updated_at',v_session.updated_at
  ));
end;
$$;

create or replace function public.student_submit_live_response(
  p_token text, p_session_id uuid, p_prompt_id text, p_response jsonb, p_client_event_id text
)
returns json language plpgsql volatile security definer set search_path = public
as $$
declare v_student public.students; v_session public.live_lesson_sessions; v_prompt jsonb; v_answer text; v_value text; v_correct boolean;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then return json_build_object('ok', false, 'error', 'invalid_session'); end if;
  if p_response is null or jsonb_typeof(p_response) not in ('string','array') or octet_length(p_response::text)>2048
    or nullif(btrim(coalesce(p_client_event_id,'')),'') is null or char_length(p_client_event_id)>120
  then return json_build_object('ok', false, 'error', 'invalid_payload'); end if;
  select session.* into v_session from public.live_lesson_sessions session
  join public.live_lesson_participants participant on participant.session_id=session.id and participant.student_id=v_student.id
  where session.id=p_session_id for update;
  if v_session.id is null then return json_build_object('ok', false, 'error', 'session_not_found'); end if;
  if v_session.status<>'active' or v_session.updated_at<now()-interval '90 minutes' then return json_build_object('ok', false, 'error', 'session_ended'); end if;
  if v_session.current_prompt_id is distinct from p_prompt_id then return json_build_object('ok', false, 'error', 'prompt_changed'); end if;
  select prompt into v_prompt from jsonb_array_elements(v_session.content -> 'prompts') prompt where prompt ->> 'id'=p_prompt_id limit 1;
  if v_prompt is null then return json_build_object('ok', false, 'error', 'prompt_not_found'); end if;
  v_answer := lower(v_prompt ->> 'answer');
  if jsonb_typeof(p_response)='array' then
    select string_agg(value,'') into v_value from jsonb_array_elements_text(p_response) value;
  else v_value := p_response #>> '{}'; end if;
  v_correct := lower(coalesce(v_value,''))=v_answer;
  insert into public.live_lesson_responses(session_id,student_id,prompt_id,response,is_correct,client_event_id)
    values(v_session.id,v_student.id,p_prompt_id,p_response,v_correct,p_client_event_id)
    on conflict(session_id,student_id,prompt_id) do nothing;
  return json_build_object('ok', true, 'submitted', true);
exception when unique_violation then return json_build_object('ok', true, 'submitted', true, 'duplicate', true);
end;
$$;

revoke all on function public.teacher_start_live_lesson(uuid,uuid[],text,text,jsonb,text),
  public.teacher_set_live_lesson_slide(uuid,integer,text),
  public.teacher_get_live_lesson_snapshot(uuid), public.teacher_get_active_live_lesson(),
  public.teacher_end_live_lesson(uuid),
  public.student_get_live_lesson(text,integer,boolean),
  public.student_submit_live_response(text,uuid,text,jsonb,text)
  from public;
grant execute on function public.teacher_start_live_lesson(uuid,uuid[],text,text,jsonb,text),
  public.teacher_set_live_lesson_slide(uuid,integer,text),
  public.teacher_get_live_lesson_snapshot(uuid), public.teacher_get_active_live_lesson(),
  public.teacher_end_live_lesson(uuid)
  to authenticated;
grant execute on function public.student_get_live_lesson(text,integer,boolean),
  public.student_submit_live_response(text,uuid,text,jsonb,text)
  to anon, authenticated;

-- Keep the established unified learner export, adding live-lesson evidence
-- without copying the large existing package builder into a second source.
alter function public.teacher_export_learner_data(uuid, text, text)
  rename to teacher_export_learner_data_without_live_lessons;
revoke all on function public.teacher_export_learner_data_without_live_lessons(uuid, text, text)
  from public, anon, authenticated;

create function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb language plpgsql volatile security definer set search_path = public
as $$
declare v_package jsonb;
begin
  v_package := public.teacher_export_learner_data_without_live_lessons(
    p_student_id, p_requester_role, p_verification_method
  );
  return v_package || jsonb_build_object(
    'liveLessonParticipation', coalesce((
      select jsonb_agg(jsonb_build_object(
        'sessionId', session.id,
        'cycleId', session.cycle_id,
        'day', session.day_key,
        'contentVersion', session.content_version,
        'status', session.status,
        'startedAt', session.started_at,
        'endedAt', session.ended_at
      ) order by session.started_at)
      from public.live_lesson_participants participant
      join public.live_lesson_sessions session on session.id = participant.session_id
      where participant.student_id = p_student_id
    ), '[]'::jsonb),
    'liveLessonResponses', coalesce((
      select jsonb_agg(to_jsonb(live_response) order by live_response.created_at, live_response.id)
      from public.live_lesson_responses live_response
      where live_response.student_id = p_student_id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;

comment on table public.live_lesson_responses is
  'Private diagnostic classroom response evidence. Never an automatic mastery source.';

commit;
