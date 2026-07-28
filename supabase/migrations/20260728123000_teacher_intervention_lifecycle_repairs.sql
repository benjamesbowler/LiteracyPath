-- Make the support-plan lifecycle correctable without weakening its evidence
-- trail. Planned work can be edited, rescheduled, or cancelled; work that has
-- already been taught remains append-only through the existing lifecycle.

begin;

lock table public.teacher_interventions in share row exclusive mode;

alter table public.teacher_interventions
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists cancelled_from_status text;

alter table public.teacher_interventions
  drop constraint if exists teacher_interventions_status_check,
  drop constraint if exists teacher_interventions_student_ids_check,
  drop constraint if exists teacher_interventions_student_count_check,
  drop constraint if exists teacher_interventions_state_evidence_check,
  drop constraint if exists teacher_interventions_follow_up_check,
  drop constraint if exists teacher_interventions_cancellation_check;

-- Rows created before the first non-empty-group guard may have no learners.
-- They cannot truthfully be attached to an arbitrary learner. Keep them as
-- immutable cancelled audit history rather than presenting them as live plans.
alter table public.teacher_interventions
  disable trigger teacher_interventions_validate;

update public.teacher_interventions
set
  cancelled_from_status = status,
  status = 'cancelled',
  cancelled_at = coalesce(updated_at, created_at, now()),
  cancel_reason = 'Cancelled by the 2026-07-28 integrity repair because the legacy plan had no students.',
  follow_up_required = false
where coalesce(cardinality(student_ids), 0) = 0;

alter table public.teacher_interventions
  enable trigger teacher_interventions_validate;

alter table public.teacher_interventions
  add constraint teacher_interventions_status_check
    check (status in ('planned', 'delivered', 'recorded', 'reviewed', 'cancelled')),
  add constraint teacher_interventions_student_count_check
    check (
      cardinality(student_ids) between 1 and 40
      or (
        status = 'cancelled'
        and cardinality(student_ids) = 0
        and cancel_reason =
          'Cancelled by the 2026-07-28 integrity repair because the legacy plan had no students.'
      )
    ),
  add constraint teacher_interventions_state_evidence_check check (
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
    or status = 'cancelled'
  ),
  add constraint teacher_interventions_follow_up_check check (
    not follow_up_required
    or (status = 'reviewed' and outcome in ('partial', 'ineffective'))
  ),
  add constraint teacher_interventions_cancellation_check check (
    (
      status = 'cancelled'
      and cancelled_at is not null
      and char_length(btrim(cancel_reason)) between 1 and 500
      and cancelled_from_status in ('planned', 'delivered', 'recorded', 'reviewed')
      and not follow_up_required
    )
    or
    (
      status <> 'cancelled'
      and cancelled_at is null
      and cancel_reason is null
      and cancelled_from_status is null
    )
  );

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
    left join public.students s
      on s.id = student_id
      and s.class_id = new.class_id
      and s.teacher_id = new.teacher_id
      and s.archived_at is null
    where s.id is null
  ) then
    raise exception 'Every intervention learner must be active and belong to its class and teacher';
  end if;

  if tg_op = 'INSERT' and new.status = 'cancelled' then
    raise exception 'A new support plan cannot start as cancelled';
  end if;

  if tg_op = 'UPDATE' and (
    (old.status = 'planned' and new.status not in ('planned', 'delivered', 'cancelled'))
    or (old.status = 'delivered' and new.status not in ('delivered', 'recorded'))
    or (old.status = 'recorded' and new.status not in ('recorded', 'reviewed'))
    or (old.status = 'reviewed' and new.status <> 'reviewed')
    or (old.status = 'cancelled' and new.status <> 'cancelled')
  ) then
    raise exception 'Invalid intervention lifecycle transition from % to %', old.status, new.status;
  end if;

  if tg_op = 'UPDATE' and new.status = 'cancelled' and old.status = 'planned' and (
    new.cancelled_at is null
    or char_length(btrim(coalesce(new.cancel_reason, ''))) not between 1 and 500
    or new.cancelled_from_status <> 'planned'
  ) then
    raise exception 'Cancelling a support plan requires its time, reason, and previous status';
  end if;

  return new;
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
security invoker
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
begin
  update public.teacher_interventions
  set
    owner_label = btrim(coalesce(p_owner_label, '')),
    group_label = btrim(coalesce(p_group_label, '')),
    student_ids = coalesce(p_student_ids, '{}'),
    focus = btrim(coalesce(p_focus, '')),
    activity = btrim(coalesce(p_activity, '')),
    planned_for = p_planned_for
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'planned'
  returning * into v_intervention;

  if not found then
    raise exception 'An owned planned support record was not found';
  end if;

  return v_intervention;
end;
$$;

create or replace function public.teacher_cancel_planned_intervention(
  p_intervention_id uuid,
  p_reason text
)
returns public.teacher_interventions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_intervention public.teacher_interventions;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if char_length(v_reason) not between 1 and 500 then
    raise exception 'A cancellation reason between 1 and 500 characters is required';
  end if;

  update public.teacher_interventions
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancel_reason = v_reason,
    cancelled_from_status = 'planned',
    follow_up_required = false
  where id = p_intervention_id
    and teacher_id = auth.uid()
    and status = 'planned'
  returning * into v_intervention;

  if not found then
    raise exception 'An owned planned support record was not found';
  end if;

  return v_intervention;
end;
$$;

revoke all on function public.teacher_update_planned_intervention(
  uuid, text, text, uuid[], text, text, date
) from public;
grant execute on function public.teacher_update_planned_intervention(
  uuid, text, text, uuid[], text, text, date
) to authenticated;

revoke all on function public.teacher_cancel_planned_intervention(uuid, text) from public;
grant execute on function public.teacher_cancel_planned_intervention(uuid, text) to authenticated;

commit;
