import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { loadLiteracyMockBank, scoreLiteracyMockResponse, literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { literacyMockBoundaryStateV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { LITERACY_V9_REVIEWED_TRANSFORMATIONS, LITERACY_V9_TRANSFORMATION_QUARANTINED_ITEM_IDS } from '../../src/policy/literacyMockTransformationDemandReview.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../src/data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../src/utils/progressCheckAudio.js';
import { mockConstructionLength } from '../../src/utils/literacyMockResponse.js';

const publication = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v9', includeUnavailable: true });
const bank = publication.filter(item => item.mediaReady);
const byId = new Map(bank.map(item => [item.id, item]));
const withdrawn = new Set(LITERACY_V9_TRANSFORMATION_QUARANTINED_ITEM_IDS);
const tutorials = Object.values(literacyMockTutorialIdsForVersion('literacy-mock-v9')).map(id => byId.get(id));
assert.ok(tutorials.every(Boolean), 'All required V9 tutorials must have their exact resolved media.');
const byteSizes = new Map();

// The original 225-sitting V9 capacity proof predates the literal demand
// withdrawals. Preserve its publication; current quality must fail closed when
// the remaining five transformation families cannot support another reserve.
// V10 carries the replacement five-retake acceptance gate.
test('V9 keeps its full immutable publication and the original forty transformation snapshots', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261016141524_literacy_mock_catalogue_v9.sql', import.meta.url));
  assert.equal(createHash('sha256').update(sql).digest('hex'), '3d2e31cafbea3419c1751661644e001847bee2310971592f90f9ae3fbf23e117');
  assert.equal(publication.length, 10340);
  assert.equal(withdrawn.size, 35);
  for (const proof of LITERACY_V9_REVIEWED_TRANSFORMATIONS) {
    const item = byId.get(proof.id);
    assert.ok(item, proof.id);
    assert.equal(item.adaptiveAreaBand, 5);
    assert.equal(item.itemSnapshot.adaptiveAreaBand, 5);
    assert.deepEqual(item.choices.map(choice => choice.label).sort(), [proof.answer, ...proof.foils].map(choice => choice.word).sort());
    assert.equal(item.choices.find(choice => choice.id === item.answer).label, proof.answer.word);
    assert.equal(isLiteracyItemEligible(item), !withdrawn.has(item.id), proof.id);
  }
});

function selectedValue(item, correct) {
  if (correct) return item.answer;
  let values;
  if (item.format === 'build_word') {
    const length = mockConstructionLength(item), labels = item.choices.map(choice => choice.label);
    values = labels.map((_label, start) => Array.from({ length }, (_value, index) => labels[(start + index) % labels.length]).join(''));
  } else if (Array.isArray(item.answer)) values = [[...item.answer].reverse(), [...item.answer.slice(1), item.answer[0]],
    [item.choices.find(choice => choice.id !== item.answer[0])?.id, ...item.answer.slice(1)]];
  else values = item.choices.map(choice => choice.id);
  const value = values.find(candidate => !scoreLiteracyMockResponse(item, candidate));
  assert.notEqual(value, undefined, `A real incorrect selected value must exist for ${item.id}.`);
  return value;
}

function sitting({ seed, sequence, exposures, correct }) {
  const context = `V9 seed ${seed}, sitting ${sequence + 1}, ${correct ? 'correct' : 'incorrect'}`;
  let offlineIds = [];
  let plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: `v9-current-quality-${correct}-${seed}-${sequence}`, studentId: `same-child-${seed}`,
    exposures, onOfflineItems: ids => { offlineIds = ids; } });
  assert.ok(offlineIds.every(id => !withdrawn.has(id)), `${context}: withdrawn tasks must never enter the offline reserve`);
  const pool = bank.filter(item => offlineIds.includes(item.id));
  const paths = new Set([...pool, ...tutorials].flatMap(item => [...item.requiredAudioPaths, ...item.requiredImagePaths].map(path => path.split('#')[0])));
  paths.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.readPassage));
  paths.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle));
  const bytes = [...paths].reduce((sum, path) => {
    if (!byteSizes.has(path)) byteSizes.set(path, statSync(new URL(`../../public${path}`, import.meta.url)).size);
    return sum + byteSizes.get(path);
  }, 0);
  assert.ok(paths.size <= 768, `${context}: ${paths.size} assets exceeds the bounded reserve.`);
  assert.ok(bytes <= 48 * 1024 * 1024, `${context}: ${bytes} bytes exceeds the retained byte budget.`);
  const rows = [];
  while (rows.length < plan.itemIds.length) {
    const item = byId.get(plan.itemIds[rows.length]);
    const state = literacyMockBoundaryStateV9(rows, { bank: byId })[item.domainId];
    assert.ok(!withdrawn.has(item.id) && isLiteracyItemEligible(item), `${context}: only current valid demand can be delivered`);
    assert.equal(item.adaptiveAreaBand, state.nextBand, `${context}: canonical next demand`);
    assert.equal(state.complete, false, `${context}: stopped areas cannot receive a new question`);
    assert.equal(getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures, responses: rows })).knownFamiliar, null, `${context}: fresh target ${item.id}`);
    const selected = selectedValue(item, correct);
    assert.equal(scoreLiteracyMockResponse(item, selected), correct, `${context}: actual selected-value scoring`);
    rows.push({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
      itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: 'independent',
      supportUsed: false, selected, isCorrect: correct });
    const prefix = plan.itemIds.slice(0, rows.length);
    plan = adaptLiteracyMockBoundaryPlan(pool, plan, rows, [], [], { exposures });
    assert.deepEqual(plan.itemIds.slice(0, rows.length), prefix);
  }
  assert.equal(rows.length, correct ? 58 : 16, context);
  const states = literacyMockBoundaryStateV9(rows, { bank: byId });
  assert.ok(Object.values(states).every(state => state.complete && state.stopReason === (correct ? 'ceiling_confirmed' : 'floor_confirmed')), context);
  assert.ok(states.print.lowerLetterTargets.length <= 5, `${context}: finite print target cap`);
  return { rows, plan, assets: paths.size, bytes };
}

