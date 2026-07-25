-- School-configurable retention, end-of-year handling, and deletion propagation.
--
-- Defaults are operational safeguards, not a legal conclusion. An authorised
-- app administrator records the school instruction, previews every run, and
-- must provide an exact destructive confirmation before records are removed.

create table if not exists public.school_retention_policies (
  school_id uuid primary key references public.schools(id) on delete cascade,
  inactive_after_days integer not null default 365
    check (inactive_after_days between 90 and 2555),
  archived_delete_after_days integer not null default 90
    check (archived_delete_after_days between 7 and 730),
  end_of_year_action text not null default 'archive'
    check (end_of_year_action in ('archive', 'delete')),
  academic_year_end_month integer not null default 7
    check (academic_year_end_month between 1 and 12),
  provider_expiry_days integer not null default 30
    check (provider_expiry_days between 1 and 365),
  backup_expiry_days integer not null default 35
    check (backup_expiry_days between 1 and 365),
  last_end_of_year_applied integer,
  policy_version integer not null default 1 check (policy_version = 1),
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deletion_propagation_records (
  request_id uuid primary key
    references public.data_rights_requests(id) on delete restrict,
  subject_ref text not null check (subject_ref ~ '^[0-9a-f]{64}$'),
  school_id uuid,
  active_systems_deleted_at timestamptz not null,
  provider_expires_at timestamptz not null,
  backup_expires_at timestamptz not null,
  status text not null default 'awaiting_expiry'
    check (status in ('awaiting_expiry', 'evidence_required', 'expired_verified')),
  evidence_reference text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      status in ('awaiting_expiry', 'evidence_required')
      and evidence_reference is null
      and verified_at is null
      and verified_by is null
    )
    or
    (
      status = 'expired_verified'
      and char_length(btrim(evidence_reference)) between 8 and 500
      and verified_at is not null
      and verified_by is not null
    )
  )
);

create table if not exists public.retention_job_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  actor_id uuid not null,
  policy_snapshot jsonb not null,
  preview_snapshot jsonb not null,
  archived_learners integer not null default 0 check (archived_learners >= 0),
  deleted_learners integer not null default 0 check (deleted_learners >= 0),
  propagation_records_due integer not null default 0
    check (propagation_records_due >= 0),
  completed_at timestamptz not null default now()
);

create index if not exists deletion_propagation_expiry_idx
  on public.deletion_propagation_records (status, provider_expires_at, backup_expires_at);
create index if not exists deletion_propagation_school_idx
  on public.deletion_propagation_records (school_id, created_at desc);

alter table public.school_retention_policies enable row level security;
alter table public.deletion_propagation_records enable row level security;
alter table public.retention_job_runs enable row level security;

revoke all on public.school_retention_policies from anon, authenticated;
revoke all on public.deletion_propagation_records from anon, authenticated;
revoke all on public.retention_job_runs from anon, authenticated;
grant select on public.school_retention_policies to authenticated;
grant select on public.deletion_propagation_records to authenticated;
grant select on public.retention_job_runs to authenticated;

drop policy if exists "App admins read school retention policies"
  on public.school_retention_policies;
create policy "App admins read school retention policies"
  on public.school_retention_policies for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins read deletion propagation"
  on public.deletion_propagation_records;
create policy "App admins read deletion propagation"
  on public.deletion_propagation_records for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins read retention job runs"
  on public.retention_job_runs;
create policy "App admins read retention job runs"
  on public.retention_job_runs for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.assert_retention_admin()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_app_admin(v_actor_id) then
    raise exception 'App administrator access is required';
  end if;
  return v_actor_id;
end;
$$;

revoke all on function public.assert_retention_admin()
  from public, anon, authenticated;

create or replace function public.ensure_school_retention_policy(
  p_school_id uuid
)
returns public.school_retention_policies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_policy public.school_retention_policies;
begin
  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'School not found';
  end if;

  insert into public.school_retention_policies (
    school_id,
    last_end_of_year_applied,
    updated_by
  )
  values (
    p_school_id,
    extract(year from public.retention_latest_year_end(7, current_date))::integer,
    v_actor_id
  )
  on conflict (school_id) do nothing;

  select *
  into strict v_policy
  from public.school_retention_policies
  where school_id = p_school_id;

  return v_policy;
end;
$$;

revoke all on function public.ensure_school_retention_policy(uuid)
  from public, anon, authenticated;

create or replace function public.retention_latest_year_end(
  p_month integer,
  p_today date default current_date
)
returns date
language sql
immutable
strict
set search_path = public
as $$
  select case
    when p_today >= (
      date_trunc('month', make_date(extract(year from p_today)::integer, p_month, 1))
      + interval '1 month - 1 day'
    )::date
    then (
      date_trunc('month', make_date(extract(year from p_today)::integer, p_month, 1))
      + interval '1 month - 1 day'
    )::date
    else (
      date_trunc('month', make_date(extract(year from p_today)::integer - 1, p_month, 1))
      + interval '1 month - 1 day'
    )::date
  end;
