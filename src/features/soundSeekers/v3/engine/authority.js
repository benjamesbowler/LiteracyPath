// Sound Seekers v3 — attempt authority.
//
// The ONLY place a child's response is judged. Pure: (beat, beatState, action)
// → { state, outcome }. The renderer and HUD dispatch actions; they never
// know the key. One explicit literacy action produces at most one evidence
// event; movement, replay and tapping-to-hear produce none.
//
// Error ladder (GAME_DESIGN_BIBLE / QUESTION_DESIGN_BIBLE):
//   1st error → name what was chosen, replay the target, keep the item stable
//   2nd error → the character models the answer; the next correct pick is
//               recorded as SUPPORTED, never independent
//   the item never changes under the child's feet; nothing is taken away.

import { MECHANICS } from "./challenges.js";

export function createBeatState(beat) {
  const base = { beatId: beat.id, mechanic: beat.mechanic, errors: 0, modelShown: false, heard: false, done: false, supportUsed: [], startedAt: null };
  switch (beat.mechanic) {
    case MECHANICS.SIGNPOST:
      return { ...base, cardsHeard: [] };
    case MECHANICS.SOUND_SORT:
      return { ...base, itemIndex: 0, placed: {}, itemErrors: {}, events: [] };
    case MECHANICS.WORD_FORGE:
      return { ...base, placed: [], slotErrors: 0 };
    case MECHANICS.BLEND_BRIDGE:
      return { ...base, phase: "stones", tapped: [], revealed: false };
    case MECHANICS.HEART_LANTERN:
      return { ...base, phase: "learn" };
    default:
      return base;
  }
}

function evidence(beat, { independent, supportUsed = [], errorType = null, extra = {} }) {
  return {
    kind: "practice",
    beatId: beat.id,
    stopId: beat.stopId,
    mechanic: beat.mechanic,
    domain: beat.domain,
    targetIds: beat.targetIds,
    independent,
    supportUsed: [...new Set(supportUsed)],
    errorType,
    review: Boolean(beat.review),
    ...extra
  };
}

// Feedback lines are short, specific and never negative-labelled.
function firstErrorLine(beat, chosenLabel, targetLabel) {
  if (chosenLabel && targetLabel) return `That one says ${chosenLabel}. Listen again: ${targetLabel}.`;
  if (targetLabel) return `Not that one. Listen again: ${targetLabel}.`;
  return "Not that one. Look and listen again.";
}

const MODEL_LINE = "Watch me. Now you try.";

export function resolveAction(beat, state, action) {
  const s = state || createBeatState(beat);
  switch (beat.mechanic) {
    case MECHANICS.SIGNPOST: return resolveSignpost(beat, s, action);
    case MECHANICS.ECHO_HUNT: return resolveSingleChoice(beat, s, action, {
      choiceKey: "optionId", expected: beat.key.optionId,
      labelOf: id => beat.view.options.find(o => o.id === id)?.soundLabel || "",
      targetLabel: beat.view.target.soundLabel,
      errorType: "grapheme_confusion",
      confusedWith: id => beat.key.optionTargets[id]
    });
    case MECHANICS.GATE_RIDDLE: return resolveSingleChoice(beat, s, action, {
      choiceKey: "keyId", expected: beat.key.keyId,
      labelOf: id => beat.key.optionWords[id] || "",
      targetLabel: "",
      errorType: "rule_mismatch",
      customError: chosen => `${chosen} does not fit. Read the rule again.`
    });
    case MECHANICS.STORY_BRIDGE: return resolveSingleChoice(beat, s, action, {
      choiceKey: "choiceId", expected: beat.key.choiceId,
      labelOf: () => "",
      targetLabel: "",
      errorType: "meaning",
      customError: () => "Read the note again. What does it ask for?"
    });
    case MECHANICS.SOUND_SORT: return resolveSort(beat, s, action);
    case MECHANICS.WORD_FORGE: return resolveForge(beat, s, action);
    case MECHANICS.BLEND_BRIDGE: return resolveBlend(beat, s, action);
    case MECHANICS.HEART_LANTERN: return resolveHeart(beat, s, action);
    default: return { state: s, outcome: { type: "ignored" } };
  }
}

