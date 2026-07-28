-- Assessment durability and learner-lifecycle boundary.
--
-- This migration is forward-only and does not rewrite completed evidence.
-- It closes four unsafe paths:
--   1. retrying an insert could duplicate an answer/checkpoint;
--   2. a practice reset deleted immutable completed assessments;
--   3. changing sign-in pictures left existing learner sessions active;
--   4. authenticated clients could bypass the verified deletion workflow with
--      direct DELETE statements (including deleting a class and cascading all
--      of its learners).

-- Idempotency keys are nullable so historical rows remain untouched.
alter table public.answers
  add column if not exists client_event_id text;

create unique index if not exists answers_teacher_client_event_key
  on public.answers (teacher_id, client_event_id)
  where client_event_id is not null;

alter table public.mastery
  add column if not exists checkpoint_id text;

create unique index if not exists mastery_teacher_checkpoint_key
  on public.mastery (teacher_id, checkpoint_id)
  where checkpoint_id is not null;

-- A one-way learner tombstone prevents a late browser request from recreating
-- an orphaned assessment/report after the deletion transaction releases its
-- table locks. The raw learner UUID is never retained.
create table if not exists public.learner_deletion_tombstones (
  subject_hash text primary key
    check (subject_hash ~ '^[0-9a-f]{64}$'),
  request_id uuid not null
    references public.data_rights_requests(id) on delete restrict,
  deleted_at timestamptz not null default now()
);

alter table public.learner_deletion_tombstones enable row level security;
revoke all on public.learner_deletion_tombstones from public, anon, authenticated;

create or replace function public.reject_deleted_learner_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb := to_jsonb(new);
  v_student_id text := nullif(btrim(v_row ->> 'student_id'), '');
  v_document text := concat_ws(
    ' ',
    coalesce(v_student_id, ''),
    coalesce(v_row -> 'payload', '{}'::jsonb)::text,
    coalesce(v_row -> 'summary', '{}'::jsonb)::text,
    coalesce(v_row -> 'raw_evidence', '{}'::jsonb)::text
  );
  v_match text[];
  v_candidate text;
begin
  -- Individual evidence must always point to a learner that still exists.
  if v_student_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     and not exists (
       select 1
       from public.students s
       where s.id::text = lower(v_student_id)
     )
  then
    raise exception using
      errcode = '23503',
      message = 'Assessment evidence cannot be saved for a learner that no longer exists.';
  end if;

  -- Shared report JSON can contain many identifiers. Compare every UUID-shaped
  -- value with the one-way deletion tombstones; unrelated class/report/teacher
  -- identifiers do not match and are left untouched.
  for v_match in
    select regexp_matches(
      v_document,
      '([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})',
      'gi'
    )
  loop
    v_candidate := lower(v_match[1]);
    if exists (
      select 1
      from public.learner_deletion_tombstones tombstone
      where tombstone.subject_hash = encode(
        extensions.digest(v_candidate, 'sha256'),
        'hex'
      )
    ) then
      raise exception using
        errcode = '23503',
        message = 'Assessment evidence contains a learner deletion tombstone.';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists assessment_attempts_reject_deleted_learner
  on public.assessment_attempts;
create trigger assessment_attempts_reject_deleted_learner
before insert or update on public.assessment_attempts
for each row execute function public.reject_deleted_learner_evidence();

drop trigger if exists el_assessment_reports_reject_deleted_learner
  on public.el_assessment_reports;
create trigger el_assessment_reports_reject_deleted_learner
before insert or update on public.el_assessment_reports
for each row execute function public.reject_deleted_learner_evidence();


