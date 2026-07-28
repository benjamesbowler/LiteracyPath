-- Make support-plan evidence an RPC-owned, append-only lifecycle.
--
-- Planned work is still correctable. Once teaching has happened, the teacher
-- can only append the next lifecycle fact: delivery, outcome, review, or a
-- reasoned cancellation. Browser clients cannot supply evidence timestamps or
-- mutate/delete the underlying rows directly.

begin;

lock table public.teacher_interventions in share row exclusive mode;

create table if not exists public.teacher_intervention_events (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null,
  teacher_id uuid not null,
  class_id uuid not null,
  event_type text not null check (
    event_type in (
      'baseline_imported',
      'plan_created',
      'plan_updated',
      'plan_deleted',
      'delivered',
      'outcome_recorded',
      'reviewed',
      'follow_up_planned',
      'cancelled',
      'record_updated',
      'record_removed'
    )
  ),
  from_status text,
  to_status text,
  actor_id uuid,
  actor_kind text not null check (actor_kind in ('teacher', 'administrator', 'system')),
  occurred_at timestamptz not null default clock_timestamp(),
  detail jsonb not null default '{}'::jsonb
    check (jsonb_typeof(detail) = 'object' and octet_length(detail::text) <= 4000),
  check (
    (actor_kind = 'system' and actor_id is null)
    or (actor_kind in ('teacher', 'administrator') and actor_id is not null)
  )
);

create index if not exists teacher_intervention_events_timeline_idx
  on public.teacher_intervention_events (teacher_id, class_id, intervention_id, occurred_at, id);

alter table public.teacher_intervention_events enable row level security;

revoke all on public.teacher_intervention_events from public, anon, authenticated;
grant select on public.teacher_intervention_events to authenticated;

drop policy if exists "Teachers read owned intervention events"
  on public.teacher_intervention_events;
create policy "Teachers read owned intervention events"
  on public.teacher_intervention_events
  for select
  to authenticated
  using (
    (
      teacher_id = auth.uid()
      and public.current_actor_has_teacher_access()
    )
    or public.is_app_admin(auth.uid())
  );

-- Existing rows pre-date the event stream, so record an honest baseline
-- instead of inventing lifecycle times or actors that were never captured.
insert into public.teacher_intervention_events (
  intervention_id,
  teacher_id,
  class_id,
  event_type,
  from_status,
  to_status,
  actor_id,
  actor_kind,
  occurred_at,
  detail
)
select
  intervention.id,
  intervention.teacher_id,
  intervention.class_id,
  'baseline_imported',
  null,
  intervention.status,
  null,
  'system',
  clock_timestamp(),
  jsonb_build_object(
    'plannedFor', intervention.planned_for,
    'studentCount', cardinality(intervention.student_ids)
  )
from public.teacher_interventions intervention
where not exists (
  select 1
  from public.teacher_intervention_events event
  where event.intervention_id = intervention.id
);

create or replace function public.capture_teacher_intervention_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_kind text;
  v_event_type text;
  v_detail jsonb := '{}'::jsonb;
  v_changed_fields text[] := '{}'::text[];
