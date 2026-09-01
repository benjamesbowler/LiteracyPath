begin;

do $$
declare
  merged jsonb;
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
end;
$$;

rollback;
