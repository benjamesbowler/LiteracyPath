-- Teacher-owned per-learner accessibility settings.
--
-- These settings are hydrated to the learner profile, but child/offline
-- profile writes must not be able to change or remove them. Partial teacher
-- profile writes must continue to preserve the rest of the learner profile.

create or replace function public.lp_student_progress_merge()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_profile jsonb;
  v_teacher_controls_profile boolean;
begin
  if new.area = 'profile' then
    v_profile := coalesce(old.payload, '{}'::jsonb) || coalesce(new.payload, '{}'::jsonb);
    select exists (
      select 1
      from public.students s
      where s.id = new.student_id
        and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
    ) into v_teacher_controls_profile;

    if not v_teacher_controls_profile then
      v_profile := (
        v_profile
        - 'reducedChoiceMode'
        - 'reducedChoiceModeAt'
        - 'reducedChoiceModeBy'
        - 'accessibilitySettings'
        - 'accessibilitySettingsAt'
        - 'accessibilitySettingsBy'
      ) || jsonb_strip_nulls(jsonb_build_object(
        'reducedChoiceMode', old.payload -> 'reducedChoiceMode',
        'reducedChoiceModeAt', old.payload -> 'reducedChoiceModeAt',
        'reducedChoiceModeBy', old.payload -> 'reducedChoiceModeBy',
        'accessibilitySettings', old.payload -> 'accessibilitySettings',
        'accessibilitySettingsAt', old.payload -> 'accessibilitySettingsAt',
        'accessibilitySettingsBy', old.payload -> 'accessibilitySettingsBy'
      ));
    end if;

    new.payload := v_profile;
    return new;
  end if;

  new.payload := public.lp_forward_merge_progress(new.area, old.payload, new.payload);
  return new;
end;
$$;

comment on function public.lp_student_progress_merge() is
  'Merges student progress atomically; learner navigation and accessibility profile fields are teacher/admin owned.';
