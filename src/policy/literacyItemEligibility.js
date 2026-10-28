import { literacyV9ReviewedRhymeIssue, LITERACY_V9_RHYME_QUARANTINE } from './literacyMockRhymeDemandReview.js';
import { literacyV9ReviewedTransformationIssue, LITERACY_V9_TRANSFORMATION_QUARANTINE, LITERACY_V9_LOWER_SOUND_QUARANTINE } from './literacyMockTransformationDemandReview.js';
import { literacyMockBeginnerVocabularyIssue } from './literacyMockBeginnerVocabulary.js';

// Selection quarantine only. Published questions, saved answers and their keys
// remain immutable; reporting applies this defect separately from child errors.
// The spelling groups below offer two conventional spellings of one recording
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

export const LITERACY_SPELLING_QUARANTINED_ITEM_IDS = Object.freeze([...issues.keys()]);
export const LITERACY_PICTURE_QUARANTINE = Object.freeze([
  {id:'mock.v5.vocabulary.1.tree',reason:'Both the tree picture and the log scene contain clear trees. The pictures do not establish one uniquely correct choice.'},
  {id:'mock.v5.vocabulary.1.chair',reason:'The desk scene also contains a clear chair. Both pictures can match the spoken word chair.'},
  {id:'mock.v5.language.action.0.look',reason:'The standing child does not uniquely depict looking. The picture cannot establish the intended action.'},
  {id:'mock.v5.language.action.1.look',reason:'People in the target and alternatives can all be looking. The picture cannot establish one uniquely correct action.'},
  {id:'mock.v5.language.action.1.hop',reason:'Both the frog and the rope-skipping child can be hopping. The pictures do not establish one uniquely correct action.'},
]);
for(const {id,reason} of LITERACY_PICTURE_QUARANTINE)issues.set(id,Object.freeze({code:'ambiguous_picture',reason}));

// Unconditional withdrawals only. Version/demand-specific reviews are applied
// below from their snapshot context, never inferred from a compact ID alone.
export const LITERACY_QUARANTINED_ITEM_IDS = Object.freeze([...issues.keys()]);
// Shared forward-SQL authoring authority. Historical publications are not
// rewritten: each defect requires its exact snapshot demand context.
export const LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES = Object.freeze([
  ...LITERACY_V9_RHYME_QUARANTINE.map(row => Object.freeze({ ...row, adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: 2 })),
  ...LITERACY_V9_TRANSFORMATION_QUARANTINE.map(row => Object.freeze({ ...row, adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: 5 })),
  ...LITERACY_V9_LOWER_SOUND_QUARANTINE.map(row => Object.freeze({ ...row, adaptiveAreaVersion: 'areas-v5' })),
  ...[...LITERACY_V9_TRANSFORMATION_QUARANTINE, ...LITERACY_V9_LOWER_SOUND_QUARANTINE].map(row => Object.freeze({
    ...row, contentVersion: 'literacy-mock-v10', adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: null,
  })),
]);

export function literacyItemQualityIssue(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const source = value.itemSnapshot || value.questionSnapshot || value.question || value;
  const ids = [value.questionId, value.id, source.id, value.sourceItemId, source.sourceItemId];
  return ids.map(id => issues.get(id)).find(Boolean) || literacyV9ReviewedRhymeIssue(ids, source)
    || literacyV9ReviewedTransformationIssue(ids, source) || literacyMockBeginnerVocabularyIssue(source);
}

export const isLiteracyItemEligible = value => !literacyItemQualityIssue(value);
