import { starRubric } from "../../../../utils/starRubric.js";

export const normalizeBridgeGlyph = value => String(value || "").trim().toLowerCase();
export const bridgeTargetItems = target => Array.isArray(target) ? target.map(String) : String(target || "").toUpperCase().split("");

export function createBridgeIdentities(stageIndex, target, tiles) {
  return {
    slots: bridgeTargetItems(target).map((needed, order) => ({ slotId: `bridge-${stageIndex}-slot-${order}`, order, needed, occurrenceId: null })),
    tiles: tiles.map((tile, index) => ({ ...tile, occurrenceId: `bridge-${stageIndex}-tile-${index}`, sourceIndex: index }))
  };
}

export function placementOutcome(tile, slot) {
  if (!tile || !slot || slot.occurrenceId) return { kind: "cancelled", independent: false };
  return { kind: tile.correct && normalizeBridgeGlyph(tile.glyph) === normalizeBridgeGlyph(slot.needed) ? "correct" : "wrong", independent: false };
}

export function mismatchFeedback(selected, needed) {
  return `You chose ${selected}. This space needs ${needed}. Try again.`;
}

export function createBridgeRun(startLevel = 0) {
  return { stage: startLevel, score: 0, completed: startLevel, stars: [], firstResponses: [], assistedRetries: [], receipt: null };
}

export function createBridgeStage(level, stage, fresh = false) {
  return {
    ...createBridgeIdentities(stage, level.target, level.tiles),
    level, stage, phase: "building", selected: null, attempts: {}, mistakes: 0,
    fresh, modelShown: !fresh, cueDelivery: "unplayed", cueHistory: [], feedback: "Choose a piece, then its bridge space."
  };
}

export function bridgeSupport(state) {
  const supportUsed = [];
  if (state.modelShown) supportUsed.push("printed_model", "ghost_slots");
  if (state.cueDelivery === "completed" || state.cueHistory.includes("completed")) supportUsed.push("recorded_target_cue");
  if (state.cueDelivery === "failed" || state.cueHistory.includes("failed")) supportUsed.push("audio_failed");
  return {
    practiceOnly: true, independent: false, supportUsed: Object.freeze(supportUsed),
    construct: Array.isArray(state.level.target) ? "sentence_reconstruction" : state.modelShown ? "supported_grapheme_matching" : "cued_grapheme_construction",
    cueDelivery: state.cueDelivery, cueHistory: Object.freeze([...state.cueHistory])
  };
}

// Keyboard and released touch dispatch the same IDs. Coordinates never choose
// a response, even when two rows or identical tokens share a horizontal anchor.
export function selectBridgeTile(state, occurrenceId) {
  if (state.phase !== "building" || !state.tiles.some(tile => tile.occurrenceId === occurrenceId)
    || state.slots.some(slot => slot.occurrenceId === occurrenceId)) return state;
  return { ...state, selected: state.selected === occurrenceId ? null : occurrenceId, feedback: "Choose a bridge space. Tap the piece again to put it back." };
}

export function placeBridgeTile(state, run, slotId) {
  if (state.phase !== "building" || !state.selected) return { state, run, outcome: "cancelled" };
  const tile = state.tiles.find(item => item.occurrenceId === state.selected);
  const slot = state.slots.find(item => item.slotId === slotId);
  const outcome = placementOutcome(tile, slot).kind;
  if (outcome === "cancelled") return { state, run, outcome };
  const attempts = (state.attempts[slotId] || 0) + 1;
  const support = bridgeSupport(state);
  const evidence = Object.freeze({
    game: "word-bridge", levelId: state.level.levelId, taskStepId: slotId, slotId,
    occurrenceId: tile.occurrenceId,
    target: Array.isArray(state.level.target) ? state.level.target.join(" ") : state.level.target,
    targetPart: slot.needed, response: tile.glyph, correct: outcome === "correct", attempts, ...support
  });
  const nextRun = { ...run, firstResponses: [...run.firstResponses], assistedRetries: [...run.assistedRetries] };
  if (attempts === 1) nextRun.firstResponses.push(evidence);
  else if (outcome === "correct") nextRun.assistedRetries.push(Object.freeze({ ...evidence, supportUsed: Object.freeze([...support.supportUsed, "specific_slot_feedback", "retry_same_item"]) }));
  const next = { ...state, selected: null, attempts: { ...state.attempts, [slotId]: attempts } };
  if (outcome === "wrong") {
    next.mistakes += 1;
    next.modelShown = true;
    next.feedback = mismatchFeedback(tile.glyph, slot.needed);
  } else {
    next.slots = state.slots.map(item => item.slotId === slotId ? { ...item, occurrenceId: tile.occurrenceId } : item);
    nextRun.score += 35;
    next.feedback = `${tile.glyph} fits. Keep building!`;
    if (next.slots.every(item => item.occurrenceId)) {
      next.phase = "built";
      next.feedback = "Bridge built! Read it together, then ring the bell.";
      nextRun.completed += 1;
      nextRun.stars = [...run.stars, starRubric({ correct: next.slots.length, total: next.slots.length, mistakes: next.mistakes })];
    }
  }
  return { state: next, run: nextRun, outcome };
}

export function bridgeReceipt(run) {
  return Object.freeze({
    score: run.score, words: run.completed,
    stars: Math.round(run.stars.reduce((sum, n) => sum + n, 0) / Math.max(1, run.stars.length)),
    evidence: Object.freeze({ practiceOnly: true, independent: false,
      firstResponses: Object.freeze([...run.firstResponses]), assistedRetries: Object.freeze([...run.assistedRetries]) })
  });
}
