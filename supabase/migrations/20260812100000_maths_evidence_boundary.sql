-- Phase 0 Maths evidence boundary.
--
-- The table is deliberately RPC-only: browsers receive no direct table grant.
-- Student identity is derived from the current picture-code token and teacher
-- identity from auth.uid(). Evidence is formative and cannot update mastery.

begin;

create table public.maths_evidence_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  student_id uuid not null,
  actor_type text not null check (actor_type in ('student', 'teacher')),
  skill_id text not null check (char_length(btrim(skill_id)) between 1 and 80),
  event_type text not null check (event_type in (
    'lesson_exit_observation',
    'practice_attempt',
    'skills_check_response',
    'teacher_observation'
  )),
  evidence jsonb not null check (
    jsonb_typeof(evidence) = 'object'
    and evidence -> 'schemaVersion' = '1'::jsonb
    and octet_length(evidence::text) <= 8192
  ),
  evidence_purpose text not null default 'formative_not_mastery'
    check (evidence_purpose = 'formative_not_mastery'),
  content_version text not null
    check (char_length(btrim(content_version)) between 1 and 120),
  client_event_id text not null
    check (char_length(btrim(client_event_id)) between 1 and 120),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  constraint maths_evidence_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint maths_evidence_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade,
  unique (student_id, client_event_id)
);

create index maths_evidence_teacher_class_time_idx
  on public.maths_evidence_events (teacher_id, class_id, occurred_at desc, id);
create index maths_evidence_student_skill_time_idx
  on public.maths_evidence_events (student_id, skill_id, occurred_at desc, id);

alter table public.maths_evidence_events enable row level security;
revoke all on table public.maths_evidence_events
  from public, anon, authenticated;

comment on table public.maths_evidence_events is
  'Append-only formative Maths events. RPC-only; never automatic mastery.';
comment on column public.maths_evidence_events.evidence is
  'Versioned bounded interaction or observation evidence. No child audio or images.';

create function public.student_record_maths_evidence(
  p_token text,
  p_client_event_id text,
  p_skill_id text,
  p_event_type text,
  p_evidence jsonb,
  p_occurred_at timestamptz,
  p_content_version text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_event public.maths_evidence_events;
  v_inserted boolean := false;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_student_session');
  end if;
  if v_student.archived_at is not null then
    return jsonb_build_object('ok', false, 'error', 'learner_archived');
  end if;
  if nullif(btrim(coalesce(p_client_event_id, '')), '') is null
    or char_length(p_client_event_id) > 120
    or nullif(btrim(coalesce(p_skill_id, '')), '') is null
    or char_length(p_skill_id) > 80
    or coalesce(p_event_type, '') not in (
      'practice_attempt',
      'skills_check_response'
    )
    or jsonb_typeof(p_evidence) is distinct from 'object'
    or p_evidence -> 'schemaVersion' is distinct from '1'::jsonb
    or octet_length(p_evidence::text) > 8192
    or p_occurred_at is null
    or p_occurred_at < now() - interval '90 days'
    or p_occurred_at > now() + interval '5 minutes'
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or char_length(p_content_version) > 120
  then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  insert into public.maths_evidence_events (
    teacher_id,
    class_id,
    student_id,
    actor_type,
    skill_id,
    event_type,
    evidence,
    content_version,
    client_event_id,
    occurred_at
  ) values (
    v_student.teacher_id,
    v_student.class_id,
    v_student.id,
    'student',
    btrim(p_skill_id),
    p_event_type,
    p_evidence,
    btrim(p_content_version),
    btrim(p_client_event_id),
    p_occurred_at
  )
  on conflict (student_id, client_event_id) do nothing
  returning * into v_event;

  v_inserted := v_event.id is not null;

  if v_event.id is null then
    select event.* into v_event
    from public.maths_evidence_events event
    where event.student_id = v_student.id
      and event.client_event_id = btrim(p_client_event_id);

    if v_event.actor_type <> 'student'
      or v_event.skill_id <> btrim(p_skill_id)
      or v_event.event_type <> p_event_type
      or v_event.evidence <> p_evidence
      or v_event.content_version <> btrim(p_content_version)
      or v_event.occurred_at <> p_occurred_at
    then
      return jsonb_build_object('ok', false, 'error', 'client_event_id_conflict');
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_event.id,
    'clientEventId', v_event.client_event_id,
    'idempotent', not v_inserted
  );
