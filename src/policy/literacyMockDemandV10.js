import { literacyMockDemandV9, LITERACY_MOCK_V9_LADDERS } from './literacyMockDemandV9.js';
import { isLiteracyMockWorkedTutorialTarget } from './literacyMockDemandV8.js';
import { LITERACY_MOCK_SOUND_TRANSFORMATIONS_V10_SOURCE, LITERACY_MOCK_V10_TRANSFORM_WORD_PHONEMES } from '../data/literacyMockSoundTransformationsV10.js';
import { LITERACY_V9_LOWER_SOUND_QUARANTINE } from './literacyMockTransformationDemandReview.js';

const transformationClaims = new Set(['substitute_initial', 'substitute_final', 'delete_phoneme', 'add_phoneme']);
const reviewedLowerDemandDefects = new Set(LITERACY_V9_LOWER_SOUND_QUARANTINE.map(row => row.id));
const vowels = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const literal = word => LITERACY_MOCK_V10_TRANSFORM_WORD_PHONEMES[word]?.split(' ');
export const LITERACY_MOCK_V10_LADDERS = Object.freeze({ ...LITERACY_MOCK_V9_LADDERS,
  sound_awareness: Object.freeze(LITERACY_MOCK_V9_LADDERS.sound_awareness.map((rung, band) => band === 5
    ? Object.freeze({ operation: 'manipulate_and_retain_phonemes',
      requires: 'Apply one phoneme change while retaining the source vowel and another source edge. Three changed alternatives share the changed edge/count; an unchanged-source alternative also makes the operation essential.' }) : rung)),
});

/** Structural and literal phoneme proof; never infer speech units from letters,
 * record order, source level or a claimed operation name alone. */
