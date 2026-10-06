import { WORD_BRIDGE_CONTENT_VERSION, WORD_BRIDGE_LEGACY_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { validWordBridgeContentVersion } from '../../../../utils/gameCheckpoints.js';
import { buildLevel, wordBridgeLadder } from '../../../../utils/wordBridgeLevels.js';

// Leaf-local repaired content. Global curriculum banks and every v2 plan remain
// original. Each fresh target names its own exact retained recording.
export const WORD_BRIDGE_V3_SENTENCES = Object.freeze([
  Object.freeze(['The children played happily outside.', 'The children hung up their coats.']),
  Object.freeze(['Which book would you like to read?', 'Would you like milk or water?']),
  Object.freeze(['The brave knight rode to the castle.', 'The knight rode his horse to the castle.']),
  Object.freeze(['A robot landed on the red planet.', 'The rocket is about to blast off.']),
  Object.freeze(['The dragon slept on a pile of gold.', 'The dragon flew over there to the mountain.']),
  Object.freeze(['We watched the rocket blast into space.', 'The rocket flew higher than the birds.']),
  Object.freeze(['The owl hunts when the moon is bright.', 'The owl hunts when the moon is bright.']),
  Object.freeze(['Seeds need water and sun to grow.', 'Seeds need water and sun to grow.'])
]);
export const WORD_BRIDGE_STUMP_PICTURE = '/images/child-mode/reviewed/letter-leap/stump.webp';
const key = text => String(text).trim().replace(/[.?!]$/, '').toLowerCase();
const sentences = new Map(WORD_BRIDGE_V3_SENTENCES.map(([old, fresh]) => [key(old), fresh]));
export const wordBridgeFreshWord = word => String(word).toLowerCase() === 'grump' ? 'stump' : String(word);

export function wordBridgeContentVersion({ resumedCheckpoint = false, checkpointContentVersion, savedVersion } = {}) {
  if (checkpointContentVersion !== undefined && !validWordBridgeContentVersion(checkpointContentVersion)) {
    throw new Error('Unsupported Word Bridge checkpoint content revision');
  }
  if (!resumedCheckpoint) return WORD_BRIDGE_CONTENT_VERSION;
  if (checkpointContentVersion !== undefined) return checkpointContentVersion;
  if (validWordBridgeContentVersion(savedVersion)) return savedVersion;
  return WORD_BRIDGE_LEGACY_CONTENT_VERSION;
}

export function wordBridgeContentLadder(difficulty, seed, contentVersion = WORD_BRIDGE_CONTENT_VERSION) {
  if (!validWordBridgeContentVersion(contentVersion)) throw new Error('Unsupported Word Bridge content revision');
  const original = wordBridgeLadder(difficulty, seed);
  if (contentVersion === WORD_BRIDGE_LEGACY_CONTENT_VERSION || !['hard', 'high'].includes(String(difficulty).toLowerCase())) return original;
  return original.map((level, stage) => {
    const isSentence = Array.isArray(level.target);
    const literal = isSentence ? sentences.get(key(level.target.join(' '))) : wordBridgeFreshWord(level.target);
    if (isSentence && !literal) throw new Error('Unmapped original Word Bridge Hard sentence');
    if (!isSentence && literal === level.target) return level;
    return buildLevel({ world: 'moonwood', cycle: stage, mode: level.mode, sessionSeed: seed,
      target: isSentence ? literal.split(/\s+/) : literal });
  });
}
