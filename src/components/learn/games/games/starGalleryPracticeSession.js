import { SENTENCE_GROVE_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../../../utils/learnGamesProgress.js';
import { validSentenceGroveEvidence } from './starGalleryLearning.js';
import { sentenceGroveChoicePositions, SENTENCE_GROVE_MAP_BOUNDS } from './sentenceGroveLayout.js';

const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// The generated chapter/repair bank remains the authority. An arbitrary
// saved rover position or tree cooldown cannot create a completed repair.
export function validateSentenceGrovePracticeSession(value, difficulty, seed, journeyIndex, rounds, route = 0) {
  try { if (JSON.stringify(value).length > 2000000) return null; } catch { return null; }
  if (!value || value.version !== SENTENCE_GROVE_CONTENT_VERSION || value.difficulty !== difficulty || value.seed !== seed || value.journeyIndex !== journeyIndex
    || !integer(seed, 0, Number.MAX_SAFE_INTEGER) || !integer(journeyIndex, 0, 11)
    || !integer(value.originStage, 0, 9) || value.originRepairSlot !== value.originStage * 4 || typeof value.legacyResume !== 'boolean'
    || (value.originStage > 0 && !value.legacyResume)
    || !integer(value.stage, value.originStage, 9) || !integer(value.itemIndex, 0, 3) || typeof value.gateLocked !== 'boolean'
    || typeof value.ended !== 'boolean' || !integer(value.correct, 0, rounds.length - value.originRepairSlot)
    || !integer(value.score, 0, 1e7) || !integer(value.mistakes, 0, 100000) || !integer(value.itemMisses, 0, 100000)
    || !integer(value.combo, 0, 100000) || !integer(value.gateSerial, 0, 100000) || !finite(value.sceneTime, 0, 1e8)
    || !finite(value.focus, 0, 100) || !finite(value.rush, 0, 30) || !finite(value.invulnerable, 0, 30)
    || !finite(value.framePulse, 0, 5) || !validSentenceGroveEvidence(value.evidence, rounds)
    || !value.feedback || typeof value.feedback.text !== 'string' || value.feedback.text.length > 500
    || typeof value.feedback.sub !== 'string' || value.feedback.sub.length > 500
    || !['good', 'bad'].includes(value.feedback.tone) || !finite(value.feedback.life, 0, 30) || !finite(value.feedback.maxLife, 0, 30)
    || !value.supportReasons || Array.isArray(value.supportReasons)) return null;
  const current = rounds.find(round => round.stage === value.stage && round.itemSlot === value.itemIndex);
  if (!current) return null;
  const cursor = value.stage * 4 + value.itemIndex;
  const required = rounds.filter(round => round.stage * 4 + round.itemSlot >= value.originRepairSlot
    && round.stage * 4 + round.itemSlot < cursor + Number(value.gateLocked)).map(round => round.roundId);
  if (!same(value.evidence.completions, required) || value.correct !== required.length
    || value.evidence.firstResponses.some(row => row.stage < value.originStage || row.stage * 4 + row.itemSlot > cursor)
    || value.evidence.assistedRetries.some(row => row.stage < value.originStage || row.stage * 4 + row.itemSlot > cursor)
    || value.gateLocked !== current.acceptedAnswers.includes(value.selectedAnswer)
    || (!value.gateLocked && value.selectedAnswer !== '')
    || (value.ended && (cursor !== rounds.length - 1 || !value.gateLocked))) return null;
  for (const [id, reasons] of Object.entries(value.supportReasons)) {
    if (!rounds.some(round => round.roundId === id) || !Array.isArray(reasons) || reasons.length > 24
      || reasons.some(reason => typeof reason !== 'string' || !reason || reason.length > 80)) return null;
  }
  const world = value.world;
  if (!world || world.route !== route || !integer(route, 0, 1000) || !integer(world.chapterStage, value.originStage, value.stage)
    || !world.choiceAnchor || !finite(world.choiceAnchor.x, SENTENCE_GROVE_MAP_BOUNDS.minX+3.4, SENTENCE_GROVE_MAP_BOUNDS.maxX-3.4)
    || !finite(world.choiceAnchor.z, SENTENCE_GROVE_MAP_BOUNDS.minZ+3.4, SENTENCE_GROVE_MAP_BOUNDS.maxZ-3.4)
    || !finite(world.choiceAnchor.yaw, -1e6, 1e6) || !world.player || !finite(world.player.x, -500, 500) || !finite(world.player.z, -500, 500)
    || !finite(world.player.yaw, -1e6, 1e6) || !finite(world.player.speed, -200, 200) || !finite(world.steerVisual, -2, 2)
    || !Array.isArray(world.tokens) || world.tokens.length !== current.choices.length || world.tokens.length > 6
    || !Array.isArray(world.hazards) || world.hazards.length > 10 || world.hazards.some(hazard => !finite(hazard.stun, 0, 30))) return null;
  const positions = sentenceGroveChoicePositions(current.choices.length, world.choiceAnchor,
    value.gateSerial - 1 + value.stage * 7 + value.itemIndex * 3 + route);
  for (let index = 0; index < world.tokens.length; index++) {
    const token = world.tokens[index];
    if (token.choice !== current.choices[index] || !finite(token.home?.x, -500, 500) || !finite(token.home?.z, -500, 500)
      || !finite(token.home?.y, 0, 20) || typeof token.smashed !== 'boolean' || !finite(token.cooldown, 0, 100000)
      || !finite(token.smashLife, -1e8, 5) || !finite(token.bump, 0, 5)
      || token.smashed !== Boolean(value.gateLocked && token.choice === value.selectedAnswer)
      || token.home.x !== positions[index]?.[0] || token.home.z !== positions[index]?.[1] || token.home.y !== 0) return null;
  }
  if (new Set(world.tokens.map(token => `${token.home.x}:${token.home.z}`)).size !== world.tokens.length) return null;
  // These restored plants are non-choice scenery at real previously cut
  // positions. They cannot supply a response, change reach or earn a repair.
  const plants = world.restoredPlants || [];
  if (!Array.isArray(plants) || plants.length > rounds.length || new Set(plants.map(plant => plant.id)).size !== plants.length
    || plants.some(plant => !value.evidence.completions.includes(plant.id)
      || !rounds.some(round => round.roundId === plant.id && round.stage >= world.chapterStage && round.stage <= value.stage)
      || !finite(plant.x, SENTENCE_GROVE_MAP_BOUNDS.minX + 3.4, SENTENCE_GROVE_MAP_BOUNDS.maxX - 3.4)
      || !finite(plant.z, SENTENCE_GROVE_MAP_BOUNDS.minZ + 3.4, SENTENCE_GROVE_MAP_BOUNDS.maxZ - 3.4)
      || !finite(plant.plantedAt, 0, value.sceneTime))) return null;
  return structuredClone(value);
}

// Serialize only bounded controller/learning state. Renderer resources, live
// keys, camera buffers and decorative geometry never enter a child's save.
export function createSentenceGrovePracticeSession(state, { difficulty, seed, journeyIndex, originStage, legacyResume, evidence, supportReasons, sceneTime, route = 0 }) {
  return structuredClone({ version: SENTENCE_GROVE_CONTENT_VERSION, difficulty, seed, journeyIndex,
    originStage, originRepairSlot: originStage * 4, legacyResume,
    stage: state.stage, itemIndex: state.itemIndex, gateLocked: state.gateLocked, selectedAnswer: state.selectedAnswer, ended: state.ended,
    correct: state.correct, score: state.score, mistakes: state.mistakes, itemMisses: state.itemMisses, combo: state.combo, gateSerial: state.gateSerial,
    focus: state.focus, rush: state.rush, invulnerable: state.invulnerable, framePulse: state.framePulse, feedback: state.feedback,
    evidence, supportReasons, sceneTime,
    world: { chapterStage: state.worldStage, route, choiceAnchor: state.choiceAnchor, player: state.player, steerVisual: state.steerVisual,
      tokens: state.tokens.map(token => ({ choice: token.choice, home: { x: token.home.x, y: token.home.y, z: token.home.z },
        smashed: token.smashed, cooldown: token.cooldown, smashLife: token.smashLife, bump: token.bump })),
      hazards: state.hazards.map(hazard => ({ stun: hazard.stun })), restoredPlants: state.restoredPlants || [] } });
}

// The live chapter and choices are regenerated first. Apply saved positions
// only after those resources match the admitted bounded chapter record.
export function restoreSentenceGrovePracticeSession(state, value) {
  if (!sentenceGroveWorldFitsChapter(value, state.mapBounds, state.hazards.length)
    || state.tokens.length !== value.world.tokens.length
    || state.tokens.some((token, index) => token.choice !== value.world.tokens[index].choice)) return false;
  for (const key of ['stage', 'itemIndex', 'gateLocked', 'selectedAnswer', 'ended', 'correct', 'score', 'mistakes', 'itemMisses',
    'combo', 'gateSerial', 'focus', 'rush', 'invulnerable', 'framePulse', 'feedback']) state[key] = structuredClone(value[key]);
  Object.assign(state.player, value.world.player); state.steerVisual = value.world.steerVisual;
  state.restoredPlants = structuredClone(value.world.restoredPlants || []);
  state.choiceAnchor=structuredClone(value.world.choiceAnchor);state.worldStage=value.world.chapterStage;
  state.tokens.forEach((token, index) => {
    const source = value.world.tokens[index];
    Object.assign(token, { smashed: source.smashed, cooldown: source.cooldown, smashLife: source.smashLife, bump: source.bump });
    token.home.copy(source.home); token.group.position.copy(source.home); token.group.visible = !source.smashed || source.smashLife > 0;
  });
  state.hazards.forEach((hazard, index) => { hazard.stun = value.world.hazards[index].stun; });
  return true;
}

// Called against the actually regenerated physical chapter, rather than
// accepting a saved map size or allowing the save to relocate solid scenery.
export function sentenceGroveWorldFitsChapter(value, bounds, hazardCount) {
  const world = value?.world;
  const inside = point => point && finite(point.x, bounds.minX + 3.4, bounds.maxX - 3.4)
    && finite(point.z, bounds.minZ + 3.4, bounds.maxZ - 3.4);
  return Boolean(world && inside(world.player) && world.tokens.every(token => inside(token.home)) && world.hazards.length === hazardCount);
}

export function loadSentenceGrovePracticeSession(scope, difficulty, seed, journeyIndex, rounds, route = 0) {
  return validateSentenceGrovePracticeSession(loadLearnGamesProgress(scope).games['star-gallery']?.practiceSession?.[difficulty], difficulty, seed, journeyIndex, rounds, route);
}

export function saveSentenceGrovePracticeSession(scope, difficulty, value) {
  const snapshot = structuredClone({ ...value, version: SENTENCE_GROVE_CONTENT_VERSION, difficulty });
  const current = loadLearnGamesProgress(scope), game = current.games['star-gallery'] || {};
  const next = { ...current, games: { ...current.games, 'star-gallery': { ...game, practiceSession: { ...(game.practiceSession || {}), [difficulty]: snapshot } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true, syncPending: false, snapshot }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress), syncPending: Boolean(error.savedProgress), snapshot }; }
}
