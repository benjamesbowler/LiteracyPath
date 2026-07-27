-- Durable instructional groups derived from explicit evidence criteria.
--
-- A group is saved with the criterion that produced it. Membership is never
-- overwritten in place: each review appends a dated snapshot so teachers can
-- explain who stayed, joined, or left without ranking learners.

create table if not exists public.teacher_instructional_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  criteria jsonb not null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_instructional_groups_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint teacher_instructional_groups_owner_key
    unique (id, teacher_id, class_id)
);

alter table public.teacher_instructional_groups
  drop constraint if exists teacher_instructional_groups_criteria_check;
alter table public.teacher_instructional_groups
  add constraint teacher_instructional_groups_criteria_check check (
    jsonb_typeof(criteria) = 'object'
    and criteria ?& array['sourceId', 'kind', 'label', 'basis', 'policy']
    and jsonb_typeof(criteria -> 'sourceId') = 'string'
    and jsonb_typeof(criteria -> 'kind') = 'string'
    and jsonb_typeof(criteria -> 'label') = 'string'
    and jsonb_typeof(criteria -> 'basis') = 'string'
    and jsonb_typeof(criteria -> 'policy') = 'string'
    and char_length(btrim(criteria ->> 'sourceId')) between 1 and 180
    and char_length(btrim(criteria ->> 'kind')) between 1 and 80
    and char_length(btrim(criteria ->> 'label')) between 1 and 180
    and char_length(btrim(criteria ->> 'basis')) between 1 and 240
    and char_length(btrim(criteria ->> 'policy')) between 1 and 500
  );

create unique index if not exists teacher_instructional_groups_active_name_idx
  on public.teacher_instructional_groups (teacher_id, class_id, lower(btrim(name)))
  where status = 'active';
create index if not exists teacher_instructional_groups_class_updated_idx
  on public.teacher_instructional_groups (teacher_id, class_id, updated_at desc);

create table if not exists public.teacher_instructional_group_reviews (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  teacher_id uuid not null,
  class_id uuid not null,
  student_ids uuid[] not null check (
    cardinality(student_ids) between 1 and 40
  ),
  evidence_snapshot jsonb not null check (
    jsonb_typeof(evidence_snapshot) = 'object'
  ),
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint teacher_instructional_group_reviews_group_fk
    foreign key (group_id, teacher_id, class_id)
    references public.teacher_instructional_groups(id, teacher_id, class_id)
    on delete cascade
);

create index if not exists teacher_instructional_group_reviews_latest_idx
  on public.teacher_instructional_group_reviews
    (teacher_id, class_id, group_id, reviewed_at desc, id desc);

alter table public.teacher_instructional_groups enable row level security;
alter table public.teacher_instructional_group_reviews enable row level security;

revoke all on public.teacher_instructional_groups from anon;
revoke all on public.teacher_instructional_group_reviews from anon;
revoke all on public.teacher_instructional_groups from authenticated;
revoke all on public.teacher_instructional_group_reviews from authenticated;
grant select, update on public.teacher_instructional_groups to authenticated;
grant select on public.teacher_instructional_group_reviews to authenticated;

drop policy if exists "Teachers manage owned instructional groups"
  on public.teacher_instructional_groups;
create policy "Teachers manage owned instructional groups"
  on public.teacher_instructional_groups for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes c
      where c.id = teacher_instructional_groups.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "App admins manage all instructional groups"
  on public.teacher_instructional_groups;
create policy "App admins manage all instructional groups"
  on public.teacher_instructional_groups for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "Teachers manage owned instructional group reviews"
  on public.teacher_instructional_group_reviews;
create policy "Teachers manage owned instructional group reviews"
  on public.teacher_instructional_group_reviews for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "App admins manage all instructional group reviews"
  on public.teacher_instructional_group_reviews;
create policy "App admins manage all instructional group reviews"
  on public.teacher_instructional_group_reviews for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

create or replace function public.validate_teacher_instructional_group()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.teacher_id is distinct from old.teacher_id
    or new.class_id is distinct from old.class_id
    or new.criteria is distinct from old.criteria
    or new.created_at is distinct from old.created_at
    or (old.status = 'archived' and new.status <> 'archived')
  ) then
    raise exception 'Instructional group ownership, criterion, creation time, and archive state are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists teacher_instructional_groups_validate
  on public.teacher_instructional_groups;
