-- Preserve every administrator account decision and stop an ordinary teacher
-- from moving an entire class roster by editing a field labelled "School name".

create table if not exists public.teacher_account_decision_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  teacher_user_id uuid not null,
  previous_status text not null,
  decision_status text not null,
  reason text,
  school_id uuid,
  school_name text,
  decided_by uuid,
  decided_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp(),
  constraint teacher_account_decision_events_previous_status_check
    check (previous_status in ('pending', 'approved', 'rejected', 'disabled')),
  constraint teacher_account_decision_events_decision_status_check
    check (decision_status in ('approved', 'rejected', 'disabled')),
  constraint teacher_account_decision_events_reason_length_check
    check (reason is null or char_length(reason) between 5 and 500)
);

create index if not exists teacher_account_decision_events_account_time_idx
  on public.teacher_account_decision_events (account_id, decided_at desc);

create unique index if not exists teacher_account_decision_events_backfill_key
  on public.teacher_account_decision_events (
    account_id,
    decision_status,
    decided_at
  );

alter table public.teacher_account_decision_events enable row level security;

revoke all on table public.teacher_account_decision_events
  from public, anon, authenticated;
grant select on table public.teacher_account_decision_events
  to authenticated;

drop policy if exists "App admins can read teacher account decision history"
  on public.teacher_account_decision_events;
create policy "App admins can read teacher account decision history"
  on public.teacher_account_decision_events
  for select
  to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.reject_teacher_account_decision_event_mutation()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  raise exception using
    errcode = '42501',
    message = 'Teacher-account decision history is append-only.';
end;
$$;

revoke all on function public.reject_teacher_account_decision_event_mutation()
  from public, anon, authenticated;

drop trigger if exists reject_teacher_account_decision_event_mutation
  on public.teacher_account_decision_events;
create trigger reject_teacher_account_decision_event_mutation
  before update or delete on public.teacher_account_decision_events
  for each row
  execute function public.reject_teacher_account_decision_event_mutation();

-- Preserve the one review currently available from installations upgraded
-- from the previous summary-only account record.
insert into public.teacher_account_decision_events (
  account_id,
  teacher_user_id,
  previous_status,
  decision_status,
  reason,
  school_id,
  school_name,
  decided_by,
  decided_at,
  created_at
)
select
  account.id,
  account.user_id,
  'pending',
  lower(coalesce(nullif(account.approval_status, ''), account.status)),
  case
    when lower(coalesce(nullif(account.approval_status, ''), account.status))
      in ('rejected', 'disabled')
    then coalesce(
      nullif(btrim(coalesce(account.rejection_reason, '')), ''),
      'Legacy decision; no reason was recorded.'
    )
    else null
  end,
  account.school_id,
  school.name,
  coalesce(account.reviewed_by, account.approved_by, account.rejected_by),
  coalesce(
    account.reviewed_at,
    account.approved_at,
    account.rejected_at,
    account.updated_at,
    account.created_at
  ),
  coalesce(
    account.reviewed_at,
    account.approved_at,
    account.rejected_at,
    account.updated_at,
    account.created_at
  )
from public.pending_teacher_accounts account
left join public.schools school on school.id = account.school_id
where lower(coalesce(nullif(account.approval_status, ''), account.status))
    in ('approved', 'rejected', 'disabled')
on conflict (account_id, decision_status, decided_at) do nothing;

create or replace function public.admin_set_teacher_account_status(
  p_account_id uuid,
  p_status text,
  p_rejection_reason text default null
)
returns setof public.pending_teacher_accounts
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_reason text := nullif(btrim(coalesce(p_rejection_reason, '')), '');
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_decided_at timestamptz := clock_timestamp();
  v_account public.pending_teacher_accounts%rowtype;
  v_school_name text;
