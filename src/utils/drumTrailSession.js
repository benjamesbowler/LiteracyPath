import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { DRUM_TRAIL_CONTENT_VERSION } from '../data/drumTrailContent.js';

// Bounded practice state lives inside the EXISTING scoped learn_games record,
// so existing export/reset boundaries cover it. Mutable resume state is local
// only; shared queue/hydration strips practiceSession, while immutable completed
// evidence uses the existing practiceRecord sync. No extra learner identifier.
export function saveDrumTrailSession(scope, difficulty, state) {
  const current = loadLearnGamesProgress(scope);
  const previous = current.games['drum-trail'] || {};
  const next = { ...current, games: { ...current.games, 'drum-trail': { ...previous,
    practiceSession: { ...(previous.practiceSession || {}), [difficulty]: {
      ...state, version: DRUM_TRAIL_CONTENT_VERSION, checkpointSemantics: 'active-question-index',
    } } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true, syncPending: false }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress), syncPending: Boolean(error.savedProgress) }; }
}

export function loadDrumTrailSession(scope, difficulty, seed, cursor, rounds) {
  const value = loadLearnGamesProgress(scope).games['drum-trail']?.practiceSession?.[difficulty];
  if (!value || value.version !== DRUM_TRAIL_CONTENT_VERSION || value.checkpointSemantics !== 'active-question-index'
    || value.seed !== seed || value.cursor !== cursor || value.index !== value.cursor
    || !Number.isInteger(value.index) || value.index < 0 || value.index >= rounds.length
    || value.roundId !== rounds[value.index].roundId || !['ready', 'retry', 'correct'].includes(value.phase)
    || !Array.isArray(value.evidence?.firstResponses) || !Array.isArray(value.evidence?.assistedRetries)
    || !Array.isArray(value.evidence?.completions) || !Array.isArray(value.supportReasons)
    || !Number.isFinite(value.score) || value.score !== value.evidence.completions.length * 10
    || !['pending','unavailable','delivered'].includes(value.delivery)
    || value.evidence.firstResponses.length > rounds.length
    || value.evidence.assistedRetries.length > rounds.length * 6) return null;
  const byId = new Map(rounds.map((round,index) => [round.roundId,{round,index}]));
  const validResponse = response => {
    const item = byId.get(response?.roundId);
    return item && item.index <= value.index && response.itemId === item.round.id
      && response.expected === item.round.syllables && response.correct === (response.selected === item.round.syllables)
      && item.round.routes.some(route => route.drums === response.selected)
      && response.practiceOnly === true && Array.isArray(response.supportReasons)
      && (!response.independentOralPractice || (response.stimulusDelivered === true
        && response.deliveryAtResponse === 'delivered' && !response.wordVisible && !response.modelUsed && !response.supportReasons.length));
  };
  const firstIds = value.evidence.firstResponses.map(response => response?.roundId);
  if (new Set(firstIds).size !== firstIds.length || !value.evidence.firstResponses.every(validResponse)
    || !value.evidence.assistedRetries.every(response => validResponse(response) && response.independentOralPractice === false)
    || new Set(value.evidence.completions).size !== value.evidence.completions.length
    || value.evidence.completions.some(id => !byId.has(id) || byId.get(id).index > value.index)
    || (value.phase === 'correct' && (!value.evidence.completions.includes(value.roundId)
      || value.selected !== rounds[value.index].syllables))) return null;
  return value;
}
