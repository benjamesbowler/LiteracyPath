\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id,
  aud,
  role,
  email,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  'fd000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'intervention-evidence@example.invalid',
  '{"audit_only":true}'::jsonb,
  now(),
  now()
);

update public.pending_teacher_accounts
set role = 'teacher',
    status = 'approved',
    approval_status = 'approved'
where user_id = 'fd000000-0000-4000-8000-000000000001';

insert into public.classes (id, teacher_id, name)
values (
  'fd100000-0000-4000-8000-000000000001',
  'fd000000-0000-4000-8000-000000000001',
  'Immutable support evidence'
);

insert into public.students (id, teacher_id, class_id, name)
values (
  'fd200000-0000-4000-8000-000000000001',
  'fd000000-0000-4000-8000-000000000001',
  'fd100000-0000-4000-8000-000000000001',
  'Evidence learner'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'fd000000-0000-4000-8000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $evidence_gate$
declare
  v_lifecycle_id uuid;
  v_cancel_id uuid;
  v_draft_id uuid;
  v_delivered_at timestamptz;
  v_recorded_at timestamptz;
  v_reviewed_at timestamptz;
  v_cancelled_at timestamptz;
  v_rejected boolean;
begin
  -- A browser cannot forge a terminal row or any evidence timestamp.
  v_rejected := false;
  begin
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
      delivered_at,
      outcome,
      outcome_note,
      recorded_at,
      reviewed_at,
      next_review_on
    )
    values (
      auth.uid(),
      'fd100000-0000-4000-8000-000000000001',
      'Forged teacher',
      'Forged reviewed row',
      array['fd200000-0000-4000-8000-000000000001'::uuid],
      'Initial sounds',
      'Forged support',
      current_date,
      'reviewed',
      '2001-01-01 00:00:00+00',
      'effective',
      'Forged observation',
      '2001-01-01 00:00:00+00',
      '2001-01-01 00:00:00+00',
      current_date
    );
  exception
    when insufficient_privilege then
      v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated client inserted forged terminal evidence';
  end if;

  select created.id
  into v_lifecycle_id
  from public.teacher_create_intervention_plan(
    'fd100000-0000-4000-8000-000000000001',
    'Class teacher',
    'Lifecycle group',
    array['fd200000-0000-4000-8000-000000000001'::uuid],
    'Initial sounds',
    'Short guided practice',
    current_date
  ) created;

  v_rejected := false;
  begin
    update public.teacher_interventions
    set status = 'delivered',
        delivered_at = '2001-01-01 00:00:00+00'
    where id = v_lifecycle_id;
  exception
    when insufficient_privilege then
      v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated client forged a delivery timestamp';
  end if;

  if (select status from public.teacher_interventions where id = v_lifecycle_id) <> 'planned' then
    raise exception 'failed forged delivery changed the support record';
  end if;

  perform public.teacher_update_planned_intervention(
    v_lifecycle_id,
    'Reading teacher',
    'Rescheduled lifecycle group',
    array['fd200000-0000-4000-8000-000000000001'::uuid],
    'Initial sound a',
    'Model, practise, check',
    current_date + 2
  );

  if not exists (
    select 1
    from public.teacher_interventions
    where id = v_lifecycle_id
      and owner_label = 'Reading teacher'
      and group_label = 'Rescheduled lifecycle group'
      and planned_for = current_date + 2
  ) then
    raise exception 'planned edit/reschedule was not retained';
  end if;

  select delivered.delivered_at
  into v_delivered_at
  from public.teacher_mark_intervention_delivered(v_lifecycle_id) delivered;

  if v_delivered_at < clock_timestamp() - interval '1 minute' then
    raise exception 'delivery did not use the server clock';
  end if;

  select recorded.recorded_at
  into v_recorded_at
  from public.teacher_record_intervention_outcome(
    v_lifecycle_id,
    'partial',
    'Needed one extra model before answering.'
  ) recorded;

  if v_recorded_at < v_delivered_at
    or v_recorded_at < clock_timestamp() - interval '1 minute'
  then
    raise exception 'outcome did not use an ordered server time';
  end if;

  select reviewed.reviewed_at
  into v_reviewed_at
  from public.teacher_review_intervention(
    v_lifecycle_id,
    current_date + 7
  ) reviewed;

  if v_reviewed_at < v_recorded_at
    or not (
      select follow_up_required
      from public.teacher_interventions
      where id = v_lifecycle_id
    )
  then
    raise exception 'review did not retain ordered server evidence and follow-up';
  end if;

  -- Reviewed evidence cannot be rewritten or removed through either the table
  -- or the planned-draft deletion boundary.
  v_rejected := false;
  begin
    update public.teacher_interventions
    set outcome_note = 'Rewritten evidence'
    where id = v_lifecycle_id;
  exception
    when insufficient_privilege then
      v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated client rewrote reviewed evidence';
  end if;

  v_rejected := false;
  begin
    delete from public.teacher_interventions where id = v_lifecycle_id;
  exception
    when insufficient_privilege then
      v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated client directly deleted reviewed evidence';
  end if;

  v_rejected := false;
  begin
    perform public.teacher_delete_planned_intervention(v_lifecycle_id);
  exception
    when raise_exception then
      if sqlerrm like '%planned support record was not found%' then
        v_rejected := true;
      else
        raise;
      end if;
  end;
  if not v_rejected then
    raise exception 'planned-delete RPC removed reviewed evidence';
  end if;

  -- A genuinely untaught draft can be removed, while its provenance remains.
  select created.id
  into v_draft_id
  from public.teacher_create_intervention_plan(
    'fd100000-0000-4000-8000-000000000001',
    'Class teacher',
    'Disposable draft',
    array['fd200000-0000-4000-8000-000000000001'::uuid],
    'Blending',
    'Draft practice',
    current_date + 4
  ) created;

  perform public.teacher_delete_planned_intervention(v_draft_id);

  if exists (select 1 from public.teacher_interventions where id = v_draft_id) then
    raise exception 'planned draft deletion did not remove the draft';
  end if;
  if not exists (
    select 1
    from public.teacher_intervention_events
    where intervention_id = v_draft_id
      and event_type = 'plan_deleted'
      and actor_id = auth.uid()
      and actor_kind = 'teacher'
  ) then
    raise exception 'planned draft deletion lost its immutable provenance';
  end if;

  -- Delivered work can be cancelled with a reason, but its delivery evidence
  -- remains unchanged.
  select created.id
  into v_cancel_id
  from public.teacher_create_intervention_plan(
    'fd100000-0000-4000-8000-000000000001',
    'Class teacher',
    'Cancellation group',
    array['fd200000-0000-4000-8000-000000000001'::uuid],
    'Blending',
    'Teach then cancel',
    current_date
  ) created;

  select delivered.delivered_at
  into v_delivered_at
  from public.teacher_mark_intervention_delivered(v_cancel_id) delivered;

  select cancelled.cancelled_at
  into v_cancelled_at
  from public.teacher_cancel_intervention(
    v_cancel_id,
    'The learner moved before the follow-up could continue.'
  ) cancelled;

  if not exists (
    select 1
    from public.teacher_interventions
    where id = v_cancel_id
      and status = 'cancelled'
      and delivered_at = v_delivered_at
      and cancelled_at = v_cancelled_at
      and cancelled_from_status = 'delivered'
      and cancel_reason = 'The learner moved before the follow-up could continue.'
  ) then
    raise exception 'delivered cancellation lost its delivery evidence or reason';
  end if;

  if (
    select array_agg(event_type order by occurred_at, id)
    from public.teacher_intervention_events
    where intervention_id = v_lifecycle_id
  ) is distinct from array[
    'plan_created',
    'plan_updated',
    'delivered',
    'outcome_recorded',
    'reviewed'
  ]::text[]
  then
    raise exception 'normal lifecycle event history is incomplete or out of order';
  end if;

  if not exists (
    select 1
    from public.teacher_intervention_events
    where intervention_id = v_cancel_id
      and event_type = 'cancelled'
      and from_status = 'delivered'
      and to_status = 'cancelled'
      and actor_id = auth.uid()
      and occurred_at >= v_delivered_at
  ) then
    raise exception 'delivered cancellation event lacks actor/time/state provenance';
  end if;

  v_rejected := false;
  begin
    update public.teacher_intervention_events
    set detail = '{"forged":true}'::jsonb
    where intervention_id = v_lifecycle_id;
  exception
    when insufficient_privilege then
      v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated client rewrote intervention event history';
  end if;

  v_rejected := false;
  begin
    delete from public.teacher_intervention_events
    where intervention_id = v_lifecycle_id;
  exception
    when insufficient_privilege then
      v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated client deleted intervention event history';
  end if;
end
$evidence_gate$;

rollback;