end;
$$;

create function public.teacher_record_maths_evidence(
  p_class_id uuid,
  p_student_id uuid,
  p_client_event_id text,
  p_skill_id text,
  p_event_type text,
  p_evidence jsonb,
  p_occurred_at timestamptz,
  p_content_version text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_event public.maths_evidence_events;
  v_inserted boolean := false;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_student_id is null
    or nullif(btrim(coalesce(p_client_event_id, '')), '') is null
    or char_length(p_client_event_id) > 120
    or nullif(btrim(coalesce(p_skill_id, '')), '') is null
    or char_length(p_skill_id) > 80
    or coalesce(p_event_type, '') not in (
      'lesson_exit_observation',
      'practice_attempt',
      'skills_check_response',
      'teacher_observation'
    )
    or jsonb_typeof(p_evidence) is distinct from 'object'
    or p_evidence -> 'schemaVersion' is distinct from '1'::jsonb
    or octet_length(p_evidence::text) > 8192
    or p_occurred_at is null
    or p_occurred_at < now() - interval '90 days'
    or p_occurred_at > now() + interval '5 minutes'
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or char_length(p_content_version) > 120
  then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  select student.* into v_student
  from public.students student
  where student.id = p_student_id
    and student.class_id = p_class_id
    and student.teacher_id = auth.uid()
    and student.archived_at is null
  for update;
  if v_student.id is null then
    return jsonb_build_object('ok', false, 'error', 'learner_not_in_owned_class');
  end if;

  insert into public.maths_evidence_events (
    teacher_id,
    class_id,
    student_id,
    actor_type,
    skill_id,
    event_type,
    evidence,
    content_version,
    client_event_id,
    occurred_at
  ) values (
    auth.uid(),
    p_class_id,
    p_student_id,
    'teacher',
    btrim(p_skill_id),
    p_event_type,
    p_evidence,
    btrim(p_content_version),
    btrim(p_client_event_id),
    p_occurred_at
  )
  on conflict (student_id, client_event_id) do nothing
  returning * into v_event;

  v_inserted := v_event.id is not null;

  if v_event.id is null then
    select event.* into v_event
    from public.maths_evidence_events event
    where event.student_id = p_student_id
      and event.client_event_id = btrim(p_client_event_id);

    if v_event.actor_type <> 'teacher'
      or v_event.teacher_id <> auth.uid()
      or v_event.class_id <> p_class_id
      or v_event.skill_id <> btrim(p_skill_id)
      or v_event.event_type <> p_event_type
      or v_event.evidence <> p_evidence
      or v_event.content_version <> btrim(p_content_version)
      or v_event.occurred_at <> p_occurred_at
    then
      return jsonb_build_object('ok', false, 'error', 'client_event_id_conflict');
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_event.id,
    'clientEventId', v_event.client_event_id,
    'idempotent', not v_inserted
  );
end;
$$;

