-- Track the complete teacher intervention lifecycle as durable, owned data.
--
-- A suggestion is not an intervention until it has an owner, date, group,
-- focus, and activity. Later states require the evidence recorded at each
-- transition, so a client cannot create a misleading "reviewed" shell.

create table if not exists public.teacher_interventions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  parent_intervention_id uuid references public.teacher_interventions(id) on delete set null,
  owner_label text not null check (char_length(btrim(owner_label)) between 1 and 80),
  group_label text not null check (char_length(btrim(group_label)) between 1 and 120),
  student_ids uuid[] not null default '{}'
    check (cardinality(student_ids) <= 40),
  focus text not null check (char_length(btrim(focus)) between 1 and 160),
  activity text not null check (char_length(btrim(activity)) between 1 and 240),
  planned_for date not null,
  status text not null default 'planned'
    check (status in ('planned', 'delivered', 'recorded', 'reviewed')),
  delivered_at timestamptz,
  outcome text check (outcome in ('effective', 'partial', 'ineffective')),
  outcome_note text check (outcome_note is null or char_length(outcome_note) <= 500),
  recorded_at timestamptz,
  reviewed_at timestamptz,
  next_review_on date,
  follow_up_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_interventions_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint teacher_interventions_state_evidence_check check (
    (status = 'planned'
      and delivered_at is null
      and recorded_at is null
      and reviewed_at is null
      and outcome is null)
    or
    (status = 'delivered'
      and delivered_at is not null
      and recorded_at is null
      and reviewed_at is null
      and outcome is null)
    or
    (status = 'recorded'
      and delivered_at is not null
      and recorded_at is not null
      and reviewed_at is null
      and outcome is not null)
    or
    (status = 'reviewed'
      and delivered_at is not null
      and recorded_at is not null
      and reviewed_at is not null
      and outcome is not null
      and next_review_on is not null)
  ),
  constraint teacher_interventions_follow_up_check check (
    not follow_up_required
    or (status = 'reviewed' and outcome in ('partial', 'ineffective'))
  )
);

create index if not exists teacher_interventions_class_status_date_idx
  on public.teacher_interventions (teacher_id, class_id, status, planned_for);
create index if not exists teacher_interventions_follow_up_idx
  on public.teacher_interventions (teacher_id, class_id, next_review_on)
  where follow_up_required;

alter table public.teacher_interventions enable row level security;

revoke all on public.teacher_interventions from anon;
grant select, insert, update, delete on public.teacher_interventions to authenticated;

drop policy if exists "Teachers manage owned interventions" on public.teacher_interventions;
create policy "Teachers manage owned interventions"
  on public.teacher_interventions for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes c
      where c.id = teacher_interventions.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "App admins manage all interventions" on public.teacher_interventions;
create policy "App admins manage all interventions"
  on public.teacher_interventions for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

create or replace function public.validate_teacher_intervention()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if cardinality(new.student_ids) > 40 then
    raise exception 'An intervention group cannot contain more than 40 learners';
  end if;

  if exists (
    select 1
    from unnest(new.student_ids) student_id
    left join public.students s
      on s.id = student_id
      and s.class_id = new.class_id
      and s.teacher_id = new.teacher_id
    where s.id is null
  ) then
    raise exception 'Every intervention learner must belong to its class and teacher';
  end if;

  if tg_op = 'UPDATE' and (
    (old.status = 'planned' and new.status not in ('planned', 'delivered'))
    or (old.status = 'delivered' and new.status not in ('delivered', 'recorded'))
    or (old.status = 'recorded' and new.status not in ('recorded', 'reviewed'))
    or (old.status = 'reviewed' and new.status <> 'reviewed')
  ) then
    raise exception 'Invalid intervention lifecycle transition from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists teacher_interventions_validate on public.teacher_interventions;
create trigger teacher_interventions_validate
  before insert or update on public.teacher_interventions
  for each row execute function public.validate_teacher_intervention();

drop trigger if exists teacher_interventions_set_updated_at on public.teacher_interventions;
create trigger teacher_interventions_set_updated_at
  before update on public.teacher_interventions
  for each row execute function public.set_core_learning_updated_at();

create or replace function public.teacher_create_intervention_follow_up(
  p_parent_intervention_id uuid,
  p_owner_label text,
  p_group_label text,
  p_student_ids uuid[],
  p_focus text,
  p_activity text,
  p_planned_for date
)
returns public.teacher_interventions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_parent public.teacher_interventions;
  v_follow_up public.teacher_interventions;
begin
  select *
  into v_parent
  from public.teacher_interventions
  where id = p_parent_intervention_id
    and teacher_id = auth.uid()
    and status = 'reviewed'
    and follow_up_required
  for update;

  if not found then
    raise exception 'A reviewed owned intervention requiring follow-up was not found';
  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    parent_intervention_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status
  )
  values (
    v_parent.teacher_id,
    v_parent.class_id,
    v_parent.id,
    p_owner_label,
    p_group_label,
    coalesce(p_student_ids, '{}'),
    p_focus,
    p_activity,
    p_planned_for,
    'planned'
  )
  returning * into v_follow_up;

  update public.teacher_interventions
  set follow_up_required = false
  where id = v_parent.id;

  return v_follow_up;
end;
$$;

revoke all on function public.teacher_create_intervention_follow_up(uuid, text, text, uuid[], text, text, date) from public;
grant execute on function public.teacher_create_intervention_follow_up(uuid, text, text, uuid[], text, text, date) to authenticated;
