-- Keep the source of a teacher-led practice plan on the teacher-owned record.
-- Current Sound Seekers does not consume legacy progress.assignment. Do not
-- write that retired format or duplicate teacher insights into student progress.
-- Earlier plans remain without a source: no historic recommendation is invented.
begin;

alter table public.teacher_interventions
  add column if not exists source_action text,
  add column if not exists insight_snapshot jsonb,
  add column if not exists practice_targets text[] not null default '{}'::text[];

alter table public.teacher_interventions
  add constraint teacher_interventions_insight_source_check check (
    (source_action is null and insight_snapshot is null and cardinality(practice_targets) = 0)
    or (
      source_action is not null
      and source_action in ('assign_practice', 'plan_small_group')
      and insight_snapshot is not null
      and jsonb_typeof(insight_snapshot) = 'object'
      and octet_length(insight_snapshot::text) <= 8000
      and (
        (source_action = 'assign_practice' and cardinality(practice_targets) between 1 and 6)
        or (source_action = 'plan_small_group' and cardinality(practice_targets) = 0)
      )
    )
  );

create or replace function public.preserve_teacher_intervention_insight_source()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- The existing data-rights transaction removes a deleted student from every
  -- support group. Erase the associated source as well: its text or nested
  -- results may describe that student. Do not leave an immutable privacy copy.
  if old.source_action is not null and exists (
    select 1 from unnest(old.student_ids) student_id
    where not (student_id = any(new.student_ids))
  ) then
    new.source_action := null;
    new.insight_snapshot := null;
    new.practice_targets := '{}'::text[];
    return new;
  end if;
  if old.source_action is distinct from new.source_action
    or old.insight_snapshot is distinct from new.insight_snapshot
    or old.practice_targets is distinct from new.practice_targets
  then
    raise exception 'The original teacher insight and practice targets cannot be changed';
  end if;
  return new;
end;
$$;
revoke all on function public.preserve_teacher_intervention_insight_source()
  from public, anon, authenticated;
create trigger teacher_interventions_preserve_insight_source
  before update on public.teacher_interventions
  for each row execute function public.preserve_teacher_intervention_insight_source();

create or replace function public.teacher_create_insight_intervention(
  p_action_type text,
  p_class_id uuid,
  p_insight jsonb,
  p_student_ids uuid[],
  p_targets text[],
  p_owner_label text,
  p_activity text,
  p_planned_for date
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_intervention public.teacher_interventions;
begin
  perform public.assert_current_actor_teacher_access();

  if p_action_type is null or p_action_type not in ('assign_practice', 'plan_small_group') then
    raise exception 'Unknown teacher insight action';
  end if;

  if v_teacher_id is null or not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = v_teacher_id
  ) then
    raise exception 'An owned class was not found';
  end if;

  if coalesce(cardinality(p_student_ids), 0) not between 1 and 40
    or cardinality(p_student_ids)
      <> cardinality(array(select distinct unnest(p_student_ids)))
    or exists (
      select 1
      from unnest(p_student_ids) student_id
      left join public.students s
        on s.id = student_id
        and s.class_id = p_class_id
        and s.teacher_id = v_teacher_id
        and s.archived_at is null
      where s.id is null
    )
  then
    raise exception 'Every action learner must be active in its class and teacher';
  end if;

  if p_insight is null or jsonb_typeof(p_insight) <> 'object'
    or not (p_insight ?& array['schemaVersion', 'key', 'kind', 'label', 'focus'])
    or jsonb_typeof(p_insight -> 'schemaVersion') <> 'number'
    or jsonb_typeof(p_insight -> 'key') <> 'string'
    or jsonb_typeof(p_insight -> 'kind') <> 'string'
    or jsonb_typeof(p_insight -> 'label') <> 'string'
    or jsonb_typeof(p_insight -> 'focus') <> 'string'
    or exists (
      select 1
      from jsonb_object_keys(p_insight) as keys(snapshot_key)
      where snapshot_key <> all (array[
        'schemaVersion',
        'key',
        'kind',
        'label',
        'focus',
        'reason',
        'criterion',
        'evidence'
      ])
    )
    or (
      p_insight ? 'reason'
      and jsonb_typeof(p_insight -> 'reason') <> 'string'
    )
    or (
      p_insight ? 'criterion'
      and jsonb_typeof(p_insight -> 'criterion') <> 'object'
    )
    or (
      p_insight ? 'evidence'
      and jsonb_typeof(p_insight -> 'evidence') <> 'object'
    )
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  if (p_insight ->> 'schemaVersion')::numeric <> 1
    or char_length(btrim(p_insight ->> 'key')) not between 1 and 180
    or char_length(btrim(p_insight ->> 'kind')) not between 1 and 80
    or char_length(btrim(p_insight ->> 'label')) not between 1 and 180
    or char_length(btrim(p_insight ->> 'focus')) not between 1 and 240
    or (
      p_insight ? 'reason'
      and char_length(btrim(p_insight ->> 'reason')) not between 1 and 500
    )
    or octet_length(p_insight::text) > 8000
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  if p_action_type = 'assign_practice' then
    if coalesce(cardinality(p_targets), 0) not between 1 and 6
      or cardinality(p_targets)
        <> cardinality(array(select distinct unnest(p_targets)))
      or exists (
        select 1
        from unnest(p_targets) target
        where target is null
          or char_length(btrim(target)) not between 1 and 40
      )
    then
      raise exception 'Practice assignment requires one to six unique exact targets';
    end if;

  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status,
    source_action,
    insight_snapshot,
    practice_targets
  )
  values (
    v_teacher_id,
    p_class_id,
    btrim(p_owner_label),
    left(
      btrim(p_insight ->> 'label')
        || case
          when p_action_type = 'assign_practice' then ' practice'
          else ' group'
        end,
      120
    ),
    p_student_ids,
    left(btrim(p_insight ->> 'focus'), 160),
    btrim(p_activity),
    p_planned_for,
    'planned',
    p_action_type,
    p_insight,
    case when p_action_type = 'assign_practice' then p_targets else '{}'::text[] end
  )
  returning * into v_intervention;

  return v_intervention;
end;
$$;

revoke all on function public.teacher_create_insight_intervention(text, uuid, jsonb, uuid[], text[], text, text, date)
  from public, anon, authenticated;
grant execute on function public.teacher_create_insight_intervention(text, uuid, jsonb, uuid[], text[], text, text, date)
  to authenticated;
notify pgrst, 'reload schema';
commit;
