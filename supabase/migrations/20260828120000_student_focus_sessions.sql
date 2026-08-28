-- Teacher-controlled student sessions for child iPads.
--
-- These records are operational, not assessment evidence. A student receives
-- only the active assignment bound to their opaque login token. Formal Skills
-- Assessment evidence crosses separate, assignment-scoped RPCs below; browser
-- roles never receive direct write access to the session or presence tables.

begin;

create table public.student_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  target text not null check (target in ('reading_library', 'letters_practice', 'skills_assessment')),
  content_version text not null check (char_length(btrim(content_version)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint student_focus_sessions_expiry_check check (
    expires_at > started_at and expires_at <= started_at + interval '2 hours'
  ),
  constraint student_focus_sessions_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade
);

create unique index student_focus_sessions_one_active_per_teacher_idx
  on public.student_focus_sessions (teacher_id)
  where status = 'active';

create index student_focus_sessions_retention_idx
  on public.student_focus_sessions (ended_at)
  where status = 'ended';

create table public.student_focus_session_members (
  session_id uuid not null references public.student_focus_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  resolved_config jsonb not null default '{}'::jsonb,
  status text not null default 'assigned' check (status in ('assigned', 'active', 'completed', 'needs_attention')),
  active boolean not null default true,
  current_view text,
  content_ok boolean not null default true,
  last_seen_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (session_id, student_id),
  check (jsonb_typeof(resolved_config) = 'object'),
  check (octet_length(resolved_config::text) <= 4096),
  check (current_view is null or char_length(current_view) <= 80)
);

create unique index student_focus_members_one_active_session_idx
  on public.student_focus_session_members (student_id)
  where active;

create index student_focus_members_session_status_idx
  on public.student_focus_session_members (session_id, status, last_seen_at);

alter table public.student_focus_sessions enable row level security;
alter table public.student_focus_session_members enable row level security;

revoke all on table public.student_focus_sessions, public.student_focus_session_members
  from public, anon, authenticated;

-- Both tables are RPC-only. Membership contains per-child assignment state,
-- and the teacher polling RPC returns only the current teacher's session.

create or replace function public.end_expired_student_focus_sessions()
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  update public.student_focus_session_members member
     set active = false,
         updated_at = now()
    from public.student_focus_sessions session
   where member.session_id = session.id
     and member.active
     and session.status = 'active'
     and session.expires_at <= now();

  update public.student_focus_sessions
     set status = 'ended',
         ended_at = coalesce(ended_at, now()),
         updated_at = now()
   where status = 'active'
     and expires_at <= now();
end;
$$;

create or replace function public.teacher_start_student_focus_session(
  p_class_id uuid,
  p_target text,
  p_student_ids uuid[],
  p_assignments jsonb default '{}'::jsonb,
  p_duration_minutes integer default 60,
  p_content_version text default 'unknown'
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.student_focus_sessions;
  v_student_id uuid;
  v_invalid_student uuid;
  v_busy_student uuid;
  v_config jsonb;
  v_members json;
begin
  perform public.assert_current_actor_teacher_access();

  if p_class_id is null
    or p_target not in ('reading_library', 'letters_practice', 'skills_assessment')
    or coalesce(cardinality(p_student_ids), 0) not between 1 and 200
    or (select count(distinct id) from unnest(p_student_ids) requested(id)) <> cardinality(p_student_ids)
    or p_assignments is null
    or jsonb_typeof(p_assignments) <> 'object'
    or octet_length(p_assignments::text) > 1000000
    or p_duration_minutes not between 5 and 120
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or char_length(btrim(p_content_version)) > 120
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  if not exists (
    select 1 from public.classes class
    where class.id = p_class_id and class.teacher_id = v_actor
  ) then
    return json_build_object('ok', false, 'error', 'class_not_found');
  end if;

  perform 1
  from public.students student
  where student.id = any(p_student_ids)
  order by student.id
  for update;

  select requested.id into v_invalid_student
  from unnest(p_student_ids) requested(id)
  left join public.students student
    on student.id = requested.id
   and student.class_id = p_class_id
   and student.teacher_id = v_actor
   and student.archived_at is null
  where student.id is null
  limit 1;

  if v_invalid_student is not null then
    return json_build_object('ok', false, 'error', 'student_not_in_class', 'student_id', v_invalid_student);
  end if;

  if p_target = 'skills_assessment' then
    foreach v_student_id in array p_student_ids loop
      v_config := p_assignments -> v_student_id::text;
      if v_config is null
        or jsonb_typeof(v_config) <> 'object'
        or nullif(btrim(coalesce(v_config ->> 'skill_id', '')), '') is null
        or char_length(v_config ->> 'skill_id') > 120
        or nullif(btrim(coalesce(v_config ->> 'skill_label', '')), '') is null
        or char_length(v_config ->> 'skill_label') > 160
        or coalesce((v_config ->> 'skill_index')::integer, -1) not between 0 and 100
        or coalesce((v_config ->> 'level')::integer, -1) not between 1 and 2
        or coalesce((v_config ->> 'phase')::integer, -1) not between 1 and 2
      then
        return json_build_object('ok', false, 'error', 'invalid_assessment_assignment', 'student_id', v_student_id);
      end if;
    end loop;
  elsif p_assignments <> '{}'::jsonb then
    return json_build_object('ok', false, 'error', 'unexpected_assignments');
  end if;

  perform public.end_expired_student_focus_sessions();

  select requested.id into v_busy_student
  from unnest(p_student_ids) requested(id)
  join public.student_focus_session_members member
    on member.student_id = requested.id and member.active
  join public.student_focus_sessions session
    on session.id = member.session_id
   and session.status = 'active'
   and session.expires_at > now()
   and session.teacher_id <> v_actor
  limit 1;

  if v_busy_student is not null then
    return json_build_object('ok', false, 'error', 'student_busy', 'student_id', v_busy_student);
  end if;

  select requested.id into v_busy_student
  from unnest(p_student_ids) requested(id)
  join public.reading_sessions reading
    on requested.id = any(reading.student_ids)
   and reading.status = 'active'
   and reading.updated_at >= now() - interval '90 minutes'
  limit 1;

  if v_busy_student is not null then
    return json_build_object('ok', false, 'error', 'student_busy', 'student_id', v_busy_student);
  end if;

  -- Conflict validation happens before replacement, so a failed launch does
  -- not silently end the teacher's current session.
  update public.student_focus_session_members member
     set active = false, updated_at = now()
    from public.student_focus_sessions session
   where member.session_id = session.id
     and session.teacher_id = v_actor
     and session.status = 'active';

  update public.student_focus_sessions
     set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
   where teacher_id = v_actor and status = 'active';

  insert into public.student_focus_sessions (
    teacher_id, class_id, target, content_version, expires_at
  ) values (
    v_actor,
    p_class_id,
    p_target,
    btrim(p_content_version),
    now() + make_interval(mins => p_duration_minutes)
  ) returning * into v_session;

  insert into public.student_focus_session_members (
    session_id, student_id, resolved_config
  )
  select
    v_session.id,
    requested.id,
    case when p_target = 'skills_assessment'
      then p_assignments -> requested.id::text
      else '{}'::jsonb
    end
  from unnest(p_student_ids) requested(id);

  select coalesce(json_agg(json_build_object(
    'student_id', member.student_id,
    'status', member.status,
    'connected', false,
    'content_ok', member.content_ok,
    'resolved_config', member.resolved_config
  ) order by student.name), '[]'::json)
  into v_members
  from public.student_focus_session_members member
  join public.students student on student.id = member.student_id
  where member.session_id = v_session.id;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id,
      'teacher_id', v_session.teacher_id,
      'class_id', v_session.class_id,
      'target', v_session.target,
      'content_version', v_session.content_version,
      'status', v_session.status,
      'started_at', v_session.started_at,
      'expires_at', v_session.expires_at,
      'updated_at', v_session.updated_at,
      'members', v_members
    )
  );
