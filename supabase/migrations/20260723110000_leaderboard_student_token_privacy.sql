-- Child-safety boundary for arcade leaderboards.
--
-- The previous RPC trusted a caller-supplied school id and returned real
-- student names. This migration makes the server own every privacy decision:
-- a live student session identifies the learner, the learner's class owns the
-- scope, and only pseudonyms leave the database.

alter table public.classes
  add column if not exists leaderboard_scope text;

update public.classes
set leaderboard_scope = 'class'
where leaderboard_scope is null;

alter table public.classes
  alter column leaderboard_scope set default 'class',
  alter column leaderboard_scope set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'classes_leaderboard_scope_check'
      and conrelid = 'public.classes'::regclass
  ) then
    alter table public.classes
      add constraint classes_leaderboard_scope_check
      check (leaderboard_scope in ('class', 'school'));
  end if;
end
$$;

create or replace function public.teacher_set_class_leaderboard_scope(
  p_class_id uuid,
  p_scope text
)
returns table (class_id uuid, leaderboard_scope text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_scope text := lower(btrim(coalesce(p_scope, '')));
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if v_scope not in ('class', 'school') then
    raise exception 'invalid_leaderboard_scope';
  end if;

  update public.classes c
  set leaderboard_scope = v_scope,
      updated_at = now()
  where c.id = p_class_id
    and (
      c.teacher_id = v_user_id
      or public.is_app_admin(v_user_id)
    );

  if not found then
    raise exception 'class_not_found_or_not_owned';
  end if;

  return query
  select p_class_id, v_scope;
end;
$$;

revoke all on function public.teacher_set_class_leaderboard_scope(uuid, text)
  from public, anon;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;

-- Remove every legacy overload so no caller can select a scope by supplying
-- a school id and no overload can return a child's real name.
drop function if exists public.get_game_leaderboard(int);
drop function if exists public.get_game_leaderboard(int, uuid);

create or replace function public.get_game_leaderboard(
  p_student_token text,
  p_limit int default 10
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_school_id uuid;
  v_scope text;
  v_rows jsonb;
begin
  if btrim(coalesce(p_student_token, '')) = '' then
    raise exception 'invalid_session';
  end if;

  v_student := public.student_from_token(p_student_token);
  if v_student.id is null or v_student.class_id is null then
    raise exception 'invalid_session';
  end if;

  select c.school_id, c.leaderboard_scope
  into v_school_id, v_scope
  from public.classes c
  where c.id = v_student.class_id;

  if v_scope = 'school' and v_school_id is null then
    v_scope := 'class';
  end if;
  v_scope := coalesce(v_scope, 'class');

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'student_name', ranked.student_name,
        'total_points', ranked.total_points,
        'total_stars', ranked.total_stars
      )
      order by ranked.total_points desc, ranked.total_stars desc, ranked.student_name
    ),
    '[]'::jsonb
  )
  into v_rows
  from (
    select
      'Reader ' || upper(substr(
        encode(
          extensions.digest(
            s.id::text || ':' ||
              case when v_scope = 'school' then v_school_id::text else c.id::text end ||
              ':leaderboard-v1',
            'sha256'
          ),
          'hex'
        ),
        1,
        6
      )) as student_name,
      coalesce((
        select sum(
          case
            when coalesce(g.value ->> 'highScore', '') ~ '^-?[0-9]+$'
              then least(
                greatest((g.value ->> 'highScore')::numeric, 0),
                2147483647
              )
            else 0
          end
        )
        from jsonb_each(coalesce(sp.payload -> 'games', '{}'::jsonb)) as g
      ), 0)::int as total_points,
      coalesce((
        select sum(
          case
            when coalesce(g.value ->> 'stars', '') ~ '^-?[0-9]+$'
              then least(greatest((g.value ->> 'stars')::numeric, 0), 3)
            else 0
          end
        )
        from jsonb_each(coalesce(sp.payload -> 'games', '{}'::jsonb)) as g
      ), 0)::int as total_stars
    from public.student_progress sp
    join public.students s on s.id = sp.student_id
    join public.classes c on c.id = s.class_id
    where sp.area = 'learn_games'
      and sp.key = '__all__'
      and s.archived_at is null
      and (
        (v_scope = 'class' and c.id = v_student.class_id)
        or
        (v_scope = 'school' and c.school_id = v_school_id)
      )
    order by total_points desc, total_stars desc, student_name
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  ) as ranked;

  return jsonb_build_object(
    'scope', v_scope,
    'rows', v_rows
  );
end;
$$;

revoke all on function public.get_game_leaderboard(text, int) from public;
grant execute on function public.get_game_leaderboard(text, int)
  to anon, authenticated;

notify pgrst, 'reload schema';
