import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { loadLiteracyMockBank, literacyMockTutorialIdsForVersion } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { literacyMockBoundaryStateV9, LITERACY_MOCK_V9_MAX_ITEMS } from '../../src/policy/literacyMockBoundaryV9.js';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../src/data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../src/utils/progressCheckAudio.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v9' });
const byId = new Map(bank.map(item => [item.id, item]));
const tutorials = Object.values(literacyMockTutorialIdsForVersion('literacy-mock-v9')).map(id => byId.get(id));
assert.ok(tutorials.every(Boolean), 'All required V9 tutorials must have their exact resolved media.');
const byteSizes = new Map();
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

for (const [name, outcome] of Object.entries(patterns)) test(`V9 actual bank: five fresh same-child offline sittings, ${name}`, t => {
  let maximumAssets = 0, maximumBytes = 0, minimumLength = Infinity, maximumLength = 0;
  for (let seed = 0; seed < 3; seed++) {
    const exposures = [];
    for (let sitting = 0; sitting < 5; sitting++) {
      const context = `${name}, seed ${seed}, sitting ${sitting + 1}`;
      let offlineIds = [];
      let plan;
      assert.doesNotThrow(() => { plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: `v9-${name}-${seed}-${sitting}`, studentId: `same-child-${seed}`,
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
      assert.ok(paths.size <= 768, `${context}: ${paths.size} assets exceeds the bounded V9 reserve.`);
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
        rows.push({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
          itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: supported ? 'supported' : 'independent',
          supportUsed: supported, isCorrect: value !== false });
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
