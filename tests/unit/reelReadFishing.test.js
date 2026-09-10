import test from 'node:test';
import assert from 'node:assert/strict';
import { createFishingFight, stepFishingFight, fishingPondForEncounter, fishingFrameSteps } from '../../src/utils/reelReadFishing.js';

test('reeling against three physical current profiles gives a sustained active catch', () => {
  for (const encounter of [0, 4, 9]) {
    let state = createFishingFight({ encounter, depth: .5 });
    let reeling = true;
    for (let frame = 0; frame < 1200 && !state.landed && !state.escaped; frame++) {
      if (state.tension > .76) reeling = false;
      if (state.tension < .42) reeling = true;
      state = stepFishingFight(state, { reeling });
    }
    assert.ok(state.landed, `encounter ${encounter} remains landable`);
    assert.ok(state.elapsed >= 6 && state.elapsed <= 11, `${encounter}: ${state.elapsed}s`);
    assert.ok(state.remaining <= .75);
  }
});

test('holding through deep-water pulls can lose the line; easing releases tension', () => {
  let held = createFishingFight({ encounter: 9, depth: 1 });
  for (let frame = 0; frame < 1200 && !held.escaped && !held.landed; frame++) held = stepFishingFight(held, { reeling: true });
  assert.ok(held.escaped);
  assert.equal(held.landed, false);
  const eased = stepFishingFight({ ...held, escaped: false, strain: 0, tension: .8 }, { reeling: false }, .05);
  assert.ok(eased.tension < .8);
  assert.equal('mistakes' in eased, false);
  assert.equal('score' in eased, false);
});

test('line physics stays frozen with zero elapsed time and cannot auto-land without reeling', () => {
  const first = createFishingFight({ encounter: 4, seed: 7 });
  assert.deepEqual(stepFishingFight(first, { reeling: true }, 0), first);
  let state = first;
  for (let frame = 0; frame < 1800; frame++) state = stepFishingFight(state, { reeling: false });
  assert.equal(state.landed, false);
  assert.ok(state.remaining >= first.remaining);
  assert.equal(fishingPondForEncounter(0).id, 'shallows');
  assert.equal(fishingPondForEncounter(5).id, 'channel');
  assert.equal(fishingPondForEncounter(9).id, 'deep');
});


test('all pond phases remain recoverable by easing, and terminal fights cannot change', () => {
  for (const encounter of [0, 4, 9]) for (const depth of [0, .5, 1]) for (let seed = 0; seed < 11; seed++) {
    let state = createFishingFight({ encounter, depth, seed });
    let reeling = true;
    for (let frame = 0; frame < 900 && !state.landed && !state.escaped; frame++) {
      if (state.tension > .76) reeling = false;
      if (state.tension < .42) reeling = true;
      state = stepFishingFight(state, { reeling });
    }
    assert.ok(state.landed, `${encounter}/${depth}/${seed}`);
    assert.ok(state.elapsed > 5 && state.elapsed < 11);
    assert.equal(stepFishingFight(state, { reeling: true }), state);
  }
});


test('slow rendering catches up through bounded collision steps instead of slowing the game', () => {
  const steps = fishingFrameSteps(.1);
  assert.equal(steps.reduce((sum, dt) => sum + dt, 0), .1);
  assert.ok(steps.every(dt => dt <= .025));
  assert.equal(fishingFrameSteps(10).reduce((sum, dt) => sum + dt, 0), .12);
  assert.deepEqual(fishingFrameSteps(0), []);
  let regular = createFishingFight({ encounter: 4 });
  let slow = regular;
  for (let i = 0; i < 120; i++) regular = stepFishingFight(regular, { reeling: true }, 1 / 60);
  for (let i = 0; i < 20; i++) for (const dt of fishingFrameSteps(.1)) slow = stepFishingFight(slow, { reeling: true }, dt);
  assert.ok(Math.abs(regular.elapsed - slow.elapsed) < .00001);
  assert.ok(Math.abs(regular.remaining - slow.remaining) < .04);
});