test('current V9 completes one high route then refuses a second insufficient fresh offline reserve without changing saved evidence', t => {
  const transformations = bank.filter(item => item.domainId === 'sound_awareness' && item.adaptiveAreaBand === 5
    && item.adaptiveMixedEligible && isLiteracyItemEligible(item));
  assert.equal(transformations.length, 5);
  for (let seed = 0; seed < 3; seed++) {
    const first = sitting({ seed, sequence: 0, exposures: [], correct: true });
    const before = JSON.stringify(first), exposures = [...first.rows], beforeExposures = JSON.stringify(exposures);
    let suppliedOfflineReserve = false;
    assert.throws(() => selectLiteracyMockBoundaryPlan(bank, { sessionId: `v9-current-quality-second-${seed}`, studentId: `same-child-${seed}`, exposures,
      onOfflineItems: () => { suppliedOfflineReserve = true; } }), error => error.code === 'mock_fresh_capacity'
      && error.message === 'Not enough fresh sound_awareness questions at demand 5.');
    assert.equal(suppliedOfflineReserve, false, 'A partial reserve must never be returned as a ready test.');
    assert.equal(JSON.stringify(first), before, 'The completed first answers and plan remain immutable.');
    assert.equal(JSON.stringify(exposures), beforeExposures, 'Capacity failure must not consume or rewrite history.');
    t.diagnostic(JSON.stringify({ seed, firstLength: first.rows.length, assets: first.assets, bytes: first.bytes, nextPreparation: 'mock_fresh_capacity' }));
  }
});

test('current V9 lower routes still complete five fresh floor sittings and never deliver withdrawn demand', t => {
  for (let seed = 0; seed < 3; seed++) {
    const exposures = [];
    for (let sequence = 0; sequence < 5; sequence++) {
      const current = sitting({ seed, sequence, exposures, correct: false });
      exposures.push(...current.rows);
    }
    t.diagnostic(JSON.stringify({ seed, completedFloorSittings: 5, answerCount: exposures.length }));
  }
});