-- Reset current/derived progress atomically while retaining historical answers,
-- completed assessment attempts, reports, activity, and observations.
create or replace function public.teacher_reset_student_progress(
  p_student_id uuid,
  p_reset_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_reset_at timestamptz := coalesce(p_reset_at, now());
  v_mastery_count integer := 0;
  v_item_mastery_count integer := 0;
  v_progress_count integer := 0;
  v_session_count integer := 0;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select s.*
    into v_student
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update of s;

  if not found then
    raise exception using errcode = 'P0002', message = 'The student was not found or is not available to this account.';
  end if;

  delete from public.mastery m
  where m.student_id = v_student.id;
  get diagnostics v_mastery_count = row_count;

  delete from public.item_mastery im
  where im.student_id = v_student.id;
  get diagnostics v_item_mastery_count = row_count;

  delete from public.student_progress sp
  where sp.student_id = v_student.id
    and sp.area not in ('profile', 'guided_reading', 'story_quests');
  get diagnostics v_progress_count = row_count;

  -- A signed-in learner could otherwise replay stale device progress after the
  -- reset transaction commits. A fresh sign-in is deliberately required.
  update public.student_sessions ss
     set revoked = true
   where ss.student_id = v_student.id
     and ss.revoked = false;
  get diagnostics v_session_count = row_count;

  insert into public.student_progress (
    student_id,
    area,
    key,
    payload,
    updated_at
  )
  values (
    v_student.id,
    '__reset__',
    '__reset__',
    jsonb_build_object(
      'at', v_reset_at,
      'schemaVersion', 2,
      'formalEvidenceRetained', true,
      'learnerProfileRetained', true,
      'guidedReadingRetained', true,
      'storyQuestRetained', true
    ),
    v_reset_at
  )
  on conflict (student_id, area, key)
  do update set
    payload = excluded.payload,
    updated_at = excluded.updated_at;

  return jsonb_build_object(
    'ok', true,
    'studentId', v_student.id,
    'resetAt', v_reset_at,
    'formalEvidenceRetained', true,
    'learnerProfileRetained', true,
    'guidedReadingRetained', true,
    'storyQuestRetained', true,
    'deleted', jsonb_build_object(
      'mastery', v_mastery_count,
      'itemMastery', v_item_mastery_count,
      'practiceProgress', v_progress_count
    ),
    'sessionsRevoked', v_session_count
  );
end;
$$;

comment on function public.teacher_reset_student_progress(uuid, timestamptz) is
  'Atomically resets derived practice progress, retains the learner profile, Guided Reading, Story Quest and immutable completed assessment evidence, writes a cross-device reset marker, and revokes learner sessions.';

revoke all on function public.teacher_reset_student_progress(uuid, timestamptz)
  from public, anon;
grant execute on function public.teacher_reset_student_progress(uuid, timestamptz)
  to authenticated;


-- Credential changes and session revocation are one transaction.
create or replace function public.teacher_set_student_symbol_password(
  p_student_id uuid,
  p_sequence text,
  p_set_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_session_count integer := 0;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if p_sequence is not null and p_sequence !~ '^[1-9]{3}$' then
    raise exception using errcode = '22023', message = 'The sign-in picture sequence is invalid.';
  end if;

  select s.*
    into v_student
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update of s;

  if not found then
    raise exception using errcode = 'P0002', message = 'The student was not found or is not available to this account.';
  end if;

  update public.students s
     set symbol_password = p_sequence,
         password_set_at = case when p_sequence is null then null else coalesce(p_set_at, now()) end,
         password_updated_by = v_actor_id,
         failed_login_count = 0,
         last_failed_login_at = null,
         updated_at = now()
   where s.id = v_student.id;

  update public.student_sessions ss
     set revoked = true
   where ss.student_id = v_student.id
     and ss.revoked = false;
  get diagnostics v_session_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'studentId', v_student.id,
    'passwordConfigured', p_sequence is not null,
    'sessionsRevoked', v_session_count
  );
end;
$$;

comment on function public.teacher_set_student_symbol_password(uuid, text, timestamptz) is
  'Changes or resets a learner picture credential after ownership checks and revokes every active learner session in the same transaction.';

revoke all on function public.teacher_set_student_symbol_password(uuid, text, timestamptz)
  from public, anon;
grant execute on function public.teacher_set_student_symbol_password(uuid, text, timestamptz)
  to authenticated;


-- Generated report files may be removed by their owner, but only through a
-- named operation. Immutable assessment attempts are not touched.
create or replace function public.teacher_delete_saved_assessment_report(
  p_report_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  delete from public.el_assessment_reports er
   where er.report_id = p_report_id
     and (
       er.teacher_id::text = v_actor_id::text
       or public.is_app_admin(v_actor_id)
     );
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    raise exception using errcode = 'P0002', message = 'The saved report was not found or is not available to this account.';
  end if;

  return jsonb_build_object('ok', true, 'reportId', p_report_id);
end;
$$;

revoke all on function public.teacher_delete_saved_assessment_report(text)
  from public, anon;
grant execute on function public.teacher_delete_saved_assessment_report(text)
  to authenticated;


-- A class can be removed only after every learner has been transferred or
-- erased through the verified learner lifecycle.
create or replace function public.teacher_delete_empty_class(
  p_class_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_class public.classes;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select c.*
    into v_class
  from public.classes c
  where c.id = p_class_id
    and (
      c.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'The class was not found or is not available to this account.';
  end if;

  if exists (select 1 from public.students s where s.class_id = v_class.id) then
    raise exception using
      errcode = '23503',
      message = 'The class still has students. Transfer or delete each student through the verified learner workflow first.';
  end if;

  delete from public.classes c where c.id = v_class.id;
  return jsonb_build_object('ok', true, 'classId', v_class.id);
end;
$$;

revoke all on function public.teacher_delete_empty_class(uuid)
  from public, anon;
grant execute on function public.teacher_delete_empty_class(uuid)
  to authenticated;


-- Direct deletes can bypass request verification, audit logging, residual
-- checks, session revocation, and shared-report redaction. Reads and normal
-- inserts/updates retain their existing RLS policies; only deletion authority
-- is narrowed to the security-definer operations above.
revoke delete on public.classes from authenticated;
revoke delete on public.students from authenticated;
revoke delete on public.answers from authenticated;
revoke delete on public.mastery from authenticated;
revoke delete on public.item_mastery from authenticated;
revoke delete on public.assessment_attempts from authenticated;
revoke delete on public.el_assessment_reports from authenticated;
revoke delete on public.student_progress from authenticated;
revoke delete on public.learn_activity from authenticated;


-- ---------------------------------------------------------------------------
-- Two-phase learner deletion for browser-driven privacy requests.
--
-- Active-system deletion remains one database transaction, but the request is
-- not marked completed until the browser has cleared and verified its local
-- caches. The old RPC remains as a private, server-side wrapper for the
-- retention job, which has no browser-local phase.

-- Observation and group-review rows are normally append-only. A verified
-- privacy deletion is the sole exception: while the deletion transaction holds
-- SHARE ROW EXCLUSIVE locks, it may remove the subject from a shared row so
-- classmates' evidence is not destroyed. Direct browser roles do not have
-- UPDATE privileges on either table.
drop trigger if exists teacher_insight_observations_validate
  on public.teacher_insight_observations;
drop trigger if exists teacher_insight_observations_validate_insert
  on public.teacher_insight_observations;
drop trigger if exists teacher_insight_observations_validate_update
  on public.teacher_insight_observations;
create trigger teacher_insight_observations_validate_insert
  before insert on public.teacher_insight_observations
  for each row execute function public.validate_teacher_insight_observation();
create trigger teacher_insight_observations_validate_update
  before update on public.teacher_insight_observations
  for each row
  when (
    current_setting(
      'literacy_path.verified_learner_deletion_redaction',
      true
    ) is distinct from 'on'
  )
  execute function public.validate_teacher_insight_observation();

drop trigger if exists teacher_instructional_group_reviews_validate
  on public.teacher_instructional_group_reviews;
drop trigger if exists teacher_instructional_group_reviews_validate_insert
  on public.teacher_instructional_group_reviews;
drop trigger if exists teacher_instructional_group_reviews_validate_update
  on public.teacher_instructional_group_reviews;
create trigger teacher_instructional_group_reviews_validate_insert
  before insert on public.teacher_instructional_group_reviews
  for each row execute function public.validate_teacher_instructional_group_review();
create trigger teacher_instructional_group_reviews_validate_update
  before update on public.teacher_instructional_group_reviews
  for each row
  when (
    current_setting(
      'literacy_path.verified_learner_deletion_redaction',
      true
    ) is distinct from 'on'
  )
  execute function public.validate_teacher_instructional_group_review();

revoke insert, update, delete on public.teacher_insight_observations
  from anon, authenticated;
revoke insert, update, delete on public.teacher_instructional_group_reviews
  from anon, authenticated;

-- Free-text attached to a shared intervention must not retain the deleted
-- learner's display name or immutable id. Scan only the original source
-- chunks so a learner called "Learner" cannot make the replacement marker
-- recursively match itself.
create or replace function public.redact_learner_free_text(
  p_value text,
  p_student_id uuid,
  p_student_name text
)
returns text
language plpgsql
immutable
parallel safe
set search_path = public
as $$
declare
  v_source text := coalesce(p_value, '');
  v_result text := '';
  v_match integer;
  v_name text := btrim(coalesce(p_student_name, ''));
  v_marker constant text := '[removed learner]';
begin
  if p_value is null then
    return null;
  end if;

  if v_name <> '' then
    loop
      v_match := strpos(lower(v_source), lower(v_name));
      if v_match = 0 then
        v_result := v_result || v_source;
        exit;
      end if;
      v_result := v_result
        || left(v_source, v_match - 1)
        || v_marker;
      v_source := substring(
        v_source
        from v_match + char_length(v_name)
      );
    end loop;
  else
    v_result := v_source;
  end if;

  if p_student_id is not null then
    v_result := replace(v_result, p_student_id::text, v_marker);
  end if;
  return v_result;
end;
$$;

revoke all on function public.redact_learner_free_text(text, uuid, text)
  from public, anon, authenticated;

create or replace function public.perform_verified_learner_deletion(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text,
  p_finalize boolean
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
  v_deleted_count integer;
  v_redacted_count integer;
  v_redacted_intervention_ids uuid[] := '{}'::uuid[];
  v_database_deleted_at timestamptz := now();
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

  insert into public.learner_deletion_tombstones (
    subject_hash,
    request_id,
    deleted_at
  )
  values (
    encode(extensions.digest(v_student.id::text, 'sha256'), 'hex'),
    v_request.id,
    v_database_deleted_at
  )
  on conflict (subject_hash) do nothing;

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
    jsonb_build_object('schemaVersion', 2)
  );

  perform set_config(
    'literacy_path.verified_learner_deletion_redaction',
    'on',
    true
  );

  update public.teacher_insight_observations io
     set student_ids = array_remove(io.student_ids, v_student.id)
   where v_student.id = any(io.student_ids)
     and cardinality(io.student_ids) > 1;
  get diagnostics v_redacted_count = row_count;

  update public.teacher_instructional_group_reviews gr
     set student_ids = array_remove(gr.student_ids, v_student.id),
         evidence_snapshot = jsonb_set(
           jsonb_set(
             gr.evidence_snapshot,
             '{memberCount}',
             to_jsonb(cardinality(array_remove(gr.student_ids, v_student.id))),
             true
           ),
           '{policyReadyMembers}',
           to_jsonb(
             least(
               coalesce(
                 (gr.evidence_snapshot ->> 'policyReadyMembers')::integer,
                 0
               ),
               cardinality(array_remove(gr.student_ids, v_student.id))
             )
           ),
           true
         )
   where v_student.id = any(gr.student_ids)
     and cardinality(gr.student_ids) > 1;
  get diagnostics v_count = row_count;

  perform set_config(
    'literacy_path.verified_learner_deletion_redaction',
    'off',
    true
  );

  delete from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids);
  get diagnostics v_deleted_count = row_count;
  v_counts := v_counts || jsonb_build_object(
    'teacherObservations',
    v_redacted_count + v_deleted_count,
    'teacherObservationsRedacted',
    v_redacted_count,
    'teacherObservationsDeleted',
    v_deleted_count
  );

  v_redacted_count := v_count;
  delete from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids);
  get diagnostics v_deleted_count = row_count;
  v_counts := v_counts || jsonb_build_object(
    'instructionalGroupReviews',
    v_redacted_count + v_deleted_count,
    'instructionalGroupReviewsRedacted',
    v_redacted_count,
    'instructionalGroupReviewsDeleted',
    v_deleted_count
  );

  -- A one-learner plan has no remaining educational subject after erasure, so
  -- retain no empty shell. Shared plans stay useful to classmates, but every
  -- free-text field is scrubbed as the target id is removed.
  delete from public.teacher_interventions ti
   where v_student.id = any(ti.student_ids)
     and cardinality(ti.student_ids) = 1;
  get diagnostics v_deleted_count = row_count;

  select coalesce(array_agg(ti.id), '{}'::uuid[])
    into v_redacted_intervention_ids
  from public.teacher_interventions ti
  where v_student.id = any(ti.student_ids)
    and cardinality(ti.student_ids) > 1;

  update public.teacher_interventions ti
     set student_ids = array_remove(ti.student_ids, v_student.id),
         owner_label = public.redact_learner_free_text(
           ti.owner_label,
           v_student.id,
           v_student.name
         ),
         group_label = public.redact_learner_free_text(
           ti.group_label,
           v_student.id,
           v_student.name
         ),
         focus = public.redact_learner_free_text(
           ti.focus,
           v_student.id,
           v_student.name
         ),
         activity = public.redact_learner_free_text(
           ti.activity,
           v_student.id,
           v_student.name
         ),
         outcome_note = public.redact_learner_free_text(
           ti.outcome_note,
           v_student.id,
           v_student.name
         )
   where ti.id = any(v_redacted_intervention_ids);
  get diagnostics v_redacted_count = row_count;
  v_counts := v_counts || jsonb_build_object(
    'interventions',
    v_deleted_count + v_redacted_count,
    'interventionsDeleted',
    v_deleted_count,
    'interventionsRedacted',
    v_redacted_count
  );

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
    select 1
    from public.teacher_interventions ti
    where ti.id = any(v_redacted_intervention_ids)
      and (
        lower(concat_ws(
          ' ',
          ti.owner_label,
          ti.group_label,
          ti.focus,
          ti.activity,
          ti.outcome_note
        )) like '%' || lower(v_student.name) || '%'
        or concat_ws(
          ' ',
          ti.owner_label,
          ti.group_label,
          ti.focus,
          ti.activity,
          ti.outcome_note
        ) like '%' || p_student_id::text || '%'
      )
    union all
    select 1 from public.teacher_instructional_group_reviews gr where p_student_id = any(gr.student_ids)
    union all
    select 1 from public.teacher_insight_observations io where p_student_id = any(io.student_ids)
  ) then
    raise exception 'Learner deletion verification found residual managed records';
  end if;

  v_counts := v_counts || jsonb_build_object(
    'databaseDeleted', true,
    'databaseDeletedAt', v_database_deleted_at,
    'residualManagedRecords', 0
  );

  if p_finalize then
    update public.data_rights_requests
       set status = 'completed',
           completed_at = v_database_deleted_at,
           outcome_counts = v_counts,
           updated_at = v_database_deleted_at
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
        'schemaVersion', 2,
        'residualManagedRecords', 0,
        'completionMode', 'server_retention'
      )
    );

    return jsonb_build_object(
      'requestId', v_request.id,
      'subjectRef', v_expected_ref,
      'status', 'completed',
      'completedAt', v_database_deleted_at,
      'deletedCounts', v_counts,
      'residualManagedRecords', 0
    );
  end if;

  update public.data_rights_requests
     set outcome_counts = v_counts,
         updated_at = v_database_deleted_at
   where id = v_request.id;

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_expected_ref,
    'status', 'awaiting_local_cleanup',
    'databaseDeletedAt', v_database_deleted_at,
    'deletedCounts', v_counts,
    'residualManagedRecords', 0
  );
