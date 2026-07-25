-- Verified learner data-rights export and deletion.
--
-- Requests and audit events deliberately retain no learner name, raw learner
-- ID, credential, answer, or report content. The irreversible subject_ref lets
-- an authorised requester prove that the requested learner was handled without
-- leaving the deleted identity in the audit trail.

create table if not exists public.data_rights_requests (
  id uuid primary key default gen_random_uuid(),
  subject_ref text not null check (subject_ref ~ '^[0-9a-f]{64}$'),
  -- These opaque ownership identifiers intentionally have no cascading
  -- foreign keys. A class or account deletion must not erase the evidence
  -- that a data-rights request was handled.
  teacher_id uuid not null,
  class_id uuid not null,
  school_id uuid references public.schools(id) on delete set null,
  request_type text not null
    check (request_type in ('access_export', 'correction', 'deletion', 'restriction')),
  requester_role text not null
    check (requester_role in ('school', 'parent_guardian', 'learner')),
  verification_method text not null
    check (verification_method in (
      'school_record_match',
      'verified_parent_via_school',
      'authorised_school_official'
    )),
  verification_status text not null default 'verified'
    check (verification_status in ('pending', 'verified', 'rejected')),
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'completed', 'rejected')),
  due_at timestamptz not null,
  completed_at timestamptz,
  outcome_counts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(outcome_counts) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists data_rights_requests_teacher_created_idx
  on public.data_rights_requests (teacher_id, created_at desc);
create index if not exists data_rights_requests_due_idx
  on public.data_rights_requests (status, due_at)
  where status in ('received', 'in_progress');
create index if not exists data_rights_requests_subject_idx
  on public.data_rights_requests (subject_ref, created_at desc);

create table if not exists public.data_rights_audit_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.data_rights_requests(id) on delete cascade,
  teacher_id uuid not null,
  actor_id uuid not null,
  event_type text not null
    check (event_type in (
      'request_verified',
      'export_completed',
      'deletion_started',
      'deletion_completed',
      'request_rejected'
    )),
  event_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(details) = 'object'
      and octet_length(details::text) <= 4096
    )
);

create index if not exists data_rights_audit_request_time_idx
  on public.data_rights_audit_events (request_id, event_at, id);
create index if not exists data_rights_audit_teacher_time_idx
  on public.data_rights_audit_events (teacher_id, event_at desc);

alter table public.data_rights_requests enable row level security;
alter table public.data_rights_audit_events enable row level security;

revoke all on public.data_rights_requests from anon, authenticated;
revoke all on public.data_rights_audit_events from anon, authenticated;
grant select on public.data_rights_requests to authenticated;
grant select on public.data_rights_audit_events to authenticated;

drop policy if exists "Teachers read owned data rights requests"
  on public.data_rights_requests;
create policy "Teachers read owned data rights requests"
  on public.data_rights_requests for select to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists "Teachers read owned data rights audit events"
  on public.data_rights_audit_events;
create policy "Teachers read owned data rights audit events"
  on public.data_rights_audit_events for select to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()));

