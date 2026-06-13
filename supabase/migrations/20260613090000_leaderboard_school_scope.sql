-- Privacy fix: the leaderboard was GLOBAL, showing children's names and
-- schools to students at OTHER schools. This scopes it to one school.
-- Run this whole file in the Supabase SQL Editor.

-- Remove the old global-only version so only the scoped one exists.
drop function if exists public.get_game_leaderboard(int);

create or replace function public.get_game_leaderboard(
  p_limit int default 10,
  p_school_id uuid default null
)
returns table (student_name text, school_name text, total_points int, total_stars int)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.name as student_name,
    coalesce(sc.name, '') as school_name,
    coalesce((
      select sum(greatest(coalesce((g.value->>'highScore')::int, 0), 0))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_points,
    coalesce((
      select sum(least(greatest(coalesce((g.value->>'stars')::int, 0), 0), 3))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_stars
  from public.student_progress sp
  join public.students s on s.id = sp.student_id
  left join public.classes c on c.id = s.class_id
  left join public.schools sc on sc.id = c.school_id
  where sp.area = 'learn_games'
    and sp.key = '__all__'
    and (p_school_id is null or c.school_id = p_school_id)
  order by total_points desc, total_stars desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_game_leaderboard(int, uuid) from public;
grant execute on function public.get_game_leaderboard(int, uuid) to anon, authenticated;

notify pgrst, 'reload schema';

-- Status report
select 'leaderboard is now school-scoped' as status;
