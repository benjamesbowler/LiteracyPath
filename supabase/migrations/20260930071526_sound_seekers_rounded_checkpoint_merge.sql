-- Match the rounded client's exact undo and per-item delivery rules.
-- Only these two existing pure SECURITY INVOKER JSON merge helpers change.
-- No learner rows, permissions, tables, reset epochs or other area routes change.
-- Existing immutable packs, errors, support and completion protections remain.

create or replace function public.lp_campaign_checkpoint(a jsonb, b jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare result jsonb; state jsonb; field text; av numeric; bv numeric; item record; merged_items jsonb;
begin
  if a is null then return b; end if;
  if b is null then return a; end if;
  if a ->> 'attemptId' <> b ->> 'attemptId' then
    foreach field in array array['replayOrdinal','startedAt'] loop
      av := public.lp_campaign_num(a -> field); bv := public.lp_campaign_num(b -> field);
      if av <> bv then return case when av > bv then a else b end; end if;
    end loop;
    return case when a ->> 'attemptId' collate "C" > b ->> 'attemptId' collate "C" then a else b end;
  end if;
  if public.lp_campaign_challenge_identity(a -> 'challenges') is distinct from public.lp_campaign_challenge_identity(b -> 'challenges') then
    raise exception 'Conflicting immutable campaign challenge checkpoint' using errcode = '22023';
  end if;
  foreach field in array array['beatIndex','done','itemIndex','actionRevision','placedLength','cardsHeardLength','updatedAt'] loop
    if field = 'done' then
      av := case when a #> '{beatState,done}' = 'true'::jsonb then 1 else 0 end;
      bv := case when b #> '{beatState,done}' = 'true'::jsonb then 1 else 0 end;
    elsif field = 'itemIndex' then
      av := public.lp_campaign_num(a #> '{beatState,itemIndex}'); bv := public.lp_campaign_num(b #> '{beatState,itemIndex}');
    elsif field = 'actionRevision' then
      av := public.lp_campaign_num(a #> '{beatState,actionRevision}'); bv := public.lp_campaign_num(b #> '{beatState,actionRevision}');
    elsif field in ('placedLength','cardsHeardLength') then
      av := case when jsonb_typeof(a #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) = 'array'
        then jsonb_array_length(a #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) else 0 end;
      bv := case when jsonb_typeof(b #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) = 'array'
        then jsonb_array_length(b #> array['beatState',case when field = 'placedLength' then 'placed' else 'cardsHeard' end]) else 0 end;
    else av := public.lp_campaign_num(a -> field); bv := public.lp_campaign_num(b -> field); end if;
    if av <> bv then result := case when av > bv then a else b end; exit; end if;
  end loop;
  result := coalesce(result, case when public.lp_campaign_canonical(a) collate "C" <= public.lp_campaign_canonical(b) collate "C" then a else b end);
  if jsonb_typeof(b -> 'challenges') = 'object' then result := jsonb_set(result,'{challenges}',b -> 'challenges');
  elsif jsonb_typeof(a -> 'challenges') = 'object' then result := jsonb_set(result,'{challenges}',a -> 'challenges'); end if;
  result := result || jsonb_build_object('completed', coalesce(a -> 'completed' = 'true'::jsonb, false) or coalesce(b -> 'completed' = 'true'::jsonb, false));
  if a ? 'playTime' or b ? 'playTime' then
    result := result || jsonb_build_object('playTime', jsonb_build_object('v',1,
      'estimatedActiveMs',greatest(public.lp_campaign_num(a #> '{playTime,estimatedActiveMs}'),public.lp_campaign_num(b #> '{playTime,estimatedActiveMs}')),
      'estimatedHelpMs',greatest(least(public.lp_campaign_num(a #> '{playTime,estimatedActiveMs}'),public.lp_campaign_num(a #> '{playTime,estimatedHelpMs}')),
        least(public.lp_campaign_num(b #> '{playTime,estimatedActiveMs}'),public.lp_campaign_num(b #> '{playTime,estimatedHelpMs}')))));
  end if;
  if a -> 'beatIndex' = b -> 'beatIndex' then
    if jsonb_typeof(a #> '{beatState,placed}') = 'array' and jsonb_typeof(b #> '{beatState,placed}') = 'array' then
      if exists(select 1 from jsonb_array_elements(a #> '{beatState,placed}') with ordinality l(value,n)
        join jsonb_array_elements(b #> '{beatState,placed}') with ordinality r(value,n) on l.n = r.n where l.value <> r.value) then
        raise exception 'Conflicting immutable campaign placement sequence' using errcode = '22023';
      end if;
    end if;
    state := coalesce(result -> 'beatState', '{}'::jsonb) || jsonb_build_object(
      'supportUsed', public.lp_campaign_strings(a #> '{beatState,supportUsed}', b #> '{beatState,supportUsed}'),
      'errors', greatest(public.lp_campaign_num(a #> '{beatState,errors}'), public.lp_campaign_num(b #> '{beatState,errors}')),
      'modelShown', coalesce(a #> '{beatState,modelShown}' = 'true'::jsonb, false) or coalesce(b #> '{beatState,modelShown}' = 'true'::jsonb, false),
      'done', coalesce(a #> '{beatState,done}' = 'true'::jsonb, false) or coalesce(b #> '{beatState,done}' = 'true'::jsonb, false));
    foreach field in array array['heardSources','cardsHeard'] loop
      if (a -> 'beatState') ? field or (b -> 'beatState') ? field then
        state := jsonb_set(state, array[field], public.lp_campaign_strings(a #> array['beatState',field], b #> array['beatState',field]), true);
      end if;
    end loop;
    if (a -> 'beatState') ? 'heard' or (b -> 'beatState') ? 'heard' then state := state || jsonb_build_object('heard',
      case when public.lp_campaign_num(a #> '{beatState,itemIndex}') <> public.lp_campaign_num(b #> '{beatState,itemIndex}')
        then coalesce(result #> '{beatState,heard}' = 'true'::jsonb,false)
        else coalesce(a #> '{beatState,heard}' = 'true'::jsonb,false) or coalesce(b #> '{beatState,heard}' = 'true'::jsonb,false) end); end if;
    if (a -> 'beatState') ? 'slotErrors' or (b -> 'beatState') ? 'slotErrors' then state := state || jsonb_build_object('slotErrors',
      greatest(public.lp_campaign_num(a #> '{beatState,slotErrors}'),public.lp_campaign_num(b #> '{beatState,slotErrors}'))); end if;
    if (a -> 'beatState') ? 'sceneRepairs' or (b -> 'beatState') ? 'sceneRepairs' then state := state || jsonb_build_object('sceneRepairs',
      public.lp_campaign_union_records(a #> '{beatState,sceneRepairs}',b #> '{beatState,sceneRepairs}')); end if;
    if (a -> 'beatState') ? 'itemErrors' or (b -> 'beatState') ? 'itemErrors' then
      merged_items := coalesce(a #> '{beatState,itemErrors}','{}'::jsonb);
      for item in select key,value from jsonb_each(coalesce(b #> '{beatState,itemErrors}','{}'::jsonb)) loop
        merged_items := jsonb_set(merged_items,array[item.key],to_jsonb(greatest(public.lp_campaign_num(merged_items -> item.key),public.lp_campaign_num(item.value))),true);
      end loop;
      state := state || jsonb_build_object('itemErrors',merged_items);
    end if;
    if jsonb_typeof(a #> '{beatState,placed}') = 'object' and jsonb_typeof(b #> '{beatState,placed}') = 'object' then
      if exists(select 1 from jsonb_each(a #> '{beatState,placed}') l join jsonb_each(b #> '{beatState,placed}') r using(key) where l.value <> r.value) then
        raise exception 'Conflicting immutable campaign sorted placement' using errcode = '22023';
      end if;
      state := state || jsonb_build_object('placed',(a #> '{beatState,placed}') || (b #> '{beatState,placed}'));
    end if;
    result := result || jsonb_build_object('beatState', state);
  end if;
  return result;
end;
$$;

create or replace function public.lp_merge_sound_seekers_campaign(a jsonb, b jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare ae jsonb; be jsonb; events jsonb; event_key text; event jsonb; winner jsonb; result jsonb;
  ac jsonb; bc jsonb; campaign jsonb; completed jsonb; checkpoints jsonb := '{}'::jsonb; checkpoint_id text;
  legacy jsonb; evidence jsonb; anchors jsonb; stop_id text; attempt_ids jsonb := '{}'::jsonb; visits jsonb; step numeric;
  inventory jsonb := '{}'::jsonb; discoveries jsonb; game_id text; left_item jsonb; right_item jsonb; saved_item jsonb;
begin
  if a is null or a in ('{}'::jsonb, 'null'::jsonb) then a := '{"v":3,"hero":"speedy","heroChosen":false,"journeyStep":0,"currentStopId":"s1","completed":{},"checkpoint":null,"targets":{},"evidence":[],"updatedAt":0}'::jsonb; end if;
  if b is null or b in ('{}'::jsonb, 'null'::jsonb) then b := '{"v":3,"hero":"speedy","heroChosen":false,"journeyStep":0,"currentStopId":"s1","completed":{},"checkpoint":null,"targets":{},"evidence":[],"updatedAt":0}'::jsonb; end if;
  if a ->> 'v' is distinct from '3' or b ->> 'v' is distinct from '3'
    or coalesce(a #>> '{campaign,v}', '1') <> '1' or coalesce(b #>> '{campaign,v}', '1') <> '1' then
    raise exception 'Unsupported Sound Seekers campaign save version' using errcode = '22023';
  end if;
  if b ? '_campaignDelta' and (b #>> '{_campaignDelta,v}' <> '1'
    or jsonb_typeof(b #> '{_campaignDelta,fullCompletionCount}') <> 'number'
    or not a ? 'campaign') then raise exception 'Campaign delta requires a saved full campaign' using errcode='22023'; end if;
  ae := public.lp_campaign_events(a); be := public.lp_campaign_events(b);
  events := public.lp_campaign_union_records(ae, be);
  winner := case when public.lp_campaign_num(a -> 'updatedAt') > public.lp_campaign_num(b -> 'updatedAt') then a
    when public.lp_campaign_num(a -> 'updatedAt') < public.lp_campaign_num(b -> 'updatedAt') then b
    when public.lp_campaign_canonical(a) collate "C" <= public.lp_campaign_canonical(b) collate "C" then a else b end;
  ac := coalesce(a -> 'campaign', '{}'::jsonb); bc := coalesce(b -> 'campaign', '{}'::jsonb);
  completed := public.lp_campaign_union_records(ac -> 'completedMissions', bc -> 'completedMissions');
  for checkpoint_id in select key from jsonb_each(coalesce(ac -> 'checkpoints', '{}'::jsonb))
    union select key from jsonb_each(coalesce(bc -> 'checkpoints', '{}'::jsonb)) loop
    checkpoints := jsonb_set(checkpoints, array[checkpoint_id], public.lp_campaign_checkpoint(ac #> array['checkpoints',checkpoint_id], bc #> array['checkpoints',checkpoint_id]), true);
  end loop;
  evidence := '[]'::jsonb;
  for event_key, event in select key, value from jsonb_each(events) order by key collate "C" loop
    evidence := evidence || jsonb_build_array(event);
    attempt_ids := jsonb_set(attempt_ids, array[event_key], 'true'::jsonb, true);
  end loop;
  -- Retain identical legacy records at their greatest observed multiplicity.
  -- These older records have no immutable ID: summing copies would double them.
  with left_events as (
    select item, count(*) n from jsonb_array_elements(coalesce(a -> 'evidence', '[]'::jsonb)) e(item)
      where public.lp_campaign_event_key(item) is null group by item
  ), right_events as (
    select item, count(*) n from jsonb_array_elements(coalesce(b -> 'evidence', '[]'::jsonb)) e(item)
      where public.lp_campaign_event_key(item) is null group by item
  ), copies as (
    select coalesce(l.item,r.item) item, greatest(coalesce(l.n,0),coalesce(r.n,0)) n
      from left_events l full join right_events r on l.item = r.item
  ) select coalesce(jsonb_agg(item order by public.lp_campaign_canonical(item) collate "C"), '[]'::jsonb)
    into legacy from copies cross join lateral generate_series(1, n);
  visits := public.lp_campaign_strings(ac -> 'visitedStageIds', bc -> 'visitedStageIds');
  anchors := public.lp_campaign_union_records(ac -> 'storyAnchors', bc -> 'storyAnchors');
  for stop_id in select key from jsonb_each(coalesce(a -> 'completed', '{}'::jsonb) || coalesce(b -> 'completed', '{}'::jsonb))
    where key ~ '^s([1-9]|[1-3][0-9]|40)$' and value not in ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '""'::jsonb)
  loop
    if not anchors ? stop_id then anchors := jsonb_set(anchors, array[stop_id], jsonb_build_object(
      'stopId', stop_id, 'stageId', null, 'sourceVersion', 3, 'narrativeOnly', true), true); end if;
  end loop;
  discoveries := public.lp_campaign_union_records(ac -> 'gameDiscoveries', bc -> 'gameDiscoveries');
  for game_id in select key from jsonb_each(coalesce(ac -> 'gameInventory','{}'::jsonb))
    union select key from jsonb_each(coalesce(bc -> 'gameInventory','{}'::jsonb)) loop
    left_item := ac #> array['gameInventory',game_id]; right_item := bc #> array['gameInventory',game_id];
    saved_item := case when left_item is null then right_item when right_item is null then left_item
      when public.lp_campaign_num(left_item -> 'at') > public.lp_campaign_num(right_item -> 'at') then left_item
      when public.lp_campaign_num(left_item -> 'at') < public.lp_campaign_num(right_item -> 'at') then right_item
      when public.lp_campaign_canonical(left_item) collate "C" <= public.lp_campaign_canonical(right_item) collate "C" then left_item else right_item end;
    if saved_item ->> 'carryingId' is not null and discoveries ? (game_id || ':' || (saved_item ->> 'carryingId')) then
      saved_item := saved_item || jsonb_build_object('carryingId',null);
    end if;
    inventory := jsonb_set(inventory,array[game_id],saved_item,true);
  end loop;
  campaign := coalesce(winner -> 'campaign', '{}'::jsonb) || jsonb_build_object(
    'v', 1, 'contentVersion', coalesce(winner #> '{campaign,contentVersion}', '1'::jsonb),
    'activeMissionId', coalesce(winner #> '{campaign,activeMissionId}', 'null'::jsonb),
    'completedMissions', completed, 'repairs', public.lp_campaign_union_records(ac -> 'repairs', bc -> 'repairs'),
    'gameDiscoveries', discoveries, 'gameInventory', inventory,
    'storyAnchors', anchors,
    'visitedStageIds', visits, 'checkpoints', checkpoints, 'attemptIds', attempt_ids,
    'startedAttemptIds', coalesce(ac -> 'startedAttemptIds', '{}'::jsonb) || coalesce(bc -> 'startedAttemptIds', '{}'::jsonb));
  -- Migration snapshots are deliberately device-only and must never expand
  -- cloud retention to old telemetry or teacher-owned assignments.
  campaign := campaign - 'legacySave' - 'legacySaves';
  step := greatest(0, public.lp_campaign_num(a -> 'journeyStep') - (select count(*) from jsonb_each(coalesce(ac -> 'completedMissions', '{}'::jsonb))),
    public.lp_campaign_num(b -> 'journeyStep') - coalesce(public.lp_campaign_num(b #> '{_campaignDelta,fullCompletionCount}') * case when b ? '_campaignDelta' then 1 else null end, (select count(*) from jsonb_each(coalesce(bc -> 'completedMissions', '{}'::jsonb)))))
    + (select count(*) from jsonb_each(completed));
  result := winner || jsonb_build_object('v',3,'campaign',campaign,'evidence',legacy || evidence,
    'completed',public.lp_campaign_union_records(a -> 'completed',b -> 'completed'),
    'journeyStep',step,'updatedAt',greatest(public.lp_campaign_num(a -> 'updatedAt'), public.lp_campaign_num(b -> 'updatedAt')),
    'targets',public.lp_campaign_merge_targets(a -> 'targets',b -> 'targets',ae,be,events));
  return result - 'assignment' - 'telemetry' - '_campaignDelta';
end;
$$;