create function public.teacher_read_maths_evidence(
  p_class_id uuid,
  p_student_id uuid default null,
  p_limit integer default 500
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_events jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_limit is null or p_limit not between 1 and 1000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;
  if not exists (
    select 1 from public.classes class
    where class.id = p_class_id and class.teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'class_not_found');
  end if;
  if p_student_id is not null and not exists (
    select 1 from public.students student
    where student.id = p_student_id
      and student.class_id = p_class_id
      and student.teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'learner_not_in_owned_class');
  end if;

  select coalesce(jsonb_agg(event_row.payload order by event_row.occurred_at, event_row.id), '[]'::jsonb)
  into v_events
  from (
    select
      event.id,
      event.occurred_at,
      jsonb_build_object(
        'id', event.id,
        'classId', event.class_id,
        'studentId', event.student_id,
        'actorType', event.actor_type,
        'skillId', event.skill_id,
        'eventType', event.event_type,
        'evidence', event.evidence,
        'evidencePurpose', event.evidence_purpose,
        'contentVersion', event.content_version,
        'clientEventId', event.client_event_id,
        'occurredAt', event.occurred_at,
        'receivedAt', event.received_at
      ) as payload
    from public.maths_evidence_events event
    where event.teacher_id = auth.uid()
      and event.class_id = p_class_id
      and (p_student_id is null or event.student_id = p_student_id)
    order by event.occurred_at desc, event.id desc
    limit p_limit
  ) event_row;

  return jsonb_build_object('ok', true, 'events', v_events);
end;
$$;

-- Include the new evidence in the existing verified learner export chain.
alter function public.teacher_export_learner_data(uuid, text, text)
  rename to teacher_export_learner_data_without_maths_evidence;
revoke all on function public.teacher_export_learner_data_without_maths_evidence(uuid, text, text)
  from public, anon, authenticated;

create function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_package jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  v_package := public.teacher_export_learner_data_without_maths_evidence(
    p_student_id,
    p_requester_role,
    p_verification_method
  );
  return v_package || jsonb_build_object(
    'mathsEvidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', event.id,
        'classId', event.class_id,
        'studentId', event.student_id,
        'actorType', event.actor_type,
        'skillId', event.skill_id,
        'eventType', event.event_type,
        'evidence', event.evidence,
        'evidencePurpose', event.evidence_purpose,
        'contentVersion', event.content_version,
        'clientEventId', event.client_event_id,
        'occurredAt', event.occurred_at,
        'receivedAt', event.received_at
      ) order by event.occurred_at, event.id)
      from public.maths_evidence_events event
      where event.student_id = p_student_id
    ), '[]'::jsonb)
  );
end;
$$;

-- Extend the browser-local deletion proof without weakening the mature server
-- deletion implementation. The private predecessor still verifies the request,
-- tombstone, timing and the original nine stores.
alter function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  rename to teacher_complete_learner_deletion_without_maths;
revoke all on function public.teacher_complete_learner_deletion_without_maths(uuid, text, jsonb)
  from public, anon, authenticated;

create function public.teacher_complete_learner_deletion(
  p_request_id uuid,
  p_subject_ref text,
  p_cleanup_proof jsonb
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_required_stores constant text[] := array[
    'assessment_attempts',
    'assessment_write_queue',
    'el_benchmark_drafts',
    'el_reports',
    'guided_reading_assessment',
    'manual_assessment_drafts',
    'maths_evidence_queue',
    'progress',
    'student_session',
    'teacher_profile'
  ];
  v_store_count integer;
  v_distinct_store_count integer;
  v_legacy_stores jsonb;
  v_legacy_proof jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if jsonb_typeof(p_cleanup_proof) is distinct from 'object'
    or jsonb_typeof(p_cleanup_proof -> 'storesChecked') is distinct from 'array'
  then
    raise exception using
      errcode = '22023',
      message = 'A complete browser-local cleanup proof is required.';
  end if;

  select count(*), count(distinct checked_store.store_name)
  into v_store_count, v_distinct_store_count
  from jsonb_array_elements_text(
    p_cleanup_proof -> 'storesChecked'
  ) as checked_store(store_name);

  if v_store_count <> cardinality(v_required_stores)
    or v_distinct_store_count <> cardinality(v_required_stores)
    or not (p_cleanup_proof -> 'storesChecked' ?& v_required_stores)
  then
    raise exception using
      errcode = '22023',
      message = 'The browser-local cleanup proof did not verify every required store.';
  end if;

  select coalesce(
    jsonb_agg(to_jsonb(checked_store.store_name) order by checked_store.position),
    '[]'::jsonb
  ) into v_legacy_stores
  from jsonb_array_elements_text(
    p_cleanup_proof -> 'storesChecked'
  ) with ordinality as checked_store(store_name, position)
  where checked_store.store_name <> 'maths_evidence_queue';

  v_legacy_proof := jsonb_set(
    p_cleanup_proof,
    '{storesChecked}',
    v_legacy_stores,
    false
  );
  return public.teacher_complete_learner_deletion_without_maths(
    p_request_id,
    p_subject_ref,
    v_legacy_proof
  );
end;
$$;

revoke all on function public.student_record_maths_evidence(
  text, text, text, text, jsonb, timestamptz, text
) from public, anon, authenticated;
revoke all on function public.teacher_record_maths_evidence(
  uuid, uuid, text, text, text, jsonb, timestamptz, text
) from public, anon, authenticated;
revoke all on function public.teacher_read_maths_evidence(uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  from public, anon, authenticated;

commit;
