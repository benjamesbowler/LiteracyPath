import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';

test('every expandable task, level and access pool has ten mutually fresh authored examples', async () => {
  const bank = (await loadLiteracyMockBank({ includeUnavailable: true })).filter(item => !item.tutorialOnly);
  const pools = Map.groupBy(bank, item => JSON.stringify([literacyMockTaskKey(item), item.level]));
  const dimensions = ['itemId', 'passageKey', 'familyId', 'stimulusKey'];
  assert.ok(pools.size > 0);
  for (const [key, items] of pools) {
    const identities = items.map(item => ({ ...canonicalLiteracyIdentity(item), stimulusKey: item.stimulusKey || item.id }));
    const seen = Object.fromEntries(dimensions.map(dimension => [dimension, new Set()]));
    let witness = 0;
    for (const identity of identities) {
      if (dimensions.some(dimension => identity[dimension] && seen[dimension].has(identity[dimension]))) continue;
      witness++;
      for (const dimension of dimensions) if (identity[dimension]) seen[dimension].add(identity[dimension]);
    }
    // Validate finite inventories even when an identity regression might make
    // cosmetic wrappers appear to supply ten examples.
    const policy = items.find(item => item.finiteInventory)?.finiteInventory;
    if (policy) {
      assert.ok(policy.policyId && Number.isInteger(policy.maximumIndependentTargets)
        && policy.maximumIndependentTargets > 0, `${key}: invalid finite inventory`);
      assert.ok(items.every(item => item.finiteInventory?.policyId === policy.policyId
        && item.finiteInventory.maximumIndependentTargets === policy.maximumIndependentTargets), `${key}: mixed inventory policies`);
      const upperBound = Math.min(...dimensions.map(dimension =>
        new Set(identities.filter(identity => identity[dimension]).map(identity => identity[dimension])).size
        + identities.filter(identity => !identity[dimension]).length));
      assert.equal(witness, upperBound, `${key}: finite capacity needs an exact independence proof`);
      assert.ok(witness <= policy.maximumIndependentTargets, `${key}: finite wrappers exceed their real target inventory`);
    }
    if (witness >= 10) continue;
    // Short pools must be explicitly finite; an expandable inventory cannot
    // excuse missing examples under the same task and access conditions.
    assert.ok(policy?.policyId, `${key}: only ${witness} mutually fresh examples`);
    assert.ok(policy.maximumIndependentTargets < 10, `${key}: an expandable inventory cannot excuse a short pool`);
  }
});