exception
  when unique_violation then
    return json_build_object('ok', false, 'error', 'session_conflict');
  when invalid_text_representation then
    return json_build_object('ok', false, 'error', 'invalid_assessment_assignment');
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
    and session.status = 'active'
    and session.expires_at > now()
    and (p_session_id is null or session.id = p_session_id)
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
    'resolved_config', member.resolved_config
  ) order by student.name), '[]'::json)
  into v_members
  from public.student_focus_session_members member
  join public.students student on student.id = member.student_id
  where member.session_id = v_session.id;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id,
      'teacher_id', v_session.teacher_id,
      'class_id', v_session.class_id,
      'target', v_session.target,
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

create or replace function public.teacher_end_student_focus_session(p_session_id uuid)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_session public.student_focus_sessions;
begin
  perform public.assert_current_actor_teacher_access();

  select * into v_session
  from public.student_focus_sessions
  where id = p_session_id and teacher_id = auth.uid()
  for update;

  if v_session.id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  update public.student_focus_session_members
     set active = false, updated_at = now()
   where session_id = v_session.id and active;

  update public.student_focus_sessions
     set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
   where id = v_session.id;

  return json_build_object('ok', true, 'status', 'ended', 'ended_at', now());
end;
$$;

create or replace function public.student_get_focus_session(
  p_token text,
  p_current_view text default null,
  p_content_ok boolean default true
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_attempts json := '[]'::json;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_current_view is not null and char_length(p_current_view) > 80 then
    return json_build_object('ok', false, 'error', 'invalid_view');
  end if;

  perform public.end_expired_student_focus_sessions();

  select member.* into v_member
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where member.student_id = v_student.id
    and member.active
    and session.status = 'active'
    and session.expires_at > now()
  order by session.started_at desc
  limit 1;

  if v_member.session_id is null then
    return json_build_object('ok', true, 'session', null);
  end if;

  select * into v_session
  from public.student_focus_sessions
  where id = v_member.session_id;

  update public.student_focus_session_members
     set status = case when status = 'assigned' then 'active' else status end,
         current_view = nullif(btrim(coalesce(p_current_view, '')), ''),
         content_ok = coalesce(p_content_ok, true),
         last_seen_at = now(),
         updated_at = now()
   where session_id = v_session.id and student_id = v_student.id;

  if v_session.target = 'skills_assessment' then
    select coalesce(json_agg(json_build_object(
      'attemptId', recent.attempt_id,
      'skillId', recent.skill_id,
      'skillName', recent.skill_name,
      'skillLevel', recent.skill_level,
      'skillPhase', recent.skill_phase,
      'completedAt', recent.completed_at,
      'totalQuestions', recent.total_questions,
      'questionRecords', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'questionId', question ->> 'questionId',
          'questionSignature', question ->> 'questionSignature',
          'promptAnswerSignature', question ->> 'promptAnswerSignature',
          'optionSetSignature', question ->> 'optionSetSignature',
          'targetWord', question ->> 'targetWord',
          'targetLetter', question ->> 'targetLetter',
          'targetSound', question ->> 'targetSound',
          'targetPattern', question ->> 'targetPattern',
          'itemKey', question ->> 'itemKey',
          'itemType', question ->> 'itemType',
          'templateType', question ->> 'templateType',
          'level', question -> 'level',
          'phase', question -> 'phase',
          'responseStatus', question ->> 'responseStatus',
          'isCorrect', question -> 'isCorrect',
          'supported', question -> 'supported',
          'prompted', question -> 'prompted',
          'timestamp', question ->> 'timestamp'
        )), '[]'::jsonb)
        from jsonb_array_elements(
          case when jsonb_typeof(recent.payload -> 'questionRecords') = 'array'
            then recent.payload -> 'questionRecords'
            else '[]'::jsonb
          end
        ) question
      )
    ) order by recent.completed_at), '[]'::json)
      into v_attempts
    from (
      select
        attempt.attempt_id,
        attempt.skill_id,
        attempt.skill_name,
        attempt.skill_level,
        attempt.skill_phase,
        attempt.completed_at,
        attempt.total_questions,
        attempt.payload
      from public.assessment_attempts attempt
      where attempt.teacher_id = v_session.teacher_id
        and attempt.student_id = v_student.id::text
        and attempt.skill_id = v_member.resolved_config ->> 'skill_id'
        and attempt.administration_status = 'completed'
      order by attempt.completed_at desc
      limit 50
    ) recent;
  end if;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id,
      'teacher_id', v_session.teacher_id,
      'class_id', v_session.class_id,
      'target', v_session.target,
      'content_version', v_session.content_version,
      'status', v_session.status,
      'started_at', v_session.started_at,
      'expires_at', v_session.expires_at,
      'resolved_config', v_member.resolved_config,
      'member_status', v_member.status,
      'content_ok', coalesce(p_content_ok, true),
      'prior_attempts', v_attempts
    )
  );
