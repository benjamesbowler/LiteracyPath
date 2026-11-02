import test from 'node:test';
import assert from 'node:assert/strict';
import { HISTORICAL_REVIEW_SOURCES, heldAdministrativeBindingRole } from '../../tools/lib/appVisualHistoricalReviewSources.mjs';
import { checkHeldSourceEligibility } from '../../tools/lib/appVisualHeldSources.mjs';

function fixture(kind = 'historical-assessment-review-source') {
  const definition = HISTORICAL_REVIEW_SOURCES.assets.find(row => row.kind === kind);
  const state = { errors: [], questionIds: new Set(), imagePaths: new Set(),
    qaRowsByPath: new Map([[definition.path, structuredClone(definition.qaRows || [])]]),
    rawDecisions: { [definition.path]: { sha256: definition.sha256, visualReview: 'approved' } },
    compositeDecisions: { [definition.path]: { sha256: definition.sha256, visualReview: 'approved' } } };
  return { asset: { id: 'historical-example', path: definition.path, sha256: definition.sha256, kind },
    inventoryItem: { path: definition.path, sources: definition.sourceLiterals.map(s => 'source-literal:' + s) },
    rawBooks: [], runtimePaths: new Set(), finitePaths: new Set(), reachable: new Set(), historicalReviewState: state };
}
test('exact historical administrative thumbnail remains a held source, without pixel approval', () => {
  const result = checkHeldSourceEligibility(fixture());
  assert.equal(result.valid, true);
  assert.equal(result.role.newPixelApproval, false);
  assert.equal(result.role.learnerSelected, false);
});
for (const [label, change] of [
  ['unlisted path', x => { x.asset.path = x.inventoryItem.path = '/media/vocabulary/images/unlisted.webp'; }],
  ['changed bitmap', x => x.asset.sha256 = 'a'.repeat(64)],
  ['new kind', x => x.asset.kind = 'historical-any-image'],
  ['missing proof', x => delete x.historicalReviewState],
  ['source/caller drift', x => x.historicalReviewState.errors.push('Changed authority')],
  ['current finite bound', x => x.finitePaths.add(x.asset.path)],
  ['current reading slot', x => x.runtimePaths.add(x.asset.path)],
  ['current question image', x => x.historicalReviewState.imagePaths.add(x.asset.path)],
  ['current/historical question ID', x => x.historicalReviewState.questionIds.add(x.historicalReviewState.qaRowsByPath.get(x.asset.path)[0].questionId)],
  ['new QA pairing', x => x.historicalReviewState.qaRowsByPath.get(x.asset.path).push({ reviewId: 'new', questionId: 'new' })],
  ['missing QA pairing', x => x.historicalReviewState.qaRowsByPath.get(x.asset.path).pop()],
  ['changed QA target', x => x.historicalReviewState.qaRowsByPath.get(x.asset.path)[0].targetWord = 'different'],
  ['changed quarantine status', x => x.historicalReviewState.qaRowsByPath.get(x.asset.path)[0].status = 'quarantined'],
  ['new child source caller', x => x.inventoryItem.sources.push('source-literal:src/NewChildViewer.jsx')],
  ['imported source image', x => x.inventoryItem.sources.push('source-image-file')],
  ['Present output', x => x.inventoryItem.sources.push('runtime-present-document')]
]) test('historical review source rejects ' + label, () => {
  const x = fixture(); change(x); assert.equal(checkHeldSourceEligibility(x).valid, false);
});
test('the two exact reviewed variants remain unselected source inputs', () => {
  const result = checkHeldSourceEligibility(fixture('unselected-reviewed-assessment-source'));
  assert.equal(result.valid, true); assert.equal(result.role.newPixelApproval, false);
});
for (const [label, change] of [
  ['raw decision drift', x => x.historicalReviewState.rawDecisions[x.asset.path].sha256 = 'a'.repeat(64)],
  ['composite decision drift', x => x.historicalReviewState.compositeDecisions[x.asset.path].sha256 = 'a'.repeat(64)],
  ['new rejection', x => x.historicalReviewState.compositeDecisions[x.asset.path].visualReview = 'rejected'],
  ['missing raw approval', x => delete x.historicalReviewState.rawDecisions[x.asset.path]],
  ['new QA pairing', x => x.historicalReviewState.qaRowsByPath.set(x.asset.path, [{ questionId: 'new', reviewId: 'new' }])],
  ['current learner image', x => x.historicalReviewState.imagePaths.add(x.asset.path)],
  ['current broad bound', x => x.finitePaths.add(x.asset.path)]
]) test('source-only reviewed variant rejects ' + label, () => {
  const x = fixture('unselected-reviewed-assessment-source'); change(x); assert.equal(checkHeldSourceEligibility(x).valid, false);
});
test('only the exact current QA row purpose is separate from learner reachability', () => {
  const x = fixture(), state = x.historicalReviewState, assetPaths = new Set([x.asset.path]);
  const binding = { surface: 'Admin Media QA actual all-row thumbnail selector', kind: 'positive-current-output', path: x.asset.path,
    word: state.qaRowsByPath.get(x.asset.path)[0].reviewId };
  assert.equal(heldAdministrativeBindingRole(binding, { state, assetPaths }), 'retained-administrative-thumbnail');
  for (const change of [r => r.surface = 'Current child question', r => r.word = 'another-review', r => r.kind = 'finite-input-bound', r => r.path = '/images/unlisted.webp']) {
    const row = { ...binding }; change(row); assert.equal(heldAdministrativeBindingRole(row, { state, assetPaths }), null);
  }
  state.errors.push('caller changed'); assert.equal(heldAdministrativeBindingRole(binding, { state, assetPaths }), null);
});
test('only the two exact current source-decision identities are separate from learner output', () => {
  const x = fixture('unselected-reviewed-assessment-source'), state = x.historicalReviewState, assetPaths = new Set([x.asset.path]);
  const binding = { surface: 'Current assessment approved source decision authority', kind: 'approved-source-authority', path: x.asset.path, word: x.asset.sha256 };
  assert.equal(heldAdministrativeBindingRole(binding, { state, assetPaths }), 'retained-existing-source-decision');
  assert.equal(heldAdministrativeBindingRole({ ...binding, kind: 'positive-current-output' }, { state, assetPaths }), null);
  assert.equal(heldAdministrativeBindingRole({ ...binding, word: 'b'.repeat(64) }, { state, assetPaths }), null);
  state.compositeDecisions[x.asset.path].sha256 = 'c'.repeat(64);
  assert.equal(heldAdministrativeBindingRole(binding, { state, assetPaths }), null);
});
