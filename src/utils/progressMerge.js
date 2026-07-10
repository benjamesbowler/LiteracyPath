// Pure, import-free merge rules for hydrating cloud progress into local storage.
// Kept separate from progressSync.js so it can be unit-tested without pulling in
// the Supabase client (which needs the browser/Vite env).
//
// THE RULE: a child's progress must only ever move FORWARD. When cloud and local
// disagree, we keep whichever represents more progress - we never let an older or
// emptier cloud row wipe out stars, completions, or words the child already earned
// (the cause of "my stars disappeared when I reloaded").

// ── Scalar status (phonics letters, cvc) ─────────────────────────────────────
const STATUS_RANK = { default: 0, locked: 1, inprogress: 2, completed: 3 };

// Cloud payloads sometimes arrive as { status } objects or as a stringified map
// of indices; recover the plain status string.
export function normalizeScalarProgressPayload(payload) {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object") {
    if (typeof payload.status === "string") return payload.status;
    const recovered = Object.keys(payload)
      .filter(key => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b))
      .map(key => payload[key])
      .join("");
    return recovered || payload;
  }
  return payload;
}

// Never downgrade earned status; on a tie or unknown value prefer cloud (canonical).
export function mergeStatusForward(localStatus, cloudStatus) {
  const l = STATUS_RANK[localStatus] ?? -1;
  const c = STATUS_RANK[cloudStatus] ?? -1;
  return l > c ? localStatus : cloudStatus;
}

