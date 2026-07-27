-- Close report insights into real teacher-owned actions.
--
-- Practice assignment and small-group planning create normal interventions,
-- so delivery, outcome, review, and follow-up use the A5.10 lifecycle.
-- Direct observations are immutable evidence and atomically create a dated
-- teaching response instead of becoming an untracked note.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.teacher_interventions'::regclass
      and conname = 'teacher_interventions_owner_key'
  ) then
    alter table public.teacher_interventions
      add constraint teacher_interventions_owner_key
      unique (id, teacher_id, class_id);
  end if;
end;
$$;

create table if not exists public.teacher_insight_observations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  intervention_id uuid not null,
  insight_snapshot jsonb not null,
  student_ids uuid[] not null check (cardinality(student_ids) between 1 and 40),
  note text not null check (char_length(btrim(note)) between 1 and 500),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint teacher_insight_observations_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint teacher_insight_observations_intervention_fk
    foreign key (intervention_id, teacher_id, class_id)
    references public.teacher_interventions(id, teacher_id, class_id)
    on delete cascade
);

create index if not exists teacher_insight_observations_class_time_idx
  on public.teacher_insight_observations
    (teacher_id, class_id, observed_at desc, id desc);
create index if not exists teacher_insight_observations_intervention_idx
  on public.teacher_insight_observations (intervention_id);

alter table public.teacher_insight_observations enable row level security;
revoke all on public.teacher_insight_observations from anon;
revoke all on public.teacher_insight_observations from authenticated;
grant select on public.teacher_insight_observations to authenticated;

drop policy if exists "Teachers read owned insight observations"
  on public.teacher_insight_observations;
create policy "Teachers read owned insight observations"
  on public.teacher_insight_observations for select to authenticated
  using (teacher_id = auth.uid());

drop policy if exists "App admins read all insight observations"
  on public.teacher_insight_observations;
create policy "App admins read all insight observations"
  on public.teacher_insight_observations for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.validate_teacher_insight_observation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'Teacher insight observations are immutable';
  end if;

  if cardinality(new.student_ids)
    <> cardinality(array(select distinct unnest(new.student_ids)))
  then
    raise exception 'Teacher insight observations cannot contain duplicate learners';
  end if;

  if exists (
    select 1
    from unnest(new.student_ids) student_id
    left join public.students s
      on s.id = student_id
      and s.class_id = new.class_id
      and s.teacher_id = new.teacher_id
      and s.archived_at is null
    where s.id is null
  ) then
    raise exception 'Every observed learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(new.insight_snapshot) <> 'object'
    or not (
      new.insight_snapshot ?& array[
        'schemaVersion',
        'key',
        'kind',
        'label',
        'focus'
      ]
    )
    or jsonb_typeof(new.insight_snapshot -> 'schemaVersion') <> 'number'
    or jsonb_typeof(new.insight_snapshot -> 'key') <> 'string'
    or jsonb_typeof(new.insight_snapshot -> 'kind') <> 'string'
    or jsonb_typeof(new.insight_snapshot -> 'label') <> 'string'
    or jsonb_typeof(new.insight_snapshot -> 'focus') <> 'string'
    or exists (
      select 1
      from jsonb_object_keys(new.insight_snapshot) as keys(snapshot_key)
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
      new.insight_snapshot ? 'reason'
      and jsonb_typeof(new.insight_snapshot -> 'reason') <> 'string'
    )
    or (
      new.insight_snapshot ? 'criterion'
      and jsonb_typeof(new.insight_snapshot -> 'criterion') <> 'object'
    )
    or (
      new.insight_snapshot ? 'evidence'
      and jsonb_typeof(new.insight_snapshot -> 'evidence') <> 'object'
    )
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  if (new.insight_snapshot ->> 'schemaVersion')::numeric <> 1
    or char_length(btrim(new.insight_snapshot ->> 'key')) not between 1 and 180
    or char_length(btrim(new.insight_snapshot ->> 'kind')) not between 1 and 80
    or char_length(btrim(new.insight_snapshot ->> 'label')) not between 1 and 180
    or char_length(btrim(new.insight_snapshot ->> 'focus')) not between 1 and 240
    or (
      new.insight_snapshot ? 'reason'
      and char_length(btrim(new.insight_snapshot ->> 'reason')) not between 1 and 500
    )
    or octet_length(new.insight_snapshot::text) > 8000
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  new.observed_at := now();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists teacher_insight_observations_validate
  on public.teacher_insight_observations;
create trigger teacher_insight_observations_validate
  before insert or update on public.teacher_insight_observations
  for each row execute function public.validate_teacher_insight_observation();

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
  v_assignment jsonb;
begin
  if p_action_type not in ('assign_practice', 'plan_small_group') then
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

  if jsonb_typeof(p_insight) <> 'object'
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

    v_assignment := jsonb_build_object(
      'assignment',
      jsonb_build_object(
        'targets', to_jsonb(p_targets),
        'note', left(btrim(p_activity), 120),
        'assignedAt', now(),
        'by', 'teacher',
        'insight', p_insight
      )
    );

    insert into public.student_progress (
      student_id,
      area,
      key,
      payload,
      updated_at
    )
    select
      student_id,
      'phonics_quest',
      '__all__',
      v_assignment,
      now()
    from unnest(p_student_ids) student_id
    on conflict (student_id, area, key)
    do update set
      payload = excluded.payload,
      updated_at = excluded.updated_at;
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
    status
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
    'planned'
  )
  returning * into v_intervention;

  return v_intervention;
end;
$$;

create or replace function public.teacher_record_insight_observation(
  p_class_id uuid,
  p_insight jsonb,
  p_student_ids uuid[],
  p_note text,
  p_owner_label text,
  p_follow_up_activity text,
  p_follow_up_on date
)
returns public.teacher_insight_observations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_intervention public.teacher_interventions;
  v_observation public.teacher_insight_observations;
begin
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
    raise exception 'Every observed learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(p_insight) <> 'object'
    or not (p_insight ?& array['schemaVersion', 'key', 'kind', 'label', 'focus'])
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
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
    status
  )
  values (
    v_teacher_id,
    p_class_id,
    btrim(p_owner_label),
    left(btrim(p_insight ->> 'label') || ' observation follow-up', 120),
    p_student_ids,
    left(btrim(p_insight ->> 'focus'), 160),
    btrim(p_follow_up_activity),
    p_follow_up_on,
    'planned'
  )
  returning * into v_intervention;

  insert into public.teacher_insight_observations (
    teacher_id,
    class_id,
    intervention_id,
    insight_snapshot,
    student_ids,
    note
  )
  values (
    v_teacher_id,
    p_class_id,
    v_intervention.id,
    p_insight,
    p_student_ids,
    btrim(p_note)
  )
  returning * into v_observation;

  return v_observation;
end;
$$;

revoke all on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) from public;
revoke all on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) from public;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
