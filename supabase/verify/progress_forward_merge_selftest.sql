-- Self-test for the server-side forward merge.
-- Run this ONCE in the Supabase SQL editor AFTER applying the migration
-- 20260614090000_progress_forward_merge.sql. If everything is correct you'll see
-- the notice:  ALL FORWARD-MERGE TESTS PASSED
-- If any line fails, it raises an assertion error naming the failing case.
-- The pure merge checks below do not touch rows. The final transaction-scoped
-- check creates one reversible first insert so the canonical-row trigger is
-- exercised without leaving progress or focus-session changes behind.

do $$
declare
  r jsonb;
begin
  -- 1. learn_games: a game earned on another iPad is NOT wiped, stars never drop
  r := public.lp_forward_merge_progress(
    'learn_games',
    '{"games":{"hop":{"stars":3,"highScore":90}}}'::jsonb,
    '{"games":{"hop":{"stars":1,"highScore":20},"match":{"stars":2}}}'::jsonb);
  assert r #>> '{games,hop,stars}' = '3', 'learn_games stars downgraded';
  assert r #>> '{games,hop,highScore}' = '90', 'learn_games highScore downgraded';
  assert r #>> '{games,match,stars}' = '2', 'learn_games other-device game lost';

  -- 2. el_quest: v2 preserves same-epoch cycles, but v1 cannot cross the
  -- reset boundary in either merge orientation or on a first insert.
  r := public.lp_forward_merge_progress(
    'el_quest',
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":{"stars":3},"c-2":{"stars":1}}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-2":{"stars":2},"c-3":{"stars":1}}}'::jsonb);
  assert r #>> '{cycles,c-1,stars}' = '3', 'el_quest local-only cycle lost';
  assert r #>> '{cycles,c-2,stars}' = '2', 'el_quest cycle not maxed';
  assert r #>> '{cycles,c-3,stars}' = '1', 'el_quest cloud-only cycle lost';
  -- Exercise the public dispatcher too: calling only lp_merge_el_quest below
  -- cannot detect an older migration routing this area to the generic merge.
  assert public.lp_forward_merge_progress(
    'el_quest',
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    '{"v":1,"cycles":{"obsolete-cycle":{"stars":3}}}'::jsonb
  ) = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest dispatcher restored obsolete progress';
  assert public.lp_forward_merge_progress(
    'el_quest',
    '{"v":1,"cycles":{"obsolete-cycle":{"stars":3}}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb
  ) = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest dispatcher restored obsolete progress in reverse merge';
  r := public.lp_merge_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":{"stars":3,"bestScore":100,"bestIndependent":10,"plays":4,"recoveries":0,"sampledConstructs":["older"],"lastRunSeed":"older-seed","lastIndependent":10,"lastTotal":10,"lastPlayedAt":"2026-09-02T09:00:00.000Z"}}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":{"stars":1,"bestScore":40,"bestIndependent":4,"plays":5,"recoveries":6,"sampledConstructs":["new-a","new-b"],"lastRunSeed":"newer-seed","lastIndependent":4,"lastTotal":10,"lastPlayedAt":"2026-09-02T10:00:00.000Z"}}}'::jsonb
  );
  assert r #>> '{cycles,c-1,stars}' = '3', 'el_quest best stars regressed';
  assert r #>> '{cycles,c-1,bestScore}' = '100', 'el_quest best score regressed';
  assert r #>> '{cycles,c-1,recoveries}' = '6', 'el_quest latest recovery count was maxed';
  assert r #>> '{cycles,c-1,lastIndependent}' = '4', 'el_quest latest independent count was maxed';
  assert r #> '{cycles,c-1,sampledConstructs}' = '["new-a","new-b"]'::jsonb,
    'el_quest latest construct manifest was unioned';
  assert r #>> '{cycles,c-1,lastRunSeed}' = 'newer-seed', 'el_quest latest replay seed was lost';
  r := public.lp_merge_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":{"stars":1,"plays":5,"recoveries":6,"sampledConstructs":["new-a","new-b"],"lastPlayedAt":"2026-09-02T10:00:00.000Z"}}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":{"stars":3,"plays":4,"recoveries":0,"sampledConstructs":["older"],"lastPlayedAt":"2026-09-02T09:00:00.000Z"}}}'::jsonb
  );
  assert r #>> '{cycles,c-1,stars}' = '3', 'el_quest reverse merge lost best stars';
  assert r #>> '{cycles,c-1,recoveries}' = '6', 'el_quest reverse merge lost latest recovery count';
  assert r #> '{cycles,c-1,sampledConstructs}' = '["new-a","new-b"]'::jsonb,
    'el_quest reverse merge lost latest construct manifest';
  assert public.lp_merge_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    '{"v":1,"cycles":{"c-1":{"stars":3}}}'::jsonb
  ) = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest stale legacy payload restored cycles';
  assert public.lp_merge_el_quest(
    '{"v":1,"cycles":{"c-1":{"stars":3}}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb
  ) = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest legacy-first merge restored cycles';
  assert public.lp_merge_el_quest(
    '{"schemaVersion":2,"progressEpoch":3,"cycles":{"future":{"stars":1}}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb
  ) #>> '{progressEpoch}' = '3', 'el_quest future epoch was downgraded';
  assert public.lp_normalize_el_quest(
    '{"schemaVersion":3,"progressEpoch":2,"cycles":{"future":{"stars":1}},"futureOnly":{"checkpoint":"keep-exactly"}}'::jsonb
  ) = '{"schemaVersion":3,"progressEpoch":2,"cycles":{"future":{"stars":1}},"futureOnly":{"checkpoint":"keep-exactly"}}'::jsonb,
    'el_quest future schema at current epoch was normalized';
  assert public.lp_merge_el_quest(
    '{"schemaVersion":3,"progressEpoch":2,"cycles":{"future":{"stars":1}},"futureOnly":{"checkpoint":"keep-exactly"}}'::jsonb,
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"current":{"stars":3}}}'::jsonb
  ) = '{"schemaVersion":3,"progressEpoch":2,"cycles":{"future":{"stars":1}},"futureOnly":{"checkpoint":"keep-exactly"}}'::jsonb,
    'el_quest future schema existing-first was downgraded';
  assert public.lp_merge_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"current":{"stars":3}}}'::jsonb,
    '{"schemaVersion":3,"progressEpoch":2,"cycles":{"future":{"stars":1}},"futureOnly":{"checkpoint":"keep-exactly"}}'::jsonb
  ) = '{"schemaVersion":3,"progressEpoch":2,"cycles":{"future":{"stars":1}},"futureOnly":{"checkpoint":"keep-exactly"}}'::jsonb,
    'el_quest future schema incoming-first was downgraded';
  assert public.lp_normalize_el_quest(
    '{"v":1,"cycles":{"c-1":{"stars":3}}}'::jsonb
  ) = '{"v":1,"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest stale first insert was not normalized';
  assert public.lp_normalize_el_quest(
    '{"schemaVersion":"2","progressEpoch":"2","cycles":{"c-1":{"stars":3}}}'::jsonb
  ) #>> '{cycles,c-1,stars}' = '3', 'el_quest numeric-string current epoch was reset';
  assert not public.lp_is_current_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":null}'::jsonb
  ), 'el_quest null cycles was accepted as canonical';
  assert not public.lp_is_current_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":[]}'::jsonb
  ), 'el_quest array cycles was accepted as canonical';
  assert not public.lp_is_current_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":null}}'::jsonb
  ), 'el_quest null cycle record was accepted as canonical';
  assert not public.lp_is_current_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":{"c-1":{"stations":[]}}}'::jsonb
  ), 'el_quest array stations record was accepted as canonical';
  assert public.lp_normalize_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":null,"unrelatedMarker":"keep"}'::jsonb
  ) = '{"schemaVersion":2,"progressEpoch":2,"cycles":{},"unrelatedMarker":"keep"}'::jsonb,
    'el_quest malformed current payload did not reset to a canonical server record';
  assert public.lp_normalize_el_quest(
    '{"schemaVersion":2,"progressEpoch":2,"cycles":[]}'::jsonb
  ) = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest array cycles did not reset to a canonical server record';
  assert public.lp_normalize_el_quest('[]'::jsonb)
    = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest array payload did not normalize to a canonical object';
  assert public.lp_normalize_el_quest('"invalid"'::jsonb)
    = '{"schemaVersion":2,"progressEpoch":2,"cycles":{}}'::jsonb,
    'el_quest scalar payload did not normalize to a canonical object';

  -- A non-Adventure area keeps its existing forward behavior. This migration
  -- touches neither focus-session rows nor their routines.
  assert public.lp_forward_merge_progress(
    'learn_games', '{"games":{"hop":{"stars":3}}}'::jsonb,
    '{"games":{"hop":{"stars":1}}}'::jsonb
  ) #>> '{games,hop,stars}' = '3', 'non-Adventure progress changed';

  -- 3. story_quests: completed never un-completes; found words union
  r := public.lp_forward_merge_progress(
    'story_quests',
    '{"completed":true,"wordsFound":["cat","dog"],"visitedPageCount":5}'::jsonb,
    '{"completed":false,"wordsFound":["cat","sun"],"visitedPageCount":2}'::jsonb);
  assert (r ->> 'completed') = 'true', 'story_quests completion regressed';
  assert jsonb_array_length(r -> 'wordsFound') = 3, 'story_quests words not unioned';
  assert (r -> 'wordsFound') @> '["cat","dog","sun"]'::jsonb, 'story_quests missing a word';
  assert (r ->> 'visitedPageCount') = '5', 'story_quests page count not maxed';

  -- 4. phonics/cvc mastery status never downgrades
  r := public.lp_forward_merge_progress(
    'phonics_letters', '{"v":2,"status":"completed"}'::jsonb, '{"v":2,"status":"inprogress"}'::jsonb);
  assert (r ->> 'status') = 'completed', 'phonics status downgraded';
  r := public.lp_forward_merge_progress(
    'cvc', '{"status":"inprogress"}'::jsonb, '{"status":"completed"}'::jsonb);
  assert (r ->> 'status') = 'completed', 'cvc forward status not accepted';

  -- 5. daily_mission stays last-write-wins (a reset streak is NOT inflated)
  r := public.lp_forward_merge_progress(
    'daily_mission', '{"streak":5}'::jsonb, '{"streak":1}'::jsonb);
  assert (r ->> 'streak') = '1', 'daily_mission should be last-write-wins, not maxed';

  -- 6. primitives
  assert public.lp_jsonb_forward_merge('2'::jsonb, '5'::jsonb) = '5'::jsonb, 'number max failed';
  assert public.lp_jsonb_forward_merge('true'::jsonb, 'false'::jsonb) = 'true'::jsonb, 'boolean OR failed';
  assert public.lp_jsonb_forward_merge('null'::jsonb, '4'::jsonb) = '4'::jsonb, 'null left failed';

  raise notice 'ALL FORWARD-MERGE TESTS PASSED';
