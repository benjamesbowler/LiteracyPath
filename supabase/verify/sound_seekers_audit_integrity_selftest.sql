-- Pure-function self-test for
-- 20260720153000_sound_seekers_audit_integrity.sql and
-- 20260721100000_sound_seekers_reset_epoch.sql.
-- Run in the Supabase SQL editor after applying the migration. It reads and
-- writes no tables; any contract drift raises a named assertion.

do $$
declare
  r jsonb;
  purchases_a jsonb;
  purchases_b jsonb;
  feeds_a jsonb;
  feeds_b jsonb;
  reset_group_left jsonb;
  reset_group_right jsonb;
begin
  r := public.lp_quest_merge_mastery_record(
    '{"seen":14,"independentSeen":0,"correct":0,"state":"learning","evidenceEpoch":1,"shells":[],"sessions":[]}'::jsonb,
    '{"seen":15,"independentSeen":12,"correct":12,"state":"mastered","evidenceEpoch":0,"shells":["stones","bridge"],"sessions":["d1","d2"]}'::jsonb);
  assert r ->> 'state' = 'learning', 'newer demotion epoch was resurrected';
  assert r ->> 'correct' = '0', 'pre-demotion correct evidence leaked across epoch';
  assert r -> 'shells' = '[]'::jsonb, 'pre-demotion shell evidence leaked across epoch';

  r := public.lp_merge_phonics_quest(
    null,
    '{"resetId":"reset-first-row","resetHistory":["legacy"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]}}'::jsonb);
  assert r ->> 'resetPending' = 'false', 'first-row reset operation was not acknowledged';
  assert r ->> 'resetId' = 'reset-first-row', 'first-row reset id was not retained';
  assert r -> 'resetPendingIds' = '[]'::jsonb, 'first-row pending reset ids were not cleared';

  -- Two snapshots of the same pending reset already agree that the old
  -- generation is gone. Acknowledgement must forward-merge learning earned
  -- after that reset rather than arbitrarily discarding either snapshot.
  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":2,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-shared-pending","resetHistory":["legacy"],"resetPendingIds":["reset-shared-pending"],"resetPending":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"stones":["s"]}'::jsonb,
    '{"resetEpoch":2,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-shared-pending","resetHistory":["legacy"],"resetPendingIds":["reset-shared-pending"],"resetPending":true,"trail":{"routeCursor":3,"stopsDone":["s2"]},"stones":["m"]}'::jsonb);
  assert r #> '{trail,stopsDone}' @> '["s1","s2"]'::jsonb, 'same pending reset acknowledgement discarded post-reset trail progress';
  assert r -> 'stones' @> '["s","m"]'::jsonb, 'same pending reset acknowledgement discarded post-reset stones';
  assert r -> 'resetPendingIds' = '[]'::jsonb, 'same pending reset was not acknowledged';
  assert r ->> 'resetPending' = 'false', 'same pending reset left the legacy pending flag set';

  -- INSERTs do not pass through the BEFORE UPDATE merge trigger. The first
  -- row may therefore still carry a pending reset when a stale device writes
  -- next. That existing pending operation must win and be acknowledged.
  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":2,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-first-insert","resetHistory":["legacy"],"resetPendingIds":["reset-first-insert"],"resetPending":true,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"mastery":{"m":{"seen":3}},"stones":["m"],"ledger":{"purchases":[]},"checkpoint":{"stopId":"s2"}}'::jsonb,
    '{"resetEpoch":0,"resetAt":"","resetId":"legacy","resetHistory":[],"resetPendingIds":[],"resetPending":false,"hatched":true,"trail":{"routeCursor":3,"stopsDone":["s1","s2"]},"mastery":{"s":{"seen":8}},"stones":["s"],"checkpoint":{"stopId":"s3"}}'::jsonb);
  assert r ->> 'resetId' = 'reset-first-insert', 'stale update discarded a first-insert pending reset';
  assert r #> '{trail,stopsDone}' = '["s1"]'::jsonb, 'stale update replaced the first-insert reset snapshot';
  assert r #> '{mastery,m,seen}' = '3'::jsonb, 'first-insert post-reset progress was discarded';
  assert r #> '{mastery,s}' is null, 'stale pre-reset mastery survived a first-insert reset';
  assert r -> 'resetPendingIds' = '[]'::jsonb, 'first-insert pending set was not acknowledged';
  assert r ->> 'resetPending' = 'false', 'first-insert legacy pending flag was not acknowledged';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":0,"resetAt":"","resetId":"legacy","resetHistory":[],"resetPending":false,"hatched":true,"trail":{"routeCursor":3,"stopsDone":["s1","s2"],"stars":{"s1":3}},"mastery":{"s":{"seen":8}},"stones":["s"],"ledger":{"purchases":[{"id":"leaf-cap"}]},"checkpoint":{"stopId":"s3"},"assignment":{"targets":["m"]}}'::jsonb,
    '{"resetEpoch":1,"resetAt":"2026-07-21T09:00:00Z","resetId":"reset-a","resetHistory":["legacy"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[],"stars":{},"drops":{}},"mastery":{},"stones":[],"trickies":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb);
  assert r ->> 'resetEpoch' = '1', 'new reset generation was not stored';
  assert r ->> 'hatched' = 'false', 'old hatch state survived a newer reset';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'old trail survived a newer reset';
  assert r -> 'mastery' = '{}'::jsonb, 'old mastery survived a newer reset';
  assert r -> 'stones' = '[]'::jsonb, 'old stones survived a newer reset';
  assert r #> '{ledger,purchases}' = '[]'::jsonb, 'old purchases survived a newer reset';
  assert r -> 'checkpoint' = 'null'::jsonb, 'old checkpoint survived a newer reset';
  assert r #> '{assignment,targets}' = '["m"]'::jsonb, 'child reset erased a teacher assignment';
  assert r ->> 'resetId' = 'reset-a', 'new reset id was not accepted';
  assert r -> 'resetHistory' @> '["legacy"]'::jsonb, 'previous reset id was not retained as ancestry';
  assert r -> 'resetPendingIds' = '[]'::jsonb, 'server leaked pending reset ids after acknowledgement';
  assert r ->> 'resetPending' = 'false', 'server did not acknowledge the reset operation';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":3,"resetAt":"2026-07-21T09:05:00Z","resetId":"reset-b","resetHistory":["legacy","reset-a"],"resetPending":false,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb,
    '{"resetEpoch":3,"resetAt":"2026-07-21T09:00:00Z","resetId":"reset-a","resetHistory":["legacy"],"resetPending":false,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"mastery":{"s":{"seen":4}},"stones":["s"],"ledger":{"purchases":[{"id":"leaf-cap"}]},"checkpoint":{"stopId":"s2"}}'::jsonb);
  assert r ->> 'resetEpoch' = '3', 'stale writer downgraded the reset generation';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'stale writer resurrected the old trail';
  assert r -> 'mastery' = '{}'::jsonb, 'stale writer resurrected old mastery';
  assert r -> 'checkpoint' = 'null'::jsonb, 'stale writer resurrected a checkpoint';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":9000,"resetAt":"2026-07-21T09:00:00Z","resetId":"reset-clock-a","resetHistory":["legacy"],"resetPending":false,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"mastery":{"s":{"seen":4}},"stones":["s"],"checkpoint":{"stopId":"s2"}}'::jsonb,
    '{"resetEpoch":8000,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-clock-b","resetHistory":["legacy"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb);
  assert r ->> 'resetId' = 'reset-clock-b', 'backwards-clock pending reset was rejected';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'backwards-clock reset did not clear the trail';
  assert r -> 'resetHistory' @> '["reset-clock-a"]'::jsonb, 'concurrent losing id was not folded into reset history';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":8000,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-ms-a","resetHistory":["legacy"],"resetPending":false,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]}}'::jsonb,
    '{"resetEpoch":8000,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-ms-b","resetHistory":["legacy"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb);
  assert r ->> 'resetId' = 'reset-ms-b', 'same-millisecond unique reset was rejected';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'same-millisecond reset resurrected old progress';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":200,"resetAt":"2026-07-21T10:00:00Z","resetId":"reset-z-pending-new","resetHistory":["legacy"],"resetPendingIds":["reset-z-pending-new"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb,
    '{"resetEpoch":100,"resetAt":"2026-07-21T09:00:00Z","resetId":"reset-a-pending-old","resetHistory":["legacy"],"resetPendingIds":["reset-a-pending-old"],"resetPending":true,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"mastery":{"s":{"seen":4}},"stones":["s"],"checkpoint":{"stopId":"s2"}}'::jsonb);
  assert r ->> 'resetId' = 'reset-z-pending-new', 'older pending writer reversed a newer pending reset';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'older pending writer resurrected progress';
  assert r -> 'resetHistory' @> '["reset-a-pending-old"]'::jsonb, 'losing pending id was not folded into reset history';
  assert r -> 'resetPendingIds' = '[]'::jsonb, 'server did not clear the full pending reset set';

  -- Exact A/B/C convergence case from the audit: B acknowledges pending A,
  -- while unrelated C remains pending. AC-first carries [A,C]; BC-first has
  -- already settled A. Both groupings must acknowledge C to identical state.
  reset_group_left := public.lp_merge_phonics_quest(
    '{"resetEpoch":10,"resetAt":"2026-07-21T10:00:00Z","resetId":"reset-b","resetHistory":["legacy","reset-a"],"resetPendingIds":[],"resetPending":false,"hatched":true,"trail":{"routeCursor":3,"stopsDone":["s1","s2"]},"mastery":{"s":{"seen":8}},"stones":["s"],"checkpoint":{"stopId":"s3"}}'::jsonb,
    '{"resetEpoch":7,"resetAt":"2026-07-21T07:00:00Z","resetId":"reset-z-c","resetHistory":["legacy"],"resetPendingIds":["reset-a","reset-z-c"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb);
  reset_group_right := public.lp_merge_phonics_quest(
    '{"resetEpoch":10,"resetAt":"2026-07-21T10:00:00Z","resetId":"reset-b","resetHistory":["legacy","reset-a"],"resetPendingIds":[],"resetPending":false,"hatched":true,"trail":{"routeCursor":3,"stopsDone":["s1","s2"]},"mastery":{"s":{"seen":8}},"stones":["s"],"checkpoint":{"stopId":"s3"}}'::jsonb,
    '{"resetEpoch":7,"resetAt":"2026-07-21T07:00:00Z","resetId":"reset-z-c","resetHistory":["legacy","reset-a","reset-b"],"resetPendingIds":["reset-z-c"],"resetPending":true,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb);
  assert reset_group_left = reset_group_right, 'A/B/C pending reset convergence depended on grouping';
  assert reset_group_left ->> 'resetId' = 'reset-z-c', 'A/B/C convergence suppressed unrelated pending reset C';
  assert reset_group_left -> 'resetHistory' @> '["legacy","reset-a","reset-b"]'::jsonb, 'A/B/C convergence lost settled reset ancestry';
  assert reset_group_left -> 'resetPendingIds' = '[]'::jsonb, 'A/B/C server acknowledgement leaked pending ids';
  assert reset_group_left #> '{trail,stopsDone}' = '[]'::jsonb, 'A/B/C convergence resurrected pre-reset progress';

  -- If the canonical pending id is only carried in the observed set, the
  -- incoming active journey belongs to another reset. The safe authority is a
  -- fresh journey, never that mismatched progress snapshot.
  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":10,"resetAt":"2026-07-21T10:00:00Z","resetId":"reset-b","resetHistory":["legacy"],"resetPendingIds":[],"resetPending":false,"hatched":true,"trail":{"routeCursor":3,"stopsDone":["s1","s2"]}}'::jsonb,
    '{"resetEpoch":8,"resetAt":"2026-07-21T08:00:00Z","resetId":"reset-a-carrier","resetHistory":["legacy"],"resetPendingIds":["reset-a-carrier","reset-z-carried"],"resetPending":true,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"mastery":{"s":{"seen":4}},"stones":["s"],"checkpoint":{"stopId":"s2"}}'::jsonb);
  assert r ->> 'resetId' = 'reset-z-carried', 'canonical carried pending id was not selected';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'mismatched active reset journey was accepted for a carried winner';
  assert r -> 'mastery' = '{}'::jsonb, 'fresh carried reset fallback retained mismatched mastery';

  -- Reachable hidden-owner case: tabs A and B coalesced to active B with both
  -- operations pending, then the cloud acknowledges B without having seen A.
  -- A must remain authoritative, but neither input owns A's snapshot, so the
  -- server applies a fresh A journey and acknowledges it.
  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":20,"resetAt":"2026-07-21T12:00:00Z","resetId":"reset-b-visible","resetHistory":["legacy"],"resetPendingIds":[],"resetPending":false,"hatched":true,"trail":{"routeCursor":4,"stopsDone":["s1","s2","s3"]},"mastery":{"s":{"seen":12}},"stones":["s"],"checkpoint":{"stopId":"s4"}}'::jsonb,
    '{"resetEpoch":20,"resetAt":"2026-07-21T12:00:00Z","resetId":"reset-b-visible","resetHistory":["legacy"],"resetPendingIds":["reset-a-hidden","reset-b-visible"],"resetPending":true,"hatched":true,"trail":{"routeCursor":2,"stopsDone":["s1"]},"mastery":{"s":{"seen":4}},"stones":["s"],"checkpoint":{"stopId":"s2"}}'::jsonb);
  assert r ->> 'resetId' = 'reset-a-hidden', 'acknowledging visible B suppressed hidden pending reset A';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'hidden pending reset reused visible B progress';
  assert r -> 'mastery' = '{}'::jsonb, 'hidden pending reset retained visible B mastery';
  assert r -> 'resetHistory' @> '["legacy","reset-b-visible"]'::jsonb, 'hidden pending reset lost acknowledged B ancestry';
  assert r -> 'resetPendingIds' = '[]'::jsonb, 'hidden pending reset was not acknowledged by the server';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":3,"resetAt":"2026-07-21T09:05:00Z","resetId":"reset-b","resetHistory":["legacy","reset-a"],"resetPending":false,"hatched":false,"trail":{"routeCursor":1,"stopsDone":[]},"mastery":{},"stones":[],"ledger":{"purchases":[]},"checkpoint":null}'::jsonb,
    '{"assignment":{"targets":["sh"],"assignedAt":"2026-07-21T08:00:00Z","by":"teacher"}}'::jsonb);
  assert r ->> 'resetEpoch' = '3', 'teacher assignment downgraded the journey generation';
  assert r #> '{trail,stopsDone}' = '[]'::jsonb, 'teacher assignment changed journey progress';
  assert r #> '{assignment,targets}' = '["sh"]'::jsonb, 'teacher assignment was not delivered across reset generations';

  r := public.lp_merge_phonics_quest(
    '{"resetEpoch":3,"resetAt":"2026-07-21T09:05:00Z","resetId":"reset-b","resetHistory":["legacy","reset-a"],"resetPending":false,"trail":{"routeCursor":2,"stopsDone":["s1"]},"stones":["s"]}'::jsonb,
    '{"resetEpoch":3,"resetAt":"2026-07-21T09:05:00Z","resetId":"reset-b","resetHistory":["legacy","reset-a"],"resetPending":false,"trail":{"routeCursor":3,"stopsDone":["s2"]},"stones":["m"]}'::jsonb);
  assert r #> '{trail,stopsDone}' @> '["s1","s2"]'::jsonb, 'equal generations stopped merging progress forward';
  assert r -> 'stones' @> '["s","m"]'::jsonb, 'equal generations stopped merging stones forward';

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

  raise notice 'ALL SOUND SEEKERS AUDIT-INTEGRITY + RESET-EPOCH TESTS PASSED';
end $$;