begin
  if v_actor_id is null or not public.is_app_admin(v_actor_id) then
    raise exception using
      errcode = '42501',
      message = 'Only an app administrator can decide a teacher account.';
  end if;

  if p_account_id is null
     or v_status not in ('approved', 'rejected', 'disabled')
  then
    raise exception using
      errcode = '22023',
      message = 'Choose a valid teacher account decision.';
  end if;

  if v_status in ('rejected', 'disabled')
     and char_length(coalesce(v_reason, '')) not between 5 and 500
  then
    raise exception using
      errcode = '22023',
      message = 'Enter a review reason between 5 and 500 characters.';
  end if;

  if v_status = 'approved' and v_reason is not null then
    raise exception using
      errcode = '22023',
      message = 'An approval does not accept a rejection or disable reason.';
  end if;

  select account.*
  into v_account
  from public.pending_teacher_accounts account
  where account.id = p_account_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'That teacher account no longer exists.';
  end if;

  if v_status = 'approved' and not exists (
    select 1
    from public.schools school
    where school.id = v_account.school_id
  ) then
    raise exception using
      errcode = '22023',
      message = 'Resolve the teacher account school before approving access.';
  end if;

  select school.name
  into v_school_name
  from public.schools school
  where school.id = v_account.school_id;

  perform set_config(
    'literacy_path.teacher_account_decision',
    'on',
    true
  );

  update public.pending_teacher_accounts account
  set
    status = v_status,
    approval_status = v_status,
    role = case when v_status = 'approved' then 'teacher' else 'pending' end,
    reviewed_at = v_decided_at,
    reviewed_by = v_actor_id,
    approved_at = case
      when v_status = 'approved' then v_decided_at
      when v_status = 'rejected' then null
      else account.approved_at
    end,
    approved_by = case
      when v_status = 'approved' then v_actor_id
      when v_status = 'rejected' then null
      else account.approved_by
    end,
    rejected_at = case
      when v_status = 'rejected' then v_decided_at
      when v_status = 'approved' then null
      else account.rejected_at
    end,
    rejected_by = case
      when v_status = 'rejected' then v_actor_id
      when v_status = 'approved' then null
      else account.rejected_by
    end,
    rejection_reason = case
      when v_status in ('rejected', 'disabled') then v_reason
      else null
    end,
    updated_at = v_decided_at
  where account.id = p_account_id;

  insert into public.teacher_account_decision_events (
    account_id,
    teacher_user_id,
    previous_status,
    decision_status,
    reason,
    school_id,
    school_name,
    decided_by,
    decided_at,
    created_at
  )
  values (
    v_account.id,
    v_account.user_id,
    lower(coalesce(
      nullif(v_account.approval_status, ''),
      nullif(v_account.status, ''),
      'pending'
    )),
    v_status,
    case when v_status = 'approved' then null else v_reason end,
    v_account.school_id,
    v_school_name,
    v_actor_id,
    v_decided_at,
    v_decided_at
  );

  return query
  select account.*
  from public.pending_teacher_accounts account
  where account.id = p_account_id;
end;
$$;

comment on function public.admin_set_teacher_account_status(
  uuid, text, text
) is
  'Applies an administrator decision using auth.uid() and database time, then appends an immutable decision-history event.';

revoke all on function public.admin_set_teacher_account_status(
  uuid, text, text
) from public, anon, authenticated;
grant execute on function public.admin_set_teacher_account_status(
  uuid, text, text
) to authenticated;

create or replace function public.teacher_set_school(p_school_name text)
returns table (school_id uuid, school_name text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_id uuid;
  v_name text;
  v_clean_name text := regexp_replace(
    btrim(coalesce(p_school_name, '')),
    '\s+',
    ' ',
    'g'
  );
  v_account public.pending_teacher_accounts%rowtype;
  v_is_admin boolean;
begin
  if v_user is null then
    raise exception using
      errcode = '42501',
      message = 'Sign in before choosing a school.';
  end if;

  v_is_admin := public.is_app_admin(v_user);

  select account.*
  into v_account
  from public.pending_teacher_accounts account
  where account.user_id = v_user
  for update;

  if found and v_account.school_id is not null and not v_is_admin then
    select school.id, school.name
    into v_id, v_name
    from public.schools school
    where school.id = v_account.school_id;

    if v_id is null then
      raise exception using
        errcode = '23503',
        message = 'The linked school record could not be found.';
    end if;

    if lower(v_clean_name) = lower(btrim(v_name)) then
      return query select v_id, v_name;
      return;
    end if;

    raise exception using
      errcode = '42501',
      message = 'School transfers must be completed by an administrator.';
  end if;

  if not v_is_admin then
    perform public.assert_current_actor_teacher_access();
    if v_account.id is null or v_account.school_id is not null then
      raise exception using
        errcode = '42501',
        message = 'School transfers must be completed by an administrator.';
    end if;
  end if;

  select school.id, school.name
  into v_id, v_name
  from public.find_or_create_school(v_clean_name) school;

  if v_account.id is null then
    if not v_is_admin then
      raise exception using
        errcode = '42501',
        message = 'An approved teacher account is required.';
    end if;

    select auth_user.email
    into v_email
    from auth.users auth_user
    where auth_user.id = v_user;

    perform set_config(
      'literacy_path.teacher_account_decision',
      'on',
      true
    );

    insert into public.pending_teacher_accounts (
      user_id,
      email,
      role,
      status,
      approval_status,
      school_id,
      approved_at,
      approved_by,
      reviewed_at,
      reviewed_by
    )
    values (
      v_user,
      coalesce(v_email, ''),
      'teacher',
      'approved',
      'approved',
      v_id,
      clock_timestamp(),
      v_user,
      clock_timestamp(),
      v_user
    );
  else
    update public.pending_teacher_accounts
    set school_id = v_id,
        updated_at = clock_timestamp()
    where id = v_account.id;
  end if;

  update public.classes
  set school_id = v_id
  where teacher_id = v_user;

  return query select v_id, v_name;
end;
$$;

comment on function public.teacher_set_school(text) is
  'Assigns an approved teacher with no school exactly once. Existing school transfers are administrator-only so a settings edit cannot move a class roster between tenants.';

revoke all on function public.teacher_set_school(text)
  from public, anon, authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;

notify pgrst, 'reload schema';
