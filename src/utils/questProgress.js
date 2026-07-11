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
//      the stars the child has won. The only thing we STORE is what they SPENT.
//      (docs/IMPROVEMENT_LOOPS.md rule #7.) A sync race can therefore never
//      delete a child's gear, and a teacher reset wipes cleanly.
//
//   2. FORWARD-ONLY. A cloud merge can add; it can never take away. Mastery
//      counters merge by max, arrays by union. See progressMerge.js.
//
//   3. THE CHECKPOINT IS NOT ACHIEVEMENT. It is resume state, and it is excluded
//      from the forward merge — merging two devices' checkpoints would teleport
//      a child mid-stop. It is written after EVERY SHELL, not every stop: losing
//      a 90-second shell is a shrug; losing a 12-minute stop is a child who
//      never comes back.

import { normalizeCreature, defaultCreature, CREATURE_GEAR, CREATURE_DYES, ALL_PIECES } from "../data/creatureParts.js";
import { emptyRecord, recordAttempt, MASTERY_STATES } from "./questMastery.js";
import { boxAfterStop } from "./questReviewScheduler.js";
import { QUEST_STOPS, getStop } from "../data/questSequence.js";

export const SPARKS_PER_STAR = 12;

export function baseQuestState() {
  return {
    v: 1,
    creature: defaultCreature(),
    hatched: false,
    trail: { stopsDone: [], stars: {}, cutscenesSeen: [] },
    mastery: {},
    stones: [],
    trickies: [],
    ledger: { purchases: [] },
    checkpoint: null
  };
}

// Every load goes through this, so a save file written by an older build (or
// half-merged from the cloud) can never crash the game — worst case a child
// gets a default part back, not a white screen.
export function normalizeQuestState(raw) {
  const base = baseQuestState();
  const state = raw && typeof raw === "object" ? raw : {};
  return {
    ...base,
    ...state,
    v: 1,
    creature: normalizeCreature(state.creature),
    hatched: Boolean(state.hatched),
    trail: {
      stopsDone: Array.isArray(state.trail?.stopsDone) ? [...new Set(state.trail.stopsDone)] : [],
      stars: state.trail?.stars && typeof state.trail.stars === "object" ? { ...state.trail.stars } : {},
      cutscenesSeen: Array.isArray(state.trail?.cutscenesSeen) ? [...new Set(state.trail.cutscenesSeen)] : []
    },
    mastery: state.mastery && typeof state.mastery === "object" ? { ...state.mastery } : {},
    stones: Array.isArray(state.stones) ? [...new Set(state.stones)] : [],
    trickies: Array.isArray(state.trickies) ? [...new Set(state.trickies)] : [],
    ledger: { purchases: Array.isArray(state.ledger?.purchases) ? state.ledger.purchases : [] },
    checkpoint: state.checkpoint && typeof state.checkpoint === "object" ? state.checkpoint : null
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

export function earnedSparks(state) {
  return totalStars(state) * SPARKS_PER_STAR;
}

export function spentSparks(state) {
  return (state?.ledger?.purchases || []).reduce((sum, p) => sum + (Number(p?.cost) || 0), 0);
}

export function availableSparks(state) {
  return Math.max(0, earnedSparks(state) - spentSparks(state));
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

export function recordPurchase(state, piece, at = new Date().toISOString()) {
  if (!canBuy(state, piece)) return state;
  return {
    ...state,
    ledger: { purchases: [...(state.ledger?.purchases || []), { id: piece.id, cost: piece.cost || 0, at }] }
  };
}

// ── Mastery + stones ────────────────────────────────────────────────────────

// One response, from one shell. This is the ONLY way mastery ever changes.
export function recordQuestAttempt(state, { target, correct, shell, at = new Date().toISOString() }) {
  if (!target) return state;
  const prev = state.mastery?.[target] || emptyRecord();
  const next = recordAttempt(prev, { correct, shell, at });
  return { ...state, mastery: { ...state.mastery, [target]: next } };
}

// Finish a stop: bank the stars, light the stones, keep the heart words, update
// the review boxes, drop the gear, clear the checkpoint.
//
// NOTE what is NOT here: nothing checks mastery before advancing. That is the
// point. The story never waits.
export function recordStopResult(state, stopId, stars = 0) {
  const stop = getStop(stopId);
  if (!stop) return state;

  const stopsDone = [...new Set([...(state.trail?.stopsDone || []), stopId])];
  const prevStars = Number(state.trail?.stars?.[stopId]) || 0;

  const mastery = { ...state.mastery };
  for (const target of Object.keys(mastery)) {
    mastery[target] = { ...mastery[target], box: boxAfterStop(mastery[target]), lastStop: stop.index };
  }

  // A stone lights up when its SOUND is MASTERED — not when the stop is passed.
  // This is the one place the two tracks are visible side by side, and it is
  // the honest signal: you walked here, but you don't own this sound yet.
  //
  // Heart words ("hw:the") are mastery targets too, but they are NOT sounds, and
  // the wall is a wall of sounds. They live on the Trickies shelf instead.
  const stones = [...new Set([
    ...(state.stones || []),
    ...Object.keys(mastery).filter(t =>
      !t.includes(":")
      && (mastery[t].state === MASTERY_STATES.MASTERED || mastery[t].state === MASTERY_STATES.RETIRED))
  ])];

  return {
    ...state,
    trail: {
      ...state.trail,
      stopsDone,
      stars: { ...(state.trail?.stars || {}), [stopId]: Math.max(prevStars, stars) }
    },
    mastery,
    stones,
    trickies: [...new Set([...(state.trickies || []), ...(stop.heartWords || [])])],
    checkpoint: null
  };
}

// ── Checkpoint: resume state, written after every shell ─────────────────────
export function saveQuestCheckpoint(state, checkpoint) {
  return { ...state, checkpoint: checkpoint ? { ...checkpoint, at: new Date().toISOString() } : null };
}

export function readQuestCheckpoint(state) {
  return state?.checkpoint || null;
}

export function clearQuestCheckpoint(state) {
  return { ...state, checkpoint: null };
}
