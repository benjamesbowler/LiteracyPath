-- Close the database API boundary for every SECURITY DEFINER function.
--
-- PostgreSQL grants EXECUTE on new functions to PUBLIC unless it is revoked.
-- Revoking only from `anon` is therefore insufficient because `anon` inherits
-- PUBLIC privileges. This migration first removes API-role execution from
-- every current SECURITY DEFINER function, then grants only the exact RPC
-- signatures used by the product.

-- Remove obsolete child-login entry points entirely. They were replaced by
-- the device-aware, class-code-gated RPCs below and are not used by the app.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

-- Authenticated users may read the school directory, but cannot bypass the
-- bounded RPC to insert or alter directory rows directly.
revoke insert, update, delete on public.schools from authenticated;
drop policy if exists "Authenticated users can create schools" on public.schools;

-- School creation is part of teacher onboarding, not the anonymous child API.
-- The auth.users trigger may call this bounded helper as its owner; browser
-- callers must be authenticated.
create or replace function public.find_or_create_school(p_name text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_clean text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_id uuid;
  v_name text;
begin
  if char_length(v_clean) < 2
     or char_length(v_clean) > 120
     or v_clean ~ '[[:cntrl:]]'
  then
    raise exception 'invalid_school_name';
  end if;

  insert into public.schools (name)
  values (v_clean)
  on conflict (name_normalized) do update set name = public.schools.name
  returning public.schools.id, public.schools.name into v_id, v_name;

  return query select v_id, v_name;
end;
$$;

-- Capture the school name inside the trusted auth trigger. This avoids the old
-- pre-signup anonymous SECURITY DEFINER write and ensures the durable pending
-- account receives its school even when email confirmation returns no session.
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
begin
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

  if coalesce((new.raw_user_meta_data ->> 'audit_only')::boolean, false) is false
     and (
       requested_username is null
       or requested_username !~ '^[a-z0-9_-]{3,30}$'
       or requested_display_name is null
       or char_length(requested_display_name) > 80
       or requested_school_name is null
     )
  then
    raise exception 'invalid_teacher_signup_metadata';
  end if;

  if requested_username is not null and exists (
    select 1
    from public.pending_teacher_accounts
    where lower(username) = requested_username
  ) then
    raise exception 'username_unavailable';
  end if;

  if requested_school_name is not null then
    select school.id
    into requested_school_id
    from public.find_or_create_school(requested_school_name) school;
  end if;

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    username,
    display_name,
    name,
    role,
    status,
    approval_status,
    school_id,
    requested_at,
    created_at
  )
  values (
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
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Fail closed for all present SECURITY DEFINER functions, including internal
-- helpers and trigger functions. The owner retains execution automatically.
do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
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

notify pgrst, 'reload schema';
