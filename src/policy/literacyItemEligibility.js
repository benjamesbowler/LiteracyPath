// Selection quarantine only. Published questions, saved answers and their keys
// remain immutable; reporting applies this defect separately from child errors.
// Each listed cloze offers two conventional spellings of the same recording
// without a picture or sentence establishing the intended meaning.
const groups = [
  ['turn', 'tern', [
    'lp3.r_controlled_vowels.l1.C.ur.v9',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.legacy-heard.turn',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.heard-print.turn',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.turn',
  ]],
  ['fur', 'fir', [
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.legacy-heard.fur',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.legacy-heard.fur',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.heard-print.fur',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.fur',
  ]],
  ['surf', 'serf', [
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.legacy-heard.surf',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.legacy-heard.surf',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l1.heard-print.surf',
    'mock.capacity.foundation.pattern.complete-r-controlled-spelling-ur.l2.heard-print.surf',
  ]],
  ['meat', 'meet', [
    'lp3.vowel_teams.l1.A.ea.v104',
    'mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.legacy-heard.meat',
  ]],
  ['see', 'sea', [
    'mock.capacity.foundation.pattern.complete-vowel-team-spelling-ee-long-e.l1.legacy-heard.see',
    'mock.capacity.foundation.pattern.complete-vowel-team-spelling-ee-long-e.l1.heard-print.see',
  ]],
  ['sea', 'see', [
    'mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.legacy-heard.sea',
    'mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.heard-print.sea',
  ]],
  ['heal', 'heel', ['mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l1.heard-print.heal']],
  ['beach', 'beech', ['mock.capacity.foundation.pattern.complete-vowel-team-spelling-ea-long-e.l2.legacy-heard.beach']],
];
const issues = new Map(groups.flatMap(([target, alternative, ids]) => ids.map(id => [id, Object.freeze({
  code: 'ambiguous_spelling', target, alternative,
  reason: `This question offers both ${target} and ${alternative} from the same spoken word without context to distinguish them. It cannot establish a correct or incorrect literacy response.`,
})])));

export const LITERACY_QUARANTINED_ITEM_IDS = Object.freeze([...issues.keys()]);

export function literacyItemQualityIssue(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const source = value.itemSnapshot || value.questionSnapshot || value.question || value;
  return [value.questionId, value.id, source.id, value.sourceItemId, source.sourceItemId]
    .map(id => issues.get(id)).find(Boolean) || null;
}

export const isLiteracyItemEligible = value => !literacyItemQualityIssue(value);
