import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { RALLY_PALS_CONTENT_VERSION, RALLY_PALS_POINTS } from './rallyPalsRules.js';

// Bounded mutable state belongs to the existing profile-scoped practiceSession.
export function saveRallyPalsSession(scope, difficulty, state) {
  const progress = loadLearnGamesProgress(scope);
  const previous = progress.games['rally-pals'] || {};
  try {
    saveLearnGamesProgress(scope, { ...progress, games: { ...progress.games, 'rally-pals': { ...previous,
      practiceSession: { ...(previous.practiceSession || {}), [difficulty]: { ...state,
        version: RALLY_PALS_CONTENT_VERSION, checkpointSemantics: 'active-question-index' } },
    } } });
    return { localSaved: true };
  } catch (error) { return { localSaved: Boolean(error.savedProgress) }; }
}

export function loadRallyPalsSession(scope, difficulty, seed, cursor, rounds) {
  const state = loadLearnGamesProgress(scope).games['rally-pals']?.practiceSession?.[difficulty];
  if (!state || state.version !== RALLY_PALS_CONTENT_VERSION || state.checkpointSemantics !== 'active-question-index'
    || state.seed !== seed || state.cursor !== cursor || state.index !== cursor
    || !Number.isInteger(state.index) || state.index < 0 || state.index >= rounds.length
    || state.roundId !== rounds[state.index].roundId || !['serve','rally','point','complete'].includes(state.phase)
    || (state.mode!==undefined&&!['match','coop','targets'].includes(state.mode))
    || (state.targetHits!==undefined&&(!Number.isInteger(state.targetHits)||state.targetHits<0||state.targetHits>10000))
    || (state.targetShots!==undefined&&(!Number.isInteger(state.targetShots)||state.targetShots<0||state.targetShots>10000||state.targetHits>state.targetShots))
    || (state.learningAim!==undefined&&![null,0,1,2].includes(state.learningAim))
    || (state.aimX!==undefined&&state.aimX!==null&&(!Number.isFinite(state.aimX)||Math.abs(state.aimX)>4.6))
    || (state.learningAimX!==undefined&&state.learningAimX!==null&&(!Number.isFinite(state.learningAimX)||Math.abs(state.learningAimX)>4.6))
    || [state.aimZ,state.learningAimZ].some(z=>z!==undefined&&(!Number.isFinite(z)||z< -8.5||z> -3.8))
    || [state.assisted,state.rallyPause,state.visualModel].some(value=>value!==undefined&&typeof value!=='boolean')
    || (state.pictureDelivery!==undefined&&!['pending','delivered','unavailable'].includes(state.pictureDelivery))
    || (state.motorMisses!==undefined&&(!Number.isInteger(state.motorMisses)||state.motorMisses<0||state.motorMisses>10000))
    || ![null,0,1,2].includes(state.aim) || !Number.isInteger(state.wrong) || state.wrong < 0 || state.wrong > 1000
    || !Array.isArray(state.supportReasons) || state.supportReasons.length > 30 || state.supportReasons.some(reason=>typeof reason!=='string'||reason.length>100)
    || !['pending','delivered','unavailable'].includes(state.delivery)
    || !Array.isArray(state.evidence?.firstResponses) || !Array.isArray(state.evidence?.assistedRetries)
    || !Array.isArray(state.evidence?.completions) || state.evidence.firstResponses.length > RALLY_PALS_POINTS
    || state.evidence.assistedRetries.length > RALLY_PALS_POINTS * 12
    || !Number.isFinite(state.score) || state.score !== state.evidence.completions.length * 10
    || !Number.isInteger(state.matchPoints) || state.matchPoints < 0 || state.matchPoints > RALLY_PALS_POINTS
    || !Number.isInteger(state.bestRally) || state.bestRally < 0 || state.bestRally > 10000
    || !['meadow','rooftop','moonwood'].includes(state.court)) return null;
  const known = new Map(rounds.map((round,index) => [round.roundId, { round,index }]));
  const valid = row => {
    const item = known.get(row?.roundId);
    return item && item.index <= state.index && row.itemId === item.round.id && row.word === item.round.word
      && row.expected === item.round.expected && item.round.choices.includes(row.selected)
      && row.correct === (row.selected === row.expected) && row.practiceOnly === true && row.wordVisible === false
      && Array.isArray(row.supportReasons) && row.supportReasons.length<=30 && row.supportReasons.every(reason=>typeof reason==='string'&&reason.length<=100)
      && ['pending','delivered','unavailable'].includes(row.deliveryAtResponse) && ['pending','delivered','unavailable'].includes(row.pictureDelivery)
      && row.stimulusDelivered===(row.deliveryAtResponse==='delivered') && typeof row.motorAssist==='boolean' && typeof row.visualModel==='boolean' && typeof row.independentPractice==='boolean' && (!row.independentPractice || (row.deliveryAtResponse === 'delivered'
        && row.pictureDelivery === 'delivered' && row.supportReasons.length === 0 && !row.visualModel));
  };
  if (!state.evidence.firstResponses.every(valid) || !state.evidence.assistedRetries.every(row => valid(row) && !row.independentPractice)
    || new Set(state.evidence.firstResponses.map(row => row.roundId)).size !== state.evidence.firstResponses.length
    || new Set(state.evidence.completions).size !== state.evidence.completions.length
    || state.evidence.completions.some(id => !known.has(id) || known.get(id).index > state.index
      || ![...state.evidence.firstResponses,...state.evidence.assistedRetries].some(row => row.roundId === id && row.correct))
    || (state.phase !== 'serve' && !state.evidence.completions.includes(state.roundId))) return null;
  return state;
}