begin
  v_actor_kind := case
    when v_actor_id is null then 'system'
    when public.is_app_admin(v_actor_id) then 'administrator'
    else 'teacher'
  end;

  if tg_op = 'INSERT' then
    v_event_type := case
      when new.status = 'planned' then 'plan_created'
      else 'baseline_imported'
    end;
    v_detail := jsonb_build_object(
      'plannedFor', new.planned_for,
      'studentCount', cardinality(new.student_ids)
    );
  elsif tg_op = 'DELETE' then
    v_event_type := case
      when old.status = 'planned' then 'plan_deleted'
      else 'record_removed'
    end;
    v_detail := jsonb_build_object(
      'plannedFor', old.planned_for,
      'studentCount', cardinality(old.student_ids)
    );
  elsif old.status is distinct from new.status then
    v_event_type := case
      when new.status = 'delivered' then 'delivered'
      when new.status = 'recorded' then 'outcome_recorded'
      when new.status = 'reviewed' then 'reviewed'
      when new.status = 'cancelled' then 'cancelled'
      else 'record_updated'
    end;

    if v_event_type = 'outcome_recorded' then
      v_detail := jsonb_build_object('outcome', new.outcome);
    elsif v_event_type = 'reviewed' then
      v_detail := jsonb_build_object(
        'nextReviewOn', new.next_review_on,
        'followUpRequired', new.follow_up_required
      );
    elsif v_event_type = 'cancelled' then
      v_detail := jsonb_build_object(
        'reasonRecorded', true,
        'reasonLength', char_length(new.cancel_reason)
      );
    end if;
  elsif old.status = 'planned' then
    if old.owner_label is distinct from new.owner_label then
      v_changed_fields := array_append(v_changed_fields, 'owner');
    end if;
    if old.group_label is distinct from new.group_label then
      v_changed_fields := array_append(v_changed_fields, 'group');
    end if;
    if old.student_ids is distinct from new.student_ids then
      v_changed_fields := array_append(v_changed_fields, 'students');
    end if;
    if old.focus is distinct from new.focus then
      v_changed_fields := array_append(v_changed_fields, 'focus');
    end if;
    if old.activity is distinct from new.activity then
      v_changed_fields := array_append(v_changed_fields, 'activity');
    end if;
    if old.planned_for is distinct from new.planned_for then
      v_changed_fields := array_append(v_changed_fields, 'date');
    end if;

    v_event_type := 'plan_updated';
    v_detail := jsonb_build_object(
      'changedFields', to_jsonb(v_changed_fields),
      'previousPlannedFor', old.planned_for,
      'plannedFor', new.planned_for,
      'studentCount', cardinality(new.student_ids)
    );
  elsif old.status = 'reviewed'
    and old.follow_up_required
    and not new.follow_up_required
  then
    v_event_type := 'follow_up_planned';
  else
    -- Verified learner-deletion and retention routines may redact or remove
    -- identifying content. Preserve that an owned server operation happened
    -- without copying the identifying text into the immutable event payload.
    v_event_type := 'record_updated';
  end if;

  insert into public.teacher_intervention_events (
    intervention_id,
    teacher_id,
    class_id,
    event_type,
    from_status,
    to_status,
    actor_id,
    actor_kind,
    occurred_at,
    detail
  )
  values (
    coalesce(new.id, old.id),
    coalesce(new.teacher_id, old.teacher_id),
    coalesce(new.class_id, old.class_id),
    v_event_type,
    case when tg_op = 'INSERT' then null else old.status end,
    case when tg_op = 'DELETE' then null else new.status end,
    v_actor_id,
    v_actor_kind,
    clock_timestamp(),
    v_detail
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_teacher_intervention_event()
  from public, anon, authenticated;

drop trigger if exists teacher_interventions_capture_event
  on public.teacher_interventions;
create trigger teacher_interventions_capture_event
  after insert or update or delete on public.teacher_interventions
  for each row execute function public.capture_teacher_intervention_event();

-- Delivered plans may be cancelled, but recorded/reviewed evidence is final.
-- Every cancellation keeps the original delivery time and adds a server-owned
-- cancellation time and reason.
create or replace function public.validate_teacher_intervention()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(cardinality(new.student_ids), 0) < 1 then
    raise exception 'A support plan must contain at least one learner';
  end if;

  if cardinality(new.student_ids) > 40 then
    raise exception 'An intervention group cannot contain more than 40 learners';
  end if;

  if exists (
    select 1
    from unnest(new.student_ids) student_id
    left join public.students student
      on student.id = student_id
      and student.class_id = new.class_id
      and student.teacher_id = new.teacher_id
      and student.archived_at is null
    where student.id is null
  ) then
    raise exception 'Every intervention learner must be active and belong to its class and teacher';
  end if;

  if tg_op = 'INSERT'
    and new.status <> 'planned'
    and not (
      auth.uid() is null
      and current_user in ('postgres', 'supabase_admin')
    )
  then
    raise exception 'A new support plan must start as planned';
  end if;

  if tg_op = 'UPDATE' and (
    (old.status = 'planned' and new.status not in ('planned', 'delivered', 'cancelled'))
    or (old.status = 'delivered' and new.status not in ('delivered', 'recorded', 'cancelled'))
    or (old.status = 'recorded' and new.status not in ('recorded', 'reviewed'))
    or (old.status = 'reviewed' and new.status <> 'reviewed')
    or (old.status = 'cancelled' and new.status <> 'cancelled')
  ) then
    raise exception 'Invalid intervention lifecycle transition from % to %', old.status, new.status;
  end if;

  if tg_op = 'UPDATE' and new.status = 'cancelled' and (
    old.status not in ('planned', 'delivered')
    or new.cancelled_at is null
    or char_length(btrim(coalesce(new.cancel_reason, ''))) not between 1 and 500
    or new.cancelled_from_status <> old.status
  ) then
    raise exception 'Cancelling support requires its server time, reason, and previous state';
  end if;

  return new;
end;
$$;

-- Browser actors may read their owned rows, but all writes now go through the
-- narrow functions below. This also closes forged terminal inserts.
revoke insert, update, delete on public.teacher_interventions from authenticated;
grant select on public.teacher_interventions to authenticated;

create or replace function public.teacher_create_intervention_plan(
  p_class_id uuid,
  p_owner_label text,
  p_group_label text,
  p_student_ids uuid[],
  p_focus text,
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

  if not exists (
    select 1
    from public.classes class
    where class.id = p_class_id
      and class.teacher_id = v_teacher_id
  ) then
    raise exception 'An owned class was not found';
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
    btrim(coalesce(p_owner_label, '')),
    btrim(coalesce(p_group_label, '')),
    coalesce(p_student_ids, '{}'::uuid[]),
    btrim(coalesce(p_focus, '')),
    btrim(coalesce(p_activity, '')),
    p_planned_for,
    'planned'
  )
  returning * into v_intervention;

  return v_intervention;
end;
$$;

create or replace function public.teacher_update_planned_intervention(
  p_intervention_id uuid,
  p_owner_label text,
  p_group_label text,
  p_student_ids uuid[],
  p_focus text,
  p_activity text,
  p_planned_for date
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
begin
  perform public.assert_current_actor_teacher_access();

  update public.teacher_interventions
  set
    owner_label = btrim(coalesce(p_owner_label, '')),
    group_label = btrim(coalesce(p_group_label, '')),
    student_ids = coalesce(p_student_ids, '{}'::uuid[]),
    focus = btrim(coalesce(p_focus, '')),
    activity = btrim(coalesce(p_activity, '')),
    planned_for = p_planned_for
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'planned'
    and delivered_at is null
  returning * into v_intervention;

  if not found then
    raise exception 'An owned planned support record was not found';
  end if;

  return v_intervention;
end;
$$;

create or replace function public.teacher_delete_planned_intervention(
  p_intervention_id uuid
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
begin
  perform public.assert_current_actor_teacher_access();

  delete from public.teacher_interventions
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'planned'
    and delivered_at is null
  returning * into v_intervention;

  if not found then
    raise exception 'An owned planned support record was not found';
  end if;

  return v_intervention;
end;
$$;

create or replace function public.teacher_mark_intervention_delivered(
  p_intervention_id uuid
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
begin
  perform public.assert_current_actor_teacher_access();

  update public.teacher_interventions
  set
    status = 'delivered',
    delivered_at = clock_timestamp()
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'planned'
    and delivered_at is null
  returning * into v_intervention;

  if not found then
    raise exception 'An owned planned support record was not found';
  end if;

  return v_intervention;
end;
$$;

create or replace function public.teacher_record_intervention_outcome(
  p_intervention_id uuid,
  p_outcome text,
  p_outcome_note text
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
  v_note text := btrim(coalesce(p_outcome_note, ''));
begin
  perform public.assert_current_actor_teacher_access();

  if p_outcome not in ('effective', 'partial', 'ineffective') then
    raise exception 'Choose a valid support result';
  end if;
  if char_length(v_note) not between 1 and 500 then
    raise exception 'An observation between 1 and 500 characters is required';
  end if;

  update public.teacher_interventions
  set
    status = 'recorded',
    outcome = p_outcome,
    outcome_note = v_note,
    recorded_at = clock_timestamp()
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'delivered'
    and delivered_at is not null
  returning * into v_intervention;

  if not found then
    raise exception 'An owned delivered support record was not found';
  end if;

  return v_intervention;
end;
$$;

create or replace function public.teacher_review_intervention(
  p_intervention_id uuid,
  p_next_review_on date
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
begin
  perform public.assert_current_actor_teacher_access();

  if p_next_review_on is null then
    raise exception 'A next review date is required';
  end if;

  update public.teacher_interventions
  set
    status = 'reviewed',
    reviewed_at = clock_timestamp(),
    next_review_on = p_next_review_on,
    follow_up_required = outcome in ('partial', 'ineffective')
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'recorded'
    and recorded_at is not null
    and outcome is not null
  returning * into v_intervention;

  if not found then
    raise exception 'An owned recorded support record was not found';
  end if;

  return v_intervention;
end;
$$;

create or replace function public.teacher_cancel_intervention(
  p_intervention_id uuid,
  p_reason text
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.assert_current_actor_teacher_access();

  if char_length(v_reason) not between 1 and 500 then
    raise exception 'A cancellation reason between 1 and 500 characters is required';
  end if;

  update public.teacher_interventions
  set
    status = 'cancelled',
    cancelled_at = clock_timestamp(),
    cancel_reason = v_reason,
    cancelled_from_status = status,
    follow_up_required = false
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'delivered'
    and delivered_at is not null
  returning * into v_intervention;

  if not found then
    raise exception 'An owned delivered support record was not found';
  end if;

  return v_intervention;
end;
$$;

-- Follow-up creation must remain atomic after direct INSERT/UPDATE are closed.
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
security definer
set search_path = public
as $$
declare
  v_parent public.teacher_interventions;
  v_follow_up public.teacher_interventions;
begin
  perform public.assert_current_actor_teacher_access();

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
    btrim(coalesce(p_owner_label, '')),
    btrim(coalesce(p_group_label, '')),
    coalesce(p_student_ids, '{}'::uuid[]),
    btrim(coalesce(p_focus, '')),
    btrim(coalesce(p_activity, '')),
    p_planned_for,
    'planned'
  )
  returning * into v_follow_up;

  update public.teacher_interventions
  set follow_up_required = false
  where id = v_parent.id
    and status = 'reviewed'
    and follow_up_required;

  return v_follow_up;
end;
$$;

-- Retire the misleading planned-cancellation entry point. Planned rows are
-- drafts and are removed; only delivered work is cancelled with a reason.
revoke all on function public.teacher_cancel_planned_intervention(uuid, text)
  from public, anon, authenticated;

revoke all on function public.teacher_create_intervention_plan(
  uuid, text, text, uuid[], text, text, date
) from public, anon, authenticated;
revoke all on function public.teacher_update_planned_intervention(
  uuid, text, text, uuid[], text, text, date
) from public, anon, authenticated;
revoke all on function public.teacher_delete_planned_intervention(uuid)
  from public, anon, authenticated;
revoke all on function public.teacher_mark_intervention_delivered(uuid)
  from public, anon, authenticated;
revoke all on function public.teacher_record_intervention_outcome(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.teacher_review_intervention(uuid, date)
  from public, anon, authenticated;
revoke all on function public.teacher_cancel_intervention(uuid, text)
  from public, anon, authenticated;
revoke all on function public.teacher_create_intervention_follow_up(
  uuid, text, text, uuid[], text, text, date
) from public, anon, authenticated;

grant execute on function public.teacher_create_intervention_plan(
  uuid, text, text, uuid[], text, text, date
) to authenticated;
grant execute on function public.teacher_update_planned_intervention(
  uuid, text, text, uuid[], text, text, date
) to authenticated;
grant execute on function public.teacher_delete_planned_intervention(uuid)
  to authenticated;
grant execute on function public.teacher_mark_intervention_delivered(uuid)
  to authenticated;
grant execute on function public.teacher_record_intervention_outcome(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_review_intervention(uuid, date)
  to authenticated;
grant execute on function public.teacher_cancel_intervention(uuid, text)
  to authenticated;
grant execute on function public.teacher_create_intervention_follow_up(
  uuid, text, text, uuid[], text, text, date
) to authenticated;

comment on table public.teacher_intervention_events is
  'Append-only, server-timed provenance for support-plan creation, correction, delivery, outcome, review, follow-up, cancellation, and permitted removal.';

notify pgrst, 'reload schema';

commit;
