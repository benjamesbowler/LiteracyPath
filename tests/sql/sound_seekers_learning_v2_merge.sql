begin;

do $$
declare
  merged jsonb;
  too_many_events jsonb;
begin
  merged := public.lp_quest_merge_learning_v2(
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{"routeCursor":1,"journeyStep":41,"completedStopIds":["s1"],"repairs":{"mill":true},"chapterCoverage":{"seedwake":2}},"evidence":[{"id":"a","at":1}],"confusions":{},"contentDecks":{"heartWords":{},"stories":{},"alternatives":{}},"journal":{"words":["cat"],"scenes":[],"stickers":[]},"rewards":{"claimedIds":["r1"]},"checkpoint":{"stopId":"s1","contentVersion":"sound-seekers-v2"},"assignment":{"stopIds":["s1"]},"settings":{}}'::jsonb,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{"routeCursor":2,"journeyStep":42,"completedStopIds":["s2"],"repairs":{"bridge":true},"chapterCoverage":{"seedwake":3}},"evidence":[{"id":"b","at":2}],"confusions":{},"contentDecks":{"heartWords":{},"stories":{},"alternatives":{}},"journal":{"words":["dog"],"scenes":[],"stickers":[]},"rewards":{"claimedIds":["r2"]},"checkpoint":{"stopId":"s2","contentVersion":"sound-seekers-v2"},"settings":{}}'::jsonb
  );
  if merged #>> '{trail,journeyStep}' <> '42' then raise exception 'v2 journey step did not merge forward'; end if;
  if merged #> '{evidence}' <> '[{"id":"a","at":1},{"id":"b","at":2}]'::jsonb then raise exception 'v2 evidence did not merge deterministically'; end if;
  if merged #> '{trail,repairs}' <> '{"mill":true,"bridge":true}'::jsonb then raise exception 'v2 repairs did not union'; end if;
  if merged #> '{assignment}' <> '{"stopIds":["s1"]}'::jsonb then raise exception 'teacher assignment did not survive child upload'; end if;
  if merged #>> '{checkpoint,stopId}' <> 's2' then raise exception 'writer checkpoint was not retained'; end if;

  merged := public.lp_quest_merge_learning_v2(
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":" shared ","at":2},{"id":"number","at":4},{"id":"string","at":"a"}],"assignment":{"note":"metadata only"},"settings":{}}'::jsonb,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"shared","at":1}],"assignment":{"stopIds":["s4"]},"settings":{}}'::jsonb
  );
  if merged #> '{evidence}' <> '[{"id":"shared","at":2},{"id":"number","at":4},{"id":"string","at":"a"}]'::jsonb then raise exception 'v2 evidence normalization diverged'; end if;
  if merged #> '{assignment}' <> '{"stopIds":["s4"]}'::jsonb then raise exception 'invalid teacher assignment survived'; end if;

  select jsonb_agg(jsonb_build_object('id', 'event-' || n, 'at', n))
    into too_many_events from generate_series(1, 1201) n;
  merged := public.lp_quest_merge_learning_v2(
    '{"v":1,"assignment":{"stopIds":["s2"]}}'::jsonb,
    jsonb_build_object(
      'v', 2, 'contentVersion', 'sound-seekers-v2',
      'reset', jsonb_build_object('epoch', 0, 'at', null), 'trail', '{}'::jsonb,
      'evidence', too_many_events,
      'checkpoint', jsonb_build_object('stopId', 's9', 'contentVersion', 'stale-content'),
      'settings', '{}'::jsonb
    )
  );
  if jsonb_array_length(merged -> 'evidence') <> 1200 then raise exception 'sole v2 winner did not bound evidence'; end if;
  if jsonb_typeof(merged -> 'checkpoint') <> 'null' then raise exception 'sole v2 winner kept an incompatible checkpoint'; end if;

  merged := public.lp_quest_merge_learning_v2(
    jsonb_build_object(
      'v', 2, 'contentVersion', 'sound-seekers-v2',
      'reset', jsonb_build_object('epoch', 2, 'at', null), 'trail', '{}'::jsonb,
      'evidence', too_many_events,
      'checkpoint', jsonb_build_object('stopId', 's9', 'contentVersion', 'stale-content'),
      'settings', '{}'::jsonb
    ),
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":1,"at":null},"trail":{},"evidence":[],"settings":{}}'::jsonb
  );
  if jsonb_array_length(merged -> 'evidence') <> 1200 then raise exception 'higher reset winner did not bound evidence'; end if;
  if jsonb_typeof(merged -> 'checkpoint') <> 'null' then raise exception 'higher reset winner kept an incompatible checkpoint'; end if;
end;
$$;

rollback;
