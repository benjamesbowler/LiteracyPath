begin;

alter function public.teacher_export_learner_data(uuid, text, text)
  rename to teacher_export_learner_data_without_lesson_plans;
revoke all on function public.teacher_export_learner_data_without_lesson_plans(uuid, text, text)
  from public, anon, authenticated;

create function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_package jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  v_package := public.teacher_export_learner_data_without_lesson_plans(
    p_student_id, p_requester_role, p_verification_method
  );
  return v_package || jsonb_build_object(
    'smallGroupLessonPlans', coalesce((
      select jsonb_agg(jsonb_build_object(
        'planId', plan.id,
        'cycleId', plan.cycle_id,
        'targetKey', plan.target_key,
        'durationMinutes', plan.duration_minutes,
        'contentVersion', plan.content_version,
        'status', plan.status,
        'evidenceSource', plan.evidence_source,
        'createdAt', plan.created_at,
        'updatedAt', plan.updated_at
      ) order by plan.created_at, plan.id)
      from public.teacher_lesson_plan_students member
      join public.teacher_lesson_plans plan on plan.id=member.plan_id
      where member.student_id=p_student_id
    ), '[]'::jsonb),
    'smallGroupLessonDeliveries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'deliveryId', delivery.id,
        'planId', delivery.plan_id,
        'completionState', delivery.completion_state,
        'notes', delivery.notes,
        'observedSupport', delivery.observed_support,
        'evidencePurpose', delivery.evidence_purpose,
        'deliveredAt', delivery.delivered_at
      ) order by delivery.delivered_at, delivery.id)
      from public.teacher_lesson_delivery_students member
      join public.teacher_lesson_plan_deliveries delivery on delivery.id=member.delivery_id
      where member.student_id=p_student_id
    ), '[]'::jsonb)
  );
end; $$;

revoke all on function public.teacher_export_learner_data(uuid,text,text) from public,anon;
grant execute on function public.teacher_export_learner_data(uuid,text,text) to authenticated;

commit;
