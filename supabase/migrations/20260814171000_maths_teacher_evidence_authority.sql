-- A teacher may record a direct teacher observation, but cannot impersonate a
-- learner's practice or authored skills-check interaction. Keep the original
-- append/idempotency implementation private behind a narrow wrapper.

begin;

alter function public.teacher_record_maths_evidence(
  uuid,uuid,text,text,text,jsonb,timestamptz,text
) rename to teacher_record_maths_evidence_unrestricted_v1;

revoke all on function public.teacher_record_maths_evidence_unrestricted_v1(
  uuid,uuid,text,text,text,jsonb,timestamptz,text
) from public,anon,authenticated;

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
begin
  perform public.assert_current_actor_teacher_access();
  if not public.maths_released_skill(p_skill_id)
    or p_content_version not in (
      'maths-foundation-number-v1',
      'maths-foundation-number-v2',
      'maths-foundation-number-v3',
      'maths-foundation-number-v4'
    )
    or p_event_type not in ('lesson_exit_observation','teacher_observation')
  then
    return jsonb_build_object('ok',false,'error','invalid_payload');
  end if;
  if p_event_type='lesson_exit_observation' and (
    p_evidence->>'source' is distinct from 'small_group_exit'
    or coalesce(p_evidence->>'outcome','') not in ('demonstrated','not_yet','not_checked')
  ) then
    return jsonb_build_object('ok',false,'error','invalid_payload');
  end if;
  if p_event_type='teacher_observation' and (
    p_evidence->>'source' is distinct from 'teacher_observation'
    or coalesce(p_evidence->>'outcome','') not in ('demonstrated','not_yet','not_checked')
  ) then
    return jsonb_build_object('ok',false,'error','invalid_payload');
  end if;
  return public.teacher_record_maths_evidence_unrestricted_v1(
    p_class_id,p_student_id,p_client_event_id,p_skill_id,p_event_type,
    p_evidence,p_occurred_at,p_content_version
  );
end;
$$;

revoke all on function public.teacher_record_maths_evidence(
  uuid,uuid,text,text,text,jsonb,timestamptz,text
) from public,anon,authenticated;
grant execute on function public.teacher_record_maths_evidence(
  uuid,uuid,text,text,text,jsonb,timestamptz,text
) to authenticated;

notify pgrst, 'reload schema';
commit;
