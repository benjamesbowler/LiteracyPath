import { SOUND_SAFARI_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../../../utils/learnGamesProgress.js';
import { validSoundSafariEvidence } from './soundSafariLearning.js';
import { createSoundSafariCritters, repositionSoundSafariCritters } from './soundSafariCritters.js';

const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const ordinal = round => round.stage * 3 + round.wordSlot;
const critterFields = ['label', 'x', 'y', 'homeX', 'homeY', 'depth', 'r', 'plateWidth', 'travelX', 'travelY', 'vx', 'vy',
  'phase', 'wobble', 'wobbleY', 'wobbleSpeed', 'orbitX', 'orbitY', 'moveStyle', 'speedScale', 'color', 'type', 'spriteFrame',
  'scareT', 'spawnT', 'caught', 'hidden'];
const presentationId = round => `${round.stage}-${round.wordSlot}-${round.word}`;

export function createSoundSafariPracticeSession(state, { difficulty, seed, journeyIndex, originStage, legacyResume,
  evidence, supportReasons, width, height }) {
  return structuredClone({ version: SOUND_SAFARI_CONTENT_VERSION, difficulty, seed, journeyIndex, originStage, legacyResume,
    stage: state.stage, taskIndex: state.taskIndex, ended: state.ended,
    currentTask: state.currentTask ? { index: state.currentTask.index, found: [...state.currentTask.found], attempts: state.currentTask.attempts } : null,
    score: state.score, combo: state.combo, correct: state.correct, mistakes: state.mistakes,
    wordsCompleted: state.wordsCompleted, presentedUnits: state.presentedUnits, presentedTaskIds: [...state.presentedTaskIds],
    pendingAdvance: state.pendingAdvance, wordClearT: state.wordClearT, waveSeed: state.waveSeed,
    time: state.time, viewport: { width, height }, net: { ...state.net },
    critters: state.critters.map(critter => Object.fromEntries(critterFields.map(key => [key, critter[key]]))),
    evidence, supportReasons, savedAt: Date.now() });
}

export function validateSoundSafariPracticeSession(value, difficulty, seed, journeyIndex, rounds) {
  try {
    if (!value || JSON.stringify(value).length > 2000000 || value.version !== SOUND_SAFARI_CONTENT_VERSION
      || value.difficulty !== difficulty || value.seed !== seed || value.journeyIndex !== journeyIndex
      || !integer(seed, 0, Number.MAX_SAFE_INTEGER) || !integer(journeyIndex, 0, 11)
      || !integer(value.originStage, 0, 9) || typeof value.legacyResume !== 'boolean'
      || (!value.legacyResume && value.originStage !== 0) || !integer(value.stage, value.originStage, 9)
      || !integer(value.taskIndex, 0, 2) || typeof value.ended !== 'boolean' || typeof value.pendingAdvance !== 'boolean'
      || !finite(value.savedAt, 0, Number.MAX_SAFE_INTEGER) || !finite(value.time, 0, 1e8)
      || !integer(value.waveSeed, 0, 100000) || !finite(value.wordClearT, 0, 10)
      || !value.viewport || !finite(value.viewport.width, 10, 16384) || !finite(value.viewport.height, 10, 16384)
      || !validSoundSafariEvidence(value.evidence, rounds)) return null;
    const current = rounds.find(round => round.stage === value.stage && round.wordSlot === value.taskIndex);
    if (!current || !value.currentTask || !integer(value.currentTask.index, 0, current.units.length)
      || !integer(value.currentTask.attempts, 0, 1800) || !same(value.currentTask.found, current.units.slice(0, value.currentTask.index))) return null;
    const rows = [...value.evidence.firstResponses, ...value.evidence.assistedRetries].sort((left, right) => left.eventIndex - right.eventIndex);
    const byId = new Map(rounds.map(round => [round.roundId, round]));
    if (rows.some(row => ordinal(byId.get(row.roundId)) < value.originStage * 3 || ordinal(byId.get(row.roundId)) > ordinal(current))
      || value.evidence.completions.some(id => ordinal(byId.get(id)) < value.originStage * 3 || ordinal(byId.get(id)) > ordinal(current))) return null;
    const accepted = value.evidence.acceptedResponses.filter(row => row.roundId === current.roundId);
    if (accepted.length !== value.currentTask.index
      || rounds.some(round => ordinal(round) >= value.originStage * 3 && ordinal(round) < ordinal(current)
        && !value.evidence.completions.includes(round.roundId))) return null;
    const completed = value.evidence.completions.includes(current.roundId);
    if (completed !== (value.currentTask.index === current.units.length)
      || value.pendingAdvance !== (completed && !value.ended)
      || !completed && value.wordClearT !== 0
      || value.ended && (value.stage !== 9 || value.taskIndex !== 2 || value.evidence.completions.length !== 30 - value.originStage * 3)) return null;
    let cursor = value.originStage * 3, unitSlot = 0;
    for (const row of rows) {
      const round = byId.get(row.roundId);
      if (ordinal(round) !== cursor || row.slot !== unitSlot) return null;
      if (row.correct && ++unitSlot === round.units.length) { cursor++; unitSlot = 0; }
    }
    if (ordinal(current) !== (completed ? cursor - 1 : cursor)
      || !completed && value.currentTask.index !== unitSlot) return null;
    const currentAttempts = rows.filter(row => row.roundId === current.roundId && row.slot === value.currentTask.index && !row.correct).length;
    if (value.currentTask.attempts !== currentAttempts) return null;
    let score = 0, combo = 0, stage = value.originStage;
    for (const row of rows) {
      if (row.stage !== stage) { combo = 0; stage = row.stage; }
      if (row.correct) { combo++; score += 95 + Math.min(6, combo) * 18; } else combo = 0;
    }
    if (!['score', 'combo', 'correct', 'mistakes', 'wordsCompleted', 'presentedUnits'].every(key => integer(value[key], 0, 1000000))
      || value.score !== score || value.combo !== (stage === value.stage ? combo : 0)
      || value.correct !== value.evidence.acceptedResponses.length || value.mistakes !== rows.filter(row => !row.correct).length
      || value.wordsCompleted !== value.evidence.completions.length || value.evidence.motorEvents.catches !== rows.length) return null;
    const presented = rounds.filter(round => ordinal(round) >= value.originStage * 3 && ordinal(round) <= ordinal(current));
    if (!same(value.presentedTaskIds, presented.map(presentationId)) || value.presentedUnits !== presented.reduce((sum, round) => sum + round.units.length, 0)) return null;
    if (!value.supportReasons || typeof value.supportReasons !== 'object' || Array.isArray(value.supportReasons)
      || Object.entries(value.supportReasons).some(([id, reasons]) => !byId.has(id) || !Array.isArray(reasons) || reasons.length > 24
        || reasons.some(reason => typeof reason !== 'string' || !reason || reason.length > 80))) return null;
    const { width, height } = value.viewport, net = value.net;
    if (!net || !['x', 'targetX'].every(key => finite(net[key], width * .1 - 1, width * .93 + 1))
      || !['y', 'targetY'].every(key => finite(net[key], height * .18 - 1, height * .79 + 1))
      || !finite(net.angle, -.5, .5) || ![-1, 1].includes(net.swingDir) || !finite(net.swingT, 0, .22)
      || !Array.isArray(value.critters) || value.critters.length > 8) return null;
    if (completed) { if (value.critters.length) return null; }
    else {
      const template = createSoundSafariCritters(current, { difficulty, unitSlot: value.currentTask.index,
        waveSeed: value.waveSeed, width, height });
      if (template.length !== value.critters.length) return null;
      for (let index = 0; index < template.length; index++) {
        const expected = template[index], critter = value.critters[index];
        if (!critter || ['label', 'phase', 'moveStyle', 'speedScale', 'color', 'type', 'spriteFrame', 'hidden']
          .some(key => critter[key] !== expected[key]) || critter.caught !== false
          || !critter.hidden && ['homeX', 'homeY', 'r', 'plateWidth', 'travelX', 'travelY'].some(key => critter[key] !== expected[key])
          || !['x', 'y', 'vx', 'vy', 'wobble', 'wobbleY', 'wobbleSpeed', 'orbitX', 'orbitY'].every(key => finite(critter[key], -200000, 200000))
          || !['homeX', 'homeY', 'r', 'plateWidth', 'travelX', 'travelY'].every(key => finite(critter[key], 0, 16384))
          || !finite(critter.depth, 0, 1) || !finite(critter.scareT, 0, .7) || !finite(critter.spawnT, 0, 1)
          || !critter.hidden && (Math.abs(critter.x - critter.homeX) > critter.travelX + .01 || Math.abs(critter.y - critter.homeY) > critter.travelY + .01)) return null;
      }
    }
    return structuredClone(value);
  } catch { return null; }
}

export function restoreSoundSafariPracticeSession(state, held, width, height) {
  state.taskIndex = held.taskIndex; state.currentTask = state.tasks[held.taskIndex];
  if (!state.currentTask) return false;
  Object.assign(state.currentTask, structuredClone(held.currentTask));
  for (const key of ['score', 'combo', 'correct', 'mistakes', 'wordsCompleted', 'presentedUnits', 'pendingAdvance', 'wordClearT', 'waveSeed', 'time', 'ended']) state[key] = held[key];
  state.presentedTaskIds = new Set(held.presentedTaskIds);
  state.critters = structuredClone(held.critters);
  const horizontal = width / held.viewport.width, vertical = height / held.viewport.height;
  state.net = { ...held.net, x: held.net.x * horizontal, targetX: held.net.targetX * horizontal,
    y: held.net.y * vertical, targetY: held.net.targetY * vertical };
  repositionSoundSafariCritters(state.critters, { width, height, previousWidth: held.viewport.width,
    previousHeight: held.viewport.height, waveSeed: state.waveSeed, needed: state.currentTask.item.graphemes[state.currentTask.index] });
  return true;
}

export function loadSoundSafariPracticeSession(scope, difficulty, seed, journeyIndex, rounds) {
  return validateSoundSafariPracticeSession(loadLearnGamesProgress(scope).games['sound-safari']?.practiceSession?.[difficulty], difficulty, seed, journeyIndex, rounds);
}

export function saveSoundSafariPracticeSession(scope, difficulty, value) {
  const snapshot = structuredClone(value), current = loadLearnGamesProgress(scope), game = current.games['sound-safari'] || {};
  const next = { ...current, games: { ...current.games, 'sound-safari': { ...game,
    practiceSession: { ...(game.practiceSession || {}), [difficulty]: snapshot } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true, syncPending: false, snapshot }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress), syncPending: Boolean(error.savedProgress), snapshot }; }
}
