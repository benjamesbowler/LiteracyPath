import { elCodeThroughCycle } from '../policy/literacyExperiencePolicy.js';
import { getLedaInstructionAudioPath } from '../data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../data/generated/audioQuestPaths.generated.js';
import { LANTERN_LAGOON_AUDIO } from '../data/generated/lanternLagoonAudio.generated.js';
import { normalizeLedaAudioText } from '../data/normalizeLedaAudioText.js';
import { isKnownBadAudioPath } from '../data/knownBadWordAudio.js';
import { replayShuffle } from './gameReplay.js';
import { LANTERN_READING_SCENES, LANTERN_SUPPORTED_SCENES, LANTERN_WORD_CODE, LANTERN_LAGOON_VERSION } from '../data/lanternLagoonContent.js';

export function isLanternSentenceReadable(sentence, taughtCycle) {
  const code = elCodeThroughCycle(taughtCycle);
  const words = String(sentence).toLowerCase().match(/[a-z]+/gu) || [];
  return words.length > 0 && words.every(word => code.highFrequencyWords.has(word)
    || LANTERN_WORD_CODE[word]?.every(grapheme => code.graphemes.has(grapheme)));
}
export function lanternSentenceRecording(sentence) {
  const key = normalizeLedaAudioText(sentence);
  const path = LANTERN_LAGOON_AUDIO[key] || getLedaInstructionAudioPath(sentence);
  return path && AUDIO_QUEST_PATHS.has(path) && !isKnownBadAudioPath(path) ? path : '';
}
export function lanternChoiceDescription(choice) {
  const first = choice.action !== 'sitting' ? `The ${choice.species} is ${choice.action}${choice.object === 'grass' ? '' : ` ${choice.relation} the ${choice.object}`}`
    : `The ${choice.species} is ${choice.relation} the ${choice.object}`;
  return first + (choice.companion ? `. ${lanternChoiceDescription(choice.companion)}` : '.');
}
export function lanternErrorFeedback(choice) {
  // The complete target remains above the world. Keep the selected scene's
  // exact meaning here without duplicating a second long compound sentence.
  return `${lanternChoiceDescription(choice)} Try the message again.`;
}
export function lanternAvailableModes(taughtCycle) {
  const reading = LANTERN_READING_SCENES.some(scene => isLanternSentenceReadable(scene.sentence, taughtCycle));
  return { reading, listening: [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES].some(scene => lanternSentenceRecording(scene.sentence)), together: true };
}
export function buildLanternLagoonDeck({ difficulty = 'easy', taughtCycle, mode = 'reading', sessionSeed = 0, journey } = {}) {
  const available = lanternAvailableModes(taughtCycle);
  const resolvedMode = mode === 'reading' && !available.reading ? 'listening' : ['reading', 'listening', 'together'].includes(mode) ? mode : 'reading';
  const maximumBand = difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2;
  let bank = resolvedMode === 'together' ? [...LANTERN_SUPPORTED_SCENES, ...LANTERN_READING_SCENES]
    : resolvedMode === 'listening' ? [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES].filter(scene => lanternSentenceRecording(scene.sentence))
      : LANTERN_READING_SCENES.filter(scene => isLanternSentenceReadable(scene.sentence, taughtCycle));
  bank = bank.filter(scene => scene.band <= maximumBand);
  const seed = `${sessionSeed}:${journey?.index || 0}:${difficulty}:${resolvedMode}`;
  // Keep the curated demand ramp, vary messages within a band and rebuild all
  // choices. The approved bridge remains the opening supported encounter.
  const bands = [...new Set(bank.map(scene => scene.band))].sort((a, b) => a - b);
  const ordered = bands.flatMap(band => replayShuffle(bank.filter(scene => scene.band === band), `${seed}:${band}`));
  if (resolvedMode === 'together') {
    const bridge = bank.find(scene => scene.id === 'duck-under-bridge');
    if (bridge) { ordered.splice(ordered.indexOf(bridge), 1); ordered.unshift(bridge); }
  }
  const total = Math.min(8, ordered.length);
  // A short outing still reaches the difficulty's upper eligible band.
  const selected = total >= ordered.length ? ordered : Array.from({ length: total }, (_, index) => ordered[Math.floor(index * (ordered.length - 1) / (total - 1))]);
  return Object.freeze({ version: LANTERN_LAGOON_VERSION, mode: resolvedMode, taughtCycle: Number(taughtCycle) || null,
    rounds: Object.freeze(selected.map((scene, index) => {
      const choices = replayShuffle(scene.choices.map((choice, slot) => ({ ...choice, id: `${scene.id}:${slot}`, authoredSlot: slot })), `${seed}:choices:${index}`);
      return Object.freeze({ ...scene, index, mode: resolvedMode, choices: Object.freeze(choices.map(Object.freeze)),
        answerId: choices.find(choice => choice.authoredSlot === scene.answer).id, audioPath: lanternSentenceRecording(scene.sentence),
        mirrored: Number(String(sessionSeed).replace(/\D/gu, '')) % 2 === 1 });
    })) });
}
export function newLanternEvidence(deck, seed, resumedAt = 0) {
  return { game: 'lantern-lagoon', version: deck.version, sessionSeed: seed, taughtCycle: deck.taughtCycle, mode: deck.mode,
    resumedAt, practiceOnly: true, formalAssessment: false, firstResponses: [], assistedRetries: [], supportEvents: [], totalRetries: 0, totalSupportEvents: 0 };
}
export const LANTERN_EVIDENCE_HISTORY_LIMIT = 128;
export function appendLanternSupport(evidence, event) {
  return { ...evidence, totalSupportEvents: (evidence.totalSupportEvents || 0) + 1,
    supportEvents: [...evidence.supportEvents, event].slice(-LANTERN_EVIDENCE_HISTORY_LIMIT) };
}
export function appendLanternRetry(evidence, response) {
  return { ...evidence, totalRetries: (evidence.totalRetries || 0) + 1,
    assistedRetries: [...evidence.assistedRetries, response].slice(-LANTERN_EVIDENCE_HISTORY_LIMIT) };
}
export function isLanternSavedSessionValid(snapshot, { difficulty = 'easy', taughtCycle, sessionSeed = 0, journey, startLevel = 0 } = {}) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const { deck, evidence, round, attempts, score, phase, support } = snapshot;
  if (deck?.version !== LANTERN_LAGOON_VERSION || snapshot.seed !== sessionSeed || snapshot.journeyIndex !== (journey?.index || 0)
    || !['reading', 'listening', 'together'].includes(deck.mode) || !Array.isArray(deck.rounds) || !deck.rounds.length
    || !Number.isInteger(round) || round !== Number(startLevel) || round < 0 || round >= deck.rounds.length
    || !['active', 'correct', 'model'].includes(phase) || !Number.isInteger(attempts) || attempts < 0
    || !Number.isInteger(score) || score < 0 || score > (round + 1) * 10 || typeof snapshot.modelled !== 'boolean'
    || !Array.isArray(support) || support.length > 16 || !support.every(reason => typeof reason === 'string' && reason.length > 0 && reason.length < 65)
    || !['not_requested', 'requested', 'playing', 'ended', 'cancelled', 'unavailable', 'sound_off'].includes(snapshot.audioDelivery)
    || evidence?.game !== 'lantern-lagoon' || evidence.version !== deck.version || evidence.sessionSeed !== sessionSeed || evidence.mode !== deck.mode
    || evidence.practiceOnly !== true || evidence.formalAssessment !== false
    || !Number.isInteger(evidence.resumedAt) || evidence.resumedAt < 0 || evidence.resumedAt > round
    || !Array.isArray(evidence.firstResponses) || evidence.firstResponses.length > deck.rounds.length
    || !Array.isArray(evidence.assistedRetries) || evidence.assistedRetries.length > LANTERN_EVIDENCE_HISTORY_LIMIT
    || !Array.isArray(evidence.supportEvents) || evidence.supportEvents.length > LANTERN_EVIDENCE_HISTORY_LIMIT
    || !Number.isInteger(evidence.totalRetries) || evidence.totalRetries < evidence.assistedRetries.length
    || !Number.isInteger(evidence.totalSupportEvents) || evidence.totalSupportEvents < evidence.supportEvents.length) return false;
  if (deck.mode === 'reading' && !deck.rounds.every(item => isLanternSentenceReadable(item.sentence, taughtCycle))) return false;
  // Preserve a previously narrower confirmed code boundary, but accept only
  // the actual authored seeded deck and answer truth, never cached mutations.
  const expected = buildLanternLagoonDeck({ difficulty, taughtCycle: deck.taughtCycle, mode: deck.mode, sessionSeed, journey });
  if (JSON.stringify(deck) !== JSON.stringify(expected)) return false;
  const seen = new Set();
  for (const response of [...evidence.firstResponses, ...evidence.assistedRetries]) {
    const item = deck.rounds.find(value => value.id === response?.round);
    if (!item || item.index > round || response.sentence !== item.sentence || !item.choices.some(choice => choice.id === response.selectedChoice)
      || response.correct !== (response.selectedChoice === item.answerId) || !Array.isArray(response.supportUsed) || typeof response.independent !== 'boolean') return false;
    if (response.independent && (deck.mode !== 'reading' || response.attempt !== 0 || response.audioDelivery !== 'not_requested' || response.supportUsed.length)) return false;
  }
  for (const response of evidence.firstResponses) {
    if (seen.has(response.round) || response.attempt !== 0) return false;
    seen.add(response.round);
  }
  const currentId = deck.rounds[round].id, first = evidence.firstResponses.find(response => response.round === currentId);
  if ((attempts === 0) !== !first || (phase === 'active' && first?.correct) || (phase !== 'active' && attempts === 0)) return false;
  const latest = evidence.assistedRetries.filter(response => response.round === currentId).at(-1) || first;
  if (phase === 'correct' && !latest?.correct || phase === 'model' && (attempts < 2 || latest?.correct)) return false;
  return true;
}
export function lanternResponse(round, choiceId, { attempt = 0, audioDelivery = 'not_requested', replayUsed = false, modelUsed = false, supportUsed = [] } = {}) {
  const supported = round.mode !== 'reading' || replayUsed || audioDelivery !== 'not_requested' || attempt > 0 || modelUsed || supportUsed.length > 0;
  return Object.freeze({ round: round.id, sentence: round.sentence, selectedChoice: choiceId, correct: choiceId === round.answerId,
    attempt, independent: !supported, practiceOnly: true, responseMode: !supported ? 'independent_reading_practice' : audioDelivery === 'ended' ? 'listening_supported'
      : round.mode === 'together' ? 'adult_supported' : round.mode === 'listening' ? 'listening_incomplete' : attempt > 0 ? 'supported_retry' : 'supported_reading_practice',
    audioDelivery, supportUsed: Object.freeze([...new Set([...supportUsed, ...(round.mode === 'together' ? ['adult_reading'] : []), ...(replayUsed ? ['sentence_replay'] : []), ...(attempt > 0 ? ['specific_feedback'] : []), ...(modelUsed ? ['model'] : [])])]) });
}