// ── teach ──────────────────────────────────────────────────────────────────
function resolveSignpost(beat, s, action) {
  if (action.type === "HEARD_CARD") {
    const cardsHeard = s.cardsHeard.includes(action.targetId) ? s.cardsHeard : [...s.cardsHeard, action.targetId];
    return { state: { ...s, cardsHeard, heard: true }, outcome: { type: "progress" } };
  }
  if (action.type === "FINISH") {
    // every card must have been heard (or audio is unavailable) before moving on
    const all = beat.view.cards.every(card => s.cardsHeard.includes(card.targetId) || !card.phonemeAudio && !card.anchorAudio);
    if (!all) return { state: s, outcome: { type: "blocked", line: "Tap each sign to hear it first." } };
    return { state: { ...s, done: true }, outcome: { type: "complete", taught: beat.targetIds, evidence: null } };
  }
  return { state: s, outcome: { type: "ignored" } };
}

// ── one-choice mechanics (echo hunt, gate riddle, story bridge) ────────────
function resolveSingleChoice(beat, s, action, cfg) {
  if (s.done) return { state: s, outcome: { type: "ignored" } };
  if (action.type === "REQUEST_MODEL") {
    return { state: { ...s, modelShown: true, supportUsed: [...s.supportUsed, "model"] }, outcome: { type: "model", line: MODEL_LINE, revealId: cfg.expected } };
  }
  if (action.type !== "CHOOSE") return { state: s, outcome: { type: "ignored" } };
  const chosen = action[cfg.choiceKey];
  if (chosen === cfg.expected) {
    const independent = s.errors === 0 && !s.modelShown;
    const supportUsed = [...s.supportUsed];
    return {
      state: { ...s, done: true },
      outcome: {
        type: "correct",
        independent,
        evidence: evidence(beat, { independent, supportUsed, errorType: s.errors ? cfg.errorType : null, extra: { errors: s.errors } })
      }
    };
  }
  const errors = s.errors + 1;
  const chosenLabel = cfg.labelOf(chosen);
  const line = errors === 1
    ? (cfg.customError ? cfg.customError(chosenLabel) : firstErrorLine(beat, chosenLabel, cfg.targetLabel))
    : MODEL_LINE;
  const modelShown = errors >= 2 || s.modelShown;
  return {
    state: { ...s, errors, modelShown, supportUsed: modelShown ? [...s.supportUsed, "model"] : s.supportUsed, confusedWith: cfg.confusedWith ? cfg.confusedWith(chosen) : null },
    outcome: { type: "incorrect", errors, line, revealId: modelShown ? cfg.expected : null, chosenId: chosen }
  };
}

