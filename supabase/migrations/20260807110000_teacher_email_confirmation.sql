-- An unverified email address can no longer be approved into teacher access.
--
-- WHY. Signup validated that a string contained an "@" and nothing else. Email
-- confirmation was off (supabase/config.toml: enable_confirmations = false),
-- nothing anywhere read auth.users.email_confirmed_at, and there was no
-- confirmation UI. An address that does not exist could complete signup, reach
-- the approval queue, and — if approved — hold full access to real children's
-- records under an identity nobody could reach or verify.
--
-- Manual approval was chosen over domain-based auto-approval, which makes this
-- the load-bearing check: the administrator is judging a person by their email
-- address, so the address has to be real.
--
-- WHAT THIS DOES NOT DO. It does not touch current_actor_has_teacher_access().
-- Adding a confirmation requirement there would evaluate against every existing
-- session, and every account created while confirmations were off has a null
-- email_confirmed_at — it would lock out every current teacher at once. The
-- requirement is enforced at the approval decision instead, which is a
-- deliberate act by an administrator on one account at a time. Approved implies
-- confirmed for everything created from here on, and nothing already working
-- stops working.

begin;

/* ------------------------------------------------------------------ *
 * The column, and an honest backfill
 * ------------------------------------------------------------------ */

alter table public.pending_teacher_accounts
  add column if not exists email_confirmed_at timestamptz;

-- Distinguishes an address the account holder actually proved from one this
-- migration waved through. Without it, grandfathered accounts would be
-- indistinguishable from verified ones forever, and the whole point of the
-- change is to know which addresses are real.
alter table public.pending_teacher_accounts
  add column if not exists email_confirmation_source text;

alter table public.pending_teacher_accounts
  drop constraint if exists pending_teacher_accounts_email_confirmation_source_check;
alter table public.pending_teacher_accounts
  add constraint pending_teacher_accounts_email_confirmation_source_check
  check (
    email_confirmation_source is null
    or email_confirmation_source in ('confirmed', 'grandfathered')
  );

-- Anyone who genuinely confirmed (or was seeded pre-confirmed) carries the real
-- timestamp.
update public.pending_teacher_accounts account
set
  email_confirmed_at = users.email_confirmed_at,
  email_confirmation_source = 'confirmed'
from auth.users users
where users.id = account.user_id
  and users.email_confirmed_at is not null
  and account.email_confirmed_at is null;

-- Everyone else who ALREADY HOLDS ACCESS is grandfathered. Their address was
-- never verified — confirmations were off — but an administrator approved them
-- by hand, and revoking working access from real teachers to enforce a rule
-- introduced today would be the wrong trade. Tagged so the list can be found:
--
--   select email from public.pending_teacher_accounts
--   where email_confirmation_source = 'grandfathered';
--
-- Accounts still pending are NOT grandfathered. They have not been let in yet,
-- so the new rule can apply to them at no cost to anybody.
update public.pending_teacher_accounts account
set
  email_confirmed_at = coalesce(account.approved_at, account.reviewed_at, account.created_at),
  email_confirmation_source = 'grandfathered'
where account.email_confirmed_at is null
  and lower(coalesce(account.approval_status, account.status, '')) = 'approved';

comment on column public.pending_teacher_accounts.email_confirmed_at is
  'When the account holder proved this address, mirrored from auth.users. Null means unproven, and an unproven address cannot be approved.';
comment on column public.pending_teacher_accounts.email_confirmation_source is
  '''confirmed'' = the holder proved it. ''grandfathered'' = approved before confirmation was required and never actually verified.';

/* ------------------------------------------------------------------ *
 * Keep it in step with auth.users
 * ------------------------------------------------------------------ */

-- SECURITY DEFINER because this fires as the auth admin role, which has no
-- rights on public.pending_teacher_accounts and would otherwise fail — and a
-- trigger that raises on auth.users UPDATE would break email confirmation
-- itself, which is a far worse outcome than the problem being solved. Every
-- statement below is wrapped for the same reason: this trigger must never be
-- the reason a confirmation fails.
create or replace function public.sync_teacher_account_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  begin
    update public.pending_teacher_accounts account
    set
      email_confirmed_at = new.email_confirmed_at,
      email_confirmation_source = 'confirmed',
      updated_at = now()
    where account.user_id = new.id
      and account.email_confirmed_at is distinct from new.email_confirmed_at;
  exception when others then
    -- Deliberately swallowed. A failure here must not roll back the user's
    -- confirmation. The account simply stays unapprovable until the next
    -- confirmation event or a manual repair, which is a visible, recoverable
    -- state rather than a locked door.
    raise warning 'Could not sync teacher email confirmation for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.sync_teacher_account_email_confirmation()
  from public, anon, authenticated;

drop trigger if exists sync_teacher_email_confirmation_on_insert on auth.users;
create trigger sync_teacher_email_confirmation_on_insert
  after insert on auth.users
  for each row
  execute function public.sync_teacher_account_email_confirmation();

drop trigger if exists sync_teacher_email_confirmation_on_update on auth.users;
create trigger sync_teacher_email_confirmation_on_update
  after update of email_confirmed_at on auth.users
  for each row
  execute function public.sync_teacher_account_email_confirmation();

/* ------------------------------------------------------------------ *
 * The rule: no approval without a proven address
 * ------------------------------------------------------------------ */

-- Replaces the version in 20260728127000. The ONLY change is the confirmation
-- check inserted after the school check; everything else is carried across
-- unaltered so this file can be read as a whole rather than diffed.
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
  v_confirmed_at timestamptz;
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

  -- THE NEW RULE. Read live from auth.users rather than trusting the mirrored
  -- column, so a sync that silently failed cannot let an unverified address
  -- through. The mirror is for display; this is for the decision.
  if v_status = 'approved' then
    select coalesce(users.email_confirmed_at, v_account.email_confirmed_at)
    into v_confirmed_at
    from auth.users users
    where users.id = v_account.user_id;

    if v_confirmed_at is null then
      raise exception using
        errcode = '22023',
        message = 'This teacher has not confirmed their email address yet. Access cannot be approved until they do.';
    end if;
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
  'Applies an administrator decision using auth.uid() and database time, then appends an immutable decision-history event. Approval requires a resolved school and a confirmed email address.';

commit;
