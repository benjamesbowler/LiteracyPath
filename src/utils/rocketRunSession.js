import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { phonemeAudioCandidates } from '../data/phonemeAudioBank.js';
import { ROCKET_RUN_CONTENT_VERSION, newRocketRunEvidence, rocketRunCatchResponse, completeRocketRunRound } from './rocketRunEvidence.js';
import { ROCKET_COURIER_SPAWN_Z, ROCKET_COURIER_PASS_Z } from './rocketRunCourierSimulation.js';

const integer = (value, max = 999999) => Number.isInteger(value) && value >= 0 && value <= max;
const finite = (value, min = 0, max = 86400) => Number.isFinite(value) && value >= min && value <= max;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const reasons = rows => Array.isArray(rows) && rows.length <= 24
  && rows.every(row => typeof row === 'string' && row.length > 0 && row.length <= 100);
const source = value => ['keyboard', 'pointer', 'touch', 'assistive'].includes(value);

/** This is the existing scoped learn_games practice sidecar. Validation
 * reconstructs every language event against the actual seeded bank, retaining
 * a wrong first response and an accepted word through motor Retry/resume.
 * No held Catch intent is allowed to survive a saved-session boundary. */
export function validateRocketRunSession(value, { seed, round, journeyIndex = 0, plans, difficulty = 'easy' }) {
  const plan = plans?.[round], flight = value?.flight;
  if (!integer(seed, 0xffffffff) || !integer(round, 9) || !integer(journeyIndex, 99999)
    || !plan || !value || value.version !== ROCKET_RUN_CONTENT_VERSION
    || value.seed !== seed || value.round !== round || value.target !== plan.target
    || value.journeyIndex !== journeyIndex || !integer(value.originRound, round)
    || !finite(value.elapsed) || !finite(value.foregroundElapsed, value.elapsed)
    || !finite(value.distance, 0, 1e8) || !finite(value.spawnIn, -1, 10)
    || value.hazardOriginDistance !== undefined && !finite(value.hazardOriginDistance, 0, value.distance)
    || !integer(value.nextFlightId) || value.nextFlightId < 1
    || !integer(value.motorPassages) || !integer(value.styleScore)
    || value.supportReasons!==undefined&&!reasons(value.supportReasons)
    || typeof value.completed !== 'boolean' || typeof value.paused !== 'boolean' || value.intent !== null
    || !flight || !integer(flight.lane, 2) || !finite(flight.x, -3, 3)
    || !finite(flight.velocity, -80, 80) || !finite(flight.bank, -.24, .24)
    || !integer(flight.hearts, 3) || !finite(flight.immunity, 0, 1.4)
    || flight.stopped !== (flight.hearts === 0)
    || !['motorHits', 'motorMisses', 'motorRetries'].every(key => integer(flight[key]))) return null;
  const evidence = value.evidence;
  const arrays = ['firstResponses', 'assistedRetries', 'acceptedResponses', 'completions', 'audioReceipts', 'audioStarts'];
  if (!evidence || arrays.some(key => !Array.isArray(evidence[key]) || evidence[key].length > 5000)) return null;
  const validCue = receipt => {
    const target = plans[receipt?.round];
    if (!target || !integer(receipt.round, round) || receipt.round < value.originRound
      || !finite(receipt.at, 0, value.foregroundElapsed)) return false;
    if (receipt.kind === 'target-phoneme') return receipt.target === target.target
      && phonemeAudioCandidates(target.target).includes(receipt.src);
    const trial = target.choices.find(row => row.id === receipt.trialId);
    return receipt.kind === 'approach-word' && trial && receipt.word === trial.word
      && integer(receipt.flightId) && receipt.flightId > 0
      && getLedaWordAudioPath(trial.word) === receipt.src && Boolean(receipt.src);
  };
  if (!evidence.audioReceipts.every(validCue)
    || !evidence.audioStarts.every(receipt => validCue(receipt) && receipt.kind === 'approach-word')) return null;
  if (value.activeTargetReceipt !== null && (!validCue(value.activeTargetReceipt)
    || value.activeTargetReceipt.round !== round || value.activeTargetReceipt.kind !== 'target-phoneme'
    || !evidence.audioReceipts.some(receipt => same(receipt, value.activeTargetReceipt)))) return null;
  let rebuilt = { ...newRocketRunEvidence(), audioReceipts: structuredClone(evidence.audioReceipts),
    audioStarts: structuredClone(evidence.audioStarts) };
  let currentCaught = [], lastAt = -1;
  for (let index = value.originRound; index <= round; index++) {
    const target = plans[index];
    if (!target) return null;
    let caughtIds = [];
    const rows = [...evidence.firstResponses, ...evidence.assistedRetries]
      .filter(row => row.round === index).sort((left, right) => left.at - right.at);
    for (const row of rows) {
      if (!finite(row.at, lastAt, value.foregroundElapsed) || !source(row.source)
        || !reasons(row.supportReasons) || !Array.isArray(row.choices)
        || row.choices.length > target.choices.length) return null;
      const response = rocketRunCatchResponse(rebuilt, target, {
        trialId: row.trialId, caughtIds, at: row.at, source: row.source,
        supportReasons: row.supportReasons, targetReceipt: row.deliveryReceipt,
        wordReceipt: row.wordAudioReceipt, wordStarted: row.wordAudioStart,
        presentedChoices: row.choices, difficulty,
      });
      if (!response.row || !same(response.row, row)) return null;
      rebuilt = response.evidence; caughtIds = response.caughtIds; lastAt = row.at;
    }
    const completion = evidence.completions.find(row => row.round === index);
    if (index < round || value.completed) {
      if (!completion || !finite(completion.at, lastAt, value.foregroundElapsed)
        || !reasons(completion.supportReasons)) return null;
      rebuilt = completeRocketRunRound(rebuilt, target, caughtIds, completion.at, completion.supportReasons);
      if (!same(rebuilt.completions.at(-1), completion)) return null;
      lastAt = completion.at;
    } else if (completion || caughtIds.length >= target.needed) return null;
    if (index === round) currentCaught = caughtIds;
  }
  if (!arrays.every(key => same(rebuilt[key], evidence[key])) || !same(currentCaught, value.caughtIds)) return null;
  if (!Array.isArray(value.queue) || value.queue.length > plan.choices.length
    || !Array.isArray(value.carriers) || value.carriers.length > 6) return null;
  const identities = [], flightIds = new Set();
  for (const queued of value.queue) {
    if (!plan.choices.some(row => row.id === queued.trialId) || !integer(queued.misses)
      || value.caughtIds.includes(queued.trialId)) return null;
    identities.push(queued.trialId);
  }
  for (const carrier of value.carriers) {
    const trial = plan.choices.find(row => row.id === carrier.trialId);
    if (!trial || carrier.word !== trial.word || value.caughtIds.includes(trial.id)
      || !integer(carrier.flightId, value.nextFlightId - 1) || carrier.flightId < 1
      || flightIds.has(carrier.flightId) || !integer(carrier.lane, 2)
      || !finite(carrier.x, -3, 3) || !finite(carrier.z, ROCKET_COURIER_SPAWN_Z, ROCKET_COURIER_PASS_Z)
      || carrier.radius !== .43 || carrier.depthRadius !== .24 || !integer(carrier.misses)
      || carrier.alive !== true || carrier.passed !== false || typeof carrier.approachSpoken !== 'boolean') return null;
    flightIds.add(carrier.flightId); identities.push(carrier.trialId);
  }
  if (new Set(identities).size !== identities.length
    || plan.choices.some(row => row.correct && !value.caughtIds.includes(row.id) && !identities.includes(row.id))) return null;
  const restored = structuredClone(value);
  // Geometry and audibility are re-evaluated by the actual renderer after
  // mount/resize. A persisted boolean cannot claim that an off-screen word is
  // a readable decision or that a new playback has already started.
  restored.carriers.forEach(carrier => { carrier.visible = false; carrier.readable = false; carrier.approachSpoken = false; });
  restored.paused = false;
  return restored;
}

export function loadRocketRunSession(scope, difficulty, context) {
  return validateRocketRunSession(loadLearnGamesProgress(scope).games['rocket-run']?.practiceSession?.[difficulty], context);
}

export function saveRocketRunSession(scope, difficulty, state) {
  const current = loadLearnGamesProgress(scope), prior = current.games['rocket-run'] || {};
  const next = { ...current, games: { ...current.games, 'rocket-run': { ...prior,
    practiceSession: { ...(prior.practiceSession || {}), [difficulty]: { ...state,
      version: ROCKET_RUN_CONTENT_VERSION, checkpointSemantics: 'active-question-index', intent: null } } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress) }; }
}
