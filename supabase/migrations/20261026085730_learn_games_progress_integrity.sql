-- Enforce the shared personal-game write contract before either RPC or teacher
-- upsert reaches the forward merge. Missing games/scores are valid partial writes.
-- Existing malformed fields are repaired on the next valid write, not bulk rewritten.
begin;

create or replace function public.lp_normalize_learn_games(p_payload jsonb, p_strict boolean)
returns jsonb language plpgsql immutable set search_path = pg_catalog, public as $$
declare
  result jsonb := p_payload;
  games jsonb;
  game_id text;
  game jsonb;
  field text;
  max_value numeric;
  valid boolean;
begin
  if jsonb_typeof(result) is distinct from 'object' then
    if p_strict then raise exception 'invalid_learn_games_payload' using errcode = '22023'; end if;
    return '{}'::jsonb;
  end if;
  if not (result ? 'games') then return result; end if;
  if jsonb_typeof(result->'games') is distinct from 'object' then
    if p_strict then raise exception 'invalid_learn_games_games' using errcode = '22023'; end if;
    return result - 'games';
  end if;
  games := result->'games';
  for game_id, game in select key, value from jsonb_each(games) loop
    if jsonb_typeof(game) is distinct from 'object' then
      if p_strict then raise exception 'invalid_learn_games_record' using errcode = '22023'; end if;
      games := games - game_id;
      continue;
    end if;
    -- These counters are emitted as whole, nonnegative JS numbers. Points keep
    -- the existing int32 storage/display boundary; stars are 0..3. Lifetime
    -- counters retain the wider safe-JavaScript-integer range.
    foreach field in array array['highScore', 'stars', 'plays', 'wordsCompleted'] loop
      if not (game ? field) then continue; end if;
      max_value := case field when 'stars' then 3 when 'highScore' then 2147483647 else 9007199254740991 end;
      valid := false;
      if jsonb_typeof(game->field) = 'number' then
        valid := (game->>field)::numeric between 0 and max_value
          and trunc((game->>field)::numeric) = (game->>field)::numeric;
      end if;
      if not valid then
        if p_strict then raise exception 'invalid_learn_games_counter' using errcode = '22023'; end if;
        game := game - field;
      end if;
    end loop;
    -- Do not flatten bestSplits: it is difficulty -> level -> split. Practice
    -- checkpoint null tombstones live INSIDE the checkpoints object.
    foreach field in array array['checkpoints', 'bestSplits', 'practiceRecord'] loop
      if game ? field and jsonb_typeof(game->field) is distinct from 'object' then
        if p_strict then raise exception 'invalid_learn_games_container' using errcode = '22023'; end if;
        game := game - field;
      end if;
    end loop;
    games := jsonb_set(games, array[game_id], game);
  end loop;
  return jsonb_set(result, '{games}', games);
end;
$$;

create or replace function public.lp_validate_learn_games_write()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.area = 'learn_games' then
    new.payload := public.lp_normalize_learn_games(new.payload, true);
  end if;
  return new;
end;
$$;

-- Alphabetical trigger order puts validation BEFORE student_progress_forward_merge.
-- INSERT is covered too, including the insert phase of ON CONFLICT upserts.
drop trigger if exists aa_validate_learn_games_write on public.student_progress;
create trigger aa_validate_learn_games_write
before insert or update on public.student_progress
for each row execute function public.lp_validate_learn_games_write();

create or replace function public.lp_merge_learn_games(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable set search_path = pg_catalog, public as $$
declare
  merged jsonb;
  game_id text;
  old_checkpoint jsonb;
  new_checkpoint jsonb;
begin
  existing := public.lp_normalize_learn_games(existing, false);
  incoming := public.lp_normalize_learn_games(incoming, true);
  merged := public.lp_jsonb_forward_merge(existing, incoming);
  -- These two routes share skillsPracticeProgress. Arcade checkpoints keep
  -- their separate contract and are unaffected by this focused change.
  foreach game_id in array array['literacy-practice', 'skills-trail'] loop
    old_checkpoint := existing #> array['games', game_id, 'checkpoints', 'practice'];
    new_checkpoint := incoming #> array['games', game_id, 'checkpoints', 'practice'];
    if old_checkpoint is not null or new_checkpoint is not null then
      merged := jsonb_set(merged, array['games', game_id, 'checkpoints', 'practice'],
        public.lp_merge_practice_checkpoint(old_checkpoint, new_checkpoint), true);
    end if;
  end loop;
  return merged;
end;
$$;

-- Retained historical reader: tolerate legacy non-objects and aggregate in
-- numeric before a final int clamp. The retired API grants remain revoked.
-- A bounded string is checked before casting, including numeric JSON strings.
create or replace function public.lp_leaderboard_metric(p_value jsonb, p_max integer)
returns numeric language plpgsql immutable set search_path = pg_catalog as $$
declare
  value_text text := p_value #>> '{}';
begin
  if jsonb_typeof(p_value) not in ('number', 'string')
    or value_text is null or length(value_text) > 11 or value_text !~ '^-?[0-9]+$' then
    return 0;
  end if;
  return least(greatest(value_text::numeric, 0), p_max);
end;
$$;

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
      least(coalesce((
        select sum(public.lp_leaderboard_metric(g.value -> 'highScore', 2147483647))
        from jsonb_each(case when jsonb_typeof(sp.payload -> 'games') = 'object'
          then sp.payload -> 'games' else '{}'::jsonb end) as g
      ), 0), 2147483647)::int as total_points,
      least(coalesce((
        select sum(public.lp_leaderboard_metric(g.value -> 'stars', 3))
        from jsonb_each(case when jsonb_typeof(sp.payload -> 'games') = 'object'
          then sp.payload -> 'games' else '{}'::jsonb end) as g
      ), 0), 2147483647)::int as total_stars
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

revoke all on function public.lp_normalize_learn_games(jsonb, boolean) from public;
revoke all on function public.lp_validate_learn_games_write() from public;
revoke all on function public.lp_leaderboard_metric(jsonb, integer) from public;
grant execute on function public.lp_normalize_learn_games(jsonb, boolean) to anon, authenticated, service_role;
-- Pure validator is needed by the existing invoker merge helper. Trigger and
-- leaderboard helpers are not additional browser APIs.
revoke all on function public.get_game_leaderboard(text, integer) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
