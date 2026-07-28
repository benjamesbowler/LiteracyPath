-- Keep learner data-rights exports and deletion complete after assessment
-- question reporting and shared teacher evidence were added.
--
-- This migration also makes the individual EL report truth explicit after a
-- learner transfer: the application report builder follows the stable learner
-- id, while the database package keeps the learner's current class as context.

-- The first free-text redactor treated an upper-case UUID as different from
-- the same lower-case UUID. UUIDs are identifiers, not case-sensitive words,
-- so scrub both display names and UUIDs without relying on their casing.
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
  v_before text;
  v_after text;
  v_marker constant text := '[removed learner]';
  v_name_character_pattern constant text := '[[:alnum:]_''’‑–-]';
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

      v_before := case
        when v_match > 1
        then substring(v_source from v_match - 1 for 1)
        else ''
      end;
      v_after := substring(
        v_source
        from v_match + char_length(v_name)
        for 1
      );

      -- Match the exact display-name token, not the same letters inside a
      -- classmate's name or an ordinary word (Ann must not alter Joanna or
      -- planning). Apostrophes, hyphens and underscores remain name
      -- characters so a short name cannot corrupt a longer compound name.
      if (v_before <> '' and v_before ~ v_name_character_pattern)
         or (v_after <> '' and v_after ~ v_name_character_pattern)
      then
        v_result := v_result || left(v_source, v_match);
        v_source := substring(v_source from v_match + 1);
        continue;
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
    v_result := regexp_replace(
      v_result,
      p_student_id::text,
      v_marker,
      'gi'
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.redact_learner_free_text(text, uuid, text)
  from public, anon, authenticated;

-- Recursively remove a learner from arbitrary JSON evidence. Identified
-- learner objects inside arrays are removed as units; other string values and
-- object keys are redacted. This preserves valid shared aggregate snapshots
-- without leaving the deleted learner's name or immutable id in nested JSON.
create or replace function public.redact_learner_jsonb(
  p_document jsonb,
  p_student_id uuid,
  p_student_name text
)
returns jsonb
language plpgsql
immutable
parallel safe
set search_path = public
as $$
declare
  v_type text;
begin
  if p_document is null then
    return null;
  end if;

  v_type := jsonb_typeof(p_document);

  if v_type = 'object' then
    return coalesce((
      select jsonb_object_agg(
        public.redact_learner_free_text(
          entry.key,
          p_student_id,
          p_student_name
        ),
        public.redact_learner_jsonb(
          entry.value,
          p_student_id,
          p_student_name
        )
      )
      from jsonb_each(p_document) entry
    ), '{}'::jsonb);
  end if;

  if v_type = 'array' then
    return coalesce((
      select jsonb_agg(
        public.redact_learner_jsonb(
          item.value,
          p_student_id,
          p_student_name
        )
        order by item.ordinality
      )
      from jsonb_array_elements(p_document)
        with ordinality as item(value, ordinality)
      where not (
        jsonb_typeof(item.value) = 'object'
        and exists (
          select 1
          from jsonb_each_text(item.value) identifier
          where (
            lower(identifier.key) in (
              'id',
              'studentid',
              'student_id',
              'learnerid',
              'learner_id'
            )
            and lower(identifier.value) = lower(p_student_id::text)
          )
          or (
            btrim(coalesce(p_student_name, '')) <> ''
            and lower(identifier.key) in (
              'name',
              'displayname',
              'display_name',
              'studentname',
              'student_name',
              'learnername',
              'learner_name'
            )
            and lower(btrim(identifier.value))
              = lower(btrim(p_student_name))
          )
        )
      )
    ), '[]'::jsonb);
  end if;

  if v_type = 'string' then
    return to_jsonb(public.redact_learner_free_text(
      p_document #>> '{}',
      p_student_id,
      p_student_name
    ));
  end if;

  return p_document;
end;
$$;

revoke all on function public.redact_learner_jsonb(jsonb, uuid, text)
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
  perform public.assert_current_actor_teacher_access();

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
    'schemaVersion', 2,
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
    'assessmentQuestionReports', coalesce((
      select jsonb_agg(to_jsonb(qr) order by qr.created_at, qr.id)
      from public.assessment_question_reports qr
      where qr.student_id = v_student.id
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
        case
          when cardinality(ti.student_ids) > 1 then
            jsonb_build_object(
              'id', ti.id,
              'classId', ti.class_id,
              'parentInterventionId', ti.parent_intervention_id,
              'instructionalGroupId', ti.instructional_group_id,
              'plannedFor', ti.planned_for,
              'status', ti.status,
              'deliveredAt', ti.delivered_at,
              'outcome', ti.outcome,
              'recordedAt', ti.recorded_at,
              'reviewedAt', ti.reviewed_at,
              'nextReviewOn', ti.next_review_on,
              'followUpRequired', ti.follow_up_required,
              'createdAt', ti.created_at,
              'updatedAt', ti.updated_at,
              'sharedRecord', true,
              'sharedPrivateTextWithheld', true
            )
          else to_jsonb(ti) - 'student_ids'
        end
        order by ti.created_at, ti.id
      )
      from public.teacher_interventions ti
      where v_student.id = any(ti.student_ids)
    ), '[]'::jsonb),
    'instructionalGroupReviews', coalesce((
      select jsonb_agg(
        case
          when cardinality(gr.student_ids) > 1 then
            jsonb_build_object(
              'reviewId', gr.id,
              'groupId', gr.group_id,
              'classId', gr.class_id,
              'reviewedAt', gr.reviewed_at,
              'createdAt', gr.created_at,
              'sharedRecord', true,
              'sharedPrivateTextWithheld', true,
              'evidenceSnapshot', jsonb_build_object(
                'schemaVersion', gr.evidence_snapshot -> 'schemaVersion',
                'memberCount', gr.evidence_snapshot -> 'memberCount',
                'policyReadyMembers',
                  gr.evidence_snapshot -> 'policyReadyMembers',
                'attempts', gr.evidence_snapshot -> 'attempts',
                'skillDiversity', gr.evidence_snapshot -> 'skillDiversity',
                'averageAccuracy',
                  gr.evidence_snapshot -> 'averageAccuracy',
                'supportRecorded',
                  gr.evidence_snapshot -> 'supportRecorded',
                'supportUsed', gr.evidence_snapshot -> 'supportUsed'
              )
            )
          else
            jsonb_build_object(
              'reviewId', gr.id,
              'groupId', gr.group_id,
              'classId', gr.class_id,
              'reviewedAt', gr.reviewed_at,
              'createdAt', gr.created_at,
              'evidenceSnapshot', gr.evidence_snapshot
            )
        end
        order by gr.reviewed_at, gr.id
      )
      from public.teacher_instructional_group_reviews gr
      where v_student.id = any(gr.student_ids)
    ), '[]'::jsonb),
    'teacherObservations', coalesce((
      select jsonb_agg(
        case
          when cardinality(io.student_ids) > 1 then
            jsonb_build_object(
              'id', io.id,
              'classId', io.class_id,
              'interventionId', io.intervention_id,
              'observedAt', io.observed_at,
              'createdAt', io.created_at,
              'sharedRecord', true,
              'sharedPrivateTextWithheld', true
            )
          else to_jsonb(io) - 'student_ids'
        end
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
      'schemaVersion', 2,
      'sections', jsonb_object_length(v_package)
    )
  );

  return v_package;
end;
$$;

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
  v_redacted_observation_ids uuid[] := '{}'::uuid[];
  v_redacted_review_ids uuid[] := '{}'::uuid[];
  v_database_deleted_at timestamptz := now();
begin
  perform public.assert_current_actor_teacher_access();

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
  lock table public.assessment_question_reports in share row exclusive mode;
  lock table public.el_assessment_reports in share row exclusive mode;
  lock table public.teacher_interventions in share row exclusive mode;
  lock table public.teacher_instructional_group_reviews
    in share row exclusive mode;
  lock table public.teacher_insight_observations
    in share row exclusive mode;

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
    jsonb_build_object('schemaVersion', 3)
  );

  select coalesce(array_agg(io.id), '{}'::uuid[])
    into v_redacted_observation_ids
  from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids)
    and cardinality(io.student_ids) > 1;

  select coalesce(array_agg(gr.id), '{}'::uuid[])
    into v_redacted_review_ids
  from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids)
    and cardinality(gr.student_ids) > 1;

  perform set_config(
    'literacy_path.verified_learner_deletion_redaction',
    'on',
    true
  );

  update public.teacher_insight_observations io
     set student_ids = array_remove(io.student_ids, v_student.id),
         note = public.redact_learner_free_text(
           io.note,
           v_student.id,
           v_student.name
         ),
         insight_snapshot = public.redact_learner_jsonb(
           io.insight_snapshot,
           v_student.id,
           v_student.name
         )
   where io.id = any(v_redacted_observation_ids);
  get diagnostics v_redacted_count = row_count;

  update public.teacher_instructional_group_reviews gr
     set student_ids = array_remove(gr.student_ids, v_student.id),
         evidence_snapshot = jsonb_set(
           jsonb_set(
             public.redact_learner_jsonb(
               gr.evidence_snapshot,
               v_student.id,
               v_student.name
             ),
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
   where gr.id = any(v_redacted_review_ids);
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
         cancel_reason = public.redact_learner_free_text(
           ti.cancel_reason,
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
  v_counts := v_counts || jsonb_build_object(
    'assessmentReportsRedacted',
    v_count
  );
  v_counts := v_counts || jsonb_build_object(
    'assessmentReports',
    (
      select count(*)
      from public.el_assessment_reports er
      where er.student_id = v_student.id::text
    )
  );

  delete from public.assessment_question_reports qr
  where qr.student_id = v_student.id;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object(
    'assessmentQuestionReports',
    v_count
  );

  delete from public.assessment_attempts aa
  where aa.student_id = v_student.id::text;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object(
    'assessmentAttempts',
    v_count
  );

  select
    v_counts || jsonb_build_object(
      'answers',
        (select count(*) from public.answers a
          where a.student_id = v_student.id),
      'mastery',
        (select count(*) from public.mastery m
          where m.student_id = v_student.id),
      'itemMastery',
        (select count(*) from public.item_mastery im
          where im.student_id = v_student.id),
      'progress',
        (select count(*) from public.student_progress sp
          where sp.student_id = v_student.id),
      'learningActivity',
        (select count(*) from public.learn_activity la
          where la.student_id = v_student.id),
      'syncHealth',
        (select count(*) from public.activity_sync_health sh
          where sh.student_id = v_student.id),
      'sessions',
        (select count(*) from public.student_sessions ss
          where ss.student_id = v_student.id)
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
    select 1 from public.answers a
      where a.student_id = p_student_id
    union all
    select 1 from public.mastery m
      where m.student_id = p_student_id
    union all
    select 1 from public.item_mastery im
      where im.student_id = p_student_id
    union all
    select 1 from public.student_progress sp
      where sp.student_id = p_student_id
    union all
    select 1 from public.learn_activity la
      where la.student_id = p_student_id
    union all
    select 1 from public.activity_sync_health sh
      where sh.student_id = p_student_id
    union all
    select 1 from public.student_sessions ss
      where ss.student_id = p_student_id
    union all
    select 1 from public.assessment_attempts aa
      where aa.student_id = p_student_id::text
    union all
    select 1 from public.assessment_question_reports qr
      where qr.student_id = p_student_id
    union all
    select 1 from public.el_assessment_reports er
      where er.student_id = p_student_id::text
        or er.payload::text like '%' || p_student_id::text || '%'
        or er.summary::text like '%' || p_student_id::text || '%'
    union all
    select 1 from public.teacher_interventions ti
      where p_student_id = any(ti.student_ids)
    union all
    select 1
    from public.teacher_interventions ti
    where ti.id = any(v_redacted_intervention_ids)
      and public.redact_learner_free_text(
        concat_ws(
          ' ',
          ti.owner_label,
          ti.group_label,
          ti.focus,
          ti.activity,
          ti.cancel_reason,
          ti.outcome_note
        ),
        p_student_id,
        v_student.name
      ) is distinct from concat_ws(
        ' ',
        ti.owner_label,
        ti.group_label,
        ti.focus,
        ti.activity,
        ti.cancel_reason,
        ti.outcome_note
      )
    union all
    select 1 from public.teacher_instructional_group_reviews gr
      where p_student_id = any(gr.student_ids)
    union all
    select 1
    from public.teacher_instructional_group_reviews gr
    where gr.id = any(v_redacted_review_ids)
      and public.redact_learner_jsonb(
        coalesce(gr.evidence_snapshot, '{}'::jsonb),
        p_student_id,
        v_student.name
      ) is distinct from coalesce(gr.evidence_snapshot, '{}'::jsonb)
    union all
    select 1 from public.teacher_insight_observations io
      where p_student_id = any(io.student_ids)
    union all
    select 1
    from public.teacher_insight_observations io
    where io.id = any(v_redacted_observation_ids)
      and (
        public.redact_learner_free_text(
          coalesce(io.note, ''),
          p_student_id,
          v_student.name
        ) is distinct from coalesce(io.note, '')
        or public.redact_learner_jsonb(
          coalesce(io.insight_snapshot, '{}'::jsonb),
          p_student_id,
          v_student.name
        ) is distinct from coalesce(io.insight_snapshot, '{}'::jsonb)
      )
  ) then
    raise exception
      'Learner deletion verification found residual managed records';
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
        'schemaVersion', 3,
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

comment on function public.teacher_export_learner_data(
  uuid, text, text
) is
  'Creates a tracked individual learner export, includes question reports, and withholds other learners'' unstructured content from shared teacher records.';

comment on function public.perform_verified_learner_deletion(
  uuid, uuid, text, text, boolean
) is
  'Deletes all subject-owned records, removes subject PII from retained shared evidence, and proves no managed residual remains.';

notify pgrst, 'reload schema';
