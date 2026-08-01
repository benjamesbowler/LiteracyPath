-- Teacher-led shared reading sessions. Student devices follow by polling the
-- opaque-token RPC; no Realtime or raw Supabase client surface is introduced.

begin;

create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  book_id text not null check (char_length(btrim(book_id)) between 1 and 120),
  page_numbers integer[] not null check (cardinality(page_numbers) between 1 and 60),
  page_index integer not null default 0,
  student_ids uuid[] not null check (cardinality(student_ids) between 1 and 6),
  content_version text not null check (char_length(btrim(content_version)) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'ended')),
  mark_event_ids text[] not null default '{}',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint reading_sessions_page_index_range check (
    page_index >= 0 and page_index < cardinality(page_numbers)
  ),
  constraint reading_sessions_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint reading_sessions_owner_key unique (id, teacher_id)
);

create unique index if not exists reading_sessions_one_active_per_teacher_idx
  on public.reading_sessions (teacher_id)
  where status = 'active';

create index if not exists reading_sessions_active_students_idx
  on public.reading_sessions using gin (student_ids)
  where status = 'active';

create index if not exists reading_sessions_retention_idx
  on public.reading_sessions (ended_at)
  where status = 'ended';

create table if not exists public.reading_session_presence (
  session_id uuid not null references public.reading_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  page_index integer,
  content_ok boolean not null default true,
  last_seen_at timestamptz not null default now(),
  primary key (session_id, student_id),
  check (page_index is null or page_index between 0 and 59)
);

create or replace function public.validate_reading_session_membership()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_distinct_count integer;
  v_valid_count integer;
begin
  select count(distinct member_id), count(*)
    into v_distinct_count, v_valid_count
  from unnest(new.student_ids) member_id;

  if v_distinct_count <> cardinality(new.student_ids) then
    raise exception using errcode = '23514', message = 'duplicate_student';
  end if;

  select count(*)
    into v_valid_count
  from public.students student
  where student.id = any(new.student_ids)
    and student.class_id = new.class_id
    and student.teacher_id = new.teacher_id
    and student.archived_at is null;

  if v_valid_count <> cardinality(new.student_ids) then
    raise exception using errcode = '23514', message = 'student_not_in_class';
  end if;

  if exists (
    select 1 from unnest(new.page_numbers) page_number
    where page_number is null or page_number < 0
  ) or (
    select count(distinct page_number) from unnest(new.page_numbers) page_number
  ) <> cardinality(new.page_numbers) then
    raise exception using errcode = '23514', message = 'invalid_page_numbers';
  end if;

  return new;
end;
$$;

drop trigger if exists reading_sessions_membership_guard on public.reading_sessions;
create trigger reading_sessions_membership_guard
before insert or update of teacher_id, class_id, student_ids, page_numbers
on public.reading_sessions
for each row execute function public.validate_reading_session_membership();

alter table public.reading_sessions enable row level security;
alter table public.reading_session_presence enable row level security;

drop policy if exists "Teachers read their reading sessions" on public.reading_sessions;
create policy "Teachers read their reading sessions"
  on public.reading_sessions for select to authenticated
  using (teacher_id = auth.uid());

drop policy if exists "Teachers create their reading sessions" on public.reading_sessions;
create policy "Teachers create their reading sessions"
  on public.reading_sessions for insert to authenticated
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers update their reading sessions" on public.reading_sessions;
create policy "Teachers update their reading sessions"
  on public.reading_sessions for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers delete their reading sessions" on public.reading_sessions;
create policy "Teachers delete their reading sessions"
  on public.reading_sessions for delete to authenticated
  using (teacher_id = auth.uid());

revoke all on table public.reading_sessions
  from public, anon, authenticated;
grant select, insert, update, delete on table public.reading_sessions
  to authenticated;

-- Presence is an RPC-only boundary: RLS is on, no policy exists, and browser
-- roles have no table grants.
revoke all on table public.reading_session_presence
  from public, anon, authenticated;