// ── sound sort: one item at a time, one evidence event per item ────────────
function resolveSort(beat, s, action) {
  if (s.done) return { state: s, outcome: { type: "ignored" } };
  const items = beat.view.items;
  const item = items[s.itemIndex];
  if (!item) return { state: s, outcome: { type: "ignored" } };
  if (action.type === "REQUEST_MODEL") {
    return { state: { ...s, modelShown: true, supportUsed: [...s.supportUsed, "model"] }, outcome: { type: "model", line: MODEL_LINE, revealId: beat.key.bins[item.id], itemId: item.id } };
  }
  if (action.type !== "PLACE" || action.itemId !== item.id) return { state: s, outcome: { type: "ignored" } };
  const expectedBin = beat.key.bins[item.id];
  const itemErrors = s.itemErrors[item.id] || 0;
  if (action.binId === expectedBin) {
    const independent = itemErrors === 0 && !s.modelShown;
    const ev = evidence(beat, {
      independent, supportUsed: s.supportUsed, errorType: itemErrors ? "phoneme_confusion" : null,
      extra: { itemWord: item.word, targetIds: [beat.key.binTargets[expectedBin]] }
    });
    const placed = { ...s.placed, [item.id]: expectedBin };
    const nextIndex = s.itemIndex + 1;
    const done = nextIndex >= items.length;
    return {
      state: { ...s, placed, itemIndex: nextIndex, done, modelShown: false, events: [...s.events, ev] },
      outcome: { type: done ? "complete" : "correct", independent, evidence: ev, itemId: item.id, binId: expectedBin, remaining: items.length - nextIndex }
    };
  }
  const errors = itemErrors + 1;
  const bin = beat.view.bins.find(b => b.id === action.binId);
  const right = beat.view.bins.find(b => b.id === expectedBin);
  const line = errors === 1
    ? `${item.word} does not go with ${bin?.soundLabel || "that one"}. Listen to ${item.word} again.`
    : MODEL_LINE;
  const modelShown = errors >= 2;
  return {
    state: { ...s, errors: s.errors + 1, itemErrors: { ...s.itemErrors, [item.id]: errors }, modelShown, supportUsed: modelShown ? [...s.supportUsed, "model"] : s.supportUsed },
    outcome: { type: "incorrect", errors, line, itemId: item.id, binId: action.binId, revealId: modelShown ? right?.id : null }
  };
}

// ── word forge: ordered slots, one evidence event per word ─────────────────
function tileEquivalent(beat, a, b) {
  if (a === b) return true;
  const ta = beat.view.tiles.find(t => t.id === a);
  const tb = beat.view.tiles.find(t => t.id === b);
  return Boolean(ta && tb && ta.grapheme === tb.grapheme && beat.key.tileSounds[a] === beat.key.tileSounds[b]);
}

function resolveForge(beat, s, action) {
  if (s.done) return { state: s, outcome: { type: "ignored" } };
  const slot = s.placed.length;
  // two tiles with the same letter and sound (d-a-d) are interchangeable
  const expectedTile = beat.key.sequence[slot];
  if (action.type === "REQUEST_MODEL") {
    return { state: { ...s, modelShown: true, supportUsed: [...s.supportUsed, "model"] }, outcome: { type: "model", line: MODEL_LINE, revealId: expectedTile, slot } };
  }
  if (action.type === "REMOVE_LAST") {
    if (!s.placed.length) return { state: s, outcome: { type: "ignored" } };
    return { state: { ...s, placed: s.placed.slice(0, -1) }, outcome: { type: "removed", slot: s.placed.length - 1 } };
  }
  if (action.type !== "PLACE_TILE") return { state: s, outcome: { type: "ignored" } };
  if (s.placed.includes(action.tileId)) return { state: s, outcome: { type: "ignored" } };
  if (tileEquivalent(beat, action.tileId, expectedTile)) {
    const placed = [...s.placed, action.tileId];
    const done = placed.length === beat.key.sequence.length;
    if (!done) return { state: { ...s, placed }, outcome: { type: "progress", slot, tileId: action.tileId } };
    const independent = s.slotErrors === 0 && !s.modelShown;
    const ev = evidence(beat, { independent, supportUsed: s.supportUsed, errorType: s.slotErrors ? "order" : null, extra: { word: beat.key.word || beat.view.word, errors: s.slotErrors } });
    return { state: { ...s, placed, done: true }, outcome: { type: "complete", independent, evidence: ev, slot, tileId: action.tileId } };
  }
  const slotErrors = s.slotErrors + 1;
  const chosen = beat.view.tiles.find(t => t.id === action.tileId);
  const errors = s.errors + 1;
  const consecutive = (s.lastErrorSlot === slot ? (s.consecutive || 0) : 0) + 1;
  const line = consecutive === 1
    ? `That tile says ${labelForTile(chosen)}. Listen to the word again.`
    : MODEL_LINE;
  const modelShown = consecutive >= 2 || s.modelShown;
  return {
    state: { ...s, errors, slotErrors, lastErrorSlot: slot, consecutive, modelShown, supportUsed: modelShown ? [...s.supportUsed, "model"] : s.supportUsed },
    outcome: { type: "incorrect", errors: consecutive, line, slot, tileId: action.tileId, revealId: modelShown ? expectedTile : null }
  };
}