end $$;

-- The normalizer must work on a stale FIRST insert, not only on an existing
-- conflict row. Within this transaction, remove one student's canonical row
-- before inserting the stale record, then roll the whole probe back. The
-- focus-session byte snapshot proves this
-- progress-only verification did not alter focus records.
begin;

do $$
declare
  focus_before jsonb;
  focus_after jsonb;
  inserted_payload jsonb;
  fixture_student_id uuid;
begin
  select coalesce(jsonb_agg(to_jsonb(focus_session) order by focus_session.id), '[]'::jsonb)
    into focus_before
    from public.student_focus_sessions focus_session;

  select student.id into fixture_student_id
    from public.students student
   order by student.id
   limit 1;

  if fixture_student_id is null then
    raise exception 'forward-merge self-test needs one student fixture';
  end if;

  delete from public.student_progress
   where student_id = fixture_student_id
     and area = 'el_quest'
     and key = '__all__';

  insert into public.student_progress (student_id, area, key, payload, updated_at)
  values (
    fixture_student_id,
    'el_quest',
    '__all__',
    '{"v":1,"cycles":{"cycle-1":{"stars":3}}}'::jsonb,
    now()
  );

  select payload into inserted_payload
    from public.student_progress
   where student_id = fixture_student_id
     and area = 'el_quest'
     and key = '__all__';
  assert inserted_payload #>> '{schemaVersion}' = '2', 'el_quest first insert missed schema v2';
  assert inserted_payload #>> '{progressEpoch}' = '2', 'el_quest first insert missed epoch 2';
  assert inserted_payload -> 'cycles' = '{}'::jsonb, 'el_quest first insert retained legacy cycles';

  select coalesce(jsonb_agg(to_jsonb(focus_session) order by focus_session.id), '[]'::jsonb)
    into focus_after
    from public.student_focus_sessions focus_session;
  assert focus_after = focus_before, 'el_quest verification changed focus-session records';

  raise notice 'ADVENTURE MAP INSERT-TRIGGER TEST PASSED';
end $$;

rollback;