end;
$$;

create or replace function public.teacher_delete_learner_data(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.perform_verified_learner_deletion(
    p_request_id,
    p_student_id,
    p_subject_ref,
    p_confirmation,
    true
  );
$$;

create or replace function public.teacher_delete_learner_data_staged(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.perform_verified_learner_deletion(
    p_request_id,
    p_student_id,
    p_subject_ref,
    p_confirmation,
    false
  );
$$;

drop function if exists public.teacher_complete_learner_deletion(uuid, text);

create or replace function public.teacher_complete_learner_deletion(
  p_request_id uuid,
  p_subject_ref text,
  p_cleanup_proof jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request public.data_rights_requests;
  v_completed_at timestamptz := now();
  v_checked_at timestamptz;
  v_proof_student_id uuid;
  v_store_count integer;
  v_distinct_store_count integer;
  v_required_stores constant text[] := array[
    'assessment_attempts',
    'assessment_write_queue',
    'el_benchmark_drafts',
    'el_reports',
    'guided_reading_assessment',
    'manual_assessment_drafts',
    'progress',
    'student_session',
    'teacher_profile'
  ];
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select dr.*
    into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = p_subject_ref
    and dr.request_type = 'deletion'
    and dr.verification_status = 'verified'
    and (
      dr.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The verified deletion request was not found or is not available to this account.';
  end if;

  if jsonb_typeof(p_cleanup_proof) is distinct from 'object'
     or jsonb_typeof(p_cleanup_proof -> 'schemaVersion') is distinct from 'number'
     or (p_cleanup_proof ->> 'schemaVersion')::integer <> 1
     or p_cleanup_proof ->> 'subjectRef' is distinct from v_request.subject_ref
     or p_cleanup_proof -> 'storageAvailable' is distinct from 'true'::jsonb
     or jsonb_typeof(p_cleanup_proof -> 'residualCount') is distinct from 'number'
     or (p_cleanup_proof ->> 'residualCount')::integer <> 0
     or jsonb_typeof(p_cleanup_proof -> 'storesChecked') is distinct from 'array'
  then
    raise exception using
      errcode = '22023',
      message = 'A complete browser-local cleanup proof is required.';
  end if;

  begin
    v_checked_at := (p_cleanup_proof ->> 'checkedAt')::timestamptz;
    v_proof_student_id := (p_cleanup_proof ->> 'studentId')::uuid;
  exception
    when others then
      raise exception using
        errcode = '22023',
        message = 'The browser-local cleanup proof is malformed.';
  end;

  if v_checked_at < v_completed_at - interval '30 minutes'
     or v_checked_at > v_completed_at + interval '5 minutes'
     or not exists (
       select 1
       from public.learner_deletion_tombstones tombstone
       where tombstone.request_id = v_request.id
         and tombstone.subject_hash = encode(
           extensions.digest(v_proof_student_id::text, 'sha256'),
           'hex'
         )
     )
  then
    raise exception using
      errcode = '22023',
      message = 'The browser-local cleanup proof does not match this deletion.';
  end if;

  select count(*), count(distinct store_name)
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

  if v_request.status = 'completed' then
    return jsonb_build_object(
      'requestId', v_request.id,
      'subjectRef', v_request.subject_ref,
      'status', 'completed',
      'completedAt', v_request.completed_at,
      'residualManagedRecords', 0
    );
  end if;

  if v_request.status <> 'in_progress'
     or coalesce((v_request.outcome_counts ->> 'databaseDeleted')::boolean, false) is not true
     or coalesce((v_request.outcome_counts ->> 'residualManagedRecords')::integer, -1) <> 0
  then
    raise exception 'The database deletion phase has not been verified';
  end if;

  update public.data_rights_requests
     set status = 'completed',
         completed_at = v_completed_at,
         updated_at = v_completed_at
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
    v_request.teacher_id,
    v_actor_id,
    'deletion_completed',
    jsonb_build_object(
      'schemaVersion', 2,
      'residualManagedRecords', 0,
      'clientCleanupReported', true,
      'clientCleanupCheckedAt', v_checked_at,
      'clientCleanupStoreCount', v_store_count
    )
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_request.subject_ref,
    'status', 'completed',
    'completedAt', v_completed_at,
    'residualManagedRecords', 0,
    'clientCleanupReported', true
  );
end;
$$;

create or replace function public.teacher_get_learner_deletion_status(
  p_request_id uuid,
  p_subject_ref text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request public.data_rights_requests;
  v_database_deleted boolean;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select dr.*
    into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = p_subject_ref
    and dr.request_type = 'deletion'
    and (
      dr.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    );

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The deletion request was not found or is not available to this account.';
  end if;

  v_database_deleted := coalesce(
    (v_request.outcome_counts ->> 'databaseDeleted')::boolean,
    false
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_request.subject_ref,
    'status', case
      when v_request.status = 'completed' then 'completed'
      when v_database_deleted then 'awaiting_local_cleanup'
      else v_request.status
    end,
    'databaseDeleted', v_database_deleted,
    'residualManagedRecords', case
      when v_database_deleted
        then coalesce((v_request.outcome_counts ->> 'residualManagedRecords')::integer, -1)
      else null
    end,
    'completedAt', v_request.completed_at
  );
end;
$$;

comment on function public.teacher_delete_learner_data_staged(uuid, uuid, text, text) is
  'Deletes and verifies active-system learner data but leaves the request in progress until browser-local cleanup is verified.';
comment on function public.teacher_complete_learner_deletion(uuid, text, jsonb) is
  'Marks a staged learner deletion complete only after exact, recent browser-local cleanup evidence is supplied.';
comment on function public.teacher_get_learner_deletion_status(uuid, text) is
  'Returns privacy-safe staged deletion state so an interrupted browser can resume cleanup without retaining learner records.';

revoke all on function public.perform_verified_learner_deletion(uuid, uuid, text, text, boolean)
  from public, anon, authenticated;
revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.teacher_delete_learner_data_staged(uuid, uuid, text, text)
  from public, anon;
revoke all on function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  from public, anon;
revoke all on function public.teacher_get_learner_deletion_status(uuid, text)
  from public, anon;
grant execute on function public.teacher_delete_learner_data_staged(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  to authenticated;
grant execute on function public.teacher_get_learner_deletion_status(uuid, text)
  to authenticated;
