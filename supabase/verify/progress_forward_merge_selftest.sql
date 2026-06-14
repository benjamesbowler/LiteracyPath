-- Self-test for the server-side forward merge.
-- Run this ONCE in the Supabase SQL editor AFTER applying the migration
-- 20260614090000_progress_forward_merge.sql. If everything is correct you'll see
-- the notice:  ALL FORWARD-MERGE TESTS PASSED
-- If any line fails, it raises an assertion error naming the failing case.
-- This only calls the pure merge functions - it does NOT touch any real data.

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

  -- 2. el_quest: cycles from both devices kept, stars take the max
  r := public.lp_forward_merge_progress(
    'el_quest',
    '{"cycles":{"c-1":{"stars":3},"c-2":{"stars":1}}}'::jsonb,
    '{"cycles":{"c-2":{"stars":2},"c-3":{"stars":1}}}'::jsonb);
  assert r #>> '{cycles,c-1,stars}' = '3', 'el_quest local-only cycle lost';
  assert r #>> '{cycles,c-2,stars}' = '2', 'el_quest cycle not maxed';
  assert r #>> '{cycles,c-3,stars}' = '1', 'el_quest cloud-only cycle lost';

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
