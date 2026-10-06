import { WORD_BRIDGE_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../../../data/ledaProductionAudio.js';
import { getArcadeCuePicture } from '../../../../data/arcadeCuePictures.js';
import { AUDIO_QUEST_PATHS } from '../../../../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';
import { validWordBridgeContentVersion } from '../../../../utils/gameCheckpoints.js';
import { WORD_BRIDGE_STUMP_PICTURE } from './wordBridgeContent.js';

export const WORD_BRIDGE_CONSTRUCT = 'model-supported-grapheme-matching-ordered-reconstruction';
export const WORD_BRIDGE_RETRY_LIMIT = 1800;
const normalize = value => String(value).trim().toUpperCase();
const unique = values => [...new Set(values)];

// Physical repeated pieces retain distinct identities. Matching a glyph may
// fill any empty modelled slot of that glyph, as in the existing bridge.
export function buildWordBridgeRounds(ladder, difficulty, seed, journeyIndex, contentVersion = WORD_BRIDGE_CONTENT_VERSION) {
  if (!validWordBridgeContentVersion(contentVersion)) throw new Error('Unsupported Word Bridge round revision');
  return ladder.map((level, stage) => {
    const isSentence = Array.isArray(level.target), target = isSentence ? level.target.join(' ') : String(level.target);
    const candidate = isSentence ? getLedaInstructionAudioPath(target) : getLedaWordAudioPath(target.toLowerCase());
    const cue = isSentence ? null : getArcadeCuePicture(target);
    return { roundId: `${contentVersion}:${difficulty}:${seed}:${journeyIndex}:${stage}`,
      stage, pals: level.pals ?? 0, isSentence, target, units: [...level.units], mode: level.mode,
      tiles: level.tiles.map((tile, id) => ({ id, glyph: String(tile.glyph), correct: Boolean(tile.correct), order: tile.order })),
      audio: candidate && AUDIO_QUEST_PATHS.has(candidate) && !isKnownBadAudioPath(candidate) ? candidate : '',
      pictures: unique([!isSentence && contentVersion === WORD_BRIDGE_CONTENT_VERSION && target.toLowerCase() === 'stump'
        ? WORD_BRIDGE_STUMP_PICTURE : cue?.image, cue?.fallbackImage].filter(Boolean)) };
  });
}

export const newWordBridgeEvidence = () => ({ firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [],
  motorEvents: { pickups: 0, looseDrops: 0, crossings: 0 } });

export function commitWordBridgePlacement(evidence, round, slot, tileId, context = {}) {
  const tile = round?.tiles.find(item => item.id === tileId);
  if (!tile || !Number.isInteger(slot) || slot < 0 || slot >= round.units.length
    || evidence.acceptedResponses.some(row => row.roundId === round.roundId && (row.slot === slot || row.tileId === tileId))) return null;
  const responseId = `${round.roundId}:${slot}`, first = !evidence.firstResponses.some(row => row.responseId === responseId);
  const correct = tile.correct && normalize(tile.glyph) === normalize(round.units[slot]);
  const responseAt = context.responseAt ?? Date.now(), delivery = context.delivery || 'pending';
  const receipt = context.deliveryReceipt ? { ...context.deliveryReceipt } : null;
  const heard = delivery === 'delivered' && receipt?.source === round.audio && Boolean(round.audio)
    && Number.isFinite(receipt.endedAt) && receipt.endedAt >= 0 && receipt.endedAt <= responseAt;
  const supportReasons = unique(['visible-slot-model', ...(context.supportReasons || []),
    ...(!first ? ['repeat-after-response'] : []), ...(context.legacyResume ? ['legacy-resume-response-history-unavailable'] : []),
    ...(context.soundEnabled === false ? ['sound-off-at-response'] : []),
    ...(!heard ? [delivery === 'pending' ? 'audio-pending' : 'audio-unavailable'] : [])]);
  const row = { responseId, roundId: round.roundId, stage: round.stage, slot, tileId, selected: tile.glyph, expected: round.units[slot],
    choices: round.tiles.map(({ id, glyph }) => ({ id, glyph })), correct, responseAt,
    deliveryAtResponse: delivery, deliveryReceipt: receipt, soundEnabled: context.soundEnabled !== false,
    supportReasons, modelUsed: true, practiceOnly: true, construct: WORD_BRIDGE_CONSTRUCT, independentEncodingPractice: false };
  const acceptedResponses = correct ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses;
  const finished = correct && round.units.every((_, index) => acceptedResponses.some(item => item.roundId === round.roundId && item.slot === index));
  return { correct, first, finished, response: row, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, row].slice(-WORD_BRIDGE_RETRY_LIMIT),
    acceptedResponses, completions: finished ? [...evidence.completions, round.roundId] : evidence.completions } };
}

