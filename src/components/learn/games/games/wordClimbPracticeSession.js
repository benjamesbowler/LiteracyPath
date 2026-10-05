import { WORD_CLIMB_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../../../utils/learnGamesProgress.js';
import { wordClimbSummitFor } from '../../../../utils/wordClimbLevels.js';
import { createClimbJourney } from './wordClimbJourney.js';
import { climbLayoutRevision, isPacedClimb, pacedClimbSection } from './wordClimbPacedRoute.js';
import { newWordClimbEvidence, validWordClimbEvidence, wordClimbRounds } from './wordClimbLearning.js';

const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const strings = (values, max = 80) => Array.isArray(values) && values.length <= max && values.every(value => typeof value === 'string' && value.length > 0 && value.length <= 80);
const reasons = values => strings(values, 24);

// Math.sin can differ by one ULP across JavaScript engines. Accept that
// sub-physics rounding only for the generated branch x coordinate; every
// authored identity, field, order and other dimension remains exact.
const sameObstacles = (values, reference) => Array.isArray(values) && values.length === reference.length
  && values.every((value, index) => {
    const original = reference[index];
    if (!value || Object.keys(value).join('|') !== Object.keys(original).join('|')) return false;
    return Object.keys(original).every(key => key === 'x'
      ? Number.isFinite(value.x) && Math.abs(value.x - original.x) <= 1e-9
      : value[key] === original[key]);
  });

export function createWordClimbPracticeState(session, world, { difficulty, seed, journeyIndex, originStep = 0, legacyResume = false, legacyCompletedResume = false }) {
  return { version: WORD_CLIMB_CONTENT_VERSION, difficulty, seed, journeyIndex, stageIndex: world.journey.stageIndex,
    originStep, legacyResume, legacyCompletedResume, session, world, evidence: newWordClimbEvidence(), supportReasons: {}, feedback: '' };
}

// A previously completed legacy summit remains historical. Returning to its
// saved view must not emit a new performance with an invented response prefix.
export function isHistoricalWordClimbCompletion(value) {
  return Boolean(value?.legacyResume && value.legacyCompletedResume && value.world?.completed
    && value.world.step === value.world.summit && value.evidence
    && !value.evidence.firstResponses.length && !value.evidence.assistedRetries.length
    && !value.evidence.acceptedResponses.length && !value.evidence.completions.length);
}

export function validateWordClimbPracticeSession(value, difficulty, seed, journeyIndex) {
  try { if (JSON.stringify(value).length > 2000000) return null; } catch { return null; }
  const summit = wordClimbSummitFor(difficulty), base = { easy: 0, medium: 1, hard: 2 }[difficulty];
  if (!value || value.version !== WORD_CLIMB_CONTENT_VERSION || value.difficulty !== difficulty || value.seed !== seed || value.journeyIndex !== journeyIndex
    || !integer(seed, 0, Number.MAX_SAFE_INTEGER) || !integer(journeyIndex, 0, 11) || !integer(value.stageIndex, 0, Number.MAX_SAFE_INTEGER)
    || !integer(value.originStep, 0, summit - 1) || typeof value.legacyResume !== 'boolean' || typeof value.legacyCompletedResume !== 'boolean'
    || (!value.legacyResume && value.stageIndex !== base + journeyIndex * 3)
    || (value.legacyCompletedResume && !value.legacyResume)
    || typeof value.feedback !== 'string' || value.feedback.length > 500) return null;
  const session = value.session, world = value.world;
  const layoutRevision=climbLayoutRevision(world?.journey);
  if(!layoutRevision)return null;
  let template;
  try{template=session?.round?createClimbJourney(session,value.stageIndex,0,()=>.32,{layoutRevision}):null;}catch{return null;}
  if(!template)return null;
  const maxHeight=template.summitHeight+700;
  if (!session || session.difficulty !== difficulty || session.summit !== summit || typeof session.target !== 'string' || !/^[a-z_]{1,8}$/.test(session.target)
    || session.round?.targetGrapheme !== session.target || !strings(session.round?.correct) || !session.round.correct.length
    || !strings(session.round.distractors) || session.round.distractors.length < 2 || session.round.distractors.some(word => session.round.correct.includes(word))
    || !world || !Array.isArray(world.platforms) || world.platforms.length > 400 || world.summit !== summit
    || !integer(world.step, value.originStep, summit) || typeof world.completed !== 'boolean' || world.completed !== (world.step === summit)
    || !['grounded', 'landed', 'airborne', 'clinging', 'recovering', 'climbing', 'gripping'].includes(world.state)
    || !finite(world.x, -300, 1300) || !finite(world.y, -300, maxHeight) || !finite(world.camera, -500, maxHeight)
    || !finite(world.vx, -5000, 5000) || !finite(world.vy, -5000, 5000) || !finite(world.elapsed, 0, 1e8) || !finite(world.landingTime, -1, 10)
    || !integer(world.wrong, 0, 100000) || !integer(world.motorFalls, 0, 100000) || !world.journey || world.journey.stageIndex !== value.stageIndex
    || !['climb', 'word'].includes(world.journey.phase) || !finite(world.journey.activeSeconds, 0, 1e8) || !finite(world.journey.branchStartX, -300, 1300)) return null;
  const expected = new Map(template.platforms.map(platform => [platform.id, platform]));
  if (world.platforms.length !== expected.size || new Set(world.platforms.map(platform => platform.id)).size !== expected.size
    || world.platforms.some(platform => { const original = expected.get(platform?.id); return !original || ['row', 'x', 'y', 'width', 'kind'].some(key => platform[key] !== original[key])
      || (platform.kind !== 'word' && (platform.correct !== true || platform.word !== '')); })) return null;
  for (let row = 1; row <= summit; row++) {
    const choices = world.platforms.filter(platform => platform.row === row && platform.kind === 'word');
    const correct = choices.filter(platform => platform.correct);
    if (choices.length !== 3 || new Set(choices.map(platform => platform.word)).size !== 3 || correct.length !== 1
      || correct[0].word !== [...new Set(session.round.correct)][(row - 1) % new Set(session.round.correct).size]
      || choices.some(platform => typeof platform.correct !== 'boolean' || (platform.correct ? !session.round.correct.includes(platform.word) : !session.round.distractors.includes(platform.word)))) return null;
  }
  const safe = world.platforms.find(platform => platform.id === world.safeId && platform.correct);
  if (!safe || (world.standingId !== null && !expected.has(world.standingId)) || (world.targetId !== null && !expected.has(world.targetId))) return null;
  const journey = world.journey, reference = template.journey;
  if (['travelPerSection', 'sectionHeight', 'summit'].some(key => journey[key] !== reference[key])
    || world.summitHeight !== template.summitHeight || !Array.isArray(journey.obstacles) || !Array.isArray(journey.lights)
    || !sameObstacles(journey.obstacles, reference.obstacles) || JSON.stringify(journey.lights) !== JSON.stringify(reference.lights)
    || !strings(journey.collected, reference.lights.length) || new Set(journey.collected).size !== journey.collected.length
    || journey.collected.some(id => !reference.lights.some(light => light.id === id))
    || !journey.safeRest || journey.safeRest.id !== world.safeId || journey.safeRest.y !== safe.y
    || !finite(journey.safeRest.x, safe.x - safe.width / 2 - 25, safe.x + safe.width / 2 + 25)) return null;
  if(isPacedClimb(journey)){
    if(journey.crossingSpan!==reference.crossingSpan||!Array.isArray(journey.routeChoices)||journey.routeChoices.length!==summit
      ||journey.routeChoices.some((side,index)=>![-1,0,1].includes(side)||(index>world.step&&side!==0)
        ||(index>=value.originStep&&index<world.step&&side===0)))return null;
    if(journey.crossing){
      const crossing=journey.crossing,route=pacedClimbSection(journey,world.step);
      if(Object.keys(crossing).sort().join('|')!=='phase|side|y'||!['out','back'].includes(crossing.phase)||![-1,0,1].includes(crossing.side)
        ||world.completed||journey.phase!=='climb'||world.y!==crossing.y||crossing.y!==(crossing.phase==='out'?route.first:route.second)
        ||(crossing.phase==='out'&&journey.routeChoices[world.step]!==0)
        ||(crossing.phase==='back'&&(!crossing.side||journey.routeChoices[world.step]!==crossing.side))
        ||!finite(world.x,Math.min(500,500+crossing.side*route.span)-8,Math.max(500,500+crossing.side*route.span)+8))return null;
    }
  }else if(journey.crossing!==undefined||journey.routeChoices!==undefined||journey.crossingSpan!==undefined)return null;
  if (journey.recovery && (!finite(journey.recovery.time, 0, .7) || !finite(journey.recovery.from?.x, -300, 1300)
    || !finite(journey.recovery.from?.y, -300, maxHeight) || journey.recovery.to?.id !== world.safeId
    || journey.recovery.to.y !== safe.y || !finite(journey.recovery.to.x, safe.x - safe.width / 2 - 25, safe.x + safe.width / 2 + 25))) return null;
  const rounds = wordClimbRounds(world, session, value);
  if (!validWordClimbEvidence(value.evidence, rounds) || !value.supportReasons || typeof value.supportReasons !== 'object' || Array.isArray(value.supportReasons)
    || Object.entries(value.supportReasons).some(([id, support]) => !rounds.some(round => round.roundId === id) || !reasons(support))) return null;
  const earned = value.evidence.completions.map(id => rounds.find(round => round.roundId === id).row).sort((a, b) => a - b);
  if (value.legacyCompletedResume) {
    if (!world.completed || value.evidence.firstResponses.length || value.evidence.assistedRetries.length || earned.length) return null;
  } else if (world.step !== value.originStep + earned.length || earned.some((row, index) => row !== value.originStep + index + 1)) return null;
  if (value.evidence.firstResponses.some(row => row.row > world.step + 1) || value.evidence.assistedRetries.some(row => row.row > world.step + 1)) return null;
  return structuredClone({ ...value, world: { ...world, paused: false, event: null } });
}

export function loadWordClimbPracticeSession(scope, difficulty, seed, journeyIndex) {
  return validateWordClimbPracticeSession(loadLearnGamesProgress(scope).games['word-climb']?.practiceSession?.[difficulty], difficulty, seed, journeyIndex);
}

export function saveWordClimbPracticeSession(scope, difficulty, state, feedback = state.feedback) {
  const snapshot = structuredClone({ ...state, feedback, world: { ...state.world, paused: false, event: null } });
  const current = loadLearnGamesProgress(scope), previous = current.games['word-climb'] || {};
  const next = { ...current, games: { ...current.games, 'word-climb': { ...previous, practiceSession: { ...(previous.practiceSession || {}), [difficulty]: snapshot } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true, syncPending: false, snapshot }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress), syncPending: Boolean(error.savedProgress), snapshot }; }
}
