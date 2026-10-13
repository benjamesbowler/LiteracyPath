import test from 'node:test';
import assert from 'node:assert/strict';
import { createTowerTumbleInput, createTowerTumbleMotor, TOWER_JUMP_BUFFER_SECONDS, TOWER_LEDGE_GRACE_SECONDS } from '../../src/utils/towerTumbleMotor.js';

const dt = 1 / 60;
const floor = { platforms: [{ x: 0, y: 0, width: 17 }], ladders: [] };
const standing = () => ({ x: 0, y: 0, vy: 0, grounded: true, safe: { x: 0, y: 0 } });

test('releasing a pointer, key alias or accessibility nudge preserves every other held owner', () => {
  const input = createTowerTumbleInput();
  input.set('right', true, 'key:ArrowRight');
  input.set('right', true, 'key:KeyD');
  input.set('right', true, 'pointer:7');
  input.set('right', false, 'pointer:7');
  assert.equal(input.snapshot().right, true);
  input.set('right', false, 'key:ArrowRight');
  assert.equal(input.snapshot().right, true);
  input.set('left', true, 'nudge');
  input.releaseSource('nudge');
  assert.deepEqual(input.snapshot(), { left: false, right: true, up: false, down: false });
  input.set('right', false, 'key:KeyD');
  assert.equal(input.snapshot().right, false);
  input.set('up', true, 'pointer:8');
  input.clear();
  assert.deepEqual(input.snapshot(), { left: false, right: false, up: false, down: false });
});

test('a committed short tap survives release and produces exactly one jump event', () => {
  const motor = createTowerTumbleMotor(), before = standing();
  motor.requestJump();
  let { actor, jumped } = motor.step(before, {}, floor, dt);
  assert.equal(jumped, true);
  assert.ok(actor.y > 0);
  assert.deepEqual(before, standing(), 'the caller owns its actor');
  let jumps = 1;
  for (let index = 0; index < 90; index++) {
    const result = motor.step(actor, {}, floor, dt);
    actor = result.actor; jumps += Number(result.jumped);
  }
  assert.equal(jumps, 1);
  assert.equal(actor.y, 0);
  assert.equal(actor.grounded, true);
  assert.equal('jumpBuffer' in actor, false, 'intent never enters the saved actor');
  assert.equal('ledgeGrace' in actor, false);
});

test('a tap just before touchdown waits for landing then launches without another press', () => {
  const motor = createTowerTumbleMotor();
  motor.requestJump();
  const landing = motor.step({ ...standing(), y: .015, vy: -1, grounded: false }, {}, floor, dt);
  assert.equal(landing.jumped, false);
  assert.equal(landing.actor.y, 0);
  assert.ok(motor.inspect().jumpBuffer > 0);
  const takeoff = motor.step(landing.actor, {}, floor, dt);
  assert.equal(takeoff.jumped, true);
  assert.ok(takeoff.actor.y > 0);
  assert.equal(motor.inspect().jumpBuffer, 0);
});

test('an early airborne tap expires and never becomes an unwanted later jump', () => {
  const motor = createTowerTumbleMotor();
  motor.requestJump();
  let actor = { ...standing(), y: 2, vy: 0, grounded: false }, jumps = 0;
  for (let index = 0; index < 90; index++) {
    const next = motor.step(actor, {}, floor, dt);
    actor = next.actor; jumps += Number(next.jumped);
  }
  assert.equal(jumps, 0);
  assert.equal(actor.grounded, true);
  assert.ok(TOWER_JUMP_BUFFER_SECONDS < .2);
});

test('walking off a ledge allows a brief late jump without changing horizontal movement', () => {
  const motor = createTowerTumbleMotor();
  const ledge = { platforms: [{ x: 0, y: 1, width: 2 }], ladders: [] };
  const walked = motor.step({ ...standing(), x: .99, y: 1, safe: { x: 0, y: 1 } }, { right: true }, ledge, dt);
  assert.equal(walked.actor.grounded, false);
  assert.equal(walked.actor.x, .99 + 5.2 * dt);
  motor.requestJump();
  const late = motor.step(walked.actor, { right: true }, ledge, dt);
  assert.equal(late.jumped, true);
  assert.ok(late.actor.vy > 0);
  assert.equal(motor.inspect().ledgeGrace, 0);
  motor.requestJump();
  assert.equal(motor.step(late.actor, {}, ledge, dt).jumped, false, 'grace cannot create a double jump');
});

test('ledge grace expires and an airborne reload receives no invented ground contact', () => {
  const motor = createTowerTumbleMotor(), empty = { platforms: [], ladders: [] };
  let actor = motor.step({ ...standing(), y: 1 }, {}, empty, dt).actor;
  for (let i = 0; i < Math.ceil(TOWER_LEDGE_GRACE_SECONDS / dt) + 1; i++) actor = motor.step(actor, {}, empty, dt).actor;
  motor.requestJump();
  assert.equal(motor.step(actor, {}, empty, dt).jumped, false);
  const restored = createTowerTumbleMotor();
  restored.requestJump();
  assert.equal(restored.step({ ...standing(), y: 1, grounded: false }, {}, floor, dt).jumped, false);
});

test('pause, blur and route reset can discard both buffered input and ground grace', () => {
  const motor = createTowerTumbleMotor();
  motor.step(standing(), {}, floor, dt);
  motor.requestJump();
  motor.clear();
  assert.deepEqual(motor.inspect(), { jumpBuffer: 0, ledgeGrace: 0 });
  assert.equal(motor.step(standing(), {}, floor, dt).jumped, false);
});

test('ladder priority and a safe fall never emit false jump feedback', () => {
  const motor = createTowerTumbleMotor();
  motor.requestJump();
  const climbing = motor.step(standing(), { up: true }, { ...floor, ladders: [{ x: 0, bottom: 0, top: 3 }] }, dt);
  assert.equal(climbing.jumped, false);
  assert.equal(climbing.actor.climbing, true);
  motor.clear(); motor.requestJump();
  const fallen = motor.step({ ...standing(), y: -1.99, vy: -12, grounded: false }, {}, floor, dt);
  assert.equal(fallen.jumped, false);
  assert.equal(fallen.actor.fell, true);
  assert.equal(motor.inspect().jumpBuffer, 0);
});

test('the existing auto-route jump request uses the same accepted impulse event', () => {
  const motor = createTowerTumbleMotor();
  const result = motor.step(standing(), { jump: true }, floor, dt);
  assert.equal(result.jumped, true);
  assert.ok(result.actor.y > 0);
});
