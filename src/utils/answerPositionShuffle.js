// Answer position is not a teaching decision, and until 2026-07-31 it was an
// accidental one. Measured across the legacy generated banks, the correct
// answer sits at index 0 on 96.2% of scored multiple-choice items (3,390 of
// 3,524), and seven banks are at exactly 100%. Nothing in the render path
// shuffled them, so stored order was display order: a child who always taps
// the first button could clear the current phase pass rule without reading
// anything, and every mastery figure
// derived from them measured that habit rather than literacy.
//
// Options are therefore shuffled at the render boundary. Two properties matter:
//
//   1. Seeded on the question id, so the order is STABLE while a child is
//      looking at the question. An unseeded shuffle would reorder the buttons
//      on every React re-render, which for a four-year-old is worse than the
//      bias it fixes.
//   2. Varying across questions, so no position is learnable.
//
// The data is deliberately left alone. Re-shuffling the bank files would hide
// the bias rather than fix it, and the regression test that guards this
// (tests/unit/answerPositionBalance.test.js) asserts on the FILES, so it must
// keep seeing the real stored distribution.
//
// The model for this is randomizeGuidedReadingAnswerPositions in
// src/utils/guidedReading/bookQuizQuestions.js, which already does the right
// thing for book quizzes with a Latin square.

// FNV-1a. Any stable string hash would do; this one is short and dependency-free.
function hashSeedKey(seedKey) {
  const text = String(seedKey ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32 — deterministic, uniform enough for four buttons.
function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffle answer options for display.
 *
 * @param {Array} options    the stored option list, in bank order
 * @param {string} seedKey   stable per question — pass the question id
 * @returns {Array} a new array; the input is never mutated
 */
export function shuffleAnswerPositions(options = [], seedKey = "") {
  if (!Array.isArray(options) || options.length < 2) return Array.isArray(options) ? options : [];

  // No id means no stable seed. Returning stored order is the honest failure
  // mode — a wobbling shuffle would be worse — and the test below catches any
  // bank that reaches the runtime without ids.
  if (seedKey === "" || seedKey === null || seedKey === undefined) return options;

  const random = seededRandom(hashSeedKey(seedKey));
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const held = shuffled[index];
    shuffled[index] = shuffled[swapWith];
    shuffled[swapWith] = held;
  }
  return shuffled;
}

function answerValuesForRound(round) {
  const accepted = Array.isArray(round?.acceptedAnswers)
    ? round.acceptedAnswers
    : [];
  return accepted.length ? accepted : [round?.answer ?? round?.studyWord ?? ""];
}

function sameAnswer(left, right) {
  return String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();
}

function moveAtIndex(values, fromIndex, toIndex) {
  const next = [...values];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Rebalance answer positions across a stable, already-built practice plan.
 *
 * The regular shuffle protects a question from answer-position bias, while
 * this pass also prevents consecutive practice questions from reusing the
 * same visible slot whenever their choice counts make that possible. Related
 * display arrays (picture objects and choice details) move with their choice.
 */
export function distributeAnswerPositions(rounds = [], seedKey = "") {
  if (!Array.isArray(rounds) || rounds.length < 2) return Array.isArray(rounds) ? rounds : [];

  let previousPosition = -1;
  let choiceRoundIndex = 0;

  return rounds.map((round, roundIndex) => {
    const choices = Array.isArray(round?.choices) ? round.choices : [];
    if (choices.length < 2) return round;

    const answerIndex = choices.findIndex(choice => (
      answerValuesForRound(round).some(answer => sameAnswer(choice, answer))
    ));
    if (answerIndex < 0) return round;

    const availablePositions = Array.from({ length: choices.length }, (_, index) => index)
      .filter(index => index !== previousPosition);
    const positionSeed = `${seedKey}:${round?.roundKey || round?.mechanicId || "round"}:${roundIndex}:${choiceRoundIndex}`;
    const desiredPosition = availablePositions[
      hashSeedKey(positionSeed) % availablePositions.length
    ];
    const nextChoices = moveAtIndex(choices, answerIndex, desiredPosition);
    const nextRound = { ...round, choices: nextChoices };

    for (const key of ["choiceDetails", "objects"]) {
      if (Array.isArray(round?.[key]) && round[key].length === choices.length) {
        nextRound[key] = moveAtIndex(round[key], answerIndex, desiredPosition);
      }
    }

    previousPosition = desiredPosition;
    choiceRoundIndex += 1;
    return nextRound;
  });
}

export const __testing = { hashSeedKey, seededRandom };
