\set ON_ERROR_STOP on

begin;

do $test$
declare
  v_teacher_id constant uuid := 'f1000000-0000-4000-8000-000000000001';
  v_class_id constant uuid := 'f2000000-0000-4000-8000-000000000001';
  v_deleted_student_id constant uuid := 'f3000000-0000-4000-8000-000000000001';
  v_retained_student_id constant uuid := 'f3000000-0000-4000-8000-000000000002';
  v_group_id constant uuid := 'f4000000-0000-4000-8000-000000000001';
  v_shared_intervention_id constant uuid := 'f5000000-0000-4000-8000-000000000001';
  v_single_intervention_id constant uuid := 'f5000000-0000-4000-8000-000000000002';
  v_shared_observation_id constant uuid := 'f6000000-0000-4000-8000-000000000001';
  v_single_observation_id constant uuid := 'f6000000-0000-4000-8000-000000000002';
  v_shared_review_id constant uuid := 'f7000000-0000-4000-8000-000000000001';
  v_single_review_id constant uuid := 'f7000000-0000-4000-8000-000000000002';
  v_prepared jsonb;
  v_result jsonb;
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
    'migration-check-deletion@example.invalid',
    '{"audit_only": true}'::jsonb,
    now(),
    now()
  );

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    role,
    status,
    approval_status
  )
  values (
    v_teacher_id,
    'migration-check-deletion@example.invalid',
    'teacher',
    'approved',
    'approved'
  )
  on conflict (user_id) do update
  set role = excluded.role,
      status = excluded.status,
      approval_status = excluded.approval_status;

  perform set_config('request.jwt.claim.sub', v_teacher_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.classes (id, teacher_id, name)
  values (v_class_id, v_teacher_id, 'Migration check');

  insert into public.students (id, teacher_id, class_id, name)
  values
    (v_deleted_student_id, v_teacher_id, v_class_id, 'Delete'),
    (v_retained_student_id, v_teacher_id, v_class_id, 'Keep');

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
    'Initial sound group',
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
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    outcome_note
  )
  values
    (
      v_shared_intervention_id,
      v_teacher_id,
      v_class_id,
      'Teacher for Delete',
      'Delete and Keep shared group',
      array[v_deleted_student_id, v_retained_student_id],
      'Delete practises initial sound a',
      'Sort cards with f3000000-0000-4000-8000-000000000001',
      current_date,
      'Delete needs another turn'
    ),
    (
      v_single_intervention_id,
      v_teacher_id,
      v_class_id,
      'Teacher for Delete',
      'Delete only',
      array[v_deleted_student_id],
      'Delete practises initial sound a',
      'Sort cards with f3000000-0000-4000-8000-000000000001',
      current_date,
      'Delete needs another turn'
    );

  insert into public.teacher_instructional_group_reviews (
    id,
    group_id,
    teacher_id,
    class_id,
    student_ids,
    evidence_snapshot
  )
  values
    (
      v_shared_review_id,
      v_group_id,
      v_teacher_id,
      v_class_id,
      array[v_deleted_student_id, v_retained_student_id],
      jsonb_build_object(
        'schemaVersion', 1,
        'capturedAt', '2026-07-27T00:00:00.000Z',
        'memberCount', 2,
        'policyReadyMembers', 2,
        'attempts', 8,
        'skillDiversity', 1,
        'latestEvidenceAt', '2026-07-27T00:00:00.000Z',
        'averageAccuracy', 75,
        'supportRecorded', 2,
        'supportUsed', 1
      )
    ),
    (
      v_single_review_id,
      v_group_id,
      v_teacher_id,
      v_class_id,
      array[v_deleted_student_id],
      jsonb_build_object(
        'schemaVersion', 1,
        'capturedAt', '2026-07-27T00:00:00.000Z',
        'memberCount', 1,
        'policyReadyMembers', 1,
        'attempts', 4,
        'skillDiversity', 1,
        'latestEvidenceAt', '2026-07-27T00:00:00.000Z',
        'averageAccuracy', 50,
        'supportRecorded', 1,
        'supportUsed', 1
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
  values
    (
      v_shared_observation_id,
      v_teacher_id,
      v_class_id,
      v_shared_intervention_id,
      jsonb_build_object(
        'schemaVersion', 1,
        'key', 'sound:a',
        'kind', 'shared-exact-reteaching-evidence',
        'label', 'Initial sound a',
        'focus', 'Hear initial sound a'
      ),
      array[v_deleted_student_id, v_retained_student_id],
      'Shared observation'
    ),
    (
      v_single_observation_id,
      v_teacher_id,
      v_class_id,
      v_single_intervention_id,
      jsonb_build_object(
        'schemaVersion', 1,
        'key', 'sound:a',
        'kind', 'shared-exact-reteaching-evidence',
        'label', 'Initial sound a',
        'focus', 'Hear initial sound a'
      ),
      array[v_deleted_student_id],
      'Single observation'
    );

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

  if (v_result ->> 'status') is distinct from 'awaiting_local_cleanup' then
    raise exception 'staged deletion did not reach local-cleanup state: %', v_result;
  end if;
  if exists (
    select 1 from public.students where id = v_deleted_student_id
  ) then
    raise exception 'deleted learner still exists';
  end if;
  if not exists (
    select 1 from public.students where id = v_retained_student_id
  ) then
    raise exception 'retained learner was deleted';
  end if;
  if (
    select student_ids
    from public.teacher_insight_observations
    where id = v_shared_observation_id
  ) is distinct from array[v_retained_student_id] then
    raise exception 'shared observation did not retain only the classmate';
  end if;
  if exists (
    select 1
    from public.teacher_insight_observations
    where id = v_single_observation_id
  ) then
    raise exception 'single-learner observation was not deleted';
  end if;
  if (
    select student_ids
    from public.teacher_instructional_group_reviews
    where id = v_shared_review_id
  ) is distinct from array[v_retained_student_id] then
    raise exception 'shared group review did not retain only the classmate';
  end if;
  if (
    select (evidence_snapshot ->> 'memberCount')::integer
    from public.teacher_instructional_group_reviews
    where id = v_shared_review_id
  ) is distinct from 1 then
    raise exception 'shared group review member count was not redacted';
  end if;
  if exists (
    select 1
    from public.teacher_instructional_group_reviews
    where id = v_single_review_id
  ) then
    raise exception 'single-learner group review was not deleted';
  end if;
  if (
    select student_ids
    from public.teacher_interventions
    where id = v_shared_intervention_id
  ) is distinct from array[v_retained_student_id] then
    raise exception 'shared intervention did not retain only the classmate';
  end if;
  if exists (
    select 1
    from public.teacher_interventions
    where id = v_single_intervention_id
  ) then
    raise exception 'single-learner intervention was not deleted';
  end if;
  if exists (
    select 1
    from public.teacher_interventions
    where id = v_shared_intervention_id
      and (
        lower(concat_ws(
          ' ',
          owner_label,
          group_label,
          focus,
          activity,
          outcome_note
        )) like '%delete%'
        or concat_ws(
          ' ',
          owner_label,
          group_label,
          focus,
          activity,
          outcome_note
        ) like '%' || v_deleted_student_id::text || '%'
      )
  ) then
    raise exception 'shared intervention retained deleted learner free text';
  end if;
  if (v_result -> 'deletedCounts' ->> 'interventionsDeleted')::integer
      is distinct from 1
     or (v_result -> 'deletedCounts' ->> 'interventionsRedacted')::integer
      is distinct from 1
  then
    raise exception 'intervention deletion/redaction counts are incomplete: %', v_result;
  end if;

  begin
    perform public.teacher_complete_learner_deletion(
      (v_prepared ->> 'requestId')::uuid,
      v_prepared ->> 'subjectRef',
      '{}'::jsonb
    );
    raise exception 'an empty client attestation completed the privacy request';
  exception
    when invalid_parameter_value then null;
  end;
  if (
    select status
    from public.data_rights_requests
    where id = (v_prepared ->> 'requestId')::uuid
  ) is distinct from 'in_progress' then
    raise exception 'failed local proof incorrectly completed the request';
  end if;

  v_result := public.teacher_complete_learner_deletion(
    (v_prepared ->> 'requestId')::uuid,
    v_prepared ->> 'subjectRef',
    jsonb_build_object(
      'schemaVersion', 1,
      'subjectRef', v_prepared ->> 'subjectRef',
      'studentId', v_deleted_student_id,
      'checkedAt', now(),
      'storageAvailable', true,
      'residualCount', 0,
      'storesChecked', jsonb_build_array(
        'assessment_attempts',
        'assessment_write_queue',
        'el_benchmark_drafts',
        'el_reports',
        'guided_reading_assessment',
        'manual_assessment_drafts',
        'progress',
        'student_session',
        'teacher_profile'
      )
    )
  );
  if v_result ->> 'status' is distinct from 'completed'
     or coalesce((v_result ->> 'clientCleanupReported')::boolean, false)
       is not true
  then
    raise exception 'exact local cleanup proof did not complete the request: %', v_result;
  end if;
  if exists (
    select 1
    from public.data_rights_audit_events
    where request_id = (v_prepared ->> 'requestId')::uuid
      and event_type = 'deletion_completed'
      and (
        details ? 'localCleanupVerified'
        or coalesce((details ->> 'clientCleanupReported')::boolean, false)
          is not true
      )
  ) then
    raise exception 'audit event falsely claimed server verification of browser storage';
  end if;
end
$test$;

rollback;
