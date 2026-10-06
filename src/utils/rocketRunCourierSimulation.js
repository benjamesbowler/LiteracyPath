import { gameRandom } from './gameReplay.js';
import { rocketWordSpeed, rocketWordSpacing } from '../components/learn/games/shared/rocketApproach.js';
import { rocketFlightState, stepRocketFlight, steerRocketFlight, rocketFlightContact, hitRocketMeteor, retryRocketFlight } from './rocketRunFlightMotion.js';
import { armRocketIntent, validRocketIntent, consumeRocketIntent } from './rocketRunIntent.js';
import { newRocketRunEvidence, rocketRunCatchResponse, completeRocketRunRound } from './rocketRunEvidence.js';
import { returnRocketTrial } from './rocketRunV2Rounds.js';

export const ROCKET_COURIER_SPAWN_Z = -46;
export const ROCKET_COURIER_CONTACT_Z = -1.8;
export const ROCKET_COURIER_PASS_Z = -.8;
const canonical = (plan, id) => plan.choices.find(row => row.id === id);
const latest = (rows, predicate) => {
  for (let index = rows.length - 1; index >= 0; index--) if (predicate(rows[index])) return rows[index];
  return null;
};

/** Teaching anticipation and physical travel use the same bounded speed,
 * including the next queued recording. A long incoming word cannot acquire
 * a falsely short time-to-contact before its capsule is spawned. */
export function rocketCourierSpeed(state, plan, requestedSpeed = 11, clipSeconds = () => .8) {
  const next = canonical(plan, state.queue[0]?.trialId);
  const duration = word => Math.max(.4, Number(clipSeconds(word)) || .8);
  const longest = Math.max(.8, next ? duration(next.word) : 0,
    ...state.carriers.filter(row => row.alive).map(row => duration(row.word)));
  return { speed: rocketWordSpeed(requestedSpeed, longest), longest };
}

/** The physical queue contains the original authored trial identities. A
 * return changes its flight instance and position, never its word or answer. */
export function createRocketCourierState(plan, { seed = 0, lane = 1, laneX = value => [-2.2, 0, 2.2][value],
  evidence = newRocketRunEvidence(), caughtIds = [], elapsed = 0, foregroundElapsed = elapsed } = {}) {
  return {
    round: plan.round, target: plan.target, seed, elapsed, foregroundElapsed, spawnIn: .4,
    flight: rocketFlightState({ lane, x: laneX(lane) }),
    nextFlightId: 1, queue: plan.choices.filter(row => !caughtIds.includes(row.id)).map(row => ({ trialId: row.id, misses: 0 })),
    carriers: [], caughtIds: [...caughtIds], evidence, intent: null,
    activeTargetReceipt: null, paused: false, completed: false, motorPassages: 0,
    styleScore: 0, distance: 0, hazardOriginDistance: 0, supportReasons: [],
  };
}

export function steerRocketCourier(state, direction) {
  if (state.paused || state.completed) return false;
  return steerRocketFlight(state.flight, direction);
}

/** This action is mapped to the visible Catch control and its native key.
 * Steering, boost and a default lane never implicitly arm a response. */
export function selectRocketCourier(state, plan, source) {
  if (state.paused || state.completed || state.flight.stopped) return false;
  state.intent = armRocketIntent(plan, state.carriers, {
    lane: state.flight.lane, source, at: state.foregroundElapsed,
  });
  return Boolean(state.intent);
}

export function pauseRocketCourier(state, paused) {
  state.paused = Boolean(paused);
  // Physical ownership and held input cannot survive a pause boundary. The
  // approaching word itself keeps its authored identity and current position.
  state.intent = null;
}

function returnUncaught(state, plan, carrier) {
  const trial = returnRocketTrial(plan, canonical(plan, carrier.trialId), state.caughtIds, carrier.misses);
  if (!trial) return false;
  if (!state.queue.some(row => row.trialId === trial.id)
    && !state.carriers.some(row => row !== carrier && row.trialId === trial.id && row.alive)) {
    state.queue.push({ trialId: trial.id, misses: trial.misses });
  }
  state.flight.motorMisses += 1;
  return true;
}

/** A single genuine swept contact consumes selection ownership. Passive
 * contacts remain motor events; a different carrier cannot inherit an answer
 * that was deliberately aimed at another printed word. */
export function resolveRocketCourierContact(state, plan, carrier, { difficulty = 'easy' } = {}) {
  const ownership = consumeRocketIntent(state.intent, plan, state.carriers, carrier);
  const selected = state.intent;
  state.intent = ownership.intent;
  const visible = state.carriers.filter(row => row.alive && !row.passed && row.visible && row.readable)
    .map(row => ({ id: row.trialId, word: row.word }));
  let result = null;
  if (ownership.deliberate) {
    const model = latest(state.evidence.audioReceipts, row => row.kind === 'approach-word'
      && row.round === plan.round && row.trialId === carrier.trialId && row.flightId === carrier.flightId);
    const modelStart = latest(state.evidence.audioStarts, row => row.kind === 'approach-word'
      && row.round === plan.round && row.trialId === carrier.trialId && row.flightId === carrier.flightId);
    result = rocketRunCatchResponse(state.evidence, plan, {
      trialId: carrier.trialId, caughtIds: state.caughtIds, at: state.foregroundElapsed,
      source: ownership.source, targetReceipt: state.activeTargetReceipt,
      wordReceipt: model || null, wordStarted: modelStart || null,
      presentedChoices: visible, difficulty,
      supportReasons: [...(state.supportReasons||[]), ...(carrier.misses ? ['motor-return'] : [])],
    });
    state.evidence = result.evidence;
    state.caughtIds = result.caughtIds;
  }
  carrier.alive = false;
  carrier.passed = true;
  if (!result?.row?.correct) returnUncaught(state, plan, carrier);
  const event = {
    type: result?.kind || 'motor-contact', trialId: carrier.trialId,
    flightId: carrier.flightId, word: carrier.word, at: state.foregroundElapsed,
    row: result?.row || null, selectedIntent: selected && structuredClone(selected),
  };
  if (state.caughtIds.length === plan.needed) {
    state.evidence = completeRocketRunRound(state.evidence, plan, state.caughtIds, state.foregroundElapsed,state.supportReasons||[]);
    state.completed = state.evidence.completions.some(row => row.round === plan.round);
    state.intent = null;
  }
  return event;
}

