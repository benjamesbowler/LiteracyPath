// SOUND SEEKERS — the save file. PURE STATE TRANSITIONS ONLY.
//
// No localStorage, no Supabase, no imports that touch either — that lives in
// questStore.js. This split is not cosmetic: progressSync.js pulls in
// supabaseClient.js, which reads `import.meta.env`, which Node cannot evaluate.
// Import it here and every unit test in this file dies before its first
// assertion. (This repo already learned that lesson once — see the header of
// progressKeys.js, split from progressSync.js for exactly this reason.)
//
// THREE RULES, all inherited from what this app already does, none negotiable:
//
//   1. REWARDS ARE DERIVED, NEVER STORED. Sparks earned is a pure function of
//      the stars the child has won. Normal play stores only what they SPENT;
//      economy-v1 saves also receive one-time zero-cost starter entitlements.
//      (docs/IMPROVEMENT_LOOPS.md rule #7.) A sync race can therefore never
//      delete a child's gear, and a teacher reset wipes cleanly.
//
//   2. FORWARD-ONLY WITH ONE EXPLICIT EXCEPTION. Normal cloud merges can add;
//      they can never take away. A whole-adventure reset issues a unique
//      resetId with observed resetHistory so that deliberate wipe outranks
//      older progress even across stale offline devices. See progressMerge.js.
//
//   3. THE CHECKPOINT IS NOT ACHIEVEMENT. It is resume state: a local checkpoint
//      wins, while a fresh device may restore the cloud checkpoint only when it
//      matches the merged current stop. Blindly forward-merging two devices'
//      checkpoints would teleport a child mid-stop. It is written while walking,
//      after every encounter, and on every exit: losing a few seconds is a shrug;
//      losing a long trail section is a child who never comes back.

import { normalizeCreature, defaultCreature, CREATURE_GEAR, CREATURE_DYES, CREATURE_SLOTS, ALL_PIECES } from "../data/creatureParts.js";
import { emptyRecord, recordAttempt, MASTERY_STATES, MASTERY_RULES, BLEND_RULES, HEART_RULES } from "./questMastery.js";
import { boxAfterStop } from "./questReviewScheduler.js";
import { QUEST_STOPS, getStop, blendsThrough } from "../data/questSequence.js";
import { QUEST_CHAPTERS, chapterForStop } from "../data/questChapters.js";
import { seedwakeSatchel } from "../data/questChapterOne.js";
import { normalizeQuestSettings } from "./questPerformance.js";
import { normalizeQuestTelemetry } from "./questTelemetry.js";

// A blend is not a grapheme and cannot be mastered on a grapheme's bar — see the
// note on BLEND_RULES. Computed once: the trail is static.
const ALL_BLENDS = blendsThrough(QUEST_STOPS.length);

// Which targets are real GRAPHEMES — the only things we ever claim as learnt.
// Everything else (blends, morphology, alternative pronunciations, heart words)
// is taught and practised, and honestly not claimed.
const GRAPHEME_TARGETS = new Set(
  QUEST_STOPS.flatMap(s => s.teach.filter(e => !["blend", "morph", "alt"].includes(e.kind)).map(e => e.id))
);

export function isGraphemeTarget(target) {
  return GRAPHEME_TARGETS.has(target);
}

const KNOWN_STOP_IDS = new Set(QUEST_STOPS.map(stop => stop.id));
const ALL_HEART_WORDS = new Set(QUEST_STOPS.flatMap(stop => stop.heartWords || []));
const STAR_MAX = 3;
const DROP_MAX = 40;
const MAX_RESET_EPOCH = Number.MAX_SAFE_INTEGER;
export const LEGACY_QUEST_RESET_ID = "legacy";
export const REWARD_ECONOMY_VERSION = 2;

