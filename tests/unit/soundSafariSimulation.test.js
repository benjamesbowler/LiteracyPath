import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceSoundSafariWorld, createSoundSafariStepper, releaseSoundSafariNetInput } from '../../src/components/learn/games/games/soundSafariSimulation.js';
function fixture() {
  return { time: 0, pulse: .8, judgementT: .72, coachT: 1, countdown: .3, wordClearT: 0, pendingAdvance: false,
    net: { x: 80, y: 230, targetX: 590, targetY: 100, angle: 0, swingT: .22 }, bursts: [{ t: 0, life: .62 }],
    critters: ['drift', 'orbit', 'zigzag', 'peek'].map((moveStyle, index) => ({ moveStyle, x: 220 + index * 80, y: 170,
      homeX: 220 + index * 80, homeY: 170, travelX: 35, travelY: 18, orbitX: 25, orbitY: 10,
      vx: 80, vy: 12, phase: index * .3, speedScale: 1.2, scareT: index ? 0 : .3, spawnT: .2 })) };
}
test('Safari real net response, critter orbit/zigzag/peek and bounce are cadence invariant at30/60/120fps', () => {
  const final = [];
  for (const fps of [30, 60, 120]) {
    const state = fixture(), stepper = createSoundSafariStepper(state, dt => advanceSoundSafariWorld(state, dt, { height: 600 }));
    for (let frame = 0; frame < fps; frame++) stepper.advance(1 / fps);
    final.push(state); assert.equal(stepper.inspect().steps, 60);
    assert.ok(state.net.x > 589); assert.equal(state.net.swingT, 0); assert.deepEqual(state.bursts, []);
    for (const critter of state.critters) {
      assert.ok(Math.abs(critter.x - critter.homeX) <= critter.travelX);
      assert.ok(Math.abs(critter.y - critter.homeY) <= critter.travelY);
    }
    assert.equal(state.correct, undefined); // Motor integration has no award field.
  }
  assert.deepEqual(final[0], final[1]); assert.deepEqual(final[1], final[2]);
});
test('Safari pause/hidden ownership drops remainder; stalled frames have bounded steps and result readiness never fabricates progression', () => {
  const state = fixture(); state.pendingAdvance = true; state.wordClearT = .05;
  let ready = 0;
  const stepper = createSoundSafariStepper(state, dt => advanceSoundSafariWorld(state, dt, { height: 600 }), () => ready++);
  stepper.advance(.01); state.paused = true;
  assert.equal(stepper.advance(10), 0); assert.equal(state.time, 0); assert.equal(stepper.inspect().remainder, 0);
  state.paused = false;
  assert.equal(stepper.advance(10), 12); assert.ok(ready > 0);
  assert.equal(state.pendingAdvance, true); assert.equal(state.stage, undefined);
  state.ended = true; assert.equal(stepper.advance(.2), 0);
  stepper.reset(); assert.equal(stepper.inspect().remainder, 0);
});

test('cancelled net intent stops at the current physical rim without a catch or a stale target, and fresh intent still moves it', () => {
  const state = fixture();
  state.learning = { firstResponses: [], assistedRetries: [], completions: [] };
  const before = structuredClone(state.learning);
  advanceSoundSafariWorld(state, 1 / 60, { height: 600 });
  const current = { x: state.net.x, y: state.net.y };
  assert.equal(releaseSoundSafariNetInput(state), true);
  for (let step = 0; step < 30; step++) advanceSoundSafariWorld(state, 1 / 60, { height: 600 });
  assert.deepEqual({ x: state.net.x, y: state.net.y }, current);
  assert.deepEqual(state.learning, before);
  state.net.targetX += 48;
  advanceSoundSafariWorld(state, 1 / 60, { height: 600 });
  assert.ok(state.net.x > current.x);
  assert.equal(releaseSoundSafariNetInput({ net: { x: NaN, y: 10 } }), false);
});
