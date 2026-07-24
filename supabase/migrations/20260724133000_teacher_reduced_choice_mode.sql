-- Teacher-owned reduced-choice navigation.
--
-- Student profiles are otherwise latest-state records. A partial teacher
-- upsert must not erase a child's companion or collectibles, and an offline
-- child profile save must not undo a teacher's accessibility setting.
-- This trigger branch makes those two ownership rules atomic at the database.

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
      ) || jsonb_strip_nulls(jsonb_build_object(
        'reducedChoiceMode', old.payload -> 'reducedChoiceMode',
        'reducedChoiceModeAt', old.payload -> 'reducedChoiceModeAt',
        'reducedChoiceModeBy', old.payload -> 'reducedChoiceModeBy'
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
  'Merges student progress atomically; reduced-choice profile fields are teacher/admin owned.';
