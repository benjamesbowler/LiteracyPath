begin;

do $$
declare
  merged jsonb;
  function_oid oid;
  function_signature text;
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

  -- Evidence conflict vectors mirror tests/unit/soundSeekersStateV2.test.js.
  -- Identical delivery retries stay normal; divergent payloads collapse to
  -- one absorbing marker that can never contribute learning credit.
  merged := public.lp_quest_merge_learning_v2(
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"same-attempt:1","at":11,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"domain":"phoneme_to_grapheme","target":"sh","evidenceKind":"practice","correct":true,"at":11,"id":"same-attempt:1"}],"settings":{}}'::jsonb
  );
  if merged #> '{evidence}' <> '[{"id":"same-attempt:1","at":11,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}]'::jsonb then
    raise exception 'identical evidence retry did not remain one normal event: %', merged -> 'evidence';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"conflicted-attempt:2","at":11,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"conflicted-attempt:2","at":12,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":false,"confusion":"ch"}],"settings":{}}'::jsonb
  );
  if merged #> '{evidence}' <> '[{"id":"conflicted-attempt:2","at":12,"evidenceKind":"conflict","conflicted":true}]'::jsonb then
    raise exception 'conflicting evidence did not fail closed: %', merged -> 'evidence';
  end if;
  if public.lp_quest_merge_learning_v2(
      '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"conflicted-attempt:2","at":12,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":false,"confusion":"ch"}],"settings":{}}'::jsonb,
      '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"conflicted-attempt:2","at":11,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb
    ) #> '{evidence}' <> merged #> '{evidence}' then
    raise exception 'conflicting evidence changed owner when merge direction reversed';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    merged,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"conflicted-attempt:2","at":11,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb
  );
  if merged #> '{evidence}' <> '[{"id":"conflicted-attempt:2","at":12,"evidenceKind":"conflict","conflicted":true}]'::jsonb then
    raise exception 'clean retry resurrected conflicted learning credit: %', merged -> 'evidence';
  end if;

  if public.lp_quest_merge_learning_v2(
      public.lp_quest_merge_learning_v2(
        '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"assoc:1","at":1,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb,
        '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"assoc:1","at":2,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":false}],"settings":{}}'::jsonb
      ),
      '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"assoc:1","at":3,"evidenceKind":"practice","target":"ch","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb
    ) #> '{evidence}'
    <> public.lp_quest_merge_learning_v2(
      '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"assoc:1","at":1,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb,
      public.lp_quest_merge_learning_v2(
        '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"assoc:1","at":2,"evidenceKind":"practice","target":"sh","domain":"phoneme_to_grapheme","correct":false}],"settings":{}}'::jsonb,
        '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"assoc:1","at":3,"evidenceKind":"practice","target":"ch","domain":"phoneme_to_grapheme","correct":true}],"settings":{}}'::jsonb
      )
    ) #> '{evidence}' then
    raise exception 'conflicting evidence merge was not associative';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    merged,
    '{"assignment":{"targets":["ch","th"],"assignedAt":"2026-09-01T09:00:00Z","by":"teacher"}}'::jsonb
  );
  if merged #> '{assignment}' <> '{"targets":["ch","th"],"assignedAt":"2026-09-01T09:00:00Z","by":"teacher"}'::jsonb then
    raise exception 'teacher partial assignment did not replace the previous assignment';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    merged,
    '{"assignment":null}'::jsonb
  );
  if jsonb_typeof(merged -> 'assignment') <> 'null' then
    raise exception 'teacher partial assignment did not deliberately clear the previous assignment';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":" shared ","at":2},{"id":"number","at":4},{"id":"string","at":"a"}],"assignment":{"stopIds":["s4"]},"settings":{}}'::jsonb,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{},"evidence":[{"id":"shared","at":2}],"assignment":{"stopIds":["s40"]},"settings":{}}'::jsonb
  );
  if merged #> '{evidence}' <> '[{"id":"shared","at":2},{"id":"number","at":4},{"id":"string","at":"a"}]'::jsonb then raise exception 'v2 evidence normalization diverged'; end if;
  if merged #> '{assignment}' <> '{"stopIds":["s40"]}'::jsonb then raise exception 'valid incoming teacher assignment did not replace the previous assignment'; end if;

  merged := public.lp_quest_merge_learning_v2(
    merged,
    '{"assignment":{"note":"metadata only"}}'::jsonb
  );
  if merged #> '{assignment}' <> '{"stopIds":["s40"]}'::jsonb then
    raise exception 'invalid non-null assignment cleared or replaced the previous assignment';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    '{"v":1,"assignment":{"stopIds":["s2"]}}'::jsonb,
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{"journeyStep":5},"evidence":[{"id":"v2","at":5}],"settings":{}}'::jsonb
  );
  if merged ->> 'v' <> '2' or merged #>> '{trail,journeyStep}' <> '5' then
    raise exception 'incoming v2 game state did not outrank stale stored v1 state';
  end if;
  if merged #> '{assignment}' <> '{"stopIds":["s2"]}'::jsonb then
    raise exception 'v2 child omission lost the stored teacher assignment';
  end if;

  merged := public.lp_quest_merge_learning_v2(
    '{"v":2,"contentVersion":"sound-seekers-v2","reset":{"epoch":0,"at":null},"trail":{"journeyStep":6},"evidence":[{"id":"v2","at":6}],"assignment":{"stopIds":["s6"]},"settings":{}}'::jsonb,
    '{"v":1,"mastery":{"sh":{"correct":99}}}'::jsonb
  );
  if merged ->> 'v' <> '2' or merged #>> '{trail,journeyStep}' <> '6' then
    raise exception 'stored v2 game state did not outrank stale incoming v1 state';
  end if;
  if merged #> '{assignment}' <> '{"stopIds":["s6"]}'::jsonb then
    raise exception 'stale v1 omission lost the stored teacher assignment';
  end if;

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

  foreach function_signature in array array[
    'public.lp_quest_union_v2_evidence(jsonb,jsonb)',
    'public.lp_quest_union_v2_ids(jsonb,jsonb)',
    'public.lp_quest_normalize_v2_assignment(jsonb)',
    'public.lp_quest_merge_learning_v2(jsonb,jsonb)',
    'public.lp_merge_phonics_quest(jsonb,jsonb)'
  ] loop
    function_oid := to_regprocedure(function_signature)::oid;
    if function_oid is null then
      raise exception 'expected v2 helper is missing: %', function_signature;
    end if;
    if exists (
      select 1
        from pg_proc procedure,
             lateral aclexplode(coalesce(
               procedure.proacl,
               acldefault('f', procedure.proowner)
             )) privilege
       where procedure.oid = function_oid
         and privilege.grantee = 0
         and privilege.privilege_type = 'EXECUTE'
    ) then
      raise exception 'PUBLIC received v2 helper execution: %', function_signature;
    end if;
    if not has_function_privilege('anon', function_oid, 'EXECUTE')
      or not has_function_privilege('authenticated', function_oid, 'EXECUTE') then
      raise exception 'existing browser-role v2 helper grants changed: %', function_signature;
    end if;
  end loop;
end;
$$;

rollback;
