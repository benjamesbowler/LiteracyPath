import { getCvcWordGraphemes } from "../../../data/cvcWordFamilies.js";
// Activity completion records describe practice, never a mastery judgement.
export const PHONICS_ACTIVITY_VERSION = 'phonics-practice-v3';

export function createPhonicsCompletion(steps, id = globalThis.crypto?.randomUUID?.() || `practice-${Date.now()}-${Math.random().toString(36).slice(2)}`) {
  return { id, contentVersion: PHONICS_ACTIVITY_VERSION, completedAt: new Date().toISOString(), steps: steps.map(step => ({ ...step, independent: false })) };
}

export function makeMatchTiles(lesson, epoch = 0) {
  const tiles = [...lesson.words.map(word => ({ word, isCorrect: true })), ...lesson.distractors.map(word => ({ word, isCorrect: false }))];
  let seed = [...lesson.letter].reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), 2166136261) >>> 0;
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  const offset = epoch % Math.max(1, tiles.length);
  return [...tiles.slice(offset), ...tiles.slice(0, offset)];
}

export function getWorkshopPrerequisites(family, progress = {}) {
  // Both targets and distractors are part of the authored task the child sees.
  const graphemes = [...new Set([...(family.buildWords || []), ...(family.magicSwaps || [])].flatMap(getCvcWordGraphemes).concat(family.distractorLetters || []))].sort();
  const taught = new Set(Object.entries(progress).filter(([, value]) => (typeof value === 'string' ? value : value?.status) === 'completed').map(([key]) => key.toLowerCase()));
  const missing = graphemes.filter(grapheme => !taught.has(grapheme));
  return { graphemes, missing, eligible: missing.length === 0 };
}

export function getPrintedMatchContract(lesson) {
  const ending = lesson.matchPosition === 'end';
  return { construct: ending ? 'printed_ending_matching' : 'printed_onset_matching',
    prompt: `Look at the words. Find the ${lesson.letter} ${ending ? 'endings' : 'beginnings'}.`,
    location: ending ? 'ending' : 'beginning' };
}

export function settleExposureDeliveries(deliveries) {
  return Object.fromEntries(Object.entries(deliveries).map(([key, status]) => [key, status === 'pending' || status === 'playing' ? 'interrupted' : status]));
}
