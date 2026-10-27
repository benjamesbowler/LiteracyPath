import test from 'node:test';
import assert from 'node:assert/strict';
import { rallyOpponentPlan, newRallyOpponentState, stepRallyOpponent, rallyActorPose, rallyRacketRotation } from '../../src/utils/rallyPalsMotor.js';
import { consumeRallyPalsFrame, rallyShot, stepRallyShot } from '../../src/utils/rallyPalsRules.js';

test('rival cannot inspect a destination before perception and its bounded anticipation window', () => {
  const plan = rallyOpponentPlan(18, 1, 0), state = newRallyOpponentState();
  const hidden = { direction: 'far', time: 0, duration: 2.1, get to() { throw new Error('future destination inspected'); } };
  for (const time of [0, .1, .3, .7]) {
    const unseen = Object.create(hidden); unseen.time = time;
    assert.deepEqual(stepRallyOpponent(state, unseen, plan, 1 / 60), state);
  }
});

test('a perceived landing estimate is stable even if later input aims elsewhere', () => {
  const plan = rallyOpponentPlan(18, 1, 0), ball = { direction: 'far', time: 1, duration: 1.5, to: { x: 3.15 } };
  const first = stepRallyOpponent(newRallyOpponentState(), ball, plan, 1 / 60);
  const later = stepRallyOpponent(first, { ...ball, to: { x: -3.15 } }, plan, 1 / 60);
  assert.equal(later.targetX, first.targetX); assert.ok(later.targetX > 2.7); assert.equal(later.observed, true);
});

test('seeded rival styles stay bounded, reach ordinary shots and allow recoverable wide-shot misses', () => {
  const styles = new Set(); let misses = 0;
  for (let seed = 0; seed < 40; seed++) {
    const plan = rallyOpponentPlan(seed, 0, 0); styles.add(plan.style);
    assert.deepEqual(plan, rallyOpponentPlan(seed, 0, 0));
    let actor = newRallyOpponentState(-4.5), ball = rallyShot({ x: 0, z: 7.4 }, { x: 4.6, z: -7.1 });
    for (let i = 0; i < 90; i++) {
      const before = actor; actor = stepRallyOpponent(actor, ball, plan, 1 / 60); ball = stepRallyShot(ball, 1 / 60);
      assert.ok(Math.abs(actor.x - before.x) <= plan.maxSpeed / 60 + 1e-9);
      assert.ok(Math.abs(actor.velocity) <= plan.maxSpeed + 1e-9);
      assert.ok(Math.abs(actor.velocity - before.velocity) <= plan.acceleration / 60 + 1e-9);
      assert.ok(actor.x >= -4.8 && actor.x <= 4.8);
    }
    if (Math.abs(actor.x - ball.to.x) > 1.8) misses++;
    actor = newRallyOpponentState(); ball = rallyShot({ x: 0, z: 7.4 }, { x: 3.15, z: -7.1 });
    for (let i = 0; i < 90; i++) { actor = stepRallyOpponent(actor, ball, plan, 1 / 60); ball = stepRallyShot(ball, 1 / 60); }
    assert.ok(Math.abs(actor.x - ball.to.x) < 1.8, `ordinary shot remains returnable for seed ${seed}`);
  }
  assert.equal(styles.size, 2); assert.ok(misses > 0);
});

test('rival follows the same fixed steps at 30, 60 and 120 render frames per second and pause is inert', () => {
  const plan = rallyOpponentPlan(20, 1, 3);
  const outcomes = [30, 60, 120].map(fps => {
    let remainder = 0, actor = newRallyOpponentState(), ball = rallyShot({ x: 0, z: 7.4 }, { x: -3.15, z: -7.1 });
    for (let i = 0; i < fps; i++) {
      const frame = consumeRallyPalsFrame(remainder, 1 / fps); remainder = frame.remainder;
      for (let step = 0; step < frame.steps; step++) { actor = stepRallyOpponent(actor, ball, plan, 1 / 60); ball = stepRallyShot(ball, 1 / 60); }
    }
    assert.deepEqual(stepRallyOpponent(actor, ball, plan, 0), actor); return actor;
  });
  assert.deepEqual(outcomes[0], outcomes[1]); assert.deepEqual(outcomes[1], outcomes[2]);
});

test('preparation, immediate contact and recovery use the existing racket socket phase', () => {
  const preparing = rallyActorPose({ near: true, ball: { direction: 'near', z: 6 } });
  assert.equal(preparing.stage, 'prepare'); assert.equal(preparing.action, 'forehand');
  const contact = rallyActorPose({ near: true, swing: 10 / 3 });
  assert.equal(contact.stage, 'strike'); assert.ok(Math.abs(contact.phase - 1 / 3) < 1e-9);
  assert.equal(rallyRacketRotation(10 / 3, true, contact), -.3 + Math.sin(2) * .8);
  assert.equal(rallyActorPose({ near: false, swing: .8 }).stage, 'recover');
  assert.equal(rallyActorPose({ near: false, opponentPhase: 'prepare' }).stage, 'prepare');
});
