-- Close anonymous roster enumeration + first-login account hijack.
--
-- Before this migration, anon could walk student_list_schools -> _classes ->
-- _students and dump every child's real name, then call student_set_password on
-- any un-onboarded child to claim their account. Both RPCs were granted to anon.
--
-- Fix: a per-class access_code (a secret NOT shipped in the app bundle, handed
-- out by the teacher). The child login flow now needs the code to see any class
-- roster, and first-time password setup needs the code too. Enumeration and
-- hijack both require the out-of-band code, which anon does not have.
--
-- Idempotent + safe to re-run. Run in the Supabase SQL editor.

-- ─── 1. access_code column, generator, backfill, auto-assign ────────────────

-- Unambiguous alphabet (no 0/O/1/I/L) so a 5-year-old's teacher can read it out.
create or replace function public.gen_class_access_code()
returns text
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i int;
  v_exists boolean;
begin
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    select exists(select 1 from public.classes where access_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

alter table public.classes add column if not exists access_code text;
create unique index if not exists classes_access_code_key on public.classes (access_code);

-- Backfill every existing class, then require the column going forward.
update public.classes set access_code = public.gen_class_access_code() where access_code is null;
alter table public.classes alter column access_code set not null;

-- New classes get a code automatically, so the teacher app's plain INSERT keeps
-- working with no client change to the insert itself.
create or replace function public.set_class_access_code()
returns trigger language plpgsql as $$
begin
  if new.access_code is null then
    new.access_code := public.gen_class_access_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_class_access_code on public.classes;
create trigger trg_class_access_code before insert on public.classes
  for each row execute function public.set_class_access_code();

-- ─── 2. Code-gated roster lookup (replaces the anon enumeration walk) ────────

create or replace function public.student_class_by_code(p_code text)
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  v_class public.classes;
  v_students json;
  v_school json;
begin
  if p_code is null or btrim(p_code) = '' then
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select * into v_class from public.classes
  where access_code = upper(btrim(p_code));
  if v_class.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select json_agg(
           json_build_object('id', s.id, 'name', s.name,
             'has_password', (s.symbol_password is not null))
           order by s.name)
    into v_students
  from public.students s where s.class_id = v_class.id;

  select json_build_object('id', sc.id, 'name', sc.name) into v_school
  from public.schools sc where sc.id = v_class.school_id;

  return json_build_object(
    'ok', true,
    'class', json_build_object('id', v_class.id, 'name', v_class.name),
    'school', v_school,
    'students', coalesce(v_students, '[]'::json)
  );
end;
$$;

-- ─── 3. First-time password setup now requires the class code ───────────────
-- (overload: keeps the old 2-arg signature defined, but we revoke anon from it
--  below so only this code-checked 3-arg version is reachable anonymously).

create or replace function public.student_set_password(p_student_id uuid, p_sequence text, p_code text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_class public.classes;
  v_token text;
begin
  if p_sequence !~ '^[1-9]{3}$' then
    return json_build_object('ok', false, 'error', 'invalid_sequence');
  end if;

  select * into v_student from public.students where id = p_student_id;
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_class from public.classes where id = v_student.class_id;
  if v_class.id is null or v_class.access_code is distinct from upper(btrim(p_code)) then
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_student.symbol_password is not null then
    return json_build_object('ok', false, 'error', 'already_set');
  end if;

  update public.students
  set symbol_password = p_sequence,
      password_set_at = now(),
      failed_login_count = 0
  where id = p_student_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token) values (p_student_id, v_token);

  return json_build_object(
    'ok', true, 'token', v_token,
    'student_id', v_student.id, 'student_name', v_student.name,
    'class_id', v_student.class_id, 'teacher_id', v_student.teacher_id,
    'school_id', v_class.school_id
  );
end;
$$;

-- ─── 4. Teacher-only: regenerate a class code (e.g. after it leaks) ──────────

create or replace function public.teacher_regenerate_class_code(p_class_id uuid)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_owner uuid;
  v_code text;
begin
  select teacher_id into v_owner from public.classes where id = p_class_id;
  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid() and not public.is_app_admin(auth.uid()) then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_code := public.gen_class_access_code();
  update public.classes set access_code = v_code where id = p_class_id;
  return json_build_object('ok', true, 'access_code', v_code);
end;
$$;

-- ─── 5. Grants: revoke the enumeration + un-gated setup from anon ────────────

revoke execute on function public.student_list_schools() from anon;
revoke execute on function public.student_list_classes(uuid) from anon;
revoke execute on function public.student_list_students(uuid) from anon;
revoke execute on function public.student_set_password(uuid, text) from anon;

grant execute on function public.student_class_by_code(text) to anon, authenticated;
grant execute on function public.student_set_password(uuid, text, text) to anon, authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid) to authenticated;

-- student_login(uuid, text) is intentionally left as-is: a student_id is now only
-- obtainable through the code-gated lookup above, and login already has a
-- failed-attempt lockout, so brute force stays bounded.