// ── Generic forward merge ────────────────────────────────────────────────────
function unionArrays(a, b) {
  const seen = new Set();
  const out = [];
  for (const item of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
    const sig = item && typeof item === "object" ? JSON.stringify(item) : `${typeof item}:${item}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(item);
  }
  return out;
}

// Non-destructive deep merge: numbers take the MAX (best score/most stars),
// booleans OR together (an earned `completed:true` is never un-earned), arrays
// union (every word found on any device is kept), objects merge key-by-key.
// Anything else (strings like timestamps / lastPageId) prefers the cloud value.
export function mergeMonotonic(local, cloud) {
  if (local === undefined || local === null) return cloud;
  if (cloud === undefined || cloud === null) return local;
  if (typeof local === "number" && typeof cloud === "number") return Math.max(local, cloud);
  if (typeof local === "boolean" && typeof cloud === "boolean") return local || cloud;
  if (Array.isArray(local) || Array.isArray(cloud)) return unionArrays(local, cloud);
  if (typeof local === "object" && typeof cloud === "object") {
    const out = { ...local };
    for (const key of Object.keys(cloud)) out[key] = mergeMonotonic(local[key], cloud[key]);
    return out;
  }
  return cloud;
}

// Merge a map of progress records (el_quest `cycles`, learn_games `games`)
// without dropping a record or downgrading one.
export function mergeRecordMap(localMap, cloudMap) {
  const out = { ...(localMap && typeof localMap === "object" ? localMap : {}) };
  if (cloudMap && typeof cloudMap === "object") {
    for (const key of Object.keys(cloudMap)) out[key] = mergeMonotonic(out[key], cloudMap[key]);
  }
  return out;
}

// Shallow cloud-wins merge - used only for last-write-wins areas (daily_mission,
// profile) where "latest state" is correct and a forward-merge would be wrong
// (e.g. a streak that legitimately reset must not be inflated back up).
export function mergePayload(current, incoming) {
  if (!current || typeof current !== "object") return incoming;
  if (!incoming || typeof incoming !== "object") return current;
  if (Array.isArray(current) || Array.isArray(incoming)) return incoming;
  return { ...current, ...incoming };
}

// Decide the value to write to local storage for one hydrated cloud row.
// `existing` is the current local value for that storage key. Pure + testable.
export function computeHydratedValue(area, key, existing, payload) {
  const base = existing && typeof existing === "object" ? existing : {};

  // Per-letter mastery status: never downgrade.
  if (area === "phonics_letters" || area === "cvc") {
    if (key === "__all__") {
      const next = { ...base };
      const incoming = payload && typeof payload === "object" ? payload : {};
      for (const k of Object.keys(incoming)) {
        next[k] = mergeStatusForward(base[k], normalizeScalarProgressPayload(incoming[k]));
      }
      return next;
    }
    return { ...base, [key]: mergeStatusForward(base[key], normalizeScalarProgressPayload(payload)) };
  }

  // Whole-payload progress maps: keep settings as cloud-canonical, but protect
  // the nested progress map so no cycle/game record is lost or downgraded.
  if (area === "el_quest") {
    const cloud = payload && typeof payload === "object" ? payload : {};
    return { ...base, ...cloud, cycles: mergeRecordMap(base.cycles, cloud.cycles) };
  }
  if (area === "learn_games") {
    const cloud = payload && typeof payload === "object" ? payload : {};
    const games = mergeRecordMap(base.games, cloud.games);
    // Checkpoints are RESUME state, not achievement: forward-merging them by
    // max resurrects checkpoints the child already finished or restarted.
    // This device's record owns its own resume state; cloud checkpoints
    // apply only to games this device has never played.
    const localGames = base.games && typeof base.games === "object" ? base.games : {};
    for (const id of Object.keys(games)) {
      const localRecord = localGames[id];
      if (!localRecord) continue;
      const merged = { ...games[id] };
      if (localRecord.checkpoints) merged.checkpoints = localRecord.checkpoints;
      else delete merged.checkpoints;
      games[id] = merged;
    }
    return { ...base, ...cloud, games };
  }

  // Per-item progress records: forward-merge so completed/words/scores can't regress.
  if (area === "story_quests" || area === "guided_reading") {
    return { ...base, [key]: mergeMonotonic(base[key], payload) };
  }

  // The Hollow ledger: purchases/feeds/chests are append-only records that
  // union by id (a purchase made on ANY device is kept - spending can never
  // be un-spent by a stale row, and never duplicates). The layout is
  // last-write-wins on its `at` timestamp.
  if (area === "hollow") {
    const cloud = payload && typeof payload === "object" ? payload : {};
    const unionById = (a, b) => {
      const seen = new Set();
      const out = [];
      for (const rec of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
        const id = rec && typeof rec === "object" ? rec.id : rec;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(rec);
      }
      return out;
    };
    const localLayout = base.layout && typeof base.layout === "object" ? base.layout : { at: "" };
    const cloudLayout = cloud.layout && typeof cloud.layout === "object" ? cloud.layout : { at: "" };
    return {
      purchases: unionById(base.purchases, cloud.purchases),
      feeds: unionById(base.feeds, cloud.feeds),
      chests: unionById(base.chests, cloud.chests),
      layout: (localLayout.at || "") > (cloudLayout.at || "") ? localLayout : cloudLayout
    };
  }

  // The Daily Mission is DAY-aware, never blindly cloud-wins. A stale cloud
  // row (yesterday's, or one whose debounced write never landed before the
  // app closed) must not un-finish today's tasks and re-lock the arcade.
  //   - same day on both sides: union the done flags, keep the best streak
  //   - different days: whichever side holds the NEWER day wins outright
  if (area === "daily_mission") {
    const cloud = payload && typeof payload === "object" ? payload : {};
    const localDay = typeof base.day === "string" ? base.day : "";
    const cloudDay = typeof cloud.day === "string" ? cloud.day : "";
    if (localDay && localDay === cloudDay) {
      const laterMeta = (cloud.lastCompletedDay || "") > (base.lastCompletedDay || "") ? cloud : base;
      return {
        ...cloud,
        ...base,
        done: { ...(cloud.done || {}), ...(base.done || {}) },
        streak: Math.max(Number(base.streak) || 0, Number(cloud.streak) || 0),
        lastCompletedDay: laterMeta.lastCompletedDay || "",
        shieldWeek: laterMeta.shieldWeek || "",
        celebratedDay: (base.celebratedDay || "") > (cloud.celebratedDay || "")
          ? base.celebratedDay
          : (cloud.celebratedDay || "")
      };
    }
    return cloudDay > localDay ? cloud : base;
  }

  // profile and any future area: cloud is the latest canonical state.
  return key === "__all__"
    ? mergePayload(base, payload)
    : { ...base, [key]: mergePayload(base[key], payload) };
}