// These choices were part of the original zero-cost starter wardrobe. They are
// the only paid pieces an old save may own without a purchase record.
const GRANDFATHERED_STARTER_IDS = new Set([
  "slate", "sand", "pebble",
  "eyes-sleepy", "eyes-wide", "eyes-tiny",
  "mouth-tusks", "mouth-beak", "mouth-round",
  "crest-antenna", "crest-fin", "crest-ears",
  "tail-fan", "tail-spade", "tail-tuft",
  "feet-hoofs", "feet-round", "pattern-stripes"
]);

function migrateLegacyStarterEntitlements(state) {
  const purchases = Array.isArray(state.ledger?.purchases) ? state.ledger.purchases : [];
  if (Number(state.rewardEconomyVersion) >= REWARD_ECONOMY_VERSION || Number(state.v) !== 1) {
    return purchases;
  }

  // In economy v1 every zero-cost choice was already available to every child,
  // even though those entitlements were never written to the ledger. Record
  // them once as zero-cost grants so changing outfits, syncing devices, or
  // reloading cannot make an old child's options disappear.
  const ownedIds = new Set(purchases.map(record => record?.id).filter(Boolean));
  return [
    ...purchases,
    ...[...GRANDFATHERED_STARTER_IDS]
      .filter(id => !ownedIds.has(id))
      .map(id => ({ id, cost: 0, source: "legacy_starter_v1" }))
  ];
}

export function normalizeQuestResetId(value) {
  const id = typeof value === "string" ? value.trim().slice(0, 160) : "";
  return id || LEGACY_QUEST_RESET_ID;
}

export function normalizeQuestResetHistory(value, currentId = LEGACY_QUEST_RESET_ID) {
  const activeId = normalizeQuestResetId(currentId);
  const history = Array.isArray(value) ? value : [];
  return [...new Set(history
    .map(normalizeQuestResetId)
    .filter(id => id && id !== activeId))]
    .sort();
}

export function normalizeQuestPendingResetIds(
  value,
  currentId = LEGACY_QUEST_RESET_ID,
  resetHistory = [],
  legacyPending = false
) {
  const activeId = normalizeQuestResetId(currentId);
  const settled = new Set(normalizeQuestResetHistory(resetHistory, activeId));
  const raw = Array.isArray(value) ? [...value] : [];
  if (legacyPending) raw.push(activeId);
  return [...new Set(raw
    .map(normalizeQuestResetId)
    .filter(id => id && !settled.has(id)))]
    .sort();
}

// Starting the whole adventure again is the one legitimate backwards move in
// Sound Seekers. The scalar generation is useful metadata; unique reset ids,
// observed ancestry and the pending-id set are the authority when stale
// offline devices disagree. Legacy saves are generation zero under `legacy`.
export function normalizeQuestResetEpoch(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(MAX_RESET_EPOCH, Math.floor(numeric)));
}

export function compareQuestResetVersions(left, right) {
  const leftEpoch = normalizeQuestResetEpoch(left?.resetEpoch);
  const rightEpoch = normalizeQuestResetEpoch(right?.resetEpoch);
  if (leftEpoch !== rightEpoch) return leftEpoch > rightEpoch ? 1 : -1;
  const leftAt = typeof left?.resetAt === "string" ? left.resetAt : "";
  const rightAt = typeof right?.resetAt === "string" ? right.resetAt : "";
  if (leftAt === rightAt) return 0;
  return leftAt > rightAt ? 1 : -1;
}

// Whitelist an id→number map to known stop ids and clamp the values. The
// derived economy trusts these numbers absolutely, so a tampered or corrupted
// save (stars: { s1: 9999 }) must be neutralised at the door, not honoured.
function clampStopNumbers(raw, max) {
  const out = {};
  for (const [stopId, value] of Object.entries(raw && typeof raw === "object" ? raw : {})) {
    if (!KNOWN_STOP_IDS.has(stopId)) continue;
    const n = Math.floor(Number(value) || 0);
    if (n <= 0) continue;
    out[stopId] = Math.min(max, n);
  }
  return out;
}

