import { rhymePopLadder, rhymePopStars } from '../../../../utils/rhymePopLevels.js';

// The parent owns input cancellation, recorded delivery and feedback timing.
// Keep consumed IDs separate from the public, round-local resolved word set.
const runs = new WeakMap();

function seededRandom(seed) {
  let value = Number(seed) >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function snapshot(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value) ? value.map(snapshot)
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)])));
}

function makeChoice(level, word, slot) {
  return Object.freeze({ id: `${level.difficulty}:${level.level}:${slot}:${word}`,
    word, slot, isRhyme: level.rhymingWords.includes(word) });
}

/** Mutable run; authored plan, choices, responses and receipts are frozen snapshots. */
export function createRhymeRun(difficulty = 'easy', startLevel = 0, seed = 1) {
  const plan = snapshot(rhymePopLadder(difficulty));
  const round = Math.max(0, Math.min(plan.length - 1, Number.isFinite(startLevel) ? Math.trunc(startLevel) : 0));
  const random = seededRandom(seed);
  const slots = shuffled(Array.from({ length: plan[0].visibleBalloons }, (_, index) => index), random);
  let nextSlot = 0;
  // Distribute correct positions evenly across the ladder, independently of
  // the shuffled word pools. Build every round so resume retains its layout.
  const layouts = plan.map(level => {
    const rhymes = shuffled(level.rhymingWords, random);
    const distractors = shuffled(level.distractors, random);
    const correctSlots = new Set(Array.from({ length: level.correctVisible }, () => slots[nextSlot++ % slots.length]));
    let rhymeIndex = 0;
    let distractorIndex = 0;
    const choices = Array.from({ length: level.visibleBalloons }, (_, slot) =>
      makeChoice(level, correctSlots.has(slot) ? rhymes[rhymeIndex++] : distractors[distractorIndex++], slot));
    return { rhymes, choices: Object.freeze(choices) };
  });
  const state = { plan, round, phase: 'active', choices: layouts[round].choices,
    resolvedWords: new Set(), firstResponses: [], assistedRetries: [], score: 0, words: 0,
    paused: false, lastResponse: null, receipt: null };
  runs.set(state, { layouts, startRound: round, consumedTargets: new Set(), attempts: new Map() });
  return state;
}

export const currentRhymeLevel = state => state.plan[state.round];

/**
 * Returns a frozen response, or null without mutation when the action is blocked.
 * Completed delivery or supportUsed: ['printed_rhyme_support'] admits selection;
 * merely displaying the normal printed target/choices is not recovery consent.
 */
export function chooseRhyme(state, choiceId, { audioDelivery = 'pending', cueHistory = [], supportUsed = [] } = {}) {
  if (state.paused || state.phase !== 'active' ||
      (audioDelivery !== 'completed' && !supportUsed.includes('printed_rhyme_support'))) return null;
  const internal = runs.get(state);
  const choice = state.choices.find(item => item.id === choiceId);
  if (!choice || internal.consumedTargets.has(choiceId) || state.resolvedWords.has(choice.word)) return null;
  const level = currentRhymeLevel(state);
  // isRhyme is a render hint only. The authored membership is the answer rule.
  const correct = level.rhymingWords.includes(choice.word);
  const learningSlot = `${level.difficulty}:${state.round}:${choice.word}`;
  const attempts = (internal.attempts.get(learningSlot) || 0) + 1;
  const response = Object.freeze({
    learningSlot, target: level.targetWord,
    expectedResponse: correct ? choice.word : level.targetWord,
    response: choice.word, responseId: choice.id, correct, attempts,
    construct: 'printed_word_rhyme_selection', practiceOnly: true, independent: false,
    audioDelivery, cueHistory: snapshot(cueHistory),
    supportUsed: snapshot([...new Set(['printed_target', 'printed_choices', ...supportUsed,
      ...(attempts > 1 ? ['specific_rhyme_feedback', 'retry_same_target'] : [])])])
  });
  internal.attempts.set(learningSlot, attempts);
  (attempts === 1 ? state.firstResponses : state.assistedRetries).push(response);
  state.lastResponse = response;
  state.phase = 'feedback';
  if (correct) {
    internal.consumedTargets.add(choice.id);
    state.resolvedWords.add(choice.word);
    state.score += 10;
    state.words += 1;
    if (state.resolvedWords.size === level.rhymingWords.length && state.round === state.plan.length - 1 && !state.receipt) {
      // Save at the last accepted word, before any pop, lift, dismissal or exit.
      const total = state.plan.slice(internal.startRound).reduce((sum, item) => sum + item.rhymingWords.length, 0);
      const mistakes = state.firstResponses.filter(item => !item.correct).length;
      state.receipt = Object.freeze({
        stars: rhymePopStars({ correct: state.words, total, mistakes }), score: state.score, words: state.words,
        evidence: Object.freeze({
          firstResponses: Object.freeze([...state.firstResponses]),
          assistedRetries: Object.freeze([...state.assistedRetries]),
          supportUsed: Object.freeze([...new Set([...state.firstResponses, ...state.assistedRetries].flatMap(item => item.supportUsed))]),
          practiceOnly: true, independent: false, construct: response.construct,
          phase: 'complete', audioDelivery
        })
      });
    }
  }
  return response;
}

/** Finish parent-owned feedback once; return the current/next phase. */
export function finishRhymeFeedback(state) {
  if (state.paused || state.phase !== 'feedback') return state.phase;
  const level = currentRhymeLevel(state);
  if (state.lastResponse.correct) {
    const selected = state.choices.find(choice => choice.id === state.lastResponse.responseId);
    const visibleWords = new Set(state.choices.map(choice => choice.word));
    const nextWord = runs.get(state).layouts[state.round].rhymes.find(word =>
      !state.resolvedWords.has(word) && !visibleWords.has(word));
    // Reuse only the selected slot, preserving every untouched object and ID.
    // Once the queue is empty the slot disappears; resolved words never recycle.
    state.choices = Object.freeze(state.choices.flatMap(choice => choice.id !== selected.id ? [choice]
      : nextWord ? [makeChoice(level, nextWord, selected.slot)] : []));
  }
  state.phase = state.resolvedWords.size === level.rhymingWords.length
    ? state.round === state.plan.length - 1 ? 'complete' : 'round-complete'
    : 'active';
  return state.phase;
}

/** Advance only an unpaused round checkpoint; preserve all run evidence. */
export function continueRhymeRound(state) {
  if (state.paused || state.phase !== 'round-complete' || state.round >= state.plan.length - 1) return false;
  state.round += 1;
  state.choices = runs.get(state).layouts[state.round].choices;
  state.resolvedWords = new Set();
  state.lastResponse = null;
  state.phase = 'active';
  return true;
}
