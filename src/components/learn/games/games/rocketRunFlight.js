import { buildRocketRunRound, rocketRunLadder, rocketRunStars, rocketRunTargets, wordsStartingWithTargetSound } from '../../../../utils/rocketRunRounds.js';
import { onsetGrapheme } from '../../../elQuest/elQuestEngine.js';
import { getLedaWordAudioPath, getLedaInstructionAudioPath } from '../../../../data/ledaProductionAudio.js';
import { hasKnownBadWordAudio, isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';

export const FLIGHT_STEP = 1 / 60;
export const ROCKET_SECTORS = Object.freeze([
  Object.freeze({ id: 'hangar', name: 'Cargo hangar', delivery: 'Cargo loaded', fog: 0x081a30, rail: 0x60dce6, deck: 0x173647 }),
  Object.freeze({ id: 'canyon', name: 'Amber canyon', delivery: 'Canyon beacon powered', fog: 0x291911, rail: 0xffc474, deck: 0x674635 }),
  Object.freeze({ id: 'destination', name: 'Receiving station', delivery: 'Supplies delivered', fog: 0x17172f, rail: 0xc6bcff, deck: 0x373d61 })
]);
export const sectorForRound = round => ROCKET_SECTORS[round < 3 ? 0 : round < 7 ? 1 : 2];

// Feedback teaches a phoneme as well as scoring the target. Reuse the existing
// sound-vetted pools for EVERY option; a raw initial spelling cannot license
// short-a feedback for "all" or unvoiced-th feedback for "that".
const feedbackOnsets = new Map(rocketRunTargets().flatMap(target => wordsStartingWithTargetSound(target).map(word => [word, target])));
export const rocketRunWordOnset = word => feedbackOnsets.get(String(word).toLowerCase()) || '';

export function flightRandom(seed = 1) {
  let value = Number(seed) >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function buildFlightPlan(difficulty = 'easy', seed = 1) {
  const requested = String(difficulty).toLowerCase();
  difficulty = ['hard', 'high'].includes(requested) ? 'hard' : ['medium', 'mid'].includes(requested) ? 'medium' : 'easy';
  const random = flightRandom(seed);
  const count = difficulty === 'hard' ? 12 : difficulty === 'medium' ? 9 : 5;
  const sources = rocketRunLadder(difficulty).map(target => buildRocketRunRound(target, {
    count, difficulty, random, wordFilter: word => Boolean(rocketRunWordAudioPath(word) && rocketRunWordOnset(word))
  }));
  const lanes = sources.flatMap(source => source.correct).map((_, index) => index % 3);
  for (let index = lanes.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [lanes[index], lanes[other]] = [lanes[other], lanes[index]];
  }
  let laneIndex = 0;
  return Object.freeze(sources.map((source, index) => {
    const target = source.targetGrapheme;
    if (source.correct.length < (difficulty === 'easy' ? 5 : 6) || source.distractors.length < 4) {
      throw new Error(`Rocket Run ${difficulty}/${target} needs more distinct recorded words`);
    }
    return Object.freeze({
      index, target, sector: sectorForRound(index).id,
      gates: Object.freeze(source.correct.map((word, gateIndex) => {
        const pool = Object.freeze(source.distractors.map((_, offset) => source.distractors[(gateIndex * 2 + offset) % source.distractors.length]));
        return Object.freeze({ id: `${difficulty}:${index}:${gateIndex}`, target, word,
          distractors: Object.freeze(pool.slice(0, 2)), distractorPool: pool,
          lane: lanes[laneIndex++], retrySeed: Math.floor(random() * 4294967296) });
      }))
    });
  }));
}

// The supplemental instruction catalogue also holds exact isolated word keys.
// Use the same resolver for authored selection and playback; a missing recording
// must never silently become a default required cue. Delivery is still measured
// by the parent's audio lifecycle, not inferred from this catalogue lookup.
export function rocketRunWordAudioPath(word) {
  if (hasKnownBadWordAudio(word)) return '';
  return [getLedaWordAudioPath(word), getLedaInstructionAudioPath(word)]
    .find(path => path && !isKnownBadAudioPath(path)) || '';
}

export function flightChoices(gate, attempt = 0) {
  attempt = Number.isFinite(attempt) ? Math.max(0, Math.trunc(attempt)) : 0;
  const pool = gate.distractorPool || gate.distractors;
  const words = [pool[(attempt * 2) % pool.length], pool[(attempt * 2 + 1) % pool.length]];
  const lane = attempt ? Math.floor(flightRandom((gate.retrySeed || 0) ^ Math.imul(attempt, 0x9e3779b1))() * 3) : gate.lane;
  words.splice(lane, 0, gate.word);
  return Object.freeze(words.map((word, lane) => Object.freeze({ id: `${gate.id}:${attempt}:${lane}`, word, lane })));
}

// Screen centres are the sole gate layout. The renderer unprojects these
// centres onto one world plane; steering, labels and flight contact use them.
export function flightLayout(width, height) {
  // Short landscape uses a side launch bay: header + labels + feedback +
  // controls already occupy its height. The ship and rails share these anchors.
  const sideLaunch = height < 360 && width >= 480;
  const margin = width < 400 ? 12 : 24;
  const gap = width < 400 ? 12 : 20;
  const launchWidth = sideLaunch ? 76 : 0;
  const labelWidth = Math.min(160, (width - margin * 2 - gap * 2 - launchWidth) / 3);
  const stride = Math.min((width - margin * 2) / 3, labelWidth + gap + (width > 700 ? 46 : 0));
  const labelY = Math.max(92, Math.min(height - 154, height * 0.48));
  const centre = (width + launchWidth) / 2;
  const centres = Object.freeze([centre - stride, centre, centre + stride]);
  const shipY = sideLaunch ? labelY : (labelY + 28 + height - 126) / 2;
  return Object.freeze({ width, height, labelWidth, labelHeight: 56, labelY, gateZ: -1.8, shipZ: 4.05,
    centres, sideLaunch, shipY, shipHeight: sideLaunch ? 38 : Math.min(90, height - 126 - labelY - 44),
    shipWidth: sideLaunch ? 64 : 76,
    shipCentres: sideLaunch ? Object.freeze([38, 48, 58]) : centres });
}

export function createFlightRun(difficulty = 'easy', startRound = 0, seed = 1) {
  const plan = buildFlightPlan(difficulty, seed);
  return { plan, round: Math.max(0, Math.min(plan.length - 1, Number.isFinite(startRound) ? Math.trunc(startRound) : 0)), gate: 0, attempt: 0,
    phase: 'approach', time: 0, lane: 1, nominated: false, paused: false,
    firstResponses: [], assistedRetries: [], mediaEvents: [], support: [], deliveries: [],
    audio: 'pending', score: 0, words: 0, flightBonuses: 0, receipt: null };
}
export const currentFlightGate = state => state.plan[state.round].gates[state.gate];
export const currentFlightChoices = state => flightChoices(currentFlightGate(state), state.attempt);

export function steerFlight(state, direction) {
  if (state.paused || !['approach', 'decision'].includes(state.phase) || !Number.isFinite(direction) || direction === 0) return false;
  state.lane = Math.max(0, Math.min(2, state.lane + Math.sign(direction)));
  state.nominated = true;
  return true;
}

export function nominateFlight(state, lane) {
  if (state.paused || state.phase !== 'decision' || ![0, 1, 2].includes(lane)) return false;
  state.lane = lane;
  state.nominated = true;
  return true;
}

export function flightCanCommit(state) {
  return !state.paused && state.phase === 'decision' && state.nominated && [0, 1, 2].includes(state.lane) &&
    (state.audio === 'completed' || state.support.includes('printed_sound_support'));
}

export function commitFlight(state) {
  if (!flightCanCommit(state)) return null;
  const gate = currentFlightGate(state);
  const choice = currentFlightChoices(state)[state.lane];
  const correct = choice.word === gate.word;
  const event = Object.freeze({
    learningSlot: gate.id, target: gate.target, expectedResponse: gate.word, response: choice.word,
    responseId: choice.id, correct, attempts: state.attempt + 1,
    construct: 'printed_word_initial_sound_discrimination', practiceOnly: true, independent: false,
    audioDelivery: state.audio,
    cueHistory: snapshotEvidence(state.mediaEvents),
    supportUsed: Object.freeze(['printed_grapheme', 'printed_choices', ...state.support,
      ...(state.attempt ? ['specific_onset_feedback', 'retry_same_target'] : [])])
  });
  (state.attempt ? state.assistedRetries : state.firstResponses).push(event);
  state.lastResponse = event;
  state.phase = correct ? 'commit' : 'return';
  state.time = 0;
  state.feedback = correct ? `${choice.word} begins with ${gate.target}. Gate powered!`
    : `${choice.word} begins with ${onsetGrapheme(choice.word)}. Find ${gate.target}.`;
  if (correct) {
    state.score += 10;
    state.words += 1;
    const finalGate = state.gate === state.plan[state.round].gates.length - 1;
    if (finalGate) state.deliveries.push(Object.freeze({ round: state.round, sector: state.plan[state.round].sector, target: gate.target }));
    if (finalGate && state.round === state.plan.length - 1) {
      // Fixed at the final deliberate answer, before docking/exit can occur.
      const wrong = state.firstResponses.filter(item => !item.correct).length;
      state.receipt = Object.freeze({ stars: rocketRunStars(state.words, state.words, wrong), score: state.score, words: state.words,
        evidence: Object.freeze({ practiceOnly: true, independent: false, construct: event.construct,
          phase: 'complete', firstResponses: Object.freeze([...state.firstResponses]),
          assistedRetries: Object.freeze([...state.assistedRetries]),
          deliveries: Object.freeze([...state.deliveries]), audioDelivery: state.audio,
          supportUsed: Object.freeze([...new Set([...state.firstResponses, ...state.assistedRetries].flatMap(item => item.supportUsed))]) }) });
    }
  }
  return event;
}

export function advanceFlight(state, delta = FLIGHT_STEP) {
  if (state.paused || ['checkpoint', 'complete'].includes(state.phase) || !Number.isFinite(delta) || delta <= 0) return null;
  state.time += delta;
  if (state.phase === 'approach' && state.time >= 0.75) { state.phase = 'decision'; state.time = 0; return 'decision'; }
  if (state.phase === 'return' && state.time >= 1.15) {
    state.attempt += 1; state.nominated = false; state.phase = 'decision'; state.time = 0; state.audio = 'pending';
    return 'retry';
  }
  if (state.phase === 'commit' && state.time >= 0.9) {
    if (state.receipt) { state.phase = 'complete'; return 'complete'; }
    if (state.gate === state.plan[state.round].gates.length - 1) {
      state.phase = 'checkpoint'; state.time = 0; return 'checkpoint';
    }
    state.gate += 1; resetFlightGate(state); return 'gate';
  }
  return null;
}

function resetFlightGate(state) {
  state.attempt = 0; state.time = 0; state.phase = 'approach'; state.nominated = false;
  state.mediaEvents = []; state.support = []; state.audio = 'pending'; state.feedback = '';
}
export function continueFlight(state) {
  if (state.paused || state.phase !== 'checkpoint' || state.round >= state.plan.length - 1) return false;
  state.round += 1; state.gate = 0; resetFlightGate(state); return true;
}

export function flightBonus(state) {
  // Optional flight activity is deliberately absent from score and receipt.
  if (!state.paused && ['approach', 'commit'].includes(state.phase)) state.flightBonuses += 1;
}

function snapshotEvidence(value) {
  if (!value || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value) ? value.map(snapshotEvidence)
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshotEvidence(item)])));
}