// A teacher-set practice assignment is data the CHILD's client must carry but
// never invent: validate shape hard, and normalizeQuestState owns the field
// so `...state` spreads can't be the only thing keeping it alive.
function normalizeAssignment(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.targets)) return null;
  const targets = raw.targets.map(t => String(t || "").trim()).filter(Boolean).slice(0, 6);
  if (!targets.length) return null;
  return {
    targets,
    note: typeof raw.note === "string" ? raw.note.slice(0, 120) : "",
    assignedAt: typeof raw.assignedAt === "string" ? raw.assignedAt : "",
    by: typeof raw.by === "string" ? raw.by : "teacher"
  };
}

export const SPARKS_PER_STAR = 12;
export const SPARKS_PER_DROP = 2;
export const SPARKS_PER_STRONG_CHAPTER = 4;

function strongChapterCount(state) {
  const stars = state?.trail?.stars || {};
  return QUEST_CHAPTERS.filter(chapter => (
    chapter.stopIds.every(stopId => (state?.trail?.stopsDone || []).includes(stopId))
    && chapter.stopIds.reduce((sum, stopId) => sum + (Number(stars[stopId]) || 0), 0) >= 12
  )).length;
}

export function baseQuestState() {
  return {
    v: 1,
    rewardEconomyVersion: REWARD_ECONOMY_VERSION,
    resetEpoch: 0,
    resetAt: "",
    resetId: LEGACY_QUEST_RESET_ID,
    resetHistory: [],
    resetPendingIds: [],
    resetPending: false,
    creature: defaultCreature(),
    // Last-write-wins clocks for the two cloud-wins-without-a-clock fields:
    // a child who hatches on a fresh device in the first minute must not have
    // their creature (or a parent's reducedMotion) replaced by a stale cloud
    // row. Stamped at the write sites; the merge picks the later side.
    creatureAt: "",
    settingsAt: "",
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    trickies: [],
    ledger: { purchases: [] },
    assignment: null,
    settings: normalizeQuestSettings(),
    telemetry: normalizeQuestTelemetry(),
    // One-render event used by RewardScreen; normalization deliberately clears
    // it so replay/reload can never re-announce an old gear award.
    lastEarnedGearStop: null,
    checkpoint: null
  };
}

// Every load goes through this, so a save file written by an older build (or
// half-merged from the cloud) can never crash the game — worst case a child
// gets a default part back, not a white screen.
export function normalizeQuestState(raw) {
  const base = baseQuestState();
  const state = raw && typeof raw === "object" ? raw : {};
  const resetId = normalizeQuestResetId(state.resetId);
  const resetHistory = normalizeQuestResetHistory(state.resetHistory, resetId);
  const resetPendingIds = normalizeQuestPendingResetIds(
    state.resetPendingIds,
    resetId,
    resetHistory,
    Boolean(state.resetPending)
  );
  return {
    ...base,
    ...state,
    v: 1,
    rewardEconomyVersion: REWARD_ECONOMY_VERSION,
    resetEpoch: normalizeQuestResetEpoch(state.resetEpoch),
    resetAt: typeof state.resetAt === "string" ? state.resetAt : "",
    resetId,
    resetHistory,
    resetPendingIds,
    resetPending: resetPendingIds.length > 0,
    creature: normalizeCreature(state.creature),
    creatureAt: typeof state.creatureAt === "string" ? state.creatureAt : "",
    settingsAt: typeof state.settingsAt === "string" ? state.settingsAt : "",
    hatched: Boolean(state.hatched),
    trail: {
      stopsDone: Array.isArray(state.trail?.stopsDone)
        ? [...new Set(state.trail.stopsDone.filter(id => KNOWN_STOP_IDS.has(id)))]
        : [],
      stars: clampStopNumbers(state.trail?.stars, STAR_MAX),
      drops: clampStopNumbers(state.trail?.drops, DROP_MAX),
      routeCursor: Math.max(1, Math.min(QUEST_STOPS.length, Math.floor(Number(state.trail?.routeCursor) || 1)))
    },
    mastery: state.mastery && typeof state.mastery === "object" ? { ...state.mastery } : {},
    // Stones only for claimable graphemes; Trickies only for real heart words.
    stones: Array.isArray(state.stones)
      ? [...new Set(state.stones.filter(isGraphemeTarget))]
      : [],
    trickies: Array.isArray(state.trickies)
      ? [...new Set(state.trickies.filter(word => ALL_HEART_WORDS.has(word)))]
      : [],
    ledger: { purchases: migrateLegacyStarterEntitlements(state) },
    assignment: normalizeAssignment(state.assignment),
    settings: normalizeQuestSettings(state.settings),
    telemetry: normalizeQuestTelemetry(state.telemetry),
    lastEarnedGearStop: null,
    checkpoint: state.checkpoint && typeof state.checkpoint === "object" ? state.checkpoint : null
  };
}

