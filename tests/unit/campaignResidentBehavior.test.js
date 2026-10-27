import test from 'node:test';
import assert from 'node:assert/strict';
import { stepCampaignResident } from '../../src/features/soundSeekers/rounded/campaignResidentBehavior.js';

const scene = { home: { x: 0, z: 0 }, work: { x: 4, z: -6 }, player: { x: -3, z: 1 } };
const angularDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

test('loading restored receipts settles without replaying a reward; a new repair celebrates once', () => {
  let state = stepCampaignResident(null, { ...scene, completedCount: 3, dt: 1 / 60 });
  assert.equal(state.celebration, 0);
  state = stepCampaignResident(state, { ...scene, completedCount: 4, dt: 1 / 60 });
  assert.equal(state.mode, 'celebrate');
  for (let frame = 0; frame < 120; frame++) state = stepCampaignResident(state, { ...scene, completedCount: 4, dt: 1 / 60 });
  assert.equal(state.celebration, 0);
  assert.equal(state.mode, 'greet');
  assert.equal(stepCampaignResident(state, { ...scene, completedCount: 2 }).celebration, 0);
  const title = stepCampaignResident(null, { ...scene, active: false });
  const restored = stepCampaignResident(title, { ...scene, completedCount: 5, active: false });
  assert.equal(stepCampaignResident(restored, { ...scene, completedCount: 5 }).celebration, 0);
});

test('attention turns at a bounded rate and settles equivalently at 30, 60 and 120 Hz', () => {
  const results = [30, 60, 120].map(hz => {
    let state;
    for (let frame = 0; frame < hz * 2; frame++) {
      const oldHeading = state?.heading ?? .4;
      state = stepCampaignResident(state, { ...scene, dt: 1 / hz });
      assert.ok(angularDistance(state.heading, oldHeading) <= 2.2 / hz + 1e-9);
    }
    return state;
  });
  results.slice(1).forEach(state => assert.ok(angularDistance(state.heading, results[0].heading) < 1e-9));
  assert.equal(results[0].mode, 'greet');
});

test('pause freezes the complete pose and finite celebration; reduced motion settles without animation', () => {
  let state = stepCampaignResident(null, { ...scene });
  state = stepCampaignResident(state, { ...scene, completedCount: 1 });
  assert.equal(stepCampaignResident(state, { ...scene, completedCount: 2, active: false, dt: 10 }), state);
  const reduced = stepCampaignResident(state, { ...scene, completedCount: 1, reduced: true, dt: 10 });
  assert.equal(reduced.celebration, 0);
  assert.ok(angularDistance(reduced.heading, Math.atan2(-3, 1)) < 1e-9);
  assert.equal(stepCampaignResident(state, { ...scene, completedCount: 1, dt: NaN }).heading, state.heading);
});

test('a resident attends its work when the explorer leaves, without following or blocking the explorer', () => {
  const state = stepCampaignResident(null, { ...scene, player: { x: 20, z: 20 }, reduced: true });
  assert.equal(state.mode, 'attend');
  assert.ok(angularDistance(state.heading, Math.atan2(4, -6)) < 1e-9);
  assert.equal('position' in state, false);
  assert.equal('reward' in state, false);
  assert.deepEqual(scene.home, { x: 0, z: 0 });
});
