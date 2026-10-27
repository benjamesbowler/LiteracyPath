import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Object3D, Vector3 } from 'three';
import { createSoundSafariRenderMotion } from '../../src/components/learn/games/games/soundSafariRenderMotion.js';
import { createReelReadRenderMotion } from '../../src/components/learn/games/games/reelReadRenderMotion.js';
import { createSpellSkateRenderMotion } from '../../src/components/learn/games/games/spellSkateRenderMotion.js';
import { createSkateFixedStepper } from '../../src/components/learn/games/games/spellSkatePark.js';

describe('fixed-step sibling presentation', () => {
  it('Safari renders fractional net/creature positions, preserves visible contact boxes and restores physics even on draw failure', () => {
    const critter={x:0,y:10,depth:0}, state={net:{x:0,y:0,angle:0},critters:[critter]};
    const motion=createSoundSafariRenderMotion(state); motion.beforeStep();
    state.net.x=10;critter.x=20;
    motion.draw(.5,()=>{assert.equal(state.net.x, 5);assert.equal(critter.x, 10);critter.labelBox={x:10};});
    assert.equal(state.net.x, 10);assert.equal(critter.x, 20);assert.equal(critter.labelBox.x, 10);
    assert.throws(()=>motion.draw(.5,()=>{throw Error('draw');}), /draw/);assert.equal(critter.x, 20);
    const fresh={x:30,y:20,depth:1};state.critters=[fresh];motion.draw(.5,()=>assert.equal(fresh.x, 30));
    motion.reset();motion.draw(0,()=>assert.equal(state.net.x, 10));
  });
  it('Reel keeps boat, hook and fish labels at the same fraction without modifying collision state or blending new hooks', () => {
    const state={stage:0,boatPosition:0,elapsed:0,fish:[{id:1,x:0,y:0,labelX:0,labelY:2}],hook:{x:0,y:0,phase:'dropping'}};
    const motion=createReelReadRenderMotion(state);motion.beforeStep();
    state.boatPosition=1;state.elapsed=1;Object.assign(state.fish[0],{x:10,labelX:10});state.hook.x=10;
    const view=motion.sample(.5);assert.equal(view.boatPosition, .5);assert.equal(view.hook.x, 5);assert.equal(view.fish[0].labelX, 5);
    assert.equal(state.boatPosition, 1);assert.equal(state.fish[0].x, 10);assert.equal(state.hook.x, 10);
    state.hook={x:40,y:20,phase:'dropping'};assert.equal(motion.sample(0).hook.x, 40);
    state.stage=1;assert.equal(motion.sample(0), state);
  });
  it('Skate renders actor and camera together then restores the actual camera before the next simulation step', () => {
    const actor=new Object3D(), camera=new Object3D(),player={pos:new Vector3(),air:0,yaw:Math.PI-.1,surfacePitch:0,surfaceRoll:0};
    const motion=createSpellSkateRenderMotion([actor,camera],player);motion.beforeStep();
    actor.position.x=1;camera.position.x=2;player.pos.x=1;player.yaw=-Math.PI+.1;motion.afterStep();
    const view=motion.sample(.5);assert.equal(actor.position.x, .5);assert.equal(camera.position.x, 1);assert.equal(view.pos.x, .5);assert.ok(Math.abs(view.yaw-Math.PI)<1e-8);
    assert.equal(player.pos.x, 1);motion.beforeStep();assert.equal(actor.position.x, 1);assert.equal(camera.position.x, 2);
    motion.afterStep();motion.sample(0);motion.reset();assert.equal(camera.position.x, 2);
  });
  it('Skate snaps external checkpoint teleports instead of flying across the park', () => {
    const actor=new Object3D(),camera=new Object3D(),player={pos:new Vector3(),air:0,yaw:0,surfacePitch:0,surfaceRoll:0};
    const motion=createSpellSkateRenderMotion([actor,camera],player);
    motion.beforeStep();actor.position.x=1;player.pos.x=1;motion.afterStep();motion.sample(.5);
    player.pos.x=30;motion.beforeStep();actor.position.x=30;camera.position.x=31;motion.afterStep();
    const view=motion.sample(0);assert.equal(actor.position.x,30);assert.equal(camera.position.x,31);assert.equal(view.pos.x,30);
  });
  it('Skate exposes fractional render time while retaining exactly 60 authoritative updates per second at 144Hz', () => {
    const stepper=createSkateFixedStepper();let steps=0;
    for(let frame=0;frame<144;frame++){steps+=stepper.advance(1/144).length;assert.ok(stepper.alpha()>=0);assert.ok(stepper.alpha()<1);}
    assert.equal(steps, 60);stepper.reset();assert.equal(stepper.alpha(), 0);
  });
});