export function restartQuestProgress(raw, { at = "", resetId: requestedResetId = "" } = {}) {
  const current = normalizeQuestState(raw);
  const resetAt = typeof at === "string" ? at : "";
  const issuedAt = Date.parse(resetAt);
  const issuedEpoch = Number.isFinite(issuedAt)
    ? normalizeQuestResetEpoch(issuedAt)
    : 0;
  const normalizedRequestedId = normalizeQuestResetId(requestedResetId);
  const resetId = normalizedRequestedId !== LEGACY_QUEST_RESET_ID
    && normalizedRequestedId !== current.resetId
    ? normalizedRequestedId
    : `reset-${issuedEpoch}-${Math.min(MAX_RESET_EPOCH, current.resetEpoch + 1)}`;
  return {
    ...baseQuestState(),
    // A plain N+1 counter collides when two stale offline devices both reset.
    // Wall-clock milliseconds make those independently issued generations
    // comparable; current+1 keeps the value monotonic if the clock moves back.
    resetEpoch: Math.min(MAX_RESET_EPOCH, Math.max(current.resetEpoch + 1, issuedEpoch)),
    // Retain the issuing time as a deterministic tie-break for equal counters.
    resetAt,
    resetId,
    resetHistory: normalizeQuestResetHistory(
      [...current.resetHistory, current.resetId, ...current.resetPendingIds],
      resetId
    ),
    resetPendingIds: [resetId],
    // The server clears this after accepting the reset operation. Until then,
    // an unknown reset id must beat a concurrent generation from a stale peer.
    resetPending: true,
    // Comfort settings belong to the child/device, not to one journey.
    settings: current.settings,
    settingsAt: current.settingsAt,
    assignment: current.assignment,
    creatureAt: resetAt
  };
}

// ── The trail ───────────────────────────────────────────────────────────────

// Which stop is next. Stops unlock in order; the child is never blocked by
// mastery, only by not having WALKED there yet.
export function currentStopIndex(state) {
  const done = new Set(state?.trail?.stopsDone || []);
  const next = QUEST_STOPS.find(stop => !done.has(stop.id));
  return next ? next.index : QUEST_STOPS.length;
}

export function isStopUnlocked(state, stopId) {
  const stop = getStop(stopId);
  if (!stop) return false;
  return stop.index <= currentStopIndex(state);
}

