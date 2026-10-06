import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkateFixedStepper, skateMotion} from '../../src/components/learn/games/games/spellSkatePark.js';

test('native skateboard momentum and turning agree at ordinary 24/60/120 Hz frames', () => {
  function run(fps) {
    const clock=createSkateFixedStepper();
    let state={speed:0,yaw:0};
    for(let frame=0;frame<fps*5;frame++) for(const dt of clock.advance(1/fps)) {
      assert.equal(dt,1/60);
      state=skateMotion(state,{turn:.35,push:1,brake:0,active:true,boost:false,maxSpeed:24,minSpeed:-10,topSpeed:24},dt);
    }
    return state;
  }
  const expected=run(60);
  for(const fps of [24,120]) {
    const actual=run(fps);
    assert.ok(Math.abs(actual.speed-expected.speed)<1e-9);
    assert.ok(Math.abs(actual.yaw-expected.yaw)<1e-9);
  }
});
test('pause and hidden remainder cannot add an old skate step; long frames remain bounded', () => {
  const clock=createSkateFixedStepper();
  assert.equal(clock.advance(.009).length,0);clock.reset();
  assert.equal(clock.advance(.009).length,0);
  const steps=clock.advance(3);
  assert.equal(steps.length,9);
  assert.ok(steps.every(dt=>dt===1/60));
  clock.reset();assert.equal(clock.advance(NaN).length,0);
});
