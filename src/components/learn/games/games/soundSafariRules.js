import { soundSafariLadder, soundSafariPresentedStars } from '../../../../utils/soundSafariRounds.js';
import {
  soundSafariOptionsForUnit, soundSafariSoundsEquivalent,
  soundSafariWordAudio, soundSafariUnitAudio
} from '../../../../data/soundSafariPronunciations.js';

// Only this controller can change evidence or route state. The host owns pause,
// actual audio delivery, input cancellation, feedback timing and saving receipts.
const runs = new WeakMap();
const empty = Object.freeze([]);
const printHelp = new Set([
  'printed_word', 'modeled_word', 'spelling_sequence',
  'revealed_spelling_sequence', 'printed_model_recovery'
]);

function snapshot(value, seen = new WeakMap()) {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const [key, item] of Object.entries(value)) {
    Object.defineProperty(copy, key, { value: snapshot(item, seen), enumerable: true });
  }
  return Object.freeze(copy);
}

const supports = values => snapshot([...new Set(values)]);
const wordAt = state => state.plan[state.wordIndex];
const unitAt = state => wordAt(state).units[state.unitIndex];

function stepSeed(state) {
  // Derive each step independently, so starting at a checkpoint preserves the
  // same choices as playing to it. Occurrences, not labels, own step identity.
  let hash = state.seed;
  const key = `${wordAt(state).difficulty}:${state.wordIndex}:${unitAt(state).occurrenceId}`;
  for (let index = 0; index < key.length; index++) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16777619) >>> 0;
  }
  return hash;
}

function makeChoices(state) {
  const word = wordAt(state);
  const unit = unitAt(state);
  const options = soundSafariOptionsForUnit(word, state.unitIndex, { seed: stepSeed(state), count: 6 });
  // Fail closed if an authored-data refinement stops providing an unambiguous
  // six-choice task. Do not invent spellings or accept sound aliases as answers.
  if (options.length !== 6 || new Set(options.map(option => option.grapheme)).size !== 6
      || options.filter(option => option.grapheme === unit.grapheme && option.soundKey === unit.soundKey).length !== 1
      || options.some((option, index) => options.slice(0, index).some(other => soundSafariSoundsEquivalent(option, other)))) {
    throw new Error(`Unsafe Sound Safari choices: ${word.word}/${unit.occurrenceId}`);
  }
  return snapshot(options.map((option, slot) => ({
    ...option, slot,
    id: `safari:${state.seed}:${word.difficulty}:${state.wordIndex}:${unit.occurrenceId}:${slot}:${option.grapheme}`
  })));
}

function startWord(state) {
  state.unitIndex = 0;
  state.found = empty;
  state.model = wordAt(state).wordInLevel === 0;
  state.revealed = false;
  state.wordSupport = state.model ? supports(['modeled_word', 'spelling_sequence']) : empty;
  state.lastResponse = null;
  state.nextCheckpoint = null;
  state.choices = makeChoices(state);
  state.phase = 'active';
}

/**
 * Flat 30-word authored plan. startLevel is a zero-based habitat checkpoint,
 * not a word offset; earlier words contribute no score, stars or evidence.
 * All exposed fields are read-only frozen snapshots except run.paused.
 */
export function createSafariRun(difficulty = 'easy', startLevel = 0, seed = 1) {
  const safeDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy';
  const plan = snapshot(soundSafariLadder(safeDifficulty).flatMap(level => level.words.map((word, index) => ({
    ...word,
    difficulty: level.difficulty, level: level.level, world: level.world,
    wordInLevel: index, wordIndex: level.level * 3 + index,
    wordAudio: soundSafariWordAudio(word.word),
    units: word.units.map(unit => ({ ...unit, audio: soundSafariUnitAudio(unit, word.word) }))
  }))));
  const level = Math.max(0, Math.min(9, Number.isFinite(startLevel) ? Math.trunc(startLevel) : 0));
  const state = {
    plan, wordIndex: level * 3, unitIndex: 0, phase: 'active', choices: empty,
    model: false, revealed: false, wordSupport: empty, found: empty,
    score: 0, words: 0, unitsCompleted: 0, firstResponses: empty, assistedRetries: empty,
    lastResponse: null, receipt: null, paused: false, nextCheckpoint: null
  };
  const publicKeys = Object.keys(state);
  state.seed = Number(seed) >>> 0;
  state.attempts = new Map();
  startWord(state);
  const run = {};
  for (const key of publicKeys) {
    Object.defineProperty(run, key, {
      enumerable: true,
      get: () => state[key],
      ...(key === 'paused' ? { set: value => { state.paused = Boolean(value); } } : {})
    });
  }
  runs.set(run, state);
  return Object.preventExtensions(run);
}

/** Read-only host metadata; a task remains inspectable during feedback/pause. */
export function currentSafariTask(run) {
  const state = runs.get(run);
  if (!state) return null;
  const word = wordAt(state);
  const unit = unitAt(state);
  return Object.freeze({
    ...word, unit, unitIndex: state.unitIndex, unitAudio: unit.audio,
    phase: state.phase, model: state.model, revealed: state.revealed,
    found: state.found, choices: state.choices, wordSupport: state.wordSupport
  });
}

