import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketFlightPose } from '../../src/utils/rocketRunFlightPose.js';

test('motor steering, boost, actual contact and life recovery select different registered actions', () => {
  const pose = createRocketFlightPose();
  assert.equal(pose.update(.05, { velocity: -3 }).clip, 'bank_left');
  assert.equal(pose.update(.05, { velocity: 3 }).clip, 'bank_right');
  assert.equal(pose.update(.05, { velocity: 0 }, { boost: true }).clip, 'boost');
  pose.event('wrong-onset'); assert.equal(pose.update(.12, { velocity: -3 }, { boost: true }).clip, 'catch');
  pose.event('meteor-hit'); const recovery = pose.update(.12, { velocity: 3 });
  assert.equal(recovery.clip, 'shield_recover'); assert.ok(recovery.phase > 0 && recovery.phase < 1);
  for (let frame = 0; frame < 13; frame++) pose.update(.12, { velocity: 0 });
  assert.equal(pose.update(.05, { velocity: -3 }).clip, 'bank_left');
  pose.event('round-complete'); assert.equal(pose.update(.12, { velocity: 3 }, { completed: true }).clip, 'celebrate');
});

test('reduced motion removes optional banking while actual receiver and recovery actions remain', () => {
  const pose = createRocketFlightPose();
  assert.equal(pose.update(.1, { velocity: -9 }, { reducedMotion: true }).clip, 'cruise');
  pose.event('accepted-word'); assert.equal(pose.update(.1, { velocity: 9 }, { reducedMotion: true }).clip, 'catch');
  const observed = pose.inspect(); observed.age = 999;
  assert.notEqual(pose.inspect().age, 999);
});

test('the final genuine receiver catch finishes before celebration without altering the language result', () => {
  const pose = createRocketFlightPose();
  pose.event('accepted-word'); pose.event('round-complete');
  assert.equal(pose.update(.12, { velocity: 0 }, { completed: true }).clip, 'catch');
  for (let index = 0; index < 6; index++) assert.equal(pose.update(.12, { velocity: 0 }, { completed: true }).clip, 'catch');
  pose.update(.12, { velocity: 0 }, { completed: true });
  assert.equal(pose.update(.12, { velocity: 0 }, { completed: true }).clip, 'celebrate');
  assert.equal(pose.inspect().celebratePending, false);
});
