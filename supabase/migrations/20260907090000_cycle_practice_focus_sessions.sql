-- Cycle Practice is an original LiteracyPath practice surface aligned to the
-- cycle structure of the Skills Block. It is a teacher-controlled session,
-- not an official EL Education assessment form.

begin;

alter table public.student_focus_sessions
  drop constraint if exists student_focus_sessions_target_check;

alter table public.student_focus_sessions
  add constraint student_focus_sessions_target_check check (
    target in (
      'reading_library', 'letters_practice', 'skills_assessment',
      'assigned_book', 'arcade_game', 'adventure_map', 'cycle_practice'
    )
  );

create table public.student_focus_cycle_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.student_focus_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  cycle_id text not null,
  cycle_number integer not null check (cycle_number between 1 and 27),
  attempt_id text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  practice_seconds integer not null check (practice_seconds >= 1800),
  total_questions integer not null check (total_questions > 0 and total_questions <= 100),
  correct_count integer not null check (correct_count between 0 and total_questions),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  unique (student_id, attempt_id),
  constraint student_focus_cycle_practice_cycle_id_check check (cycle_id = 'cycle-' || cycle_number::text)
);

alter table public.student_focus_cycle_practice_attempts enable row level security;
revoke all on table public.student_focus_cycle_practice_attempts from public, anon, authenticated;

create index student_focus_cycle_practice_attempts_session_idx
  on public.student_focus_cycle_practice_attempts (session_id, student_id, completed_at desc);