create or replace function public.teacher_start_reading_session(
  p_class_id uuid,
  p_book_id text,
  p_page_numbers integer[],
  p_student_ids uuid[],
  p_content_version text
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.reading_sessions;
  v_invalid_student uuid;
  v_busy_student uuid;
  v_busy_teacher text;
begin
  perform public.assert_current_actor_teacher_access();

  if p_class_id is null
    or nullif(btrim(coalesce(p_book_id, '')), '') is null
    or char_length(btrim(p_book_id)) > 120
    or coalesce(cardinality(p_page_numbers), 0) not between 1 and 60
    or coalesce(cardinality(p_student_ids), 0) not between 1 and 6
    or nullif(btrim(coalesce(p_content_version, '')), '') is null
    or char_length(btrim(p_content_version)) > 120
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  if not exists (
    select 1 from public.classes class
    where class.id = p_class_id and class.teacher_id = v_actor
  ) then
    return json_build_object('ok', false, 'error', 'class_not_found');
  end if;

  -- Serialize competing starts for the same children before checking whether
  -- another active session already contains one of them.
  perform 1
  from public.students student
  where student.id = any(p_student_ids)
  order by student.id
  for update;

  select requested.student_id
    into v_invalid_student
  from unnest(p_student_ids) requested(student_id)
  left join public.students student
    on student.id = requested.student_id
   and student.class_id = p_class_id
   and student.teacher_id = v_actor
   and student.archived_at is null
  where student.id is null
  limit 1;

  if v_invalid_student is not null then
    return json_build_object(
      'ok', false,
      'error', 'student_not_in_class',
      'student_id', v_invalid_student
    );
  end if;

  update public.reading_sessions
     set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
   where status = 'active'
     and updated_at < now() - interval '90 minutes';

  select requested.student_id,
         coalesce(
           nullif(btrim(owner.raw_user_meta_data ->> 'display_name'), ''),
           nullif(btrim(owner.raw_user_meta_data ->> 'full_name'), ''),
           'another teacher'
         )
    into v_busy_student, v_busy_teacher
  from unnest(p_student_ids) requested(student_id)
  join public.reading_sessions other_session
    on requested.student_id = any(other_session.student_ids)
   and other_session.status = 'active'
   and other_session.teacher_id <> v_actor
  left join auth.users owner on owner.id = other_session.teacher_id
  limit 1;

  if v_busy_student is not null then
    return json_build_object(
      'ok', false,
      'error', 'student_busy',
      'student_id', v_busy_student,
      'teacher_name', v_busy_teacher
    );
  end if;

  update public.reading_sessions
     set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
   where teacher_id = v_actor and status = 'active';

  insert into public.reading_sessions (
    teacher_id, class_id, book_id, page_numbers, page_index,
    student_ids, content_version
  ) values (
    v_actor, p_class_id, btrim(p_book_id), p_page_numbers, 0,
    p_student_ids, btrim(p_content_version)
  ) returning * into v_session;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id,
      'class_id', v_session.class_id,
      'book_id', v_session.book_id,
      'page_numbers', v_session.page_numbers,
      'page_index', v_session.page_index,
      'student_ids', v_session.student_ids,
      'content_version', v_session.content_version,
      'status', v_session.status,
      'started_at', v_session.started_at,
      'updated_at', v_session.updated_at
    )
  );
exception
  when unique_violation then
    return json_build_object('ok', false, 'error', 'session_conflict');
end;
$$;

