// Shuffle selectable answer banks once per saved question and run. Keep the
// complete choice object together: its id, label, image, audio and scoring value
// must travel together. A replay, render or restored checkpoint keeps the same
// order; a fresh question/run gets its own seed. Never shuffle the ordered
// spelling parts, sentence model, musical keyboard or spatial meaning itself.
// Runtime balance regressions live in tests/unit/answerPositionRuntime.test.js.

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

/** Prepare a native learning task ONCE, before saving its episode. Ordered
 * answers/model parts are curriculum; only the selectable bank is shuffled. */
export function shuffleLearningQuestionChoices(question, seedKey) {
  if (!question) return question;
  const key = ["answerOptions", "options", "choices", "letterTiles"].find(name => Array.isArray(question[name]));
  if (!key || question[key].length < 2) return question;
  const order = shuffleAnswerPositions(question[key].map((_, index) => index), seedKey);
  const prepared = { ...question, [key]: order.map(index => question[key][index]) };
  for (const name of ["choiceDetails", "objects"]) {
    if (Array.isArray(question[name]) && question[name].length === order.length) prepared[name] = order.map(index => question[name][index]);
  }
  return prepared;
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
