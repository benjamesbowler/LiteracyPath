import assert from 'node:assert/strict';
import test from 'node:test';
import { statSync } from 'node:fs';
import { LITERACY_MOCK_RUNTIME_V14 as bank } from '../../src/data/generated/literacyMockRuntimeV14.generated.js';
import { literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockRuntimeBank.js';
import { resolveLiteracyMockImagePath } from '../../src/data/literacyMockImageDelivery.js';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_CONTINUOUS_ROUTING } from '../../src/policy/literacyMockVersions.js';
import { continuousLiteracyMockBand, LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS } from '../../src/policy/literacyMockContinuousRouting.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { adaptLiteracyMockPlan, selectLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { mockOfflineMediaPaths, mockOfflineMediaAssetLimit } from '../../src/utils/literacyMockOfflineMedia.js';
import { literacyMockReadingInstructionPath } from '../../src/utils/literacyMockNarration.js';

const byId = new Map(bank.map(item => [item.id, item]));
const excluded = new Set(LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS);
const independent = { responseStatus: 'answered', evidenceType: 'independent', isCorrect: true };
const tutorials = Object.values(literacyMockTutorialIdsForVersion(bank[0].contentVersion)).map(id => byId.get(id));
const assetBytes = new Map();

// Compare fractions as integers. This checks direction and the smallest
// possible move independently of the implementation that chooses each item.
function verifyStep(previous, next, outcome) {
  const fromMax = LITERACY_MOCK_AREA_MAX[previous.domainId];
  const toMax = LITERACY_MOCK_AREA_MAX[next.domainId];
  const fromBand = previous.adaptiveAreaBand;
  const toBand = next.adaptiveAreaBand;
  const change = toBand * fromMax - fromBand * toMax;
  const context = `${previous.domainId} ${fromBand}/${fromMax} to ${next.domainId} ${toBand}/${toMax} after ${outcome}`;
  if (outcome === 'hold') assert.ok(2 * Math.abs(change) <= fromMax, context);
  else if (outcome === 'correct') {
    if (fromBand === fromMax) assert.equal(toBand, toMax, context);
    else assert.ok(change > 0 && change <= fromMax, context);
  } else if (fromBand === 0) assert.equal(toBand, 0, context);
  else assert.ok(change < 0 && change >= -fromMax, context);
}

test('every pair of authored area ladders moves to the adjacent destination step or holds at its limit', () => {
  const neutral = [
    { supportUsed: true }, { knownFamiliar: true }, { responseStatus: 'skipped', isCorrect: null },
    { helpPending: true }, { evidenceType: 'unscored' }, { classification: 'familiar' },
  ];
  for (const [domainId, maximum] of Object.entries(LITERACY_MOCK_AREA_MAX)) {
    for (let band = 0; band <= maximum; band++) {
      const previous = { domainId, adaptiveAreaBand: band };
      for (const area of Object.keys(LITERACY_MOCK_AREA_MAX)) {
        assert.equal(continuousLiteracyMockBand(null, null, area), 1);
        for (const [outcome, row] of [['correct', independent], ['incorrect', { ...independent, isCorrect: false }],
          ...neutral.map(value => ['hold', { ...independent, ...value }])]) {
          const next = { domainId: area, adaptiveAreaBand: continuousLiteracyMockBand(row, previous, area) };
          verifyStep(previous, next, outcome);
        }
      }
    }
  }
});

