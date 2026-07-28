\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_teacher_id constant uuid := 'e9100000-0000-4000-8000-000000000001';
  v_school_id constant uuid := 'e9200000-0000-4000-8000-000000000001';
  v_class_id constant uuid := 'e9300000-0000-4000-8000-000000000001';
  v_deleted_student_id constant uuid := 'e9400000-0000-4000-8000-000000000001';
  v_retained_student_id constant uuid := 'e9400000-0000-4000-8000-000000000002';
  v_group_id constant uuid := 'e9500000-0000-4000-8000-000000000001';
  v_intervention_id constant uuid := 'e9600000-0000-4000-8000-000000000001';
  v_observation_id constant uuid := 'e9700000-0000-4000-8000-000000000001';
  v_review_id constant uuid := 'e9800000-0000-4000-8000-000000000001';
  v_question_report_id constant uuid := 'e9900000-0000-4000-8000-000000000001';
  v_export jsonb;
  v_prepared jsonb;
  v_result jsonb;
  v_shared_export text;
begin
  insert into auth.users (
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    v_teacher_id,
    'authenticated',
    'authenticated',
    'privacy-reporting-integrity@example.invalid',
    '{"audit_only": true}'::jsonb,
    now(),
    now()
  );

  insert into public.schools (id, name)
  values (v_school_id, 'Privacy reporting integrity school');

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    role,
    status,
    approval_status,
    school_id
  )
  values (
    v_teacher_id,
    'privacy-reporting-integrity@example.invalid',
    'teacher',
    'approved',
    'approved',
    v_school_id
  )
  on conflict (user_id) do update
  set role = excluded.role,
      status = excluded.status,
      approval_status = excluded.approval_status,
      school_id = excluded.school_id;

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  if public.redact_learner_free_text(
    'Ann planned with Joanna during planning. Ann checked again.',
    v_deleted_student_id,
    'Ann'
  ) is distinct from
    '[removed learner] planned with Joanna during planning. [removed learner] checked again.'
  then
    raise exception
      'display-name redaction corrupted a classmate name or ordinary word';
  end if;

  insert into public.classes (id, teacher_id, school_id, name)
  values (
    v_class_id,
    v_teacher_id,
    v_school_id,
    'Privacy reporting integrity class'
  );

  insert into public.students (id, teacher_id, class_id, name)
  values
    (
      v_deleted_student_id,
      v_teacher_id,
      v_class_id,
      'Ann'
    ),
    (
      v_retained_student_id,
      v_teacher_id,
      v_class_id,
      'Keep'
    );

  insert into public.teacher_instructional_groups (
    id,
    teacher_id,
    class_id,
    name,
    criteria
  )
  values (
    v_group_id,
    v_teacher_id,
    v_class_id,
    'Shared group',
    jsonb_build_object(
      'sourceId', 'sound:a',
      'kind', 'shared-exact-reteaching-evidence',
      'label', 'Initial sound a',
      'basis', 'Saved exact-item evidence',
      'policy', 'At least three independent attempts'
    )
  );

  insert into public.teacher_interventions (
    id,
    teacher_id,
    class_id,
    instructional_group_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    outcome_note
  )
  values (
    v_intervention_id,
    v_teacher_id,
    v_class_id,
    v_group_id,
    'Teacher for Ann and Keep',
    'Ann and Keep shared group',
    array[v_deleted_student_id, v_retained_student_id],
    'Ann and Keep practise initial sound a',
    'Ann uses ' || upper(v_deleted_student_id::text)
      || ' while Keep and Joanna sort cards during planning',
    current_date,
    'Keep and Ann need another turn after planning'
  );

  update public.teacher_interventions
  set status = 'cancelled',
      cancelled_at = now(),
      cancel_reason =
        'Ann ' || upper(v_deleted_student_id::text)
          || ' left before Keep and Joanna finished planning',
      cancelled_from_status = 'planned',
      follow_up_required = false
  where id = v_intervention_id;

  insert into public.teacher_instructional_group_reviews (
    id,
    group_id,
    teacher_id,
    class_id,
    student_ids,
    evidence_snapshot
  )
  values (
    v_review_id,
    v_group_id,
    v_teacher_id,
    v_class_id,
    array[v_deleted_student_id, v_retained_student_id],
    jsonb_build_object(
      'schemaVersion', 1,
      'capturedAt', '2026-07-28T00:00:00.000Z',
      'memberCount', 2,
      'policyReadyMembers', 2,
      'attempts', 8,
      'skillDiversity', 1,
      'latestEvidenceAt', '2026-07-28T00:00:00.000Z',
      'averageAccuracy', 75,
      'supportRecorded', 2,
      'supportUsed', 1,
      'teacherNote',
        'Ann ' || upper(v_deleted_student_id::text)
          || ' worked with Keep while Joanna continued planning',
      'members', jsonb_build_array(
        jsonb_build_object(
          'studentId', v_deleted_student_id,
          'name', 'Ann',
          'result', 'developing'
        ),
        jsonb_build_object(
          'studentId', v_retained_student_id,
          'name', 'Keep',
          'result', 'secure'
        )
      )
    )
  );

  insert into public.teacher_insight_observations (
    id,
    teacher_id,
    class_id,
    intervention_id,
    insight_snapshot,
    student_ids,
    note
  )
  values (
    v_observation_id,
    v_teacher_id,
    v_class_id,
    v_intervention_id,
    jsonb_build_object(
      'schemaVersion', 1,
      'key', 'sound:a',
      'kind', 'shared-exact-reteaching-evidence',
      'label', 'Initial sound a',
      'focus', 'Hear initial sound a',
      'reason', 'Ann and Keep shared turn while Joanna was planning',
      'evidence', jsonb_build_object(
        'members', jsonb_build_array(
          jsonb_build_object(
            'student_id', v_deleted_student_id,
            'displayName', 'Ann',
            'result', 'developing'
          ),
          jsonb_build_object(
            'student_id', v_retained_student_id,
            'displayName', 'Keep',
            'result', 'secure'
          )
        )
      )
    ),
    array[v_deleted_student_id, v_retained_student_id],
    'Keep observed Ann using ' || upper(v_deleted_student_id::text)
      || ' while Joanna was planning'
  );

  insert into public.assessment_question_reports (
    id,
    school_id,
    class_id,
    student_id,
    teacher_id,
    reporter_user_id,
    reporter_kind,
    flag_type,
    question_id,
    question_snapshot
  )
  values (
    v_question_report_id,
    v_school_id,
    v_class_id,
    v_deleted_student_id,
    v_teacher_id,
    v_teacher_id,
    'teacher',
    'question',
    'privacy-question',
    jsonb_build_object(
      'schemaVersion', 1,
      'questionId', 'privacy-question'
    )
  );

  v_export := public.teacher_export_learner_data(
    v_deleted_student_id,
    'school',
    'authorised_school_official'
  );

  if jsonb_array_length(v_export -> 'assessmentQuestionReports') <> 1 then
    raise exception
      'learner export omitted the subject assessment-question report: %',
      v_export;
  end if;

  v_shared_export := concat_ws(
    ' ',
    (v_export -> 'interventions')::text,
    (v_export -> 'instructionalGroupReviews')::text,
    (v_export -> 'teacherObservations')::text
  );

  if strpos(lower(v_shared_export), 'keep') > 0
     or strpos(
       lower(v_shared_export),
       lower(v_retained_student_id::text)
     ) > 0
  then
    raise exception
      'individual export exposed another learner through a shared record: %',
      v_shared_export;
  end if;

  if coalesce(
    (
      v_export
      -> 'teacherObservations'
      -> 0
      ->> 'sharedPrivateTextWithheld'
    )::boolean,
    false
  ) is not true then
    raise exception 'shared observation export did not declare withheld text';
  end if;

  v_prepared := public.teacher_prepare_learner_deletion(
    v_deleted_student_id,
    'school',
    'authorised_school_official'
  );
  v_result := public.teacher_delete_learner_data_staged(
    (v_prepared ->> 'requestId')::uuid,
    v_deleted_student_id,
    v_prepared ->> 'subjectRef',
    'DELETE LEARNER DATA'
  );

  if v_result ->> 'status' is distinct from 'awaiting_local_cleanup'
     or (v_result ->> 'residualManagedRecords')::integer <> 0
  then
    raise exception 'verified deletion did not prove zero residual: %', v_result;
  end if;

  if (
    v_result
    -> 'deletedCounts'
    ->> 'assessmentQuestionReports'
  )::integer is distinct from 1 then
    raise exception
      'question-report deletion count is incomplete: %',
      v_result;
  end if;

  if exists (
    select 1
    from public.assessment_question_reports
    where id = v_question_report_id
       or student_id = v_deleted_student_id
  ) then
    raise exception
      'assessment-question report was orphaned instead of deleted';
  end if;

  if (
    select student_ids
    from public.teacher_interventions
    where id = v_intervention_id
  ) is distinct from array[v_retained_student_id]
     or (
       select student_ids
       from public.teacher_instructional_group_reviews
       where id = v_review_id
     ) is distinct from array[v_retained_student_id]
     or (
       select student_ids
       from public.teacher_insight_observations
       where id = v_observation_id
     ) is distinct from array[v_retained_student_id]
  then
    raise exception 'shared rows did not retain only the classmate';
  end if;

  if exists (
    select 1
    from public.teacher_interventions intervention
    where intervention.id = v_intervention_id
      and public.redact_learner_free_text(
        concat_ws(
          ' ',
          intervention.owner_label,
          intervention.group_label,
          intervention.focus,
          intervention.activity,
          intervention.cancel_reason,
          intervention.outcome_note
        ),
        v_deleted_student_id,
        'Ann'
      ) is distinct from concat_ws(
        ' ',
        intervention.owner_label,
        intervention.group_label,
        intervention.focus,
        intervention.activity,
        intervention.cancel_reason,
        intervention.outcome_note
      )
  ) then
    raise exception 'shared intervention retained deleted learner PII';
  end if;

  if exists (
    select 1
    from public.teacher_instructional_group_reviews review
    where review.id = v_review_id
      and public.redact_learner_jsonb(
        review.evidence_snapshot,
        v_deleted_student_id,
        'Ann'
      ) is distinct from review.evidence_snapshot
  ) then
    raise exception 'shared group review retained deleted learner PII';
  end if;

  if exists (
    select 1
    from public.teacher_insight_observations observation
    where observation.id = v_observation_id
      and (
        public.redact_learner_free_text(
          coalesce(observation.note, ''),
          v_deleted_student_id,
          'Ann'
        ) is distinct from coalesce(observation.note, '')
        or public.redact_learner_jsonb(
          coalesce(observation.insight_snapshot, '{}'::jsonb),
          v_deleted_student_id,
          'Ann'
        ) is distinct from coalesce(
          observation.insight_snapshot,
          '{}'::jsonb
        )
      )
  ) then
    raise exception 'shared observation retained deleted learner PII';
  end if;

  if not exists (
    select 1
    from public.teacher_interventions intervention
    where intervention.id = v_intervention_id
      and strpos(
        lower(concat_ws(
          ' ',
          intervention.activity,
          intervention.cancel_reason,
          intervention.outcome_note
        )),
        'joanna'
      ) > 0
      and strpos(
        lower(concat_ws(
          ' ',
          intervention.activity,
          intervention.cancel_reason,
          intervention.outcome_note
        )),
        'planning'
      ) > 0
  ) then
    raise exception
      'exact-name redaction corrupted Joanna or the word planning';
  end if;

  if (
    select jsonb_array_length(evidence_snapshot -> 'members')
    from public.teacher_instructional_group_reviews
    where id = v_review_id
  ) is distinct from 1 then
    raise exception
      'deleted learner entry was not removed from nested shared evidence';
  end if;
end
$test$;

rollback;