function freezeReceipt(state) {
  const responses = [...state.firstResponses, ...state.assistedRetries];
  // First responses count presented occurrences; retries do not inflate the
  // denominator, and every deliberate mismatch still reaches the shared rubric.
  return Object.freeze({
    stars: soundSafariPresentedStars({
      correct: state.unitsCompleted, presentedUnits: state.firstResponses.length,
      mistakes: responses.filter(response => !response.correct).length
    }),
    score: state.score, words: state.words,
    evidence: Object.freeze({
      firstResponses: state.firstResponses,
      assistedRetries: state.assistedRetries,
      supportUsed: supports(responses.flatMap(response => response.supportUsed)),
      practiceOnly: true, independent: false
    })
  });
}

/**
 * A deliberate choice returns its frozen response; blocked calls return null
 * without mutation. Even displayed models require completed delivery OR this
 * action's explicit supportUsed: ['printed_model_recovery'] admission.
 * The host must gate pending word/current-unit recordings before calling.
 */
export function chooseSafari(run, choiceId, options = {}) {
  const state = runs.get(run);
  if (!state || state.paused || state.phase !== 'active' || !options || typeof options !== 'object') return null;
  const { audioDelivery = 'pending', cueHistory = [], supportUsed = [] } = options;
  if (!Array.isArray(cueHistory) || !Array.isArray(supportUsed)) return null;
  const recovery = supportUsed.includes('printed_model_recovery');
  if (audioDelivery !== 'completed' && !recovery) return null;
  const choice = state.choices.find(item => item.id === choiceId);
  if (!choice) return null;
  const word = wordAt(state);
  const unit = unitAt(state);
  const learningSlot = `safari:${word.difficulty}:${state.wordIndex}:${unit.occurrenceId}`;
  const attempts = (state.attempts.get(learningSlot) || 0) + 1;
  const correct = choice.grapheme === unit.grapheme && choice.soundKey === unit.soundKey;
  const wordSupport = supports([
    ...state.wordSupport, ...supportUsed.filter(support => support !== 'printed_choices'),
    ...(recovery ? ['printed_word', 'revealed_spelling_sequence'] : [])
  ]);
  const responseSupport = supports([
    'printed_choices', ...wordSupport,
    ...(attempts > 1 ? ['specific_grapheme_feedback', 'retry_same_target'] : [])
  ]);
  const response = Object.freeze({
    learningSlot, target: word.word, wordIndex: state.wordIndex, unitIndex: state.unitIndex,
    occurrenceId: unit.occurrenceId,
    expectedResponse: unit.grapheme, response: choice.grapheme, responseId: choice.id,
    soundKey: unit.soundKey, expectedSoundKey: unit.soundKey, selectedSoundKey: choice.soundKey,
    letterIndices: unit.letterIndices, correct, attempts,
    construct: wordSupport.some(support => printHelp.has(support))
      ? 'modeled_grapheme_construction' : 'spoken_word_grapheme_encoding',
    practiceOnly: true,
    independent: attempts === 1 && audioDelivery === 'completed' && wordSupport.length === 0,
    audioDelivery: snapshot(audioDelivery), cueHistory: snapshot(cueHistory), supportUsed: responseSupport
  });
  state.wordSupport = wordSupport;
  if (recovery || supportUsed.some(support => printHelp.has(support))) state.revealed = true;
  state.attempts.set(learningSlot, attempts);
  const evidenceKey = attempts === 1 ? 'firstResponses' : 'assistedRetries';
  state[evidenceKey] = Object.freeze([...state[evidenceKey], response]);
  state.lastResponse = response;
  state.phase = 'feedback';
  if (correct) {
    state.found = Object.freeze([...state.found, unit]);
    state.unitsCompleted += 1;
    state.score += 10;
    if (state.unitIndex === word.units.length - 1) {
      state.words += 1;
      if (state.wordIndex === state.plan.length - 1) {
        // The last learning action owns the one receipt. Animation, leaving,
        // feedback completion and result navigation cannot create another.
        state.receipt = freezeReceipt(state);
      } else if (word.wordInLevel === 2) {
        state.nextCheckpoint = word.level + 1;
      }
    }
  }
  return response;
}

/** Finish one parent-owned feedback beat; return its phase, or null if blocked. */
export function finishSafariFeedback(run) {
  const state = runs.get(run);
  if (!state || state.paused || state.phase !== 'feedback') return null;
  if (!state.lastResponse.correct) {
    state.phase = 'active';
  } else if (state.unitIndex < wordAt(state).units.length - 1) {
    state.unitIndex += 1;
    state.choices = makeChoices(state);
    state.phase = 'active';
  } else {
    state.choices = empty;
    state.phase = state.receipt ? 'complete' : 'word-complete';
  }
  return state.phase;
}

/** Navigation creates no response and cannot skip an unresolved word. */
export function continueSafariWord(run) {
  const state = runs.get(run);
  if (!state || state.paused || state.phase !== 'word-complete' || state.wordIndex >= state.plan.length - 1) return null;
  state.wordIndex += 1;
  startWord(state);
  return true;
}

/** Explicitly expose print for the rest of this word, without answering it. */
export function revealSafariModel(run, reason = 'requested_model') {
  const state = runs.get(run);
  if (!state || state.paused || state.phase !== 'active' || state.revealed) return null;
  state.revealed = true;
  state.wordSupport = supports([
    ...state.wordSupport, 'printed_word', 'revealed_spelling_sequence',
    typeof reason === 'string' && reason ? reason : 'requested_model'
  ]);
  return currentSafariTask(run);
}
