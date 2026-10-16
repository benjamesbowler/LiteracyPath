import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { loadLiteracyMockBank, scoreLiteracyMockResponse, literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { literacyMockBoundaryStateV9, LITERACY_MOCK_V9_MAX_ITEMS } from '../../src/policy/literacyMockBoundaryV9.js';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../src/data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../src/utils/progressCheckAudio.js';
import { mockConstructionLength } from '../../src/utils/literacyMockResponse.js';
import { mockOfflineMediaPaths, prepareMockOfflineMedia } from '../../src/utils/literacyMockOfflineMedia.js';

const publication = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10', includeUnavailable: true });
const bank = publication.filter(item => item.mediaReady);
const byId = new Map(bank.map(item => [item.id, item]));
const tutorials = Object.values(literacyMockTutorialIdsForVersion('literacy-mock-v10')).map(id => byId.get(id));
assert.ok(tutorials.every(Boolean), 'All required V10 tutorials must have their exact resolved media.');
// V10 retains the areas-v5 boundary policy and budgets. Only its authored
// transformation stock changes; the actual selected questions and files must
// still complete the same five-retake release contract.
test('V10 authors forty distinct transformations and admits sufficient reviewed non-tutorial stock', () => {
  const authored = publication.filter(item => item.id.startsWith('mock.v10.sounds.transform.'));
  assert.equal(authored.length, 40);
  assert.equal(new Set(authored.map(item => item.exposureFamilyId)).size, 40);
  assert.ok(authored.every(item => item.choices.length === 4), 'Every final transformation includes its unchanged-source diagnostic foil.');
  const ceiling = bank.filter(item => item.domainId === 'sound_awareness' && item.adaptiveAreaBand === 5
    && item.adaptiveMixedEligible && isLiteracyItemEligible(item));
  assert.ok(ceiling.length >= 20, `${ceiling.length} admitted transformations cannot provide the retained stock margin.`);
  assert.ok(ceiling.every(item => item.id.startsWith('mock.v10.sounds.transform.')
    && item.sourceProvenance.file === 'src/data/literacyMockSoundTransformationsV10.js'
    && item.mediaReady === true), 'All admitted transformations need their reviewed source and real resolved media.');
  assert.equal(new Set(ceiling.map(item => item.exposureFamilyId)).size, ceiling.length);
});

test('every V10 deliverable media path retains real local bytes through the actual offline cache API', async t => {
  const paths = mockOfflineMediaPaths(bank.filter(item => item.tutorialOnly || item.adaptiveMixedEligible && isLiteracyItemEligible(item)));
  let totalBytes = 0;
  // This exercises URL authorization and write/readback with real public files.
  // It is local cache evidence, not a browser/network or physical-device claim.
  for (let offset = 0; offset < paths.length; offset += 96) {
    const batch = paths.slice(offset, offset + 96), entries = new Map(), fetched = [], revoked = [];
    let created = 0;
    const options = {
      cacheStorage: { open: async () => ({ match: async path => entries.get(path)?.clone(),
        put: async (path, response) => { entries.set(path, response.clone()); } }) },
      fetcher: async (path, request) => {
        assert.equal(request.credentials, 'omit'); fetched.push(path);
        return new Response(readFileSync(new URL(`../../public${path}`, import.meta.url)), {
          headers: { 'content-type': path.startsWith('/audio/') ? 'audio/mpeg' : 'image/webp' },
        });
      },
      createObjectURL: () => `blob:v10-local-${++created}`, revokeObjectURL: url => { revoked.push(url); },
    };
    const online = await prepareMockOfflineMedia(batch, options);
    assert.equal(online.assets, batch.length); assert.deepEqual(new Set(fetched), new Set(batch));
    totalBytes += online.bytes; online.dispose(); assert.equal(revoked.length, batch.length);
    const offline = await prepareMockOfflineMedia(batch, { ...options, fetcher: async () => { throw new Error('Offline reuse must read retained bytes.'); } });
    assert.equal(offline.assets, batch.length); offline.dispose(); assert.equal(revoked.length, batch.length * 2);
  }
  t.diagnostic(JSON.stringify({ realMediaPaths: paths.length, totalBytes, cacheReadbackAndOfflineReuse: true }));
});

const byteSizes = new Map();
function selectedValue(item, correct) {
  if (correct) return item.answer;
  let options;
  if (item.format === 'build_word') {
    const length = mockConstructionLength(item), labels = item.choices.map(choice => choice.label);
    options = labels.map((_label, start) => Array.from({ length }, (_value, index) => labels[(start + index) % labels.length]).join(''));
  } else if (Array.isArray(item.answer)) options = [[...item.answer].reverse(), [...item.answer.slice(1), item.answer[0]],
    [item.choices.find(choice => choice.id !== item.answer[0])?.id, ...item.answer.slice(1)]];
  else options = item.choices.map(choice => choice.id);
  const incorrect = options.find(value => !scoreLiteracyMockResponse(item, value));
  assert.notEqual(incorrect, undefined, `A real incorrect selected value must exist for ${item.id}.`);
  return incorrect;
}
const patterns = {
  correct: () => true,
  incorrect: () => false,
  early_slip: (_index, _item, areaIndex) => areaIndex > 0,
  late_slip: (_index, item, areaIndex) => areaIndex !== LITERACY_MOCK_AREA_MAX[item.domainId],
  reversal: index => index < 16,
  alternating: index => index % 2 === 0,
  uneven: (_index, item) => ['reading', 'listening', 'vocabulary'].includes(item.domainId),
  print_letter_limit: (_index, item, areaIndex) => item.domainId !== 'print' ? false : [1, 3].includes(areaIndex) ? null : areaIndex === 2,
  ...Object.fromEntries(Array.from({ length: 7 }, (_, hold) => [`hold_${hold}`, (_index, item) => item.adaptiveAreaBand < Math.min(hold, LITERACY_MOCK_AREA_MAX[item.domainId]) ? true : null])),
};

for (const [name, outcome] of Object.entries(patterns)) test(`V10 actual bank: five fresh same-child offline sittings, ${name}`, t => {
  let maximumAssets = 0, maximumBytes = 0, minimumLength = Infinity, maximumLength = 0;
  for (let seed = 0; seed < 3; seed++) {
    const exposures = [];
    for (let sitting = 0; sitting < 5; sitting++) {
      const context = `${name}, seed ${seed}, sitting ${sitting + 1}`;
      let offlineIds = [];
      let plan;
      assert.doesNotThrow(() => { plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: `v10-${name}-${seed}-${sitting}`, studentId: `same-child-${seed}`,
        exposures, onOfflineItems: ids => { offlineIds = ids; } }); }, context);
      const pool = bank.filter(item => offlineIds.includes(item.id));
      const paths = new Set([...pool, ...tutorials].flatMap(item => [...item.requiredAudioPaths, ...item.requiredImagePaths].map(path => path.split('#')[0])));
      paths.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.readPassage));
      paths.add(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle));
      const bytes = [...paths].reduce((sum, path) => {
        if (!byteSizes.has(path)) byteSizes.set(path, statSync(new URL(`../../public${path}`, import.meta.url)).size);
        return sum + byteSizes.get(path);
      }, 0);
      maximumAssets = Math.max(maximumAssets, paths.size); maximumBytes = Math.max(maximumBytes, bytes);
      assert.ok(paths.size <= 768, `${context}: ${paths.size} assets exceeds the bounded V10 reserve.`);
      assert.ok(bytes <= 48 * 1024 * 1024, `${context}: ${bytes} bytes exceeds the retained byte budget.`);
      const rows = [], areaCounts = {};
      while (rows.length < plan.itemIds.length) {
        const item = byId.get(plan.itemIds[rows.length]);
        const state = literacyMockBoundaryStateV9(rows, { bank: byId })[item.domainId];
        assert.equal(item.adaptiveAreaBand, state.nextBand, `${context}: canonical next demand`);
        assert.equal(state.complete, false, `${context}: stopped area must not receive a new scored question`);
        assert.equal(getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures, responses: rows })).knownFamiliar, null, `${context}: fresh target ${item.id}`);
        const areaIndex = areaCounts[item.domainId] || 0; areaCounts[item.domainId] = areaIndex + 1;
        const value = outcome(rows.length, item, areaIndex), supported = value === null;
        const selected = selectedValue(item, value !== false);
        assert.equal(scoreLiteracyMockResponse(item, selected), value !== false, `${context}: actual selected-value scoring`);
        rows.push({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
          itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: supported ? 'supported' : 'independent',
          supportUsed: supported, selected, isCorrect: value !== false });
        const prefix = plan.itemIds.slice(0, rows.length);
        assert.doesNotThrow(() => { plan = adaptLiteracyMockBoundaryPlan(pool, plan, rows, [], [], { exposures }); }, `${context}: after ${rows.length}`);
        assert.deepEqual(plan.itemIds.slice(0, rows.length), prefix);
      }
      assert.ok(rows.length <= LITERACY_MOCK_V9_MAX_ITEMS, context);
      const states = literacyMockBoundaryStateV9(rows, { bank: byId });
      assert.ok(Object.values(states).every(state => state.complete), context);
      assert.ok(states.print.lowerLetterTargets.length <= 5, `${context}: finite print target cap`);
      if (name === 'correct' || name === 'early_slip') assert.ok(Object.values(states).every(state => state.stopReason === 'ceiling_confirmed'), context);
      if (name === 'incorrect') assert.ok(Object.values(states).every(state => state.stopReason === 'floor_confirmed'), context);
      if (name === 'correct') assert.equal(rows.length, 58, context);
      if (name === 'incorrect') assert.equal(rows.length, 16, context);
      if (name === 'print_letter_limit') { assert.equal(states.print.stopReason, 'letter_limit', context); assert.equal(states.print.lowerLetterTargets.length, 5, context); }
      minimumLength = Math.min(minimumLength, rows.length); maximumLength = Math.max(maximumLength, rows.length);
      exposures.push(...rows);
    }
  }
  t.diagnostic(JSON.stringify({ pattern: name, maximumAssets, maximumBytes, minimumLength, maximumLength }));
});