create or replace function public.data_rights_subject_ref(
  p_student_id uuid,
  p_created_at timestamptz
)
returns text
language sql
immutable
strict
set search_path = public, extensions
as $$
  select encode(
    digest(
      convert_to(p_student_id::text || ':' || p_created_at::text, 'utf8'),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.data_rights_subject_ref(uuid, timestamptz)
  from public, anon, authenticated;

create or replace function public.assert_learner_data_rights_actor(
  p_student_id uuid
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required';
  end if;

  select s.*
  into v_student
  from public.students s
  where s.id = p_student_id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update;

  if not found then
    raise exception 'An owned learner was not found';
  end if;

  return v_student;
end;
$$;

revoke all on function public.assert_learner_data_rights_actor(uuid)
  from public, anon, authenticated;

create or replace function public.assert_data_rights_request_inputs(
  p_requester_role text,
  p_verification_method text
)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_requester_role is null
    or p_requester_role not in ('school', 'parent_guardian', 'learner')
  then
    raise exception 'A supported requester role is required';
  end if;

  if p_verification_method is null
    or p_verification_method not in (
      'school_record_match',
      'verified_parent_via_school',
      'authorised_school_official'
    )
  then
    raise exception 'A supported identity verification method is required';
  end if;
end;
$$;

revoke all on function public.assert_data_rights_request_inputs(text, text)
  from public, anon, authenticated;

create or replace function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_class public.classes;
  v_subject_ref text;
  v_request public.data_rights_requests;
  v_package jsonb;
begin
  perform public.assert_data_rights_request_inputs(
    p_requester_role,
    p_verification_method
  );
  v_student := public.assert_learner_data_rights_actor(p_student_id);

  select c.*
  into strict v_class
  from public.classes c
  where c.id = v_student.class_id;

  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  insert into public.data_rights_requests (
    subject_ref,
    teacher_id,
    class_id,
    school_id,
    request_type,
    requester_role,
    verification_method,
    verification_status,
    status,
    due_at,
    completed_at
  )
  values (
    v_subject_ref,
    v_student.teacher_id,
    v_student.class_id,
    v_class.school_id,
    'access_export',
    p_requester_role,
    p_verification_method,
    'verified',
    'completed',
    now() + interval '30 days',
    now()
  )
  returning * into v_request;

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
    'request_verified',
    jsonb_build_object('requestType', 'access_export')
  );

  v_package := jsonb_build_object(
    'schemaVersion', 1,
    'request', jsonb_build_object(
      'id', v_request.id,
      'subjectRef', v_subject_ref,
      'requestType', v_request.request_type,
      'requesterRole', v_request.requester_role,
      'verificationMethod', v_request.verification_method,
      'status', v_request.status,
      'dueAt', v_request.due_at,
      'createdAt', v_request.created_at,
      'completedAt', v_request.completed_at,
      'responseTargetDays', 30
    ),
    'learner', jsonb_build_object(
      'id', v_student.id,
      'displayName', v_student.name,
      'classId', v_student.class_id,
      'className', v_class.name,
      'teacherId', v_student.teacher_id,
      'archivedAt', v_student.archived_at,
      'createdAt', v_student.created_at,
      'updatedAt', v_student.updated_at,
      'pictureCredentialConfigured',
        nullif(btrim(coalesce(v_student.symbol_password, '')), '') is not null
    ),
    'answers', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.answered_at, a.id)
      from public.answers a
      where a.student_id = v_student.id
    ), '[]'::jsonb),
    'mastery', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.updated_at, m.id)
      from public.mastery m
      where m.student_id = v_student.id
    ), '[]'::jsonb),
    'itemMastery', coalesce((
      select jsonb_agg(to_jsonb(im) order by im.updated_at, im.id)
      from public.item_mastery im
      where im.student_id = v_student.id
    ), '[]'::jsonb),
    'progress', coalesce((
      select jsonb_agg(to_jsonb(sp) order by sp.updated_at, sp.id)
      from public.student_progress sp
      where sp.student_id = v_student.id
    ), '[]'::jsonb),
    'learningActivity', coalesce((
      select jsonb_agg(to_jsonb(la) order by la.created_at, la.id)
      from public.learn_activity la
      where la.student_id = v_student.id
    ), '[]'::jsonb),
    'syncHealth', coalesce((
      select jsonb_agg(
        to_jsonb(sh) - 'device_id'
        order by sh.observed_at, sh.student_id
      )
      from public.activity_sync_health sh
      where sh.student_id = v_student.id
    ), '[]'::jsonb),
    'assessmentAttempts', coalesce((
      select jsonb_agg(to_jsonb(aa) order by aa.completed_at, aa.attempt_id)
      from public.assessment_attempts aa
      where aa.student_id = v_student.id::text
    ), '[]'::jsonb),
    'individualReports', coalesce((
      select jsonb_agg(to_jsonb(er) order by er.generated_at, er.report_id)
      from public.el_assessment_reports er
      where er.student_id = v_student.id::text
    ), '[]'::jsonb),
    'classReportReferences', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reportId', er.report_id,
          'reportType', er.report_type,
          'generatedAt', er.generated_at,
          'schemaVersion', er.schema_version
        )
        order by er.generated_at, er.report_id
      )
      from public.el_assessment_reports er
      where er.teacher_id = v_student.teacher_id
        and (
          er.payload::text like '%' || v_student.id::text || '%'
          or er.summary::text like '%' || v_student.id::text || '%'
        )
    ), '[]'::jsonb),
    'interventions', coalesce((
      select jsonb_agg(
        to_jsonb(ti) - 'student_ids'
        order by ti.created_at, ti.id
      )
      from public.teacher_interventions ti
      where v_student.id = any(ti.student_ids)
    ), '[]'::jsonb),
    'instructionalGroupReviews', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reviewId', gr.id,
          'groupId', gr.group_id,
          'reviewedAt', gr.reviewed_at,
          'evidenceSnapshot', gr.evidence_snapshot
        )
        order by gr.reviewed_at, gr.id
      )
      from public.teacher_instructional_group_reviews gr
      where v_student.id = any(gr.student_ids)
    ), '[]'::jsonb),
    'teacherObservations', coalesce((
      select jsonb_agg(
        to_jsonb(io) - 'student_ids'
        order by io.observed_at, io.id
      )
      from public.teacher_insight_observations io
      where v_student.id = any(io.student_ids)
    ), '[]'::jsonb),
    'sessionHistory', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'createdAt', ss.created_at,
          'expiresAt', ss.expires_at,
          'revoked', ss.revoked
        )
        order by ss.created_at
      )
      from public.student_sessions ss
      where ss.student_id = v_student.id
    ), '[]'::jsonb)
  );

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
    'export_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'sections', jsonb_object_length(v_package)
    )
  );

  return v_package;
