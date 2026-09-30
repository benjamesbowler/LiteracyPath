-- Child surfaces report only the learner's own effort and progress. The
-- historical peer-score endpoint is retired; records remain in student_progress
-- for personal game continuity and authorized teacher participation reporting.
-- Revoke PUBLIC as well as explicit API roles, since inherited PUBLIC execution
-- would otherwise keep an opaque student token able to retrieve peer totals.
revoke all privileges on function public.get_game_leaderboard(text, integer)
  from public, anon, authenticated;

-- Older deployments may still retain a superseded overload. Revoke only the
-- exact historical signatures when present; never guess a function by name.
do $$
begin
  if to_regprocedure('public.get_game_leaderboard(integer)') is not null then
    revoke all privileges on function public.get_game_leaderboard(integer)
      from public, anon, authenticated;
  end if;
  if to_regprocedure('public.get_game_leaderboard(integer,uuid)') is not null then
    revoke all privileges on function public.get_game_leaderboard(integer, uuid)
      from public, anon, authenticated;
  end if;
end
$$;
