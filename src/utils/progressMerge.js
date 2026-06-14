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
    return { ...base, ...cloud, games: mergeRecordMap(base.games, cloud.games) };
  }

  // Per-item progress records: forward-merge so completed/words/scores can't regress.
  if (area === "story_quests" || area === "guided_reading") {
    return { ...base, [key]: mergeMonotonic(base[key], payload) };
  }

  // daily_mission, profile, and any future area: cloud is the latest canonical state.
  return key === "__all__"
    ? mergePayload(base, payload)
    : { ...base, [key]: mergePayload(base[key], payload) };
}