end;
$$;

create or replace function public.teacher_list_learner_data_rights(
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_subject_ref text;
begin
  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  return jsonb_build_object(
    'subjectRef', v_subject_ref,
    'requests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', dr.id,
          'requestType', dr.request_type,
          'requesterRole', dr.requester_role,
          'verificationMethod', dr.verification_method,
          'verificationStatus', dr.verification_status,
          'status', dr.status,
          'dueAt', dr.due_at,
          'completedAt', dr.completed_at,
          'createdAt', dr.created_at,
          'events', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'eventType', dae.event_type,
                'eventAt', dae.event_at
              )
              order by dae.event_at, dae.id
            )
            from public.data_rights_audit_events dae
            where dae.request_id = dr.id
          ), '[]'::jsonb)
        )
        order by dr.created_at desc, dr.id desc
      )
      from public.data_rights_requests dr
      where dr.subject_ref = v_subject_ref
        and (
          dr.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.teacher_prepare_learner_deletion(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_class public.classes;
  v_subject_ref text;
  v_request public.data_rights_requests;
begin
  perform public.assert_data_rights_request_inputs(
    p_requester_role,
    p_verification_method
  );
  v_student := public.assert_learner_data_rights_actor(p_student_id);

  select c.*
  into strict v_class
  from public.classes c
  where c.id = v_student.class_id;

  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  insert into public.data_rights_requests (
    subject_ref,
    teacher_id,
    class_id,
    school_id,
    request_type,
    requester_role,
    verification_method,
    verification_status,
    status,
    due_at
  )
  values (
    v_subject_ref,
    v_student.teacher_id,
    v_student.class_id,
    v_class.school_id,
    'deletion',
    p_requester_role,
    p_verification_method,
    'verified',
    'in_progress',
    now() + interval '30 days'
  )
  returning * into v_request;

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
    'request_verified',
    jsonb_build_object('requestType', 'deletion')
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_subject_ref,
    'status', v_request.status,
    'dueAt', v_request.due_at,
    'responseTargetDays', 30,
    'confirmationPhrase', 'DELETE LEARNER DATA'
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

  delete from public.el_assessment_reports er
  where er.student_id = v_student.id::text
    or er.payload::text like '%' || v_student.id::text || '%'
    or er.summary::text like '%' || v_student.id::text || '%';
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentReports', v_count);

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

grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;

revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon;
revoke all on function public.teacher_list_learner_data_rights(uuid)
  from public, anon;
revoke all on function public.teacher_prepare_learner_deletion(uuid, text, text)
  from public, anon;
revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon;

comment on table public.data_rights_requests is
  'Privacy-minimal access/correction/deletion/restriction request tracking with a 30-day operational response target.';
comment on table public.data_rights_audit_events is
  'Append-only actor/action audit events with no learner identity or record content.';
comment on function public.teacher_export_learner_data(uuid, text, text) is
  'Exports one owned learner record after an explicit identity-verification declaration and records completion.';
comment on function public.teacher_list_learner_data_rights(uuid) is
  'Lists the privacy-minimal request and event history for one currently owned learner.';
comment on function public.teacher_prepare_learner_deletion(uuid, text, text) is
  'Creates a verified, tracked learner deletion request and returns its irreversible subject reference.';
comment on function public.teacher_delete_learner_data(uuid, uuid, text, text) is
  'Atomically removes all managed learner records and embedded group references, then records a privacy-safe tombstone.';