function sitting(itemCount, rotation, decide, exposures = []) {
  const options = {
    sessionId: '90000000-0000-4000-8000-00000000000' + rotation, studentId: 'route-check',
    routingPolicy: LITERACY_MOCK_CONTINUOUS_ROUTING, itemCount, exposures,
  };
  let reserveIds;
  let plan = selectLiteracyMockPlan(bank, { ...options, onOfflineItems: ids => { reserveIds = new Set(ids); } });
  const reserve = bank.filter(item => reserveIds.has(item.id));
  assert.ok(reserve.every(item => !excluded.has(item.id)));
  const media = [...reserve, ...tutorials];
  const paths = mockOfflineMediaPaths(media, media.map(literacyMockReadingInstructionPath).filter(Boolean));
  assert.ok(paths.length <= mockOfflineMediaAssetLimit(bank[0].contentVersion));
  let totalBytes = 0;
  for (const path of paths) {
    const file = resolveLiteracyMockImagePath(path).split(/[?#]/)[0];
    if (!assetBytes.has(file)) assetBytes.set(file, statSync(new URL(`../../public${file}`, import.meta.url)).size);
    const size = assetBytes.get(file);
    assert.ok(size > 0 && size <= 4 * 1024 ** 2, path);
    totalBytes += size;
  }
  assert.ok(totalBytes <= 48 * 1024 ** 2, `offline reserve requires ${totalBytes} bytes`);
  let classroom = createWholeClassMockSession(bank, options);
  const visits = [];
  while (visits.length < plan.itemIds.length) {
    const index = visits.length;
    const item = byId.get(plan.itemIds[index]);
    const previous = visits.at(-1);
    if (previous) verifyStep(previous.item, item, previous.outcome);
    else assert.equal(item.adaptiveAreaBand, 1);
    assert.deepEqual(classroom.run.plan, plan);
    assert.equal(getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures: [...exposures, ...classroom.run.responses] })).knownFamiliar, null);
    const outcome = decide(index, item);
    const answer = outcome === 'incorrect' ? (item.format === 'build_word' ? 'xxxx' : Array.isArray(item.answer)
      ? [item.choices.find(choice => choice.id !== item.answer[0]).id] : item.choices.find(choice => choice.id !== item.answer).id) : item.answer;
    classroom = submitWholeClassMockAnswer(classroom, item, {
      questionId: item.id, responseStatus: 'answered', selected: answer, supportUsed: outcome === 'hold',
      audioDelivery: Object.fromEntries(item.requiredAudioPaths.map(path => [path, 'completed'])),
    });
    assert.equal(classroom.run.responses.at(-1).isCorrect, outcome !== 'incorrect');
    visits.push({ item, outcome });
    plan = adaptLiteracyMockPlan(reserve, plan, classroom.run.responses, [], classroom.run.presentations, options);
    assert.deepEqual(plan.itemIds.slice(0, visits.length), visits.map(value => value.item.id));
  }
  assert.deepEqual(plan, classroom.run.plan);
  assert.ok(visits.length >= 15 && visits.length <= itemCount);
  assert.equal(new Set(visits.map(value => value.item.domainId)).size, 8);
  return classroom.run.responses;
}

test('new mixed tests carry the actual question demand across areas on both entries at 15, 25 and 40 questions', () => {
  for (const cap of [15, 25, 40]) {
    for (const [index, decide] of [
      () => 'correct', () => 'incorrect', n => n % 2 ? 'incorrect' : 'correct',
      n => n < 6 ? 'correct' : n < 13 ? 'incorrect' : 'correct',
      n => n < 6 ? 'incorrect' : n < 13 ? 'correct' : 'incorrect',
      n => ['hold', 'correct', 'incorrect', 'hold', 'incorrect'][n % 5],
    ].entries()) sitting(cap, index, decide);
  }
});

test('five consecutive continuous sittings select fresh evidence including high-demand items on retests', () => {
  const exposures = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    exposures.push(...sitting(40, attempt, n => attempt % 2 === 0 || n % 7 > 2 ? 'correct' : 'incorrect', exposures));
  }
});

test('a fifth retake still uses fresh context words that also appear in the beginner bank', () => {
  const previousWords = new Set(['letter','bark','chest','post','palm','match','seal','crane',
    'pitch','bank','rock','date','nail','patch','coach','clip']);
  const exposures = bank.filter(item => item.skillId === 'context_clues' && item.adaptiveAreaBand === 3
    && previousWords.has(item.targetWord));
  assert.equal(exposures.length,16);
  const answers = sitting(40,2,index => index < 7 || index >= 15 ? 'correct' : 'incorrect',exposures);
  assert.equal(answers[2].domainId,'vocabulary');
  assert.equal(answers[2].itemSnapshot.adaptiveAreaBand,3);
});

test('unseen placeholders cannot exhaust or lower the actual next question on a depleted retake', () => {
  const contexts = bank.filter(item => item.skillId === 'context_clues' && item.adaptiveAreaBand === 3);
  assert.equal(contexts.length,26);
  for (const remaining of [['spring','trunk','pupil'],['spring','trunk']]) {
    // Steps three and five use the same word families. The original 40-slot
    // plan would reserve three of these families before any pupil response.
    const exposures = contexts.filter(item => !remaining.includes(item.targetWord));
    const answers = sitting(40,2,index => index < 2 ? 'correct' : 'incorrect',exposures);
    assert.equal(answers[2].domainId,'vocabulary');
    assert.equal(answers[2].itemSnapshot.adaptiveAreaBand,3);
    assert.ok(remaining.includes(answers[2].itemSnapshot.targetWord));
  }
  // When even one actual context task is impossible the test must stop at Q3.
  const options = {sessionId:'90000000-0000-4000-8000-000000000002',studentId:'route-check',
    itemCount:40,routingPolicy:LITERACY_MOCK_CONTINUOUS_ROUTING,exposures:contexts};
  let session = createWholeClassMockSession(bank,options);
  for (let index = 0; index < 2; index++) {
    const item = session.rounds[index];
    const response = {questionId:item.id,responseStatus:'answered',selected:item.answer,supportUsed:false,
      audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path => [path,'completed']))};
    if (index === 0) session = submitWholeClassMockAnswer(session,item,response);
    else assert.throws(() => submitWholeClassMockAnswer(session,item,response), {code:'mock_fresh_capacity'});
  }
});