function labelForTile(tile) {
  return tile ? `/${tile.grapheme.replace(/_/g, "")}/` : "another sound";
}

// ── blend bridge: stones (unscored) → blend → meaning ──────────────────────
function resolveBlend(beat, s, action) {
  if (s.done) return { state: s, outcome: { type: "ignored" } };
  if (s.phase === "stones") {
    if (action.type === "TAP_STONE") {
      const next = beat.view.stones[s.tapped.length];
      if (!next || next.id !== action.stoneId) return { state: s, outcome: { type: "nudge", line: "Tap the stones in order, left to right." } };
      const tapped = [...s.tapped, action.stoneId];
      const ready = tapped.length === beat.view.stones.length;
      return { state: { ...s, tapped, phase: ready ? "blend" : "stones" }, outcome: { type: "progress", stoneId: action.stoneId, ready } };
    }
    return { state: s, outcome: { type: "ignored" } };
  }
  if (s.phase === "blend") {
    if (action.type === "BLEND") {
      return { state: { ...s, phase: "meaning", revealed: true }, outcome: { type: "revealed", word: beat.key.word } };
    }
    return { state: s, outcome: { type: "ignored" } };
  }
  // meaning
  return resolveSingleChoice(beat, s, action, {
    choiceKey: "optionId", expected: beat.key.optionId,
    labelOf: id => beat.key.optionWords[id] || "",
    targetLabel: beat.key.word,
    errorType: "meaning",
    customError: chosen => (beat.view.mode === "print" ? `That says ${chosen}. Read the stones again.` : `That is a ${chosen}. Read the stones again.`)
  });
}

// ── heart word lantern: learn → find (scored) → phrase (read-along) ────────
function resolveHeart(beat, s, action) {
  if (s.done) return { state: s, outcome: { type: "ignored" } };
  if (s.phase === "learn") {
    if (action.type === "HEARD") return { state: { ...s, heard: true }, outcome: { type: "progress" } };
    if (action.type === "READY") {
      if (!s.heard && beat.view.wordAudio) return { state: s, outcome: { type: "blocked", line: "Tap the lantern to hear the word first." } };
      return { state: { ...s, phase: "find" }, outcome: { type: "phase", phase: "find" } };
    }
    return { state: s, outcome: { type: "ignored" } };
  }
  if (s.phase === "find") {
    const r = resolveSingleChoice(beat, { ...s, done: false }, action, {
      choiceKey: "optionId", expected: beat.key.optionId,
      labelOf: id => beat.key.optionWords[id] || "",
      targetLabel: beat.view.word,
      errorType: "lookalike",
      customError: chosen => `That says ${chosen}. Look for ${beat.view.word}.`
    });
    if (r.outcome.type === "correct") {
      const hasPhrase = Boolean(beat.view.phrase);
      return { state: { ...r.state, done: !hasPhrase, phase: hasPhrase ? "phrase" : "done" }, outcome: { ...r.outcome, type: hasPhrase ? "correct" : "complete" } };
    }
    return r;
  }
  if (s.phase === "phrase") {
    if (action.type === "FINISH") return { state: { ...s, done: true }, outcome: { type: "complete", evidence: null } };
    return { state: s, outcome: { type: "ignored" } };
  }
  return { state: s, outcome: { type: "ignored" } };
}

export function isBeatDone(state) {
  return Boolean(state?.done);
}