/** Zero-life recovery preserves every accepted word and response. Required
 * carriers return via the same queue; Retry provides visible shield immunity
 * rather than changing the target bank or supplying a language answer. */
export function retryRocketCourier(state, plan) {
  if (!retryRocketFlight(state.flight)) return false;
  state.intent = null;
  for (const carrier of state.carriers) {
    if (carrier.alive) returnUncaught(state, plan, carrier);
  }
  state.carriers = [];
  state.spawnIn = .45;
  return true;
}

/** Fixed-step movement and the first swept collision share world coordinates
 * with the renderer. The supplied presentation derives visible/readable from
 * its actual measured label rects, rather than from word correctness. */
export function stepRocketCouriers(state, plan, seconds, {
  laneX = value => [-2.2, 0, 2.2][value], requestedSpeed = 11,
  clipSeconds = () => .8, presentation = () => ({ visible: false, readable: false }),
  difficulty = 'easy', reducedMotion = false, meteors = [], foregroundAt = null,
} = {}) {
  if (state.paused || state.completed || state.flight.stopped) return [];
  const dt = Math.max(0, Math.min(1 / 120, Number(seconds) || 0));
  if (!dt) return [];
  state.elapsed += dt;
  state.foregroundElapsed = Math.max(state.foregroundElapsed,
    Number.isFinite(foregroundAt) ? foregroundAt : state.foregroundElapsed + dt);
  const beforeX = state.flight.x;
  stepRocketFlight(state.flight, dt, laneX, { reducedMotion });
  const next = canonical(plan, state.queue[0]?.trialId);
  const duration = word => Math.max(.4, Number(clipSeconds(word)) || .8);
  const { speed, longest } = rocketCourierSpeed(state, plan, requestedSpeed, clipSeconds);
  const travel = speed * dt;
  state.distance += travel;
  state.spawnIn -= dt;
  const newest = state.carriers.filter(row => row.alive).sort((a, b) => a.z - b.z)[0];
  const safeSpacing = rocketWordSpeed(Infinity, longest) * rocketWordSpacing(longest, difficulty);
  if (next && state.spawnIn <= 0 && (!newest || newest.z - ROCKET_COURIER_SPAWN_Z >= safeSpacing)) {
    const item = state.queue.shift();
    // Per-instance deterministic lanes survive saving and remain varied when
    // the same required word returns. Assistance positions it in the current
    // lane after two misses, but Catch is still an explicit word decision.
    const random = gameRandom(state.seed ^ Math.imul(state.nextFlightId, 0x45d9f3b));
    const lane = item.misses >= 2 ? state.flight.lane : Math.floor(random() * 3);
    const carrier = {
      trialId: next.id, flightId: state.nextFlightId++, word: next.word,
      lane, x: laneX(lane), z: ROCKET_COURIER_SPAWN_Z,
      radius: .43, depthRadius: .24, misses: item.misses,
      alive: true, passed: false, approachSpoken: false, visible: false, readable: false,
    };
    state.carriers.push(carrier);
    state.spawnIn = rocketWordSpacing(duration(next.word), difficulty);
  }
  const events = [];
  const bodies = [];
  for (const carrier of state.carriers) {
    if (!carrier.alive) continue;
    carrier.x = laneX(carrier.lane);
    if (!carrier.passed) bodies.push({ ...carrier, z: carrier.z - ROCKET_COURIER_CONTACT_Z });
    carrier.z += travel;
    const paint = presentation(carrier);
    carrier.visible = paint.visible === true;
    carrier.readable = paint.readable === true;
  }
  if (!validRocketIntent(state.intent, plan, state.carriers)) state.intent = null;
  const contact = rocketFlightContact({ x: beforeX, z: 0 }, { x: state.flight.x, z: -travel }, bodies);
  if (contact) {
    const carrier = state.carriers.find(row => row.flightId === contact.body.flightId);
    events.push(resolveRocketCourierContact(state, plan, carrier, { difficulty }));
  }
  for (const carrier of state.carriers) {
    if (!carrier.alive || carrier.z <= ROCKET_COURIER_PASS_Z) continue;
    carrier.alive = false; carrier.passed = true;
    if (state.intent?.flightId === carrier.flightId) state.intent = null;
    state.motorPassages += 1;
    const returned = returnUncaught(state, plan, carrier);
    events.push({ type: 'motor-passage', trialId: carrier.trialId, flightId: carrier.flightId,
      word: carrier.word, returned, at: state.foregroundElapsed });
  }
  for (const meteor of state.completed ? [] : meteors) {
    if (meteor.passed || meteor.alive === false) continue;
    const hit = rocketFlightContact({ x: beforeX, z: 0 }, { x: state.flight.x, z: -travel },
      [{ ...meteor, z: meteor.z - ROCKET_COURIER_CONTACT_Z }]);
    if (hit && hitRocketMeteor(state.flight)) {
      state.intent = null;
      meteor.passed = true;
      events.push({ type: 'meteor-hit', id: meteor.id, hearts: state.flight.hearts, at: state.foregroundElapsed });
    }
  }
  state.carriers = state.carriers.filter(row => row.alive);
  return events;
}
