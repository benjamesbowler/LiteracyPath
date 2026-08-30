-- Extend teacher-controlled Student Sessions with a server-derived whole-class
-- audience and exact book/game assignments. The previous six-argument start
-- function is dropped before the seven-argument replacement is created so
-- PostgREST sees one unambiguous RPC. The trailing boolean has a default, so
-- existing callers that send the original named arguments continue to work.

begin;

alter table public.student_focus_sessions
  drop constraint if exists student_focus_sessions_target_check;

alter table public.student_focus_sessions
  add constraint student_focus_sessions_target_check check (
    target in (
      'reading_library',
      'letters_practice',
      'skills_assessment',
      'assigned_book',
      'arcade_game'
    )
  );

alter table public.student_focus_sessions
  add column selection_scope text not null default 'selected_students';

alter table public.student_focus_sessions
  add constraint student_focus_sessions_selection_scope_check check (
    selection_scope in ('selected_students', 'whole_class')
  );

revoke all on function public.teacher_start_student_focus_session(uuid, text, uuid[], jsonb, integer, text)
  from public, anon, authenticated;
drop function public.teacher_start_student_focus_session(uuid, text, uuid[], jsonb, integer, text);

create function public.teacher_start_student_focus_session(
  p_class_id uuid,
  p_target text,
  p_student_ids uuid[],
  p_assignments jsonb default '{}'::jsonb,
  p_duration_minutes integer default 60,
  p_content_version text default 'unknown',
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
  v_resource_id text;
  v_resource_title text;
  v_members json;
begin
  perform public.assert_current_actor_teacher_access();

  if p_class_id is null
    or p_target is null
    or p_target not in (
      'reading_library',
      'letters_practice',
      'skills_assessment',
      'assigned_book',
      'arcade_game'
    )
    or p_assignments is null
    or jsonb_typeof(p_assignments) <> 'object'
    or octet_length(p_assignments::text) > 1000000
    or p_duration_minutes is null
    or p_duration_minutes not between 5 and 120
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or char_length(btrim(p_content_version)) > 120
    or p_whole_class is null
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  -- Lock the owned class before deriving membership. Student create/transfer
  -- paths must take a foreign-key row lock on this class, so this gives the
  -- launch one authoritative roster snapshot instead of trusting a browser
  -- list labelled "Whole class".
  perform 1
  from public.classes class
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

    if coalesce(cardinality(v_student_ids), 0) = 0 then
      return json_build_object('ok', false, 'error', 'class_has_no_active_students');
    end if;
    if cardinality(v_student_ids) > 200 then
      return json_build_object('ok', false, 'error', 'class_too_large');
    end if;
    v_selection_scope := 'whole_class';
  else
    if coalesce(cardinality(p_student_ids), 0) not between 1 and 200
      or (
        select count(distinct requested.id)
        from unnest(p_student_ids) requested(id)
      ) <> cardinality(p_student_ids)
    then
      return json_build_object('ok', false, 'error', 'invalid_payload');
    end if;
    v_student_ids := p_student_ids;
    v_selection_scope := 'selected_students';
  end if;

  -- Serialize all competing focus/reading launches for these children.
  perform 1
  from public.students student
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
    return json_build_object(
      'ok', false,
      'error', 'student_not_in_class',
      'student_id', v_invalid_student
    );
  end if;

  if p_target = 'skills_assessment' then
    -- Skills remain per-child because "next assessment" is resolved from each
    -- learner's own complete evidence. A wildcard would flatten that evidence.
    if p_assignments ? '*' then
      return json_build_object('ok', false, 'error', 'unexpected_shared_assignment');
    end if;

    foreach v_student_id in array v_student_ids loop
      v_config := p_assignments -> v_student_id::text;
      if v_config is null
        or jsonb_typeof(v_config) <> 'object'
        or octet_length(v_config::text) > 4096
        or nullif(btrim(coalesce(v_config ->> 'skill_id', '')), '') is null
        or char_length(v_config ->> 'skill_id') > 120
        or nullif(btrim(coalesce(v_config ->> 'skill_label', '')), '') is null
        or char_length(v_config ->> 'skill_label') > 160
        or coalesce((v_config ->> 'skill_index')::integer, -1) not between 0 and 100
        or coalesce((v_config ->> 'level')::integer, -1) not between 1 and 2
        or coalesce((v_config ->> 'phase')::integer, -1) not between 1 and 2
      then
        return json_build_object(
          'ok', false,
          'error', 'invalid_assessment_assignment',
          'student_id', v_student_id
        );
      end if;
    end loop;
  elsif p_target in ('assigned_book', 'arcade_game') then
    -- Exact resources use one canonical wildcard config. Only bounded opaque
    -- IDs and display titles are accepted: routes, URLs and arbitrary keys are
    -- not part of this RPC contract.
    v_config := p_assignments -> '*';
    if (select count(*) from jsonb_object_keys(p_assignments)) <> 1
      or v_config is null
      or jsonb_typeof(v_config) <> 'object'
      or octet_length(v_config::text) > 4096
    then
      return json_build_object('ok', false, 'error', 'invalid_shared_assignment');
    end if;

    if p_target = 'assigned_book' then
      if jsonb_typeof(v_config -> 'book_id') is distinct from 'string'
        or jsonb_typeof(v_config -> 'book_title') is distinct from 'string'
        or exists (
          select 1
          from jsonb_object_keys(v_config) as config_keys(config_key)
          where config_key not in ('book_id', 'book_title')
        )
      then
        return json_build_object('ok', false, 'error', 'invalid_book_assignment');
      end if;
      v_resource_id := btrim(v_config ->> 'book_id');
      v_resource_title := btrim(v_config ->> 'book_title');
    else
      if jsonb_typeof(v_config -> 'game_id') is distinct from 'string'
        or jsonb_typeof(v_config -> 'game_title') is distinct from 'string'
        or exists (
          select 1
          from jsonb_object_keys(v_config) as config_keys(config_key)
          where config_key not in ('game_id', 'game_title')
        )
      then
        return json_build_object('ok', false, 'error', 'invalid_game_assignment');
      end if;
      v_resource_id := btrim(v_config ->> 'game_id');
      v_resource_title := btrim(v_config ->> 'game_title');
    end if;

    if v_resource_id !~ '^[a-z0-9][a-z0-9._-]{0,119}$'
      or v_resource_id like '%..%'
      or char_length(v_resource_title) not between 1 and 160
      or v_resource_title ~ '[[:cntrl:]]'
      or lower(v_resource_title) ~ '^[a-z][a-z0-9+.-]*://'
      or v_resource_title like '/%'
    then
      return json_build_object('ok', false, 'error', 'invalid_exact_assignment');
    end if;

    if p_target = 'assigned_book' and exists (
      select 1
      from public.guided_reading_book_reviews review
      where review.book_id = v_resource_id
        and review.status = 'quarantined'
    ) then
      return json_build_object('ok', false, 'error', 'book_quarantined');
    end if;

    v_shared_config := case when p_target = 'assigned_book'
      then jsonb_build_object('book_id', v_resource_id, 'book_title', v_resource_title)
      else jsonb_build_object('game_id', v_resource_id, 'game_title', v_resource_title)
    end;
  elsif p_assignments <> '{}'::jsonb then
    return json_build_object('ok', false, 'error', 'unexpected_assignments');
  end if;

  perform public.end_expired_student_focus_sessions();

  select requested.id into v_busy_student
  from unnest(v_student_ids) requested(id)
  join public.student_focus_session_members member
    on member.student_id = requested.id and member.active
  join public.student_focus_sessions session
    on session.id = member.session_id
   and session.status = 'active'
   and session.expires_at > now()
   and session.teacher_id <> v_actor
  order by requested.id
  limit 1;

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

  -- Conflict validation happens before replacement, so a rejected whole-class
  -- launch never silently ends the teacher's existing session.
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
    teacher_id, class_id, target, content_version, selection_scope, expires_at
  ) values (
    v_actor,
    p_class_id,
    p_target,
    btrim(p_content_version),
    v_selection_scope,
    now() + make_interval(mins => p_duration_minutes)
  ) returning * into v_session;

  insert into public.student_focus_session_members (
    session_id, student_id, resolved_config
  )
  select
    v_session.id,
    requested.id,
    case
      when p_target = 'skills_assessment' then p_assignments -> requested.id::text
      when p_target in ('assigned_book', 'arcade_game') then v_shared_config
      else '{}'::jsonb
    end
  from unnest(v_student_ids) requested(id);

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
      'audience', v_session.selection_scope,
      'selection_scope', v_session.selection_scope,
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
  when invalid_text_representation or numeric_value_out_of_range then
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
      'audience', v_session.selection_scope,
      'selection_scope', v_session.selection_scope,
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
      'audience', v_session.selection_scope,
      'selection_scope', v_session.selection_scope,
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

revoke all on function public.teacher_start_student_focus_session(uuid, text, uuid[], jsonb, integer, text, boolean)
  from public, anon, authenticated;
grant execute on function public.teacher_start_student_focus_session(uuid, text, uuid[], jsonb, integer, text, boolean)
  to authenticated;

revoke all on function public.teacher_get_student_focus_session(uuid)
  from public, anon, authenticated;
grant execute on function public.teacher_get_student_focus_session(uuid)
  to authenticated;

revoke all on function public.student_get_focus_session(text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.student_get_focus_session(text, text, boolean)
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
