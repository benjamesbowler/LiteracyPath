-- Two corrections to the learner-lifecycle boundary, found by audit on
-- 2026-07-27. Both are safe to re-run.
--
-- 1. Deleting one learner destroyed other children's assessment evidence.
-- 2. Archiving a learner left them signed in for up to the session TTL.

-- ---------------------------------------------------------------------------
-- 1. Redact the subject from shared reports instead of deleting the row.
--
-- The previous statement was:
--
--   delete from public.el_assessment_reports er
--   where er.student_id = v_student.id::text
--      or er.payload::text like '%' || v_student.id::text || '%'
--      or er.summary::text like '%' || v_student.id::text || '%';
--
-- A whole-class report contains every learner in the class, so the substring
-- match deleted the WHOLE row — the other twenty-nine children's evidence went
-- with it. Being `security definer`, it bypassed row-level security, so it also
-- reached rows belonging to a co-teacher or an admin. That both destroys
-- evidence the school is required to keep and contradicts the immutability
-- promise in docs/teacher/ASSESSMENT_EVIDENCE.md.
--
-- The rule now: a report ABOUT the subject is deleted; a report that merely
-- MENTIONS the subject has the subject's entries stripped and is kept.

create or replace function public.redact_learner_from_shared_reports(
  p_student_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject text := p_student_id::text;
  v_redacted integer := 0;
begin
  -- Reports about this learner alone: remove entirely.
  delete from public.el_assessment_reports er
  where er.student_id = v_subject;

  -- Reports about a group that include this learner: strip their entries and
  -- keep the row, so every other child's evidence survives.
  update public.el_assessment_reports er
  set
    payload = public.jsonb_strip_student_entries(er.payload, v_subject),
    summary = public.jsonb_strip_student_entries(er.summary, v_subject)
  where er.student_id is distinct from v_subject
    and (
      er.payload::text like '%' || v_subject || '%'
      or er.summary::text like '%' || v_subject || '%'
    );
  get diagnostics v_redacted = row_count;

  return v_redacted;
end;
$$;

-- Walk a jsonb document and drop any object or array element that identifies
-- the subject, leaving the rest of the structure intact.
create or replace function public.jsonb_strip_student_entries(
  p_document jsonb,
  p_student_id text
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_key text;
  v_result jsonb;
  v_element jsonb;
begin
  if p_document is null then
    return null;
  end if;

  if jsonb_typeof(p_document) = 'array' then
    v_result := '[]'::jsonb;
    for v_element in select value from jsonb_array_elements(p_document) loop
      -- Drop array members that ARE the subject; recurse into the others.
      if jsonb_typeof(v_element) = 'object'
         and (
           v_element ->> 'studentId' = p_student_id
           or v_element ->> 'student_id' = p_student_id
           or v_element ->> 'id' = p_student_id
         )
      then
        continue;
      end if;
      v_result := v_result || jsonb_build_array(
        public.jsonb_strip_student_entries(v_element, p_student_id)
      );
    end loop;
    return v_result;
  end if;

  if jsonb_typeof(p_document) = 'object' then
    v_result := '{}'::jsonb;
    for v_key in select jsonb_object_keys(p_document) loop
      -- A map keyed by student id: drop the subject's key outright.
      if v_key like '%' || p_student_id || '%' then
        continue;
      end if;
      v_result := v_result || jsonb_build_object(
        v_key,
        public.jsonb_strip_student_entries(p_document -> v_key, p_student_id)
      );
    end loop;
    return v_result;
  end if;

  -- Any string carrying the subject's id — whole, or embedded in a longer
  -- value such as a report id or a file name — has it replaced by a marker.
  --
  -- "Contains", not "equals", and this is load-bearing rather than tidiness:
  -- teacher_delete_learner_data finishes by refusing to complete if the id
  -- still appears ANYWHERE in payload::text or summary::text. If redaction
  -- only removed whole-value matches, one id embedded in a file name would
  -- make every deletion raise and roll back. Erasing the substring is what
  -- lets the existing residual-records proof stay strict AND stay passable.
  if jsonb_typeof(p_document) = 'string' then
    return to_jsonb(replace(p_document #>> '{}', p_student_id, '[removed]'));
  end if;

  return p_document;
end;
$$;

revoke all on function public.redact_learner_from_shared_reports(uuid) from public, anon, authenticated;
revoke all on function public.jsonb_strip_student_entries(jsonb, text) from public, anon;

comment on function public.redact_learner_from_shared_reports(uuid) is
  'Deletes reports about one learner and redacts that learner from shared reports, so deleting one child never destroys another child''s evidence.';


-- ---------------------------------------------------------------------------
-- 1b. Re-issue teacher_delete_learner_data so it uses the redaction above.
--
-- The body is otherwise unchanged from
-- 20260725110000_learner_data_rights.sql: same ownership checks, same locking,
-- same audit event, same residual-record proof. Only the
-- el_assessment_reports statement is different.

create or replace function public.teacher_delete_learner_data(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_request public.data_rights_requests;
  v_expected_ref text;
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
begin
  if p_confirmation is distinct from 'DELETE LEARNER DATA' then
    raise exception 'The exact deletion confirmation phrase is required';
  end if;

  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_expected_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  if p_subject_ref is distinct from v_expected_ref then
    raise exception 'The deletion subject reference does not match the learner';
  end if;

  select dr.*
  into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = v_expected_ref
    and dr.teacher_id = v_student.teacher_id
    and dr.class_id = v_student.class_id
    and dr.request_type = 'deletion'
    and dr.verification_status = 'verified'
    and dr.status = 'in_progress'
  for update;

  if not found then
    raise exception 'A verified in-progress deletion request was not found';
  end if;

  -- These tables contain text, array, or JSON references rather than a
  -- student foreign key. The short write lock closes the race where another
  -- session could recreate learner evidence between cleanup and verification.
  lock table public.assessment_attempts in share row exclusive mode;
  lock table public.el_assessment_reports in share row exclusive mode;
  lock table public.teacher_interventions in share row exclusive mode;
  lock table public.teacher_instructional_group_reviews in share row exclusive mode;
  lock table public.teacher_insight_observations in share row exclusive mode;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_started',
    jsonb_build_object('schemaVersion', 1)
  );

  delete from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('teacherObservations', v_count);

  delete from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('instructionalGroupReviews', v_count);

  update public.teacher_interventions ti
  set student_ids = array_remove(ti.student_ids, v_student.id)
  where v_student.id = any(ti.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('interventionsUpdated', v_count);

  -- Reports ABOUT this learner are deleted; reports that merely mention them
  -- (whole-class reports) have this learner's entries stripped and are kept, so
  -- deleting one child can never destroy another child's evidence.
  v_count := public.redact_learner_from_shared_reports(v_student.id);
  v_counts := v_counts || jsonb_build_object('assessmentReportsRedacted', v_count);
  v_counts := v_counts || jsonb_build_object(
    'assessmentReports',
    (select count(*) from public.el_assessment_reports er
      where er.student_id = v_student.id::text)
  );

  delete from public.assessment_attempts aa
  where aa.student_id = v_student.id::text;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentAttempts', v_count);

  select
    v_counts || jsonb_build_object(
      'answers', (select count(*) from public.answers a where a.student_id = v_student.id),
      'mastery', (select count(*) from public.mastery m where m.student_id = v_student.id),
      'itemMastery', (select count(*) from public.item_mastery im where im.student_id = v_student.id),
      'progress', (select count(*) from public.student_progress sp where sp.student_id = v_student.id),
      'learningActivity', (select count(*) from public.learn_activity la where la.student_id = v_student.id),
      'syncHealth', (select count(*) from public.activity_sync_health sh where sh.student_id = v_student.id),
      'sessions', (select count(*) from public.student_sessions ss where ss.student_id = v_student.id)
    )
  into strict v_counts;

  delete from public.students s
  where s.id = v_student.id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    );

  if not found then
    raise exception 'Learner deletion did not complete';
  end if;

  if exists (
    select 1 from public.answers a where a.student_id = p_student_id
    union all
    select 1 from public.mastery m where m.student_id = p_student_id
    union all
    select 1 from public.item_mastery im where im.student_id = p_student_id
    union all
    select 1 from public.student_progress sp where sp.student_id = p_student_id
    union all
    select 1 from public.learn_activity la where la.student_id = p_student_id
    union all
    select 1 from public.activity_sync_health sh where sh.student_id = p_student_id
    union all
    select 1 from public.student_sessions ss where ss.student_id = p_student_id
    union all
    select 1 from public.assessment_attempts aa where aa.student_id = p_student_id::text
    union all
    select 1 from public.el_assessment_reports er
      where er.student_id = p_student_id::text
        or er.payload::text like '%' || p_student_id::text || '%'
        or er.summary::text like '%' || p_student_id::text || '%'
    union all
    select 1 from public.teacher_interventions ti where p_student_id = any(ti.student_ids)
    union all
    select 1 from public.teacher_instructional_group_reviews gr where p_student_id = any(gr.student_ids)
    union all
    select 1 from public.teacher_insight_observations io where p_student_id = any(io.student_ids)
  ) then
    raise exception 'Learner deletion verification found residual managed records';
  end if;

  update public.data_rights_requests
  set
    status = 'completed',
    completed_at = now(),
    outcome_counts = v_counts,
    updated_at = now()
  where id = v_request.id;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'residualManagedRecords', 0
    )
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_expected_ref,
    'status', 'completed',
    'completedAt', now(),
    'deletedCounts', v_counts,
    'residualManagedRecords', 0
  );
end;
$$;


revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Archiving a learner now ends their sessions.
--
-- student_from_token filtered on revoked/expires_at but not archived_at, and
-- teacher_set_student_archived revoked nothing, so a child the teacher had just
-- removed from the roster kept reading and writing progress until their session
-- expired. The teacher's screen said they were gone.

create or replace function public.teacher_set_student_archived(
  p_student_id uuid,
  p_class_id uuid,
  p_archived boolean
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The child was not found in this class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to change this child.';
  end if;

  -- Archiving is presented to the teacher as removal, so it must actually stop
  -- access rather than only hiding the row.
  if p_archived then
    update public.student_sessions
       set revoked = true
     where student_id = p_student_id
       and revoked = false;
  end if;

  return query
  update public.students s
     set archived_at = case when p_archived then now() else null end,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_class_id
  returning s.id;
end;
$$;

comment on function public.teacher_set_student_archived(uuid, uuid, boolean) is
  'Archives or restores one child after verifying teacher ownership of the class. Archiving also revokes the child''s active sessions.';

revoke all on function public.teacher_set_student_archived(uuid, uuid, boolean)
  from public, anon;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;

-- An archived child must not be able to resume on an existing token either.
-- Return type and grants are kept exactly as first defined in
-- 20260610000000_student_login_symbol_passwords.sql; only the archived_at
-- filter is added, because `create or replace` cannot change a return type.
create or replace function public.student_from_token(p_token text)
returns public.students
language sql stable security definer set search_path = public
as $$
  select s.* from public.student_sessions ss
  join public.students s on s.id = ss.student_id
  where ss.token = p_token
    and ss.revoked = false
    and ss.expires_at > now()
    and s.archived_at is null
  limit 1;
$$;

revoke all on function public.student_from_token(text) from public, anon, authenticated;
