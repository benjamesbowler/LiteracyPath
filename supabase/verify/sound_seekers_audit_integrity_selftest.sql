-- Pure-function self-test for
-- 20260720153000_sound_seekers_audit_integrity.sql.
-- Run in the Supabase SQL editor after applying the migration. It reads and
-- writes no tables; any contract drift raises a named assertion.

do $$
declare
  r jsonb;
  purchases_a jsonb;
  purchases_b jsonb;
  feeds_a jsonb;
  feeds_b jsonb;
begin
  r := public.lp_quest_merge_mastery_record(
    '{"seen":14,"independentSeen":0,"correct":0,"state":"learning","evidenceEpoch":1,"shells":[],"sessions":[]}'::jsonb,
    '{"seen":15,"independentSeen":12,"correct":12,"state":"mastered","evidenceEpoch":0,"shells":["stones","bridge"],"sessions":["d1","d2"]}'::jsonb);
  assert r ->> 'state' = 'learning', 'newer demotion epoch was resurrected';
  assert r ->> 'correct' = '0', 'pre-demotion correct evidence leaked across epoch';
  assert r -> 'shells' = '[]'::jsonb, 'pre-demotion shell evidence leaked across epoch';

  r := public.lp_merge_phonics_quest(
    '{"trail":{"routeCursor":30,"stopsDone":["s1","s40"]},"checkpoint":{"stopId":"s30","beatIndex":1}}'::jsonb,
    '{"trail":{"routeCursor":1,"stopsDone":[]},"checkpoint":null}'::jsonb);
  assert r #>> '{trail,routeCursor}' = '30', 'fresh-device cursor erased stored review position';
  assert r #>> '{checkpoint,stopId}' = 's30', 'matching cloud checkpoint was not retained';

  r := public.lp_merge_phonics_quest(
    '{"trail":{"routeCursor":3,"stopsDone":["s1","s2"]},"checkpoint":{"stopId":"s9"}}'::jsonb,
    '{"trail":{"routeCursor":1,"stopsDone":[]},"checkpoint":null}'::jsonb);
  assert r -> 'checkpoint' = 'null'::jsonb, 'stale cloud checkpoint can teleport a child';

  r := public.lp_merge_phonics_quest(
    '{"creature":{"body":"stored"},"creatureAt":"2026-07-20T12:00:00Z","settings":{"reducedMotion":true},"settingsAt":"2026-07-20T12:00:00Z"}'::jsonb,
    '{"creature":{"body":"stale"},"creatureAt":"2026-07-19T12:00:00Z","settings":{"reducedMotion":false},"settingsAt":"2026-07-19T12:00:00Z"}'::jsonb);
  assert r #>> '{creature,body}' = 'stored', 'stale creature choice won its timestamp merge';
  assert r #>> '{settings,reducedMotion}' = 'true', 'stale accessibility setting won its timestamp merge';

  r := public.lp_merge_daily_mission(
    '{"day":"2026-07-20","done":{"quest":true},"streak":4}'::jsonb,
    '{"day":"2026-07-19","done":{},"streak":3}'::jsonb);
  assert r ->> 'day' = '2026-07-20', 'stale mission day replaced the current day';
  assert r #>> '{done,quest}' = 'true', 'stale mission row un-finished a task';

  r := public.lp_merge_daily_mission(
    '{"day":"2026-07-20","done":{"quest":true,"game":false},"streak":2}'::jsonb,
    '{"day":"2026-07-20","done":{"book":true,"game":true},"streak":4}'::jsonb);
  assert r -> 'done' @> '{"quest":true,"book":true,"game":true}'::jsonb, 'same-day mission flags did not union monotonically';
  assert r ->> 'streak' = '4', 'same-day mission lost the best streak';

  select jsonb_agg(jsonb_build_object('id', 'a-' || n, 'item', 'egg-bronze', 'at', lpad(n::text, 3, '0')) order by n)
    into purchases_a from generate_series(1, 100) n;
  select jsonb_agg(jsonb_build_object('id', 'b-' || n, 'item', 'egg-silver', 'at', lpad((n + 100)::text, 3, '0')) order by n)
    into purchases_b from generate_series(1, 100) n;
  select jsonb_agg(jsonb_build_object('id', 'fa-' || n, 'species', 'owl', 'at', lpad(n::text, 3, '0')) order by n)
    into feeds_a from generate_series(1, 12) n;
  select jsonb_agg(jsonb_build_object('id', 'fb-' || n, 'species', 'fox', 'at', lpad((n + 12)::text, 3, '0')) order by n)
    into feeds_b from generate_series(1, 12) n;

  r := public.lp_merge_hollow(
    jsonb_build_object('purchases', purchases_a, 'feeds', feeds_a),
    jsonb_build_object('purchases', purchases_b, 'feeds', feeds_b));
  assert jsonb_array_length(r -> 'purchases') = 128, 'Hollow purchase history exceeded its cap';
  assert jsonb_array_length(r -> 'feeds') = 16, 'Hollow feed history did not cap at eight per species';

  raise notice 'ALL SOUND SEEKERS AUDIT-INTEGRITY TESTS PASSED';
end $$;
