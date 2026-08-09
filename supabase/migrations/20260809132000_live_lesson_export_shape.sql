-- Repair the hosted learner export after the original row alias collided with
-- the response column name and serialized only the submitted value.

create or replace function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb language plpgsql volatile security definer set search_path = public
as $$
declare v_package jsonb;
begin
  v_package := public.teacher_export_learner_data_without_live_lessons(
    p_student_id, p_requester_role, p_verification_method
  );
  return v_package || jsonb_build_object(
    'liveLessonParticipation', coalesce((
      select jsonb_agg(jsonb_build_object(
        'sessionId', session.id,
        'cycleId', session.cycle_id,
        'day', session.day_key,
        'contentVersion', session.content_version,
        'status', session.status,
        'startedAt', session.started_at,
        'endedAt', session.ended_at
      ) order by session.started_at)
      from public.live_lesson_participants participant
      join public.live_lesson_sessions session on session.id = participant.session_id
      where participant.student_id = p_student_id
    ), '[]'::jsonb),
    'liveLessonResponses', coalesce((
      select jsonb_agg(to_jsonb(live_response) order by live_response.created_at, live_response.id)
      from public.live_lesson_responses live_response
      where live_response.student_id = p_student_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
