-- Sound Seekers child reset generations.
--
-- Most quest data is deliberately forward-only, but "Start adventure again"
-- is a legitimate destructive operation. Without an explicit generation, the
-- stored row unions the old trail/mastery/checkpoint straight back into the
-- fresh save. Each reset issues a unique `resetId` and carries its observed
-- `resetHistory`; ancestry therefore remains correct even when a stale offline
-- device's clock is behind. `resetEpoch` / `resetAt` are deterministic fallback
-- ordering for malformed legacy conflicts, not reset authority.
--
-- Teacher-owned `assignment` is intentionally not one of the resettable
-- fields. Child uploads omit it, and a teacher's partial {assignment} upsert
-- may not contain resetEpoch; existing || incoming therefore continues to
-- deliver/clear assignments without changing the child's journey generation.

-- Reset metadata is a pair of observed sets:
--   resetHistory    ids known to be settled/superseded
--   resetPendingIds reset operations not yet acknowledged by the server
-- The set helper is deliberately sorted and de-duplicated so every merge
-- orientation produces byte-for-byte equivalent metadata.
create or replace function public.lp_quest_reset_id_set(
  a jsonb,
  b jsonb,
  include_ids jsonb,
  exclude_ids jsonb
)
returns jsonb language sql immutable as $$
  with raw_ids(id) as (
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
    union all
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
    union all
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(include_ids) = 'array' then include_ids end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
  ), normalized_ids as (
    select distinct coalesce(nullif(left(btrim(id), 160), ''), 'legacy') as id
      from raw_ids
  ), normalized_exclusions as (
    select distinct coalesce(nullif(left(btrim(value #>> '{}'), 160), ''), 'legacy') as id
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(exclude_ids) = 'array' then exclude_ids end,
        '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
  )
  select coalesce(jsonb_agg(to_jsonb(n.id) order by n.id collate "C"), '[]'::jsonb)
    from normalized_ids n
   where not exists (
     select 1 from normalized_exclusions x where x.id = n.id
   );
$$;

-- Compatibility wrapper retained for audit tooling and any already-prepared
-- statements which reference the scalar helper from the first migration pass.
create or replace function public.lp_quest_reset_history(
  a jsonb,
  b jsonb,
  include_id text,
  exclude_id text
)
returns jsonb language sql immutable as $$
  select public.lp_quest_reset_id_set(
    a,
    b,
    case when coalesce(btrim(include_id), '') = ''
      then '[]'::jsonb else jsonb_build_array(include_id) end,
    case when coalesce(btrim(exclude_id), '') = ''
      then '[]'::jsonb else jsonb_build_array(exclude_id) end
  );
$$;

-- Bridge saves written before resetPendingIds existed. A true scalar
-- resetPending means the active reset id is one pending operation. Any id the
-- same payload already carries in history is settled and must not be pending.
create or replace function public.lp_quest_pending_reset_ids(
  payload jsonb,
  active_id text,
  reset_history jsonb
)
returns jsonb language sql immutable as $$
  select public.lp_quest_reset_id_set(
    coalesce(
      case when jsonb_typeof(payload -> 'resetPendingIds') = 'array'
        then payload -> 'resetPendingIds' end,
      '[]'::jsonb),
    '[]'::jsonb,
    case when coalesce(payload ->> 'resetPending', 'false') = 'true'
      then jsonb_build_array(active_id) else '[]'::jsonb end,
    reset_history
  );
$$;

create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  existing_present boolean := existing is not null and jsonb_typeof(existing) = 'object';
  trail jsonb;
  cursor_val numeric;
  incoming_has_progress boolean := false;
  incoming_checkpoint jsonb;
  existing_checkpoint jsonb;
  chosen_checkpoint jsonb := 'null'::jsonb;
  existing_creature_at text := coalesce(existing ->> 'creatureAt', '');
  incoming_creature_at text := coalesce(incoming ->> 'creatureAt', '');
  existing_settings_at text := coalesce(existing ->> 'settingsAt', '');
  incoming_settings_at text := coalesce(incoming ->> 'settingsAt', '');
  existing_reset_epoch numeric;
  incoming_reset_epoch numeric;
  existing_reset_at text := coalesce(existing ->> 'resetAt', '');
  incoming_reset_at text := coalesce(incoming ->> 'resetAt', '');
  existing_reset_id text := coalesce(nullif(left(btrim(case
    when jsonb_typeof(existing -> 'resetId') = 'string' then existing ->> 'resetId'
    else '' end), 160), ''), 'legacy');
  incoming_reset_id text := coalesce(nullif(left(btrim(case
    when jsonb_typeof(incoming -> 'resetId') = 'string' then incoming ->> 'resetId'
    else '' end), 160), ''), 'legacy');
  existing_reset_history jsonb := coalesce(
    case when jsonb_typeof(existing -> 'resetHistory') = 'array' then existing -> 'resetHistory' end,
    '[]'::jsonb);
  incoming_reset_history jsonb := coalesce(
    case when jsonb_typeof(incoming -> 'resetHistory') = 'array' then incoming -> 'resetHistory' end,
    '[]'::jsonb);
  existing_pending_reset_ids jsonb := '[]'::jsonb;
  incoming_pending_reset_ids jsonb := '[]'::jsonb;
  combined_reset_history jsonb := '[]'::jsonb;
  acknowledged_reset_ids jsonb := '[]'::jsonb;
  settled_reset_ids jsonb := '[]'::jsonb;
  pending_reset_ids jsonb := '[]'::jsonb;
  existing_descends boolean;
  incoming_descends boolean;
  winner_reset_id text;
  loser_reset_id text;
  winner_is_existing boolean;
  winner_reset_epoch numeric;
  winner_reset_at text;
  merged_reset_history jsonb;
  authoritative jsonb;
  chosen_creature jsonb;
  chosen_settings jsonb;
begin
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;
  if not existing_present then existing := '{}'::jsonb; end if;

  existing_reset_epoch := least(
    9007199254740991::numeric,
    greatest(0, trunc(public.lp_quest_num(existing, 'resetEpoch'))));
  incoming_reset_epoch := least(
    9007199254740991::numeric,
    greatest(0, trunc(public.lp_quest_num(incoming, 'resetEpoch'))));

  existing_reset_history := public.lp_quest_reset_id_set(
    existing_reset_history,
    '[]'::jsonb,
    '[]'::jsonb,
    jsonb_build_array(existing_reset_id)
  );
  incoming_reset_history := public.lp_quest_reset_id_set(
    incoming_reset_history,
    '[]'::jsonb,
    '[]'::jsonb,
    jsonb_build_array(incoming_reset_id)
  );
  existing_pending_reset_ids := public.lp_quest_pending_reset_ids(
    existing, existing_reset_id, existing_reset_history);
  incoming_pending_reset_ids := public.lp_quest_pending_reset_ids(
    incoming, incoming_reset_id, incoming_reset_history);
  combined_reset_history := public.lp_quest_reset_id_set(
    existing_reset_history,
    incoming_reset_history,
    '[]'::jsonb,
    '[]'::jsonb
  );
  acknowledged_reset_ids := public.lp_quest_reset_id_set(
    case when jsonb_array_length(existing_pending_reset_ids) = 0
      then jsonb_build_array(existing_reset_id) else '[]'::jsonb end,
    case when jsonb_array_length(incoming_pending_reset_ids) = 0
      then jsonb_build_array(incoming_reset_id) else '[]'::jsonb end,
    '[]'::jsonb,
    '[]'::jsonb
  );
  settled_reset_ids := public.lp_quest_reset_id_set(
    combined_reset_history,
    acknowledged_reset_ids,
    '[]'::jsonb,
    '[]'::jsonb
  );
  pending_reset_ids := public.lp_quest_reset_id_set(
    existing_pending_reset_ids,
    incoming_pending_reset_ids,
    '[]'::jsonb,
    settled_reset_ids
  );

  -- Unknown/authority-owned keys keep the established incoming-wins contract.
  result := existing || incoming;

  -- Settings are not journey progress. Their explicit clock continues to win
  -- even when the journey generations differ, so a reset never turns off a
  -- child's accessibility settings.
  chosen_settings := case
    when incoming_settings_at <> ''
      and (existing_settings_at = '' or incoming_settings_at > existing_settings_at)
      and jsonb_typeof(incoming -> 'settings') = 'object'
      then incoming -> 'settings'
    else coalesce(
      case when jsonb_typeof(existing -> 'settings') = 'object' then existing -> 'settings' end,
      case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
      'null'::jsonb)
  end;

  -- Pending reset operations form an observed set. Set union followed by
  -- removal of history/acknowledged-current ids is associative, so the A/B/C
  -- case (A pending, B acknowledges A, unrelated C pending) leaves C pending
  -- regardless of queue grouping. Lexical max chooses one canonical snapshot;
  -- the whole set remains visible until this authoritative server merge.
  if jsonb_array_length(pending_reset_ids) > 0 then
    select value into winner_reset_id
      from jsonb_array_elements_text(pending_reset_ids)
     order by value collate "C" desc
     limit 1;

    if winner_reset_id = existing_reset_id
      and winner_reset_id = incoming_reset_id then
      -- Both sides own the same reset generation. The reset is already
      -- represented on both snapshots, so preserve post-reset learning with
      -- the normal same-generation forward merge while acknowledging the
      -- winner and folding any other pending operations into ancestry.
      combined_reset_history := public.lp_quest_reset_id_set(
        combined_reset_history,
        acknowledged_reset_ids,
        pending_reset_ids,
        jsonb_build_array(winner_reset_id)
      );
      pending_reset_ids := '[]'::jsonb;
    else
    if winner_reset_id = incoming_reset_id then
      winner_reset_epoch := incoming_reset_epoch;
      winner_reset_at := incoming_reset_at;
      -- An input whose active reset wins owns an unambiguous journey snapshot.
      -- A pending id merely carried in the observed set has metadata but no
      -- snapshot, so accepting another generation's journey would resurrect
      -- exactly the progress the reset meant to clear.
      authoritative := incoming;
    elsif winner_reset_id = existing_reset_id then
      winner_reset_epoch := existing_reset_epoch;
      winner_reset_at := existing_reset_at;
      authoritative := existing;
    else
      winner_reset_epoch := greatest(existing_reset_epoch, incoming_reset_epoch);
      winner_reset_at := greatest(existing_reset_at, incoming_reset_at);
      authoritative := null;
    end if;

    if authoritative is null then
      authoritative := jsonb_build_object(
        'creature', 'null'::jsonb,
        'creatureAt', winner_reset_at,
        'hatched', false,
        'trail', jsonb_build_object(
          'stopsDone', '[]'::jsonb,
          'stars', '{}'::jsonb,
          'drops', '{}'::jsonb,
          'routeCursor', 1),
        'mastery', '{}'::jsonb,
        'stones', '[]'::jsonb,
        'trickies', '[]'::jsonb,
        'ledger', jsonb_build_object('purchases', '[]'::jsonb),
        'lastEarnedGearStop', 'null'::jsonb,
        'checkpoint', 'null'::jsonb
      );
    end if;

    -- This function is the acknowledgement boundary. Fold every losing
    -- pending operation into history, retain the canonical winner as resetId,
    -- and explicitly clear both pending representations. A later stale replay
    -- is then settled by history before it can affect journey data.
    merged_reset_history := public.lp_quest_reset_id_set(
      combined_reset_history,
      acknowledged_reset_ids,
      pending_reset_ids,
      jsonb_build_array(winner_reset_id)
    );

    result := (result - 'telemetry') || jsonb_build_object(
      'resetEpoch', to_jsonb(winner_reset_epoch),
      'resetAt', to_jsonb(winner_reset_at),
      'resetId', to_jsonb(winner_reset_id),
      'resetHistory', merged_reset_history,
      'resetPendingIds', '[]'::jsonb,
      'resetPending', false,
      'creature', coalesce(
        case when jsonb_typeof(authoritative -> 'creature') = 'object' then authoritative -> 'creature' end,
        'null'::jsonb),
      'creatureAt', to_jsonb(coalesce(authoritative ->> 'creatureAt', '')),
      'hatched', to_jsonb(coalesce((authoritative ->> 'hatched')::boolean, false)),
      'trail', coalesce(
        case when jsonb_typeof(authoritative -> 'trail') = 'object' then authoritative -> 'trail' end,
        jsonb_build_object('stopsDone', '[]'::jsonb, 'stars', '{}'::jsonb, 'drops', '{}'::jsonb, 'routeCursor', 1)),
      'mastery', coalesce(
        case when jsonb_typeof(authoritative -> 'mastery') = 'object' then authoritative -> 'mastery' end,
        '{}'::jsonb),
      'stones', coalesce(
        case when jsonb_typeof(authoritative -> 'stones') = 'array' then authoritative -> 'stones' end,
        '[]'::jsonb),
      'trickies', coalesce(
        case when jsonb_typeof(authoritative -> 'trickies') = 'array' then authoritative -> 'trickies' end,
        '[]'::jsonb),
      'ledger', coalesce(
        case when jsonb_typeof(authoritative -> 'ledger') = 'object' then authoritative -> 'ledger' end,
        jsonb_build_object('purchases', '[]'::jsonb)),
      'settings', chosen_settings,
      'settingsAt', greatest(existing_settings_at, incoming_settings_at),
      'lastEarnedGearStop', coalesce(authoritative -> 'lastEarnedGearStop', 'null'::jsonb),
      'checkpoint', coalesce(authoritative -> 'checkpoint', 'null'::jsonb)
    );
    return result;
    end if;
  end if;

  -- With no unacknowledged operation, descendants beat ancestors. Unrelated
  -- acknowledged ids use the legacy issuance tuple only as a deterministic
  -- fallback. The losing current id joins history, making stale replays safe.
  if existing_reset_id <> incoming_reset_id then
    existing_descends := existing_reset_history ? incoming_reset_id;
    incoming_descends := incoming_reset_history ? existing_reset_id;

    if not existing_present then
      authoritative := incoming;
      winner_is_existing := false;
    elsif existing_descends and not incoming_descends then
      authoritative := existing;
      winner_is_existing := true;
    elsif incoming_descends and not existing_descends then
      authoritative := incoming;
      winner_is_existing := false;
    elsif existing_reset_epoch > incoming_reset_epoch
      or (existing_reset_epoch = incoming_reset_epoch and existing_reset_at > incoming_reset_at)
      or (existing_reset_epoch = incoming_reset_epoch and existing_reset_at = incoming_reset_at
        and existing_reset_id collate "C" > incoming_reset_id collate "C") then
      authoritative := existing;
      winner_is_existing := true;
    else
      authoritative := incoming;
      winner_is_existing := false;
    end if;

    if winner_is_existing then
      winner_reset_id := existing_reset_id;
      loser_reset_id := incoming_reset_id;
      winner_reset_epoch := existing_reset_epoch;
      winner_reset_at := existing_reset_at;
    else
      winner_reset_id := incoming_reset_id;
      loser_reset_id := existing_reset_id;
      winner_reset_epoch := incoming_reset_epoch;
      winner_reset_at := incoming_reset_at;
    end if;
    merged_reset_history := public.lp_quest_reset_id_set(
      combined_reset_history,
      acknowledged_reset_ids,
      jsonb_build_array(loser_reset_id),
      jsonb_build_array(winner_reset_id)
    );

    result := (result - 'telemetry') || jsonb_build_object(
      'resetEpoch', to_jsonb(winner_reset_epoch),
      'resetAt', to_jsonb(winner_reset_at),
      'resetId', to_jsonb(winner_reset_id),
      'resetHistory', merged_reset_history,
      'resetPendingIds', '[]'::jsonb,
      'resetPending', false,
      'creature', coalesce(
        case when jsonb_typeof(authoritative -> 'creature') = 'object' then authoritative -> 'creature' end,
        'null'::jsonb),
      'creatureAt', to_jsonb(coalesce(authoritative ->> 'creatureAt', '')),
      'hatched', to_jsonb(coalesce((authoritative ->> 'hatched')::boolean, false)),
      'trail', coalesce(
        case when jsonb_typeof(authoritative -> 'trail') = 'object' then authoritative -> 'trail' end,
        jsonb_build_object('stopsDone', '[]'::jsonb, 'stars', '{}'::jsonb, 'drops', '{}'::jsonb, 'routeCursor', 1)),
      'mastery', coalesce(
        case when jsonb_typeof(authoritative -> 'mastery') = 'object' then authoritative -> 'mastery' end,
        '{}'::jsonb),
      'stones', coalesce(
        case when jsonb_typeof(authoritative -> 'stones') = 'array' then authoritative -> 'stones' end,
        '[]'::jsonb),
      'trickies', coalesce(
        case when jsonb_typeof(authoritative -> 'trickies') = 'array' then authoritative -> 'trickies' end,
        '[]'::jsonb),
      'ledger', coalesce(
        case when jsonb_typeof(authoritative -> 'ledger') = 'object' then authoritative -> 'ledger' end,
        jsonb_build_object('purchases', '[]'::jsonb)),
      'settings', chosen_settings,
      'settingsAt', greatest(existing_settings_at, incoming_settings_at),
      'lastEarnedGearStop', coalesce(authoritative -> 'lastEarnedGearStop', 'null'::jsonb),
      'checkpoint', coalesce(authoritative -> 'checkpoint', 'null'::jsonb)
    );
    return result;
  end if;

  incoming_has_progress := case
    when jsonb_typeof(incoming #> '{trail,stopsDone}') = 'array'
      then jsonb_array_length(incoming #> '{trail,stopsDone}') > 0
    else false
  end;

  trail := public.lp_jsonb_forward_merge(existing -> 'trail', incoming -> 'trail');
  cursor_val := case
    when incoming_has_progress and public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(existing -> 'trail', 'routeCursor')
    when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    else 1
  end;
  if trail is null or jsonb_typeof(trail) <> 'object' then trail := '{}'::jsonb; end if;
  trail := trail || jsonb_build_object('routeCursor', to_jsonb(cursor_val));

  incoming_checkpoint := case
    when jsonb_typeof(incoming -> 'checkpoint') = 'object' then incoming -> 'checkpoint'
    else null
  end;
  existing_checkpoint := case
    when jsonb_typeof(existing -> 'checkpoint') = 'object' then existing -> 'checkpoint'
    else null
  end;
  if incoming_checkpoint is not null then
    chosen_checkpoint := incoming_checkpoint;
  elsif existing_checkpoint is not null
    and existing_checkpoint ->> 'stopId' = 's' || trunc(cursor_val)::bigint::text then
    chosen_checkpoint := existing_checkpoint;
  end if;

  chosen_creature := case
    when incoming_creature_at <> ''
      and (existing_creature_at = '' or incoming_creature_at > existing_creature_at)
      and jsonb_typeof(incoming -> 'creature') = 'object'
      then incoming -> 'creature'
    else coalesce(
      case when jsonb_typeof(existing -> 'creature') = 'object' then existing -> 'creature' end,
      case when jsonb_typeof(incoming -> 'creature') = 'object' then incoming -> 'creature' end,
      'null'::jsonb)
  end;

  -- Equal generations keep the existing forward-only achievement merge.
  merged_reset_history := public.lp_quest_reset_id_set(
    combined_reset_history,
    acknowledged_reset_ids,
    '[]'::jsonb,
    jsonb_build_array(existing_reset_id)
  );
  result := (result - 'telemetry') || jsonb_build_object(
    'resetEpoch', to_jsonb(greatest(existing_reset_epoch, incoming_reset_epoch)),
    'resetAt', greatest(existing_reset_at, incoming_reset_at),
    'resetId', to_jsonb(existing_reset_id),
    'resetHistory', merged_reset_history,
    'resetPendingIds', '[]'::jsonb,
    'resetPending', false,
    'creature', chosen_creature,
    'creatureAt', greatest(existing_creature_at, incoming_creature_at),
    'hatched', to_jsonb(
      coalesce((existing ->> 'hatched')::boolean, false)
      or coalesce((incoming ->> 'hatched')::boolean, false)),
    'trail', trail,
    'mastery', public.lp_quest_merge_mastery(existing -> 'mastery', incoming -> 'mastery'),
    'stones', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'stones') = 'array' then existing -> 'stones' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'stones') = 'array' then incoming -> 'stones' end, '[]'::jsonb)),
    'trickies', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'trickies') = 'array' then existing -> 'trickies' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'trickies') = 'array' then incoming -> 'trickies' end, '[]'::jsonb)),
    'ledger', jsonb_build_object(
      'purchases', public.lp_quest_union_by_id(existing #> '{ledger,purchases}', incoming #> '{ledger,purchases}')),
    'settings', chosen_settings,
    'settingsAt', greatest(existing_settings_at, incoming_settings_at),
    'checkpoint', chosen_checkpoint
  );
  return result;
end;
$$;

grant execute on function public.lp_quest_reset_id_set(jsonb, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_reset_history(jsonb, jsonb, text, text) to anon, authenticated;
grant execute on function public.lp_quest_pending_reset_ids(jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;
