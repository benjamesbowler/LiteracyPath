import { gameRandom, replayWithinBands } from './gameReplay.js';
import { buildRocketRunRound, rocketRunLadder, ROCKET_RUN_LEVELS, wordsStartingWithTargetSound,
  wordStartsWithTargetSound } from './rocketRunRounds.js';
import { onsetGrapheme, sharesSound } from '../components/elQuest/elQuestEngine.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { rocketCourierOnsetCue } from './rocketRunTeachingCue.js';

// This is a frozen V2 repair list, rather than an availability-dependent bank.
// A later media admission must not silently change an already saved outing.
const UNRECORDED_INCOMING_WORDS = new Set(['adder', 'champ', 'chunk', 'ebb', 'elk', 'elm', 'inn',
  'issue', 'muffin', 'nag', 'odd', 'throat', 'void', 'vow', 'yap', 'zag', 'zen', 'zig', 'zit']);
// These six existing Leda recordings were reviewed for their actual onsets.
// In particular added/inside/ink/otter have the taught short vowel, rather
// than being admitted just because their first printed letters match.
const RECORDED_CAPACITY_EXTRAS = Object.freeze({
  a: Object.freeze(['added']), i: Object.freeze(['ink', 'inside']),
  m: Object.freeze(['mother']), o: Object.freeze(['otter']), v: Object.freeze(['voice']),
});

export function rocketV2WordStartsWithTargetSound(word, target) {
  return wordStartsWithTargetSound(word, target) || Boolean(RECORDED_CAPACITY_EXTRAS[target]?.includes(word));
}

export function rocketV2RecordedOnsetPool(target) {
  return [...new Set([...wordsStartingWithTargetSound(target), ...(RECORDED_CAPACITY_EXTRAS[target] || [])])]
    .filter(word => !UNRECORDED_INCOMING_WORDS.has(word));
}

/** Keep the selected bank/random stream and replace only unavailable incoming
 * names. Repair once before assigning encounter IDs; retries never reselect.
 * The original name is retained as authoring provenance, never learner audio
 * evidence. Both lists and the sequence describe the new actual word. */
export function repairRocketV2RecordedSlots(bank, difficulty) {
  const range = difficulty === 'hard' ? [4, 6] : difficulty === 'medium' ? [3, 5] : [2, 4];
  const inRange = word => word.length >= range[0] && word.length <= range[1];
  const used = new Set(bank.sequence.map(row => row.word));
  const replacements = new Map(), repairs = [];
  const sequence = bank.sequence.map((row, ordinal) => {
    if (!UNRECORDED_INCOMING_WORDS.has(row.word)) return { ...row };
    const onset = row.correct ? bank.targetGrapheme : rocketCourierOnsetCue(row.word);
    const pool = rocketV2RecordedOnsetPool(onset);
    // Preserve the shared builder's explicit small-pool fallback (e.g. easy
    // th), where the original choice bank already contains longer words.
    const originalInBand = wordsStartingWithTargetSound(onset).filter(inRange);
    const allowed = originalInBand.length < 3 ? pool : pool.filter(inRange);
    const available = allowed.filter(word => !used.has(word)
      && (row.correct ? rocketV2WordStartsWithTargetSound(word, bank.targetGrapheme)
        : !sharesSound(rocketCourierOnsetCue(word), bank.targetGrapheme)));
    const word = available.find(word => word.length === row.word.length) || available[0];
    if (!word || !getLedaWordAudioPath(word)) throw new Error('No distinct recorded same-onset word for Rocket V2 slot');
    used.add(word); replacements.set(row.word, word);
    repairs.push({ ordinal, from: row.word, to: word, onset, reason: 'unrecorded-incoming-word',
      src: getLedaWordAudioPath(word) });
    return { ...row, word };
  });
  return { ...bank, sequence, correct: bank.correct.map(word => replacements.get(word) || word),
    distractors: bank.distractors.map(word => replacements.get(word) || word), incomingWordRepairs: repairs };
}

/** Queen/quilt begin /k w/, so they are not valid negative first-sound
 * choices for heard /k/. Keep the old random stream/correct bank and replace
 * only these V2 negative slots with distinct authored hard-/g/ contrasts.
 * Neither the shared legacy builder nor the global learning bank is changed.
 */
export function repairRocketV2Distractors(bank, difficulty) {
  const target = bank.targetGrapheme;
  if (!sharesSound(target, 'k')) return { ...bank, distractorRepairs: [] };
  const range = difficulty === 'hard' ? [4, 6] : difficulty === 'medium' ? [3, 5] : [2, 4];
  const used = new Set(bank.sequence.map(row => row.word)), replacements = new Map();
  const contrasts = wordsStartingWithTargetSound('g').filter(word => word.length >= range[0] && word.length <= range[1]);
  const repairs = [];
  const sequence = bank.sequence.map((row, ordinal) => {
    if (row.correct || onsetGrapheme(row.word) !== 'qu') return { ...row };
    const available = contrasts.filter(word => !used.has(word));
    const word = available.find(word => word.length === row.word.length) || available[0];
    if (!word) throw new Error('No distinct authored /g/ contrast for the ambiguous /k/ negative slot');
    used.add(word); replacements.set(row.word, word); repairs.push({ ordinal, from: row.word, to: word });
    return { ...row, word };
  });
  return { ...bank, sequence, distractors: bank.distractors.map(word => replacements.get(word) || word),
    distractorRepairs: repairs };
}

export function rocketRunRequiredCount(difficulty) {
  return difficulty === 'hard' ? 12 : difficulty === 'medium' ? 9 : 5;
}

/** Reconstruct the entire existing bank before selecting a resumed round.
 * This avoids regenerating a different school after Retry or a positive legacy
 * checkpoint. Trial IDs survive physical passage, return and saving. */
export function rocketRunV2Outing(difficulty, sessionSeed = 0) {
  const random = gameRandom(sessionSeed);
  const ladder = replayWithinBands(rocketRunLadder(difficulty), sessionSeed, target => target.length);
  return ladder.slice(0, ROCKET_RUN_LEVELS).map((target, round) => {
    const bank = repairRocketV2RecordedSlots(repairRocketV2Distractors(buildRocketRunRound(target,
      { count: rocketRunRequiredCount(difficulty), difficulty, random }), difficulty), difficulty);
    return {
      round, target, needed: bank.needed,
      distractorRepairs: bank.distractorRepairs,
      incomingWordRepairs: bank.incomingWordRepairs,
      choices: bank.sequence.map((row, ordinal) => ({
        ...row, id: `rocket-${round}-${ordinal}`, ordinal,
      })),
    };
  });
}

/** Return the unchanged word identity; a missed carrier does not become a
 * wrong choice and cannot disappear from the true required denominator. */
export function returnRocketTrial(plan, trial, caughtIds, misses = 0) {
  const canonical = plan.choices.find(row => row.id === trial.id);
  if (!canonical || !canonical.correct || caughtIds.includes(canonical.id)) return null;
  return { ...canonical, misses: Math.max(0, Number(misses) || 0) + 1,
    support: ['motor-return'], approachSpoken: false, passed: false };
}