export function literacyMockV10TransformationProofValid(q) {
  const p = q.taskDemand?.proof, f = q.taskDemand?.features, operation = q.constructClaim;
  if (!transformationClaims.has(operation) || q.sourceProvenance?.file !== LITERACY_MOCK_SOUND_TRANSFORMATIONS_V10_SOURCE
    || q.taskDemand?.reviewed !== true || q.taskDemand.operation !== 'manipulate_and_retain_phonemes' || !p || !f
    || q.format !== 'choice' || q.evidenceModality !== 'audio' || q.modality !== 'listening'
    || !q.hideWrittenLabels || q.renderTargetText || q.passage || q.image
    || q.targetWord !== p.correctWord || q.sourceWord !== p.sourceWord || q.anchorWord !== p.anchorWord
    || q.correctWord !== p.correctWord || q.choices?.length !== 4
    || new Set(q.choices.map(c => c.label)).size !== 4
    || !same(literal(p.sourceWord), p.sourcePhonemes) || !same(literal(p.correctWord), p.resultPhonemes)
    || !Array.isArray(p.sourcePhonemes) || !Array.isArray(p.resultPhonemes)
    || !same(p.anchorWord ? literal(p.anchorWord) : [], p.anchorPhonemes)
    || !q.requiredAudioCues?.some(c => c.role === 'instruction' && c.text === p.instructionText)
    || q.requiredAudioCues.some(c => !['instruction', 'choice'].includes(c.role))
    || q.choices.some(c => c.image || !same(literal(c.label), p.choicePhonemes?.[c.id]) || p.choiceWords?.[c.id] !== c.label
      || !q.requiredAudioCues.some(a => a.role === 'choice' && a.choiceId === c.id && a.text === c.label))) return false;
  const expected = [...p.sourcePhonemes], change = p.change;
  const position = operation === 'substitute_final' ? 'last' : 'first';
  const prefix = operation === 'delete_phoneme' ? `Say ${p.sourceWord}. Take away its first sound.`
    : operation === 'add_phoneme' ? `Say ${p.sourceWord}. Add the first sound in ${p.anchorWord} at the beginning.`
      : `Say ${p.sourceWord}. Change its ${position} sound to the ${position} sound in ${p.anchorWord}.`;
  if (![prefix, ...['What word remains?', 'What word is left?', 'What word do you make?', 'What is the new word?'].map(tail => `${prefix} ${tail}`)].includes(p.instructionText)) return false;
  const index = operation === 'substitute_final' ? expected.length - 1 : 0;
  const inserted = operation === 'delete_phoneme' ? [] : [operation === 'substitute_final' ? p.anchorPhonemes.at(-1) : p.anchorPhonemes[0]];
  const removed = operation === 'add_phoneme' ? [] : [expected[index]];
  if (!same(change, { operation, index, removed, inserted })) return false;
  if (operation.startsWith('substitute_') && removed[0] === inserted[0]) return false;
  expected.splice(index, removed.length, ...inserted);
  if (!same(expected, p.resultPhonemes) || !same(p.choicePhonemes[q.answer], expected)
    || q.choices.find(c => c.id === q.answer)?.label !== p.correctWord || p.sourceWord === p.correctWord) return false;
  const vi = expected.findIndex(phone => vowels.test(phone)), ei = operation === 'substitute_final' ? 0 : expected.length - 1;
  const edgeFoil = p.choicePhonemes[p.otherEdgeFoilId], vowelFoil = p.choicePhonemes[p.vowelFoilId];
  const unchanged = p.choicePhonemes[p.unchangedSourceFoilId];
  if (vi < 0 || vi !== p.retainedVowelIndex || ei !== p.retainedOtherEdgeIndex
    || !edgeFoil || !vowelFoil || p.otherEdgeFoilId === p.vowelFoilId
    || new Set([q.answer, p.otherEdgeFoilId, p.vowelFoilId, p.unchangedSourceFoilId]).size !== 4
    || edgeFoil[vi] !== expected[vi] || edgeFoil[ei] === expected[ei]
    || vowelFoil[vi] === expected[vi] || vowelFoil[ei] !== expected[ei]
    || !same(unchanged, p.sourcePhonemes) || p.choiceWords[p.unchangedSourceFoilId] !== p.sourceWord
    || q.choices.filter(c => c.id !== p.unchangedSourceFoilId).some(c => p.choicePhonemes[c.id].length !== expected.length)
    || f.requiresLetters !== false || f.changedOptionsSamePhonemeCount !== true || f.changedEdgeSharedByChangedOptions !== true
    || f.unchangedSourceDiagnostic !== true || f.fourthChoiceDiagnostic !== 'unchanged_source'
    || f.retainedVowelContrast !== true || f.retainedOtherEdgeContrast !== true || f.resultPhonemeCount !== expected.length) return false;
  const changedEdge = operation === 'substitute_final' ? expected.length - 1 : 0;
  const changedOptions = q.choices.filter(c => c.id !== p.unchangedSourceFoilId);
  if (changedOptions.some(c => p.choicePhonemes[c.id][changedEdge] !== expected[changedEdge])) return false;
  if (operation === 'delete_phoneme' && changedOptions.some(c => p.choicePhonemes[c.id][0] === removed[0])) return false;
  if (operation === 'add_phoneme' && changedOptions.some(c => p.choicePhonemes[c.id][1] !== p.sourcePhonemes[0])) return false;
  const retainedPattern = sounds => operation === 'substitute_final' ? sounds.slice(0, -1)
    : sounds.slice(sounds.findIndex(sound => vowels.test(sound)));
  const pattern = retainedPattern(expected);
  const retaining = q.choices.filter(c => same(retainedPattern(p.choicePhonemes[c.id]), pattern));
  if (retaining.length !== 2 || !retaining.some(c => c.id === q.answer) || !retaining.some(c => c.id === p.unchangedSourceFoilId)) return false;
  const matchesChangedEdge = sounds => operation === 'substitute_final' ? sounds.at(-1) === expected.at(-1) : sounds[0] === expected[0];
  if (q.choices.filter(c => matchesChangedEdge(p.choicePhonemes[c.id])).length !== 3
    || retaining.filter(c => matchesChangedEdge(p.choicePhonemes[c.id])).length !== 1) return false;
  return true;
}

export function literacyMockDemandV10(q) {
  if (q.tutorialOnly || reviewedLowerDemandDefects.has(q.id) || isLiteracyMockWorkedTutorialTarget(q)
    || q.sourceWord && isLiteracyMockWorkedTutorialTarget({ targetWord: q.sourceWord })) return null;
  if (q.domainId === 'sound_awareness' && transformationClaims.has(q.constructClaim)) {
    return literacyMockV10TransformationProofValid(q) ? 5 : null;
  }
  const previous = literacyMockDemandV9(q);
  return q.domainId === 'sound_awareness' && previous === 5 ? null : previous;
}