export function validWordBridgeEvidence(evidence, rounds) {
  const maximum = rounds.reduce((count, round) => count + round.units.length, 0);
  if (!evidence || !['firstResponses', 'assistedRetries', 'acceptedResponses', 'completions'].every(key => Array.isArray(evidence[key]))
    || evidence.firstResponses.length > maximum || evidence.assistedRetries.length > WORD_BRIDGE_RETRY_LIMIT
    || evidence.acceptedResponses.length > maximum || evidence.completions.length > rounds.length
    || !['pickups', 'looseDrops', 'crossings'].every(key => Number.isInteger(evidence.motorEvents?.[key])
      && evidence.motorEvents[key] >= 0 && evidence.motorEvents[key] <= 100000)) return false;
  const byId = new Map(rounds.map(round => [round.roundId, round]));
  const validRow = row => {
    const round = byId.get(row?.roundId), tile = round?.tiles.find(item => item.id === row.tileId);
    return Boolean(tile && Number.isInteger(row.slot) && row.slot >= 0 && row.slot < round.units.length
      && row.responseId === `${round.roundId}:${row.slot}` && row.stage === round.stage && row.selected === tile.glyph
      && row.expected === round.units[row.slot] && row.correct === (tile.correct && normalize(tile.glyph) === normalize(row.expected))
      && JSON.stringify(row.choices) === JSON.stringify(round.tiles.map(({ id, glyph }) => ({ id, glyph })))
      && row.modelUsed === true && row.practiceOnly === true && row.construct === WORD_BRIDGE_CONSTRUCT && row.independentEncodingPractice === false
      && Number.isFinite(row.responseAt) && row.responseAt >= 0 && typeof row.soundEnabled === 'boolean'
      && ['pending', 'delivered', 'unavailable'].includes(row.deliveryAtResponse)
      && (!row.deliveryReceipt || typeof row.deliveryReceipt.source === 'string' && row.deliveryReceipt.source.length <= 512
        && Number.isFinite(row.deliveryReceipt.endedAt) && row.deliveryReceipt.endedAt >= 0)
      && Array.isArray(row.supportReasons) && row.supportReasons.length <= 24 && row.supportReasons.includes('visible-slot-model')
      && row.supportReasons.every(reason => typeof reason === 'string' && reason.length > 0 && reason.length <= 80));
  };
  const distinct = rows => new Set(rows.map(row => row.responseId)).size === rows.length;
  const recorded = [...evidence.firstResponses, ...evidence.assistedRetries];
  if (!distinct(evidence.firstResponses) || !distinct(evidence.acceptedResponses) || !evidence.firstResponses.every(validRow)
    || !evidence.assistedRetries.every(row => validRow(row) && row.supportReasons.includes('repeat-after-response')
      && evidence.firstResponses.some(first => first.responseId === row.responseId && first.responseAt <= row.responseAt))
    || !evidence.acceptedResponses.every(row => validRow(row) && row.correct && recorded.some(actual => JSON.stringify(actual) === JSON.stringify(row)))
    || new Set(evidence.completions).size !== evidence.completions.length || evidence.completions.some(id => !byId.has(id))) return false;
  return rounds.every(round => {
    const accepted = evidence.acceptedResponses.filter(row => row.roundId === round.roundId);
    return new Set(accepted.map(row => row.tileId)).size === accepted.length
      && evidence.completions.includes(round.roundId) === round.units.every((_, slot) => accepted.some(row => row.slot === slot));
  });
}