create trigger teacher_instructional_groups_validate
  before update on public.teacher_instructional_groups
  for each row execute function public.validate_teacher_instructional_group();

create or replace function public.validate_teacher_instructional_group_review()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'Instructional group review snapshots are append-only';
  end if;

  if cardinality(new.student_ids) <> cardinality(array(select distinct unnest(new.student_ids))) then
    raise exception 'Instructional group membership cannot contain duplicate learners';
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
    raise exception 'Every instructional group learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(new.evidence_snapshot) <> 'object'
    or not (
      new.evidence_snapshot ?& array[
        'schemaVersion',
        'capturedAt',
        'memberCount',
        'policyReadyMembers',
        'attempts',
        'skillDiversity',
        'latestEvidenceAt',
        'averageAccuracy',
        'supportRecorded',
        'supportUsed'
      ]
    )
    or jsonb_typeof(new.evidence_snapshot -> 'schemaVersion') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'capturedAt') <> 'string'
    or jsonb_typeof(new.evidence_snapshot -> 'memberCount') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'policyReadyMembers') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'attempts') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'skillDiversity') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'latestEvidenceAt') <> 'string'
    or coalesce(jsonb_typeof(new.evidence_snapshot -> 'averageAccuracy'), '') not in ('number', 'null')
    or jsonb_typeof(new.evidence_snapshot -> 'supportRecorded') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'supportUsed') <> 'number'
  then
    raise exception 'Instructional group evidence snapshot has an invalid schema';
  end if;

  if (new.evidence_snapshot ->> 'schemaVersion')::numeric <> 1
    or (new.evidence_snapshot ->> 'memberCount')::numeric
      <> cardinality(new.student_ids)
    or trunc((new.evidence_snapshot ->> 'memberCount')::numeric)
      <> (new.evidence_snapshot ->> 'memberCount')::numeric
    or (new.evidence_snapshot ->> 'policyReadyMembers')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'policyReadyMembers')::numeric)
      <> (new.evidence_snapshot ->> 'policyReadyMembers')::numeric
    or (new.evidence_snapshot ->> 'policyReadyMembers')::numeric
      > (new.evidence_snapshot ->> 'memberCount')::numeric
    or (new.evidence_snapshot ->> 'attempts')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'attempts')::numeric)
      <> (new.evidence_snapshot ->> 'attempts')::numeric
    or (new.evidence_snapshot ->> 'skillDiversity')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'skillDiversity')::numeric)
      <> (new.evidence_snapshot ->> 'skillDiversity')::numeric
    or (
      jsonb_typeof(new.evidence_snapshot -> 'averageAccuracy') = 'number'
      and (
        (new.evidence_snapshot ->> 'averageAccuracy')::numeric < 0
        or (new.evidence_snapshot ->> 'averageAccuracy')::numeric > 100
      )
    )
    or (new.evidence_snapshot ->> 'supportRecorded')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'supportRecorded')::numeric)
      <> (new.evidence_snapshot ->> 'supportRecorded')::numeric
    or (new.evidence_snapshot ->> 'supportUsed')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'supportUsed')::numeric)
      <> (new.evidence_snapshot ->> 'supportUsed')::numeric
    or (new.evidence_snapshot ->> 'supportUsed')::numeric
      > (new.evidence_snapshot ->> 'supportRecorded')::numeric
  then
    raise exception 'Instructional group evidence snapshot values are inconsistent';
  end if;

  new.reviewed_at := now();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists teacher_instructional_group_reviews_validate
  on public.teacher_instructional_group_reviews;
create trigger teacher_instructional_group_reviews_validate
  before insert or update on public.teacher_instructional_group_reviews
  for each row execute function public.validate_teacher_instructional_group_review();

drop trigger if exists teacher_instructional_groups_set_updated_at
  on public.teacher_instructional_groups;
create trigger teacher_instructional_groups_set_updated_at
  before update on public.teacher_instructional_groups
  for each row execute function public.set_core_learning_updated_at();

