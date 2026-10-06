import test from 'node:test';
import assert from 'node:assert/strict';
import {createSentenceGroveStepper} from '../../src/components/learn/games/games/starGalleryStepper.js';

test('Grove native acceleration, steering and hazard trajectory are identical at30/60/120 rendered frames',()=>{
  const run=rate=>{const state={x:0,z:0,speed:0,yaw:Math.PI,hits:0};const stepper=createSentenceGroveStepper(dt=>{
    state.speed=Math.min(15.5,state.speed+17*dt);state.yaw+=.35*dt;
    state.x+=Math.sin(state.yaw)*state.speed*dt;state.z+=Math.cos(state.yaw)*state.speed*dt;
    if(state.z< -5&&state.hits===0){state.hits++;state.speed*=.54;}
  });for(let frame=0;frame<rate*2;frame++)stepper.advance(1/rate);return {state,totalSteps:stepper.inspect().totalSteps};};
  assert.deepEqual(run(30),run(60));assert.deepEqual(run(120),run(60));assert.equal(run(60).state.hits,1);
});
test('Grove bounds a long stall, preserves substep leftovers, and discards hidden/paused time before resume',()=>{
  let steps=0,active=true;const owner=createSentenceGroveStepper(()=>steps++);
  assert.equal(owner.advance(2),12);assert.equal(steps,12);assert.equal(owner.inspect().remainder,0);
  owner.advance(1/120);assert.equal(owner.inspect().remainder,1/120);active=false;owner.advance(10,()=>active);assert.equal(owner.inspect().remainder,0);
  active=true;owner.advance(1/120,()=>active);assert.equal(steps,12);owner.reset();assert.equal(owner.inspect().remainder,0);
});