create or replace function public.teacher_start_cycle_practice_session(
  p_class_id uuid,
  p_student_ids uuid[],
  p_assignments jsonb default '{}'::jsonb,
  p_duration_minutes integer default 60,
  p_content_version text default 'cycle-practice-v1',
  p_whole_class boolean default false
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.student_focus_sessions;
  v_student_ids uuid[] := '{}'::uuid[];
  v_selection_scope text;
  v_student_id uuid;
  v_invalid_student uuid;
  v_busy_student uuid;
  v_config jsonb;
  v_shared_config jsonb := '{}'::jsonb;
  v_cycle_id text;
  v_cycle_number integer;
  v_cycle_title text;
  v_members json;
begin
  perform public.assert_current_actor_teacher_access();

  if p_class_id is null
    or p_assignments is null
    or jsonb_typeof(p_assignments) <> 'object'
    or octet_length(p_assignments::text) > 1000000
    or p_duration_minutes is null
    or p_duration_minutes not between 30 and 120
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or char_length(btrim(p_content_version)) > 120
    or p_whole_class is null
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  perform 1 from public.classes class
  where class.id = p_class_id and class.teacher_id = v_actor
  for update;
  if not found then
    return json_build_object('ok', false, 'error', 'class_not_found');
  end if;

  if p_whole_class then
    if coalesce(cardinality(p_student_ids), 0) <> 0 then
      return json_build_object('ok', false, 'error', 'whole_class_ids_must_be_empty');
    end if;
    select coalesce(array_agg(student.id order by student.id), '{}'::uuid[])
      into v_student_ids
    from public.students student
    where student.class_id = p_class_id
      and student.teacher_id = v_actor
      and student.archived_at is null;
    if cardinality(v_student_ids) = 0 then
      return json_build_object('ok', false, 'error', 'class_has_no_active_students');
    end if;
    if cardinality(v_student_ids) > 200 then
      return json_build_object('ok', false, 'error', 'class_too_large');
    end if;
    v_selection_scope := 'whole_class';
  else
    if coalesce(cardinality(p_student_ids), 0) not between 1 and 200
      or (select count(distinct requested.id) from unnest(p_student_ids) requested(id)) <> cardinality(p_student_ids)
    then
      return json_build_object('ok', false, 'error', 'invalid_payload');
    end if;
    v_student_ids := p_student_ids;
    v_selection_scope := 'selected_students';
  end if;

  perform 1 from public.students student
  where student.id = any(v_student_ids)
  order by student.id
  for update;

  select requested.id into v_invalid_student
  from unnest(v_student_ids) requested(id)
  left join public.students student
    on student.id = requested.id
   and student.class_id = p_class_id
   and student.teacher_id = v_actor
   and student.archived_at is null
  where student.id is null
  order by requested.id
  limit 1;
  if v_invalid_student is not null then
    return json_build_object('ok', false, 'error', 'student_not_in_class', 'student_id', v_invalid_student);
  end if;

  -- Accept only the small, display-safe cycle snapshot produced by the app.
  if p_assignments ? '*' then
    if (select count(*) from jsonb_object_keys(p_assignments)) <> 1 then
      return json_build_object('ok', false, 'error', 'invalid_shared_assignment');
    end if;
    v_config := p_assignments -> '*';
    v_shared_config := v_config;
    if v_config is null or jsonb_typeof(v_config) <> 'object'
      or exists (select 1 from jsonb_object_keys(v_config) key where key not in ('cycle_id', 'cycle_number', 'cycle_title'))
    then
      return json_build_object('ok', false, 'error', 'invalid_cycle_assignment');
    end if;
    v_cycle_id := btrim(v_config ->> 'cycle_id');
    v_cycle_title := btrim(v_config ->> 'cycle_title');
    if jsonb_typeof(v_config -> 'cycle_number') is distinct from 'number'
      or (v_config ->> 'cycle_number') !~ '^[1-9][0-9]*$'
    then
      return json_build_object('ok', false, 'error', 'invalid_cycle_assignment');
    end if;
    v_cycle_number := (v_config ->> 'cycle_number')::integer;
    if v_cycle_number not between 1 and 27
      or v_cycle_id <> 'cycle-' || v_cycle_number::text
      or char_length(v_cycle_title) not between 1 and 160
      or v_cycle_title ~ '[[:cntrl:]]'
    then
      return json_build_object('ok', false, 'error', 'invalid_cycle_assignment');
    end if;
  else
    if (select count(*) from jsonb_object_keys(p_assignments)) <> cardinality(v_student_ids) then
      return json_build_object('ok', false, 'error', 'missing_cycle_assignment');
    end if;
    for v_student_id in select unnest(v_student_ids) loop
      v_config := p_assignments -> v_student_id::text;
      if v_config is null or jsonb_typeof(v_config) <> 'object'
        or exists (select 1 from jsonb_object_keys(v_config) key where key not in ('cycle_id', 'cycle_number', 'cycle_title'))
      then
        return json_build_object('ok', false, 'error', 'invalid_cycle_assignment', 'student_id', v_student_id);
      end if;
      v_cycle_id := btrim(v_config ->> 'cycle_id');
      v_cycle_title := btrim(v_config ->> 'cycle_title');
      if jsonb_typeof(v_config -> 'cycle_number') is distinct from 'number'
        or (v_config ->> 'cycle_number') !~ '^[1-9][0-9]*$'
      then
        return json_build_object('ok', false, 'error', 'invalid_cycle_assignment', 'student_id', v_student_id);
      end if;
      v_cycle_number := (v_config ->> 'cycle_number')::integer;
      if v_cycle_number not between 1 and 27
        or v_cycle_id <> 'cycle-' || v_cycle_number::text
        or char_length(v_cycle_title) not between 1 and 160
        or v_cycle_title ~ '[[:cntrl:]]'
      then
        return json_build_object('ok', false, 'error', 'invalid_cycle_assignment', 'student_id', v_student_id);
      end if;
    end loop;
  end if;

  perform public.end_expired_student_focus_sessions();
  select requested.id into v_busy_student
  from unnest(v_student_ids) requested(id)
  join public.student_focus_session_members member on member.student_id = requested.id and member.active
  join public.student_focus_sessions session on session.id = member.session_id
    and session.status = 'active' and session.expires_at > now() and session.teacher_id <> v_actor
  order by requested.id limit 1;
  if v_busy_student is not null then
    return json_build_object('ok', false, 'error', 'student_busy', 'student_id', v_busy_student);
  end if;

  select requested.id into v_busy_student
  from unnest(v_student_ids) requested(id)
  join public.reading_sessions reading
    on requested.id = any(reading.student_ids)
   and reading.status = 'active'
   and reading.updated_at >= now() - interval '90 minutes'
  order by requested.id
  limit 1;
  if v_busy_student is not null then
    return json_build_object('ok', false, 'error', 'student_busy', 'student_id', v_busy_student);
  end if;

  update public.student_focus_session_members member
     set active = false, updated_at = now()
    from public.student_focus_sessions session
   where member.session_id = session.id and session.teacher_id = v_actor and session.status = 'active';
  update public.student_focus_sessions
     set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
   where teacher_id = v_actor and status = 'active';

  insert into public.student_focus_sessions (
    teacher_id, class_id, target, content_version, selection_scope, expires_at
  ) values (
    v_actor, p_class_id, 'cycle_practice', btrim(p_content_version), v_selection_scope,
    now() + make_interval(mins => p_duration_minutes)
  ) returning * into v_session;

  insert into public.student_focus_session_members (session_id, student_id, resolved_config)
  select v_session.id, requested.id,
    case when p_assignments ? '*' then v_shared_config else p_assignments -> requested.id::text end
  from unnest(v_student_ids) requested(id);

  select coalesce(json_agg(json_build_object(
    'student_id', member.student_id, 'status', member.status, 'connected', false,
    'content_ok', member.content_ok, 'resolved_config', member.resolved_config
  ) order by student.name), '[]'::json)
  into v_members
  from public.student_focus_session_members member
  join public.students student on student.id = member.student_id
  where member.session_id = v_session.id;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id, 'teacher_id', v_session.teacher_id, 'class_id', v_session.class_id,
      'target', v_session.target, 'audience', v_session.selection_scope,
      'selection_scope', v_session.selection_scope, 'content_version', v_session.content_version,
      'status', v_session.status, 'started_at', v_session.started_at, 'expires_at', v_session.expires_at,
      'updated_at', v_session.updated_at, 'members', v_members
    )
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return json_build_object('ok', false, 'error', 'invalid_cycle_assignment');
end;
$$;