create or replace function public.teacher_save_instructional_group(
  p_class_id uuid,
  p_name text,
  p_criteria jsonb,
  p_student_ids uuid[],
  p_evidence_snapshot jsonb
)
returns public.teacher_instructional_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_group public.teacher_instructional_groups;
begin
  if v_teacher_id is null or not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = v_teacher_id
  ) then
    raise exception 'An owned class was not found';
  end if;

  insert into public.teacher_instructional_groups (
    teacher_id,
    class_id,
    name,
    criteria
  )
  values (
    v_teacher_id,
    p_class_id,
    btrim(p_name),
    p_criteria
  )
  returning * into v_group;

  insert into public.teacher_instructional_group_reviews (
    group_id,
    teacher_id,
    class_id,
    student_ids,
    evidence_snapshot
  )
  values (
    v_group.id,
    v_group.teacher_id,
    v_group.class_id,
    p_student_ids,
    p_evidence_snapshot
  );

  return v_group;
end;
$$;

create or replace function public.teacher_review_instructional_group(
  p_group_id uuid,
  p_student_ids uuid[],
  p_evidence_snapshot jsonb
)
returns public.teacher_instructional_group_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.teacher_instructional_groups;
  v_review public.teacher_instructional_group_reviews;
begin
  select *
  into v_group
  from public.teacher_instructional_groups
  where id = p_group_id
    and teacher_id = auth.uid()
    and status = 'active'
  for update;

  if not found then
    raise exception 'An active owned instructional group was not found';
  end if;

  insert into public.teacher_instructional_group_reviews (
    group_id,
    teacher_id,
    class_id,
    student_ids,
    evidence_snapshot
  )
  values (
    v_group.id,
    v_group.teacher_id,
    v_group.class_id,
    p_student_ids,
    p_evidence_snapshot
  )
  returning * into v_review;

  update public.teacher_instructional_groups
  set updated_at = now()
  where id = v_group.id;

  return v_review;
end;
$$;

alter table public.teacher_interventions
  add column if not exists instructional_group_id uuid;

alter table public.teacher_interventions
  drop constraint if exists teacher_interventions_instructional_group_fk;
alter table public.teacher_interventions
  add constraint teacher_interventions_instructional_group_fk
  foreign key (instructional_group_id, teacher_id, class_id)
  references public.teacher_instructional_groups(id, teacher_id, class_id);

create index if not exists teacher_interventions_instructional_group_idx
  on public.teacher_interventions (instructional_group_id, created_at desc)
  where instructional_group_id is not null;

create or replace function public.teacher_assign_instructional_group_follow_up(
  p_group_id uuid,
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
  v_group public.teacher_instructional_groups;
  v_student_ids uuid[];
  v_intervention public.teacher_interventions;
begin
  select *
  into v_group
  from public.teacher_instructional_groups
  where id = p_group_id
    and teacher_id = auth.uid()
    and status = 'active';

  if not found then
    raise exception 'An active owned instructional group was not found';
  end if;

  select student_ids
  into v_student_ids
  from public.teacher_instructional_group_reviews
  where group_id = v_group.id
    and teacher_id = v_group.teacher_id
    and class_id = v_group.class_id
  order by reviewed_at desc, id desc
  limit 1;

  if coalesce(cardinality(v_student_ids), 0) = 0 then
    raise exception 'The instructional group has no reviewed learners';
  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    instructional_group_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status
  )
  values (
    v_group.teacher_id,
    v_group.class_id,
    v_group.id,
    btrim(p_owner_label),
    v_group.name,
    v_student_ids,
    v_group.criteria ->> 'label',
    btrim(p_activity),
    p_planned_for,
    'planned'
  )
  returning * into v_intervention;

  return v_intervention;
end;
$$;

revoke all on function public.teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)
  from public;
revoke all on function public.teacher_review_instructional_group(uuid, uuid[], jsonb)
  from public;
revoke all on function public.teacher_assign_instructional_group_follow_up(uuid, text, text, date)
  from public;
grant execute on function public.teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)
  to authenticated;
grant execute on function public.teacher_review_instructional_group(uuid, uuid[], jsonb)
  to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(uuid, text, text, date)
  to authenticated;