$$;

revoke all on function public.retention_latest_year_end(integer, date)
  from public, anon, authenticated;

create or replace function public.retention_last_learner_activity(
  p_student_id uuid
)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    s.updated_at,
    (select max(a.answered_at) from public.answers a where a.student_id = s.id),
    (select max(m.updated_at) from public.mastery m where m.student_id = s.id),
    (select max(im.updated_at) from public.item_mastery im where im.student_id = s.id),
    (select max(sp.updated_at) from public.student_progress sp where sp.student_id = s.id),
    (
      select max(greatest(la.created_at, coalesce(la.occurred_at, la.created_at)))
      from public.learn_activity la
      where la.student_id = s.id
    ),
    (select max(ss.created_at) from public.student_sessions ss where ss.student_id = s.id),
    (select max(aa.completed_at) from public.assessment_attempts aa where aa.student_id = s.id::text)
  )
  from public.students s
  where s.id = p_student_id;
$$;

revoke all on function public.retention_last_learner_activity(uuid)
  from public, anon, authenticated;

create or replace function public.admin_get_school_retention_policy(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
begin
  v_policy := public.ensure_school_retention_policy(p_school_id);
  return to_jsonb(v_policy);
end;
$$;

create or replace function public.admin_save_school_retention_policy(
  p_school_id uuid,
  p_inactive_after_days integer,
  p_archived_delete_after_days integer,
  p_end_of_year_action text,
  p_academic_year_end_month integer,
  p_provider_expiry_days integer,
  p_backup_expiry_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_policy public.school_retention_policies;
begin
  perform public.ensure_school_retention_policy(p_school_id);

  update public.school_retention_policies
  set
    inactive_after_days = p_inactive_after_days,
    archived_delete_after_days = p_archived_delete_after_days,
    end_of_year_action = p_end_of_year_action,
    academic_year_end_month = p_academic_year_end_month,
    provider_expiry_days = p_provider_expiry_days,
    backup_expiry_days = p_backup_expiry_days,
    updated_by = v_actor_id,
    updated_at = now()
  where school_id = p_school_id
  returning * into strict v_policy;

  return to_jsonb(v_policy);
end;
$$;

create or replace function public.admin_preview_school_retention(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
  v_year_end date;
  v_year integer;
  v_end_of_year_due boolean;
  v_inactive integer;
  v_archived_due integer;
  v_end_of_year integer;
  v_propagation_pending integer;
  v_propagation_due integer;
  v_now timestamptz := now();
begin
  v_policy := public.ensure_school_retention_policy(p_school_id);
  v_year_end := public.retention_latest_year_end(
    v_policy.academic_year_end_month,
    v_now::date
  );
  v_year := extract(year from v_year_end)::integer;
  v_end_of_year_due := coalesce(v_policy.last_end_of_year_applied, 0) < v_year;

  select count(*)
  into v_inactive
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is null
    and public.retention_last_learner_activity(s.id)
      <= v_now - make_interval(days => v_policy.inactive_after_days);

  select count(*)
  into v_archived_due
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is not null
    and s.archived_at
      <= v_now - make_interval(days => v_policy.archived_delete_after_days);

  select case when v_end_of_year_due then count(*) else 0 end
  into v_end_of_year
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is null;

  select count(*)
  into v_propagation_pending
  from public.deletion_propagation_records dpr
  where dpr.school_id = p_school_id
    and dpr.status = 'awaiting_expiry';

  select count(*)
  into v_propagation_due
  from public.deletion_propagation_records dpr
  where dpr.school_id = p_school_id
    and (
      dpr.status = 'evidence_required'
      or (
        dpr.status = 'awaiting_expiry'
        and dpr.provider_expires_at <= v_now
        and dpr.backup_expires_at <= v_now
      )
    );

  return jsonb_build_object(
    'schoolId', p_school_id,
    'previewedAt', v_now,
    'policy', jsonb_build_object(
      'inactiveAfterDays', v_policy.inactive_after_days,
      'archivedDeleteAfterDays', v_policy.archived_delete_after_days,
      'endOfYearAction', v_policy.end_of_year_action,
      'academicYearEndMonth', v_policy.academic_year_end_month,
      'providerExpiryDays', v_policy.provider_expiry_days,
      'backupExpiryDays', v_policy.backup_expiry_days,
      'lastEndOfYearApplied', v_policy.last_end_of_year_applied
    ),
    'latestYearEnd', v_year_end,
    'endOfYearDue', v_end_of_year_due,
    'inactiveArchiveCandidates', v_inactive,
    'archivedDeletionCandidates', v_archived_due,
    'endOfYearCandidates', v_end_of_year,
    'pendingPropagationRecords', v_propagation_pending,
    'propagationEvidenceDue', v_propagation_due
  );
end;
$$;

create or replace function public.admin_list_deletion_propagation(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_retention_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'requestId', dpr.request_id,
      'subjectRef', dpr.subject_ref,
      'activeSystemsDeletedAt', dpr.active_systems_deleted_at,
      'providerExpiresAt', dpr.provider_expires_at,
      'backupExpiresAt', dpr.backup_expires_at,
      'status', dpr.status,
      'evidenceDue', (
        dpr.provider_expires_at <= now()
        and dpr.backup_expires_at <= now()
      ),
      'evidenceReference', dpr.evidence_reference,
      'verifiedAt', dpr.verified_at
    ) order by dpr.created_at desc)
    from public.deletion_propagation_records dpr
    where dpr.school_id = p_school_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_verify_deletion_propagation(
  p_request_id uuid,
  p_evidence_reference text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_record public.deletion_propagation_records;
  v_now timestamptz := now();
begin
  if p_confirmation is distinct from 'VERIFY PROVIDER AND BACKUP EXPIRY' then
    raise exception 'The exact propagation verification phrase is required';
  end if;
  if char_length(btrim(coalesce(p_evidence_reference, ''))) not between 8 and 500 then
    raise exception 'A provider or backup evidence reference is required';
  end if;

  select *
  into v_record
  from public.deletion_propagation_records
  where request_id = p_request_id
  for update;

  if not found then
    raise exception 'Deletion propagation record not found';
  end if;
  if v_record.status = 'expired_verified' then
    raise exception 'Deletion propagation is already verified';
  end if;
  if v_record.provider_expires_at > v_now or v_record.backup_expires_at > v_now then
    raise exception 'Provider and backup expiry dates have not both passed';
  end if;

  update public.deletion_propagation_records
  set
    status = 'expired_verified',
    evidence_reference = btrim(p_evidence_reference),
    verified_at = v_now,
    verified_by = v_actor_id,
    updated_at = v_now
  where request_id = p_request_id
  returning * into strict v_record;

  return jsonb_build_object(
    'requestId', v_record.request_id,
    'status', v_record.status,
    'evidenceReference', v_record.evidence_reference,
    'verifiedAt', v_record.verified_at
  );
end;
$$;

create or replace function public.queue_deletion_propagation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.data_rights_requests;
  v_provider_days integer := 30;
  v_backup_days integer := 35;
begin
  if new.event_type <> 'deletion_completed' then
    return new;
  end if;

  select *
  into strict v_request
  from public.data_rights_requests
  where id = new.request_id;

  select
    coalesce(srp.provider_expiry_days, 30),
    coalesce(srp.backup_expiry_days, 35)
  into v_provider_days, v_backup_days
  from (select 1) seed
  left join public.school_retention_policies srp
    on srp.school_id = v_request.school_id;

  insert into public.deletion_propagation_records (
    request_id,
    subject_ref,
    school_id,
    active_systems_deleted_at,
    provider_expires_at,
    backup_expires_at
  )
  values (
    v_request.id,
    v_request.subject_ref,
    v_request.school_id,
    new.event_at,
    new.event_at + make_interval(days => v_provider_days),
    new.event_at + make_interval(days => v_backup_days)
  )
  on conflict (request_id) do nothing;

  return new;
end;
$$;

drop trigger if exists data_rights_queue_deletion_propagation
  on public.data_rights_audit_events;
create trigger data_rights_queue_deletion_propagation
  after insert on public.data_rights_audit_events
  for each row execute function public.queue_deletion_propagation();

insert into public.deletion_propagation_records (
  request_id,
  subject_ref,
  school_id,
  active_systems_deleted_at,
  provider_expires_at,
  backup_expires_at
)
select
  dr.id,
  dr.subject_ref,
  dr.school_id,
  dae.event_at,
  dae.event_at + make_interval(days => coalesce(srp.provider_expiry_days, 30)),
  dae.event_at + make_interval(days => coalesce(srp.backup_expiry_days, 35))
from public.data_rights_requests dr
join public.data_rights_audit_events dae
  on dae.request_id = dr.id
  and dae.event_type = 'deletion_completed'
left join public.school_retention_policies srp
  on srp.school_id = dr.school_id
on conflict (request_id) do nothing;

create or replace function public.admin_run_school_retention(
  p_school_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
  v_preview jsonb;
  v_year integer;
  v_student record;
  v_prepared jsonb;
  v_archived integer := 0;
  v_deleted integer := 0;
  v_deleted_student_ids uuid[] := array[]::uuid[];
  v_row_count integer;
  v_actor_id uuid := public.assert_retention_admin();
  v_now timestamptz := now();
begin
  if p_confirmation is distinct from 'APPLY RETENTION POLICY' then
    raise exception 'The exact retention confirmation phrase is required';
  end if;

  v_policy := public.ensure_school_retention_policy(p_school_id);
  v_preview := public.admin_preview_school_retention(p_school_id);
  v_year := extract(year from (v_preview ->> 'latestYearEnd')::date)::integer;

  if (v_preview ->> 'endOfYearDue')::boolean then
    if v_policy.end_of_year_action = 'archive' then
      update public.students s
      set archived_at = v_now, updated_at = v_now
      from public.classes c
      where c.id = s.class_id
        and c.school_id = p_school_id
        and s.archived_at is null;
      get diagnostics v_archived = row_count;
    else
      for v_student in
        select s.id
        from public.students s
        join public.classes c on c.id = s.class_id
        where c.school_id = p_school_id
          and s.archived_at is null
        order by s.id
      loop
        v_prepared := public.teacher_prepare_learner_deletion(
          v_student.id,
          'school',
          'authorised_school_official'
        );
        perform public.teacher_delete_learner_data(
          (v_prepared ->> 'requestId')::uuid,
          v_student.id,
          v_prepared ->> 'subjectRef',
          'DELETE LEARNER DATA'
        );
        v_deleted_student_ids := array_append(v_deleted_student_ids, v_student.id);
        v_deleted := v_deleted + 1;
      end loop;
    end if;

    update public.school_retention_policies
    set
      last_end_of_year_applied = v_year,
      updated_by = auth.uid(),
      updated_at = v_now
    where school_id = p_school_id;
  else
    update public.students s
    set archived_at = v_now, updated_at = v_now
    from public.classes c
    where c.id = s.class_id
      and c.school_id = p_school_id
      and s.archived_at is null
      and public.retention_last_learner_activity(s.id)
        <= v_now - make_interval(days => v_policy.inactive_after_days);
    get diagnostics v_archived = row_count;
  end if;

  for v_student in
    select s.id
    from public.students s
    join public.classes c on c.id = s.class_id
    where c.school_id = p_school_id
      and s.archived_at is not null
      and s.archived_at
        <= v_now - make_interval(days => v_policy.archived_delete_after_days)
    order by s.id
  loop
    v_prepared := public.teacher_prepare_learner_deletion(
      v_student.id,
      'school',
      'authorised_school_official'
    );
    perform public.teacher_delete_learner_data(
      (v_prepared ->> 'requestId')::uuid,
      v_student.id,
      v_prepared ->> 'subjectRef',
      'DELETE LEARNER DATA'
    );
    v_deleted_student_ids := array_append(v_deleted_student_ids, v_student.id);
    v_deleted := v_deleted + 1;
  end loop;

  update public.deletion_propagation_records
  set
    status = 'evidence_required',
    updated_at = v_now
  where school_id = p_school_id
    and status = 'awaiting_expiry'
    and provider_expires_at <= v_now
    and backup_expires_at <= v_now;
  get diagnostics v_row_count = row_count;

  insert into public.retention_job_runs (
    school_id,
    actor_id,
    policy_snapshot,
    preview_snapshot,
    archived_learners,
    deleted_learners,
    propagation_records_due,
    completed_at
  )
  values (
    p_school_id,
    v_actor_id,
    to_jsonb(v_policy),
    v_preview,
    v_archived,
    v_deleted,
    v_row_count,
    v_now
  );

  return jsonb_build_object(
    'schoolId', p_school_id,
    'completedAt', v_now,
    'archivedLearners', v_archived,
    'deletedLearners', v_deleted,
    'deletedStudentIds', to_jsonb(v_deleted_student_ids),
    'propagationRecordsDueForEvidence', v_row_count,
    'residualPreview', public.admin_preview_school_retention(p_school_id)
  );
end;
$$;

grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

revoke all on function public.admin_get_school_retention_policy(uuid)
  from public, anon;
revoke all on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) from public, anon;
revoke all on function public.admin_preview_school_retention(uuid)
  from public, anon;
revoke all on function public.admin_list_deletion_propagation(uuid)
  from public, anon;
revoke all on function public.admin_verify_deletion_propagation(
  uuid, text, text
) from public, anon;
revoke all on function public.admin_run_school_retention(uuid, text)
  from public, anon;
revoke all on function public.queue_deletion_propagation()
  from public, anon, authenticated;

comment on table public.school_retention_policies is
  'Versioned school instruction for inactivity, archive, end-of-year, provider, and backup retention.';
comment on table public.deletion_propagation_records is
  'Privacy-minimal proof that active deletion occurred and provider/backup expiry is pending, due for evidence, or explicitly verified.';
comment on table public.retention_job_runs is
  'Immutable result record for each authorised school retention job run.';
