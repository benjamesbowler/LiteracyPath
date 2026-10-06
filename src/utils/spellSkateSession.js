import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { SPELL_SKATE_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { validArcadeChapter } from './arcadeJourneys.js';
import { grammarGrindSegmentChoices } from './grammarGrindLevels.js';
import { SPELL_SKATE_CONSTRUCT, spellSkatePartId } from './spellSkatePractice.js';

export const spellSkateSignature = ladder => JSON.stringify(ladder.map(level => [level.audioWord, level.segments]));
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const strings = values => Array.isArray(values) && values.length <= 30 && values.every(value => typeof value === 'string' && value.length > 0 && value.length <= 100);
const point = value => value && finite(value.x, -86, 86) && finite(value.z, -86, 86);
const physicalRanges = {
  yaw: [-1e6, 1e6], speed: [-40, 45], vy: [-100, 100], air: [0, 80], airTime: [0, 120],
  stun: [0, 10], grind: [0, 10], grindT: [0, 1], airTricks: [0, 2],
  spinAngle: [-20, 20], spinTarget: [0, 4 * Math.PI + .001], railIntent: [0, 10],
  railLock: [0, 10], rampLock: [0, 10], landTime: [0, 10], recoverTime: [0, 10],
  surfacePitch: [-Math.PI, Math.PI], surfaceRoll: [-Math.PI, Math.PI],
  motorRecoveries: [0, 100000], landingRecoveries: [0, 100000]
};

// The mutable board, routes and response history stay inside the child's existing
// local practiceSession. The shared save authority excludes it from cloud data.
export function saveSpellSkateSession(scope, difficulty, state) {
  try {
    const progress = loadLearnGamesProgress(scope), previous = progress.games['grammar-grind'] || {};
    saveLearnGamesProgress(scope, { ...progress, games: { ...progress.games, 'grammar-grind': {
      ...previous, practiceSession: { ...(previous.practiceSession || {}), [difficulty]: structuredClone(state) }
    } } });
    return { localSaved: true };
  } catch (error) { return { localSaved: Boolean(error.savedProgress) }; }
}

export function validateSpellSkateSession(raw, { sessionSeed, journeyIndex, difficulty, index, ladder, railCount = 0, pickupCount = 0 }) {
  try { if (JSON.stringify(raw).length > 500000) return null; } catch { return null; }
  const level = ladder[index];
  if (!raw || !level || raw.version !== SPELL_SKATE_CONTENT_VERSION || raw.checkpointSemantics !== 'active-word-index'
    || raw.sessionSeed !== sessionSeed || raw.journeyIndex !== journeyIndex || raw.difficulty !== difficulty || raw.index !== index
    || !Number.isSafeInteger(sessionSeed) || sessionSeed < 0 || !validArcadeChapter(journeyIndex)
    || !integer(raw.sessionStartIndex, 0, index) || raw.signature !== spellSkateSignature(ladder)
    || !finite(raw.score, 0, 10000000) || !finite(raw.activeSeconds, 0, 86400)
    || !integer(raw.correct, 0, ladder.length) || !integer(raw.mistakes, 0, 10000) || !integer(raw.wordMistakes, 0, raw.mistakes)
    || !integer(raw.lineStep, 0, level.segments.length) || !['playing', 'word-complete'].includes(raw.phase)
    || typeof raw.lineReady !== 'boolean' || raw.lineReady !== (raw.lineStep === level.segments.length)
    || (raw.phase === 'word-complete') !== raw.lineReady || !strings(raw.supportReasons)
    || !integer(raw.combo, 1, 9) || !finite(raw.comboTimer, 0, 10) || !finite(raw.styleWindow, 0, 10)
    || !finite(raw.styleScore, 0, 1000000) || !finite(raw.phaseTimer, -1, 10) || !finite(raw.lineChoiceCooldown, 0, 2)) return null;
  const player = raw.player;
  if (!player || !point(player.pos) || !finite(player.pos.y, -3, 80) || typeof player.onGround !== 'boolean'
    || ![-1, 1].includes(player.grindDirection) || !integer(player.grindRailIndex, -1, railCount - 1)
    || (player.grind > 0 && player.grindRailIndex < 0)
    || Object.entries(physicalRanges).some(([key, [min, max]]) => !finite(player[key], min, max))) return null;
  if (!Array.isArray(raw.pickups) || raw.pickups.length !== pickupCount || raw.pickups.some(pickup => !point(pickup)
    || typeof pickup.collected !== 'boolean' || !finite(pickup.respawn, -1, 20))) return null;
  const expectedChoices = grammarGrindSegmentChoices(level, ladder, raw.lineStep, index + sessionSeed);
  if (!Array.isArray(raw.choices) || raw.choices.length !== expectedChoices.length || raw.choices.some((choice, i) =>
    choice.label !== expectedChoices[i] || !point(choice) || typeof choice.contactLock !== 'boolean')) return null;
  const intent = raw.selectedIntent;
  if (intent !== null && (!intent || intent.levelIndex !== index || intent.step !== raw.lineStep || !expectedChoices.includes(intent.label)
    || intent.responseCounted !== true)) return null;
  if (!Array.isArray(raw.assistRoute) || raw.assistRoute.length > 80 || raw.assistRoute.some(value => !point(value))
    || (raw.assistRoute.length > 0 && intent === null)) return null;
  const evidence = raw.evidence;
  if (!evidence || evidence.contentVersion !== SPELL_SKATE_CONTENT_VERSION || evidence.construct !== SPELL_SKATE_CONSTRUCT
    || evidence.sessionSeed !== sessionSeed || evidence.journeyIndex !== journeyIndex || evidence.difficulty !== difficulty || evidence.practiceOnly !== true
    || !Array.isArray(evidence.firstResponses) || evidence.firstResponses.length > 100
    || !Array.isArray(evidence.assistedRetries) || evidence.assistedRetries.length > 500
    || !Array.isArray(evidence.completions) || evidence.completions.length > ladder.length) return null;
  function validRow(row) {
    const source = ladder[row?.levelIndex];
    if (!source || !integer(row.levelIndex, raw.sessionStartIndex, index) || !integer(row.step, 0, source.segments.length - 1)
      || (row.levelIndex === index && row.step > raw.lineStep) || row.word !== source.audioWord || row.itemId !== source.audioWord
      || row.roundId !== spellSkatePartId(row.levelIndex, row.word, row.step) || row.expected !== source.segments[row.step]
      || row.construct !== SPELL_SKATE_CONSTRUCT || row.practiceOnly !== true || row.wordVisible !== false
      || !['selected-skate-destination', 'manual-skate-contact'].includes(row.inputAuthority)
      || !strings(row.supportReasons) || typeof row.independentPractice !== 'boolean' || typeof row.motorAssist !== 'boolean'
      || !['primary', 'gzip-recovery', 'authored-skating-art'].includes(row.graphicsRecovery)
      || typeof row.soundEnabledAtResponse !== 'boolean' || !['pending', 'delivered', 'unavailable'].includes(row.deliveryAtResponse)) return false;
    const choices = grammarGrindSegmentChoices(source, ladder, row.step, row.levelIndex + sessionSeed);
    if (JSON.stringify(row.choices) !== JSON.stringify(choices) || !choices.includes(row.selected) || row.correct !== (row.selected === row.expected)) return false;
    const delivered = row.deliveryAtResponse === 'delivered', receipt = row.wordAudioReceipt;
    if (row.stimulusDelivered !== delivered || (delivered && (!receipt || typeof receipt.source !== 'string'
      || !receipt.source.startsWith('/') || receipt.source.length > 500 || !Number.isFinite(Date.parse(receipt.deliveredAt))
      || !finite(receipt.playTimeMs, 0, raw.activeSeconds * 1000 + 1))) || (!delivered && receipt !== null)) return false;
    return !row.independentPractice || (delivered && row.soundEnabledAtResponse && row.supportReasons.length === 0);
  }
  if (!evidence.firstResponses.every(validRow) || !evidence.assistedRetries.every(row => validRow(row) && !row.independentPractice)
    || new Set(evidence.firstResponses.map(row => row.roundId)).size !== evidence.firstResponses.length
    || new Set(evidence.completions).size !== evidence.completions.length) return null;
  const responses = [...evidence.firstResponses, ...evidence.assistedRetries];
  const accepted = (wordIndex, step) => responses.some(row => row.roundId === spellSkatePartId(wordIndex, ladder[wordIndex].audioWord, step) && row.correct);
  const completedIds = [];
  for (let wordIndex = raw.sessionStartIndex; wordIndex <= index; wordIndex++) {
    const source = ladder[wordIndex], parts = wordIndex < index ? source.segments.length : raw.lineStep;
    for (let step = 0; step < parts; step++) if (!accepted(wordIndex, step)) return null;
    if (parts === source.segments.length) completedIds.push(`word-${wordIndex}:${source.audioWord}`);
  }
  if (JSON.stringify(evidence.completions) !== JSON.stringify(completedIds) || raw.correct !== completedIds.length
    || raw.mistakes > responses.filter(row => !row.correct).length
    || raw.wordMistakes > responses.filter(row => row.levelIndex === index && !row.correct).length
    || (intent && !responses.some(row => row.roundId === spellSkatePartId(index, level.audioWord, raw.lineStep) && row.selected === intent.label))) return null;
  return structuredClone(raw);
}

export function loadSpellSkateSession(scope, context) {
  return validateSpellSkateSession(loadLearnGamesProgress(scope).games['grammar-grind']?.practiceSession?.[context.difficulty], context);
}