// ── Rewards: DERIVED. Read this, do not store it. ───────────────────────────
export function totalStars(state) {
  return Object.values(state?.trail?.stars || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

// Sun-drops are the things you pick up WHILE WALKING. They exist so the path is
// never empty — a walk with nothing on it is just a loading screen with grass.
// They pay out, so walking is worth something on its own and not merely the gap
// between questions.
export function totalDrops(state) {
  return Object.values(state?.trail?.drops || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function earnedSparks(state) {
  // A strong whole chapter earns a tiny completion bonus. Eight strong chapters
  // make the full wardrobe attainable by a narrow margin, while walking and
  // collecting finds without reading-quality stars earns no hidden bonus.
  return totalStars(state) * SPARKS_PER_STAR
    + totalDrops(state) * SPARKS_PER_DROP
    + strongChapterCount(state) * SPARKS_PER_STRONG_CHAPTER;
}

export function spentSparks(state) {
  return (state?.ledger?.purchases || []).reduce((sum, p) => sum + (Number(p?.cost) || 0), 0);
}

export function availableSparks(state) {
  return Math.max(0, earnedSparks(state) - spentSparks(state));
}

export function chapterRewardForStop(stopOrId) {
  const chapter = chapterForStop(stopOrId);
  const stopId = typeof stopOrId === "object" ? stopOrId?.id : String(stopOrId || "");
  if (!chapter || chapter.stopIds.at(-1) !== stopId) return null;
  return {
    ...chapter.chapterReward,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    destination: chapter.destination,
    objective: chapter.objective,
    finale: chapter.finale,
    stopIds: [...chapter.stopIds],
    cast: [chapter.cast.guide, ...chapter.cast.residents]
  };
}

export function unlockedChapterRewards(state) {
  const done = new Set(state?.trail?.stopsDone || []);
  return QUEST_CHAPTERS
    .filter(chapter => done.has(chapter.stopIds.at(-1)))
    .map(chapter => ({
      ...chapter.chapterReward,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      destination: chapter.destination,
      objective: chapter.objective,
      finale: chapter.finale,
      stopIds: [...chapter.stopIds],
      cast: [chapter.cast.guide, ...chapter.cast.residents]
    }));
}

export function questRewardBonuses(state) {
  const rewardIds = unlockedChapterRewards(state).map(reward => reward.id);
  const unlocked = new Set(rewardIds);
  const seedwakeCaches = seedwakeSatchel(state).cacheCount;
  return {
    rewardIds,
    collectionRadius: 0.72 + (unlocked.has("seedwake-lantern") ? 0.34 : 0),
    branchCacheCount: seedwakeCaches + (unlocked.has("river-whistle") ? 2 : 0) + (unlocked.has("lantern-map") ? 1 : 0),
    projectionDistance: unlocked.has("fossil-compass") ? 56 : 35,
    repairAura: unlocked.has("forge-tool"),
    pathGlow: unlocked.has("mirror-reed"),
    interactionRadius: 0.82 + (unlocked.has("storm-lens") ? 0.28 : 0),
    routeFocusDistance: unlocked.has("lantern-map") ? 22 : 14,
    worldLight: unlocked.has("first-reading-star")
  };
}

export function ownedPieces(state) {
  const owned = new Set();
  for (const piece of ALL_PIECES) {
    if ((piece.cost || 0) === 0 && !piece.unlock) owned.add(piece.id);
  }
  for (const dye of CREATURE_DYES) {
    if ((dye.cost || 0) === 0) owned.add(dye.id);
  }
  // Gear is GIVEN by walking the trail, not bought.
  const done = new Set(state?.trail?.stopsDone || []);
  for (const gear of CREATURE_GEAR) {
    if (gear.unlock && done.has(gear.unlock)) owned.add(gear.id);
  }
  for (const purchase of state?.ledger?.purchases || []) {
    if (purchase?.id) owned.add(purchase.id);
  }
  return owned;
}

export function canBuy(state, piece) {
  if (!piece) return false;
  if (ownedPieces(state).has(piece.id)) return false;
  return availableSparks(state) >= (piece.cost || 0);
}

export function equipEarnedQuestGear(state, stopId) {
  const gear = CREATURE_GEAR.find(piece => piece.unlock === stopId);
  if (!gear) return state;
  const creature = normalizeCreature(state?.creature);
  if (creature.equipped?.[gear.slot] === gear.id) return state;
  return {
    ...state,
    creature: {
      ...creature,
      equipped: { ...creature.equipped, [gear.slot]: gear.id }
    }
  };
}

export function earnedGearReward(state, stopId) {
  if (state?.lastEarnedGearStop !== stopId) return null;
  const gear = CREATURE_GEAR.find(piece => piece.unlock === stopId);
  if (!gear) return null;
  return {
    id: gear.id,
    slot: gear.slot,
    equipped: normalizeCreature(state?.creature).equipped?.[gear.slot] === gear.id
  };
}

export function recordPurchase(state, piece, at = new Date().toISOString()) {
  if (!canBuy(state, piece)) return state;
  return {
    ...state,
    ledger: { purchases: [...(state.ledger?.purchases || []), { id: piece.id, cost: piece.cost || 0, at }] }
  };
}

export function recordPurchaseAndEquip(state, piece, at = new Date().toISOString()) {
  const purchased = recordPurchase(state, piece, at);
  if (purchased === state) return state;

  return equipOwnedPiece(purchased, piece);
}

export function equipOwnedPiece(state, piece) {
  if (!piece || !ownedPieces(state).has(piece.id)) return state;

  const creature = normalizeCreature(state?.creature);
  if (piece.slot === "colour") creature.dye = piece.id;
  else if (piece.slot === "body") creature.body = piece.id;
  else if (CREATURE_SLOTS.some(slot => slot.kind === "part" && slot.id === piece.slot)) {
    creature[piece.slot] = piece.id;
  } else if (CREATURE_SLOTS.some(slot => slot.kind === "gear" && slot.id === piece.slot)) {
    creature.equipped = { ...creature.equipped, [piece.slot]: piece.id };
  } else {
    return state;
  }

  return { ...state, creature: normalizeCreature(creature) };
}

function unequipQuestGear(state, slot) { // eslint-disable-line no-unused-vars -- kept: inverse of equip, documented API shape
  if (!CREATURE_SLOTS.some(entry => entry.kind === "gear" && entry.id === slot)) return state;
  const creature = normalizeCreature(state?.creature);
  if (!creature.equipped?.[slot]) return state;
  return {
    ...state,
    creature: normalizeCreature({
      ...creature,
      equipped: { ...creature.equipped, [slot]: null }
    })
  };
}

// ── Mastery + stones ────────────────────────────────────────────────────────

// One response, from one shell. This is the ONLY way mastery ever changes.
export function recordQuestAttempt(state, { target, correct, shell, stopIndex = 0, at = new Date().toISOString(), promptLevel = 0, reason = "" }) {
  if (!target) return state;
  const prev = state.mastery?.[target] || emptyRecord();
  // hw: and sign: are one-shell namespaces - the general minShells:2 bar
  // would leave them permanently "needs re-teaching" on teacher screens.
  const rules = String(target).startsWith("hw:") || String(target).startsWith("sign:")
    ? HEART_RULES
    : ALL_BLENDS.has(target) ? BLEND_RULES : MASTERY_RULES;
  const next = recordAttempt(prev, { correct, shell, at, stopIndex, rules, promptLevel, reason });
  return { ...state, mastery: { ...state.mastery, [target]: next } };
}

// Finish a stop: bank the stars, light the stones, keep the heart words, update
// the review boxes, drop the gear, clear the checkpoint.
//
// NOTE what is NOT here: nothing checks mastery before advancing. That is the
// point. The story never waits.
export function recordStopResult(state, stopId, stars = 0, drops = 0) {
  const stop = getStop(stopId);
  if (!stop) return state;

  const completedBefore = (state.trail?.stopsDone || []).includes(stopId);
  const stopsDone = [...new Set([...(state.trail?.stopsDone || []), stopId])];
  const prevStars = Number(state.trail?.stars?.[stopId]) || 0;
  const prevDrops = Number(state.trail?.drops?.[stopId]) || 0;

  // Update the review BOX for every sound — but NOT `lastStop`.
  //
  // This used to stamp `lastStop: stop.index` onto every record, practised or
  // not. That quietly destroyed the review scheduler: `lastStop` is what "how
  // long since the child last saw this sound" is measured from, so stamping it
  // everywhere made every gap equal 1, every recency score equal 0, and every
  // weight a tie — leaving the review queue to fall back on its tiebreaker and
  // serve the child the ALPHABETICALLY FIRST four sounds, forever. Spaced
  // repetition that isn't spaced, and everything would have looked fine.
  //
  // `lastStop` is now written in recordAttempt, where a sound is actually
  // practised, and nowhere else.
  const mastery = { ...state.mastery };
  for (const target of Object.keys(mastery)) {
    mastery[target] = { ...mastery[target], box: boxAfterStop(mastery[target]) };
  }

  // A stone lights up when its SOUND is MASTERED — not when the stop is passed.
  // This is the one place the two tracks are visible side by side, and it is
  // the honest signal: you walked here, but you don't own this sound yet.
  //
  // Heart words ("hw:the") are mastery targets too, but they are NOT sounds, and
  // the wall is a wall of sounds. They live on the Trickies shelf instead.
  //
  // Nor are blends ("st"), morphology ("suffix_ing") or alternative pronunciations
  // ("oo_short"). All three are taught and practised, but the game cannot produce
  // two-different-kinds-of-evidence for any of them without turning back into a
  // quiz — so we do not CLAIM them. Only real graphemes become stones. A claim you
  // can't back is worse than no claim.
  const stones = [...new Set([
    ...(state.stones || []),
    ...Object.keys(mastery).filter(t =>
      isGraphemeTarget(t)
      && (mastery[t].state === MASTERY_STATES.MASTERED || mastery[t].state === MASTERY_STATES.RETIRED))
  ])];

  const next = {
    ...state,
    lastEarnedGearStop: null,
    trail: {
      ...state.trail,
      stopsDone,
      stars: { ...(state.trail?.stars || {}), [stopId]: Math.max(prevStars, stars) },
      drops: { ...(state.trail?.drops || {}), [stopId]: Math.max(prevDrops, drops) },
      // After the first 40-stop journey, continue through the same curriculum as
      // an adaptive review circuit instead of trapping the child at stop 40.
      // ADVANCE-ONLY: the cursor moves only when the child completes the stop
      // it points at. Replaying s5 for fun while the cursor sits at s30 must
      // never teleport "Continue" back to s6.
      routeCursor: stop.index === (Number(state.trail?.routeCursor) || 1)
        ? (stop.index % QUEST_STOPS.length) + 1
        : (Number(state.trail?.routeCursor) || 1)
    },
    mastery,
    stones,
    // A Trickie joins the party when the child has actually fed it — at least
    // one correct heart-word answer on record — not merely for walking past.
    // The fiction says "feed it three times and it JOINS you"; the save file
    // should tell the same story.
    trickies: [...new Set([
      ...(state.trickies || []),
      ...(stop.heartWords || []).filter(word => (Number(mastery[`hw:${word}`]?.correct) || 0) > 0)
    ])],
    checkpoint: null
  };
  if (completedBefore) return next;
  const gear = CREATURE_GEAR.find(piece => piece.unlock === stopId);
  if (!gear) return next;
  return { ...equipEarnedQuestGear(next, stopId), lastEarnedGearStop: stopId };
}

// ── Checkpoint: resume state, written throughout the journey ────────────────
export function saveQuestCheckpoint(state, checkpoint) {
  return { ...state, checkpoint: checkpoint ? { ...checkpoint, at: new Date().toISOString() } : null };
}

export function readQuestCheckpoint(state) {
  return state?.checkpoint || null;
}

export function clearQuestCheckpoint(state) {
  return { ...state, checkpoint: null };
}
