import { MUSIC_PREFERENCE_VERSION, normalizeAudioPreferences } from "./audio/audioPreferences.js";
import { mergePracticeProgressValue, mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
// Pure merge rules for hydrating cloud progress into local storage.
// Kept separate from progressSync.js so it can be unit-tested without pulling in
// the Supabase client (which needs the browser/Vite env).
//
// THE RULE: a child's progress must only ever move FORWARD, except when an
// explicit newer Sound Seekers reset generation deliberately starts the whole
// journey over. Otherwise, when cloud and local disagree, we keep whichever
// represents more progress - we never let an older or emptier cloud row wipe
// out stars, completions, or words the child already earned (the cause of "my
// stars disappeared when I reloaded").

import { boundedHollowFeeds, boundedHollowPurchases, uniqueHollowRecords } from "./hollowLedgerPolicy.js";
import {
  compareQuestResetVersions,
  normalizeQuestPendingResetIds,
  normalizeQuestResetHistory,
  normalizeQuestResetId,
  normalizeQuestResetEpoch,
  normalizeQuestState
} from "./questProgress.js";
import {
  isSoundSeekersV2,
  mergeSoundSeekersStates
} from "../features/soundSeekers/engine/stateV2.js";
import { mergeElQuestProgress } from "./adventureMapProgress.js";

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

// ── Sound Seekers mastery records ────────────────────────────────────────────
// These CANNOT go through mergeMonotonic. A mastery record holds:
//   window: [1,1,0,1,...]  an ORDERED list of the last 10 results
//   state:  "learning" | "mastered" | ...
// mergeMonotonic would union the window (collapsing [1,1,0,1] to [1,0] and
// destroying the accuracy calculation) and let a string state be overwritten by
// whichever row arrived last.
//
// The rule instead: `seen` is the clock. The device that has seen the child
// answer MORE times has the more complete history, so its ordered/volatile
// fields (window, streak, misses, state, box, lastAt) are the truth. Counters
// take the max; evidence sets (shells, sessions) union — evidence gathered on
// any device is real evidence. Ties prefer cloud, as everywhere else here.
//
// This also preserves DEMOTION, which a naive forward-merge would silently undo:
// if this device watched the child miss a "mastered" sound twice today, its
// higher `seen` means the demotion sticks instead of being overwritten by a
// stale cloud row that still says "mastered".
const MASTERY_COUNTERS = ["seen", "correct"];
const MASTERY_SETS = ["shells", "sessions"];

function independentMasteryCount(record) {
  if (!record || typeof record !== "object") return 0;
  if (!Object.prototype.hasOwnProperty.call(record, "independentSeen")) {
    return Math.max(0, Number(record.seen) || 0);
  }
  const independent = Math.max(0, Number(record.independentSeen) || 0);
  return independent === 0 && (Number(record.correct) || 0) > 0
    ? Math.max(0, Number(record.seen) || Number(record.correct) || 0)
    : independent;
}

export function mergeMasteryRecord(local, cloud) {
  if (!local || typeof local !== "object") return cloud;
  if (!cloud || typeof cloud !== "object") return local;

  const localEpoch = Math.max(0, Number(local.evidenceEpoch) || 0);
  const cloudEpoch = Math.max(0, Number(cloud.evidenceEpoch) || 0);
  if (localEpoch !== cloudEpoch) {
    const authoritative = localEpoch > cloudEpoch ? local : cloud;
    return {
      ...cloud,
      ...local,
      ...authoritative,
      seen: Math.max(Number(local.seen) || 0, Number(cloud.seen) || 0),
      evidenceEpoch: Math.max(localEpoch, cloudEpoch),
      independentSeen: Math.max(0, Number(authoritative.independentSeen) || 0),
      correct: Math.max(0, Number(authoritative.correct) || 0),
      streak: Math.max(0, Number(authoritative.streak) || 0),
      window: Array.isArray(authoritative.window) ? [...authoritative.window] : [],
      shells: Array.isArray(authoritative.shells) ? [...authoritative.shells] : [],
      sessions: Array.isArray(authoritative.sessions) ? [...authoritative.sessions] : [],
      misses: Math.max(0, Number(authoritative.misses) || 0),
      box: Math.max(1, Number(authoritative.box) || 1),
      lastAt: authoritative.lastAt || "",
      lastStop: Math.max(0, Number(authoritative.lastStop) || 0)
    };
  }

  const newer = (Number(local.seen) || 0) > (Number(cloud.seen) || 0) ? local : cloud;
  const out = { ...cloud, ...local, ...newer };

  for (const key of MASTERY_COUNTERS) {
    out[key] = Math.max(Number(local[key]) || 0, Number(cloud[key]) || 0);
  }
  out.independentSeen = Math.max(independentMasteryCount(local), independentMasteryCount(cloud));
  for (const key of MASTERY_SETS) {
    out[key] = unionArrays(local[key], cloud[key]);
  }
  out.window = Array.isArray(newer.window) ? [...newer.window] : [];
  out.evidenceEpoch = localEpoch;
  out.streak = Number(newer.streak) || 0;
  out.misses = Number(newer.misses) || 0;
  out.state = newer.state;
  out.box = Number(newer.box) || 1;
  out.lastAt = newer.lastAt || "";
  out.lastStop = Math.max(Number(local.lastStop) || 0, Number(cloud.lastStop) || 0);
  return out;
}

export function mergeMasteryMap(localMap, cloudMap) {
  const out = { ...(localMap && typeof localMap === "object" ? localMap : {}) };
  if (cloudMap && typeof cloudMap === "object") {
    for (const key of Object.keys(cloudMap)) out[key] = mergeMasteryRecord(out[key], cloudMap[key]);
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

// The quest's local state contains two classes of data that are deliberately
// device-only / authority-owned. Keep the policy pure and shared so queue
// coalescing cannot reintroduce keys that questStore removed before upload.
export function sanitizeCloudProgressPayload(area, payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (["phonics_letters", "cvc"].includes(area) && (payload.v === 3 || Array.isArray(payload.completions))) {
    return mergePracticeProgressRecords(undefined, payload);
  }
  if (area === "phonics_quest") {
    const { assignment, telemetry, ...safePayload } = payload;
    void assignment;
    void telemetry;
    return safePayload;
  }
  if (area === "profile") {
    const {
      reducedChoiceMode,
      reducedChoiceModeAt,
      reducedChoiceModeBy,
      accessibilitySettings,
      accessibilitySettingsAt,
      accessibilitySettingsBy,
      ...safePayload
    } = payload;
    void reducedChoiceMode;
    void reducedChoiceModeAt;
    void reducedChoiceModeBy;
    void accessibilitySettings;
    void accessibilitySettingsAt;
    void accessibilitySettingsBy;
    return safePayload;
  }
  return payload;
}

function questResetMeta(raw) {
  const value = normalizeQuestState(raw);
  const resetId = normalizeQuestResetId(value.resetId);
  const resetHistory = normalizeQuestResetHistory(value.resetHistory, resetId);
  const resetPendingIds = normalizeQuestPendingResetIds(
    value.resetPendingIds,
    resetId,
    resetHistory,
    value.resetPending
  );
  return {
    resetId,
    resetEpoch: normalizeQuestResetEpoch(value.resetEpoch),
    resetAt: typeof value.resetAt === "string" ? value.resetAt : "",
    resetHistory,
    resetPendingIds,
    resetPending: resetPendingIds.length > 0
  };
}

function unionQuestResetIds(values) {
  return normalizeQuestResetHistory(values, "__reset-merge-sentinel__");
}

// Reset ids form a small observed ancestry graph plus an unacknowledged-op set.
// This closes the case a scalar clock cannot: stale device B can reset while
// unaware that device A already reset and progressed. Descendants settle their
// ancestors; unrelated pending operations remain in the set until the server
// acknowledges all of them, so merge order cannot silently drop a reset.
export function resolveQuestResetConflict(base, cloud) {
  const local = questResetMeta(base);
  const remote = questResetMeta(cloud);
  const combinedHistory = unionQuestResetIds([
    ...local.resetHistory,
    ...remote.resetHistory
  ]);
  const acknowledgedIds = [
    ...(local.resetPendingIds.length ? [] : [local.resetId]),
    ...(remote.resetPendingIds.length ? [] : [remote.resetId])
  ];
  const settledIds = new Set([...combinedHistory, ...acknowledgedIds]);
  const resetPendingIds = [...new Set([
    ...local.resetPendingIds,
    ...remote.resetPendingIds
  ])]
    .filter(id => !settledIds.has(id))
    .sort();

  if (resetPendingIds.length) {
    // Pending reset operations are an observed set, not a scalar winner. Keep
    // every unrelated operation until the server acknowledges the whole set;
    // selecting max(id) only chooses which reset snapshot is displayed now.
    // Set union + filtering by settled ancestry is associative, so queue order
    // cannot make a real reset disappear.
    const resetId = resetPendingIds.at(-1);
    const winner = local.resetId === resetId
      ? "base"
      : remote.resetId === resetId
        ? "cloud"
        : "fresh";
    const owner = winner === "base" ? local : winner === "cloud" ? remote : null;
    return {
      same: local.resetId === remote.resetId && local.resetId === resetId,
      winner,
      resetEpoch: owner?.resetEpoch ?? Math.max(local.resetEpoch, remote.resetEpoch),
      resetAt: owner?.resetAt ?? (local.resetAt > remote.resetAt ? local.resetAt : remote.resetAt),
      resetId,
      resetHistory: normalizeQuestResetHistory(
        [...combinedHistory, ...acknowledgedIds],
        resetId
      ),
      resetPendingIds,
      resetPending: true
    };
  }

  if (local.resetId === remote.resetId) {
    return {
      same: true,
      winner: "base",
      resetEpoch: Math.max(local.resetEpoch, remote.resetEpoch),
      resetAt: local.resetAt > remote.resetAt ? local.resetAt : remote.resetAt,
      resetId: local.resetId,
      resetHistory: normalizeQuestResetHistory(combinedHistory, local.resetId),
      resetPendingIds: [],
      resetPending: false
    };
  }

  const localDescends = local.resetHistory.includes(remote.resetId);
  const remoteDescends = remote.resetHistory.includes(local.resetId);
  let winner;
  if (localDescends !== remoteDescends) {
    winner = localDescends ? "base" : "cloud";
  } else {
    const versionOrder = compareQuestResetVersions(base, cloud);
    if (versionOrder !== 0) winner = versionOrder > 0 ? "base" : "cloud";
    else winner = local.resetId > remote.resetId ? "base" : "cloud";
  }

  const winnerMeta = winner === "base" ? local : remote;
  const loserMeta = winner === "base" ? remote : local;
  return {
    same: false,
    winner,
    resetEpoch: winnerMeta.resetEpoch,
    resetAt: winnerMeta.resetAt,
    resetId: winnerMeta.resetId,
    resetHistory: normalizeQuestResetHistory(
      [...combinedHistory, loserMeta.resetId],
      winnerMeta.resetId
    ),
    resetPendingIds: [],
    resetPending: false
  };
}

// Disk writes need reset protection and the ordinary same-generation forward
// merge, but checkpoint state is not an achievement: an explicitly cleared
// checkpoint from the current writer is meaningful and must remain cleared.
export function reconcileQuestSaveWithStored(writer, stored) {
  if (isSoundSeekersV2(writer) || isSoundSeekersV2(stored)) {
    return mergeSoundSeekersStates(writer, stored);
  }
  const local = normalizeQuestState(writer);
  const remote = normalizeQuestState(stored);
  const reset = resolveQuestResetConflict(local, remote);
  if (!reset.same) {
    return normalizeQuestState(
      computeHydratedValue("phonics_quest", "__all__", local, remote)
    );
  }
  // Same-generation writes still need the ordinary cross-tab forward merge:
  // otherwise an old tab can erase a newer teacher assignment, accessibility
  // setting, earned stop, or creature. Checkpoint is the one deliberate
  // exception: it is resume state, and an exact `null` from the current writer
  // must remain clear instead of being resurrected from disk.
  const merged = computeHydratedValue("phonics_quest", "__all__", local, remote);
  return normalizeQuestState({ ...merged, checkpoint: local.checkpoint });
}

// Decide the value to write to local storage for one hydrated cloud row.
// `existing` is the current local value for that storage key. Pure + testable.
export function computeHydratedValue(area, key, existing, payload) {
  const base = existing && typeof existing === "object" ? existing : {};

  // Transfer missions are evidence samples, not mastery. Completion and
  // evidence must union across devices, while the most recently updated
  // unfinished mission remains the resumable state.
  if (area === "transfer_missions") {
    const cloud = payload && typeof payload === "object" ? payload : {};
    const unionBy = (left, right, identity) => {
      const rows = new Map();
      for (const row of [...(left || []), ...(right || [])]) {
        if (row && identity(row)) rows.set(identity(row), row);
      }
      return [...rows.values()];
    };
    const localActiveAt = String(base.active?.updatedAt || "");
    const cloudActiveAt = String(cloud.active?.updatedAt || "");
    return {
      schemaVersion: 1,
      completed: [...new Set([...(base.completed || []), ...(cloud.completed || [])])],
      evidence: unionBy(base.evidence, cloud.evidence, row => `${row.missionId}:${row.contentVersion}`),
      offers: unionBy(base.offers, cloud.offers, row => `${row.missionId}:${row.offeredAt}`),
      active: cloudActiveAt > localActiveAt ? cloud.active : (base.active || cloud.active || null)
    };
  }

  // Per-letter mastery status: never downgrade.
  if (area === "phonics_letters" || area === "cvc") {
    if (key === "__all__") {
      const next = { ...base };
      const incoming = payload && typeof payload === "object" ? payload : {};
      for (const k of Object.keys(incoming)) {
        next[k] = mergePracticeProgressValue(base[k], incoming[k]);
      }
      return next;
    }
    return { ...base, [key]: mergePracticeProgressValue(base[key], payload) };
  }

  // Whole-payload progress maps: keep settings as cloud-canonical, but protect
  // the nested progress map so no cycle/game record is lost or downgraded.
  if (area === "el_quest") {
    return mergeElQuestProgress(base, payload);
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
      if (localRecord.practiceRecord || cloud.games?.[id]?.practiceRecord) {
        merged.practiceRecord = mergePracticeProgressRecords(localRecord.practiceRecord, cloud.games?.[id]?.practiceRecord);
      }
      if (localRecord.checkpoints) merged.checkpoints = localRecord.checkpoints;
      else delete merged.checkpoints;
      games[id] = merged;
    }
    // Do not attach a local migration marker to an old cloud music-on value.
    const musicSource = cloud.musicPreferenceVersion === MUSIC_PREFERENCE_VERSION
      ? cloud : base.musicPreferenceVersion === MUSIC_PREFERENCE_VERSION ? base : cloud;
    const { musicEnabled, musicPreferenceVersion } = normalizeAudioPreferences(musicSource);
    return { ...base, ...cloud, games, musicEnabled, musicPreferenceVersion };
  }

  // Per-item progress records: forward-merge so completed/words/scores can't regress.
  if (area === "story_quests" || area === "guided_reading") {
    return { ...base, [key]: mergeMonotonic(base[key], payload) };
  }

  // Sound Seekers. Three different merge rules in one payload, because the
  // three things it holds have three different truths:
  //
  //   mastery                       - see mergeMasteryRecord above. NOT a plain
  //       forward-merge: the ordered accuracy window and the state field need
  //       the `seen`-as-clock rule, or demotion gets silently undone.
  //   trail/stones/trickies         - ACHIEVEMENT. Forward-only, by max/union.
  //       A cloud row must never be able to un-light a stone or un-walk a stop.
  //   ledger.purchases              - SPENDING. Union by id: a purchase made on
  //       ANY device is kept (spending can never be un-spent by a stale row) and
  //       never duplicates. Sparks EARNED is derived, never stored, so there is
  //       nothing there to corrupt.
  //   creature + checkpoint         - STATE, not achievement. Last-write-wins on
  //       the creature (the child's latest choice IS the truth); a local
  //       checkpoint wins. A fresh device accepts a cloud checkpoint only when
  //       it matches the merged route cursor, so shared-iPad resume works without
  //       resurrecting a finished shell or teleporting the child mid-stop.
  if (area === "phonics_quest") {
    if (isSoundSeekersV2(base) || isSoundSeekersV2(payload)) {
      return mergeSoundSeekersStates(base, payload);
    }
    const cloud = payload && typeof payload === "object" ? payload : {};
    // Union by id, DETERMINISTICALLY ORDERED by (at, id): unionById used to
    // preserve arrival order, and prefer-unowned hatching made the child's
    // beastie collection depend on which device synced first — permanently
    // divergent collections from one shared ledger. Sorting makes every
    // device hatch the same eggs from the same history.
    const unionById = (a, b) => {
      const seen = new Set();
      const out = [];
      for (const rec of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
        const id = rec && typeof rec === "object" ? rec.id : rec;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(rec);
      }
      return out.sort((x, y) => {
        const ax = String((x && typeof x === "object" && x.at) || "");
        const ay = String((y && typeof y === "object" && y.at) || "");
        if (ax !== ay) return ax < ay ? -1 : 1;
        const ix = String((x && typeof x === "object" ? x.id : x) || "");
        const iy = String((y && typeof y === "object" ? y.id : y) || "");
        return ix < iy ? -1 : ix > iy ? 1 : 0;
      });
    };
    // Last-write-wins needs a CLOCK: "cloud || base" silently replaced a
    // fresh device's first-minute creature (or a parent's reducedMotion)
    // with the stale cloud row. Ties and legacy saves without stamps keep
    // the old cloud-wins behaviour.
    const later = (baseAt, cloudAt, baseValue, cloudValue) => {
      const b = String(baseAt || "");
      const c = String(cloudAt || "");
      if (b && (!c || b > c)) return { value: baseValue, at: b };
      return { value: cloudValue ?? baseValue, at: c || b };
    };
    const creaturePick = later(base.creatureAt, cloud.creatureAt, base.creature, cloud.creature);
    const settingsPick = later(base.settingsAt, cloud.settingsAt, base.settings, cloud.settings);
    const baseResetEpoch = normalizeQuestResetEpoch(base.resetEpoch);
    const cloudResetEpoch = normalizeQuestResetEpoch(cloud.resetEpoch);
    const reset = resolveQuestResetConflict(base, cloud);

    // A whole-adventure reset is intentionally destructive, so the normal
    // forward-only rules cannot represent it. Across different reset ids, the
    // ancestry/pending resolver chooses one owner for every resettable journey
    // field. This blocks an older tab/cloud row/queue entry from unioning the
    // pre-reset trail back in. Settings still use their own LWW clock,
    // assignments remain teacher-owned, and telemetry stays on this device.
    if (!reset.same) {
      const authoritative = reset.winner === "fresh"
        ? normalizeQuestState({
            resetEpoch: reset.resetEpoch,
            resetAt: reset.resetAt,
            resetId: reset.resetId,
            resetHistory: reset.resetHistory,
            resetPendingIds: reset.resetPendingIds,
            resetPending: reset.resetPending,
            creatureAt: reset.resetAt
          })
        : normalizeQuestState(reset.winner === "base" ? base : cloud);
      return {
        ...base,
        ...cloud,
        v: authoritative.v,
        resetEpoch: reset.resetEpoch,
        resetAt: reset.resetAt,
        resetId: reset.resetId,
        resetHistory: reset.resetHistory,
        resetPendingIds: reset.resetPendingIds,
        resetPending: reset.resetPending,
        creature: authoritative.creature,
        creatureAt: authoritative.creatureAt,
        hatched: authoritative.hatched,
        trail: authoritative.trail,
        mastery: authoritative.mastery,
        stones: authoritative.stones,
        trickies: authoritative.trickies,
        ledger: authoritative.ledger,
        settings: settingsPick.value || authoritative.settings,
        settingsAt: settingsPick.at,
        telemetry: base.telemetry || authoritative.telemetry,
        lastEarnedGearStop: null,
        checkpoint: authoritative.checkpoint
      };
    }
    const trail = mergeMonotonic(base.trail, cloud.trail) || {};
    // routeCursor is local journey position, not an achievement counter. A max
    // merge would pin a second circuit at stop 40 forever.
    const hasLocalTrailProgress = Array.isArray(base.trail?.stopsDone) && base.trail.stopsDone.length > 0;
    trail.routeCursor = hasLocalTrailProgress
      ? (Number(base.trail?.routeCursor) || Number(cloud.trail?.routeCursor) || 1)
      : (Number(cloud.trail?.routeCursor) || Number(base.trail?.routeCursor) || 1);
    const localCheckpoint = base.checkpoint && typeof base.checkpoint === "object" ? base.checkpoint : null;
    const cloudCheckpoint = cloud.checkpoint && typeof cloud.checkpoint === "object" ? cloud.checkpoint : null;
    const resumableCloudCheckpoint = cloudCheckpoint?.stopId === `s${trail.routeCursor}`
      ? cloudCheckpoint
      : null;
    return {
      ...base,
      ...cloud,
      resetEpoch: Math.max(baseResetEpoch, cloudResetEpoch),
      resetAt: String(base.resetAt || "") > String(cloud.resetAt || "")
        ? String(base.resetAt || "")
        : String(cloud.resetAt || ""),
      resetId: reset.resetId,
      resetHistory: reset.resetHistory,
      resetPendingIds: reset.resetPendingIds,
      resetPending: reset.resetPending,
      creature: creaturePick.value || base.creature,
      creatureAt: creaturePick.at,
      hatched: Boolean(base.hatched) || Boolean(cloud.hatched),
      trail,
      mastery: mergeMasteryMap(base.mastery, cloud.mastery),
      stones: mergeMonotonic(base.stones, cloud.stones),
      trickies: mergeMonotonic(base.trickies, cloud.trickies),
      ledger: { purchases: unionById(base.ledger?.purchases, cloud.ledger?.purchases) },
      settings: settingsPick.value || base.settings,
      settingsAt: settingsPick.at,
      telemetry: {
        // Bounded: merged histories must respect the same cap the telemetry
        // module enforces (questTelemetry MAX_SESSION_HISTORY = 80), or
        // year-two save files grow without limit.
        sessions: unionById(base.telemetry?.sessions, cloud.telemetry?.sessions).slice(-80),
        current: base.telemetry?.current || null
      },
      checkpoint: localCheckpoint || resumableCloudCheckpoint
    };
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
      purchases: boundedHollowPurchases(unionById(base.purchases, cloud.purchases)),
      feeds: boundedHollowFeeds(unionById(base.feeds, cloud.feeds)),
      chests: uniqueHollowRecords(unionById(base.chests, cloud.chests)),
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
