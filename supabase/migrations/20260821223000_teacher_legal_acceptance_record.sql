begin;

alter table public.pending_teacher_accounts
  add column if not exists legal_terms_version text,
  add column if not exists privacy_notice_version text,
  add column if not exists legal_accepted_at timestamptz,
  add column if not exists legal_acceptance_source text;

alter table public.pending_teacher_accounts
  drop constraint if exists pending_teacher_accounts_legal_acceptance_check;
alter table public.pending_teacher_accounts
  add constraint pending_teacher_accounts_legal_acceptance_check
  check (
    (
      legal_terms_version is null
      and privacy_notice_version is null
      and legal_accepted_at is null
      and legal_acceptance_source is null
    )
    or (
      legal_terms_version is not null
      and privacy_notice_version is not null
      and legal_accepted_at is not null
      and legal_acceptance_source = 'teacher_signup'
    )
  );

comment on column public.pending_teacher_accounts.legal_terms_version is
  'Terms version the teacher affirmatively accepted when requesting the account.';
comment on column public.pending_teacher_accounts.privacy_notice_version is
  'Privacy notice version presented with the teacher account request.';
comment on column public.pending_teacher_accounts.legal_accepted_at is
  'Server-recorded acceptance time; client-supplied timestamps are not trusted.';
comment on column public.pending_teacher_accounts.legal_acceptance_source is
  'How acceptance was collected. Current value: teacher_signup.';

create or replace function public.create_pending_teacher_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
  requested_school_name text;
  requested_school_id uuid;
  requested_terms_version text;
  requested_privacy_version text;
  accepted_legal boolean;
  audit_only boolean;
begin
  audit_only := coalesce((new.raw_user_meta_data ->> 'audit_only')::boolean, false);
  requested_username := lower(nullif(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_-]',
    '',
    'g'
  ), ''));
  requested_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    requested_username
  );
  requested_school_name := nullif(btrim(new.raw_user_meta_data ->> 'school_name'), '');
  requested_terms_version := nullif(btrim(new.raw_user_meta_data ->> 'legal_terms_version'), '');
  requested_privacy_version := nullif(btrim(new.raw_user_meta_data ->> 'privacy_notice_version'), '');
  accepted_legal := coalesce((new.raw_user_meta_data ->> 'legal_terms_accepted')::boolean, false);

  if not audit_only and (
    requested_username is null
    or requested_username !~ '^[a-z0-9_-]{3,30}$'
    or requested_display_name is null
    or char_length(requested_display_name) > 80
    or requested_school_name is null
    or not accepted_legal
    or requested_terms_version <> '2026-08-21-uk-beta-v1'
    or requested_privacy_version <> '2026-08-21-uk-v1'
  ) then
    raise exception 'invalid_teacher_signup_metadata';
  end if;

  if requested_username is not null and exists (
    select 1 from public.pending_teacher_accounts
    where lower(username) = requested_username
  ) then
    raise exception 'username_unavailable';
  end if;

  if requested_school_name is not null then
    select school.id into requested_school_id
    from public.create_school_directory_entry(requested_school_name) school;
  end if;

  insert into public.pending_teacher_accounts (
    user_id, email, username, display_name, name, role, status,
    approval_status, school_id, requested_at, created_at,
    legal_terms_version, privacy_notice_version, legal_accepted_at,
    legal_acceptance_source
  ) values (
    new.id,
    new.email,
    requested_username,
    requested_display_name,
    coalesce(requested_display_name, requested_username, split_part(new.email, '@', 1)),
    'pending',
    'pending',
    'pending',
    requested_school_id,
    now(),
    now(),
    case when accepted_legal then requested_terms_version end,
    case when accepted_legal then requested_privacy_version end,
    case when accepted_legal then now() end,
    case when accepted_legal then 'teacher_signup' end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_pending_teacher_account_for_new_user()
  from public, anon, authenticated;

create or replace function public.enforce_teacher_account_audit_integrity()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_trusted_decision boolean := (
    (
      session_user in ('postgres', 'supabase_admin')
      and coalesce(current_setting('role', true), 'none')
        in ('none', 'postgres', 'supabase_admin')
    )
    or (
      coalesce(current_setting('literacy_path.teacher_account_decision', true), '') = 'on'
      and public.is_app_admin(auth.uid())
    )
  );
begin
  if tg_op = 'INSERT' then
    if not v_trusted_decision then
      if lower(coalesce(new.role, '')) <> 'pending'
         or lower(coalesce(new.status, '')) <> 'pending'
         or lower(coalesce(new.approval_status, '')) <> 'pending'
         or new.reviewed_at is not null
         or new.reviewed_by is not null
         or new.approved_at is not null
         or new.approved_by is not null
         or new.rejected_at is not null
         or new.rejected_by is not null
         or new.rejection_reason is not null
      then
        raise exception using
          errcode = '42501',
          message = 'Teacher-account decision fields are set by the server.';
      end if;

      new.requested_at := now();
      new.created_at := now();
      new.updated_at := now();
    end if;
    return new;
  end if;

  if new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at
     or new.requested_at is distinct from old.requested_at
     or new.legal_terms_version is distinct from old.legal_terms_version
     or new.privacy_notice_version is distinct from old.privacy_notice_version
     or new.legal_accepted_at is distinct from old.legal_accepted_at
     or new.legal_acceptance_source is distinct from old.legal_acceptance_source
  then
    raise exception using
      errcode = '42501',
      message = 'Teacher-account identity, request timestamps, and legal acceptance cannot be changed.';
  end if;

  if not v_trusted_decision and (
    new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.approval_status is distinct from old.approval_status
    or new.reviewed_at is distinct from old.reviewed_at
    or new.reviewed_by is distinct from old.reviewed_by
    or new.approved_at is distinct from old.approved_at
    or new.approved_by is distinct from old.approved_by
    or new.rejected_at is distinct from old.rejected_at
    or new.rejected_by is distinct from old.rejected_by
    or new.rejection_reason is distinct from old.rejection_reason
  ) then
    raise exception using
      errcode = '42501',
      message = 'Teacher-account decisions must use the administrator action.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.enforce_teacher_account_audit_integrity()
  from public, anon, authenticated;

commit;
