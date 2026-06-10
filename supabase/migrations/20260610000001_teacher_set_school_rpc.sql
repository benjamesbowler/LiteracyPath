-- Let any signed-in teacher (or admin) set their school reliably.
--
-- Why: the self-update RLS policy on pending_teacher_accounts only allows
-- updates while approval status is 'pending'. Approved teachers and admins
-- (who may have no row at all) silently updated zero rows, so "Set your
-- school" never persisted. This security-definer RPC owns that write path.

create or replace function public.teacher_set_school(p_school_name text)
returns table (school_id uuid, school_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_id uuid;
  v_name text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select s.id, s.name into v_id, v_name
  from public.find_or_create_school(p_school_name) as s;

  update public.pending_teacher_accounts
  set school_id = v_id,
      updated_at = now()
  where user_id = v_user;

  if not found then
    -- Admins and legacy accounts may have no signup row; create one so the
    -- school sticks. Marked approved because the caller is already inside
    -- the app (new signups always get a row from the signup trigger).
    select u.email into v_email from auth.users u where u.id = v_user;
    insert into public.pending_teacher_accounts
      (user_id, email, role, status, approval_status, school_id, approved_at)
    values
      (v_user, coalesce(v_email, ''), 'teacher', 'approved', 'approved', v_id, now())
    on conflict (user_id) do update
      set school_id = excluded.school_id, updated_at = now();
  end if;

  -- Keep all of this teacher's classes on their current school so students
  -- can find them through child login.
  update public.classes
  set school_id = v_id
  where teacher_id = v_user;

  return query select v_id, v_name;
end;
$$;

revoke all on function public.teacher_set_school(text) from public, anon;
grant execute on function public.teacher_set_school(text) to authenticated;