revoke all on function public.teacher_start_cycle_practice_session(uuid, uuid[], jsonb, integer, text, boolean)
  from public, anon, authenticated;
grant execute on function public.teacher_start_cycle_practice_session(uuid, uuid[], jsonb, integer, text, boolean)
  to authenticated;

create or replace function public.student_complete_focus_cycle_practice(
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
  v_member public.student_focus_session_members;
  v_session public.student_focus_sessions;
  v_cycle_id text;
  v_cycle_number integer;
  v_attempt_id text;
  v_total integer;
  v_correct integer;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null or p_session_id is null or p_attempt is null
    or jsonb_typeof(p_attempt) <> 'object'
    or octet_length(p_attempt::text) > 5000000
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  select session.* into v_session
  from public.student_focus_sessions session
  where session.id = p_session_id and session.target = 'cycle_practice'
    and session.status = 'active' and session.expires_at > now();
  select member.* into v_member
  from public.student_focus_session_members member
  where member.session_id = p_session_id and member.student_id = v_student.id and member.active
  for update;
  if v_session.id is null or v_member.session_id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  v_cycle_id := v_member.resolved_config ->> 'cycle_id';
  v_cycle_number := (v_member.resolved_config ->> 'cycle_number')::integer;
  v_attempt_id := btrim(p_attempt ->> 'attemptId');
  v_total := (p_attempt ->> 'totalQuestions')::integer;
  v_correct := (p_attempt ->> 'correctCount')::integer;
  if p_attempt ->> 'assessmentType' <> 'cycle_practice_check'
    or p_attempt ->> 'status' <> 'completed'
    or p_attempt ->> 'cycleId' <> v_cycle_id
    or (p_attempt ->> 'cycleNumber')::integer <> v_cycle_number
    or p_attempt ->> 'contentVersion' <> 'cycle-practice-v1'
    or p_attempt ->> 'attemptId' is null
    or v_attempt_id !~ '^[A-Za-z0-9._:-]{1,160}$'
    or (p_attempt ->> 'practiceSeconds')::integer < 1800
    or jsonb_typeof(p_attempt -> 'questionRecords') <> 'array'
    or jsonb_array_length(p_attempt -> 'questionRecords') <> v_total
    or v_total not between 1 and 100
    or v_correct not between 0 and v_total
  then
    return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt');
  end if;

  insert into public.student_focus_cycle_practice_attempts (
    session_id, student_id, teacher_id, class_id, cycle_id, cycle_number, attempt_id,
    started_at, completed_at, practice_seconds, total_questions, correct_count, payload
  ) values (
    p_session_id, v_student.id, v_session.teacher_id, v_session.class_id, v_cycle_id,
    v_cycle_number, v_attempt_id, (p_attempt ->> 'startedAt')::timestamptz,
    (p_attempt ->> 'completedAt')::timestamptz, (p_attempt ->> 'practiceSeconds')::integer,
    v_total, v_correct, p_attempt
  ) on conflict (student_id, attempt_id) do nothing;

  update public.student_focus_session_members
     set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
   where session_id = p_session_id and student_id = v_student.id and active;

  return json_build_object('ok', true, 'duplicate', false, 'status', 'completed');
exception
  when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
    return json_build_object('ok', false, 'error', 'invalid_cycle_practice_attempt');
end;
$$;

revoke all on function public.student_complete_focus_cycle_practice(text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.student_complete_focus_cycle_practice(text, uuid, jsonb)
  to authenticated;

notify pgrst, 'reload schema';

commit;