create or replace function public.teacher_set_reading_session_page(
  p_session_id uuid,
  p_page_index integer
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_session public.reading_sessions;
begin
  perform public.assert_current_actor_teacher_access();

  select * into v_session
  from public.reading_sessions
  where id = p_session_id and teacher_id = auth.uid()
  for update;

  if v_session.id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;
  if v_session.status <> 'active'
    or v_session.updated_at < now() - interval '90 minutes'
  then
    update public.reading_sessions
       set status = 'ended', ended_at = coalesce(ended_at, now()), updated_at = now()
     where id = v_session.id;
    return json_build_object('ok', false, 'error', 'session_ended');
  end if;
  if p_page_index is null
    or p_page_index < 0
    or p_page_index >= cardinality(v_session.page_numbers)
  then
    return json_build_object('ok', false, 'error', 'page_out_of_range');
  end if;

  update public.reading_sessions
     set page_index = p_page_index, updated_at = now()
   where id = v_session.id
   returning * into v_session;

  return json_build_object(
    'ok', true,
    'page_index', v_session.page_index,
    'updated_at', v_session.updated_at
  );
end;
$$;

create or replace function public.teacher_end_reading_session(p_session_id uuid)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_session public.reading_sessions;
begin
  perform public.assert_current_actor_teacher_access();

  select * into v_session
  from public.reading_sessions
  where id = p_session_id and teacher_id = auth.uid()
  for update;

  if v_session.id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  update public.reading_sessions
     set status = 'ended',
         ended_at = coalesce(ended_at, now()),
         updated_at = case when status = 'active' then now() else updated_at end
   where id = v_session.id
   returning * into v_session;

  return json_build_object(
    'ok', true,
    'status', v_session.status,
    'ended_at', v_session.ended_at
  );
end;
$$;

create or replace function public.teacher_get_reading_session_presence(
  p_session_id uuid
)
returns json
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_session public.reading_sessions;
  v_presence json;
begin
  perform public.assert_current_actor_teacher_access();

  select * into v_session
  from public.reading_sessions
  where id = p_session_id and teacher_id = auth.uid();

  if v_session.id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;

  select coalesce(json_agg(json_build_object(
    'student_id', member.student_id,
    'page_index', presence.page_index,
    'content_ok', coalesce(presence.content_ok, true),
    'last_seen_at', presence.last_seen_at,
    'connected', coalesce(
      presence.last_seen_at > now() - interval '6 seconds'
      and v_session.status = 'active'
      and v_session.updated_at >= now() - interval '90 minutes',
      false
    )
  ) order by member.ordinality), '[]'::json)
  into v_presence
  from unnest(v_session.student_ids) with ordinality member(student_id, ordinality)
  left join public.reading_session_presence presence
    on presence.session_id = v_session.id
   and presence.student_id = member.student_id;

  return json_build_object('ok', true, 'presence', v_presence);
end;
$$;

create or replace function public.teacher_save_reading_marks(
  p_session_id uuid,
  p_student_id uuid,
  p_page_index integer,
  p_marks jsonb,
  p_client_event_id text
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_session public.reading_sessions;
  v_payload jsonb;
  v_pages jsonb;
  v_page jsonb;
begin
  perform public.assert_current_actor_teacher_access();

  if p_student_id is null
    or p_page_index is null
    or p_marks is null
    or jsonb_typeof(p_marks) <> 'object'
    or octet_length(p_marks::text) > 32768
    or nullif(btrim(coalesce(p_client_event_id, '')), '') is null
    or char_length(p_client_event_id) > 120
    or exists (
      select 1 from jsonb_each_text(p_marks) mark
      where mark.key !~ '^[0-9]{1,4}$'
         or mark.value not in ('correct', 'support')
    )
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  select * into v_session
  from public.reading_sessions
  where id = p_session_id and teacher_id = auth.uid()
  for update;

  if v_session.id is null then
    return json_build_object('ok', false, 'error', 'session_not_found');
  end if;
  if v_session.status <> 'active'
    or v_session.updated_at < now() - interval '90 minutes'
  then
    return json_build_object('ok', false, 'error', 'session_ended');
  end if;
  if not p_student_id = any(v_session.student_ids) then
    return json_build_object('ok', false, 'error', 'student_not_in_session');
  end if;
  if not exists (
    select 1
    from public.students student
    where student.id = p_student_id
      and student.class_id = v_session.class_id
      and student.teacher_id = v_session.teacher_id
      and student.archived_at is null
  ) then
    return json_build_object('ok', false, 'error', 'student_not_in_class');
  end if;
  if p_page_index < 0 or p_page_index >= cardinality(v_session.page_numbers) then
    return json_build_object('ok', false, 'error', 'page_out_of_range');
  end if;
  if p_client_event_id = any(v_session.mark_event_ids) then
    return json_build_object('ok', true, 'duplicate', true);
  end if;

  select payload into v_payload
  from public.student_progress
  where student_id = p_student_id
    and area = 'guided_reading'
    and key = v_session.book_id
  for update;

  v_payload := coalesce(v_payload, '{}'::jsonb)
    || jsonb_build_object(
      'v', 1,
      'studentId', p_student_id,
      'bookId', v_session.book_id,
      'updatedAt', now()
    );
  v_pages := coalesce(v_payload -> 'pages', '{}'::jsonb);
  v_page := coalesce(v_pages -> p_page_index::text, '{}'::jsonb);
  v_page := jsonb_set(v_page, '{wordMarks}', p_marks, true);
  v_page := v_page || jsonb_build_object('updatedAt', now());
  v_pages := jsonb_set(v_pages, array[p_page_index::text], v_page, true);
  v_payload := jsonb_set(v_payload, '{pages}', v_pages, true);

  insert into public.student_progress (student_id, area, key, payload, updated_at)
  values (p_student_id, 'guided_reading', v_session.book_id, v_payload, now())
  on conflict (student_id, area, key)
  do update set payload = excluded.payload, updated_at = excluded.updated_at;

  update public.reading_sessions
     set mark_event_ids = array_append(mark_event_ids, p_client_event_id),
         updated_at = now()
   where id = v_session.id;

  return json_build_object('ok', true, 'duplicate', false, 'updated_at', now());
end;
$$;

create or replace function public.student_get_reading_session(
  p_token text,
  p_page_index integer default null,
  p_content_ok boolean default true
)
returns json
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_session public.reading_sessions;
  v_last_seen timestamptz;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;

  if p_page_index is not null and p_page_index not between 0 and 59 then
    return json_build_object('ok', false, 'error', 'invalid_page_index');
  end if;

  select * into v_session
  from public.reading_sessions session
  where session.status = 'active'
    and session.updated_at >= now() - interval '90 minutes'
    and v_student.id = any(session.student_ids)
  order by session.started_at desc
  limit 1;

  if v_session.id is null then
    return json_build_object('ok', true, 'session', null);
  end if;

  select last_seen_at into v_last_seen
  from public.reading_session_presence
  where session_id = v_session.id and student_id = v_student.id;

  -- More than four polls per second still receive the current session but do
  -- not amplify writes to the ephemeral presence row.
  if v_last_seen is null or v_last_seen <= now() - interval '250 milliseconds' then
    insert into public.reading_session_presence (
      session_id, student_id, page_index, content_ok, last_seen_at
    ) values (
      v_session.id, v_student.id, p_page_index, coalesce(p_content_ok, true), now()
    )
    on conflict (session_id, student_id)
    do update set
      page_index = excluded.page_index,
      content_ok = excluded.content_ok,
      last_seen_at = excluded.last_seen_at;
  end if;

  return json_build_object(
    'ok', true,
    'session', json_build_object(
      'id', v_session.id,
      'book_id', v_session.book_id,
      'page_numbers', v_session.page_numbers,
      'page_index', v_session.page_index,
      'content_version', v_session.content_version,
      'updated_at', v_session.updated_at
    )
  );
end;
$$;

-- Reading sessions are operational records. Extending the existing admin
-- sweep preserves its public API while deleting ended sessions after 30 days.
create or replace function public.admin_purge_expired_error_events()
returns bigint
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_deleted bigint := 0;
  v_count bigint := 0;
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  delete from public.reading_sessions
  where status = 'ended'
    and ended_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;

  delete from public.app_error_events where expires_at <= now();
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;
  return v_deleted;
end;
$$;

-- Removing a learner must not leave their immutable id in an operational
-- session array. This trigger covers verified deletion and every other valid
-- deletion path; presence rows cascade through their student foreign key.
create or replace function public.remove_deleted_student_from_reading_sessions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  delete from public.reading_session_presence
  where student_id = old.id;

  delete from public.reading_sessions
  where old.id = any(student_ids)
    and cardinality(student_ids) = 1;

  update public.reading_sessions
     set student_ids = array_remove(student_ids, old.id),
         status = case when status = 'active' then 'ended' else status end,
         ended_at = case when status = 'active' then now() else ended_at end,
         updated_at = now()
   where old.id = any(student_ids);

  if exists (
    select 1 from public.reading_sessions where old.id = any(student_ids)
  ) or exists (
    select 1 from public.reading_session_presence where student_id = old.id
  ) then
    raise exception 'reading_session_residual_records';
  end if;
  return old;
end;
$$;

drop trigger if exists students_reading_session_deletion_guard on public.students;
create trigger students_reading_session_deletion_guard
before delete on public.students
for each row execute function public.remove_deleted_student_from_reading_sessions();

revoke all on function public.validate_reading_session_membership()
  from public, anon, authenticated;
revoke all on function public.remove_deleted_student_from_reading_sessions()
  from public, anon, authenticated;

revoke all on function public.teacher_start_reading_session(uuid, text, integer[], uuid[], text)
  from public, anon, authenticated;
grant execute on function public.teacher_start_reading_session(uuid, text, integer[], uuid[], text)
  to authenticated;

revoke all on function public.teacher_set_reading_session_page(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.teacher_set_reading_session_page(uuid, integer)
  to authenticated;

revoke all on function public.teacher_end_reading_session(uuid)
  from public, anon, authenticated;
grant execute on function public.teacher_end_reading_session(uuid)
  to authenticated;

revoke all on function public.teacher_get_reading_session_presence(uuid)
  from public, anon, authenticated;
grant execute on function public.teacher_get_reading_session_presence(uuid)
  to authenticated;

revoke all on function public.teacher_save_reading_marks(uuid, uuid, integer, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.teacher_save_reading_marks(uuid, uuid, integer, jsonb, text)
  to authenticated;

revoke all on function public.student_get_reading_session(text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.student_get_reading_session(text, integer, boolean)
  to anon, authenticated;

notify pgrst, 'reload schema';

commit;