end;
$$;

create or replace function public.student_complete_focus_session(p_token text, p_session_id uuid)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;

  update public.student_focus_session_members member
     set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
    from public.student_focus_sessions session
   where member.session_id = p_session_id
     and member.student_id = v_student.id
     and member.active
     and session.id = member.session_id
     and session.status = 'active'
     and session.expires_at > now();

  if not found then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;
  return json_build_object('ok', true, 'status', 'completed', 'completed_at', now());
end;
$$;

create or replace function public.student_save_focus_assessment_answer(
  p_token text,
  p_session_id uuid,
  p_answer jsonb
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_inserted integer := 0;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_answer is null
    or jsonb_typeof(p_answer) <> 'object'
    or octet_length(p_answer::text) > 65536
    or nullif(btrim(coalesce(p_answer ->> 'answer_event_id', '')), '') is null
    or char_length(p_answer ->> 'answer_event_id') > 160
    or nullif(btrim(coalesce(p_answer ->> 'skill_id', '')), '') is null
    or char_length(coalesce(p_answer ->> 'question', '')) > 10000
    or char_length(coalesce(p_answer ->> 'passage', '')) > 50000
    or char_length(coalesce(p_answer ->> 'chosen', '')) > 10000
    or char_length(coalesce(p_answer ->> 'correct', '')) > 10000
  then
    return json_build_object('ok', false, 'error', 'invalid_answer');
  end if;

  select member.* into v_member
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where session.id = p_session_id
    and session.target = 'skills_assessment'
    and session.status = 'active'
    and session.expires_at > now()
    and member.student_id = v_student.id
    and member.active
  for update of member;

  if v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  select * into v_session
  from public.student_focus_sessions
  where id = v_member.session_id;
  if p_answer ->> 'skill_id' <> v_member.resolved_config ->> 'skill_id'
    or coalesce((p_answer ->> 'level')::integer, -1) <> (v_member.resolved_config ->> 'level')::integer
    or coalesce((p_answer ->> 'phase')::integer, -1) <> (v_member.resolved_config ->> 'phase')::integer
  then
    return json_build_object('ok', false, 'error', 'assignment_mismatch');
  end if;

  insert into public.answers (
    student_id, teacher_id, client_event_id, skill, stage, diagnostic_target,
    question, passage, chosen_answer, correct_answer, is_correct, answered_at
  ) values (
    v_student.id,
    v_session.teacher_id,
    p_answer ->> 'answer_event_id',
    coalesce(p_answer ->> 'skill_label', p_answer ->> 'skill_id'),
    coalesce(p_answer ->> 'stage', p_answer ->> 'skill_label', p_answer ->> 'skill_id'),
    nullif(p_answer ->> 'diagnostic_target', ''),
    coalesce(p_answer ->> 'question', ''),
    coalesce(p_answer ->> 'passage', ''),
    coalesce(p_answer ->> 'chosen', ''),
    coalesce(p_answer ->> 'correct', ''),
    coalesce((p_answer ->> 'is_correct')::boolean, false),
    now()
  )
  on conflict (teacher_id, client_event_id) where client_event_id is not null do nothing;
  get diagnostics v_inserted = row_count;

  update public.student_focus_session_members
     set status = case when status = 'assigned' then 'active' else status end,
         current_view = 'assessment',
         content_ok = true,
         last_seen_at = now(),
         updated_at = now()
   where session_id = v_session.id and student_id = v_student.id;

  return json_build_object('ok', true, 'duplicate', v_inserted = 0, 'updated_at', now());
exception
  when invalid_text_representation then
    return json_build_object('ok', false, 'error', 'invalid_answer');
end;
$$;

create or replace function public.student_save_focus_item_mastery(
  p_token text,
  p_session_id uuid,
  p_item_mastery jsonb
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_attempts integer;
  v_correct integer;
  v_sessions_seen integer;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_item_mastery is null
    or jsonb_typeof(p_item_mastery) <> 'object'
    or octet_length(p_item_mastery::text) > 16384
    or nullif(btrim(coalesce(p_item_mastery ->> 'item_key', '')), '') is null
    or char_length(p_item_mastery ->> 'item_key') > 240
    or nullif(btrim(coalesce(p_item_mastery ->> 'item_type', '')), '') is null
    or char_length(p_item_mastery ->> 'item_type') > 120
  then
    return json_build_object('ok', false, 'error', 'invalid_item_mastery');
  end if;

  v_attempts := coalesce((p_item_mastery ->> 'attempts')::integer, -1);
  v_correct := coalesce((p_item_mastery ->> 'correct')::integer, -1);
  v_sessions_seen := coalesce((p_item_mastery ->> 'sessions_seen')::integer, -1);
  if v_attempts not between 0 and 10000
    or v_correct not between 0 and v_attempts
    or v_sessions_seen not between 0 and v_attempts
  then
    return json_build_object('ok', false, 'error', 'invalid_item_mastery');
  end if;

  select member.* into v_member
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where session.id = p_session_id
    and session.target = 'skills_assessment'
    and session.status = 'active'
    and session.expires_at > now()
    and member.student_id = v_student.id
    and member.active
  for update of member;

  if v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  select * into v_session
  from public.student_focus_sessions
  where id = v_member.session_id;
  if coalesce(p_item_mastery ->> 'skill_id', '') <> v_member.resolved_config ->> 'skill_id' then
    return json_build_object('ok', false, 'error', 'assignment_mismatch');
  end if;

  insert into public.item_mastery (
    student_id, teacher_id, item_key, item_type, attempts, correct,
    last_seen, last_result, sessions_seen, mastered, updated_at
  ) values (
    v_student.id,
    v_session.teacher_id,
    p_item_mastery ->> 'item_key',
    p_item_mastery ->> 'item_type',
    v_attempts,
    v_correct,
    now(),
    coalesce((p_item_mastery ->> 'last_result')::boolean, false),
    v_sessions_seen,
    coalesce((p_item_mastery ->> 'mastered')::boolean, false),
    now()
  )
  on conflict (teacher_id, student_id, item_key, item_type)
  do update set
    attempts = excluded.attempts,
    correct = excluded.correct,
    last_seen = excluded.last_seen,
    last_result = excluded.last_result,
    sessions_seen = excluded.sessions_seen,
    mastered = excluded.mastered,
    updated_at = excluded.updated_at;

  return json_build_object('ok', true, 'updated_at', now());
exception
  when invalid_text_representation then
    return json_build_object('ok', false, 'error', 'invalid_item_mastery');
end;
$$;

create or replace function public.student_complete_focus_assessment(
  p_token text,
  p_session_id uuid,
  p_attempt jsonb
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.student_focus_sessions;
  v_member public.student_focus_session_members;
  v_payload jsonb;
  v_attempt_id text;
  v_total integer;
  v_correct integer;
  v_question_total integer;
  v_question_correct integer;
  v_inserted integer := 0;
  v_attempts integer := 0;
  v_level_one_passed boolean := false;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_attempt is null
    or jsonb_typeof(p_attempt) <> 'object'
    or octet_length(p_attempt::text) > 4900000
  then
    return json_build_object('ok', false, 'error', 'invalid_attempt');
  end if;

  select member.* into v_member
  from public.student_focus_sessions session
  join public.student_focus_session_members member on member.session_id = session.id
  where session.id = p_session_id
    and session.target = 'skills_assessment'
    and session.status = 'active'
    and session.expires_at > now()
    and member.student_id = v_student.id
    and member.active
  for update of member;

  if v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  select * into v_session
  from public.student_focus_sessions
  where id = v_member.session_id;

  v_attempt_id := nullif(btrim(coalesce(p_attempt ->> 'attemptId', '')), '');
  v_total := coalesce((p_attempt ->> 'totalQuestions')::integer, -1);
  v_correct := coalesce((p_attempt ->> 'correctCount')::integer, -1);
  if jsonb_typeof(p_attempt -> 'questionRecords') <> 'array' then
    return json_build_object('ok', false, 'error', 'invalid_attempt');
  end if;
  v_question_total := jsonb_array_length(p_attempt -> 'questionRecords');
  select count(*) filter (where coalesce((question ->> 'isCorrect')::boolean, false))
    into v_question_correct
  from jsonb_array_elements(p_attempt -> 'questionRecords') question;
  if v_attempt_id is null
    or char_length(v_attempt_id) > 200
    or p_attempt ->> 'skillId' <> v_member.resolved_config ->> 'skill_id'
    or coalesce((p_attempt ->> 'skillLevel')::integer, -1) <> (v_member.resolved_config ->> 'level')::integer
    or coalesce((p_attempt ->> 'skillPhase')::integer, -1) <> (v_member.resolved_config ->> 'phase')::integer
    or coalesce(p_attempt ->> 'assessmentType', '') <> 'skill_checkpoint'
    or v_total not between 1 and 100
    or v_correct not between 0 and v_total
    or v_question_total <> v_total
    or v_question_correct <> v_correct
    or coalesce(p_attempt ->> 'administrationStatus', 'completed') <> 'completed'
    or nullif(btrim(coalesce(p_attempt ->> 'assessmentVersion', '')), '') is null
    or nullif(btrim(coalesce(p_attempt ->> 'contentVersion', '')), '') is null
    or nullif(btrim(coalesce(p_attempt ->> 'policyVersion', '')), '') is null
  then
    return json_build_object('ok', false, 'error', 'assignment_mismatch');
  end if;

  v_payload := p_attempt || jsonb_build_object(
    'studentId', v_student.id::text,
    'studentName', v_student.name,
    'classId', v_session.class_id::text,
    'teacherId', v_session.teacher_id::text,
    'administrationMode', 'student_independent',
    'focusSessionId', v_session.id::text,
    'assignedByTeacher', true
  );

  insert into public.assessment_attempts (
    attempt_id, student_id, class_id, teacher_id, assessment_type,
    skill_id, skill_name, skill_level, skill_phase, started_at, completed_at,
    total_questions, correct_count, accuracy, status, administration_status,
    schema_version, evidence_schema_version, assessment_version, content_version,
    policy_version, payload, raw_evidence, updated_at
  ) values (
    v_attempt_id,
    v_student.id::text,
    v_session.class_id::text,
    v_session.teacher_id,
    'skill_checkpoint',
    v_member.resolved_config ->> 'skill_id',
    v_member.resolved_config ->> 'skill_label',
    (v_member.resolved_config ->> 'level')::integer,
    (v_member.resolved_config ->> 'phase')::integer,
    coalesce((p_attempt ->> 'startedAt')::timestamptz, now()),
    coalesce((p_attempt ->> 'completedAt')::timestamptz, now()),
    v_total,
    v_correct,
    round((v_correct::numeric / v_total::numeric) * 100, 2),
    coalesce(nullif(p_attempt ->> 'status', ''), 'evidence_recorded'),
    'completed',
    coalesce((p_attempt ->> 'schemaVersion')::integer, 2),
    1,
    p_attempt ->> 'assessmentVersion',
    p_attempt ->> 'contentVersion',
    p_attempt ->> 'policyVersion',
    v_payload,
    '{}'::jsonb,
    now()
  ) on conflict (attempt_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 and not exists (
    select 1
    from public.assessment_attempts existing
    where existing.attempt_id = v_attempt_id
      and existing.teacher_id = v_session.teacher_id
      and existing.student_id = v_student.id::text
      and existing.class_id = v_session.class_id::text
      and existing.skill_id = v_member.resolved_config ->> 'skill_id'
      and existing.payload ->> 'focusSessionId' = v_session.id::text
  ) then
    return json_build_object('ok', false, 'error', 'attempt_id_conflict');
  end if;

  select
    count(*),
    count(distinct attempt.skill_phase) filter (
      where attempt.skill_level = 1
        and attempt.skill_phase in (1, 2)
        and attempt.total_questions > 0
        and (attempt.correct_count::numeric / attempt.total_questions::numeric) >= 0.70
        and attempt.administration_status = 'completed'
    ) = 2
  into v_attempts, v_level_one_passed
  from public.assessment_attempts attempt
  where attempt.teacher_id = v_session.teacher_id
    and attempt.student_id = v_student.id::text
    and attempt.skill_id = v_member.resolved_config ->> 'skill_id';

  insert into public.mastery (
    student_id, teacher_id, checkpoint_id, skill_id, skill_label,
    mastered, attempts, last_score, last_total, updated_at
  ) values (
    v_student.id,
    v_session.teacher_id,
    v_attempt_id,
    v_member.resolved_config ->> 'skill_id',
    v_member.resolved_config ->> 'skill_label',
    v_level_one_passed,
    greatest(1, v_attempts),
    v_correct,
    v_total,
    now()
  ) on conflict (teacher_id, checkpoint_id) where checkpoint_id is not null do nothing;

  update public.student_focus_session_members
     set status = 'completed',
         completed_at = coalesce(completed_at, now()),
         current_view = 'assessment_complete',
         content_ok = true,
         last_seen_at = now(),
         updated_at = now()
   where session_id = v_session.id and student_id = v_student.id;

  return json_build_object('ok', true, 'duplicate', v_inserted = 0, 'attempt_id', v_attempt_id, 'completed_at', now());
exception
  when invalid_text_representation or datetime_field_overflow then
    return json_build_object('ok', false, 'error', 'invalid_attempt');
end;
$$;

-- Existing Guided Reading starts also lock the student rows. This trigger is a
-- second cross-feature guard, so a reading start cannot race past an active
-- focus member after its own same-feature conflict check.
create or replace function public.reject_reading_focus_conflict()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'active' and exists (
    select 1
    from public.student_focus_session_members member
    join public.student_focus_sessions session on session.id = member.session_id
    where member.student_id = any(new.student_ids)
      and member.active
      and session.status = 'active'
      and session.expires_at > now()
  ) then
    raise exception using errcode = '23505', message = 'student_focus_session_conflict';
  end if;
  return new;
end;
$$;

drop trigger if exists reading_sessions_focus_conflict_guard on public.reading_sessions;
create trigger reading_sessions_focus_conflict_guard
before insert or update of student_ids, status on public.reading_sessions
for each row execute function public.reject_reading_focus_conflict();

create or replace function public.end_empty_student_focus_sessions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.student_focus_sessions session
     set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
   where session.status = 'active'
     and not exists (
       select 1 from public.student_focus_session_members member
       where member.session_id = session.id and member.active
     );
  return old;
end;
$$;

drop trigger if exists students_end_empty_focus_sessions on public.students;
create trigger students_end_empty_focus_sessions
after delete on public.students
for each statement execute function public.end_empty_student_focus_sessions();

-- Extend the current operational-retention sweep without changing its API.
create or replace function public.admin_purge_expired_error_events()
returns bigint
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_deleted bigint := 0;
  v_count bigint := 0;
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  delete from public.student_focus_sessions
  where status = 'ended' and ended_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.reading_sessions
  where status = 'ended' and ended_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.app_error_events where expires_at <= now();
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;
  return v_deleted;
end;
$$;

revoke all on function public.end_expired_student_focus_sessions()
  from public, anon, authenticated;
revoke all on function public.reject_reading_focus_conflict()
  from public, anon, authenticated;
revoke all on function public.end_empty_student_focus_sessions()
  from public, anon, authenticated;

revoke all on function public.teacher_start_student_focus_session(uuid, text, uuid[], jsonb, integer, text)
  from public, anon, authenticated;
grant execute on function public.teacher_start_student_focus_session(uuid, text, uuid[], jsonb, integer, text)
  to authenticated;

revoke all on function public.teacher_get_student_focus_session(uuid)
  from public, anon, authenticated;
grant execute on function public.teacher_get_student_focus_session(uuid)
  to authenticated;

revoke all on function public.teacher_end_student_focus_session(uuid)
  from public, anon, authenticated;
grant execute on function public.teacher_end_student_focus_session(uuid)
  to authenticated;

revoke all on function public.student_get_focus_session(text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.student_get_focus_session(text, text, boolean)
  to anon, authenticated;

revoke all on function public.student_complete_focus_session(text, uuid)
  from public, anon, authenticated;
grant execute on function public.student_complete_focus_session(text, uuid)
  to anon, authenticated;

revoke all on function public.student_save_focus_assessment_answer(text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.student_save_focus_assessment_answer(text, uuid, jsonb)
  to anon, authenticated;

revoke all on function public.student_save_focus_item_mastery(text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.student_save_focus_item_mastery(text, uuid, jsonb)
  to anon, authenticated;

revoke all on function public.student_complete_focus_assessment(text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.student_complete_focus_assessment(text, uuid, jsonb)
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
